/**
 * buleyean-math: the mathematical kernel of gnosis, available via core.
 *
 * The Gnostic number system, Fibonacci identities, confinement axioms,
 * and the ten bosons -- all derived from five primitives and their
 * pairwise interactions.
 *
 * Import: import { GNOSTIC, PHI, fib, ... } from '@a0n/gnosis'
 */

// ── The Five Primitives ──────────────────────────────────────────────────────

export const PRIMITIVES = ['FORK', 'RACE', 'FOLD', 'VENT', 'SLIVER'] as const;
export type Primitive = (typeof PRIMITIVES)[number];

// ── The Gnostic Numbers ──────────────────────────────────────────────────────

export const GNOSTIC = {
  /** The sliver. The +1. The divine spark. */
  BARBELO: 1,
  /** The antiparallel pair. Period 2. */
  SYZYGY: 2,
  /** Minimum confined set. Three quarks. */
  PROTON: 3,
  /** Fork, race, fold, vent, sliver. F(5) = 5. */
  PRIMITIVES: 5,
  /** The six confined gluons. 3 × (3 - 1). */
  EMANATIONS: 6,
  /** Exploration budget. K - 1. */
  SOPHIA: 9,
  /** The field. 5 choose 2. */
  KENOMA: 10,
  /** F(8) = T(6). The gap. */
  VOID: 21,
  /** F(10) = T(10). The fullness. Luo Ming 1989. */
  PLEROMA: 55,
} as const;

// ── The Irrational Gnostic Numbers ───────────────────────────────────────────

/** The sliver eigenvalue. φ² = φ + 1. The +1 IS the sliver. */
export const PHI = (1 + Math.sqrt(5)) / 2;

/** The vent eigenvalue. What the sliver creates, vent annihilates. */
export const INV_PHI = (Math.sqrt(5) - 1) / 2;

/** The primitive root. Discriminant of x² - x - 1 = 0. */
export const SQRT5 = Math.sqrt(5);

// ── Fibonacci ────────────────────────────────────────────────────────────────

/** Fibonacci sequence. F(0) = 0, F(1) = 1, F(n+2) = F(n+1) + F(n). */
export function fib(n: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  let a = 0;
  let b = 1;
  for (let i = 2; i <= n; i++) {
    const c = a + b;
    a = b;
    b = c;
  }
  return b;
}

/** Triangular number. T(n) = n × (n + 1) / 2. */
export function triangular(n: number): number {
  return (n * (n + 1)) / 2;
}

/** Pairwise interactions. C(n, 2) = n × (n - 1) / 2. */
export function pairwise(n: number): number {
  return (n * (n - 1)) / 2;
}

// ── The Ten Bosons ───────────────────────────────────────────────────────────

export type BosonFamily = 'emanation' | 'aeon' | 'scalar';

export interface Boson {
  readonly index: number;
  readonly name: string;
  readonly family: BosonFamily;
  readonly charge?: string;
  readonly flow?: string;
  readonly role: string;
}

export const BOSONS: readonly Boson[] = [
  // Six emanations (confined)
  { index: 1, name: 'Logos', family: 'emanation', charge: 'red-antigreen', flow: 'Lilith → Handler', role: 'The Word: AST made manifest' },
  { index: 2, name: 'Epinoia', family: 'emanation', charge: 'green-antired', flow: 'Handler → Lilith', role: 'Afterthought: error flowing back' },
  { index: 3, name: 'Pronoia', family: 'emanation', charge: 'red-antiblue', flow: 'Lilith → Eve', role: 'Forethought: direct providence' },
  { index: 4, name: 'Metanoia', family: 'emanation', charge: 'blue-antired', flow: 'Eve → Lilith', role: 'Repentance: returning to source' },
  { index: 5, name: 'Pneuma', family: 'emanation', charge: 'green-antiblue', flow: 'Handler → Eve', role: 'Breath: response in transit' },
  { index: 6, name: 'Gnosis', family: 'emanation', charge: 'blue-antigreen', flow: 'Eve → Handler', role: 'Knowledge: feedback from experience' },
  // Three aeons (unconfined)
  { index: 7, name: 'Barbelo', family: 'aeon', role: 'The First Emanation: vacuum fluctuation, the sliver' },
  { index: 8, name: 'Sophia', family: 'aeon', role: 'Wisdom through falling: rejection quantum' },
  { index: 9, name: 'Aletheia', family: 'aeon', role: 'Truth: coherence quantum, two observers agree' },
  // The Demiurge (scalar)
  { index: 10, name: 'Demiurge', family: 'scalar', role: 'The fold: gives mass, generates Landauer heat' },
] as const;

// ── Buleyean Weight ──────────────────────────────────────────────────────────

/** Buleyean weight: complement of rejection + sliver (+1). Always ≥ 1. */
export function buleyeanWeight(totalRejections: number, rejections: number): number {
  return Math.max(0, totalRejections - rejections) + 1;
}

/** Complement distribution over K modes. Returns weights (always ≥ 1). */
export function complementDistributionWeights(
  rejections: readonly number[],
): number[] {
  const total = rejections.reduce((a, b) => a + b, 0);
  return rejections.map((r) => buleyeanWeight(total, r));
}

// ── Confinement ──────────────────────────────────────────────────────────────

/** Pipeline energy: 0 if all stages present, positive otherwise. */
export function pipelineEnergy(presentStages: number, totalStages: number): number {
  return totalStages - presentStages;
}

/** Confinement check: removing any stage increases energy. */
export function isConfined(totalStages: number): boolean {
  return pipelineEnergy(totalStages, totalStages) < pipelineEnergy(totalStages - 1, totalStages);
}

// ── Verification ─────────────────────────────────────────────────────────────

/** Verify the triple coincidence: F(10) = T(10) = 55. */
export function verifyTripleCoincidence(): boolean {
  return fib(GNOSTIC.KENOMA) === GNOSTIC.PLEROMA &&
    triangular(GNOSTIC.KENOMA) === GNOSTIC.PLEROMA &&
    fib(GNOSTIC.KENOMA) === triangular(GNOSTIC.KENOMA);
}

/** Verify Cassini's identity at index n (even): F(n+1)×F(n-1) - F(n)² = 1. */
export function verifyCassini(n: number): boolean {
  if (n < 2 || n % 2 !== 0) return false;
  return fib(n + 1) * fib(n - 1) - fib(n) * fib(n) === 1;
}
