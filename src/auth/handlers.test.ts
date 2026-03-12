import { describe, expect, it } from 'bun:test';
import type { GnosisIdentity } from './core.js';
import { GNOSIS_CORE_AUTH_LABELS, registerCoreAuthHandlers } from './handlers.js';
import { GnosisRegistry } from '../runtime/registry.js';

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

async function generateRecipientPublicKey(): Promise<JsonWebKey> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey']
  );
  return crypto.subtle.exportKey('jwk', keyPair.publicKey);
}

function getRegisteredHandler(label: string) {
  const registry = new GnosisRegistry();
  registerCoreAuthHandlers(registry);
  const handler = registry.getHandler(label);
  if (!handler) {
    throw new Error(`Expected handler "${label}" to be registered.`);
  }
  return handler;
}

describe('core auth handlers', () => {
  it('fails closed for confidential delegation without recipient key', async () => {
    const delegateHandler = getRegisteredHandler(
      GNOSIS_CORE_AUTH_LABELS.UCAN_DELEGATE
    );

    const issuer: GnosisIdentity = {
      did: 'did:example:alice',
      signingKey: {
        publicKey: {} as JsonWebKey,
      },
    };

    await expect(
      delegateHandler(
        {
          parentToken: 'parent-token',
          identity: issuer,
          audience: 'did:example:bob',
          capabilities: [{ can: 'aeon/fork', with: '*' }],
          confidential: true,
          delegationContext: {
            frame: 'aeon://frame/main',
          },
        },
        {}
      )
    ).rejects.toThrow('recipient public key');
  });

  it('encrypts custodial payload by default when recipient key is provided', async () => {
    const custodialHandler = getRegisteredHandler(
      GNOSIS_CORE_AUTH_LABELS.CUSTODIAL_SIGNER
    );
    const recipientPublicKey = await generateRecipientPublicKey();

    const output = await custodialHandler(
      {
        action: 'halos.recordExhaust',
        payload: {
          amount: '10',
          memo: 'sensitive',
        },
        recipientPublicKey,
      },
      {}
    );
    const result = asRecord(output);
    const custodial = asRecord(result.custodial);
    const zkPolicy = asRecord(result.zkPolicy);
    const encrypted = asRecord(result.encrypted);

    expect(custodial.allowed).toBe(true);
    expect(custodial.payloadEncrypted).toBe(true);
    expect(zkPolicy.domain).toBe('custodial');
    expect(result.encrypted).toBeDefined();
    expect(encrypted.alg).toBe('ECIES-P256');
  });

  it('requires encryption key for cross-tenant sync when mode is required', async () => {
    const syncHandler = getRegisteredHandler(
      GNOSIS_CORE_AUTH_LABELS.ZK_SYNC_ENVELOPE
    );

    await expect(
      syncHandler(
        {
          data: { delta: 'state-update' },
          crossTenant: true,
        },
        {}
      )
    ).rejects.toThrow('recipient public key');
  });

  it('encrypts private materialization payload by default', async () => {
    const materializeHandler = getRegisteredHandler(
      GNOSIS_CORE_AUTH_LABELS.ZK_MATERIALIZE_ENVELOPE
    );
    const recipientPublicKey = await generateRecipientPublicKey();

    const output = await materializeHandler(
      {
        content: 'private-note',
        private: true,
        recipientPublicKey,
      },
      {}
    );
    const result = asRecord(output);
    const materialization = asRecord(result.materializationEnvelope);
    const zkPolicy = asRecord(result.zkPolicy);

    expect(materialization.private).toBe(true);
    expect(materialization.encrypted).toBe(true);
    expect(zkPolicy.mode).toBe('required');
    expect(result.encrypted).toBeDefined();
  });
});
