/**
 * Yjs compatibility surface backed by gnosis-owned code.
 *
 * This module exists for broad migration: existing Yjs call sites can
 * switch imports from `yjs` to `@a0n/gnosis` without pulling
 * external Yjs at runtime.
 */
type UpdateHandler = (update: Uint8Array, origin: unknown) => void;
declare class MockYText {
    _content: string;
    _observers: Array<() => void>;
    _doc: Doc | null;
    insert(index: number, text: string): void;
    delete(index: number, length: number): void;
    private _notifyDoc;
    toString(): string;
    toJSON(): string;
    observe(fn: () => void): void;
    unobserve(): void;
}
declare class MockYMap {
    _map: Map<string, unknown>;
    _observers: Array<(event: unknown) => void>;
    _doc: Doc | null;
    get doc(): Doc | null;
    set(k: string, v: unknown): void;
    get(k: string): unknown;
    has(k: string): boolean;
    delete(k: string): boolean;
    toJSON(): Record<string, unknown>;
    forEach(fn: (value: unknown, key: string) => void): void;
    entries(): IterableIterator<[string, unknown]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<unknown>;
    [Symbol.iterator](): IterableIterator<[string, unknown]>;
    get size(): number;
    observe(fn: (event: unknown) => void): void;
    unobserve(fn: (event: unknown) => void): void;
    private _fireObservers;
}
declare class MockYArray {
    _arr: unknown[];
    _observers: Array<(event: {
        changes: {
            delta: Array<{
                insert?: unknown[];
            }>;
        };
    }) => void>;
    push(items: unknown[]): void;
    insert(index: number, content: unknown[]): void;
    delete(index: number, length: number): void;
    get(index: number): unknown;
    toArray(): unknown[];
    toJSON(): unknown[];
    get length(): number;
    forEach(fn: (value: unknown, index: number, array: unknown[]) => void): void;
    map<T>(fn: (value: unknown, index: number, array: unknown[]) => T): T[];
    observe(fn: (event: {
        changes: {
            delta: Array<{
                insert?: unknown[];
            }>;
        };
    }) => void): void;
    unobserve(fn: (event: {
        changes: {
            delta: Array<{
                insert?: unknown[];
            }>;
        };
    }) => void): void;
    private _emitInsert;
}
declare class MockXmlElement {
    readonly nodeName: string;
    private readonly attrs;
    private textContent;
    constructor(nodeName?: string);
    setAttribute(key: string, value: string): void;
    getAttribute(key: string): string | null;
    insert(index: number, text: string): void;
    delete(index: number, length: number): void;
    toString(): string;
}
declare class MockXmlFragment {
    _children: unknown[];
    _observers: Array<(event: unknown) => void>;
    insert(index: number, content: unknown[]): void;
    delete(index: number, length: number): void;
    get(index: number): unknown;
    get length(): number;
    toArray(): unknown[];
    toString(): string;
    toJSON(): unknown[];
    observe(fn: (event: unknown) => void): void;
    unobserve(fn: (event: unknown) => void): void;
}
export declare class Doc {
    clientID: number;
    gc: boolean;
    _texts: Map<string, MockYText>;
    _maps: Map<string, MockYMap>;
    _arrays: Map<string, MockYArray>;
    _xmlFragments: Map<string, MockXmlFragment>;
    _listeners: Map<string, UpdateHandler[]>;
    getText(name: string): MockYText;
    getMap(name: string): MockYMap;
    getArray(name: string): MockYArray;
    getXmlFragment(name: string): MockXmlFragment;
    transact(fn: () => void, origin?: unknown): void;
    on(event: string, fn: UpdateHandler): void;
    off(event: string, fn: UpdateHandler): void;
    destroy(): void;
}
export declare function encodeStateAsUpdate(doc: Doc, _stateVector?: Uint8Array): Uint8Array;
export declare function applyUpdate(doc: Doc, update: Uint8Array): void;
export declare function transact(doc: Doc, fn: () => void, origin?: unknown): void;
export declare const encodeStateVector: () => Uint8Array;
export declare const diffUpdate: (update: Uint8Array, _sv: Uint8Array) => Uint8Array;
export declare const mergeUpdates: (updates: Uint8Array[]) => Uint8Array;
declare class MockUndoManager {
    private readonly scope;
    private readonly trackedOrigins;
    private readonly undoStack;
    private readonly redoStack;
    private readonly doc;
    constructor(scope: MockYText, options?: {
        trackedOrigins?: Set<unknown>;
    });
    undo(): void;
    redo(): void;
    destroy(): void;
    clear(): void;
}
export { MockUndoManager as UndoManager, MockYMap as Map, MockYArray as Array, MockYText as Text, MockXmlFragment as XmlFragment, MockXmlElement as XmlElement, };
