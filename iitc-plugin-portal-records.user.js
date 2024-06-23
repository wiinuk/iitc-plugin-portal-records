// ==UserScript==
// @id           iitc-plugin-portal-records
// @name         IITC plugin: Portal Records
// @category     Controls
// @namespace    https://github.com/IITC-CE/ingress-intel-total-conversion
// @downloadURL  https://github.com/wiinuk/iitc-plugin-portal-records/raw/master/iitc-plugin-portal-records.user.js
// @updateURL    https://github.com/wiinuk/iitc-plugin-portal-records/raw/master/iitc-plugin-portal-records.user.js
// @homepageURL  https://github.com/wiinuk/iitc-plugin-portal-records
// @version      0.1.0
// @description  IITC plugin to assist in Pokémon GO route creation.
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
// @require      https://raw.githubusercontent.com/hunterjm/s2-geometry.js/master/src/s2geometry.js
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

;// CONCATENATED MODULE: ./source/typed-idb.ts

const privateTagSymbol = Symbol("privateTagSymbol");
function withTag(value) {
    return value;
}
function openDatabase(databaseName, databaseVersion, onUpgradeNeeded) {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(databaseName, databaseVersion);
        request.onupgradeneeded = () => onUpgradeNeeded(request.result);
        request.onblocked = () => reject(new Error("database blocked"));
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(withTag(request.result));
    });
}
var ResolvingKind;
(function (ResolvingKind) {
    ResolvingKind[ResolvingKind["Request"] = 0] = "Request";
    ResolvingKind[ResolvingKind["Cursor"] = 1] = "Cursor";
})(ResolvingKind || (ResolvingKind = {}));
function enterTransactionScope(database, storeName, mode, scope, signal) {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            reject(standard_extensions_newAbortError());
            return;
        }
        let hasResult = false;
        let result;
        const transaction = database.transaction(storeName, mode);
        const onAbort = () => transaction.abort();
        transaction.oncomplete = () => {
            signal.removeEventListener("abort", onAbort);
            hasResult ? resolve(result) : reject(new Error(`internal error`));
        };
        transaction.onerror = function (e) {
            signal.removeEventListener("abort", onAbort);
            reject(e.target.error);
        };
        signal.addEventListener("abort", onAbort);
        const store = withTag(transaction.objectStore(storeName));
        const iterator = scope(store);
        let resolvingKind;
        let resolvingRequest;
        let resolvingCursorRequest;
        let resolvingCursorAction;
        function onResolved() {
            let r;
            switch (resolvingKind) {
                case undefined:
                    r = iterator.next();
                    break;
                case ResolvingKind.Request: {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const result = resolvingRequest.result;
                    resolvingKind = undefined;
                    resolvingRequest = undefined;
                    r = iterator.next(result);
                    break;
                }
                case ResolvingKind.Cursor: {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const cursor = resolvingCursorRequest.result;
                    if (cursor === null ||
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        resolvingCursorAction(cursor.value) === "return") {
                        resolvingKind = undefined;
                        resolvingCursorRequest = undefined;
                        resolvingCursorAction = undefined;
                        r = iterator.next(undefined);
                    }
                    else {
                        cursor.continue();
                        return;
                    }
                    break;
                }
                default: {
                    reject(new Error(`Invalid resolving kind: ${resolvingKind}`));
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
            resolvingCursorRequest = yieldValue.store.openCursor(yieldValue.query);
            resolvingCursorAction = yieldValue.action;
            resolvingCursorRequest.onsuccess = onResolved;
        }
        onResolved();
    });
}
function getIndex(store, indexName) {
    return withTag(store.index(indexName));
}
function* getValueOfIndex(index, key) {
    return (yield index.get(key));
}
function* putValue(store, value) {
    yield store.put(value);
    return value;
}
function* iterateValues(store, action) {
    yield { store, query: null, action };
    return;
}

;// CONCATENATED MODULE: ./source/portal-records.ts

function upgradeDatabase(database) {
    const portals = database.createObjectStore("portals", {
        keyPath: "guid",
        autoIncrement: false,
    });
    portals.createIndex("coordinates", ["lat", "lng"]);
}
function createPortalStore(portals) {
    const portalsCoordinatesIndex = getIndex(portals, "coordinates");
    return {
        getValueOfCoordinates(lat, lng) {
            return getValueOfIndex(portalsCoordinatesIndex, [lat, lng]);
        },
        setValue(value) {
            return putValue(portals, value);
        },
        iterateValues(action) {
            return iterateValues(portals, action);
        },
    };
}
const databaseName = "portal-records-da2ed70d-f28d-491e-bdbe-eb1726fc5e75";
const databaseVersion = 1;
async function openRecords() {
    const database = await openDatabase(databaseName, databaseVersion, upgradeDatabase);
    return {
        enterTransactionScope(scope, signal) {
            return enterTransactionScope(database, "portals", "readwrite", (portals) => scope(createPortalStore(portals)), signal);
        },
    };
}

;// CONCATENATED MODULE: ./source/styles.module.css
const cssText = ".icon-f8066d88118224baa3194f453adad477809ef800 {\r\n    color: #FFFFBB;\r\n    font-size: 20px;\r\n    line-height: 21px;\r\n    text-align: center;\r\n    padding-top: 0.5em;\r\n    overflow: hidden;\r\n    text-shadow: 1px 1px #000, 1px -1px #000, -1px 1px #000, -1px -1px #000, 0 0 5px #000;\r\n    pointer-events: none;\r\n}\r\n";
const variables = {};
/* harmony default export */ const styles_module = ({
    icon: "icon-f8066d88118224baa3194f453adad477809ef800",
});

;// CONCATENATED MODULE: ./source/iitc-plugin-portal-records.tsx
// spell-checker: ignore layeradd Lngs





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
function setEntry(map, key, value) {
    map.set(key, value);
    return value;
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
function isSponsoredPortal({ name }) {
    return /ローソン|Lawson|ソフトバンク|Softbank|ワイモバイル|Y!mobile/.test(name);
}
function createOptions() {
    const blue = {
        color: "blue",
        weight: 3,
        opacity: 0.1,
        clickable: false,
        fill: true,
    };
    const red = {
        color: "red",
        weight: 3,
        opacity: 0.5,
        clickable: false,
        fill: true,
    };
    const yellow = {
        color: "yellow",
        weight: 3,
        opacity: 0.5,
        clickable: false,
        fill: true,
    };
    return {
        cell17NonZeroOptions: blue,
        cell17CountToOptions: new Map([
            [1, red],
            [5, red],
            [19, red],
            [4, yellow],
            [18, yellow],
        ]),
        cell17Options: {
            color: "green",
            weight: 3,
            opacity: 0.1,
            clickable: false,
            fill: true,
            fillOpacity: 0.5,
        },
        cell17DuplicatedOptions: {
            color: "yellow",
            weight: 3,
            opacity: 0.1,
            clickable: false,
            fill: true,
            fillOpacity: 0.5,
        },
    };
}
async function getVisibleCells(records, cells, bounds, signal) {
    return await records.enterTransactionScope(function* (portals) {
        const visibleCells = new Map();
        yield* portals.iterateValues((portal) => {
            if (isSponsoredPortal(portal))
                return "continue";
            const latLng = L.latLng(portal.lat, portal.lng);
            const cell = S2.S2Cell.FromLatLng(latLng, 14);
            const key = cell.toString();
            const cell14 = cells.get(key) ??
                setEntry(cells, key, {
                    portals: new Map(),
                    cell,
                    corner: cell.getCornerLatLngs(),
                    cell17s: new Map(),
                });
            const coordinateKey = latLng.toString();
            if (cell14.portals.get(coordinateKey) == null) {
                cell14.portals.set(coordinateKey, portal);
                const cell17 = S2.S2Cell.FromLatLng(latLng, 17);
                const cell17Key = cell17.toString();
                const cell17Cell = cell14.cell17s.get(cell17Key) ??
                    setEntry(cell14.cell17s, cell17Key, {
                        cell: cell17,
                        count: 0,
                    });
                cell17Cell.count++;
            }
            if (bounds.contains(latLng) && visibleCells.get(key) == null) {
                visibleCells.set(key, cell14);
            }
        });
        return visibleCells;
    }, signal);
}
async function updateRecordsOfCurrentPortals(records, portals, signal) {
    await records.enterTransactionScope(function* (portalsStore) {
        for (const [guid, p] of Object.entries(portals)) {
            const name = p.options.data.title ?? "";
            const latLng = p.getLatLng();
            const cachedPortal = (yield* portalsStore.getValueOfCoordinates(latLng.lat, latLng.lng)) ??
                (yield* portalsStore.setValue({
                    lat: latLng.lat,
                    lng: latLng.lng,
                    name,
                    guid,
                    data: p.options.data,
                }));
            if (cachedPortal.name == "") {
                yield* portalsStore.setValue({ ...cachedPortal, name });
            }
            yield* portalsStore.setValue({ ...cachedPortal, guid });
        }
    }, signal);
}
function updateS2CellLayers(s2CellLayer, visibleCells, cellOptions) {
    s2CellLayer.clearLayers();
    for (const { corner, cell17s, portals } of visibleCells.values()) {
        const options = cellOptions.cell17CountToOptions.get(cell17s.size) ??
            cellOptions.cell17NonZeroOptions;
        const polygon = L.polygon(corner, options);
        s2CellLayer.addLayer(polygon);
        if (map.getZoom() > 13) {
            const center = polygon.getBounds().getCenter();
            const label = L.marker(center, {
                clickable: true,
                icon: L.divIcon({
                    className: styles_module["icon"],
                    iconSize: [50, 50],
                    html: cell17s.size + "/" + portals.size,
                }),
            });
            s2CellLayer.addLayer(label);
        }
        if (map.getZoom() > 14) {
            for (const cell17 of cell17s.values()) {
                const polygon17 = L.polygon(cell17.cell.getCornerLatLngs(), cell17.count > 1
                    ? cellOptions.cell17DuplicatedOptions
                    : cellOptions.cell17Options);
                s2CellLayer.addLayer(polygon17);
            }
        }
    }
}
function main() {
    handleAsyncError(asyncMain());
}
async function asyncMain() {
    const window = (isIITCMobile ? globalThis : unsafeWindow);
    const { L = standard_extensions_error `leaflet を先に読み込んでください`, map = standard_extensions_error `デフォルトマップがありません`, document, $ = standard_extensions_error `JQuery を先に読み込んでください`, } = window;
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
    const s2CellLayer = L.layerGroup();
    iitc.addLayerGroup("PortalRecords: Level 14 & 17 Statistics", s2CellLayer, true);
    // レイヤーが無効なら何もしない
    await waitUntilLayerAdded(map, (l) => l === s2CellLayer);
    addStyle(cssText);
    const records = await openRecords();
    const cellOptions = createOptions();
    const cells = new Map();
    async function updateLayersAsync(signal) {
        await updateRecordsOfCurrentPortals(records, iitc.portals, signal);
        const visibleCells = await getVisibleCells(records, cells, map.getBounds(), signal);
        updateS2CellLayers(s2CellLayer, visibleCells, cellOptions);
    }
    const updateRecordsAsyncCancelScope = createAsyncCancelScope(handleAsyncError);
    function updateLayers() {
        updateRecordsAsyncCancelScope(updateLayersAsync);
    }
    iitc.addHook("mapDataRefreshStart", updateLayers);
    iitc.addHook("mapDataRefreshEnd", updateLayers);
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