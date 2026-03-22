import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  SECTION_DEFAULTS,
  THEOREM_OVERRIDES,
  type CoverageKind,
  type OwnershipOverride,
} from './ledger-mcp-ownership.js';

export interface LedgerRow {
  readonly rowIndex: number;
  readonly theoremId: string;
  readonly section: string;
  readonly normalizedSection: string;
  readonly claim: string;
  readonly mechanization: string;
  readonly status: string;
}

export interface LedgerAuditEntry {
  readonly rowIndex: number;
  readonly theoremId: string;
  readonly section: string;
  readonly normalizedSection: string;
  readonly server: string;
  readonly namespace: string;
  readonly toolTheoremId: string;
  readonly tool: string;
  readonly coverageKind: CoverageKind;
}

export interface LedgerAuditDocument {
  readonly version: 1;
  readonly generatedAt: string;
  readonly canonicalLedgerPath: string;
  readonly rowCount: number;
  readonly sectionCount: number;
  readonly duplicateTheoremIds: readonly string[];
  readonly entries: readonly LedgerAuditEntry[];
}

export interface GeneratedCoverage {
  readonly rows: readonly LedgerRow[];
  readonly audit: LedgerAuditDocument;
  readonly serverFiles: ReadonlyMap<string, string>;
}

interface ResolvedOwnership extends OwnershipOverride {
  readonly server: string;
  readonly coverageKind: CoverageKind;
  readonly toolTheoremId?: string;
}

const CANONICAL_LEDGER_RELATIVE_PATH =
  'open-source/aeon/docs/ebooks/145-log-rolling-pipelined-prefill/companion-tests/formal/THEOREM_LEDGER.md';
export const EXPECTED_CANONICAL_LEDGER_ROW_COUNT = 1355;
export const EXPECTED_CANONICAL_LEDGER_SECTION_COUNT = 137;

function resolveRepoRoot(): string {
  return process.cwd();
}

function resolveCanonicalLedgerFilePath(): string {
  return path.join(resolveRepoRoot(), CANONICAL_LEDGER_RELATIVE_PATH);
}

function resolveAuditOutputPath(): string {
  return path.join(
    resolveRepoRoot(),
    'apps/mcp-superserver/src/ledger-tool-audit.generated.json'
  );
}

export function resolveCanonicalLedgerPath(): string {
  return resolveCanonicalLedgerFilePath();
}

export function normalizeSectionName(section: string): string {
  return section
    .replace(/^\d+\.\s*/u, '')
    .replace(/\s*\([^)]*\)\s*/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function splitMarkdownRow(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inBackticks = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '`') {
      inBackticks = !inBackticks;
      current += char;
      continue;
    }

    if (char === '|' && !inBackticks) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());

  if (cells[0] === '') {
    cells.shift();
  }
  if (cells[cells.length - 1] === '') {
    cells.pop();
  }

  return cells;
}

function cleanCell(cell: string): string {
  return cell
    .replace(/^`/u, '')
    .replace(/`$/u, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function parseCanonicalLedgerRows(
  source = readFileSync(resolveCanonicalLedgerFilePath(), 'utf8')
): LedgerRow[] {
  const rows: LedgerRow[] = [];
  let currentSection = '';
  let rowIndex = 0;

  for (const line of source.split(/\r?\n/gu)) {
    if (line.startsWith('### ')) {
      currentSection = line.slice(4).trim();
      continue;
    }

    if (line.startsWith('## ')) {
      currentSection = line.slice(3).trim();
      continue;
    }

    if (!line.startsWith('|')) {
      continue;
    }

    const cells = splitMarkdownRow(line);
    if (cells.length < 3) {
      continue;
    }

    const theoremId = cleanCell(cells[0] ?? '');
    if (!/^(THM|PRED|COR|PROP)-/u.test(theoremId)) {
      continue;
    }

    const mechanization =
      cells.length >= 4
        ? cleanCell(cells[cells.length - 2] ?? '')
        : cleanCell(cells[2] ?? '');
    const status =
      cells.length >= 4 ? cleanCell(cells[cells.length - 1] ?? '') : '';

    rowIndex += 1;
    rows.push({
      rowIndex,
      theoremId,
      section: currentSection,
      normalizedSection: normalizeSectionName(currentSection),
      claim: cleanCell(cells[1] ?? ''),
      mechanization,
      status,
    });
  }

  return rows;
}

function theoremOverrideKey(section: string, theoremId: string): string {
  return `${normalizeSectionName(section)}::${theoremId}`;
}

function namespaceFromServer(server: string): string {
  return server.endsWith('-mcp') ? server.slice(0, -4) : server;
}

export function toolNameFromTheoremId(theoremId: string): string {
  return theoremId
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '_')
    .replace(/^_+/u, '')
    .replace(/_+$/u, '');
}

function summarizeClaim(claim: string): string {
  const summary = claim.replace(/\s+/gu, ' ').trim();
  if (summary.length <= 240) {
    return summary;
  }
  return `${summary.slice(0, 237)}...`;
}

function escapeForComment(value: string): string {
  return value.replace(/\*\//gu, '* /');
}

function createSectionDefaultMap(): ReadonlyMap<string, ResolvedOwnership> {
  return new Map(
    SECTION_DEFAULTS.map((entry) => [
      normalizeSectionName(entry.section),
      {
        server: entry.server,
        coverageKind: entry.coverageKind ?? 'wrapper',
      },
    ])
  );
}

function resolveDirectOwnership(
  row: LedgerRow,
  sectionDefaults: ReadonlyMap<string, ResolvedOwnership>
): ResolvedOwnership | null {
  const override =
    THEOREM_OVERRIDES[theoremOverrideKey(row.section, row.theoremId)] ??
    THEOREM_OVERRIDES[row.theoremId];
  if (override) {
    return {
      server: override.server,
      coverageKind: override.coverageKind ?? 'wrapper',
      toolTheoremId: override.toolTheoremId,
    };
  }

  const defaultOwnership = sectionDefaults.get(row.normalizedSection);
  return defaultOwnership ?? null;
}

function resolvedOwnershipEqual(
  left: ResolvedOwnership,
  right: ResolvedOwnership
): boolean {
  return (
    left.server === right.server &&
    left.coverageKind === right.coverageKind &&
    left.toolTheoremId === right.toolTheoremId
  );
}

function createTheoremOwnershipMap(
  rows: readonly LedgerRow[],
  sectionDefaults: ReadonlyMap<string, ResolvedOwnership>
): ReadonlyMap<string, ResolvedOwnership> {
  const theoremOwnership = new Map<string, ResolvedOwnership>();

  for (const row of rows) {
    const ownership = resolveDirectOwnership(row, sectionDefaults);
    if (!ownership) {
      continue;
    }

    const existing = theoremOwnership.get(row.theoremId);
    if (existing && !resolvedOwnershipEqual(existing, ownership)) {
      throw new Error(
        `Conflicting ownership for theorem "${row.theoremId}": ${existing.server} vs ${ownership.server}.`
      );
    }

    theoremOwnership.set(row.theoremId, ownership);
  }

  return theoremOwnership;
}

function resolveOwnership(
  row: LedgerRow,
  sectionDefaults: ReadonlyMap<string, ResolvedOwnership>,
  theoremOwnership: ReadonlyMap<string, ResolvedOwnership>
): ResolvedOwnership {
  const directOwnership = resolveDirectOwnership(row, sectionDefaults);
  if (directOwnership) {
    return directOwnership;
  }

  const fallbackOwnership = theoremOwnership.get(row.theoremId);
  if (fallbackOwnership) {
    return fallbackOwnership;
  }

  throw new Error(
    `No ownership mapping for section "${row.section}" (${row.theoremId}).`
  );
}

function renderLedgerToolsFile(
  server: string,
  rows: readonly LedgerRow[],
  auditEntries: readonly LedgerAuditEntry[]
): string {
  const rowByTheoremId = new Map<string, LedgerRow>(
    rows.map((row) => [row.theoremId, row])
  );
  const toolRows = new Map<string, LedgerRow>();
  for (const entry of auditEntries) {
    if (!toolRows.has(entry.tool)) {
      const toolRow = rowByTheoremId.get(entry.toolTheoremId);
      if (!toolRow) {
        throw new Error(
          `Missing tool theorem row "${entry.toolTheoremId}" for ${server}:${entry.tool}.`
        );
      }
      toolRows.set(entry.tool, toolRow);
    }
  }

  const renderedTools = [...toolRows.entries()]
    .map(([toolName, row]) => {
      const description = `${summarizeClaim(row.claim)} [LEDGER: ${row.theoremId}]`;
      return [
        '  {',
        `    name: ${JSON.stringify(toolName)},`,
        `    description: ${JSON.stringify(description)},`,
        "    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },",
        '  },',
      ].join('\n');
    })
    .join('\n');

  const renderedCases = [...toolRows.entries()]
    .map(([toolName, row]) => {
      return [
        `  ${JSON.stringify(toolName)}: {`,
        `    theorem: ${JSON.stringify(row.theoremId)},`,
        `    claim: ${JSON.stringify(row.claim)},`,
        `    mechanization: ${JSON.stringify(row.mechanization)},`,
        `    section: ${JSON.stringify(row.section)},`,
        '  },',
      ].join('\n');
    })
    .join('\n');

  const duplicateCount = auditEntries.length - toolRows.size;

  return [
    `// Auto-generated theorem tools for ${server}`,
    `// Source: ${CANONICAL_LEDGER_RELATIVE_PATH}`,
    `// Rows: ${rows.length}; unique tool wrappers: ${toolRows.size}; reused tool rows: ${duplicateCount}`,
    `// Do not edit by hand. Run \`pnpm run gnode -- run open-source/gnosis/scripts/generate-ledger-mcp-coverage.ts\`.`,
    '',
    "import type { Tool } from '@modelcontextprotocol/sdk/types.js';",
    '',
    'export const LEDGER_TOOL_DEFINITIONS: Tool[] = [',
    renderedTools,
    '];',
    '',
    'export const LEDGER_HANDLER_CASES: Record<string, { theorem: string; claim: string; mechanization: string; section: string }> = {',
    renderedCases,
    '};',
    '',
  ].join('\n');
}

export function buildGeneratedCoverage(
  source = readFileSync(resolveCanonicalLedgerFilePath(), 'utf8')
): GeneratedCoverage {
  const rows = parseCanonicalLedgerRows(source);
  const sectionDefaults = createSectionDefaultMap();
  const theoremOwnership = createTheoremOwnershipMap(rows, sectionDefaults);
  const byServer = new Map<string, LedgerRow[]>();
  const auditEntries: LedgerAuditEntry[] = [];

  for (const row of rows) {
    const ownership = resolveOwnership(row, sectionDefaults, theoremOwnership);
    const toolTheoremId = ownership.toolTheoremId ?? row.theoremId;
    const tool = toolNameFromTheoremId(toolTheoremId);
    const serverRows = byServer.get(ownership.server) ?? [];
    serverRows.push(row);
    byServer.set(ownership.server, serverRows);

    auditEntries.push({
      rowIndex: row.rowIndex,
      theoremId: row.theoremId,
      section: row.section,
      normalizedSection: row.normalizedSection,
      server: ownership.server,
      namespace: namespaceFromServer(ownership.server),
      toolTheoremId,
      tool,
      coverageKind: ownership.coverageKind,
    });
  }

  const duplicateTheoremIds = [...new Set(
    rows
      .map((row) => row.theoremId)
      .filter(
        (theoremId, index, all) => all.findIndex((candidate) => candidate === theoremId) !== index
      )
  )].sort();

  const serverFiles = new Map<string, string>();
  for (const [server, serverRows] of [...byServer.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  )) {
    const serverAuditEntries = auditEntries.filter((entry) => entry.server === server);
    serverFiles.set(server, renderLedgerToolsFile(server, serverRows, serverAuditEntries));
  }

  const sectionCount = new Set(rows.map((row) => row.section)).size;
  const audit: LedgerAuditDocument = {
    version: 1,
    generatedAt: new Date().toISOString(),
    canonicalLedgerPath: CANONICAL_LEDGER_RELATIVE_PATH,
    rowCount: rows.length,
    sectionCount,
    duplicateTheoremIds,
    entries: auditEntries,
  };

  return {
    rows,
    audit,
    serverFiles,
  };
}

function ensureParentDirectory(filePath: string): void {
  const directory = path.dirname(filePath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

function resolveServerAppPath(server: string): string {
  return path.join(resolveRepoRoot(), 'apps', server);
}

function verifyOwnedServerDirectories(generated: GeneratedCoverage): void {
  const missingServers = [...generated.serverFiles.keys()].filter(
    (server) => !existsSync(resolveServerAppPath(server))
  );

  if (missingServers.length > 0) {
    throw new Error(
      `Ownership manifest points at missing app directories: ${missingServers.join(', ')}.`
    );
  }
}

function verifyExpectedCounts(generated: GeneratedCoverage): void {
  if (generated.rows.length !== EXPECTED_CANONICAL_LEDGER_ROW_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_CANONICAL_LEDGER_ROW_COUNT} canonical theorem rows, found ${generated.rows.length}.`
    );
  }

  if (generated.audit.sectionCount !== EXPECTED_CANONICAL_LEDGER_SECTION_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_CANONICAL_LEDGER_SECTION_COUNT} canonical sections, found ${generated.audit.sectionCount}.`
    );
  }
}

function checkFileMatches(filePath: string, expected: string): void {
  if (!existsSync(filePath)) {
    throw new Error(`Missing generated file: ${filePath}`);
  }

  const actual = readFileSync(filePath, 'utf8');
  if (actual !== expected) {
    throw new Error(`Generated file drift detected: ${filePath}`);
  }
}

export function writeGeneratedCoverage(generated: GeneratedCoverage): void {
  verifyOwnedServerDirectories(generated);

  for (const [server, source] of generated.serverFiles.entries()) {
    const outputPath = path.join(
      resolveRepoRoot(),
      'apps',
      server,
      'src',
      'ledger-tools.ts'
    );
    ensureParentDirectory(outputPath);
    writeFileSync(outputPath, source, 'utf8');
  }

  const auditOutputPath = resolveAuditOutputPath();
  ensureParentDirectory(auditOutputPath);
  writeFileSync(
    auditOutputPath,
    `${JSON.stringify(generated.audit, null, 2)}\n`,
    'utf8'
  );
}

export function checkGeneratedCoverage(generated: GeneratedCoverage): void {
  verifyOwnedServerDirectories(generated);

  for (const [server, source] of generated.serverFiles.entries()) {
    const outputPath = path.join(
      resolveRepoRoot(),
      'apps',
      server,
      'src',
      'ledger-tools.ts'
    );
    checkFileMatches(outputPath, source);
  }

  const auditOutputPath = resolveAuditOutputPath();
  checkFileMatches(
    auditOutputPath,
    `${JSON.stringify(generated.audit, null, 2)}\n`
  );
}

export function main(): void {
  const generated = buildGeneratedCoverage();
  verifyExpectedCounts(generated);

  writeGeneratedCoverage(generated);
  return;
}
