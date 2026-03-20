import { describe, expect, test } from 'bun:test';
import { QDoc } from './qdoc.js';
import { QCorridor } from './qcorridor.js';

describe('QCorridor', () => {
  test('acts as a primitive for tunneling, settling, and path ranking', async () => {
    const doc = new QDoc({ guid: 'qcorridor-doc' });
    const corridor = new QCorridor(doc, { namespace: 'primitive' });
    const session = await corridor.createSession(
      'topology:shared-middle',
      {
        payload: 'seed',
      },
      {
        corridorKey: 'shared-middle',
        reuseScope: 'corridor',
      }
    );

    const firstLookup = corridor.lookup(session);
    expect(firstLookup.kind).toBe('miss');

    const inflight = Promise.resolve({ ok: true, value: 'seed -> settled' });
    corridor.registerInflight(session, inflight);
    const secondLookup = corridor.lookup<{ ok: boolean; value: string }>(
      session
    );
    expect(secondLookup.kind).toBe('tunnel');
    expect(secondLookup.kind === 'tunnel').toBe(true);

    await inflight;
    corridor.release(session);
    corridor.settle(
      session,
      { ok: true, value: 'seed -> settled' },
      {
        collapseCount: 1,
        firstSufficientCount: 1,
        ventCount: 1,
        repairDebt: 0,
        lastWinnerPath: 'fast',
      }
    );
    corridor.recordEvidence(session, [
      {
        path: 'fast',
        role: 'winner',
        status: 'success',
      },
      {
        path: 'slow',
        role: 'vent',
        status: 'cancelled',
      },
    ]);

    const hitLookup = corridor.lookup(session);
    expect(hitLookup.kind).toBe('hit');
    expect(corridor.rankPaths('shared-middle', ['slow', 'fast'])).toEqual([
      'fast',
      'slow',
    ]);
    expect(corridor.getCorridorStrength('shared-middle')).toBeGreaterThan(0);
    expect(corridor.getEvidence()).toHaveLength(2);
    expect(doc.toGG()).toContain('primitive_corridors');
  });
});
