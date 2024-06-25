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
    readonly record: Id<any>;
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

export interface IterateValuesRequest {
    readonly store: IDBObjectStore;
    readonly query: IDBValidKey | IDBKeyRange | null | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly action: (value: any) => "continue" | "return" | undefined;
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
    storeName: TName,
    mode: IDBTransactionMode,
    scope: (store: Store<TSchema, TName>) => TransactionScope<TResult>,
    signal: AbortSignal
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
            openCursor_request = yieldValue.store.openCursor(yieldValue.query);
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
type resolveKey<
    propertyName extends string,
    recordType
> = propertyName extends keyof recordType
    ? recordType[propertyName] extends IDBValidKey
        ? recordType[propertyName]
        : never
    : never;

type resolveKeyArray<propertyNames extends readonly string[], recordType> = {
    [i in keyof propertyNames]: resolveKey<propertyNames[i], recordType>;
};
type resolveKeys<
    keys extends string | readonly string[],
    recordType
> = keys extends string
    ? resolveKey<keys, recordType>
    : keys extends readonly string[]
    ? resolveKeyArray<keys, recordType>
    : never;

export function* getValueOfKey<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string
>(
    store: Store<TSchema, TStoreName>,
    key: resolveKeys<
        TSchema[TStoreName]["key"],
        UnwrapId<TSchema[TStoreName]["record"]>
    >
) {
    return (yield store.get(key)) as
        | UnwrapId<TSchema[TStoreName]["record"]>
        | undefined;
}
export function* getValueOfIndex<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string,
    TIndexName extends keyof TSchema[TStoreName]["indexes"] & string
>(
    index: Index<TSchema, TStoreName, TIndexName>,
    key: resolveKeys<
        TSchema[TStoreName]["indexes"][TIndexName]["key"],
        UnwrapId<TSchema[TStoreName]["record"]>
    >
): TransactionScope<UnwrapId<TSchema[TStoreName]["record"]> | undefined> {
    return (yield index.get(key)) as
        | UnwrapId<TSchema[TStoreName]["record"]>
        | undefined;
}
export function* putValue<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string
>(
    store: Store<TSchema, TStoreName>,
    value: UnwrapId<TSchema[TStoreName]["record"]>
): TransactionScope<UnwrapId<TSchema[TStoreName]["record"]>> {
    yield store.put(value);
    return value;
}
export function* iterateValues<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string
>(
    store: Store<TSchema, TStoreName>,
    action: (
        value: UnwrapId<TSchema[TStoreName]["record"]>
    ) => "continue" | "return" | undefined
): TransactionScope<void> {
    yield { store, query: null, action };
    return;
}