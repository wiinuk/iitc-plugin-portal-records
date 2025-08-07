// spell-checker: ignore layeradd Lngs moveend
import { addStyle, waitElementLoaded } from "./document-extensions";
import { isIITCMobile } from "./environment";
import {
    getNearlyCell14s,
    openRecords,
    updateRecordsOfCurrentPortals,
    type Cell14Statistics,
} from "./portal-records";
import { createAsyncCancelScope, error } from "./standard-extensions";
import classNames, { cssText } from "./styles.module.css";
import { createPublicApi } from "./public-api";
import { PromiseSource } from "./promise-source";
import { appendIitcSearchResult } from "./search";
import { createS2Namespace } from "./s2cell";
import flowerPatternSvgText from "../images/flower-pattern.svg";

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
    const baseOptions = {
        weight: 3,
        clickable: false,
        pointerEvents: "none",
        fill: true,
    } satisfies L.PolylineOptions;

    const blue = {
        ...baseOptions,
        opacity: 0.1,
        color: "blue",
    } satisfies L.PolylineOptions;
    const red = {
        ...baseOptions,
        color: "red",
        opacity: 0.5,
    } satisfies L.PolylineOptions;
    const green = {
        ...baseOptions,
        color: "green",
        opacity: 0.1,
        fillOpacity: 0.5,
    } satisfies L.PolylineOptions;
    const yellow = {
        ...baseOptions,
        color: "yellow",
        opacity: 0.5,
    } satisfies L.PolylineOptions;
    const yellowDuplicated = {
        ...baseOptions,
        color: "yellow",
        opacity: 0.1,
        fillOpacity: 0.5,
    } satisfies L.PolylineOptions;

    const cell17Options = green;
    const cell17DuplicatedOptions = yellowDuplicated;

    const cell16Options = {
        ...cell17Options,
        fillOpacity: cell17Options.fillOpacity * 0.5,
    } satisfies L.PolylineOptions;

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
    } satisfies L.PathOptions;
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
    } as const;
}
function updatePgoS2CellLayers(
    layer: L.LayerGroup<L.ILayer>,
    visibleCells: Iterable<Cell14Statistics>,
    isRefreshEnd: boolean,
    zoom: number,
    cellOptions: ReturnType<typeof createOptions>
) {
    const isLatest = isRefreshEnd && 14 < zoom;

    layer.clearLayers();
    for (const { corner, cell17s, portals } of visibleCells) {
        const options =
            cellOptions.cell17CountToOptions.get(cell17s.size) ??
            cellOptions.cell17NonZeroOptions;
        const polygon = L.polygon(corner, options);
        layer.addLayer(polygon);
        if (13 < zoom) {
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
        if (14 < zoom) {
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
function updatePmbS2CellLayers(
    layer: L.LayerGroup<L.ILayer>,
    visibleCells: Iterable<Cell14Statistics>,
    _isRefreshEnd: boolean,
    zoom: number,
    cellOptions: ReturnType<typeof createOptions>
) {
    layer.clearLayers();
    const cell16Options = {
        ...cellOptions.cell16Options,
        className: classNames["pmb-cell16"],
    };
    const cell16DuplicatedOptions = {
        ...cellOptions.cell16DuplicatedOptions,
        className: classNames["pmb-cell16-duplicated"],
    };

    for (const { cell16s } of visibleCells) {
        if (14 < zoom) {
            for (const cell16 of cell16s.values()) {
                const polygon16 = L.polygon(
                    cell16.cell.getCornerLatLngs(),
                    cell16.count > 1 ? cell16DuplicatedOptions : cell16Options
                );
                layer.addLayer(polygon16);
            }
        }
    }
}
function updateTooCloseLayers(
    layer: L.LayerGroup<L.ILayer>,
    visibleCells: Iterable<Cell14Statistics>,
    _isRefreshEnd: boolean,
    zoom: number,
    cellOptions: ReturnType<typeof createOptions>
) {
    layer.clearLayers();
    if (15 >= zoom) return;

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

export function main() {
    handleAsyncError(asyncMain());
}

function appendAsSvg(svgText: string, options?: { defsOnly: boolean }) {
    const svg = new DOMParser().parseFromString(svgText, "image/svg+xml")
        .children[0] as SVGElement;
    if (options?.defsOnly) {
        for (const child of svg.children) {
            if (child.tagName !== "defs") child.remove();
        }
    }
    document.body.appendChild(svg);
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

    (window as typeof window & { S2?: typeof S2 }).S2 ||= createS2Namespace();

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
            if (l === layer) return true;
        }
        return false;
    });

    appendAsSvg(flowerPatternSvgText, { defsOnly: true });
    addStyle(cssText);
    const records = await openRecords();
    const cellOptions = createOptions();

    async function updateLayersAsync(
        isRefreshEnd: boolean,
        signal: AbortSignal
    ) {
        let enabledLayers: typeof layers | null = null;
        for (const l of layers) {
            if (map.hasLayer(l.layer)) {
                (enabledLayers ??= []).push(l);
            }
        }
        if (!enabledLayers || enabledLayers.length === 0) return;

        if (map.getZoom() <= 13) {
            for (const { layer } of layers) layer.clearLayers();
            return;
        }
        const nearlyCells = await getNearlyCell14s(
            records,
            map.getBounds(),
            signal
        );
        for (const { layer, update } of enabledLayers) {
            update(
                layer,
                nearlyCells,
                isRefreshEnd,
                map.getZoom(),
                cellOptions
            );
        }
    }
    async function onMapUpdated(isRefreshEnd: boolean, signal: AbortSignal) {
        if (isRefreshEnd && 14 < map.getZoom()) {
            await updateRecordsOfCurrentPortals(
                records,
                iitc.portals,
                map.getBounds(),
                Date.now(),
                signal
            );
        }
        await updateLayersAsync(isRefreshEnd, signal);
    }

    const updateRecordsAsyncCancelScope =
        createAsyncCancelScope(handleAsyncError);
    function updateLayers(isRefreshEnd: boolean) {
        updateRecordsAsyncCancelScope((signal) =>
            onMapUpdated(isRefreshEnd, signal)
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
