#!/usr/bin/env node

import { createRequire } from 'node:module';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');
const require = createRequire(import.meta.url);
const driverPath = resolve(here, '../gnode/bridge-driver.ts');
const bundlePath = resolve(here, '../dist/gnode/bridge-driver.bundle.cjs');
const manifestPath = resolve(here, '../dist/gnode/bridge-driver.bundle-manifest.json');
const forwardedArgv =
  process.argv[2] === '--' ? process.argv.slice(3) : process.argv.slice(2);

function readBundleManifest() {
  if (!existsSync(manifestPath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * @param {string} inputPath
 * @param {string} baseDir
 * @returns {string}
 */
function resolveManifestInput(inputPath, baseDir) {
  return isAbsolute(inputPath) ? inputPath : resolve(baseDir, inputPath);
}

function bundleIsFresh() {
  if (!existsSync(bundlePath)) {
    return false;
  }

  const manifest = readBundleManifest();
  if (
    !manifest ||
    typeof manifest.baseDir !== 'string' ||
    !Array.isArray(manifest.inputs)
  ) {
    return false;
  }

  const bundleMtime = statSync(bundlePath).mtimeMs;
  for (const inputPath of manifest.inputs) {
    const resolvedInput = resolveManifestInput(inputPath, manifest.baseDir);
    if (!existsSync(resolvedInput)) {
      return false;
    }

    if (statSync(resolvedInput).mtimeMs > bundleMtime) {
      return false;
    }
  }

  return true;
}

function buildBundle() {
  const { buildSync } = require('esbuild');
  mkdirSync(dirname(bundlePath), { recursive: true });
  const result = buildSync({
    entryPoints: [driverPath],
    outfile: bundlePath,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    logLevel: 'silent',
    metafile: true,
    absWorkingDir: packageRoot,
  });
  writeFileSync(
    manifestPath,
    `${JSON.stringify(
      {
        version: 1,
        baseDir: packageRoot,
        inputs: Object.keys(result.metafile.inputs),
      },
      null,
      2
    )}\n`,
    'utf8'
  );
}

async function main() {
  if (process.env.GNODE_FORCE_TSX !== '1') {
    try {
      if (!bundleIsFresh()) {
        buildBundle();
      }
    } catch {
      // Fall back to the raw TypeScript path when the cached bundle cannot be built.
    }
  }

  if (process.env.GNODE_FORCE_TSX !== '1' && existsSync(bundlePath)) {
    try {
      const bundledDriver = require(bundlePath);
      if (typeof bundledDriver.runCli !== 'function') {
        throw new Error(
          `gnode bundle at ${bundlePath} does not export runCli().`
        );
      }
      process.exitCode = await bundledDriver.runCli(forwardedArgv);
      return;
    } catch {
      // Fall through to the tsx-backed path when the cached bundle is stale
      // against the current Node/runtime semantics.
    }
  }

  const result = require('node:child_process').spawnSync(
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
}

await main().catch((error) => {
  const message =
    error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
