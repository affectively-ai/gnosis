import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildGeneratedCoverage,
  normalizeSectionName,
  resolveCanonicalLedgerPath,
  toolNameFromTheoremId,
  type GeneratedCoverage,
} from './generate-ledger-mcp-coverage.js';

const { equal, ok } = assert;

function assertGeneratedCounts(generated: GeneratedCoverage): void {
  equal(generated.rows.length, 1078);
  equal(generated.audit.sectionCount, 122);
  equal(generated.audit.entries.length, generated.rows.length);
  equal(generated.audit.duplicateTheoremIds.length, 0);
}

function assertNormalizationSamples(): void {
  const normalizedRaceWinner = normalizeSectionName(
    'Race Winner Correctness (Track Omicron)'
  );
  const normalizedPersonality = normalizeSectionName(
    'Five-Parameter Void Walker Personality Model (ch17 section 15.10.7, 15.12)'
  );
  const normalizedSelfHosting = normalizeSectionName(
    '72. Self-Hosting Optimality (§10.6)'
  );

  equal(normalizedRaceWinner, 'Race Winner Correctness');
  equal(normalizedPersonality, 'Five-Parameter Void Walker Personality Model');
  equal(normalizedSelfHosting, 'Self-Hosting Optimality');
}

function assertCoverageFlags(generated: GeneratedCoverage): void {
  let missingCoverageCount = 0;
  let governanceCovered = false;
  let economicsCovered = false;

  for (const entry of generated.audit.entries) {
    if (!entry.server || !entry.tool || !entry.coverageKind) {
      missingCoverageCount += 1;
    }
    if (entry.server === 'governance-mcp') {
      governanceCovered = true;
    }
    if (entry.server === 'economics-mcp') {
      economicsCovered = true;
    }
  }

  equal(missingCoverageCount, 0);
  ok(governanceCovered);
  ok(economicsCovered);
}

function assertSemanticAliases(generated: GeneratedCoverage): void {
  const entriesByTheoremId = new Map(
    generated.audit.entries.map((entry) => [entry.theoremId, entry])
  );

  for (const entry of generated.audit.entries) {
    if (entry.coverageKind !== 'semantic') {
      continue;
    }

    ok(entry.theoremId !== entry.toolTheoremId);
    equal(entry.tool, toolNameFromTheoremId(entry.toolTheoremId));

    const target = entriesByTheoremId.get(entry.toolTheoremId);
    ok(target, `Missing semantic alias target for ${entry.theoremId}.`);
    equal(entry.server, target.server);
    equal(entry.tool, target.tool);
    ok(target.coverageKind !== 'semantic');
  }
}

export function main(): void {
  const ledgerPath = resolveCanonicalLedgerPath();
  const source = readFileSync(ledgerPath, 'utf8');
  const generated = buildGeneratedCoverage(source);

  assertGeneratedCounts(generated);
  assertNormalizationSamples();
  assertCoverageFlags(generated);
  assertSemanticAliases(generated);
  return;
}
