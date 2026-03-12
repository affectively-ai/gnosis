import type { GnosisRegistry } from '../runtime/registry.js';
import {
  checkGrantedCapability,
  delegateGranularUcan,
  generateUcanIdentity,
  type GnosisCapability,
  type GnosisEncryptedPayload,
  type GnosisIdentity,
  isAllowedCustodialAction,
  issueGranularUcan,
  verifyGranularUcan,
  zkDecryptUtf8,
  zkEncryptUtf8,
} from './core.js';

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return fallback;
}

function parseCapabilities(value: unknown): GnosisCapability[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const capabilities: GnosisCapability[] = [];
  for (const entry of value) {
    const record = asRecord(entry);
    const can = record.can;
    const withValue = record.with;
    if (typeof can !== 'string' || typeof withValue !== 'string') {
      continue;
    }

    const capability: GnosisCapability = {
      can,
      with: withValue,
    };

    if (
      typeof record.constraints === 'object' &&
      record.constraints !== null &&
      !Array.isArray(record.constraints)
    ) {
      capability.constraints = record.constraints as Record<string, unknown>;
    }

    capabilities.push(capability);
  }

  return capabilities;
}

function parseCapabilitiesFromProps(
  props: Record<string, string>
): GnosisCapability[] {
  const raw = props.capabilities;
  if (!raw) {
    if (props.can && props.with) {
      return [{ can: props.can, with: props.with }];
    }
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return parseCapabilities(parsed);
  } catch {
    if (props.can && props.with) {
      return [{ can: props.can, with: props.with }];
    }
    return [];
  }
}

function parseRequiredCapability(
  payload: Record<string, unknown>,
  props: Record<string, string>
): GnosisCapability | null {
  if (props.can && props.with) {
    return { can: props.can, with: props.with };
  }

  const candidate = asRecord(payload.requiredCapability);
  if (typeof candidate.can === 'string' && typeof candidate.with === 'string') {
    return {
      can: candidate.can,
      with: candidate.with,
      constraints:
        typeof candidate.constraints === 'object' &&
        candidate.constraints !== null &&
        !Array.isArray(candidate.constraints)
          ? (candidate.constraints as Record<string, unknown>)
          : undefined,
    };
  }

  return null;
}

function parseEncryptedPayload(value: unknown): GnosisEncryptedPayload | null {
  const record = asRecord(value);
  if (
    typeof record.alg !== 'string' ||
    typeof record.ct !== 'string' ||
    typeof record.iv !== 'string' ||
    typeof record.tag !== 'string' ||
    typeof record.encryptedAt !== 'number'
  ) {
    return null;
  }

  return record as unknown as GnosisEncryptedPayload;
}

export const GNOSIS_CORE_AUTH_LABELS = {
  UCAN_IDENTITY: 'UCANIdentity',
  UCAN_ISSUE: 'UCANIssue',
  UCAN_VERIFY: 'UCANVerify',
  UCAN_DELEGATE: 'UCANDelegate',
  UCAN_REQUIRE: 'UCANRequire',
  ZK_ENCRYPT: 'ZKEncrypt',
  ZK_DECRYPT: 'ZKDecrypt',
  CUSTODIAL_SIGNER: 'CustodialSigner',
} as const;

export function registerCoreAuthHandlers(registry: GnosisRegistry): void {
  registry.register(
    GNOSIS_CORE_AUTH_LABELS.UCAN_IDENTITY,
    async (payload, props) => {
      const input = asRecord(payload);
      const displayName =
        typeof input.displayName === 'string'
          ? input.displayName
          : props.displayName;

      const identity = await generateUcanIdentity(
        displayName ? { displayName } : undefined
      );

      return {
        ...input,
        identity,
      };
    },
    { override: false }
  );

  registry.register(
    GNOSIS_CORE_AUTH_LABELS.UCAN_ISSUE,
    async (payload, props) => {
      const input = asRecord(payload);
      const issuer = input.identity as GnosisIdentity | undefined;
      const audience =
        typeof input.audience === 'string' ? input.audience : props.audience;

      if (!issuer) {
        throw new Error('UCANIssue requires payload.identity (Identity).');
      }
      if (!audience) {
        throw new Error('UCANIssue requires an audience DID in payload.audience or props.audience.');
      }

      const capabilities =
        parseCapabilities(input.capabilities) || parseCapabilitiesFromProps(props);
      const effectiveCapabilities =
        capabilities.length > 0 ? capabilities : parseCapabilitiesFromProps(props);

      if (effectiveCapabilities.length === 0) {
        throw new Error('UCANIssue requires at least one capability (payload.capabilities or props.capabilities/can+with).');
      }

      const expirationSeconds = Number.parseInt(
        props.expirationSeconds ?? `${input.expirationSeconds ?? ''}`,
        10
      );

      const token = await issueGranularUcan({
        issuer,
        audience,
        capabilities: effectiveCapabilities,
        createOptions: Number.isFinite(expirationSeconds)
          ? { expirationSeconds }
          : undefined,
      });

      return {
        ...input,
        ucan: {
          token,
          capabilities: effectiveCapabilities,
          audience,
        },
      };
    },
    { override: false }
  );

  registry.register(
    GNOSIS_CORE_AUTH_LABELS.UCAN_VERIFY,
    async (payload, props) => {
      const input = asRecord(payload);
      const token =
        typeof input.token === 'string'
          ? input.token
          : typeof asRecord(input.ucan).token === 'string'
            ? (asRecord(input.ucan).token as string)
            : null;
      const issuerPublicKey = input.issuerPublicKey as JsonWebKey | undefined;

      if (!token) {
        throw new Error('UCANVerify requires payload.token or payload.ucan.token.');
      }

      if (!issuerPublicKey) {
        throw new Error('UCANVerify requires payload.issuerPublicKey (JsonWebKey).');
      }

      const requiredCapabilities = parseCapabilitiesFromProps(props);
      const audience =
        typeof input.audience === 'string' ? input.audience : props.audience;

      const verification = await verifyGranularUcan({
        token,
        issuerPublicKey,
        verifyOptions: {
          audience: audience as `did:${string}:${string}` | undefined,
          requiredCapabilities: requiredCapabilities.length > 0 ? requiredCapabilities : undefined,
        },
      });

      const failClosed = parseBoolean(props.failClosed, true);
      if (!verification.valid && failClosed) {
        throw new Error(`UCAN verification failed: ${verification.error ?? 'unknown error'}`);
      }

      const enforce = parseBoolean(props.enforce, true);
      const executionAuth = verification.valid
        ? {
            enforce,
            principal: verification.payload?.aud,
            token,
            capabilities: verification.payload?.att ?? [],
          }
        : undefined;

      return {
        ...input,
        ucanVerification: verification,
        executionAuth,
      };
    },
    { override: false }
  );

  registry.register(
    GNOSIS_CORE_AUTH_LABELS.UCAN_DELEGATE,
    async (payload, props) => {
      const input = asRecord(payload);
      const parentToken =
        typeof input.parentToken === 'string'
          ? input.parentToken
          : typeof input.token === 'string'
            ? input.token
            : null;
      const issuer = input.identity as GnosisIdentity | undefined;
      const audience =
        typeof input.audience === 'string' ? input.audience : props.audience;
      const capabilities =
        parseCapabilities(input.capabilities) || parseCapabilitiesFromProps(props);
      const effectiveCapabilities =
        capabilities.length > 0 ? capabilities : parseCapabilitiesFromProps(props);

      if (!parentToken) {
        throw new Error('UCANDelegate requires payload.parentToken (or payload.token).');
      }
      if (!issuer) {
        throw new Error('UCANDelegate requires payload.identity (Identity).');
      }
      if (!audience) {
        throw new Error('UCANDelegate requires payload.audience or props.audience.');
      }
      if (effectiveCapabilities.length === 0) {
        throw new Error('UCANDelegate requires delegated capabilities.');
      }

      const delegatedToken = await delegateGranularUcan({
        parentToken,
        issuer,
        audience,
        capabilities: effectiveCapabilities,
        delegationOptions: {
          attenuate: parseBoolean(props.attenuate, true),
        },
      });

      return {
        ...input,
        delegatedUcan: {
          token: delegatedToken,
          capabilities: effectiveCapabilities,
          audience,
        },
      };
    },
    { override: false }
  );

  registry.register(
    GNOSIS_CORE_AUTH_LABELS.UCAN_REQUIRE,
    async (payload, props) => {
      const input = asRecord(payload);
      const executionAuth = asRecord(input.executionAuth);
      const required = parseRequiredCapability(input, props);

      if (!required) {
        throw new Error('UCANRequire requires can+with (props or payload.requiredCapability).');
      }

      const capabilities = parseCapabilities(executionAuth.capabilities);
      const granted = checkGrantedCapability(capabilities, required);
      if (!granted) {
        throw new Error(
          `UCANRequire denied: missing ${required.can} on ${required.with}`
        );
      }

      return {
        ...input,
        requiredCapability: required,
        requiredCapabilityGranted: true,
      };
    },
    { override: false }
  );

  registry.register(
    GNOSIS_CORE_AUTH_LABELS.ZK_ENCRYPT,
    async (payload, _props) => {
      const input = asRecord(payload);
      const plaintext =
        typeof input.plaintext === 'string'
          ? input.plaintext
          : typeof input.value === 'string'
            ? input.value
            : null;
      const recipientPublicKey = input.recipientPublicKey as JsonWebKey | undefined;

      if (!plaintext) {
        throw new Error('ZKEncrypt requires payload.plaintext (string).');
      }
      if (!recipientPublicKey) {
        throw new Error('ZKEncrypt requires payload.recipientPublicKey (JsonWebKey).');
      }

      const encrypted = await zkEncryptUtf8({ plaintext, recipientPublicKey });

      return {
        ...input,
        encrypted,
      };
    },
    { override: false }
  );

  registry.register(
    GNOSIS_CORE_AUTH_LABELS.ZK_DECRYPT,
    async (payload, _props) => {
      const input = asRecord(payload);
      const encrypted = parseEncryptedPayload(input.encrypted);
      const recipientPrivateKey = input.recipientPrivateKey as JsonWebKey | undefined;

      if (!encrypted) {
        throw new Error('ZKDecrypt requires payload.encrypted (EncryptedPayload).');
      }
      if (!recipientPrivateKey) {
        throw new Error('ZKDecrypt requires payload.recipientPrivateKey (JsonWebKey).');
      }

      const plaintext = await zkDecryptUtf8({
        encrypted,
        recipientPrivateKey,
      });

      return {
        ...input,
        plaintext,
      };
    },
    { override: false }
  );

  registry.register(
    GNOSIS_CORE_AUTH_LABELS.CUSTODIAL_SIGNER,
    async (payload, props) => {
      const input = asRecord(payload);
      const action =
        typeof input.action === 'string' ? input.action : props.action;

      if (!action) {
        throw new Error('CustodialSigner requires an action (payload.action or props.action).');
      }

      const allowed = isAllowedCustodialAction(action);
      if (!allowed && parseBoolean(props.failClosed, true)) {
        throw new Error(`CustodialSigner denied unknown action: ${action}`);
      }

      return {
        ...input,
        custodial: {
          action,
          allowed,
        },
      };
    },
    { override: false }
  );
}
