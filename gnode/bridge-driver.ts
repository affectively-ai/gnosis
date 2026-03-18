import fs from 'node:fs';
import path from 'node:path';
import {
  compileTypeScriptToGnosis,
  executeTypeScriptWithGnosis,
  type GnosisTypeScriptBridgeResult,
} from '../src/ts-bridge.ts';

type Strategy = 'cannon' | 'linear';
type CommandName = 'compile' | 'schedule' | 'run';

interface ParsedArgs {
  readonly command: CommandName;
  readonly filePath: string;
  readonly exportName?: string;
  readonly inputJson?: string;
  readonly printGg: boolean;
  readonly printSchedule: boolean;
  readonly lanes: number;
  readonly strategy: Strategy;
}

interface RotationResult<T> {
  readonly lanes: readonly {
    readonly laneIndex: number;
    readonly items: readonly T[];
  }[];
  readonly nextCursor: number;
}

function usage(): string {
  return [
    'Usage:',
    '  gnode compile <file.ts> [--export name]',
    '  gnode schedule <file.ts> [--export name] [--lanes N] [--strategy cannon|linear]',
    '  gnode run <file.ts> [--export name] [--input-json JSON] [--print-gg] [--print-schedule] [--lanes N] [--strategy cannon|linear]',
  ].join('\n');
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const command = argv[0];
  const filePath = argv[1];

  if (
    (command !== 'compile' && command !== 'schedule' && command !== 'run') ||
    !filePath
  ) {
    throw new Error(usage());
  }

  let exportName: string | undefined;
  let inputJson: string | undefined;
  let printGg = false;
  let printSchedule = false;
  let lanes = 4;
  let strategy: Strategy = 'cannon';

  for (let index = 2; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--export') {
      exportName = argv[index + 1];
      index += 1;
      continue;
    }
    if (flag === '--input-json') {
      inputJson = argv[index + 1];
      index += 1;
      continue;
    }
    if (flag === '--lanes') {
      const value = Number.parseInt(argv[index + 1] ?? '', 10);
      if (!Number.isFinite(value) || value < 1) {
        throw new Error(`Invalid lane count '${argv[index + 1] ?? ''}'.`);
      }
      lanes = value;
      index += 1;
      continue;
    }
    if (flag === '--strategy') {
      const value = argv[index + 1];
      if (value !== 'cannon' && value !== 'linear') {
        throw new Error(`Invalid strategy '${value ?? ''}'.`);
      }
      strategy = value;
      index += 1;
      continue;
    }
    if (flag === '--print-gg') {
      printGg = true;
      continue;
    }
    if (flag === '--print-schedule') {
      printSchedule = true;
      continue;
    }

    throw new Error(`Unknown flag '${flag}'.\n\n${usage()}`);
  }

  return {
    command,
    filePath: path.resolve(filePath),
    exportName,
    inputJson,
    printGg,
    printSchedule,
    lanes,
    strategy,
  };
}

function compileFile(
  filePath: string,
  exportName?: string
): GnosisTypeScriptBridgeResult {
  const source = fs.readFileSync(filePath, 'utf8');
  return compileTypeScriptToGnosis(source, {
    exportName,
    sourceFilePath: filePath,
  });
}

function rotateIntoLanes<T>(
  items: readonly T[],
  laneCount: number,
  cursor = 0
): RotationResult<T> {
  const normalizedLaneCount = Math.max(1, laneCount);
  const lanes = Array.from({ length: normalizedLaneCount }, (_, laneIndex) => ({
    laneIndex,
    items: [] as T[],
  }));

  for (let index = 0; index < items.length; index += 1) {
    const laneIndex = (cursor + index) % normalizedLaneCount;
    lanes[laneIndex]?.items.push(items[index] as T);
  }

  return {
    lanes,
    nextCursor: (cursor + items.length) % normalizedLaneCount,
  };
}

function formatSchedule(
  compiled: GnosisTypeScriptBridgeResult,
  laneCount: number,
  strategy: Strategy
): string {
  const lines = [
    `strategy=${strategy}`,
    `lanes=${Math.max(1, laneCount)}`,
    `preload=${strategy === 'cannon' ? 'armed' : 'off'}`,
    `entry=${compiled.entryNodeId}`,
  ];

  let cursor = 0;

  for (const wave of compiled.schedule) {
    lines.push(`wave ${wave.index} ${wave.kind}`);
    if (wave.kind === 'parallel') {
      const rotation = rotateIntoLanes(
        wave.nodeIds,
        laneCount,
        strategy === 'cannon' ? cursor : 0
      );
      for (const lane of rotation.lanes) {
        if (lane.items.length === 0) {
          continue;
        }
        lines.push(`  lane ${lane.laneIndex}: ${lane.items.join(', ')}`);
      }
      cursor = strategy === 'cannon' ? rotation.nextCursor : cursor;
      continue;
    }

    lines.push(`  lane 0: ${wave.nodeIds.join(', ')}`);
  }

  return lines.join('\n');
}

function writeSection(title: string, content: string): void {
  process.stderr.write(`\n[gnode ${title}]\n`);
  process.stderr.write(content.endsWith('\n') ? content : `${content}\n`);
}

function shouldPrintRuntimeLogs(): boolean {
  return process.env.GNODE_SUPPRESS_RUNTIME_LOGS !== '1';
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  const compiled = compileFile(parsed.filePath, parsed.exportName);

  if (parsed.command === 'compile') {
    process.stdout.write(compiled.ggSource);
    return;
  }

  if (parsed.command === 'schedule') {
    process.stdout.write(
      `${formatSchedule(compiled, parsed.lanes, parsed.strategy)}\n`
    );
    return;
  }

  if (parsed.printGg) {
    writeSection('gg', compiled.ggSource);
  }

  if (parsed.printSchedule) {
    writeSection(
      'schedule',
      formatSchedule(compiled, parsed.lanes, parsed.strategy)
    );
  }

  const input =
    parsed.inputJson !== undefined ? JSON.parse(parsed.inputJson) : undefined;
  const result = await executeTypeScriptWithGnosis({
    compiled,
    modulePath: parsed.filePath,
    input,
  });

  if (shouldPrintRuntimeLogs() && result.logs.trim().length > 0) {
    writeSection('logs', result.logs);
  }

  if (result.payload === null || result.payload === undefined) {
    return;
  }

  if (typeof result.payload === 'string') {
    process.stdout.write(`${result.payload}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(result.payload, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
