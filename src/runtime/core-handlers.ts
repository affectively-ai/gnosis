import { GnosisRegistry } from './registry.js';

type GnosisTaggedValue =
  | { kind: 'ok'; value: unknown }
  | { kind: 'err'; error: unknown }
  | { kind: 'some'; value: unknown }
  | { kind: 'none' };

interface DestructureBinding {
  sourceKey: string;
  targetKey: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function parseLiteral(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (trimmed === 'null') {
    return null;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const looksStructured =
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'));
  if (looksStructured) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

function isTaggedValue(payload: unknown): payload is GnosisTaggedValue {
  if (!isRecord(payload) || typeof payload.kind !== 'string') {
    return false;
  }

  const kind = normalizeToken(payload.kind);
  return kind === 'ok' || kind === 'err' || kind === 'some' || kind === 'none';
}

function parseBindings(raw: string | undefined): DestructureBinding[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const aliasMatch = entry.match(
        /^([A-Za-z_][A-Za-z0-9_]*)\s+as\s+([A-Za-z_][A-Za-z0-9_]*)$/
      );
      if (aliasMatch) {
        return {
          sourceKey: aliasMatch[1],
          targetKey: aliasMatch[2],
        };
      }

      const [sourceKey, targetKey] = entry
        .split(':')
        .map((segment) => segment.trim());
      if (sourceKey && targetKey) {
        return { sourceKey, targetKey };
      }

      return {
        sourceKey: entry,
        targetKey: entry,
      };
    });
}

function resolveTaggedPayloadSource(
  payload: unknown,
  from: string | undefined
): unknown {
  if (from && isRecord(payload)) {
    return payload[from];
  }

  if (!isTaggedValue(payload)) {
    return payload;
  }

  if (payload.kind === 'ok' || payload.kind === 'some') {
    return payload.value;
  }

  if (payload.kind === 'err') {
    return payload.error;
  }

  return payload;
}

function normalizeResultKind(
  rawKind: string | undefined,
  payload: unknown
): 'ok' | 'err' {
  if (rawKind) {
    return normalizeToken(rawKind) === 'err' ||
      normalizeToken(rawKind) === 'error'
      ? 'err'
      : 'ok';
  }

  if (isTaggedValue(payload)) {
    return payload.kind === 'err' ? 'err' : 'ok';
  }

  return 'ok';
}

function normalizeOptionKind(
  rawKind: string | undefined,
  payload: unknown
): 'some' | 'none' {
  if (rawKind) {
    return normalizeToken(rawKind) === 'none' ? 'none' : 'some';
  }

  if (isTaggedValue(payload)) {
    return payload.kind === 'none' ? 'none' : 'some';
  }

  return payload === null || payload === undefined ? 'none' : 'some';
}

function deriveTaggedKindFromField(
  payload: unknown,
  fieldName: string | undefined,
  okKind: 'ok' | 'some',
  errKind: 'err' | 'none'
): 'ok' | 'err' | 'some' | 'none' | null {
  if (!fieldName || !isRecord(payload)) {
    return null;
  }

  const fieldValue = payload[fieldName];
  if (typeof fieldValue === 'boolean') {
    return fieldValue ? okKind : errKind;
  }

  if (typeof fieldValue === 'string') {
    const normalized = normalizeToken(fieldValue);
    if (
      normalized === 'ok' ||
      normalized === 'err' ||
      normalized === 'some' ||
      normalized === 'none'
    ) {
      return normalized;
    }
    if (normalized === 'true') {
      return okKind;
    }
    if (normalized === 'false') {
      return errKind;
    }
  }

  if (typeof fieldValue === 'number') {
    return fieldValue !== 0 ? okKind : errKind;
  }

  if (fieldValue === null || fieldValue === undefined) {
    return errKind;
  }

  return okKind;
}

function resolvePayloadField(
  payload: unknown,
  fieldName: string | undefined
): unknown {
  if (!fieldName || !isRecord(payload)) {
    return payload;
  }

  return payload[fieldName];
}

export function registerCoreRuntimeHandlers(registry: GnosisRegistry): void {
  registry.register('Result', async (payload, props) => {
    const derivedKind = deriveTaggedKindFromField(
      payload,
      props.kindFrom,
      'ok',
      'err'
    );
    const kind = normalizeResultKind(
      props.kind ?? props.variant ?? props.status ?? derivedKind ?? undefined,
      payload
    );

    if (kind === 'err') {
      return {
        kind: 'err',
        error: props.error
          ? parseLiteral(props.error)
          : resolvePayloadField(payload, props.errorFrom),
      } satisfies GnosisTaggedValue;
    }

    return {
      kind: 'ok',
      value: props.value
        ? parseLiteral(props.value)
        : resolvePayloadField(payload, props.valueFrom),
    } satisfies GnosisTaggedValue;
  });

  registry.register('Option', async (payload, props) => {
    const derivedKind = deriveTaggedKindFromField(
      payload,
      props.kindFrom,
      'some',
      'none'
    );
    const kind = normalizeOptionKind(
      props.kind ?? props.variant ?? props.status ?? derivedKind ?? undefined,
      payload
    );

    if (kind === 'none') {
      return { kind: 'none' } satisfies GnosisTaggedValue;
    }

    return {
      kind: 'some',
      value: props.value
        ? parseLiteral(props.value)
        : resolvePayloadField(payload, props.valueFrom),
    } satisfies GnosisTaggedValue;
  });

  registry.register('Destructure', async (payload, props) => {
    const bindings = parseBindings(props.fields ?? props.field ?? props.bind);
    if (bindings.length === 0) {
      return payload;
    }

    const source = resolveTaggedPayloadSource(payload, props.from);
    if (!isRecord(source)) {
      throw new Error(
        `Destructure expected an object payload but received ${typeof source}.`
      );
    }

    const strict = props.strict !== 'false';
    const extracted: Record<string, unknown> = {};

    for (const binding of bindings) {
      if (!(binding.sourceKey in source)) {
        if (strict) {
          throw new Error(
            `Destructure missing field "${binding.sourceKey}" in payload.`
          );
        }
        continue;
      }

      extracted[binding.targetKey] = source[binding.sourceKey];
    }

    return extracted;
  });
}
