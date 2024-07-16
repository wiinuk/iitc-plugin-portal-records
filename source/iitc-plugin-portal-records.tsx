// spell-checker: ignore layeradd Lngs moveend
import { addStyle, waitElementLoaded } from "./document-extensions";
import { isIITCMobile } from "./environment";
import {
    getNearlyCell14s,
    openRecords,
    updateRecordsOfCurrentPortals,
    type Cell14,
} from "./portal-records";
import { createAsyncCancelScope, error } from "./standard-extensions";
import classNames, { cssText } from "./styles.module.css";
import { createPublicApi } from "./public-api";
import { PromiseSource } from "./promise-source";
import { appendIitcSearchResult } from "./search";

function reportError(error: unknown) {
    console.error(error);
    if (
        error != null &&
        typeof error === "object" &&
        "stack" in error &&
        typeof error.stack === "string"
    ) {
        console.error(error.stack);
    }
}
function handleAsyncError(promise: Promise<void>) {
    promise.catch(reportError);
}

function waitUntilLayerAdded(
    map: L.Map,
    predicate: (layer: L.ILayer) => boolean
) {
    let hasLayer = false;
    map.eachLayer((l) => hasLayer || (hasLayer = predicate(l)));
    if (hasLayer) {
        return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
        const onLayerAdd = (e: L.LayerEvent) => {
            if (predicate(e.layer)) {
                map.off("layeradd", onLayerAdd);
                resolve();
            }
        };
        map.on("layeradd", onLayerAdd);
    });
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
function updateS2CellLayers(
    layer: L.LayerGroup<L.ILayer>,
    visibleCells: Iterable<Cell14>,
    isRefreshEnd: boolean,
    cellOptions: ReturnType<typeof createOptions>
) {
    const isLatest = isRefreshEnd && 14 < map.getZoom();

    layer.clearLayers();
    for (const { corner, cell17s, portals } of visibleCells) {
        const options =
            cellOptions.cell17CountToOptions.get(cell17s.size) ??
            cellOptions.cell17NonZeroOptions;
        const polygon = L.polygon(corner, options);
        layer.addLayer(polygon);
        if (13 < map.getZoom()) {
            const center = polygon.getBounds().getCenter();
            const label = L.marker(center, {
                clickable: true,
                icon: L.divIcon({
                    className: isLatest
                        ? classNames["icon"]
                        : classNames["obsolete-icon"],
                    iconSize: [50, 50],
                    html: cell17s.size + "/" + portals.size,
                }),
            });
            layer.addLayer(label);
        }
        if (14 < map.getZoom()) {
            for (const cell17 of cell17s.values()) {
                const polygon17 = L.polygon(
                    cell17.cell.getCornerLatLngs(),
                    cell17.count > 1
                        ? cellOptions.cell17DuplicatedOptions
                        : cellOptions.cell17Options
                );
                layer.addLayer(polygon17);
            }
        }
    }
}

export function main() {
    handleAsyncError(asyncMain());
}

async function asyncMain() {
    const window = (
        isIITCMobile ? globalThis : unsafeWindow
    ) as WindowForContentScope & typeof globalThis;
    const {
        L = error`leaflet を先に読み込んでください`,
        map = error`デフォルトマップがありません`,
        document,
        $ = error`JQuery を先に読み込んでください`,
    } = window;

    type PublicApi = ReturnType<typeof createPublicApi>;
    const publicApiSource = new PromiseSource<PublicApi>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)["portal_records_cef3ad7e_0804_420c_8c44_ef4e08dbcdc2"] =
        publicApiSource.promise;

    await waitElementLoaded();

    // TODO:
    if (!isIITCMobile) {
        L.Icon.Default.imagePath = `https://unpkg.com/leaflet@${L.version}/dist/images/`;
    }

    const iitc: IITCGlobals = {
        get portals() {
            return window.portals;
        },
        addLayerGroup: window.addLayerGroup,
        renderPortalDetails: window.renderPortalDetails,
        addHook: window.addHook,
    };

    const s2CellLayer = L.layerGroup();
    iitc.addLayerGroup("S2Cell Records", s2CellLayer, true);
    // レイヤーが無効なら何もしない
    await waitUntilLayerAdded(map, (l) => l === s2CellLayer);

    addStyle(cssText);
    const records = await openRecords();
    const cellOptions = createOptions();

    async function updateLayersAsync(
        isRefreshEnd: boolean,
        signal: AbortSignal
    ) {
        if (map.getZoom() <= 13) {
            s2CellLayer.clearLayers();
            return;
        }
        if (isRefreshEnd && 14 < map.getZoom()) {
            await updateRecordsOfCurrentPortals(
                records,
                iitc.portals,
                map.getBounds(),
                Date.now(),
                signal
            );
        }
        const nearlyCells = await getNearlyCell14s(
            records,
            map.getBounds(),
            signal
        );
        updateS2CellLayers(s2CellLayer, nearlyCells, isRefreshEnd, cellOptions);
    }

    const updateRecordsAsyncCancelScope =
        createAsyncCancelScope(handleAsyncError);
    function updateLayers(isRefreshEnd: boolean) {
        updateRecordsAsyncCancelScope((signal) =>
            updateLayersAsync(isRefreshEnd, signal)
        );
    }

    updateLayers(false);
    map.on("moveend", () => updateLayers(false));
    iitc.addHook("mapDataRefreshEnd", () => updateLayers(true));

    const appendSearchResultAsyncCancelScope =
        createAsyncCancelScope(handleAsyncError);
    iitc.addHook("search", (query) =>
        appendSearchResultAsyncCancelScope((signal) =>
            appendIitcSearchResult(iitc, query, records, signal)
        )
    );

    publicApiSource.setResult(createPublicApi(records));
}
