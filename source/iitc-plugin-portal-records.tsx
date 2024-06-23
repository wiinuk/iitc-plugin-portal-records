// spell-checker: ignore layeradd Lngs
import { addStyle, waitElementLoaded } from "./document-extensions";
import { isIITCMobile } from "./environment";
import {
    openRecords,
    type PortalRecord,
    type PortalRecords,
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
    readonly cell: S2Cell;
    count: number;
}
interface Cell14 {
    readonly cell17s: Map<string, Cell17>;
    readonly corner: [S2LatLng, S2LatLng, S2LatLng, S2LatLng];
    readonly cell: S2Cell;
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
    cells: Map<string, Cell14>,
    bounds: L.LatLngBounds,
    signal: AbortSignal
) {
    return await records.enterTransactionScope(function* (portals) {
        const visibleCells = new Map<string, Cell14>();
        yield* portals.iterateValues((portal) => {
            if (isSponsoredPortal(portal)) return "continue";

            const latLng = L.latLng(portal.lat, portal.lng);
            const cell = S2.S2Cell.FromLatLng(latLng, 14);
            const key = cell.toString();
            const cell14 =
                cells.get(key) ??
                setEntry(cells, key, {
                    portals: new Map<string, PortalRecord>(),
                    cell,
                    corner: cell.getCornerLatLngs(),
                    cell17s: new Map<string, Cell17>(),
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
        });
        return visibleCells;
    }, signal);
}

async function updateRecordsOfCurrentPortals(
    records: PortalRecords,
    portals: Record<string, IITCPortalInfo>,
    signal: AbortSignal
) {
    await records.enterTransactionScope(function* (portalsStore) {
        for (const [guid, p] of Object.entries(portals)) {
            const name = p.options.data.title ?? "";
            const latLng = p.getLatLng();
            const cachedPortal =
                (yield* portalsStore.getValueOfCoordinates(
                    latLng.lat,
                    latLng.lng
                )) ??
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
function updateS2CellLayers(
    s2CellLayer: L.LayerGroup<L.ILayer>,
    visibleCells: ReadonlyMap<string, Cell14>,
    cellOptions: ReturnType<typeof createOptions>
) {
    s2CellLayer.clearLayers();
    for (const { corner, cell17s, portals } of visibleCells.values()) {
        const options =
            cellOptions.cell17CountToOptions.get(cell17s.size) ??
            cellOptions.cell17NonZeroOptions;
        const polygon = L.polygon(corner, options);
        s2CellLayer.addLayer(polygon);
        if (map.getZoom() > 13) {
            const center = polygon.getBounds().getCenter();
            const label = L.marker(center, {
                clickable: true,
                icon: L.divIcon({
                    className: classNames["icon"],
                    iconSize: [50, 50],
                    html: cell17s.size + "/" + portals.size,
                }),
            });
            s2CellLayer.addLayer(label);
        }
        if (map.getZoom() > 14) {
            for (const cell17 of cell17s.values()) {
                const polygon17 = L.polygon(
                    cell17.cell.getCornerLatLngs(),
                    cell17.count > 1
                        ? cellOptions.cell17DuplicatedOptions
                        : cellOptions.cell17Options
                );
                s2CellLayer.addLayer(polygon17);
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
    const cells = new Map<string, Cell14>();

    async function updateLayersAsync(signal: AbortSignal) {
        await updateRecordsOfCurrentPortals(records, iitc.portals, signal);
        const visibleCells = await getVisibleCells(
            records,
            cells,
            map.getBounds(),
            signal
        );
        updateS2CellLayers(s2CellLayer, visibleCells, cellOptions);
    }

    const updateRecordsAsyncCancelScope =
        createAsyncCancelScope(handleAsyncError);
    function updateLayers() {
        updateRecordsAsyncCancelScope(updateLayersAsync);
    }
    iitc.addHook("mapDataRefreshStart", updateLayers);
    iitc.addHook("mapDataRefreshEnd", updateLayers);
}
