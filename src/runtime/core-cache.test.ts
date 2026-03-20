import { describe, expect, test } from 'bun:test';
import { BettyCompiler } from '../betty/compiler.js';
import { QDoc } from '../crdt/index.js';
import { GnosisCoreCache } from './core-cache.js';

describe('GnosisCoreCache', () => {
  const compiler = new BettyCompiler();

  test('records corridor state in a Quantum CRDT document', async () => {
    const doc = new QDoc({ guid: 'runtime-cache-doc' });
    const cache = new GnosisCoreCache(doc);
    const { ast } = compiler.parse('(a:Step)-[:PROCESS]->(b:Step)');
    const session = await cache.createSession(ast!, 'seed');

    const lookup = cache.lookup(session);
    expect(lookup.kind).toBe('miss');

    cache.commit(
      session,
      { ok: true, value: 'seed -> done' },
      {
        collapseCount: 1,
        firstSufficientCount: 1,
        ventCount: 0,
        repairDebt: 0,
        lastWinnerPath: 'b',
      }
    );

    const corridor = cache.getCorridor(session.corridorKey);
    const entry = cache.getEntry(session.requestKey);

    expect(corridor?.status).toBe('cached');
    expect(corridor?.collapseCount).toBe(1);
    expect(corridor?.firstSufficientCount).toBe(1);
    expect(entry?.status).toBe('cached');
    expect(entry?.winnerPath).toBe('b');
    expect(cache.document.toGG()).toContain('runtime_corridors');
    expect(cache.getEvents().map((event) => event.type)).toEqual([
      'submit',
      'settle',
    ]);
  });
});
