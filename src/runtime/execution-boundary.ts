/**
 * Lifecycle manager for VoidBoundary during topology execution.
 * Tracks void accumulation through FORK/RACE/FOLD/VENT operations.
 */

import {
  VoidBoundary,
  createVoidBoundary,
  updateVoidBoundary,
  mergeVoidBoundaries,
  buleyeanPositivity,
  buleyeanWeight,
  teleportDeficit,
  complementDistribution,
  shannonEntropy,
} from '../void.js';

export interface ExecutionBoundarySnapshot {
  boundary: VoidBoundary;
  positivity: boolean;
  deficit: number;
  entropy: number;
  weights: number[];
}

export class ExecutionBoundary {
  private boundary: VoidBoundary;
  private rounds: number = 0;

  constructor(dimensions: number = 0) {
    this.boundary = createVoidBoundary(dimensions);
  }

  /** Called on FORK: create a boundary sized to the number of branches */
  fork(branchCount: number): void {
    if (this.boundary.counts.length === 0) {
      this.boundary = createVoidBoundary(branchCount);
    } else {
      // Expand dimensions if needed
      while (this.boundary.counts.length < branchCount) {
        this.boundary.counts.push(0);
      }
    }
  }

  /** Called on RACE: record a loser in the void boundary */
  raceLoser(loserIdx: number): void {
    if (loserIdx >= 0 && loserIdx < this.boundary.counts.length) {
      updateVoidBoundary(this.boundary, loserIdx);
      this.rounds++;
    }
  }

  /** Called on FOLD: merge another boundary into this one */
  fold(other: VoidBoundary): void {
    this.boundary = mergeVoidBoundaries(this.boundary, other);
    this.rounds++;
  }

  /** Called on VENT: increment void entry for a vented dimension */
  vent(dimensionIdx: number = 0): void {
    if (this.boundary.counts.length === 0) {
      this.boundary = createVoidBoundary(1);
    }
    const idx = Math.min(dimensionIdx, this.boundary.counts.length - 1);
    updateVoidBoundary(this.boundary, Math.max(0, idx));
    this.rounds++;
  }

  /** Get the raw VoidBoundary */
  get void(): VoidBoundary {
    return this.boundary;
  }

  /** Get Buleyean weights for all dimensions */
  get weights(): number[] {
    return this.boundary.counts.map((v) => buleyeanWeight(this.rounds, v));
  }

  /** Check Buleyean positivity */
  get isPositive(): boolean {
    return buleyeanPositivity(this.boundary, this.rounds);
  }

  /** Get deficit */
  get deficit(): number {
    return teleportDeficit(this.boundary);
  }

  /** Take a snapshot of the current state */
  snapshot(): ExecutionBoundarySnapshot {
    const dist = complementDistribution(this.boundary);
    return {
      boundary: {
        counts: [...this.boundary.counts],
        totalEntries: this.boundary.totalEntries,
      },
      positivity: this.isPositive,
      deficit: this.deficit,
      entropy: shannonEntropy(dist),
      weights: this.weights,
    };
  }

  /** Merge with another ExecutionBoundary */
  mergeWith(other: ExecutionBoundary): void {
    this.fold(other.void);
  }

  /** Clone this boundary */
  clone(): ExecutionBoundary {
    const eb = new ExecutionBoundary(this.boundary.counts.length);
    eb.boundary = {
      counts: [...this.boundary.counts],
      totalEntries: this.boundary.totalEntries,
    };
    eb.rounds = this.rounds;
    return eb;
  }
}
