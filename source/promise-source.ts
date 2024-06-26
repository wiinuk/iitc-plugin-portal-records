export class PromiseSource<T> {
    private _resolve!: (value: T) => void;
    private _reject!: (reason?: unknown) => void;
    readonly promise: Promise<T>;

    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    setResult(value: T) {
        this._resolve(value);
    }
    setError(value: unknown) {
        this._reject(value);
    }
}
