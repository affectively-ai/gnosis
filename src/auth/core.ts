export interface GnosisCapability {
  can: string;
  with: string;
  constraints?: Record<string, unknown>;
}

export interface GnosisIdentity {
  did: string;
  signingKey: {
    publicKey: JsonWebKey;
    privateKey?: JsonWebKey;
  };
  displayName?: string;
  [key: string]: unknown;
}

export interface GnosisVerificationResult {
  valid: boolean;
  payload?: {
    aud?: string;
    att?: GnosisCapability[];
    [key: string]: unknown;
  };
  error?: string;
  [key: string]: unknown;
}

export interface GnosisCreateUcanOptions {
  expirationSeconds?: number;
  [key: string]: unknown;
}

export interface GnosisVerifyUcanOptions {
  audience?: string;
  requiredCapabilities?: GnosisCapability[];
  [key: string]: unknown;
}

export interface GnosisDelegationOptions extends GnosisCreateUcanOptions {
  attenuate?: boolean;
}

export interface GnosisEncryptionOptions {
  category?: string;
  aad?: Uint8Array;
  nonce?: string;
  [key: string]: unknown;
}

export interface GnosisEncryptedPayload {
  alg: string;
  ct: string;
  iv: string;
  tag: string;
  encryptedAt: number;
  epk?: JsonWebKey;
  category?: string;
  nonce?: string;
  [key: string]: unknown;
}

export interface GnosisExecutionAuthContext {
  enforce?: boolean;
  principal?: string;
  token?: string;
  capabilities: GnosisCapability[];
}

export interface TopologyEdgeAuthorizationInput {
  edgeType: string;
  sourceId: string;
  targetIds: readonly string[];
  auth: GnosisExecutionAuthContext;
}

export interface TopologyEdgeAuthorizationResult {
  allowed: boolean;
  reason?: string;
  required?: GnosisCapability;
}

interface AuthRuntimeModule {
  generateIdentity?: (options?: {
    displayName?: string;
  }) => Promise<GnosisIdentity>;
  createUCAN?: (
    issuer: GnosisIdentity,
    audience: string,
    capabilities: GnosisCapability[],
    options?: GnosisCreateUcanOptions
  ) => Promise<string>;
  verifyUCAN?: (
    token: string,
    issuerPublicKey: JsonWebKey,
    options?: GnosisVerifyUcanOptions
  ) => Promise<GnosisVerificationResult>;
  delegateCapabilities?: (
    parentToken: string,
    issuer: GnosisIdentity,
    audience: string,
    capabilities: GnosisCapability[],
    options?: GnosisDelegationOptions
  ) => Promise<string>;
  eciesEncryptString?: (
    plaintext: string,
    recipientPublicKey: JsonWebKey,
    options?: GnosisEncryptionOptions
  ) => Promise<GnosisEncryptedPayload>;
  eciesDecryptString?: (
    encrypted: GnosisEncryptedPayload,
    recipientPrivateKey: JsonWebKey
  ) => Promise<string>;
}

type AuthFunctionName = keyof AuthRuntimeModule;

const CUSTODIAL_SIGNER_ACTIONS: readonly string[] = [
  'halos.recordExhaust',
  'halos.signDisclosure',
  'halos.consent.agree',
  'halos.consent.ack',
  'halos.consent.snooze',
  'edgework.relayer.registerGatewayViaSignature',
  'edgework.oracle.updateProviderCosts',
  'edgework.oracle.setProviderWeights',
  'edgework.oracle.batchUpdateModelCosts',
  'mcp.memento.publishMemento',
  'mcp.memento.eraseMemento',
  'mcp.memento.createMemento',
  'mcp.memento.batchCreateMementos',
  'mcp.memento.tombstoneMemento',
  'mcp.badge.mintBadgeBatch',
  'mcp.badge.burnBadge',
] as const;

const CUSTODIAL_ACTIONS = new Set<string>(CUSTODIAL_SIGNER_ACTIONS);

let authRuntimePromise: Promise<AuthRuntimeModule> | null = null;

async function loadAuthRuntime(): Promise<AuthRuntimeModule> {
  if (!authRuntimePromise) {
    const moduleSpecifier = '@affectively/auth';
    const dynamicImport = new Function(
      'moduleSpecifier',
      'return import(moduleSpecifier);'
    ) as (moduleSpecifier: string) => Promise<unknown>;
    authRuntimePromise = dynamicImport(moduleSpecifier).then(
      (module) => module as AuthRuntimeModule
    );
  }

  return authRuntimePromise;
}

async function requireAuthFunction<TName extends AuthFunctionName>(
  name: TName
): Promise<NonNullable<AuthRuntimeModule[TName]>> {
  const runtime = await loadAuthRuntime();
  const candidate = runtime[name];
  if (typeof candidate !== 'function') {
    throw new Error(
      `@affectively/auth missing required export "${String(name)}".`
    );
  }

  return candidate as NonNullable<AuthRuntimeModule[TName]>;
}

function normalizeEdgeType(edgeType: string): string {
  return edgeType.trim().toUpperCase();
}

function capabilityActionMatches(granted: string, required: string): boolean {
  if (granted === '*' || granted === required) {
    return true;
  }

  if (granted.endsWith('/*')) {
    const prefix = granted.slice(0, -1);
    return required.startsWith(prefix);
  }

  return false;
}

function capabilityResourceMatches(granted: string, required: string): boolean {
  if (granted === '*' || granted === required) {
    return true;
  }

  if (granted.endsWith('*')) {
    const prefix = granted.slice(0, -1);
    return required.startsWith(prefix);
  }

  return false;
}

export function checkGrantedCapability(
  granted: readonly GnosisCapability[],
  required: GnosisCapability
): boolean {
  for (const candidate of granted) {
    if (
      capabilityActionMatches(candidate.can, required.can) &&
      capabilityResourceMatches(candidate.with, required.with)
    ) {
      return true;
    }
  }

  return false;
}

export function topologyActionForEdge(edgeType: string): string {
  const normalized = normalizeEdgeType(edgeType);

  if (normalized === 'FORK') return 'fork';
  if (normalized === 'RACE') return 'race';
  if (normalized === 'FOLD' || normalized === 'COLLAPSE') return 'fold';
  if (normalized === 'VENT' || normalized === 'TUNNEL') return 'vent';
  if (normalized === 'OBSERVE') return 'observe';
  if (normalized === 'INTERFERE') return 'interfere';
  if (normalized === 'ENTANGLE') return 'entangle';
  if (normalized === 'SUPERPOSE') return 'superpose';
  if (normalized === 'EVOLVE') return 'evolve';
  return 'process';
}

export function buildEdgeResource(
  edgeType: string,
  sourceId: string,
  targetId: string
): string {
  const action = topologyActionForEdge(edgeType);
  return `aeon://edge/${action}/${sourceId}->${targetId}`;
}

export function authorizeTopologyEdge(
  input: TopologyEdgeAuthorizationInput
): TopologyEdgeAuthorizationResult {
  const shouldEnforce = input.auth.enforce === true;
  if (!shouldEnforce) {
    return { allowed: true };
  }

  if (input.auth.capabilities.length === 0) {
    return {
      allowed: false,
      reason:
        'No UCAN capabilities available for enforced topology authorization.',
    };
  }

  const action = topologyActionForEdge(input.edgeType);

  for (const rawTargetId of input.targetIds) {
    const targetId = rawTargetId.trim();
    const required: GnosisCapability = {
      can: `aeon/${action}`,
      with: buildEdgeResource(input.edgeType, input.sourceId, targetId),
    };

    if (!checkGrantedCapability(input.auth.capabilities, required)) {
      return {
        allowed: false,
        reason: `Missing capability aeon/${action} on ${required.with}`,
        required,
      };
    }
  }

  return { allowed: true };
}

export async function generateUcanIdentity(options: {
  displayName?: string;
} = {}): Promise<GnosisIdentity> {
  const generateIdentity = await requireAuthFunction('generateIdentity');
  return generateIdentity(options);
}

export async function issueGranularUcan(options: {
  issuer: GnosisIdentity;
  audience: string;
  capabilities: GnosisCapability[];
  createOptions?: GnosisCreateUcanOptions;
}): Promise<string> {
  const createUCAN = await requireAuthFunction('createUCAN');
  return createUCAN(
    options.issuer,
    options.audience,
    options.capabilities,
    options.createOptions
  );
}

export async function verifyGranularUcan(options: {
  token: string;
  issuerPublicKey: JsonWebKey;
  verifyOptions?: GnosisVerifyUcanOptions;
}): Promise<GnosisVerificationResult> {
  const verifyUCAN = await requireAuthFunction('verifyUCAN');
  return verifyUCAN(options.token, options.issuerPublicKey, options.verifyOptions);
}

export async function delegateGranularUcan(options: {
  parentToken: string;
  issuer: GnosisIdentity;
  audience: string;
  capabilities: GnosisCapability[];
  delegationOptions?: GnosisDelegationOptions;
}): Promise<string> {
  const delegateCapabilities = await requireAuthFunction('delegateCapabilities');
  return delegateCapabilities(
    options.parentToken,
    options.issuer,
    options.audience,
    options.capabilities,
    options.delegationOptions
  );
}

export async function zkEncryptUtf8(options: {
  plaintext: string;
  recipientPublicKey: JsonWebKey;
  encryptionOptions?: GnosisEncryptionOptions;
}): Promise<GnosisEncryptedPayload> {
  const eciesEncryptString = await requireAuthFunction('eciesEncryptString');
  return eciesEncryptString(
    options.plaintext,
    options.recipientPublicKey,
    options.encryptionOptions
  );
}

export async function zkDecryptUtf8(options: {
  encrypted: GnosisEncryptedPayload;
  recipientPrivateKey: JsonWebKey;
}): Promise<string> {
  const eciesDecryptString = await requireAuthFunction('eciesDecryptString');
  return eciesDecryptString(options.encrypted, options.recipientPrivateKey);
}

export function isAllowedCustodialAction(action: string): boolean {
  return CUSTODIAL_ACTIONS.has(action);
}
