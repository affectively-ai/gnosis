import { describe, expect, it } from 'bun:test';
import { authorizeTopologyEdge } from './core.js';

describe('authorizeTopologyEdge', () => {
  it('allows edge when matching capability exists', () => {
    const result = authorizeTopologyEdge({
      edgeType: 'VENT',
      sourceId: 'branch-a',
      targetIds: ['sink'],
      auth: {
        enforce: true,
        capabilities: [
          {
            can: 'aeon/vent',
            with: 'aeon://edge/vent/branch-a->*',
          },
        ],
      },
    });

    expect(result.allowed).toBe(true);
  });

  it('denies edge when capability is missing', () => {
    const result = authorizeTopologyEdge({
      edgeType: 'FORK',
      sourceId: 'root',
      targetIds: ['child-a', 'child-b'],
      auth: {
        enforce: true,
        capabilities: [
          {
            can: 'aeon/race',
            with: '*',
          },
        ],
      },
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Missing capability');
  });

  it('is permissive when enforcement is disabled', () => {
    const result = authorizeTopologyEdge({
      edgeType: 'FORK',
      sourceId: 'root',
      targetIds: ['child-a'],
      auth: {
        enforce: false,
        capabilities: [],
      },
    });

    expect(result.allowed).toBe(true);
  });
});
