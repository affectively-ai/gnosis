import { describe, expect, it } from 'bun:test';
import {
  inferCapabilitiesFromGgSource,
  validateCapabilitiesForTarget,
} from './index.js';

describe('capability inference', () => {
  it('infers transport and auth capabilities from GG source', () => {
    const source = `
      (gateway: TcpServer { transport: 'tcp', mode: 'server' })
      (relay: Socket { transport: 'udp' })
      (auth: UCANVerify)
      (gateway)-[:PROCESS]->(relay)
      (relay)-[:PROCESS]->(auth)
    `;

    const requirements = inferCapabilitiesFromGgSource(source);
    const caps = requirements.map((requirement) => requirement.capability);

    expect(caps).toContain('net.tcp.server');
    expect(caps).toContain('net.udp');
    expect(caps).toContain('auth.ucan');
  });

  it('rejects workers-incompatible network capabilities', () => {
    const source = `
      (n1: TcpServer { transport: 'tcp', mode: 'server' })
      (n2: UdpSocket { transport: 'udp' })
      (n1)-[:PROCESS]->(n2)
    `;

    const requirements = inferCapabilitiesFromGgSource(source);
    const report = validateCapabilitiesForTarget(requirements, 'workers');

    expect(report.ok).toBe(false);
    expect(report.issues.some((issue) => issue.capability === 'net.tcp.server')).toBe(true);
    expect(report.issues.some((issue) => issue.capability === 'net.udp')).toBe(true);
  });
});
