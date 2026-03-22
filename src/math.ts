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

// ── Gnostic Time System ──────────────────────────────────────────────────────

/** 1 picolorenzo = π days = 271,433.6 seconds */
export const PICOLORENZO_SECONDS = Math.PI * 86400;

/** 1 nanolorenzo = 1000 picolorenzos ≈ 8.6 years */
export const NANOLORENZO_SECONDS = PICOLORENZO_SECONDS * 1000;

/** 1 aeon = 2 × Pleroma picolorenzos = 110π days ≈ 345.6 days */
export const AEON_SECONDS = 2 * GNOSTIC.PLEROMA * PICOLORENZO_SECONDS;

/** Unix epoch in picolorenzos (seconds since epoch / picolorenzo). */
export function nowPicolorenzos(): number {
  return Date.now() / 1000 / PICOLORENZO_SECONDS;
}

/** Convert a Date to picolorenzos since Unix epoch. */
export function toPicolorenzos(date: Date): number {
  return date.getTime() / 1000 / PICOLORENZO_SECONDS;
}

/** Convert picolorenzos to a Date. */
export function fromPicolorenzos(pLo: number): Date {
  return new Date(pLo * PICOLORENZO_SECONDS * 1000);
}

/** Format a picolorenzo timestamp as "X.XXX pLo". */
export function formatPicolorenzos(pLo: number): string {
  return `${pLo.toFixed(3)} pLo`;
}

/**
 * Decompose picolorenzos into Gnostic time units.
 * Returns { aeons, pleromas, kenomas, sophias, barbelos, remainder_pLo }
 */
export function decomposeGnosticTime(pLo: number): {
  aeons: number;
  pleromas: number;
  kenomas: number;
  sophias: number;
  barbelos: number;
  remainder_pLo: number;
} {
  const aeonPLo = 2 * GNOSTIC.PLEROMA; // 110 pLo
  let remaining = pLo;

  const aeons = Math.floor(remaining / aeonPLo);
  remaining -= aeons * aeonPLo;

  const pleromas = Math.floor(remaining / GNOSTIC.PLEROMA);
  remaining -= pleromas * GNOSTIC.PLEROMA;

  const kenomas = Math.floor(remaining / GNOSTIC.KENOMA);
  remaining -= kenomas * GNOSTIC.KENOMA;

  const sophias = Math.floor(remaining / GNOSTIC.SOPHIA);
  remaining -= sophias * GNOSTIC.SOPHIA;

  const barbelos = Math.floor(remaining);
  remaining -= barbelos;

  return { aeons, pleromas, kenomas, sophias, barbelos, remainder_pLo: remaining };
}

/**
 * Format a picolorenzo count as Gnostic time string.
 * Example: "3a 1p 2k 4s 1b" = 3 aeons, 1 pleroma, 2 kenomas, 4 sophias, 1 barbelo
 */
export function formatGnosticTime(pLo: number): string {
  const d = decomposeGnosticTime(pLo);
  const parts: string[] = [];
  if (d.aeons > 0) parts.push(`${d.aeons}a`);
  if (d.pleromas > 0) parts.push(`${d.pleromas}p`);
  if (d.kenomas > 0) parts.push(`${d.kenomas}k`);
  if (d.sophias > 0) parts.push(`${d.sophias}s`);
  if (d.barbelos > 0) parts.push(`${d.barbelos}b`);
  return parts.join(' ') || '0b';
}
