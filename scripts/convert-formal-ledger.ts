/**
 * convert-formal-ledger.ts -- Batch convert TLA+ and Lean to .gg proof topologies
 *
 * Reads every .tla and .lean file in the formal ledger and emits
 * one .gg proof topology per file into gnosis/examples/proofs/.
 *
 * Usage:
 *   gnode run scripts/convert-formal-ledger.ts
 *
 * The entire paper -- 110 TLA+ specs, 155 Lean theorem files --
 * becomes 265 .gg proof topologies. One file per theorem.
 * The topology IS the proof. The clunky Lean/TLA+ is just the compilation target.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';
import { tlaToGg, leanToGg } from '../../aeon-logic/src/buleyean-proof.js';

const FORMAL_DIR = join(
  __dirname,
  '../../aeon/docs/ebooks/145-log-rolling-pipelined-prefill/companion-tests/formal',
);
const LEAN_DIR = join(FORMAL_DIR, 'lean/Lean/ForkRaceFoldTheorems');
const OUTPUT_DIR = join(__dirname, '../examples/proofs');

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function convertTlaFiles(): number {
  if (!existsSync(FORMAL_DIR)) {
    console.log(`TLA+ directory not found: ${FORMAL_DIR}`);
    return 0;
  }

  const tlaFiles = readdirSync(FORMAL_DIR)
    .filter((f) => f.endsWith('.tla') && !f.startsWith('__tmp'));

  let converted = 0;
  for (const file of tlaFiles) {
    const name = basename(file, '.tla');
    const source = readFileSync(join(FORMAL_DIR, file), 'utf-8');
    const gg = tlaToGg(source);
    const outPath = join(OUTPUT_DIR, `${name}.gg`);
    writeFileSync(outPath, gg);
    converted++;
    console.log(`  TLA+ → GG: ${name}.tla → ${name}.gg`);
  }

  return converted;
}

function convertLeanFiles(): number {
  if (!existsSync(LEAN_DIR)) {
    console.log(`Lean directory not found: ${LEAN_DIR}`);
    return 0;
  }

  const leanFiles = readdirSync(LEAN_DIR)
    .filter((f) => f.endsWith('.lean'));

  let converted = 0;
  for (const file of leanFiles) {
    const name = basename(file, '.lean');
    const source = readFileSync(join(LEAN_DIR, file), 'utf-8');
    const gg = leanToGg(source);
    const outPath = join(OUTPUT_DIR, `${name}.gg`);

    // Don't overwrite TLA+-generated files -- Lean may have more detail
    // If both exist, append '-lean' suffix
    const finalPath = existsSync(outPath)
      ? join(OUTPUT_DIR, `${name}-lean.gg`)
      : outPath;

    writeFileSync(finalPath, gg);
    converted++;
    console.log(`  Lean → GG: ${name}.lean → ${basename(finalPath)}`);
  }

  return converted;
}

// Main
console.log('Converting formal ledger to .gg proof topologies...');
console.log(`Output: ${OUTPUT_DIR}`);
console.log('');

ensureDir(OUTPUT_DIR);

console.log('=== TLA+ Specifications ===');
const tlaCount = convertTlaFiles();
console.log(`\n  ${tlaCount} TLA+ specs converted`);

console.log('\n=== Lean 4 Theorems ===');
const leanCount = convertLeanFiles();
console.log(`\n  ${leanCount} Lean theorems converted`);

console.log(`\n=== Total: ${tlaCount + leanCount} .gg proof topologies ===`);
console.log('The entire paper is now topology.');
