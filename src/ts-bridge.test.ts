import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'bun:test';
import { QDoc } from './crdt/index.js';
import { GnosisCoreCache } from './runtime/core-cache.js';
import {
  compileTypeScriptToGnosis,
  deserializeTypeScriptBridgeResult,
  executeTypeScriptWithGnosis,
  renderTypeScriptBridgeRuntimeModule,
  serializeTypeScriptBridgeResult,
  transpileTypeScriptBridgeRuntimeModule,
} from './ts-bridge.js';

describe('TypeScript to Gnosis bridge', () => {
  it('compiles a linear exported orchestrator into a GG process chain', async () => {
    const source = `
      export async function loadUser(userId: string) {
        return { id: userId, name: \`user-\${userId}\` };
      }

      export function summarize(user: { id: string; name: string }) {
        return user.name.toUpperCase();
      }

      export async function app(input: { userId: string }) {
        const user = await loadUser(input.userId);
        const summary = summarize(user);
        return { user, summary };
      }
    `;

    const compiled = compileTypeScriptToGnosis(source, {
      exportName: 'app',
      sourceFilePath: 'app.ts',
    });

    expect(compiled.topologySource).toContain('TsBridgeEntry');
    expect(compiled.topologySource).toContain('TsBridgeCall');
    expect(compiled.topologySource).not.toContain('[:FORK]');

    const result = await executeTypeScriptWithGnosis({
      compiled,
      input: { userId: 'ada' },
      bindings: {
        loadUser: async (userId: string) => ({
          id: userId,
          name: `user-${userId}`,
        }),
        summarize: (user: { id: string; name: string }) => user.name.toUpperCase(),
      },
    });

    expect(result.payload).toEqual({
      user: { id: 'ada', name: 'user-ada' },
      summary: 'USER-ADA',
    });
  });

  it('maps Promise.all to a fork/fold topology and merges branch locals before the next step', async () => {
    const source = `
      export async function loadUser(userId: string) {
        return { id: userId, kind: 'user' };
      }

      export async function loadProfile(userId: string) {
        return { id: userId, role: 'admin' };
      }

      export function merge(
        user: { id: string; kind: string },
        profile: { id: string; role: string },
      ) {
        return \`\${user.id}:\${user.kind}:\${profile.role}\`;
      }

      export async function app(input: { userId: string }) {
        const [user, profile] = await Promise.all([
          loadUser(input.userId),
          loadProfile(input.userId),
        ]);
        const summary = merge(user, profile);
        return summary;
      }
    `;

    const compiled = compileTypeScriptToGnosis(source, {
      exportName: 'app',
      sourceFilePath: 'parallel-app.ts',
    });

    expect(compiled.topologySource).toContain('[:FORK]');
    expect(compiled.topologySource).toContain('[:FOLD]');
    expect(compiled.schedule.map((wave) => wave.kind)).toEqual([
      'parallel',
      'collapse',
      'linear',
      'linear',
    ]);

    const result = await executeTypeScriptWithGnosis({
      compiled,
      input: { userId: 'ada' },
      bindings: {
        loadUser: async (userId: string) => ({ id: userId, kind: 'user' }),
        loadProfile: async (userId: string) => ({ id: userId, role: 'admin' }),
        merge: (
          user: { id: string; kind: string },
          profile: { id: string; role: string },
        ) => `${user.id}:${user.kind}:${profile.role}`,
      },
    });

    expect(result.payload).toBe('ada:user:admin');
  });

  it('allows non-exported helper calls when the runtime binding table supplies them', async () => {
    const source = `
      function internalStep(input: number) {
        return input + 2;
      }

      export function app(input: number) {
        const value = internalStep(input);
        return value;
      }
    `;

    const compiled = compileTypeScriptToGnosis(source, {
      exportName: 'app',
      sourceFilePath: 'local-helper.ts',
    });

    const result = await executeTypeScriptWithGnosis({
      compiled,
      input: 5,
      bindings: {
        internalStep: (input: number) => input + 2,
      },
    });

    expect(result.payload).toBe(7);
  });

  it('autoloads top-level helper bindings from a module path for gnode-style execution', async () => {
    const tempDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gnode-bridge-')
    );
    const modulePath = path.join(tempDirectory, 'app.ts');

    fs.writeFileSync(
      modulePath,
      `
        function internalStep(input: number) {
          return input + 2;
        }

        export function app(input: number) {
          const value = internalStep(input);
          return value;
        }
      `,
      'utf8'
    );

    try {
      const result = await executeTypeScriptWithGnosis({
        modulePath,
        exportName: 'app',
        input: 5,
      });

      expect(result.payload).toBe(7);
    } finally {
      fs.rmSync(tempDirectory, { recursive: true, force: true });
    }
  });

  it('hydrates a serialized compiled artifact without reparsing the GG topology', async () => {
    const source = `
      function internalStep(input: number) {
        return input + 2;
      }

      export function app(input: number) {
        const value = internalStep(input);
        return value;
      }
    `;

    const compiled = compileTypeScriptToGnosis(source, {
      exportName: 'app',
      sourceFilePath: 'serialized-app.ts',
    });
    const hydrated = deserializeTypeScriptBridgeResult(
      serializeTypeScriptBridgeResult(compiled)
    );

    expect(hydrated.runtimeBindingNames).toEqual(compiled.runtimeBindingNames);
    expect(hydrated.runtimeModuleSource).toBe(compiled.runtimeModuleSource);

    const result = await executeTypeScriptWithGnosis({
      compiled: hydrated,
      input: 5,
      bindings: {
        internalStep: (input: number) => input + 2,
      },
    });

    expect(result.payload).toBe(7);
  });

  it('executes against a cached runtime module outside the source tree', async () => {
    const sourceDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gnode-source-')
    );
    const runtimeDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gnode-runtime-')
    );
    const modulePath = path.join(sourceDirectory, 'app.ts');
    const helperPath = path.join(sourceDirectory, 'helper.ts');
      const runtimeModulePath = path.join(runtimeDirectory, 'runtime-bridge.ts');

    fs.writeFileSync(
      helperPath,
      `
        export function internalStep(input: number) {
          return input + 2;
        }
      `,
      'utf8'
    );
    fs.writeFileSync(
      modulePath,
      `
        import { internalStep } from './helper';

        export function app(input: number) {
          const value = internalStep(input);
          return value;
        }
      `,
      'utf8'
    );

    try {
      const source = fs.readFileSync(modulePath, 'utf8');
      const compiled = compileTypeScriptToGnosis(source, {
        exportName: 'app',
        sourceFilePath: modulePath,
      });
      const runtimeModule = renderTypeScriptBridgeRuntimeModule(
        source,
        modulePath,
        compiled.runtimeBindingNames,
        { specifierStyle: 'absolute-url' }
      );

      fs.writeFileSync(runtimeModulePath, runtimeModule.moduleSource, 'utf8');

      const result = await executeTypeScriptWithGnosis({
        compiled,
        runtimeModulePath,
        input: 5,
      });

      expect(result.payload).toBe(7);
    } finally {
      fs.rmSync(sourceDirectory, { recursive: true, force: true });
      fs.rmSync(runtimeDirectory, { recursive: true, force: true });
    }
  });

  it('rewrites explicit .ts imports when a cached runtime module executes outside the source tree', async () => {
    const sourceDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gnode-source-ts-')
    );
    const runtimeDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gnode-runtime-ts-')
    );
    const modulePath = path.join(sourceDirectory, 'app.ts');
    const helperPath = path.join(sourceDirectory, 'helper.ts');
    const runtimeModulePath = path.join(runtimeDirectory, 'runtime-bridge.mjs');

    fs.writeFileSync(
      helperPath,
      `
        export function internalStep(input: number) {
          return input + 3;
        }
      `,
      'utf8'
    );
    fs.writeFileSync(
      modulePath,
      `
        import { internalStep } from './helper.ts';

        export function app(input: number) {
          const value = internalStep(input);
          return value;
        }
      `,
      'utf8'
    );

    try {
      const source = fs.readFileSync(modulePath, 'utf8');
      const compiled = compileTypeScriptToGnosis(source, {
        exportName: 'app',
        sourceFilePath: modulePath,
      });
      const runtimeModule = transpileTypeScriptBridgeRuntimeModule(
        source,
        modulePath,
        compiled.runtimeBindingNames,
        { specifierStyle: 'absolute-url' }
      );

      expect(runtimeModule.javascriptSource).toContain(
        pathToFileURL(helperPath).href
      );

      fs.writeFileSync(runtimeModulePath, runtimeModule.javascriptSource, 'utf8');

      const result = await executeTypeScriptWithGnosis({
        compiled,
        runtimeModulePath,
        input: 5,
      });

      expect(result.payload).toBe(8);
    } finally {
      fs.rmSync(sourceDirectory, { recursive: true, force: true });
      fs.rmSync(runtimeDirectory, { recursive: true, force: true });
    }
  });

  it('rewrites explicit .js imports back to source modules for cached runtime execution', async () => {
    const sourceDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gnode-source-js-')
    );
    const runtimeDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gnode-runtime-js-')
    );
    const modulePath = path.join(sourceDirectory, 'app.ts');
    const helperPath = path.join(sourceDirectory, 'helper.ts');
    const runtimeModulePath = path.join(runtimeDirectory, 'runtime-bridge.mjs');

    fs.writeFileSync(
      helperPath,
      `
        export function internalStep(input: number) {
          return input + 4;
        }
      `,
      'utf8'
    );
    fs.writeFileSync(
      modulePath,
      `
        import { internalStep } from './helper.js';

        export function app(input: number) {
          const value = internalStep(input);
          return value;
        }
      `,
      'utf8'
    );

    try {
      const source = fs.readFileSync(modulePath, 'utf8');
      const compiled = compileTypeScriptToGnosis(source, {
        exportName: 'app',
        sourceFilePath: modulePath,
      });
      const runtimeModule = transpileTypeScriptBridgeRuntimeModule(
        source,
        modulePath,
        compiled.runtimeBindingNames,
        { specifierStyle: 'absolute-url' }
      );

      expect(runtimeModule.javascriptSource).toContain(
        pathToFileURL(helperPath).href
      );

      fs.writeFileSync(runtimeModulePath, runtimeModule.javascriptSource, 'utf8');

      const result = await executeTypeScriptWithGnosis({
        compiled,
        runtimeModulePath,
        input: 5,
      });

      expect(result.payload).toBe(9);
    } finally {
      fs.rmSync(sourceDirectory, { recursive: true, force: true });
      fs.rmSync(runtimeDirectory, { recursive: true, force: true });
    }
  });

  it('allows callers to reuse the runtime core cache across bridge executions', async () => {
    const source = `
      export function double(input: number) {
        return input * 2;
      }

      export function app(input: number) {
        const value = double(input);
        return value;
      }
    `;

    const compiled = compileTypeScriptToGnosis(source, {
      exportName: 'app',
      sourceFilePath: 'cached-app.ts',
    });
    const coreCache = new GnosisCoreCache(
      new QDoc({ guid: 'ts-bridge-cache-test' })
    );

    const first = await executeTypeScriptWithGnosis({
      compiled,
      input: 9,
      bindings: {
        double: (input: number) => input * 2,
      },
      engineOptions: {
        coreCache,
      },
      executeOptions: {
        cache: {
          corridorKey: 'x-gnosis/gnode/test',
          reuseScope: 'corridor',
        },
      },
    });

    const second = await executeTypeScriptWithGnosis({
      compiled,
      input: 11,
      bindings: {
        double: (input: number) => input * 2,
      },
      engineOptions: {
        coreCache,
      },
      executeOptions: {
        cache: {
          corridorKey: 'x-gnosis/gnode/test',
          reuseScope: 'corridor',
        },
      },
    });

    expect(first.cache?.status).toBe('miss');
    expect(second.cache?.status).toBe('hit');
    expect(second.payload).toBe(18);
  });

  it('fails on unsupported control-flow that cannot be represented honestly yet', () => {
    const source = `
      export function app(input: { enabled: boolean }) {
        if (input.enabled) {
          return 'on';
        }
        return 'off';
      }
    `;

    expect(() =>
      compileTypeScriptToGnosis(source, {
        exportName: 'app',
        sourceFilePath: 'unsupported.ts',
      })
    ).toThrow('Unsupported TypeScript statement');
  });
});
