/**
 * build-config.ts -- Polyglot race configuration for Betti.
 *
 * Each betti.gg node becomes a raceable function entry, and the polyglot
 * build system races TypeScript/Rust/Go/Python implementations of each
 * handler to find the fastest for compile-time optimization.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { PolyglotBuildConfig } from '../polyglot-build.js';

/**
 * Default Betti polyglot build config.
 * Source is betti.gg, candidate languages are the core four.
 */
export function createBettiBuildConfig(
  bettiSourcePath?: string
): PolyglotBuildConfig {
  const sourcePath =
    bettiSourcePath ??
    path.resolve(__dirname, '../../betti.gg');

  const bettiSource = fs.readFileSync(sourcePath, 'utf-8');

  return {
    sourceFiles: [sourcePath],
    candidateLanguages: ['typescript', 'rust', 'go', 'python'],
    testInput: bettiSource,
    maxCandidates: 4,
    raceTimeoutMs: 10000,
    speculative: true,
    skipErrorThreshold: 0.5,
  };
}

/**
 * Betti handler names that are raceable.
 * Each maps to a function that can be scaffolded in multiple languages.
 */
export const BETTI_RACEABLE_HANDLERS = [
  'source_reader',
  'strip_comments',
  'node_lexer',
  'edge_lexer',
  'property_lexer',
  'ast_assembler',
  'betti_verifier',
  'wasm_emitter',
] as const;

export type BettiHandler = (typeof BETTI_RACEABLE_HANDLERS)[number];
