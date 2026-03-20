#!/usr/bin/env node

import {
  createRequire,
  enableCompileCache,
  constants as moduleConstants,
} from 'node:module';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');
const require = createRequire(import.meta.url);
const driverPath = resolve(here, '../gnode/bridge-driver.ts');
const bundlePath = resolve(here, '../dist/gnode/bridge-driver.bundle.cjs');
const manifestPath = resolve(
  here,
  '../dist/gnode/bridge-driver.bundle-manifest.json'
);
const forwardedArgv =
  process.argv[2] === '--' ? process.argv.slice(3) : process.argv.slice(2);
const traceWrapperTimings =
  forwardedArgv.includes('--trace-timings') ||
  process.env.GNODE_TRACE_TIMINGS === '1';
const compileCacheDir =
  process.env.GNODE_COMPILE_CACHE_DIR ??
  process.env.NODE_COMPILE_CACHE ??
  (process.env.GNODE_CACHE_DIR
    ? resolve(process.env.GNODE_CACHE_DIR, 'node-compile-cache')
    : resolve(tmpdir(), 'gnode-node-compile-cache'));
const compileCacheResult =
  process.env.GNODE_DISABLE_COMPILE_CACHE === '1'
    ? null
    : enableCompileCache({ directory: compileCacheDir });

function formatError(error) {
  return error instanceof Error ? error.stack ?? error.message : String(error);
}

function writeWrapperTimings(payload) {
  if (!traceWrapperTimings) {
    return;
  }

  process.stderr.write('\n[gnode wrapper]\n');
  process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function getCompileCacheTrace() {
  if (compileCacheResult === null || typeof compileCacheResult !== 'object') {
    return { enabled: false };
  }

  if (
    compileCacheResult.status === moduleConstants.compileCacheStatus.ENABLED ||
    compileCacheResult.status ===
      moduleConstants.compileCacheStatus.ALREADY_ENABLED
  ) {
    return {
      enabled: true,
      directory: compileCacheResult.directory,
    };
  }

  return {
    enabled: false,
    directory: compileCacheResult.directory,
    message: compileCacheResult.message,
  };
}

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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
  const wrapperStarted = performance.now();
  let bundleCheckMs = 0;
  let bundleBuildMs = 0;
  let bundleRequireMs = 0;
  let childSpawnMs = 0;
  let executionPath = 'tsx';
  let bundleFresh = false;
  let bundleBuilt = false;
  let bundleFallbackReason = null;

  if (process.env.GNODE_FORCE_TSX !== '1') {
    try {
      const bundleCheckStarted = performance.now();
      bundleFresh = bundleIsFresh();
      bundleCheckMs = performance.now() - bundleCheckStarted;
      if (!bundleFresh) {
        const bundleBuildStarted = performance.now();
        buildBundle();
        bundleBuildMs = performance.now() - bundleBuildStarted;
        bundleBuilt = true;
      }
    } catch (error) {
      bundleFallbackReason = formatError(error);
      // Fall back to the raw TypeScript path when the cached bundle cannot be built.
    }
  }

  if (process.env.GNODE_FORCE_TSX !== '1' && existsSync(bundlePath)) {
    let bundledDriver;
    try {
      const bundleRequireStarted = performance.now();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      bundledDriver = require(bundlePath);
      bundleRequireMs = performance.now() - bundleRequireStarted;
      if (typeof bundledDriver.runCli !== 'function') {
        throw new Error(
          `gnode bundle at ${bundlePath} does not export runCli().`
        );
      }
    } catch (error) {
      bundleFallbackReason = formatError(error);
      // Fall through to the tsx-backed path when the cached bundle is stale
      // against the current Node/runtime semantics.
    }

    if (bundledDriver) {
      executionPath = 'bundle';
      process.exitCode = await bundledDriver.runCli(forwardedArgv);
      writeWrapperTimings({
        executionPath,
        bundleFresh,
        bundleBuilt,
        bundleCheckMs: Number(bundleCheckMs.toFixed(2)),
        bundleBuildMs: Number(bundleBuildMs.toFixed(2)),
        bundleRequireMs: Number(bundleRequireMs.toFixed(2)),
        compileCache: getCompileCacheTrace(),
        totalMs: Number((performance.now() - wrapperStarted).toFixed(2)),
      });
      return;
    }
  }

  const childSpawnStarted = performance.now();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const result = require('node:child_process').spawnSync(
    process.execPath,
    ['--import', 'tsx', driverPath, ...forwardedArgv],
    {
      env:
        process.env.GNODE_DISABLE_COMPILE_CACHE === '1'
          ? process.env
          : {
              ...process.env,
              NODE_COMPILE_CACHE:
                process.env.NODE_COMPILE_CACHE ?? compileCacheDir,
            },
      stdio: 'inherit',
    }
  );
  childSpawnMs = performance.now() - childSpawnStarted;

  if (result.error) {
    throw result.error;
  }

  writeWrapperTimings({
    executionPath,
    bundleFresh,
    bundleBuilt,
    bundleCheckMs: Number(bundleCheckMs.toFixed(2)),
    bundleBuildMs: Number(bundleBuildMs.toFixed(2)),
    bundleRequireMs: Number(bundleRequireMs.toFixed(2)),
    childSpawnMs: Number(childSpawnMs.toFixed(2)),
    compileCache: getCompileCacheTrace(),
    fallbackReason: bundleFallbackReason,
    totalMs: Number((performance.now() - wrapperStarted).toFixed(2)),
  });
  process.exitCode = result.status ?? 1;
}

await main().catch((error) => {
  const message = formatError(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
