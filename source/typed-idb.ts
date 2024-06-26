import { newAbortError, type Id } from "./standard-extensions";

const privateTagSymbol = Symbol("privateTagSymbol");
export type Tagged<TEntity, TTag> = TEntity & {
    readonly [privateTagSymbol]: TTag;
};
function withTag<E, M>(value: E) {
    return value as unknown as Tagged<E, M>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnwrapId<TId extends Id<any>> = TId extends Id<infer T> ? T : never;
export interface IndexSchemaKind {
    readonly key: string | string[];
    readonly unique?: boolean;
    readonly multiEntry?: boolean;
}
export interface StoreSchemaKind {
    /** record type */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly recordType: Id<any>;
    readonly key: string | string[];
    /** index name to key paths */
    readonly indexes: Readonly<Record<string, IndexSchemaKind>>;
}
export type DatabaseSchemaKind = Readonly<Record<string, StoreSchemaKind>>;
export type Database<TSchema> = Tagged<IDBDatabase, TSchema>;

function defineDatabase<TSchema extends DatabaseSchemaKind>(
    database: IDBDatabase,
    schema: TSchema
) {
    for (const [storeName, storeSchema] of Object.entries(schema)) {
        const store = database.createObjectStore(storeName, {
            keyPath: storeSchema.key.slice(),
        });
        for (const [indexName, options] of Object.entries(
            storeSchema.indexes
        )) {
            store.createIndex(indexName, options.key, options);
        }
    }
}

export function openDatabase<TSchema extends DatabaseSchemaKind>(
    databaseName: string,
    databaseVersion: number | undefined,
    databaseSchema: TSchema
) {
    return new Promise<Database<TSchema>>((resolve, reject) => {
        const request = window.indexedDB.open(databaseName, databaseVersion);
        request.onupgradeneeded = () =>
            defineDatabase(request.result, databaseSchema);
        request.onblocked = () => reject(new Error("database blocked"));
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(withTag(request.result));
    });
}

export type IterationFlow = "continue" | "return" | undefined;
export interface IterateValuesRequest {
    readonly source: IDBObjectStore | IDBIndex;
    readonly query: IDBValidKey | IDBKeyRange | null | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly action: (value: any) => IterationFlow;
}
interface TransactionalOperations {
    request(value: IDBRequest): unknown;
    iterateValues(value: IterateValuesRequest): void;
}
export type TransactionScope<R> = Generator<
    Parameters<TransactionalOperations[keyof TransactionalOperations]>[0],
    R,
    ReturnType<TransactionalOperations[keyof TransactionalOperations]>
>;

export type Store<TSchema, TStoreName> = Tagged<
    IDBObjectStore,
    [TSchema, TStoreName]
>;

export function enterTransactionScope<
    TSchema extends DatabaseSchemaKind,
    TName extends keyof TSchema & string,
    TResult
>(
    database: Database<TSchema>,
    {
        storeName,
        mode,
        signal,
    }: {
        storeName: TName;
        mode: IDBTransactionMode;
        signal: AbortSignal;
    },
    scope: (store: Store<TSchema, TName>) => TransactionScope<TResult>
): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
        if (signal.aborted) {
            reject(newAbortError());
            return;
        }

        let hasResult = false;
        let result: TResult;

        const transaction = database.transaction(storeName, mode);

        const onAbort = () => transaction.abort();
        transaction.oncomplete = () => {
            signal.removeEventListener("abort", onAbort);
            hasResult ? resolve(result) : reject(new Error(`internal error`));
        };
        transaction.onerror = function (e) {
            signal.removeEventListener("abort", onAbort);
            reject((e.target as IDBRequest).error);
        };
        signal.addEventListener("abort", onAbort);

        const store: Store<TSchema, TName> = withTag(
            transaction.objectStore(storeName)
        );

        const iterator = scope(store);

        const enum StateKind {
            Request,
            OpenCursor,
        }
        let stateKind: StateKind | undefined;
        let request_request: IDBRequest | undefined;
        let openCursor_request:
            | IDBRequest<IDBCursorWithValue | null>
            | undefined;
        let openCursor_action: IterateValuesRequest["action"] | undefined;
        function onResolved() {
            let r;
            switch (stateKind) {
                case undefined:
                    r = iterator.next();
                    break;
                case StateKind.Request: {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const result = request_request!.result;
                    stateKind = undefined;
                    request_request = undefined;
                    r = iterator.next(result);
                    break;
                }
                case StateKind.OpenCursor: {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const cursor = openCursor_request!.result;
                    if (
                        cursor === null ||
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        openCursor_action!(cursor.value) === "return"
                    ) {
                        stateKind = undefined;
                        openCursor_request = undefined;
                        openCursor_action = undefined;
                        r = iterator.next(undefined);
                    } else {
                        cursor.continue();
                        return;
                    }
                    break;
                }
                default: {
                    reject(new Error(`Invalid resolving kind: ${stateKind}`));
                    return;
                }
            }
            if (r.done) {
                hasResult = true;
                result = r.value;
                return;
            }
            const yieldValue = r.value;
            if (yieldValue instanceof IDBRequest) {
                stateKind = StateKind.Request;
                request_request = yieldValue;
                yieldValue.onsuccess = onResolved;
                return;
            }
            stateKind = StateKind.OpenCursor;
            openCursor_request = yieldValue.source.openCursor(yieldValue.query);
            openCursor_action = yieldValue.action;
            openCursor_request.onsuccess = onResolved;
        }
        onResolved();
    });
}
export type Index<TSchema, TStoreName, TIndexName> = Tagged<
    IDBIndex,
    [TSchema, TStoreName, TIndexName]
>;
export function getIndex<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string,
    TIndexName extends keyof TSchema[TStoreName]["indexes"] & string
>(
    store: Store<TSchema, TStoreName>,
    indexName: TIndexName
): Index<TSchema, TStoreName, TIndexName> {
    return withTag(store.index(indexName));
}
type resolveRecordKey<
    propertyName extends string,
    recordType
> = propertyName extends keyof recordType
    ? recordType[propertyName] extends IDBValidKey
        ? recordType[propertyName]
        : never
    : never;

type resolveRecordKeyArray<
    propertyNames extends readonly string[],
    recordType
> = {
    [i in keyof propertyNames]: resolveRecordKey<propertyNames[i], recordType>;
};
type resolveRecordKeyType<
    keys extends string | readonly string[],
    recordType
> = keys extends string
    ? resolveRecordKey<keys, recordType>
    : keys extends readonly string[]
    ? resolveRecordKeyArray<keys, recordType>
    : never;

export type StoreKey<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string
> = resolveRecordKeyType<
    TSchema[TStoreName]["key"],
    UnwrapId<TSchema[TStoreName]["recordType"]>
>;
export type IndexKey<
    schema extends DatabaseSchemaKind,
    storeName extends keyof schema & string,
    indexName extends keyof schema[storeName]["indexes"] & string
> = resolveRecordKeyType<
    schema[storeName]["indexes"][indexName]["key"],
    UnwrapId<schema[storeName]["recordType"]>
>;
export type AllValue = null;

export function* getValue<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string
>(
    store: Store<TSchema, TStoreName>,
    query:
        | StoreKey<TSchema, TStoreName>
        | KeyRange<StoreKey<TSchema, TStoreName>>
) {
    return (yield store.get(query)) as
        | UnwrapId<TSchema[TStoreName]["recordType"]>
        | undefined;
}
export function* getValueOfIndex<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string,
    TIndexName extends keyof TSchema[TStoreName]["indexes"] & string
>(
    index: Index<TSchema, TStoreName, TIndexName>,
    query:
        | IndexKey<TSchema, TStoreName, TIndexName>
        | KeyRange<IndexKey<TSchema, TStoreName, TIndexName>>
): TransactionScope<UnwrapId<TSchema[TStoreName]["recordType"]> | undefined> {
    return (yield index.get(query)) as
        | UnwrapId<TSchema[TStoreName]["recordType"]>
        | undefined;
}
export function* putValue<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string
>(
    store: Store<TSchema, TStoreName>,
    value: UnwrapId<TSchema[TStoreName]["recordType"]>
): TransactionScope<UnwrapId<TSchema[TStoreName]["recordType"]>> {
    yield store.put(value);
    return value;
}
export function* deleteValue<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string
>(
    store: Store<TSchema, TStoreName>,
    query:
        | StoreKey<TSchema, TStoreName>
        | KeyRange<StoreKey<TSchema, TStoreName>>
): TransactionScope<void> {
    yield store.delete(query);
}

export function* iterateValues<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string
>(
    store: Store<TSchema, TStoreName>,
    query:
        | StoreKey<TSchema, TStoreName>
        | KeyRange<StoreKey<TSchema, TStoreName>>
        | AllValue
        | undefined,
    action: (
        value: UnwrapId<TSchema[TStoreName]["recordType"]>
    ) => IterationFlow
): TransactionScope<void> {
    yield { source: store, query, action };
    return;
}
export function* iterateValuesOfIndex<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string,
    TIndexName extends keyof TSchema[TStoreName]["indexes"] & string
>(
    index: Index<TSchema, TStoreName, TIndexName>,
    query:
        | IndexKey<TSchema, TStoreName, TIndexName>
        | KeyRange<IndexKey<TSchema, TStoreName, TIndexName>>
        | AllValue
        | undefined,
    action: (
        value: UnwrapId<TSchema[TStoreName]["recordType"]>
    ) => IterationFlow
): TransactionScope<void> {
    yield { source: index, query, action };
    return;
}

export type KeyRange<K> = Tagged<IDBKeyRange, K>;
export function createBound<K extends IDBValidKey>(
    lower: K,
    upper: K,
    lowerOpen?: boolean,
    upperOpen?: boolean
) {
    return IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen) as KeyRange<K>;
}
export function createUpperBound<K extends IDBValidKey>(
    upper: K,
    open?: boolean
) {
    return IDBKeyRange.upperBound(upper, open) as KeyRange<K>;
}
export function createLowerBound<K extends IDBValidKey>(
    lower: K,
    open?: boolean
) {
    return IDBKeyRange.lowerBound(lower, open) as KeyRange<K>;
}
