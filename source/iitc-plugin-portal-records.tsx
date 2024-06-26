// spell-checker: ignore layeradd Lngs moveend
import { addStyle, waitElementLoaded } from "./document-extensions";
import { isIITCMobile } from "./environment";
import {
    openRecords,
    type CellId,
    type PortalRecord,
    type PortalRecords,
    type PortalsStore,
} from "./portal-records";
import { createAsyncCancelScope, error } from "./standard-extensions";
import classNames, { cssText } from "./styles.module.css";

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

function setEntry<K, V>(map: Map<K, V>, key: K, value: V): V {
    map.set(key, value);
    return value;
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

function isSponsoredPortal({ name }: PortalRecord) {
    return /ローソン|Lawson|ソフトバンク|Softbank|ワイモバイル|Y!mobile/.test(
        name
    );
}

interface Cell17 {
    readonly cell: S2.S2Cell;
    count: number;
}
interface Cell14 {
    readonly cell17s: Map<string, Cell17>;
    readonly corner: [S2LatLng, S2LatLng, S2LatLng, S2LatLng];
    readonly cell: S2.S2Cell;
    readonly portals: Map<string, PortalRecord>;
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
async function getVisibleCells(
    records: PortalRecords,
    bounds: L.LatLngBounds,
    signal: AbortSignal
) {
    const cells = new Map<string, Cell14>();
    return await records.enterTransactionScope({ signal }, function* (store) {
        const visibleCells = new Map<CellId, Cell14>();
        for (const portal of yield* getPortalInNearlyCell14sForBounds(
            store,
            bounds
        )) {
            if (isSponsoredPortal(portal)) continue;

            const latLng = L.latLng(portal.lat, portal.lng);
            const cell = S2.S2Cell.FromLatLng(latLng, 14);
            const key = cell.toString();
            const cell14 =
                cells.get(key) ??
                setEntry(cells, key, {
                    portals: new Map<string, PortalRecord>(),
                    cell,
                    corner: cell.getCornerLatLngs(),
                    cell17s: new Map<CellId, Cell17>(),
                });

            const coordinateKey = latLng.toString();
            if (cell14.portals.get(coordinateKey) == null) {
                cell14.portals.set(coordinateKey, portal);
                const cell17 = S2.S2Cell.FromLatLng(latLng, 17);
                const cell17Key = cell17.toString();
                const cell17Cell =
                    cell14.cell17s.get(cell17Key) ??
                    setEntry(cell14.cell17s, cell17Key, {
                        cell: cell17,
                        count: 0,
                    });
                cell17Cell.count++;
            }

            if (bounds.contains(latLng) && visibleCells.get(key) == null) {
                visibleCells.set(key, cell14);
            }
        }
        return visibleCells.values();
    });
}

function getCellId(latLng: L.LatLng, level: number) {
    return S2.S2Cell.FromLatLng(latLng, level).toString();
}

/** 指定された領域に近いセルを返す */
function getNearlyCellIdsForBounds(bounds: L.LatLngBounds, level: number) {
    const result: CellId[] = [];
    const seenCellIds = new Set<CellId>();
    const remainingCells = [S2.S2Cell.FromLatLng(bounds.getCenter(), level)];
    for (let cell; (cell = remainingCells.pop()); ) {
        const id: CellId = cell.toString();
        if (seenCellIds.has(id)) continue;
        seenCellIds.add(id);

        const corners = cell.getCornerLatLngs();
        if (!bounds.intersects(L.latLngBounds(corners))) continue;
        result.push(id);
        remainingCells.push(...cell.getNeighbors());
    }
    return result;
}

/** データベースから、指定された領域に近いセル14中のポータルを返す */
function* getPortalInNearlyCell14sForBounds(
    store: PortalsStore,
    bounds: L.LatLngBounds
) {
    const portals: PortalRecord[] = [];
    for (const cell14Id of getNearlyCellIdsForBounds(bounds, 14)) {
        yield* store.iteratePortalsInCell14(cell14Id, (portal) => {
            portals.push(portal);
            return "continue";
        });
    }
    return portals;
}

async function updateRecordsOfCurrentPortals(
    records: PortalRecords,
    portals: Record<string, IITCPortalInfo>,
    fetchBounds: L.LatLngBounds,
    fetchDate: number,
    signal: AbortSignal
) {
    await records.enterTransactionScope({ signal }, function* (portalsStore) {
        // 領域内の古いポータルを削除
        for (const portal of yield* getPortalInNearlyCell14sForBounds(
            portalsStore,
            fetchBounds
        )) {
            const coordinates = L.latLng(portal.lat, portal.lng);
            if (!fetchBounds.contains(coordinates)) continue;
            yield* portalsStore.removePortal(portal.guid);
        }

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
            });
        }
    });
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
    iitc.addLayerGroup(
        "PortalRecords: Level 14 & 17 Statistics",
        s2CellLayer,
        true
    );
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
        const visibleCells = await getVisibleCells(
            records,
            map.getBounds(),
            signal
        );
        updateS2CellLayers(
            s2CellLayer,
            visibleCells,
            isRefreshEnd,
            cellOptions
        );
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
}
