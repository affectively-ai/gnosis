import path from 'node:path';
import type { GnosisComplexityReport } from './analysis.js';
import type { TsSonarReport } from './ts-sonar.js';

interface SarifArtifactLocation {
  uri: string;
}

interface SarifRegion {
  startLine: number;
}

interface SarifLocation {
  physicalLocation: {
    artifactLocation: SarifArtifactLocation;
    region?: SarifRegion;
  };
}

interface SarifResult {
  ruleId: string;
  level: 'error' | 'warning' | 'note';
  message: { text: string };
  locations?: SarifLocation[];
}

interface SarifReportingDescriptor {
  id: string;
  shortDescription: { text: string };
  fullDescription?: { text: string };
}

interface SarifLog {
  version: '2.1.0';
  $schema: string;
  runs: Array<{
    tool: {
      driver: {
        name: string;
        informationUri: string;
        rules: SarifReportingDescriptor[];
      };
    };
    results: SarifResult[];
  }>;
}

function toUri(filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

function buildSarifLog(
  name: string,
  rules: SarifReportingDescriptor[],
  results: SarifResult[],
): SarifLog {
  return {
    version: '2.1.0',
    $schema:
      'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name,
            informationUri: 'https://github.com/affectively-ai/gnosis',
            rules,
          },
        },
        results,
      },
    ],
  };
}

function uniqueRules(results: readonly SarifResult[]): SarifReportingDescriptor[] {
  const map = new Map<string, SarifReportingDescriptor>();
  for (const result of results) {
    if (map.has(result.ruleId)) {
      continue;
    }
    map.set(result.ruleId, {
      id: result.ruleId,
      shortDescription: { text: result.ruleId },
    });
  }
  return [...map.values()];
}

export function ggReportToSarif(
  filePath: string,
  report: GnosisComplexityReport,
  formattedViolations: readonly string[],
  maxBuley: number | null,
): SarifLog {
  const results: SarifResult[] = [];

  for (let index = 0; index < formattedViolations.length; index += 1) {
    const text = formattedViolations[index];
    const ruleId = `gnosis.gg.formal.${index + 1}`;
    results.push({
      ruleId,
      level: 'error',
      message: { text },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: toUri(filePath) },
          },
        },
      ],
    });
  }

  if (maxBuley !== null && report.buleyNumber > maxBuley) {
    results.push({
      ruleId: 'gnosis.gg.buley-threshold',
      level: 'error',
      message: {
        text: `Buley number ${report.buleyNumber} exceeds threshold ${maxBuley}.`,
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: toUri(filePath) },
          },
        },
      ],
    });
  }

  for (const issue of report.capabilities.issues) {
    results.push({
      ruleId: `gnosis.gg.capability.${issue.capability}`,
      level: issue.severity === 'error' ? 'error' : 'warning',
      message: {
        text: `${issue.message} (target=${issue.target})`,
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: toUri(filePath) },
          },
        },
      ],
    });
  }

  if (results.length === 0) {
    results.push({
      ruleId: 'gnosis.gg.pass',
      level: 'note',
      message: {
        text: `Formal check passed. Buley=${report.buleyNumber}, QuantumIndex=${report.quantum.quantumIndex}`,
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: toUri(filePath) },
          },
        },
      ],
    });
  }

  return buildSarifLog('gnosis-gg-lint', uniqueRules(results), results);
}

function parseTsViolation(violation: string): {
  ruleId: string;
  filePath?: string;
  startLine?: number;
  text: string;
} {
  const parts = violation.split(' ');
  const kind = parts[0] ?? 'ts-rule';
  const ruleId = `gnosis.ts.${kind}`;

  const locationToken = parts[1];
  if (!locationToken) {
    return { ruleId, text: violation };
  }

  const lastColon = locationToken.lastIndexOf(':');
  if (lastColon > 0) {
    const maybeLine = Number.parseInt(locationToken.slice(lastColon + 1), 10);
    if (Number.isFinite(maybeLine)) {
      return {
        ruleId,
        filePath: locationToken.slice(0, lastColon),
        startLine: maybeLine,
        text: violation,
      };
    }
  }

  return {
    ruleId,
    filePath: locationToken,
    text: violation,
  };
}

export function tsReportToSarif(
  targetPath: string,
  report: TsSonarReport,
): SarifLog {
  const results: SarifResult[] = report.violations.map((violation) => {
    const parsed = parseTsViolation(violation);
    return {
      ruleId: parsed.ruleId,
      level: 'error',
      message: { text: parsed.text },
      locations: parsed.filePath
        ? [
            {
              physicalLocation: {
                artifactLocation: { uri: toUri(parsed.filePath) },
                ...(parsed.startLine ? { region: { startLine: parsed.startLine } } : {}),
              },
            },
          ]
        : undefined,
    };
  });

  if (results.length === 0) {
    results.push({
      ruleId: 'gnosis.ts.pass',
      level: 'note',
      message: {
        text: `TypeScript analysis passed for ${targetPath}. Files=${report.fileCount}.`,
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: toUri(targetPath) },
          },
        },
      ],
    });
  }

  return buildSarifLog('gnosis-ts-lint', uniqueRules(results), results);
}
