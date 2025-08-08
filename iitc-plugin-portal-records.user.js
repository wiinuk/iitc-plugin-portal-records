// ==UserScript==
// @id           iitc-plugin-portal-records
// @name         IITC plugin: Portal Records
// @category     Layer
// @namespace    https://github.com/IITC-CE/ingress-intel-total-conversion
// @downloadURL  https://github.com/wiinuk/iitc-plugin-portal-records/raw/main/iitc-plugin-portal-records.user.js
// @updateURL    https://github.com/wiinuk/iitc-plugin-portal-records/raw/main/iitc-plugin-portal-records.user.js
// @homepageURL  https://github.com/wiinuk/iitc-plugin-portal-records
// @version      0.8.0
// @description  IITC plug-in to record portals and cells.
// @author       Wiinuk
// @include      https://*.ingress.com/intel*
// @include      http://*.ingress.com/intel*
// @match        https://*.ingress.com/intel*
// @match        http://*.ingress.com/intel*
// @include      https://*.ingress.com/mission/*
// @include      http://*.ingress.com/mission/*
// @match        https://*.ingress.com/mission/*
// @match        http://*.ingress.com/mission/*
// @icon         https://www.google.com/s2/favicons?domain=iitc.me
// @grant        GM_info
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

// NAMESPACE OBJECT: ./source/iitc-plugin-portal-records.tsx
var iitc_plugin_portal_records_namespaceObject = {};
__webpack_require__.r(iitc_plugin_portal_records_namespaceObject);
__webpack_require__.d(iitc_plugin_portal_records_namespaceObject, {
  main: () => (main)
});

;// CONCATENATED MODULE: ./source/environment.ts
const isIITCMobile = (typeof android !== "undefined" && android && android.addPane) ||
    navigator.userAgent.toLowerCase().includes("android");

;// CONCATENATED MODULE: ./package.json
const package_namespaceObject = {};
;// CONCATENATED MODULE: ./source/standard-extensions.ts
function standard_extensions_error(template, ...substitutions) {
    const message = String.raw(template, ...substitutions.map((x) => typeof x === "string" ? x : JSON.stringify(x)));
    throw new Error(message);
}
function exhaustive(value) {
    return standard_extensions_error `unexpected value: ${value}`;
}
function id(x) {
    return x;
}
function standard_extensions_ignore(..._args) {
    /* 引数を無視する関数 */
}
let ignoreReporterCache;
function createProgressReporter(progress, total) {
    class MessagedProgressEvent extends ProgressEvent {
        constructor(message, options) {
            super("message", options);
            this.message = message;
        }
    }
    if (progress === undefined) {
        return (ignoreReporterCache ?? (ignoreReporterCache = {
            next: standard_extensions_ignore,
            done: standard_extensions_ignore,
        }));
    }
    let loaded = 0;
    return {
        next(message) {
            loaded = Math.max(loaded + 1, total);
            progress(new MessagedProgressEvent(message, {
                lengthComputable: true,
                loaded,
                total,
            }));
        },
        done(message) {
            progress(new MessagedProgressEvent(message, {
                lengthComputable: true,
                loaded: total,
                total,
            }));
        },
    };
}
class AbortError extends Error {
    constructor(message) {
        super(message);
        this.name = "AbortError";
    }
}
function standard_extensions_newAbortError(message = "The operation was aborted.") {
    if (typeof DOMException === "function") {
        return new DOMException(message, "AbortError");
    }
    else {
        return new AbortError(message);
    }
}
function throwIfAborted(signal) {
    if (signal?.aborted) {
        throw standard_extensions_newAbortError();
    }
}
function sleep(milliseconds, option) {
    return new Promise((resolve, reject) => {
        const signal = option?.signal;
        if (signal?.aborted) {
            reject(standard_extensions_newAbortError());
            return;
        }
        const onAbort = signal
            ? () => {
                clearTimeout(id);
                reject(standard_extensions_newAbortError());
            }
            : standard_extensions_ignore;
        const id = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, milliseconds);
        signal?.addEventListener("abort", onAbort);
    });
}
function microYield() {
    return Promise.resolve();
}
function cancelToReject(promise, onCancel = standard_extensions_ignore) {
    return promise.catch((e) => {
        if (e instanceof Error && e.name === "AbortError") {
            return onCancel();
        }
        throw e;
    });
}
function createAsyncCancelScope(handleAsyncError) {
    let lastCancel = new AbortController();
    return (process) => {
        // 前の操作をキャンセル
        lastCancel.abort();
        lastCancel = new AbortController();
        handleAsyncError(
        // キャンセル例外を無視する
        cancelToReject(process(lastCancel.signal)));
    };
}
function assertTrue() {
    // 型レベルアサーション関数
}
function pipe(value, ...processes) {
    let a = value;
    for (const p of processes) {
        switch (typeof p) {
            case "function":
                a = p(a);
                break;
            case "string":
                a = a == null ? a : a[p];
                break;
            default: {
                const [f, ...xs] = p;
                a = f.call(null, a, ...xs);
                break;
            }
        }
    }
    return a;
}
const isArray = Array.isArray;

;// CONCATENATED MODULE: ./source/document-extensions.ts


function waitElementLoaded() {
    if (document.readyState !== "loading") {
        return Promise.resolve();
    }
    return new Promise((resolve) => document.addEventListener("DOMContentLoaded", () => resolve()));
}
let styleElement = null;
function addStyle(cssOrTemplate, ...substitutions) {
    const css = typeof cssOrTemplate === "string"
        ? cssOrTemplate
        : String.raw(cssOrTemplate, ...substitutions);
    if (styleElement == null) {
        styleElement = document.createElement("style");
        document.head.appendChild(styleElement);
    }
    styleElement.textContent += css + "\n";
    document.head.appendChild(styleElement);
}
function addScript(url) {
    return new Promise((onSuccess, onError) => {
        const script = document.createElement("script");
        script.onload = onSuccess;
        script.onerror = onError;
        document.head.appendChild(script);
        script.src = url;
    });
}
async function loadPackageScript(name, path) {
    function getVersion(dependency) {
        if (dependency === "" || dependency === "*") {
            return "latest";
        }
        for (const range of dependency.split("||")) {
            // `2.2 - 3.5` = `>=2.2 <=3.5`
            const version2 = /^([^\s]+)\s+-\s+([^\s]+)$/.exec(range)?.[1];
            if (version2 != null) {
                return version2;
            }
            const singleVersion = /^\s*((~|^|>=|<=)?[^\s]+)\s*$/.exec(dependency)?.[0];
            // `5.x`, `^5.2`, `~5.2`, `<=5.2`, `>5.2` などは cdn で処理されるので変換不要
            if (singleVersion != null) {
                return singleVersion;
            }
            // `>=2.2 <=3.5` など複雑な指定子は非対応
            return error `非対応のバージョン指定子 ( ${dependency} ) です。`;
        }
        return error `ここには来ない`;
    }
    function getPackageBaseUrl(name, dependency) {
        // url
        if (/^(https?:\/\/|file:)/.test(dependency)) {
            return dependency;
        }
        // ローカルパス
        if (/^(\.\.\/|~\/|\.\/|\/)/.test(dependency)) {
            return `file:${dependency}`;
        }
        // git
        if (/^git(\+(ssh|https))?:\/\//.test(dependency)) {
            return error `git URL 依存関係は対応していません。`;
        }
        // github
        if (/^[^\\]+\/.+$/.test(dependency)) {
            return error `github URL 依存関係は対応していません。`;
        }
        // 普通のバージョン指定
        const version = getVersion(dependency);
        return `https://cdn.jsdelivr.net/npm/${name}@${version}`;
    }
    const dependency = packageJson.dependencies[name];
    const baseUrl = getPackageBaseUrl(name, dependency);
    const url = `${baseUrl}/${path}`;
    await addScript(url);
    console.debug(`${url} からスクリプトを読み込みました`);
    return;
}
let parseCssColorTemp = null;
let parseCssColorRegex = null;
function parseCssColor(cssColor, result = { r: 0, g: 0, b: 0, a: 0 }) {
    const d = (parseCssColorTemp ?? (parseCssColorTemp = document.createElement("div")));
    d.style.color = cssColor;
    const m = d.style
        .getPropertyValue("color")
        .match((parseCssColorRegex ?? (parseCssColorRegex = /^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)$/i)));
    if (!m) {
        return error `color "${cssColor}" is could not be parsed.`;
    }
    const [, r, g, b, a] = m;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    result.r = parseInt(r);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    result.g = parseInt(g);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    result.b = parseInt(b);
    result.a = a === undefined ? 1 : parseFloat(a);
    return result;
}
function addListeners(element, eventListenerMap) {
    for (const [type, listener] of Object.entries(eventListenerMap)) {
        element.addEventListener(type, listener);
    }
    return element;
}
let e;
function escapeHtml(text) {
    (e ?? (e = document.createElement("div"))).innerText = text;
    return e.innerHTML;
}
function sleepUntilNextAnimationFrame(options) {
    return new Promise((resolve, reject) => {
        const signal = options?.signal;
        if (signal?.aborted) {
            return reject(newAbortError());
        }
        const onAbort = signal
            ? () => {
                cancelAnimationFrame(id);
                reject(newAbortError());
            }
            : ignore;
        const id = requestAnimationFrame((time) => {
            signal?.removeEventListener("abort", onAbort);
            resolve(time);
        });
        signal?.addEventListener("abort", onAbort);
    });
}

;// CONCATENATED MODULE: ./source/portal-modifier.ts
async function getCell14PortalsByModifier(modifiers, cell) {
    const cellId = cell.toString();
    const bounds = L.latLngBounds(cell.getCornerLatLngs());
    const portals = [];
    for (const modifier of modifiers) {
        await modifier.getPortals?.(bounds, portals);
    }
    return portals.filter((p) => p.cell14Id === cellId);
}
function generatePortalGuid() {
    return crypto.randomUUID().replace(/-/g, "") + ".16"; // .22 形式もある
}

;// CONCATENATED MODULE: ./source/typed-idb.ts

const privateTagSymbol = Symbol("privateTagSymbol");
function withTag(value) {
    return value;
}
function defineDatabase(database, schema) {
    for (const [storeName, storeSchema] of Object.entries(schema)) {
        const store = database.createObjectStore(storeName, {
            keyPath: storeSchema.key.slice(),
        });
        for (const [indexName, options] of Object.entries(storeSchema.indexes)) {
            store.createIndex(indexName, options.key, options);
        }
    }
}
function openDatabase(databaseName, databaseVersion, databaseSchema) {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(databaseName, databaseVersion);
        request.addEventListener("upgradeneeded", () => defineDatabase(request.result, databaseSchema));
        request.addEventListener("blocked", () => reject(new Error("database blocked")));
        request.addEventListener("error", () => reject(request.error));
        request.addEventListener("success", () => resolve(withTag(request.result)));
    });
}
function enterTransactionScope(database, { mode, signal, }, scope, ...storeNames) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(standard_extensions_newAbortError());
            return;
        }
        let hasResult = false;
        let result;
        const transaction = database.transaction(storeNames, mode);
        const onAbort = signal ? () => transaction.abort() : standard_extensions_ignore;
        transaction.addEventListener("complete", () => {
            signal?.removeEventListener("abort", onAbort);
            hasResult ? resolve(result) : reject(new Error(`internal error`));
        });
        transaction.addEventListener("error", (e) => {
            signal?.removeEventListener("abort", onAbort);
            reject(e.target.error);
        });
        signal?.addEventListener("abort", onAbort);
        const stores = {};
        for (const name of storeNames) {
            stores[name] = withTag(transaction.objectStore(name));
        }
        const iterator = scope(stores);
        let stateKind;
        let request_request;
        let openCursor_request;
        let openCursor_action;
        function onResolved() {
            let r;
            switch (stateKind) {
                case undefined:
                    r = iterator.next();
                    break;
                case "Request": {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const result = request_request.result;
                    stateKind = undefined;
                    request_request = undefined;
                    r = iterator.next(result);
                    break;
                }
                case "OpenCursor": {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const cursor = openCursor_request.result;
                    if (cursor === null ||
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        openCursor_action(cursor.value) === "break") {
                        stateKind = undefined;
                        openCursor_request = undefined;
                        openCursor_action = undefined;
                        r = iterator.next(undefined);
                    }
                    else {
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
                stateKind = "Request";
                request_request = yieldValue;
                yieldValue.onsuccess = onResolved;
                return;
            }
            stateKind = "OpenCursor";
            openCursor_request = yieldValue.source.openCursor(yieldValue.query);
            openCursor_action = yieldValue.action;
            openCursor_request.onsuccess = onResolved;
        }
        onResolved();
    });
}
function getIndex(store, indexName) {
    return withTag(store.index(indexName));
}
function* getValue(store, query) {
    return (yield store.get(query));
}
function* getValueOfIndex(index, query) {
    return (yield index.get(query));
}
function* putValue(store, value) {
    yield store.put(value);
    return value;
}
function* deleteValue(store, query) {
    yield store.delete(query);
}
function* iterateValues(store, query, action) {
    yield { source: store, query, action };
    return;
}
function* iterateValuesOfIndex(index, query, action) {
    yield { source: index, query, action };
    return;
}
function createBound(lower, upper, lowerOpen, upperOpen) {
    return IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen);
}
function createUpperBound(upper, open) {
    return IDBKeyRange.upperBound(upper, open);
}
function createLowerBound(lower, open) {
    return IDBKeyRange.lowerBound(lower, open);
}

;// CONCATENATED MODULE: ./source/typed-s2cell.ts
function createCellFromCoordinates(latLng, level) {
    return S2.S2Cell.FromLatLng(latLng, level);
}
function getCellId(latLng, level) {
    return createCellFromCoordinates(latLng, level).toString();
}

;// CONCATENATED MODULE: ./source/portal-records.ts
// spell-checker: ignore Lngs




const databaseSchema = {
    portals: {
        recordType: (id),
        key: "guid",
        indexes: {
            coordinates: {
                key: ["lat", "lng"],
            },
            cell17Id: { key: "cell17Id" },
            cell14Id: { key: "cell14Id" },
        },
    },
    cell14s: {
        recordType: (id),
        key: "cellId",
        indexes: {},
    },
};
function createPortalStore({ portals, cell14s, }) {
    const coordinatesIndex = getIndex(portals, "coordinates");
    const cell14IdIndex = getIndex(portals, "cell14Id");
    const cell17IdIndex = getIndex(portals, "cell17Id");
    return {
        getPortalOfGuid(guid) {
            return getValue(portals, guid);
        },
        getPortalOfCoordinates(lat, lng) {
            return getValueOfIndex(coordinatesIndex, [lat, lng]);
        },
        setPortal(value) {
            return putValue(portals, value);
        },
        removePortal(guid) {
            return deleteValue(portals, guid);
        },
        iteratePortals(action) {
            return iterateValues(portals, null, action);
        },
        iteratePortalsInCell14(cell14Id, action) {
            return iterateValuesOfIndex(cell14IdIndex, cell14Id, action);
        },
        iteratePortalsInCell17(cell17Id, action) {
            return iterateValuesOfIndex(cell17IdIndex, cell17Id, action);
        },
        getCell14(cell14Id) {
            return getValue(cell14s, cell14Id);
        },
        setCell14(cell) {
            return putValue(cell14s, cell);
        },
        iterateCell14s(action) {
            return iterateValues(cell14s, null, action);
        },
    };
}
const databaseName = "portal-records-da2ed70d-f28d-491e-bdbe-eb1726fc5e75";
const databaseVersion = 1;
async function openRecords() {
    const database = await openDatabase(databaseName, databaseVersion, databaseSchema);
    return {
        enterTransactionScope(options, scope) {
            return enterTransactionScope(database, { mode: "readwrite", signal: options?.signal }, (stores) => scope(createPortalStore(stores)), "portals", "cell14s");
        },
    };
}
function isSponsoredPortal({ name }) {
    return /ITO EN|ローソン|Lawson|ソフトバンク|Softbank|ワイモバイル|Y!mobile/.test(name);
}
function setEntry(map, key, value) {
    map.set(key, value);
    return value;
}
function boundsIncludesCell(cell, bounds) {
    for (const corner of cell.getCornerLatLngs()) {
        if (!bounds.contains(L.latLng(corner)))
            return false;
    }
    return true;
}
/** 指定された領域に近いセルを返す */
function getNearlyCellsForBounds(bounds, level) {
    const result = [];
    const seenCellIds = new Set();
    const remainingCells = [
        createCellFromCoordinates(bounds.getCenter(), level),
    ];
    for (let cell; (cell = remainingCells.pop());) {
        const id = cell.toString();
        if (seenCellIds.has(id))
            continue;
        seenCellIds.add(id);
        const corners = cell.getCornerLatLngs();
        if (!bounds.intersects(L.latLngBounds(corners)))
            continue;
        result.push(cell);
        remainingCells.push(...cell.getNeighbors());
    }
    return result;
}
/** データベース中からセル14中のポータルを返す */
function* getPortalsInCell14s(store, cell14s) {
    const portals = [];
    for (const cell14 of cell14s) {
        yield* store.iteratePortalsInCell14(cell14.toString(), (portal) => {
            portals.push(portal);
            return "continue";
        });
    }
    return portals;
}
async function updateRecordsOfCurrentPortals(records, portals, fetchBounds, fetchDate, signal) {
    const cell14s = getNearlyCellsForBounds(fetchBounds, 14);
    await records.enterTransactionScope({ signal }, function* (portalsStore) {
        // 領域内に存在しないポータル記録を削除
        for (const portal of yield* getPortalsInCell14s(portalsStore, cell14s)) {
            if (portals[portal.guid])
                continue;
            const coordinates = L.latLng(portal.lat, portal.lng);
            if (!fetchBounds.contains(coordinates))
                continue;
            yield* portalsStore.removePortal(portal.guid);
        }
        // ポータルを更新
        for (const [guid, p] of Object.entries(portals)) {
            const latLng = p.getLatLng();
            const name = p.options.data.title ?? "";
            const portal = (yield* portalsStore.getPortalOfGuid(guid)) ?? {
                guid,
                lat: latLng.lat,
                lng: latLng.lng,
                name,
                data: p.options.data,
                cell14Id: getCellId(latLng, 14),
                cell17Id: getCellId(latLng, 17),
                firstFetchDate: fetchDate,
                lastFetchDate: fetchDate,
            };
            yield* portalsStore.setPortal({
                ...portal,
                name: name !== "" ? name : portal.name,
                lat: latLng.lat,
                lng: latLng.lng,
                data: p.options.data,
                cell14Id: getCellId(latLng, 14),
                cell17Id: getCellId(latLng, 17),
                lastFetchDate: fetchDate,
            });
        }
        // 全面が取得されたセル14を更新
        for (const cell14 of cell14s) {
            if (!boundsIncludesCell(cell14, fetchBounds))
                continue;
            const cell14Id = cell14.toString();
            const coordinates = cell14.getLatLng();
            const cell14Record = (yield* portalsStore.getCell14(cell14Id)) ?? {
                cellId: cell14.toString(),
                centerLat: coordinates.lat,
                centerLng: coordinates.lng,
                firstFetchDate: fetchDate,
                lastFetchDate: fetchDate,
            };
            yield* portalsStore.setCell14({
                ...cell14Record,
                lastFetchDate: fetchDate,
            });
        }
    });
}
function createEmptyCell14Statistics(cell) {
    return {
        cell,
        portals: new Map(),
        corner: cell.getCornerLatLngs(),
        cell17s: new Map(),
        cell16s: new Map(),
    };
}
function updateCellStatistics(cells, portalLatLng, level) {
    const cell = createCellFromCoordinates(portalLatLng, level);
    const key = cell.toString();
    const statistics = cells.get(key) ??
        setEntry(cells, key, {
            cell,
            count: 0,
        });
    statistics.count++;
}
async function getNearlyCell14s(records, modifiers, bounds, signal) {
    const result = [];
    for (const cell of getNearlyCellsForBounds(bounds, 14)) {
        const cellId = cell.toString();
        let cell14;
        const collectPortal = (portal) => {
            if (isSponsoredPortal(portal))
                return "continue";
            cell14 ?? (cell14 = createEmptyCell14Statistics(cell));
            const latLng = L.latLng(portal.lat, portal.lng);
            const coordinateKey = latLng.toString();
            if (cell14.portals.get(coordinateKey) != null)
                return;
            cell14.portals.set(coordinateKey, portal);
            updateCellStatistics(cell14.cell16s, latLng, 16);
            updateCellStatistics(cell14.cell17s, latLng, 17);
        };
        await records.enterTransactionScope({ signal }, function* (store) {
            yield* store.iteratePortalsInCell14(cellId, collectPortal);
        });
        const portals = await getCell14PortalsByModifier(modifiers, cell);
        if (portals)
            for (const portal of portals)
                collectPortal(portal);
        if (cell14)
            result.push(cell14);
    }
    return result;
}

;// CONCATENATED MODULE: ./source/styles.module.css
const cssText = ".icon-952cd521fc1f21719cc4b25d22c4791b64895f05, .obsolete-icon-343fa6d408ff8ff83dbd69f6f11c07cc6ad71398 {\r\n    color: #FFFFBB;\r\n    font-size: 20px;\r\n    line-height: 21px;\r\n    text-align: center;\r\n    padding-top: 0.5em;\r\n    overflow: hidden;\r\n    text-shadow: 1px 1px #000, 1px -1px #000, -1px 1px #000, -1px -1px #000, 0 0 5px #000;\r\n    pointer-events: none;\r\n}\r\n.obsolete-icon-343fa6d408ff8ff83dbd69f6f11c07cc6ad71398 {\r\n    filter: blur(1px);\r\n    opacity: 0.8;\r\n}\r\npath.pmb-cell16-07ec54169c7de0a3d18ae53bd4585d13a4e94fcc, path.pmb-cell16-duplicated-7652c778541af4485e24d6ec26dcebf2d624cf46 {\r\n    mask: url(#flowerMask);\r\n}\r\n";
const variables = {};
/* harmony default export */ const styles_module = ({
    icon: "icon-952cd521fc1f21719cc4b25d22c4791b64895f05",
    "obsolete-icon": "obsolete-icon-343fa6d408ff8ff83dbd69f6f11c07cc6ad71398",
    "pmb-cell16": "pmb-cell16-07ec54169c7de0a3d18ae53bd4585d13a4e94fcc",
    "pmb-cell16-duplicated": "pmb-cell16-duplicated-7652c778541af4485e24d6ec26dcebf2d624cf46",
});

;// CONCATENATED MODULE: ./source/public-api.ts


function createPublicApi(records, modifiers) {
    return Object.freeze({
        version: "0.8.0",
        async getS2Cell14(lat, lng, options) {
            const cell14 = createCellFromCoordinates(L.latLng(lat, lng), 14);
            const cellId = cell14.toString();
            const portals = new Map();
            let cell;
            await records.enterTransactionScope(options, function* (records) {
                cell = yield* records.getCell14(cellId);
                yield* records.iteratePortalsInCell14(cellId, (portal) => {
                    portals.set(portal.guid, portal);
                    return "continue";
                });
            });
            const additionalPortals = await getCell14PortalsByModifier(modifiers, cell14);
            for (const portal of additionalPortals) {
                portals.set(portal.guid, portal);
            }
            return {
                cell,
                portals,
            };
        },
        iterateAllPortals(action, options) {
            return records.enterTransactionScope(options, (portals) => portals.iteratePortals(action));
        },
        iterateAllS2Cell14(action, options) {
            return records.enterTransactionScope(options, (portals) => portals.iterateCell14s(action));
        },
        registerModifier(modifier) {
            if (modifier.id != null)
                this.unregisterModifier(modifier.id);
            modifiers.push(modifier);
        },
        unregisterModifier(id) {
            if (id == null)
                return;
            modifiers.splice(0, modifiers.length, ...modifiers.filter((m) => m.id !== id));
        },
        createNewFakePortal(lat, lng, name) {
            const latLng = L.latLng(lat, lng);
            return {
                guid: generatePortalGuid(),
                lat,
                lng,
                name,
                cell14Id: getCellId(latLng, 14),
                cell17Id: getCellId(latLng, 17),
                data: {},
                lastFetchDate: Date.now(),
                isFake: true,
            };
        },
    });
}

;// CONCATENATED MODULE: ./source/promise-source.ts
class PromiseSource {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    setResult(value) {
        this._resolve(value);
    }
    setError(value) {
        this._reject(value);
    }
}

;// CONCATENATED MODULE: ./images/storage.svg
const storage_namespaceObject = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 100 100\">\r\n  <ellipse cx=\"50\" cy=\"20\" rx=\"40\" ry=\"15\" fill=\"#CCC\"/>\r\n  <rect x=\"10\" y=\"20\" width=\"80\" height=\"60\" fill=\"#CCC\"/>\r\n  <ellipse cx=\"50\" cy=\"80\" rx=\"40\" ry=\"15\" fill=\"#CCC\"/>\r\n  <path xmlns=\"http://www.w3.org/2000/svg\" d=\"M10 20 Q50 40 90 20\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"10\"/>\r\n  <path d=\"M10 40 Q50 60 90 40\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"10\"/>\r\n  <path d=\"M10 60 Q50 80 90 60\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"10\"/>\r\n</svg>\r\n";
;// CONCATENATED MODULE: ./source/search.ts

function normalize(word) {
    return word.normalize("NFKC").toLowerCase();
}
function eachAllTextsInPortal(portal, action) {
    if (action(portal.name) === "break")
        return;
    const { team } = portal.data;
    if (team && action(team) === "break")
        return;
}
let includesInPortal_normalizedWord = "";
let includesInPortal_result = false;
function includesInPortal(text) {
    if (normalize(text).includes(includesInPortal_normalizedWord)) {
        includesInPortal_result = true;
        return "break";
    }
}
function includes(normalizedWord, portal) {
    try {
        includesInPortal_normalizedWord = normalizedWord;
        includesInPortal_result = false;
        eachAllTextsInPortal(portal, includesInPortal);
        return includesInPortal_result;
    }
    finally {
        includesInPortal_normalizedWord = "";
    }
}
function toThreeLetterTeamName(t) {
    switch (t) {
        case "E":
            return "ENL";
        case "R":
            return "RES";
        case "N":
        case "M":
            return "NEU";
        default:
            return t;
    }
}
async function appendIitcSearchResult(iitc, query, records, signal) {
    if (!query.confirmed)
        return;
    let storageIconCache;
    const normalizedWords = query.term.split(/\s+/).map(normalize);
    const oldResults = query.results.slice();
    await records.enterTransactionScope({ signal }, function* (portals) {
        yield* portals.iteratePortals((portal) => {
            for (const word of normalizedWords) {
                if (!includes(word, portal))
                    return undefined;
            }
            const position = L.latLng(portal.lat, portal.lng);
            if (oldResults.find((r) => r.position && r.position.equals(position))) {
                return;
            }
            const team = toThreeLetterTeamName(portal.data.team) ?? "???";
            const level = portal.data.level ?? "?";
            const health = portal.data.health ?? "?";
            const resonatorCount = portal.data.resCount ?? "?";
            query.addResult({
                title: portal.name,
                position,
                description: `${team}, L${level}, ${health}%, ${resonatorCount} Resonators`,
                icon: (storageIconCache ?? (storageIconCache = `data:image/svg+xml;base64,` + btoa(storage_namespaceObject))),
                onSelected(_result, _clickEvent) {
                    iitc.renderPortalDetails(portal.guid);
                },
            });
        });
    });
}

;// CONCATENATED MODULE: ./source/s2cell.ts
// spell-checker: ignore bitpair cosphi faceuv LatLngs
function createS2Namespace() {
    /// S2 Geometry functions
    // the regional scoreboard is based on a level 6 S2 Cell
    // - https://docs.google.com/presentation/d/1Hl4KapfAENAOf4gv-pSngKwvS_jwNVHRPZTTDzXXn6Q/view?pli=1#slide=id.i22
    // at the time of writing there's no actual API for the intel map to retrieve scoreboard data,
    // but it's still useful to plot the score cells on the intel map
    // the S2 geometry is based on projecting the earth sphere onto a cube, with some scaling of face coordinates to
    // keep things close to approximate equal area for adjacent cells
    // to convert a lat,lng into a cell id:
    // - convert lat,lng to x,y,z
    // - convert x,y,z into face,u,v
    // - u,v scaled to s,t with quadratic formula
    // - s,t converted to integer i,j offsets
    // - i,j converted to a position along a Hubbert space-filling curve
    // - combine face,position to get the cell id
    //NOTE: compared to the google S2 geometry library, we vary from their code in the following ways
    // - cell IDs: they combine face and the hilbert curve position into a single 64 bit number. this gives efficient space
    //             and speed. javascript doesn't have appropriate data types, and speed is not cricical, so we use
    //             as [face,[bitpair,bitpair,...]] instead
    // - i,j: they always use 30 bits, adjusting as needed. we use 0 to (1<<level)-1 instead
    //        (so GetSizeIJ for a cell is always 1)
    const LatLng = function (lat, lng, noWrap) {
        if (isNaN(lat) || isNaN(lng)) {
            throw new Error("Invalid LatLng object: (" + lat + ", " + lng + ")");
        }
        if (noWrap !== true) {
            lat = Math.max(Math.min(lat, 90), -90); // clamp latitude into -90..90
            lng =
                ((lng + 180) % 360) + (lng < -180 || lng === 180 ? 180 : -180); // wrap longtitude into -180..180
        }
        return { lat, lng };
    };
    const DEG_TO_RAD = Math.PI / 180;
    const RAD_TO_DEG = 180 / Math.PI;
    const LatLngToXYZ = function (latLng) {
        const d2r = DEG_TO_RAD;
        const phi = latLng.lat * d2r;
        const theta = latLng.lng * d2r;
        const cosphi = Math.cos(phi);
        return [
            Math.cos(theta) * cosphi,
            Math.sin(theta) * cosphi,
            Math.sin(phi),
        ];
    };
    const XYZToLatLng = function (xyz) {
        const r2d = RAD_TO_DEG;
        const lat = Math.atan2(xyz[2], Math.sqrt(xyz[0] * xyz[0] + xyz[1] * xyz[1]));
        const lng = Math.atan2(xyz[1], xyz[0]);
        return LatLng(lat * r2d, lng * r2d);
    };
    const largestAbsComponent = function (xyz) {
        const tempX = Math.abs(xyz[0]), tempY = Math.abs(xyz[1]), tempZ = Math.abs(xyz[2]);
        if (tempX > tempY) {
            if (tempX > tempZ) {
                return 0;
            }
            else {
                return 2;
            }
        }
        else {
            if (tempY > tempZ) {
                return 1;
            }
            else {
                return 2;
            }
        }
    };
    const faceXYZToUV = function (face, xyz) {
        let u, v;
        switch (face) {
            case 0:
                u = xyz[1] / xyz[0];
                v = xyz[2] / xyz[0];
                break;
            case 1:
                u = -xyz[0] / xyz[1];
                v = xyz[2] / xyz[1];
                break;
            case 2:
                u = -xyz[0] / xyz[2];
                v = -xyz[1] / xyz[2];
                break;
            case 3:
                u = xyz[2] / xyz[0];
                v = xyz[1] / xyz[0];
                break;
            case 4:
                u = xyz[2] / xyz[1];
                v = -xyz[0] / xyz[1];
                break;
            case 5:
                u = -xyz[1] / xyz[2];
                v = -xyz[0] / xyz[2];
                break;
            default:
                throw { error: "Invalid face" };
        }
        return [u, v];
    };
    const XYZToFaceUV = function (xyz) {
        let face = largestAbsComponent(xyz);
        if (xyz[face] < 0) {
            face += 3;
        }
        face = face;
        const uv = faceXYZToUV(face, xyz);
        return [face, uv];
    };
    const FaceUVToXYZ = function (face, uv) {
        const u = uv[0];
        const v = uv[1];
        switch (face) {
            case 0:
                return [1, u, v];
            case 1:
                return [-u, 1, v];
            case 2:
                return [-u, -v, 1];
            case 3:
                return [-1, -v, -u];
            case 4:
                return [v, -1, -u];
            case 5:
                return [v, u, -1];
            default:
                throw { error: "Invalid face" };
        }
    };
    const singleSTtoUV = function (st) {
        if (st >= 0.5) {
            return (1 / 3.0) * (4 * st * st - 1);
        }
        else {
            return (1 / 3.0) * (1 - 4 * (1 - st) * (1 - st));
        }
    };
    const STToUV = function (st) {
        return [singleSTtoUV(st[0]), singleSTtoUV(st[1])];
    };
    const singleUVtoST = function (uv) {
        if (uv >= 0) {
            return 0.5 * Math.sqrt(1 + 3 * uv);
        }
        else {
            return 1 - 0.5 * Math.sqrt(1 - 3 * uv);
        }
    };
    const UVToST = function (uv) {
        return [singleUVtoST(uv[0]), singleUVtoST(uv[1])];
    };
    const singleSTtoIJ = function (st, maxSize) {
        const ij = Math.floor(st * maxSize);
        return Math.max(0, Math.min(maxSize - 1, ij));
    };
    const STToIJ = function (st, order) {
        const maxSize = 1 << order;
        return [singleSTtoIJ(st[0], maxSize), singleSTtoIJ(st[1], maxSize)];
    };
    const IJToST = function (ij, order, offsets) {
        const maxSize = 1 << order;
        return [(ij[0] + offsets[0]) / maxSize, (ij[1] + offsets[1]) / maxSize];
    };
    let hilbertMapCache;
    // hilbert space-filling curve
    // based on http://blog.notdot.net/2009/11/Damn-Cool-Algorithms-Spatial-indexing-with-Quadtrees-and-Hilbert-Curves
    // note: rather then calculating the final integer hilbert position, we just return the list of quads
    // this ensures no precision issues whth large orders (S3 cell IDs use up to 30), and is more
    // convenient for pulling out the individual bits as needed later
    const pointToHilbertQuadList = function (x, y, order, face) {
        const hilbertMap = (hilbertMapCache ?? (hilbertMapCache = {
            a: [
                [0, "d"],
                [1, "a"],
                [3, "b"],
                [2, "a"],
            ],
            b: [
                [2, "b"],
                [1, "b"],
                [3, "a"],
                [0, "c"],
            ],
            c: [
                [2, "c"],
                [3, "d"],
                [1, "c"],
                [0, "b"],
            ],
            d: [
                [0, "a"],
                [3, "c"],
                [1, "d"],
                [2, "d"],
            ],
        }));
        let currentSquare = face % 2 ? "d" : "a";
        const positions = [];
        for (let i = order - 1; i >= 0; i--) {
            const mask = 1 << i;
            const quad_x = x & mask ? 1 : 0;
            const quad_y = y & mask ? 1 : 0;
            const t = hilbertMap[currentSquare][(quad_x * 2 + quad_y)];
            positions.push(t[0]);
            currentSquare = t[1];
        }
        return positions;
    };
    const fromFaceIJWrap = function (face, ij, level) {
        const maxSize = 1 << level;
        if (ij[0] >= 0 && ij[1] >= 0 && ij[0] < maxSize && ij[1] < maxSize) {
            // no wrapping out of bounds
            return S2Cell.FromFaceIJ(face, ij, level);
        }
        else {
            // the new i,j are out of range.
            // with the assumption that they're only a little past the borders we can just take the points as
            // just beyond the cube face, project to XYZ, then re-create FaceUV from the XYZ vector
            let st = IJToST(ij, level, [0.5, 0.5]);
            let uv = STToUV(st);
            const xyz = FaceUVToXYZ(face, uv);
            const faceuv = XYZToFaceUV(xyz);
            face = faceuv[0];
            uv = faceuv[1];
            st = UVToST(uv);
            ij = STToIJ(st, level);
            return S2Cell.FromFaceIJ(face, ij, level);
        }
    };
    let offsetsCache;
    class S2Cell {
        constructor(face, ij, level) {
            this.face = face;
            this.ij = ij;
            this.level = level;
        }
        //static method to construct
        static FromLatLng(latLng, level) {
            const xyz = LatLngToXYZ(latLng);
            const faceuv = XYZToFaceUV(xyz);
            const st = UVToST(faceuv[1]);
            const ij = STToIJ(st, level);
            return S2Cell.FromFaceIJ(faceuv[0], ij, level);
        }
        static FromFaceIJ(face, ij, level) {
            return new S2Cell(face, ij, level);
        }
        toString() {
            return ("F" +
                this.face +
                "ij[" +
                this.ij[0] +
                "," +
                this.ij[1] +
                "]@" +
                this.level);
        }
        getLatLng() {
            const st = IJToST(this.ij, this.level, [0.5, 0.5]);
            const uv = STToUV(st);
            const xyz = FaceUVToXYZ(this.face, uv);
            return XYZToLatLng(xyz);
        }
        getCornerLatLngs() {
            const result = [];
            const offsets = (offsetsCache ?? (offsetsCache = [
                [0.0, 0.0],
                [0.0, 1.0],
                [1.0, 1.0],
                [1.0, 0.0],
            ]));
            for (const offset of offsets) {
                const st = IJToST(this.ij, this.level, offset);
                const uv = STToUV(st);
                const xyz = FaceUVToXYZ(this.face, uv);
                result.push(XYZToLatLng(xyz));
            }
            return result;
        }
        getFaceAndQuads() {
            const quads = pointToHilbertQuadList(this.ij[0], this.ij[1], this.level, this.face);
            return [this.face, quads];
        }
        toHilbertQuadkey() {
            const quads = pointToHilbertQuadList(this.ij[0], this.ij[1], this.level, this.face);
            return this.face.toString(10) + "/" + quads.join("");
        }
        getNeighbors() {
            const face = this.face;
            const i = this.ij[0];
            const j = this.ij[1];
            const level = this.level;
            return [
                fromFaceIJWrap(face, [i - 1, j], level),
                fromFaceIJWrap(face, [i, j - 1], level),
                fromFaceIJWrap(face, [i + 1, j], level),
                fromFaceIJWrap(face, [i, j + 1], level),
            ];
        }
    }
    return {
        S2Cell,
    };
}

;// CONCATENATED MODULE: ./images/flower-pattern.svg
const flower_pattern_namespaceObject = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\">\r\n  <defs>\r\n    <!-- 花単体 -->\r\n    <g id=\"flower\" transform=\"translate(-25, -25)\">\r\n      <path d=\"\r\n        M25 25\r\n        Q32.5 17.5, 25 10\r\n        Q17.5 17.5, 25 25\r\n\r\n        M25 25\r\n        Q32.5 32.5, 25 40\r\n        Q17.5 32.5, 25 25\r\n\r\n        M25 25\r\n        Q17.5 17.5, 10 25\r\n        Q17.5 32.5, 25 25\r\n\r\n        M25 25\r\n        Q32.5 17.5, 40 25\r\n        Q32.5 32.5, 25 25\"\r\n        fill=\"white\"/>\r\n      <circle cx=\"25\" cy=\"25\" r=\"4\" fill=\"white\"/>\r\n    </g>\r\n\r\n    <!-- 1つの花をずらして交互に敷き詰める -->\r\n    <pattern patternTransform=\"scale(0.5)\" id=\"flowerPattern\" width=\"29\" height=\"50.115\" patternUnits=\"userSpaceOnUse\">\r\n        <use href=\"#flower\" x=\"14.5\" y=\"0\" />\r\n        <use href=\"#flower\" x=\"0\" y=\"25.05\" />\r\n        <use href=\"#flower\" x=\"29\" y=\"25.05\" />\r\n        <use href=\"#flower\" x=\"14.5\" y=\"50.115\"/>\r\n    </pattern>\r\n\r\n    <mask id=\"flowerMask\">\r\n        <rect x=\"-10000\" y=\"-10000\" width=\"20000\" height=\"20000\" fill=\"black\"/>\r\n        <rect x=\"-10000\" y=\"-10000\" width=\"20000\" height=\"20000\" fill=\"url(#flowerPattern)\"/>\r\n    </mask>\r\n  </defs>\r\n\r\n  <!-- デザイン確認用 -->\r\n  <path stroke-linejoin=\"round\" stroke-linecap=\"round\" fill-rule=\"evenodd\" pointer-events=\"none\" stroke=\"green\" stroke-opacity=\"0.1\" stroke-width=\"3\" fill=\"green\" fill-opacity=\"0.5\" d=\"M0 0L200 0L200 200L0 200z\" mask=\"url(#flowerMask)\" />\r\n</svg>\r\n";
;// CONCATENATED MODULE: ./source/iitc-plugin-portal-records.tsx
// spell-checker: ignore layeradd Lngs moveend











function reportError(error) {
    console.error(error);
    if (error != null &&
        typeof error === "object" &&
        "stack" in error &&
        typeof error.stack === "string") {
        console.error(error.stack);
    }
}
function handleAsyncError(promise) {
    promise.catch(reportError);
}
function waitUntilLayerAdded(map, predicate) {
    let hasLayer = false;
    map.eachLayer((l) => hasLayer || (hasLayer = predicate(l)));
    if (hasLayer) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const onLayerAdd = (e) => {
            if (predicate(e.layer)) {
                map.off("layeradd", onLayerAdd);
                resolve();
            }
        };
        map.on("layeradd", onLayerAdd);
    });
}
function createOptions() {
    const baseOptions = {
        weight: 3,
        clickable: false,
        pointerEvents: "none",
        fill: true,
    };
    const blue = {
        ...baseOptions,
        opacity: 0.1,
        color: "blue",
    };
    const red = {
        ...baseOptions,
        color: "red",
        opacity: 0.5,
    };
    const green = {
        ...baseOptions,
        color: "green",
        opacity: 0.1,
        fillOpacity: 0.5,
    };
    const yellow = {
        ...baseOptions,
        color: "yellow",
        opacity: 0.5,
    };
    const yellowDuplicated = {
        ...baseOptions,
        color: "yellow",
        opacity: 0.1,
        fillOpacity: 0.5,
    };
    const cell17Options = green;
    const cell17DuplicatedOptions = yellowDuplicated;
    const cell16Options = {
        ...cell17Options,
        fillOpacity: cell17Options.fillOpacity * 0.5,
    };
    const cell16DuplicatedOptions = {
        ...cell17DuplicatedOptions,
        fillOpacity: cell17DuplicatedOptions.fillOpacity * 0.5,
    };
    const tooCloseOptions = {
        color: "orange",
        weight: 2,
        opacity: 0.8,
        clickable: false,
        fill: false,
    };
    const tooCloseNewDiscoveryOptions = { ...tooCloseOptions, color: "red" };
    return {
        cell17NonZeroOptions: blue,
        cell17CountToOptions: new Map([
            [1, red],
            [5, red],
            [19, red],
            [4, yellow],
            [18, yellow],
        ]),
        cell17Options,
        cell17DuplicatedOptions,
        cell16Options,
        cell16DuplicatedOptions,
        tooCloseOptions,
        tooCloseNewDiscoveryOptions,
    };
}
function updatePgoS2CellLayers(layer, visibleCells, isRefreshEnd, zoom, cellOptions) {
    const isLatest = isRefreshEnd && 14 < zoom;
    layer.clearLayers();
    for (const { corner, cell17s, portals } of visibleCells) {
        const options = cellOptions.cell17CountToOptions.get(cell17s.size) ??
            cellOptions.cell17NonZeroOptions;
        const polygon = L.polygon(corner, options);
        layer.addLayer(polygon);
        if (13 < zoom) {
            const center = polygon.getBounds().getCenter();
            const label = L.marker(center, {
                clickable: true,
                icon: L.divIcon({
                    className: isLatest
                        ? styles_module["icon"]
                        : styles_module["obsolete-icon"],
                    iconSize: [50, 50],
                    html: cell17s.size + "/" + portals.size,
                }),
            });
            layer.addLayer(label);
        }
        if (14 < zoom) {
            for (const cell17 of cell17s.values()) {
                const polygon17 = L.polygon(cell17.cell.getCornerLatLngs(), cell17.count > 1
                    ? cellOptions.cell17DuplicatedOptions
                    : cellOptions.cell17Options);
                layer.addLayer(polygon17);
            }
        }
    }
}
function updatePmbS2CellLayers(layer, visibleCells, _isRefreshEnd, zoom, cellOptions) {
    layer.clearLayers();
    const cell16Options = {
        ...cellOptions.cell16Options,
        className: styles_module["pmb-cell16"],
    };
    const cell16DuplicatedOptions = {
        ...cellOptions.cell16DuplicatedOptions,
        className: styles_module["pmb-cell16-duplicated"],
    };
    for (const { cell16s } of visibleCells) {
        if (14 < zoom) {
            for (const cell16 of cell16s.values()) {
                const polygon16 = L.polygon(cell16.cell.getCornerLatLngs(), cell16.count > 1 ? cell16DuplicatedOptions : cell16Options);
                layer.addLayer(polygon16);
            }
        }
    }
}
function updateTooCloseLayers(layer, visibleCells, _isRefreshEnd, zoom, cellOptions) {
    layer.clearLayers();
    if (15 >= zoom)
        return;
    const expires = Date.now() - 1000 * 60 * 60 * 24 * 3;
    for (const { portals } of visibleCells) {
        for (const [, portal] of portals) {
            const isNewDiscovery = expires <= (portal.firstFetchDate ?? 0);
            const options = isNewDiscovery
                ? cellOptions.tooCloseNewDiscoveryOptions
                : cellOptions.tooCloseOptions;
            const circle = L.circle(portal, 20, options);
            layer.addLayer(circle);
        }
    }
}
function main() {
    handleAsyncError(asyncMain());
}
function appendAsSvg(svgText, options) {
    const svg = new DOMParser().parseFromString(svgText, "image/svg+xml")
        .children[0];
    if (options?.defsOnly) {
        for (const child of svg.children) {
            if (child.tagName !== "defs")
                child.remove();
        }
    }
    document.body.appendChild(svg);
}
async function asyncMain() {
    var _a;
    const window = (isIITCMobile ? globalThis : unsafeWindow);
    const { L = standard_extensions_error `leaflet を先に読み込んでください`, map = standard_extensions_error `デフォルトマップがありません`, document, $ = standard_extensions_error `JQuery を先に読み込んでください`, } = window;
    const publicApiSource = new PromiseSource();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window["portal_records_cef3ad7e_0804_420c_8c44_ef4e08dbcdc2"] =
        publicApiSource.promise;
    await waitElementLoaded();
    // TODO:
    if (!isIITCMobile) {
        L.Icon.Default.imagePath = `https://unpkg.com/leaflet@${L.version}/dist/images/`;
    }
    const iitc = {
        get portals() {
            return window.portals;
        },
        addLayerGroup: window.addLayerGroup,
        renderPortalDetails: window.renderPortalDetails,
        addHook: window.addHook,
    };
    (_a = window).S2 || (_a.S2 = createS2Namespace());
    const layerDefinitions = [
        {
            name: "S2Cells - Pmb",
            update: updatePmbS2CellLayers,
        },
        {
            name: "S2Cells - Pgo",
            update: updatePgoS2CellLayers,
        },
        {
            name: "Too Close Circles",
            update: updateTooCloseLayers,
        },
    ];
    const layers = layerDefinitions.map((l) => ({
        ...l,
        layer: L.layerGroup(),
    }));
    for (const { name, layer } of layers) {
        iitc.addLayerGroup(name, layer, true);
    }
    // どれかのレイヤーが有効になるまで待つ
    await waitUntilLayerAdded(map, (l) => {
        for (const { layer } of layers) {
            if (l === layer)
                return true;
        }
        return false;
    });
    appendAsSvg(flower_pattern_namespaceObject, { defsOnly: true });
    addStyle(cssText);
    const records = await openRecords();
    const cellOptions = createOptions();
    const modifiers = [];
    async function updateLayersAsync(isRefreshEnd, signal) {
        let enabledLayers = null;
        for (const l of layers) {
            if (map.hasLayer(l.layer)) {
                (enabledLayers ?? (enabledLayers = [])).push(l);
            }
        }
        if (!enabledLayers || enabledLayers.length === 0)
            return;
        if (map.getZoom() <= 13) {
            for (const { layer } of layers)
                layer.clearLayers();
            return;
        }
        const nearlyCells = await getNearlyCell14s(records, modifiers, map.getBounds(), signal);
        for (const { layer, update } of enabledLayers) {
            update(layer, nearlyCells, isRefreshEnd, map.getZoom(), cellOptions);
        }
    }
    async function onMapUpdated(isRefreshEnd, signal) {
        if (isRefreshEnd && 14 < map.getZoom()) {
            await updateRecordsOfCurrentPortals(records, iitc.portals, map.getBounds(), Date.now(), signal);
        }
        await updateLayersAsync(isRefreshEnd, signal);
    }
    const updateRecordsAsyncCancelScope = createAsyncCancelScope(handleAsyncError);
    function updateLayers(isRefreshEnd) {
        updateRecordsAsyncCancelScope((signal) => onMapUpdated(isRefreshEnd, signal));
    }
    updateLayers(false);
    map.on("moveend", () => updateLayers(false));
    iitc.addHook("mapDataRefreshEnd", () => updateLayers(true));
    const appendSearchResultAsyncCancelScope = createAsyncCancelScope(handleAsyncError);
    iitc.addHook("search", (query) => appendSearchResultAsyncCancelScope((signal) => appendIitcSearchResult(iitc, query, records, signal)));
    publicApiSource.setResult(createPublicApi(records, modifiers));
}

;// CONCATENATED MODULE: ./source/iitc-plugin-portal-records.user.ts

(isIITCMobile ? globalThis : unsafeWindow)["_iitc-plugin-portal-records-97383620-8c7a-4da6-99b5-36afca698435"] = iitc_plugin_portal_records_namespaceObject;
// 文字列化され、ドキュメントに注入されるラッパー関数
// このため、通常のクロージャーのルールはここでは適用されない
function wrapper(plugin_info) {
    const window = globalThis.window;
    // window.plugin が存在することを確認する
    if (typeof window.plugin !== "function") {
        window.plugin = function () {
            // マーカー関数
        };
    }
    // メタデータを追加する
    plugin_info.dateTimeVersion = "20221226000000";
    plugin_info.pluginId = "pgo-route-helper";
    // setup 内で IITC はロード済みと仮定できる
    const setup = function setup() {
        const pluginModule = window["_iitc-plugin-portal-records-97383620-8c7a-4da6-99b5-36afca698435"];
        if (pluginModule == null) {
            console.error(`${plugin_info.pluginId}: メインモジュールが読み込まれていません。`);
            return;
        }
        pluginModule.main();
    };
    setup.info = plugin_info;
    // 起動用フックを追加
    (window.bootPlugins ?? (window.bootPlugins = [])).push(setup);
    // IITC がすでに起動している場合 `setup` 関数を実行する
    if (window.iitcLoaded && typeof setup === "function")
        setup();
}
// UserScript のヘッダからプラグイン情報を取得する
const info = {};
if (typeof GM_info !== "undefined" && GM_info && GM_info.script) {
    info.script = {
        version: GM_info.script.version,
        name: GM_info.script.name,
        description: GM_info.script.description,
    };
}
// wrapper 関数を文字列化して DOM 内で実行する
const script = document.createElement("script");
script.append(`(${wrapper})(${JSON.stringify(info)})`);
(document.body || document.head || document.documentElement).appendChild(script);

/******/ })()
;
//# sourceMappingURL=iitc-plugin-portal-records.user.js.map