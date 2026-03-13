import { GnosisRegistry, type GnosisHandlerContext } from './registry.js';

type GnosisTaggedValue =
  | { kind: 'ok'; value: unknown }
  | { kind: 'err'; error: unknown }
  | { kind: 'some'; value: unknown }
  | { kind: 'none' };

interface GnosisVariantValue {
  adt: string;
  kind: string;
  case: string;
  value: unknown;
  cases?: string[];
}

interface DestructureBinding {
  sourceKey: string;
  targetKey: string;
}

interface GnosisQubitState {
  type: 'qubit';
  alpha: number;
  beta: number;
  basis: '0' | '1' | '+' | '-';
}

interface GnosisParameterState {
  type: 'parameter';
  value: number;
  differentiable: true;
}

interface GnosisGradientState {
  type: 'gradient';
  value: number;
}

interface GnosisScalarState {
  type: 'scalar';
  value: number;
}

const SQRT1_2 = Math.SQRT1_2;

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

function isQubitState(payload: unknown): payload is GnosisQubitState {
  return (
    isRecord(payload) &&
    payload.type === 'qubit' &&
    typeof payload.alpha === 'number' &&
    typeof payload.beta === 'number'
  );
}

function isParameterState(payload: unknown): payload is GnosisParameterState {
  return (
    isRecord(payload) &&
    payload.type === 'parameter' &&
    typeof payload.value === 'number'
  );
}

function isGradientState(payload: unknown): payload is GnosisGradientState {
  return (
    isRecord(payload) &&
    payload.type === 'gradient' &&
    typeof payload.value === 'number'
  );
}

function isScalarState(payload: unknown): payload is GnosisScalarState {
  return (
    isRecord(payload) &&
    payload.type === 'scalar' &&
    typeof payload.value === 'number'
  );
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

function parseCaseList(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  return [
    ...new Set(
      raw
        .split(/[\s,|]+/)
        .map((entry) => normalizeToken(entry))
        .filter((entry) => entry.length > 0)
    ),
  ];
}

function resolveTaggedPayloadSource(
  payload: unknown,
  from: string | undefined
): unknown {
  if (from && isRecord(payload)) {
    return payload[from];
  }

  if (isTaggedValue(payload)) {
    if (payload.kind === 'ok' || payload.kind === 'some') {
      return payload.value;
    }

    if (payload.kind === 'err') {
      return payload.error;
    }
  }

  if (
    isRecord(payload) &&
    'value' in payload &&
    (typeof payload.kind === 'string' || typeof payload.case === 'string')
  ) {
    return payload.value;
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

function resolveVariantCaseCandidate(
  payload: unknown,
  props: Record<string, string>,
  allowedCases: string[]
): string {
  const explicitCase =
    props.case ?? props.kind ?? props.status ?? props.variant;
  if (explicitCase) {
    return normalizeToken(explicitCase);
  }

  if (props.caseFrom && isRecord(payload)) {
    const derivedValue = payload[props.caseFrom];
    if (
      typeof derivedValue === 'string' ||
      typeof derivedValue === 'number' ||
      typeof derivedValue === 'boolean'
    ) {
      return normalizeToken(String(derivedValue));
    }
  }

  if (isRecord(payload)) {
    for (const field of ['case', 'kind', 'status'] as const) {
      const derivedValue = payload[field];
      if (
        typeof derivedValue === 'string' ||
        typeof derivedValue === 'number' ||
        typeof derivedValue === 'boolean'
      ) {
        return normalizeToken(String(derivedValue));
      }
    }
  }

  if (
    typeof payload === 'string' ||
    typeof payload === 'number' ||
    typeof payload === 'boolean'
  ) {
    return normalizeToken(String(payload));
  }

  if (allowedCases.length === 1) {
    return allowedCases[0];
  }

  throw new Error(
    'Variant requires a closed case via case, caseFrom, or payload case data.'
  );
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

function buildQubitStateFromBasis(
  basisRaw: string | undefined
): GnosisQubitState {
  const basis = normalizeToken(basisRaw ?? '0');
  switch (basis) {
    case '1':
      return { type: 'qubit', alpha: 0, beta: 1, basis: '1' };
    case '+':
      return { type: 'qubit', alpha: SQRT1_2, beta: SQRT1_2, basis: '+' };
    case '-':
      return { type: 'qubit', alpha: SQRT1_2, beta: -SQRT1_2, basis: '-' };
    default:
      return { type: 'qubit', alpha: 1, beta: 0, basis: '0' };
  }
}

function normalizeQubitState(
  payload: unknown,
  basisRaw?: string
): GnosisQubitState {
  if (isQubitState(payload)) {
    return payload;
  }

  return buildQubitStateFromBasis(basisRaw);
}

function classifyQubitBasis(
  alpha: number,
  beta: number
): '0' | '1' | '+' | '-' {
  const roundedAlpha = Math.round(alpha * 1000) / 1000;
  const roundedBeta = Math.round(beta * 1000) / 1000;
  const roundedHalf = Math.round(SQRT1_2 * 1000) / 1000;

  if (roundedAlpha === 1 && roundedBeta === 0) {
    return '0';
  }
  if (roundedAlpha === 0 && roundedBeta === 1) {
    return '1';
  }
  if (roundedAlpha === roundedHalf && roundedBeta === roundedHalf) {
    return '+';
  }
  if (roundedAlpha === roundedHalf && roundedBeta === -roundedHalf) {
    return '-';
  }

  return Math.abs(beta) > Math.abs(alpha) ? '1' : '0';
}

function collapseMeasurement(
  qubit: GnosisQubitState,
  forcedOutcomeRaw: string | undefined
): {
  kind: 'zero' | 'one';
  value: 0 | 1;
  probabilities: { zero: number; one: number };
} {
  const probabilities = {
    zero: Math.round(qubit.alpha ** 2 * 1000) / 1000,
    one: Math.round(qubit.beta ** 2 * 1000) / 1000,
  };
  const forcedOutcome = normalizeToken(forcedOutcomeRaw ?? '');
  if (forcedOutcome === '1' || forcedOutcome === 'one') {
    return { kind: 'one', value: 1, probabilities };
  }
  if (forcedOutcome === '0' || forcedOutcome === 'zero') {
    return { kind: 'zero', value: 0, probabilities };
  }

  return probabilities.one > probabilities.zero
    ? { kind: 'one', value: 1, probabilities }
    : { kind: 'zero', value: 0, probabilities };
}

function parseNumericValue(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function delayWithCancellation(
  durationMs: number,
  signal: AbortSignal | undefined
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, durationMs);

    function onAbort(): void {
      clearTimeout(timeoutId);
      reject(new Error('Delay cancelled.'));
    }

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }

      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

function readNumericPayload(
  payload: unknown,
  key: string | undefined
): number | null {
  const candidate = key && isRecord(payload) ? payload[key] : payload;

  if (typeof candidate === 'number') {
    return candidate;
  }
  if (
    isScalarState(candidate) ||
    isGradientState(candidate) ||
    isParameterState(candidate)
  ) {
    return candidate.value;
  }

  return null;
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

  registry.register('Variant', async (payload, props) => {
    const allowedCases = parseCaseList(
      props.cases ?? props.variants ?? props.options
    );
    const variantCase = resolveVariantCaseCandidate(
      payload,
      props,
      allowedCases
    );
    if (allowedCases.length > 0 && !allowedCases.includes(variantCase)) {
      throw new Error(
        `Variant case '${variantCase}' is not declared in [${allowedCases.join(
          ', '
        )}].`
      );
    }

    return {
      adt: props.adt ?? props.typeName ?? props.space ?? 'Variant',
      kind: variantCase,
      case: variantCase,
      value: props.value
        ? parseLiteral(props.value)
        : resolvePayloadField(payload, props.valueFrom),
      ...(allowedCases.length > 0 ? { cases: allowedCases } : {}),
    } satisfies GnosisVariantValue;
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

  registry.register(
    'Delay',
    async (
      payload,
      props,
      context: GnosisHandlerContext | undefined
    ): Promise<unknown> => {
      const durationMs = Math.max(
        0,
        Math.round(
          parseNumericValue(props.ms ?? props.delayMs ?? props.durationMs, 0)
        )
      );

      await delayWithCancellation(durationMs, context?.signal);

      if (props.emit) {
        return parseLiteral(props.emit);
      }

      return payload;
    }
  );

  registry.register('Qubit', async (payload, props) => {
    return normalizeQubitState(payload, props.state ?? props.basis);
  });

  registry.register('Hadamard', async (payload, props) => {
    const qubit = normalizeQubitState(payload, props.state ?? props.basis);
    const alpha = (qubit.alpha + qubit.beta) * SQRT1_2;
    const beta = (qubit.alpha - qubit.beta) * SQRT1_2;

    return {
      type: 'qubit',
      alpha,
      beta,
      basis: classifyQubitBasis(alpha, beta),
    } satisfies GnosisQubitState;
  });

  registry.register('PauliX', async (payload, props) => {
    const qubit = normalizeQubitState(payload, props.state ?? props.basis);
    const alpha = qubit.beta;
    const beta = qubit.alpha;

    return {
      type: 'qubit',
      alpha,
      beta,
      basis: classifyQubitBasis(alpha, beta),
    } satisfies GnosisQubitState;
  });

  registry.register('Measure', async (payload, props) => {
    const qubit = normalizeQubitState(payload, props.state ?? props.basis);
    return collapseMeasurement(qubit, props.force ?? props.outcome);
  });

  registry.register('Parameter', async (payload, props) => {
    if (isParameterState(payload) && !props.value) {
      return payload;
    }

    return {
      type: 'parameter',
      value: parseNumericValue(
        props.value,
        isParameterState(payload) ? payload.value : 0
      ),
      differentiable: true,
    } satisfies GnosisParameterState;
  });

  registry.register('Gradient', async (payload, props) => {
    if (isGradientState(payload) && !props.value) {
      return payload;
    }

    return {
      type: 'gradient',
      value: parseNumericValue(
        props.value,
        isGradientState(payload) ? payload.value : 0
      ),
    } satisfies GnosisGradientState;
  });

  registry.register('Scalar', async (payload, props) => {
    if (isScalarState(payload) && !props.value) {
      return payload;
    }

    return {
      type: 'scalar',
      value: parseNumericValue(
        props.value,
        isScalarState(payload) ? payload.value : 0
      ),
    } satisfies GnosisScalarState;
  });

  registry.register('GradientStep', async (payload, props) => {
    const learningRate = parseNumericValue(props.learningRate, 0.1);
    const parameterKey = props.parameterKey ?? 'parameter';
    const gradientKey = props.gradientKey ?? 'gradient';

    const parameterPayload = isRecord(payload)
      ? payload[parameterKey]
      : payload;
    const gradientPayload = isRecord(payload) ? payload[gradientKey] : payload;
    if (!isParameterState(parameterPayload)) {
      throw new Error(
        `GradientStep expected parameter payload at "${parameterKey}".`
      );
    }
    if (!isGradientState(gradientPayload)) {
      throw new Error(
        `GradientStep expected gradient payload at "${gradientKey}".`
      );
    }

    const nextValue =
      parameterPayload.value - gradientPayload.value * learningRate;

    return {
      type: 'parameter',
      value: Math.round(nextValue * 1000) / 1000,
      differentiable: true,
      previousValue: parameterPayload.value,
      gradient: gradientPayload.value,
      learningRate,
    };
  });

  registry.register('MeanSquaredError', async (payload, props) => {
    const prediction = readNumericPayload(
      payload,
      props.predictionKey ?? 'prediction'
    );
    const target = readNumericPayload(payload, props.targetKey ?? 'target');
    if (prediction === null || target === null) {
      throw new Error(
        'MeanSquaredError expected prediction and target numeric payloads.'
      );
    }

    const delta = prediction - target;
    return {
      type: 'loss',
      value: Math.round(delta * delta * 1000) / 1000,
      prediction,
      target,
      delta: Math.round(delta * 1000) / 1000,
    };
  });
}
