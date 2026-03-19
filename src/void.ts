/**
 * void.ts -- The primitive everything reduces to
 *
 * Void walking is the universal substrate of gnosis. Negotiation,
 * personality, behavioral loops, inference routing, and topology
 * execution all reduce to the same structure: a walker accumulating
 * rejections against a boundary, with the complement distribution
 * telling it where to go next.
 *
 * This file formalizes the primitives so they can fold in on themselves.
 */

// ============================================================================
// Void Boundary -- the accumulation surface
// ============================================================================

export interface VoidBoundary {
  /** Per-dimension rejection counts */
  counts: number[];
  /** Total entries in the void */
  totalEntries: number;
}

export function createVoidBoundary(dimensions: number): VoidBoundary {
  return { counts: new Array(dimensions).fill(0), totalEntries: 0 };
}

export function updateVoidBoundary(
  boundary: VoidBoundary,
  dimensionIdx: number,
  magnitude: number = 1,
): void {
  boundary.counts[dimensionIdx] += magnitude;
  boundary.totalEntries += magnitude;
}

export function decayVoidBoundary(boundary: VoidBoundary, factor: number): void {
  for (let i = 0; i < boundary.counts.length; i++) {
    boundary.counts[i] *= 1 - factor;
  }
  boundary.totalEntries = boundary.counts.reduce((a, b) => a + b, 0);
}

/** Number of dimensions in this boundary */
export function boundaryDimensions(boundary: VoidBoundary): number {
  return boundary.counts.length;
}

/**
 * Merge two VoidBoundaries by summing their rejection counts.
 * Used by FOLD to merge boundaries from all inputs.
 */
export function mergeVoidBoundaries(a: VoidBoundary, b: VoidBoundary): VoidBoundary {
  const maxDims = Math.max(a.counts.length, b.counts.length);
  const counts = new Array(maxDims).fill(0);
  for (let i = 0; i < a.counts.length; i++) counts[i] += a.counts[i];
  for (let i = 0; i < b.counts.length; i++) counts[i] += b.counts[i];
  return {
    counts,
    totalEntries: a.totalEntries + b.totalEntries,
  };
}

/**
 * Buleyean weight for a dimension: T - min(v_i, T) + 1
 * Matches the Lean formula. Every dimension gets at least weight 1 (the sliver).
 */
export function buleyeanWeight(rounds: number, voidCount: number): number {
  return rounds - Math.min(voidCount, rounds) + 1;
}

/**
 * Check Buleyean positivity: all weights >= 1.
 * This is guaranteed by construction (the +1 sliver) but verifiable.
 */
export function buleyeanPositivity(boundary: VoidBoundary, rounds: number = 0): boolean {
  const T = rounds > 0 ? rounds : boundary.totalEntries;
  return boundary.counts.every((v) => buleyeanWeight(T, v) >= 1);
}

/**
 * Entangle two VoidBoundaries via a Resonance link.
 * Returns a Resonance that couples the two boundaries bidirectionally.
 */
export function entangleBoundaries(
  sourceIdx: number,
  targetIdx: number,
  strength: number = 0.1,
): Resonance {
  return createResonance(sourceIdx, targetIdx, strength, 'entangled void boundaries');
}

/**
 * Teleport deficit: returns just the deficit integer from a boundary.
 * The deficit is totalEntries - sum of minimum weights, capturing
 * the net irreversibility accumulated.
 */
export function teleportDeficit(boundary: VoidBoundary): number {
  if (boundary.counts.length === 0) return 0;
  const minCount = Math.min(...boundary.counts);
  return boundary.totalEntries - minCount * boundary.counts.length;
}

/**
 * Compute the Aleph: sufficient statistic scalar capturing full void state.
 * Combines total entries, entropy of complement distribution, and deficit.
 */
export function computeAleph(stack: BoundaryStack): number {
  const flat = flattenStack(stack);
  const dist = complementDistribution(flat);
  const entropy = shannonEntropy(dist);
  const deficit = teleportDeficit(flat);
  return flat.totalEntries + entropy + deficit;
}

// ============================================================================
// Complement Distribution -- what the void is not
// ============================================================================

/**
 * The complement distribution over a void boundary.
 * Where the void has accumulated least, the complement peaks.
 * eta controls temperature: higher eta = sharper complement.
 */
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

/**
 * Sample from a complement distribution.
 * Returns the index of the chosen dimension.
 */
export function sampleComplement(dist: number[], rng: () => number): number {
  const r = rng();
  let cum = 0;
  for (let i = 0; i < dist.length; i++) {
    cum += dist[i];
    if (r < cum) return i;
  }
  return dist.length - 1;
}

// ============================================================================
// Measurement -- observing the walker's state
// ============================================================================

export interface Measurement {
  /** Shannon entropy of the complement distribution (bits of uncertainty) */
  entropy: number;
  /** Excess kurtosis (peakedness -- positive = concentrated, negative = diffuse) */
  kurtosis: number;
  /** Gini coefficient (inequality of void accumulation) */
  gini: number;
  /** Inverse Bule (entropy reduction rate per round) */
  inverseBule: number;
}

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

export function inverseBule(
  boundary: VoidBoundary,
  eta: number,
  rounds: number,
): number {
  if (rounds <= 0) return 0;
  const maxH = Math.log(boundary.counts.length);
  const dist = complementDistribution(boundary, eta);
  return (maxH - shannonEntropy(dist)) / rounds;
}

/** Take a full measurement of a void boundary */
export function measure(
  boundary: VoidBoundary,
  eta: number = 3.0,
  rounds: number = 0,
): Measurement {
  const dist = complementDistribution(boundary, eta);
  return {
    entropy: shannonEntropy(dist),
    kurtosis: excessKurtosis(dist),
    gini: giniCoefficient(dist),
    inverseBule: inverseBule(boundary, eta, rounds),
  };
}

// ============================================================================
// Gait -- the depth/speed of walking
// ============================================================================

export type Gait = 'stand' | 'trot' | 'canter' | 'gallop';

export const GAIT_DEPTH: Record<Gait, number> = {
  stand: 1,
  trot: 1,
  canter: 4,
  gallop: 16,
};

/**
 * Select gait from kurtosis. Higher kurtosis = faster gait.
 * The gait determines how deep the walker looks before stepping.
 */
export function selectGait(
  kurtosis: number,
  currentGait: Gait,
  rounds: number,
): Gait {
  if (rounds === 0) return 'stand';
  if (currentGait === 'stand') return 'trot';
  if (kurtosis >= 0.5 && currentGait === 'trot' && rounds > 10) return 'canter';
  if (kurtosis >= 2.0 && currentGait === 'canter' && rounds > 50) return 'gallop';
  if (kurtosis < 0.0 && currentGait === 'gallop') return 'canter';
  if (kurtosis < -1.5 && currentGait === 'canter') return 'trot';
  return currentGait;
}

// ============================================================================
// Timescale -- boundaries at different clock rates
// ============================================================================

/**
 * Characteristic timescale of a void boundary.
 * Ordered from fastest to slowest accumulation rate.
 */
export type Timescale =
  | 'instant'        // sub-second (inference token selection)
  | 'seconds'        // negotiation rounds
  | 'minutes'        // conversation turns
  | 'hours'          // session-level patterns
  | 'days'           // daily behavioral cycles
  | 'weeks'          // mental health fluctuations
  | 'months'         // habit formation/dissolution
  | 'years'          // trait crystallization
  | 'lifetime'       // temperament, attachment
  | 'generational';  // cultural inheritance

/** Approximate decay rate per unit time for each timescale */
export const TIMESCALE_DECAY: Record<Timescale, number> = {
  instant: 0.9,
  seconds: 0.5,
  minutes: 0.2,
  hours: 0.1,
  days: 0.05,
  weeks: 0.02,
  months: 0.01,
  years: 0.002,
  lifetime: 0.0005,
  generational: 0.0001,
};

export interface TimescaleBoundary {
  /** The underlying void boundary */
  boundary: VoidBoundary;
  /** Characteristic timescale of this boundary */
  timescale: Timescale;
  /** Human-readable name for this boundary */
  name: string;
  /** Dimension labels (optional, for introspection) */
  dimensionLabels?: readonly string[];
}

export function createTimescaleBoundary(
  name: string,
  timescale: Timescale,
  dimensions: number,
  dimensionLabels?: readonly string[],
): TimescaleBoundary {
  return {
    boundary: createVoidBoundary(dimensions),
    timescale,
    name,
    dimensionLabels,
  };
}

/** Apply natural decay based on the boundary's timescale */
export function tickTimescaleBoundary(tb: TimescaleBoundary): void {
  decayVoidBoundary(tb.boundary, TIMESCALE_DECAY[tb.timescale]);
}

// ============================================================================
// Boundary Stack -- ordered collection of timescale boundaries
// ============================================================================

/**
 * A BoundaryStack is an ordered collection of TimescaleBoundaries.
 * The 7-layer personality is a BoundaryStack.
 * A negotiation context is a BoundaryStack.
 * An inference routing table is a BoundaryStack.
 *
 * Stacks have two flows:
 *   - Upward (constrains): deeper/slower layers constrain shallower/faster ones
 *   - Downward (contextualizes): shallower/faster layers contextualize deeper/slower ones
 */
export interface BoundaryStack {
  /** Name of this stack */
  name: string;
  /** Ordered from deepest (index 0) to shallowest (last index) */
  layers: TimescaleBoundary[];
  /** Cross-layer resonance links (indices into layers array) */
  resonances: Resonance[];
}

export function createBoundaryStack(
  name: string,
  layers: TimescaleBoundary[],
  resonances: Resonance[] = [],
): BoundaryStack {
  return { name, layers, resonances };
}

/**
 * Upward constraint: how a deeper layer shapes a shallower layer's complement.
 * Returns a bias vector that should be added to the shallower layer's counts
 * before computing its complement distribution.
 *
 * The deeper layer's complement peaks become the shallower layer's constraints --
 * where the deep layer has NOT accumulated void, the shallow layer is free to move.
 */
export function upwardConstraint(
  deeper: TimescaleBoundary,
  shallower: TimescaleBoundary,
  strength: number = 0.1,
): number[] {
  const deepDist = complementDistribution(deeper.boundary);
  const shallowDims = boundaryDimensions(shallower.boundary);
  const deepDims = boundaryDimensions(deeper.boundary);
  const bias = new Array(shallowDims).fill(0);

  if (deepDims === shallowDims) {
    // Same dimensionality: direct mapping
    for (let i = 0; i < shallowDims; i++) {
      // Invert the deep complement: where deep is free, shallow gets penalized less
      bias[i] = (1 - deepDist[i]) * strength;
    }
  } else {
    // Different dimensionality: distribute proportionally
    const ratio = deepDims / shallowDims;
    for (let i = 0; i < shallowDims; i++) {
      const deepIdx = Math.min(Math.floor(i * ratio), deepDims - 1);
      bias[i] = (1 - deepDist[deepIdx]) * strength;
    }
  }
  return bias;
}

/**
 * Downward contextualization: how a shallower layer reinterprets a deeper layer.
 * Returns a decay modulation -- dimensions where the shallow layer is active
 * decay slower in the deep layer (reinforcement through use).
 */
export function downwardContext(
  shallower: TimescaleBoundary,
  deeper: TimescaleBoundary,
  strength: number = 0.05,
): number[] {
  const shallowDist = complementDistribution(shallower.boundary);
  const deepDims = boundaryDimensions(deeper.boundary);
  const shallowDims = boundaryDimensions(shallower.boundary);
  const modulation = new Array(deepDims).fill(1.0);

  if (shallowDims === deepDims) {
    for (let i = 0; i < deepDims; i++) {
      // Where shallow is active (high complement), deep decays slower
      modulation[i] = 1.0 - shallowDist[i] * strength;
    }
  } else {
    const ratio = shallowDims / deepDims;
    for (let i = 0; i < deepDims; i++) {
      const shallowIdx = Math.min(Math.floor(i * ratio), shallowDims - 1);
      modulation[i] = 1.0 - shallowDist[shallowIdx] * strength;
    }
  }
  return modulation;
}

/**
 * Tick the entire stack: apply natural decay to all layers,
 * then propagate upward constraints and downward context.
 */
export function tickBoundaryStack(stack: BoundaryStack): void {
  // Natural decay at each timescale
  for (const layer of stack.layers) {
    tickTimescaleBoundary(layer);
  }

  // Upward pass: deeper constrains shallower
  for (let i = 0; i < stack.layers.length - 1; i++) {
    const bias = upwardConstraint(stack.layers[i], stack.layers[i + 1]);
    const shallower = stack.layers[i + 1];
    for (let d = 0; d < boundaryDimensions(shallower.boundary); d++) {
      shallower.boundary.counts[d] += bias[d];
    }
    shallower.boundary.totalEntries = shallower.boundary.counts.reduce(
      (a, b) => a + b,
      0,
    );
  }

  // Downward pass: shallower contextualizes deeper
  for (let i = stack.layers.length - 1; i > 0; i--) {
    const mod = downwardContext(stack.layers[i], stack.layers[i - 1]);
    const deeper = stack.layers[i - 1];
    for (let d = 0; d < boundaryDimensions(deeper.boundary); d++) {
      deeper.boundary.counts[d] *= mod[d];
    }
    deeper.boundary.totalEntries = deeper.boundary.counts.reduce(
      (a, b) => a + b,
      0,
    );
  }

  // Resonance: cross-layer coupling
  for (const res of stack.resonances) {
    applyResonance(stack, res);
  }
}

// ============================================================================
// Resonance -- cross-boundary coupling
// ============================================================================

/**
 * A resonance link between two non-adjacent layers in a stack.
 * When the source boundary's complement distribution concentrates,
 * the target boundary's complement distribution is pulled toward
 * the same shape.
 */
export interface Resonance {
  /** Index of source layer in the stack */
  sourceIdx: number;
  /** Index of target layer in the stack */
  targetIdx: number;
  /** Coupling strength (0-1) */
  strength: number;
  /** Human-readable description */
  description?: string;
}

export function createResonance(
  sourceIdx: number,
  targetIdx: number,
  strength: number = 0.05,
  description?: string,
): Resonance {
  return { sourceIdx, targetIdx, strength, description };
}

function applyResonance(stack: BoundaryStack, res: Resonance): void {
  const source = stack.layers[res.sourceIdx];
  const target = stack.layers[res.targetIdx];
  if (!source || !target) return;

  const sourceDist = complementDistribution(source.boundary);
  const targetDims = boundaryDimensions(target.boundary);
  const sourceDims = boundaryDimensions(source.boundary);

  if (sourceDims === targetDims) {
    for (let i = 0; i < targetDims; i++) {
      // Pull target toward source's complement shape
      target.boundary.counts[i] += sourceDist[i] * res.strength;
    }
  } else {
    const ratio = sourceDims / targetDims;
    for (let i = 0; i < targetDims; i++) {
      const srcIdx = Math.min(Math.floor(i * ratio), sourceDims - 1);
      target.boundary.counts[i] += sourceDist[srcIdx] * res.strength;
    }
  }
  target.boundary.totalEntries = target.boundary.counts.reduce(
    (a, b) => a + b,
    0,
  );
}

// ============================================================================
// Projection -- dimensionality reduction
// ============================================================================

/**
 * Project a high-dimensional boundary onto a lower-dimensional subspace.
 * This is how the 58-dim personality vector gets read as a 5-dim Big Five,
 * or how a full negotiation state collapses to a scalar utility.
 */
export function projectBoundary(
  boundary: VoidBoundary,
  projectionMatrix: number[][],
): VoidBoundary {
  const targetDims = projectionMatrix.length;
  const projected = createVoidBoundary(targetDims);
  for (let i = 0; i < targetDims; i++) {
    const row = projectionMatrix[i];
    let val = 0;
    for (let j = 0; j < row.length && j < boundary.counts.length; j++) {
      val += row[j] * boundary.counts[j];
    }
    projected.counts[i] = val;
  }
  projected.totalEntries = projected.counts.reduce((a, b) => a + b, 0);
  return projected;
}

/**
 * Flatten a BoundaryStack into a single VoidBoundary by concatenating
 * all layer counts. This is the full state vector of the system.
 */
export function flattenStack(stack: BoundaryStack): VoidBoundary {
  const allCounts: number[] = [];
  for (const layer of stack.layers) {
    allCounts.push(...layer.boundary.counts);
  }
  return {
    counts: allCounts,
    totalEntries: allCounts.reduce((a, b) => a + b, 0),
  };
}

/**
 * Measure the entire stack as a single complement distribution.
 * This gives the global view -- where across ALL timescales
 * has the void accumulated least?
 */
export function measureStack(
  stack: BoundaryStack,
  eta: number = 3.0,
  rounds: number = 0,
): Measurement {
  return measure(flattenStack(stack), eta, rounds);
}

// ============================================================================
// Walker -- the entity that moves through void space
// ============================================================================

/**
 * A Walker is a domain-agnostic void-walking agent.
 * The metacognitive c0-c3 loop is the universal algorithm:
 *   c0: Choose from complement distribution + update boundary
 *   c1: Measure distribution shape
 *   c2: Select gait from kurtosis
 *   c3: Adapt parameters (eta, exploration) from gait
 */
export interface Walker {
  /** The boundary (or stack) the walker walks */
  boundary: VoidBoundary;
  /** Temperature parameter -- higher = sharper complement */
  eta: number;
  /** Exploration rate -- probability of random step */
  exploration: number;
  /** Current gait */
  gait: Gait;
  /** Total steps taken */
  steps: number;
  /** Cumulative score (domain-specific meaning) */
  score: number;
  /** Number of gait adaptations */
  adaptations: number;
  /** Step at which last adaptation occurred */
  lastAdaptationStep: number;
}

export function createWalker(
  boundary: VoidBoundary,
  eta: number = 2.0,
  exploration: number = 0.3,
): Walker {
  return {
    boundary,
    eta,
    exploration,
    gait: 'stand',
    steps: 0,
    score: 0,
    adaptations: 0,
    lastAdaptationStep: 0,
  };
}

/** c0: Choose a dimension from the complement distribution */
export function c0Choose(walker: Walker, rng: () => number): number {
  const N = walker.boundary.counts.length;
  if (rng() < walker.exploration) return Math.floor(rng() * N);
  const dist = complementDistribution(walker.boundary, walker.eta);
  return sampleComplement(dist, rng);
}

/**
 * c0: Update the boundary after observing an outcome.
 * The rejection predicate is domain-specific:
 *   - Negotiation: myPayoff < theirPayoff
 *   - Personality: stimulus triggered avoidance
 *   - Inference: token was pruned
 */
export function c0Update(
  walker: Walker,
  dimensionIdx: number,
  rejection: number,
  reward: number = 0,
): void {
  if (rejection > 0) {
    updateVoidBoundary(walker.boundary, dimensionIdx, rejection);
  }
  walker.score += reward;
  walker.steps++;
}

/** c1: Measure the walker's current state */
export function c1Measure(walker: Walker): Measurement {
  return measure(walker.boundary, walker.eta, walker.steps);
}

/** c2 + c3: Adapt the walker's gait and parameters */
export function c2c3Adapt(walker: Walker): void {
  if (walker.steps - walker.lastAdaptationStep < 10) return;

  const m = c1Measure(walker);
  const newGait = selectGait(m.kurtosis, walker.gait, walker.steps);
  if (newGait !== walker.gait) walker.gait = newGait;

  switch (walker.gait) {
    case 'stand':
      break;
    case 'trot':
      walker.exploration = Math.min(0.4, walker.exploration + 0.01);
      walker.eta = Math.max(1.0, walker.eta - 0.05);
      break;
    case 'canter':
      walker.exploration = Math.max(0.05, walker.exploration - 0.005);
      walker.eta = Math.min(5.0, walker.eta + 0.05);
      break;
    case 'gallop':
      walker.exploration = Math.max(0.01, walker.exploration - 0.01);
      walker.eta = Math.min(8.0, walker.eta + 0.1);
      break;
  }

  walker.adaptations++;
  walker.lastAdaptationStep = walker.steps;
}

// ============================================================================
// Stack Walker -- walks an entire BoundaryStack
// ============================================================================

/**
 * A StackWalker maintains a Walker per layer and coordinates
 * the inter-layer flows. This is the full system: personality
 * tracking, negotiation context, inference routing -- all the same.
 */
export interface StackWalker {
  stack: BoundaryStack;
  walkers: Walker[];
}

export function createStackWalker(stack: BoundaryStack): StackWalker {
  return {
    stack,
    walkers: stack.layers.map((layer) =>
      createWalker(layer.boundary),
    ),
  };
}

/**
 * Step the stack walker:
 *   1. Each layer's walker takes a step (c0)
 *   2. Each layer's walker adapts (c2c3)
 *   3. The stack propagates constraints and context
 */
export function stepStackWalker(
  sw: StackWalker,
  /** Per-layer rejection magnitudes (from domain-specific observation) */
  rejections: { layerIdx: number; dimensionIdx: number; magnitude: number; reward?: number }[],
): void {
  // Apply domain-specific rejections
  for (const r of rejections) {
    const walker = sw.walkers[r.layerIdx];
    if (walker) {
      c0Update(walker, r.dimensionIdx, r.magnitude, r.reward ?? 0);
    }
  }

  // Adapt each walker
  for (const walker of sw.walkers) {
    c2c3Adapt(walker);
  }

  // Propagate inter-layer flows
  tickBoundaryStack(sw.stack);
}

/** Measure the full stack walker state */
export function measureStackWalker(sw: StackWalker): {
  layers: Measurement[];
  global: Measurement;
  gaits: Gait[];
} {
  return {
    layers: sw.walkers.map((w) => c1Measure(w)),
    global: measureStack(sw.stack),
    gaits: sw.walkers.map((w) => w.gait),
  };
}
