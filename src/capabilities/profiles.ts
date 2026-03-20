import type {
  CapabilityProfile,
  HostCapability,
  RuntimeTarget,
} from './types.js';

const NODE_CAPABILITIES: HostCapability[] = [
  'net.tcp.client',
  'net.tcp.server',
  'net.udp',
  'fs.local',
  'fs.durable',
  'auth.ucan',
  'auth.zk',
  'auth.custodial',
];

const WORKERS_CAPABILITIES: HostCapability[] = [
  'net.tcp.client',
  'fs.local',
  'auth.ucan',
  'auth.zk',
  'auth.custodial',
];

export const CAPABILITY_PROFILES: Record<
  Exclude<RuntimeTarget, 'agnostic'>,
  CapabilityProfile
> = {
  node: {
    target: 'node',
    supported: new Set(NODE_CAPABILITIES),
    description:
      'Node.js host with TCP server/client, UDP, and durable local file access.',
  },
  gnode: {
    target: 'gnode',
    supported: new Set(NODE_CAPABILITIES),
    description:
      'gnode host with Node-compatible networking, local file access, and topology compilation.',
  },
  workers: {
    target: 'workers',
    supported: new Set(WORKERS_CAPABILITIES),
    description:
      'Cloudflare Workers host with outbound TCP client support only (no TCP server, no UDP, no durable local disk).',
  },
};
