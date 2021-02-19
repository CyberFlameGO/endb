import {stringify, parse} from 'buffer-json';
import {EventEmitter} from 'events';
import {get, has, set, unset} from 'lodash';

const adapters = {
    mongo: '@endb/mongo',
    mongodb: '@endb/mongo',
    mysql: '@endb/mysql',
    postgres: '@endb/postgres',
    postgresql: '@endb/postgres',
    redis: '@endb/redis',
    sqlite: '@endb/sqlite',
};

const load = <TVal>(options: Endb.EndbAdapterOptions<TVal>) => {
    const validAdapters = Object.keys(adapters);
    let adapter: string | undefined;
    if (options.adapter) {
        adapter = options.adapter;
    }
    else if (options.uri) {
        const matches = /^[^:]+/.exec(options.uri);
        if (matches === null) {
            throw new Error(`[endb]: could not infer adapter from "${options.uri}"`);
        }
        adapter = matches[0];
    }
    if (!adapter) {
        return new Map();
    }
    if (validAdapters.includes(adapter)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Adapter = require(adapters[adapter]).default;
        return new Adapter(options);
    }
    throw new Error(`[endb]: invalid adapter "${adapter}"`);
};

class Endb<TVal> extends EventEmitter {
    protected readonly options: Endb.EndbOptions<TVal>;
    constructor(options: string | Partial<Endb.EndbOptions<TVal>> = {}) {
        super();

        const adapterOptions = {
            namespace: 'endb',
            serialize: stringify,
            deserialize: parse,
            ...(typeof options === 'string' ? { uri: options } : options),
        };
        this.options = {
            ...adapterOptions,
            // I don't have the original type so the ts-ignore is
            // temporary until I can figure it out properly.
            //
            // @ts-ignore
            store: adapterOptions.store || load<TVal>(adapterOptions),
        };
        if (typeof this.options.store.on === 'function') {
            this.options.store.on('error', (error) => this.emit('error', error));
        }
        this.options.store.namespace = this.options.namespace;
    }

    async all() {
        const { store, deserialize } = this.options;
        const elements: Endb.Element<any>[] = [];
        if (store instanceof Map) {
            for (const [key, value] of store.entries()) {
                elements.push({
                    key: this.removeKeyPrefix(key),
                    value: typeof value === 'string' ? deserialize(value) : value,
                });
            }
            return elements;
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const data = await store.all();
        for (const { key, value } of data) {
            elements.push({
                key: this.removeKeyPrefix(key),
                value: typeof value === 'string' ? deserialize(value) : value,
            });
        }
        return elements;
    }

    async clear() {
        return this.options.store.clear();
    }

    async delete(key: string, path?: string) {
        if (path != undefined) {
            const data = (await this.get(key)) || {};
            unset(data, path);
            return (await this.set(key, data));
        }

        return this.options.store.delete(this.addKeyPrefix(key));
    }

    async entries() {
        return (await this.all()).map(element => [element.key, element.value]);
    }

    async get(key: string, path?: string) {
        const keyPrefixed = this.addKeyPrefix(key);
        const { store, deserialize } = this.options;
        const serialized = await store.get(keyPrefixed);
        const deserialized = typeof serialized === 'string' ? deserialize(serialized) : serialized;
        if (deserialized === undefined)
            return undefined;
        if (path != undefined)
            return get(deserialized, path);
        return deserialized;
    }

    async has(key: string, path?: string) {
        if (path != undefined) {
            const data = (await this.get(key)) || {};
            return has(data, path);
        }

        const { store } = this.options;
        return (await store.has(this.addKeyPrefix(key)));
    }

    async keys() {
        return (await this.all()).map((element) => element.key);
    }

    async set(key: string, value: any, path?: string) {
        const { store, serialize } = this.options;
        if (path != undefined) {
            const data = (await this.get(key)) || {};
            value = set(data, path, value);
        }

        const keyPrefixed = this.addKeyPrefix(key);
        const serialized = serialize(value);

        await store.set(keyPrefixed, serialized);
        return true;
    }
    
    async values() {
        return (await this.all()).map((element) => element.value);
    }

    addKeyPrefix(key: string) {
        return `${this.options.namespace}:${key}`;
    }

    removeKeyPrefix(key: string) {
        return key.replace(`${this.options.namespace}:`, '');
    }
}

declare namespace Endb {
    type MaybePromise<T> = T | Promise<T>;

    export interface EndbOptions<TVal, TSerialized = string> {
        namespace: string;
        store: EndbAdapter<TVal, TSerialized>;
        uri?: string;
        adapter?: keyof typeof adapters;
        serialize(data: TVal): TSerialized;
        deserialize(data: TSerialized): TVal;
    }
    export interface EndbAdapter<TVal, TSerialized = string> {
        namespace: string;
        on?(event: 'error', callback: (error: Error) => void | never): void;
        all(): MaybePromise<Element<TSerialized>[]>;
        clear(): MaybePromise<void>;
        delete(key: string): MaybePromise<boolean>;
        get(key: string): MaybePromise<void | TVal | TSerialized>;
        has(key: string): MaybePromise<boolean>;
        set(key: string, value: TSerialized): MaybePromise<unknown>;
    }
    export interface Element<T> {
        key: string;
        value: T;
    }

    export interface EndbAdapterOptions<TVal> {
        namespace: string,
        uri?: string,
        store: EndbAdapter<TVal>,
        adapter?: keyof typeof adapters;
        serialize(data: any): any;
        deserialize(data: any): any;
    }
}

export = Endb;