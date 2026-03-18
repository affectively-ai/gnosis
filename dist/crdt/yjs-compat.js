'use aeon';
class MockYText {
    _content = '';
    _observers = [];
    _doc = null;
    insert(index, text) {
        this._content =
            this._content.slice(0, index) + text + this._content.slice(index);
        this._notifyDoc();
    }
    delete(index, length) {
        this._content =
            this._content.slice(0, index) + this._content.slice(index + length);
        this._notifyDoc();
    }
    _notifyDoc() {
        if (!this._doc) {
            return;
        }
        const handlers = this._doc._listeners.get('update') || [];
        for (const handler of handlers) {
            handler(new Uint8Array(0), null);
        }
    }
    toString() {
        return this._content;
    }
    toJSON() {
        return this._content;
    }
    observe(fn) {
        this._observers.push(fn);
    }
    unobserve() {
        // no-op
    }
}
class MockYMap {
    _map = new Map();
    _observers = [];
    _doc = null;
    get doc() {
        return this._doc;
    }
    set(k, v) {
        const action = this._map.has(k) ? 'update' : 'add';
        this._map.set(k, v);
        this._fireObservers(k, action);
    }
    get(k) {
        return this._map.get(k);
    }
    has(k) {
        return this._map.has(k);
    }
    delete(k) {
        const had = this._map.has(k);
        const result = this._map.delete(k);
        if (had) {
            this._fireObservers(k, 'delete');
        }
        return result;
    }
    toJSON() {
        return Object.fromEntries(this._map);
    }
    forEach(fn) {
        this._map.forEach((value, key) => fn(value, key));
    }
    entries() {
        return this._map.entries();
    }
    keys() {
        return this._map.keys();
    }
    values() {
        return this._map.values();
    }
    [Symbol.iterator]() {
        return this._map[Symbol.iterator]();
    }
    get size() {
        return this._map.size;
    }
    observe(fn) {
        this._observers.push(fn);
    }
    unobserve(fn) {
        const index = this._observers.indexOf(fn);
        if (index >= 0) {
            this._observers.splice(index, 1);
        }
    }
    _fireObservers(key, action) {
        const changes = new Map([[key, { action }]]);
        const event = { changes: { keys: changes } };
        for (const observer of this._observers) {
            observer(event);
        }
    }
}
class MockYArray {
    _arr = [];
    _observers = [];
    push(items) {
        this._arr.push(...items);
        this._emitInsert(items);
    }
    insert(index, content) {
        this._arr.splice(index, 0, ...content);
        this._emitInsert(content);
    }
    delete(index, length) {
        this._arr.splice(index, length);
    }
    get(index) {
        return this._arr[index];
    }
    toArray() {
        return [...this._arr];
    }
    toJSON() {
        return [...this._arr];
    }
    get length() {
        return this._arr.length;
    }
    forEach(fn) {
        this._arr.forEach(fn);
    }
    map(fn) {
        return this._arr.map(fn);
    }
    observe(fn) {
        this._observers.push(fn);
    }
    unobserve(fn) {
        const index = this._observers.indexOf(fn);
        if (index >= 0) {
            this._observers.splice(index, 1);
        }
    }
    _emitInsert(insert) {
        if (insert.length === 0) {
            return;
        }
        const event = { changes: { delta: [{ insert }] } };
        for (const observer of this._observers) {
            observer(event);
        }
    }
}
class MockXmlElement {
    nodeName;
    attrs = new Map();
    textContent = '';
    constructor(nodeName = 'div') {
        this.nodeName = nodeName;
    }
    setAttribute(key, value) {
        this.attrs.set(key, value);
    }
    getAttribute(key) {
        return this.attrs.get(key) ?? null;
    }
    insert(index, text) {
        this.textContent =
            this.textContent.slice(0, index) + text + this.textContent.slice(index);
    }
    delete(index, length) {
        this.textContent =
            this.textContent.slice(0, index) + this.textContent.slice(index + length);
    }
    toString() {
        return this.textContent;
    }
}
class MockXmlFragment {
    _children = [];
    _observers = [];
    insert(index, content) {
        this._children.splice(index, 0, ...content);
    }
    delete(index, length) {
        this._children.splice(index, length);
    }
    get(index) {
        return this._children[index];
    }
    get length() {
        return this._children.length;
    }
    toArray() {
        return [...this._children];
    }
    toString() {
        return this._children.map((child) => String(child)).join('');
    }
    toJSON() {
        return [...this._children];
    }
    observe(fn) {
        this._observers.push(fn);
    }
    unobserve(fn) {
        const index = this._observers.indexOf(fn);
        if (index >= 0) {
            this._observers.splice(index, 1);
        }
    }
}
export class Doc {
    clientID = Math.floor(Math.random() * 1e9);
    gc = true;
    _texts = new Map();
    _maps = new Map();
    _arrays = new Map();
    _xmlFragments = new Map();
    _listeners = new Map();
    getText(name) {
        let text = this._texts.get(name);
        if (!text) {
            text = new MockYText();
            text._doc = this;
            this._texts.set(name, text);
        }
        return text;
    }
    getMap(name) {
        let map = this._maps.get(name);
        if (!map) {
            map = new MockYMap();
            map._doc = this;
            this._maps.set(name, map);
        }
        return map;
    }
    getArray(name) {
        let array = this._arrays.get(name);
        if (!array) {
            array = new MockYArray();
            this._arrays.set(name, array);
        }
        return array;
    }
    getXmlFragment(name) {
        let fragment = this._xmlFragments.get(name);
        if (!fragment) {
            fragment = new MockXmlFragment();
            this._xmlFragments.set(name, fragment);
        }
        return fragment;
    }
    transact(fn, origin) {
        fn();
        const handlers = this._listeners.get('update') || [];
        for (const handler of handlers) {
            handler(new Uint8Array(0), origin);
        }
    }
    on(event, fn) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event)?.push(fn);
    }
    off(event, fn) {
        const handlers = this._listeners.get(event);
        if (!handlers) {
            return;
        }
        const index = handlers.indexOf(fn);
        if (index >= 0) {
            handlers.splice(index, 1);
        }
    }
    destroy() {
        this._listeners.clear();
    }
}
export function encodeStateAsUpdate(doc, _stateVector) {
    const snapshot = {
        texts: {},
        maps: {},
        arrays: {},
    };
    doc._texts.forEach((text, key) => {
        snapshot.texts[key] = text._content;
    });
    doc._maps.forEach((map, key) => {
        snapshot.maps[key] = Object.fromEntries(map._map);
    });
    doc._arrays.forEach((array, key) => {
        snapshot.arrays[key] = [...array._arr];
    });
    return new TextEncoder().encode(JSON.stringify(snapshot));
}
export function applyUpdate(doc, update) {
    try {
        const raw = new TextDecoder().decode(update);
        const snapshot = JSON.parse(raw);
        if (snapshot.texts) {
            for (const [key, value] of Object.entries(snapshot.texts)) {
                const text = doc.getText(key);
                text._content = value;
            }
        }
        if (snapshot.maps) {
            for (const [key, value] of Object.entries(snapshot.maps)) {
                const map = doc.getMap(key);
                for (const [entryKey, entryValue] of Object.entries(value)) {
                    map.set(entryKey, entryValue);
                }
            }
        }
        if (snapshot.arrays) {
            for (const [key, value] of Object.entries(snapshot.arrays)) {
                const array = doc.getArray(key);
                array._arr = [...value];
            }
        }
    }
    catch {
        // Ignore invalid payloads.
    }
}
export function transact(doc, fn, origin) {
    doc.transact(fn, origin);
}
export const encodeStateVector = () => new Uint8Array(0);
export const diffUpdate = (update, _sv) => update;
export const mergeUpdates = (updates) => updates[0] ?? new Uint8Array(0);
class MockUndoManager {
    scope;
    trackedOrigins;
    undoStack = [];
    redoStack = [];
    doc;
    constructor(scope, options) {
        this.scope = scope;
        this.trackedOrigins = options?.trackedOrigins ?? new Set();
        this.doc = scope._doc;
        if (this.doc) {
            this.doc.on('update', (_update, origin) => {
                if (this.trackedOrigins.has(origin)) {
                    this.undoStack.push({ content: this.scope.toString() });
                    this.redoStack.length = 0;
                }
            });
        }
    }
    undo() {
        const item = this.undoStack.pop();
        if (!item) {
            return;
        }
        this.redoStack.push({ content: this.scope.toString() });
        this.scope.delete(0, this.scope._content.length);
        if (this.undoStack.length > 0) {
            const previous = this.undoStack[this.undoStack.length - 1];
            this.scope.insert(0, previous.content);
        }
    }
    redo() {
        const item = this.redoStack.pop();
        if (!item) {
            return;
        }
        this.undoStack.push({ content: this.scope.toString() });
        this.scope.delete(0, this.scope._content.length);
        this.scope.insert(0, item.content);
    }
    destroy() {
        // no-op
    }
    clear() {
        this.undoStack.length = 0;
        this.redoStack.length = 0;
    }
}
export { MockUndoManager as UndoManager, MockYMap as Map, MockYArray as Array, MockYText as Text, MockXmlFragment as XmlFragment, MockXmlElement as XmlElement, };
