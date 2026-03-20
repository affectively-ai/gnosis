/**
 * bun:test compatibility shim -- maps bun:test API to Node/Jest equivalents.
 *
 * This module exists so that test files can keep their existing imports
 * while the runtime migrates from Bun to Node/gnode. The tsconfig paths
 * alias maps 'bun:test' to this file.
 *
 * All exports match the bun:test API surface used in this project:
 *   describe, it, test, expect, mock, beforeEach, afterEach, beforeAll, afterAll
 */

import {
  describe as nodeDescribe,
  it as nodeIt,
  test as nodeTest,
  before as nodeBefore,
  after as nodeAfter,
  beforeEach as nodeBeforeEach,
  afterEach as nodeAfterEach,
  mock as nodeMock,
} from 'node:test';
import { strict as nodeAssert } from 'node:assert';

// Re-export test primitives directly from node:test
export const describe = nodeDescribe;
export const it = nodeIt;
export const test = nodeTest;
export const beforeAll = nodeBefore;
export const afterAll = nodeAfter;
export const beforeEach = nodeBeforeEach;
export const afterEach = nodeAfterEach;

// Mock compatibility: bun's mock() returns a jest-like mock function
export function mock(fn?: (...args: unknown[]) => unknown) {
  return nodeMock.fn(fn);
}

// Expect compatibility: maps bun:test's expect() to node:assert-based matchers
class Expectation {
  private value: unknown;
  private negated = false;

  constructor(value: unknown) {
    this.value = value;
  }

  get not() {
    const neg = new Expectation(this.value);
    neg.negated = !this.negated;
    return neg;
  }

  toBe(expected: unknown) {
    if (this.negated) {
      nodeAssert.notStrictEqual(this.value, expected);
    } else {
      nodeAssert.strictEqual(this.value, expected);
    }
  }

  toEqual(expected: unknown) {
    if (this.negated) {
      nodeAssert.notDeepStrictEqual(this.value, expected);
    } else {
      nodeAssert.deepStrictEqual(this.value, expected);
    }
  }

  toStrictEqual(expected: unknown) {
    if (this.negated) {
      nodeAssert.notDeepStrictEqual(this.value, expected);
    } else {
      nodeAssert.deepStrictEqual(this.value, expected);
    }
  }

  toBeTruthy() {
    if (this.negated) {
      nodeAssert.ok(!this.value);
    } else {
      nodeAssert.ok(this.value);
    }
  }

  toBeFalsy() {
    if (this.negated) {
      nodeAssert.ok(this.value);
    } else {
      nodeAssert.ok(!this.value);
    }
  }

  toBeNull() {
    if (this.negated) {
      nodeAssert.notStrictEqual(this.value, null);
    } else {
      nodeAssert.strictEqual(this.value, null);
    }
  }

  toBeUndefined() {
    if (this.negated) {
      nodeAssert.notStrictEqual(this.value, undefined);
    } else {
      nodeAssert.strictEqual(this.value, undefined);
    }
  }

  toBeDefined() {
    if (this.negated) {
      nodeAssert.strictEqual(this.value, undefined);
    } else {
      nodeAssert.notStrictEqual(this.value, undefined);
    }
  }

  toBeGreaterThan(expected: number) {
    const pass = (this.value as number) > expected;
    if (this.negated ? pass : !pass) {
      nodeAssert.fail(`expected ${this.value} ${this.negated ? 'not ' : ''}to be greater than ${expected}`);
    }
  }

  toBeGreaterThanOrEqual(expected: number) {
    const pass = (this.value as number) >= expected;
    if (this.negated ? pass : !pass) {
      nodeAssert.fail(`expected ${this.value} ${this.negated ? 'not ' : ''}to be >= ${expected}`);
    }
  }

  toBeLessThan(expected: number) {
    const pass = (this.value as number) < expected;
    if (this.negated ? pass : !pass) {
      nodeAssert.fail(`expected ${this.value} ${this.negated ? 'not ' : ''}to be less than ${expected}`);
    }
  }

  toBeLessThanOrEqual(expected: number) {
    const pass = (this.value as number) <= expected;
    if (this.negated ? pass : !pass) {
      nodeAssert.fail(`expected ${this.value} ${this.negated ? 'not ' : ''}to be <= ${expected}`);
    }
  }

  toContain(expected: unknown) {
    const val = this.value as string | unknown[];
    const pass = Array.isArray(val) ? val.includes(expected) : typeof val === 'string' ? val.includes(expected as string) : false;
    if (this.negated ? pass : !pass) {
      nodeAssert.fail(`expected ${JSON.stringify(this.value)} ${this.negated ? 'not ' : ''}to contain ${JSON.stringify(expected)}`);
    }
  }

  toHaveLength(expected: number) {
    const len = (this.value as { length: number }).length;
    if (this.negated) {
      nodeAssert.notStrictEqual(len, expected);
    } else {
      nodeAssert.strictEqual(len, expected);
    }
  }

  toMatch(expected: RegExp | string) {
    const str = this.value as string;
    const pass = typeof expected === 'string' ? str.includes(expected) : expected.test(str);
    if (this.negated ? pass : !pass) {
      nodeAssert.fail(`expected "${str}" ${this.negated ? 'not ' : ''}to match ${expected}`);
    }
  }

  toThrow(expected?: string | RegExp | Error) {
    let threw = false;
    let error: unknown;
    try {
      (this.value as () => void)();
    } catch (e) {
      threw = true;
      error = e;
    }
    if (this.negated) {
      if (threw) nodeAssert.fail(`expected function not to throw, but it threw ${error}`);
    } else {
      if (!threw) nodeAssert.fail('expected function to throw');
      if (expected !== undefined) {
        const msg = error instanceof Error ? error.message : String(error);
        if (typeof expected === 'string') {
          nodeAssert.ok(msg.includes(expected), `expected error message to include "${expected}", got "${msg}"`);
        } else if (expected instanceof RegExp) {
          nodeAssert.ok(expected.test(msg), `expected error message to match ${expected}, got "${msg}"`);
        }
      }
    }
  }

  toBeInstanceOf(expected: new (...args: unknown[]) => unknown) {
    const pass = this.value instanceof expected;
    if (this.negated ? pass : !pass) {
      nodeAssert.fail(`expected ${this.value} ${this.negated ? 'not ' : ''}to be instance of ${expected.name}`);
    }
  }

  toHaveProperty(key: string, value?: unknown) {
    const obj = this.value as Record<string, unknown>;
    const has = obj != null && key in (obj as object);
    if (this.negated) {
      if (has) nodeAssert.fail(`expected object not to have property "${key}"`);
    } else {
      if (!has) nodeAssert.fail(`expected object to have property "${key}"`);
      if (value !== undefined) {
        nodeAssert.deepStrictEqual(obj[key], value);
      }
    }
  }

  toBeCloseTo(expected: number, precision = 2) {
    const diff = Math.abs((this.value as number) - expected);
    const pass = diff < Math.pow(10, -precision) / 2;
    if (this.negated ? pass : !pass) {
      nodeAssert.fail(`expected ${this.value} ${this.negated ? 'not ' : ''}to be close to ${expected} (precision ${precision})`);
    }
  }
}

export function expect(value: unknown): Expectation {
  return new Expectation(value);
}
