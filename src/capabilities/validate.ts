import { CAPABILITY_PROFILES } from './profiles.js';
import type {
  CapabilityIssue,
  CapabilityRequirement,
  CapabilityValidationReport,
  HostCapability,
  RuntimeTarget,
} from './types.js';

function uniqueCapabilities(requirements: readonly CapabilityRequirement[]): HostCapability[] {
  return [...new Set(requirements.map((requirement) => requirement.capability))].sort();
}

export function validateCapabilitiesForTarget(
  requirements: readonly CapabilityRequirement[],
  target: RuntimeTarget
): CapabilityValidationReport {
  const requiredUnique = uniqueCapabilities(requirements);

  if (target === 'agnostic') {
    return {
      target,
      required: [...requirements],
      requiredUnique,
      issues: [],
      ok: true,
    };
  }

  const profile = CAPABILITY_PROFILES[target];
  const issues: CapabilityIssue[] = [];

  for (const capability of requiredUnique) {
    if (!profile.supported.has(capability)) {
      issues.push({
        capability,
        severity: 'error',
        target,
        message: `${capability} is not supported on ${target}.`,
      });
      continue;
    }

    if (target === 'workers' && capability === 'fs.local') {
      issues.push({
        capability,
        severity: 'warning',
        target,
        message:
          'fs.local on workers is isolate-local/ephemeral and not durable across restarts.',
      });
    }
  }

  return {
    target,
    required: [...requirements],
    requiredUnique,
    issues,
    ok: !issues.some((issue) => issue.severity === 'error'),
  };
}
