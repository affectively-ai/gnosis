import { createRequire, enableCompileCache } from 'node:module';
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
const driverPath = resolve(here, 'bridge-driver.ts');
const bundlePath = resolve(packageRoot, 'dist/gnode/bridge-driver.bundle.cjs');
const manifestPath = resolve(
  packageRoot,
  'dist/gnode/bridge-driver.bundle-manifest.json'
);
const compileCacheDir =
  process.env.GNODE_COMPILE_CACHE_DIR ??
  process.env.NODE_COMPILE_CACHE ??
  (process.env.GNODE_CACHE_DIR
    ? resolve(process.env.GNODE_CACHE_DIR, 'node-compile-cache')
    : resolve(tmpdir(), 'gnode-node-compile-cache'));

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

const started = performance.now();
const compileCacheResult =
  process.env.GNODE_DISABLE_COMPILE_CACHE === '1'
    ? null
    : enableCompileCache({ directory: compileCacheDir });
const bundleFresh = bundleIsFresh();
const bundleBuildStarted = performance.now();

if (!bundleFresh) {
  buildBundle();
}

const bundleBuildMs = performance.now() - bundleBuildStarted;
const dependencyWarmStarted = performance.now();
require('typescript');
require('esbuild');
require(bundlePath);
const dependencyWarmMs = performance.now() - dependencyWarmStarted;

if (
  process.argv.includes('--json') ||
  process.env.GNODE_TRACE_TIMINGS === '1'
) {
  process.stdout.write(
    `${JSON.stringify(
      {
        bundleFresh,
        bundleBuilt: !bundleFresh,
        bundleBuildMs: Number(bundleBuildMs.toFixed(2)),
        dependencyWarmMs: Number(dependencyWarmMs.toFixed(2)),
        compileCache:
          compileCacheResult && typeof compileCacheResult === 'object'
            ? {
                directory: compileCacheResult.directory,
                status: compileCacheResult.status,
                message: compileCacheResult.message,
              }
            : {
                status: 'disabled',
              },
        totalMs: Number((performance.now() - started).toFixed(2)),
      },
      null,
      2
    )}\n`
  );
}
