/**
 * Void Walker Engine -- Core reusable component
 *
 * Generic void walking over any choice space. Not negotiation-specific.
 * This should eventually move to gnosis core.
 */

// ============================================================================
// Void Boundary
// ============================================================================

export interface VoidBoundary {
  /** Per-choice rejection counts */
  counts: number[];
  /** Total entries in the void */
  totalEntries: number;
}

export function createVoidBoundary(numChoices: number): VoidBoundary {
  return { counts: new Array(numChoices).fill(0), totalEntries: 0 };
}

export function updateVoidBoundary(
  boundary: VoidBoundary,
  choiceIdx: number,
  magnitude: number = 1,
): void {
  boundary.counts[choiceIdx] += magnitude;
  boundary.totalEntries += magnitude;
}

export function decayVoidBoundary(boundary: VoidBoundary, factor: number): void {
  for (let i = 0; i < boundary.counts.length; i++) {
    boundary.counts[i] *= 1 - factor;
  }
  boundary.totalEntries = boundary.counts.reduce((a, b) => a + b, 0);
}

// ============================================================================
// Complement Distribution
// ============================================================================

export function complementDistribution(
  boundary: VoidBoundary,
  eta: number = 3.0,
): number[] {
  const counts = boundary.counts;
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  const range = max - min;
  const norm = range > 0
    ? counts.map((v) => (v - min) / range)
    : counts.map(() => 0);
  const weights = norm.map((v) => Math.exp(-eta * v));
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / sum);
}

// ============================================================================
// Measurement
// ============================================================================

export function shannonEntropy(probs: number[]): number {
  let h = 0;
  for (const p of probs) if (p > 0) h -= p * Math.log(p);
  return h;
}

export function excessKurtosis(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mu = values.reduce((a, b) => a + b, 0) / n;
  const s2 = values.reduce((s, v) => s + (v - mu) ** 2, 0) / n;
  if (s2 < 1e-12) return 0;
  const m4 = values.reduce((s, v) => s + (v - mu) ** 4, 0) / n;
  return m4 / s2 ** 2 - 3;
}

export function inverseBule(boundary: VoidBoundary, eta: number, rounds: number): number {
  if (rounds <= 0) return 0;
  const maxH = Math.log(boundary.counts.length);
  const dist = complementDistribution(boundary, eta);
  return (maxH - shannonEntropy(dist)) / rounds;
}

export function giniCoefficient(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mu = sorted.reduce((a, b) => a + b, 0) / n;
  if (mu === 0) return 0;
  let sumDiff = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) sumDiff += Math.abs(sorted[i] - sorted[j]);
  return sumDiff / (2 * n * n * mu);
}

// ============================================================================
// Metacognitive Walker (c0-c3)
// ============================================================================

export type Gait = 'stand' | 'trot' | 'canter' | 'gallop';

export const GAIT_DEPTH: Record<Gait, number> = {
  stand: 1,
  trot: 1,
  canter: 4,
  gallop: 16,
};

export interface MetaCogState {
  boundary: VoidBoundary;
  eta: number;
  exploration: number;
  gait: Gait;
  totalRounds: number;
  totalPayoff: number;
  adaptationCount: number;
  lastAdaptationRound: number;
}

export function createMetaCogState(numChoices: number): MetaCogState {
  return {
    boundary: createVoidBoundary(numChoices),
    eta: 2.0,
    exploration: 0.3,
    gait: 'stand',
    totalRounds: 0,
    totalPayoff: 0,
    adaptationCount: 0,
    lastAdaptationRound: 0,
  };
}

/** c0: Choose an action from the complement distribution */
export function c0Choose(state: MetaCogState, rng: () => number): number {
  const N = state.boundary.counts.length;
  if (rng() < state.exploration) return Math.floor(rng() * N);
  const dist = complementDistribution(state.boundary, state.eta);
  const r = rng();
  let cum = 0;
  for (let i = 0; i < N; i++) { cum += dist[i]; if (r < cum) return i; }
  return N - 1;
}

/** c0: Update void boundary after observing outcome */
export function c0Update(
  state: MetaCogState,
  choiceIdx: number,
  myPayoff: number,
  theirPayoff: number,
): void {
  if (myPayoff < theirPayoff) updateVoidBoundary(state.boundary, choiceIdx);
  if (myPayoff < 0) updateVoidBoundary(state.boundary, choiceIdx, Math.abs(myPayoff));
  state.totalPayoff += myPayoff;
  state.totalRounds++;
}

/** c1: Measure distribution shape */
export function c1Measure(state: MetaCogState): {
  kurtosis: number;
  entropy: number;
  inverseBule: number;
} {
  const dist = complementDistribution(state.boundary, state.eta);
  return {
    kurtosis: excessKurtosis(dist),
    entropy: shannonEntropy(dist),
    inverseBule: inverseBule(state.boundary, state.eta, state.totalRounds),
  };
}

/** c2: Select gait based on kurtosis */
export function c2SelectGait(kurtosis: number, currentGait: Gait, rounds: number): Gait {
  if (rounds === 0) return 'stand';
  if (currentGait === 'stand') return 'trot';
  if (kurtosis >= 0.5 && currentGait === 'trot' && rounds > 10) return 'canter';
  if (kurtosis >= 2.0 && currentGait === 'canter' && rounds > 50) return 'gallop';
  if (kurtosis < 0.0 && currentGait === 'gallop') return 'canter';
  if (kurtosis < -1.5 && currentGait === 'canter') return 'trot';
  return currentGait;
}

/** c3: Adapt parameters based on c2 evaluation */
export function c3Adapt(state: MetaCogState, kurtosis: number): void {
  if (state.totalRounds - state.lastAdaptationRound < 10) return;

  const newGait = c2SelectGait(kurtosis, state.gait, state.totalRounds);
  if (newGait !== state.gait) state.gait = newGait;

  switch (state.gait) {
    case 'stand': break;
    case 'trot':
      state.exploration = Math.min(0.4, state.exploration + 0.01);
      state.eta = Math.max(1.0, state.eta - 0.05);
      break;
    case 'canter':
      state.exploration = Math.max(0.05, state.exploration - 0.005);
      state.eta = Math.min(5.0, state.eta + 0.05);
      break;
    case 'gallop':
      state.exploration = Math.max(0.01, state.exploration - 0.01);
      state.eta = Math.min(8.0, state.eta + 0.1);
      break;
  }

  state.adaptationCount++;
  state.lastAdaptationRound = state.totalRounds;
}
