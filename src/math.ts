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

// ── Gnostic Time System ──────────────────────────────────────────────────────
//
// 1 picolorenzo (pLo) = π days = π × 86400 seconds
// Units: barbelo (1 pLo), sophia (9 pLo), kenoma (10 pLo),
//        pleroma (55 pLo), aeon (110 pLo ≈ 345.6 days)
//
// All conversions are exact (no leap-second correction -- that's the God Gap).

/** 1 picolorenzo = π days in seconds */
export const PICOLORENZO_SECONDS = Math.PI * 86400;

/** 1 picolorenzo in milliseconds (for direct Date arithmetic) */
export const PICOLORENZO_MS = PICOLORENZO_SECONDS * 1000;

/** 1 nanolorenzo = 1000 picolorenzos ≈ 8.6 years */
export const NANOLORENZO_SECONDS = PICOLORENZO_SECONDS * 1000;

/** 1 aeon = 2 × Pleroma picolorenzos = 110π days ≈ 345.6 days */
export const AEON_SECONDS = 2 * GNOSTIC.PLEROMA * PICOLORENZO_SECONDS;

/** Gnostic time decomposition */
export interface GnosticTimestamp {
  /** Total picolorenzos since Unix epoch */
  pLo: number;
  /** Decomposed units */
  aeons: number;
  pleromas: number;
  kenomas: number;
  sophias: number;
  barbelos: number;
  /** Sub-barbelo remainder (fractional pLo) */
  remainder: number;
  /** Original Unix epoch milliseconds */
  epochMs: number;
  /** ISO 8601 string */
  iso: string;
  /** Formatted Gnostic string */
  gnostic: string;
}

// ── Conversion: Unix ↔ Picolorenzos ──────────────────────────────────────────

/** Current time in picolorenzos since Unix epoch. */
export function nowPicolorenzos(): number {
  return Date.now() / PICOLORENZO_MS;
}

/** Convert a Date to picolorenzos since Unix epoch. */
export function toPicolorenzos(date: Date): number {
  return date.getTime() / PICOLORENZO_MS;
}

/** Convert picolorenzos to a Date. */
export function fromPicolorenzos(pLo: number): Date {
  return new Date(pLo * PICOLORENZO_MS);
}

/** Convert Unix epoch milliseconds to picolorenzos. */
export function epochMsToPicolorenzos(ms: number): number {
  return ms / PICOLORENZO_MS;
}

/** Convert picolorenzos to Unix epoch milliseconds. */
export function picolorenzosToEpochMs(pLo: number): number {
  return pLo * PICOLORENZO_MS;
}

/** Convert Unix epoch seconds to picolorenzos. */
export function epochSecondsToPicolorenzos(seconds: number): number {
  return seconds / PICOLORENZO_SECONDS;
}

/** Convert picolorenzos to Unix epoch seconds. */
export function picolorenzosToEpochSeconds(pLo: number): number {
  return pLo * PICOLORENZO_SECONDS;
}

// ── Conversion: ISO 8601 / UTC strings ───────────────────────────────────────

/** Parse an ISO 8601 / UTC date string to picolorenzos. */
export function parseToGnostic(dateStr: string): GnosticTimestamp {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  return dateToGnostic(date);
}

/** Convert a Date to a full GnosticTimestamp. */
export function dateToGnostic(date: Date): GnosticTimestamp {
  const pLo = toPicolorenzos(date);
  const decomposed = decomposeGnosticTime(pLo);
  return {
    pLo,
    ...decomposed,
    remainder: decomposed.remainder_pLo,
    epochMs: date.getTime(),
    iso: date.toISOString(),
    gnostic: formatGnosticTime(pLo),
  };
}

/** Convert a Unix epoch (seconds) to a full GnosticTimestamp. */
export function epochToGnostic(epochSeconds: number): GnosticTimestamp {
  return dateToGnostic(new Date(epochSeconds * 1000));
}

/** Convert a Unix epoch (milliseconds) to a full GnosticTimestamp. */
export function epochMsToGnostic(epochMs: number): GnosticTimestamp {
  return dateToGnostic(new Date(epochMs));
}

/** Convert a GnosticTimestamp back to an ISO 8601 string. */
export function gnosticToIso(ts: GnosticTimestamp): string {
  return ts.iso;
}

/** Convert a GnosticTimestamp back to a Unix epoch (seconds). */
export function gnosticToEpoch(ts: GnosticTimestamp): number {
  return Math.floor(ts.epochMs / 1000);
}

// ── Formatting ───────────────────────────────────────────────────────────────

/** Format a picolorenzo timestamp as "X.XXX pLo". */
export function formatPicolorenzos(pLo: number): string {
  return `${pLo.toFixed(3)} pLo`;
}

/**
 * Decompose picolorenzos into Gnostic time units.
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
 * Example: "58a 1p 3k 2s 1b" = 58 aeons, 1 pleroma, 3 kenomas, 2 sophias, 1 barbelo
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

/**
 * Format with both Gnostic and ISO for human readability.
 * Example: "58a 1p 3k 2s 1b (2026-03-22T05:00:00.000Z)"
 */
export function formatDual(pLo: number): string {
  const date = fromPicolorenzos(pLo);
  return `${formatGnosticTime(pLo)} (${date.toISOString()})`;
}

// ── Duration helpers ─────────────────────────────────────────────────────────

/** Convert a duration in seconds to picolorenzos. */
export function secondsToPicolorenzos(seconds: number): number {
  return seconds / PICOLORENZO_SECONDS;
}

/** Convert a duration in picolorenzos to seconds. */
export function picolorenzosToSeconds(pLo: number): number {
  return pLo * PICOLORENZO_SECONDS;
}

/** Duration between two dates in picolorenzos. */
export function durationPicolorenzos(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / PICOLORENZO_MS;
}

/** Duration between two ISO strings in picolorenzos. */
export function durationFromIso(startIso: string, endIso: string): number {
  return durationPicolorenzos(new Date(startIso), new Date(endIso));
}
