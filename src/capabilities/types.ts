export type RuntimeTarget = 'agnostic' | 'workers' | 'node' | 'bun' | 'gnode';

export type HostCapability =
  | 'net.tcp.client'
  | 'net.tcp.server'
  | 'net.udp'
  | 'fs.local'
  | 'fs.durable'
  | 'auth.ucan'
  | 'auth.zk'
  | 'auth.custodial';

export interface CapabilityRequirement {
  capability: HostCapability;
  nodeId: string;
  reason: string;
  source: 'declaration' | 'inference';
  label?: string;
}

export interface CapabilityIssue {
  capability: HostCapability;
  severity: 'error' | 'warning';
  message: string;
  target: RuntimeTarget;
  nodeId?: string;
}

export interface CapabilityProfile {
  target: RuntimeTarget;
  supported: ReadonlySet<HostCapability>;
  description: string;
}

export interface CapabilityValidationReport {
  target: RuntimeTarget;
  required: CapabilityRequirement[];
  requiredUnique: HostCapability[];
  issues: CapabilityIssue[];
  ok: boolean;
}
