import { newAbortError } from "./standard-extensions";

const privateTagSymbol = Symbol("privateTagSymbol");
export type Tagged<TEntity, TTag> = TEntity & {
    readonly [privateTagSymbol]: TTag;
};
function withTag<E, M>(value: E) {
    return value as unknown as Tagged<E, M>;
}
export type StoreSchemaKind = {
    /** record type */
    readonly record: unknown;
    /** index name to key paths */
    readonly indexes: Readonly<Record<string, string[]>>;
};
export type DatabaseSchemaKind = Readonly<Record<string, StoreSchemaKind>>;
export type Database<TSchema> = Tagged<IDBDatabase, TSchema>;

export function openDatabase<TSchema extends DatabaseSchemaKind>(
    databaseName: string,
    databaseVersion: number | undefined,
    onUpgradeNeeded: (database: IDBDatabase) => void
) {
    return new Promise<Database<TSchema>>((resolve, reject) => {
        const request = window.indexedDB.open(databaseName, databaseVersion);
        request.onupgradeneeded = () => onUpgradeNeeded(request.result);
        request.onblocked = () => reject(new Error("database blocked"));
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(withTag(request.result));
    });
}

export interface IterateValuesRequest {
    readonly store: IDBObjectStore;
    readonly query: IDBValidKey | IDBKeyRange | null | undefined;
    readonly action: (value: unknown) => "continue" | "return" | undefined;
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

const enum ResolvingKind {
    Request,
    Cursor,
}
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

        let resolvingKind: ResolvingKind | undefined;
        let resolvingRequest: IDBRequest | undefined;
        let resolvingCursorRequest:
            | IDBRequest<IDBCursorWithValue | null>
            | undefined;
        let resolvingCursorAction: IterateValuesRequest["action"] | undefined;
        function onResolved() {
            let r;
            switch (resolvingKind) {
                case undefined:
                    r = iterator.next();
                    break;
                case ResolvingKind.Request: {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const result = resolvingRequest!.result;
                    resolvingKind = undefined;
                    resolvingRequest = undefined;
                    r = iterator.next(result);
                    break;
                }
                case ResolvingKind.Cursor: {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const cursor = resolvingCursorRequest!.result;
                    if (
                        cursor === null ||
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        resolvingCursorAction!(cursor.value) === "return"
                    ) {
                        resolvingKind = undefined;
                        resolvingCursorRequest = undefined;
                        resolvingCursorAction = undefined;
                        r = iterator.next(undefined);
                    } else {
                        cursor.continue();
                        return;
                    }
                    break;
                }
                default: {
                    reject(
                        new Error(`Invalid resolving kind: ${resolvingKind}`)
                    );
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
                resolvingKind = ResolvingKind.Request;
                resolvingRequest = yieldValue;
                yieldValue.onsuccess = onResolved;
                return;
            }
            resolvingKind = ResolvingKind.Cursor;
            resolvingCursorRequest = yieldValue.store.openCursor(
                yieldValue.query
            );
            resolvingCursorAction = yieldValue.action;
            resolvingCursorRequest.onsuccess = onResolved;
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
type resolveProps<TPropertyNames extends readonly string[], TRecordType> = {
    [i in keyof TPropertyNames]: TPropertyNames[i] extends keyof TRecordType
        ? TRecordType[TPropertyNames[i]] extends IDBValidKey
            ? TRecordType[TPropertyNames[i]]
            : never
        : never;
};

export function* getValueOfIndex<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string,
    TIndexName extends keyof TSchema[TStoreName]["indexes"] & string
>(
    index: Index<TSchema, TStoreName, TIndexName>,
    key: resolveProps<
        TSchema[TStoreName]["indexes"][TIndexName],
        TSchema[TStoreName]["record"]
    >
): TransactionScope<TSchema[TStoreName]["record"] | undefined> {
    return (yield index.get(key)) as TSchema[TStoreName]["record"] | undefined;
}
export function* putValue<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string
>(
    store: Store<TSchema, TStoreName>,
    value: TSchema[TStoreName]["record"]
): TransactionScope<TSchema[TStoreName]["record"]> {
    yield store.put(value);
    return value;
}
export function* iterateValues<
    TSchema extends DatabaseSchemaKind,
    TStoreName extends keyof TSchema & string
>(
    store: Store<TSchema, TStoreName>,
    action: (
        value: TSchema[TStoreName]["record"]
    ) => "continue" | "return" | undefined
): TransactionScope<void> {
    yield { store, query: null, action };
    return;
}
