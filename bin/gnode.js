#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const driverPath = resolve(here, '../gnode/bridge-driver.ts');
const forwardedArgv = process.argv[2] === '--'
  ? process.argv.slice(3)
  : process.argv.slice(2);

const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', driverPath, ...forwardedArgv],
  {
    stdio: 'inherit',
  }
);

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
