// spell-checker: ignore Lngs
import { id } from "./standard-extensions";
import * as Idb from "./typed-idb";
import {
    createCellFromCoordinates,
    getCellId,
    type Cell14Id,
    type Cell17Id,
    type CellId,
    type Cell,
} from "./typed-s2cell";

/** ローカルマシンから取得した時間 */
type ClientDate = number;
export interface PortalRecord {
    readonly guid: string;
    readonly lat: number;
    readonly lng: number;
    readonly name: string;
    readonly data: IITCPortalData;
    readonly lastFetchDate: ClientDate;

    readonly cell17Id: Cell17Id;
    readonly cell14Id: Cell14Id;
}
export interface CellRecord<TLevel extends number> {
    readonly cellId: CellId<TLevel>;
    readonly lastFetchDate: ClientDate;
    readonly centerLat: number;
    readonly centerLng: number;
}
const databaseSchema = {
    portals: {
        recordType: id<PortalRecord>,
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
        recordType: id<CellRecord<14>>,
        key: "cellId",
        indexes: {},
    },
} as const satisfies Idb.DatabaseSchemaKind;
type DatabaseSchema = typeof databaseSchema;

export type PortalsStore = ReturnType<typeof createPortalStore>;
export interface PortalRecords {
    enterTransactionScope<R>(
        options: { signal?: AbortSignal } | null | undefined,
        scope: (portals: PortalsStore) => Idb.TransactionScope<R>
    ): Promise<R>;
}
function createPortalStore({
    portals,
    cell14s,
}: Readonly<{
    portals: Idb.Store<DatabaseSchema, "portals">;
    cell14s: Idb.Store<DatabaseSchema, "cell14s">;
}>) {
    const coordinatesIndex = Idb.getIndex(portals, "coordinates");
    const cell14IdIndex = Idb.getIndex(portals, "cell14Id");
    const cell17IdIndex = Idb.getIndex(portals, "cell17Id");
    return {
        getPortalOfGuid(guid: string) {
            return Idb.getValue(portals, guid);
        },
        getPortalOfCoordinates(lat: number, lng: number) {
            return Idb.getValueOfIndex(coordinatesIndex, [lat, lng]);
        },
        setPortal(value: PortalRecord) {
            return Idb.putValue(portals, value);
        },
        removePortal(guid: string) {
            return Idb.deleteValue(portals, guid);
        },
        iteratePortals(action: (value: PortalRecord) => Idb.IterationFlow) {
            return Idb.iterateValues(portals, null, action);
        },
        iteratePortalsInCell14(
            cell14Id: Cell14Id,
            action: (portal: PortalRecord) => Idb.IterationFlow
        ) {
            return Idb.iterateValuesOfIndex(cell14IdIndex, cell14Id, action);
        },
        iteratePortalsInCell17(
            cell17Id: Cell17Id,
            action: (portal: PortalRecord) => Idb.IterationFlow
        ) {
            return Idb.iterateValuesOfIndex(cell17IdIndex, cell17Id, action);
        },
        getCell14(cell14Id: Cell14Id) {
            return Idb.getValue(cell14s, cell14Id);
        },
        setCell14(cell: CellRecord<14>) {
            return Idb.putValue(cell14s, cell);
        },
        iterateCell14s(action: (cell14: CellRecord<14>) => Idb.IterationFlow) {
            return Idb.iterateValues(cell14s, null, action);
        },
    };
}

const databaseName = "portal-records-da2ed70d-f28d-491e-bdbe-eb1726fc5e75";
const databaseVersion = 1;
export async function openRecords(): Promise<PortalRecords> {
    const database = await Idb.openDatabase(
        databaseName,
        databaseVersion,
        databaseSchema
    );
    return {
        enterTransactionScope(options, scope) {
            return Idb.enterTransactionScope(
                database,
                { mode: "readwrite", signal: options?.signal },
                (stores) => scope(createPortalStore(stores)),
                "portals",
                "cell14s"
            );
        },
    };
}

function isSponsoredPortal({ name }: PortalRecord) {
    return /ITO EN|ローソン|Lawson|ソフトバンク|Softbank|ワイモバイル|Y!mobile/.test(
        name
    );
}

function setEntry<K, V>(map: Map<K, V>, key: K, value: V): V {
    map.set(key, value);
    return value;
}
function boundsIncludesCell<TLevel extends number>(
    cell: Cell<TLevel>,
    bounds: L.LatLngBounds
) {
    for (const corner of cell.getCornerLatLngs()) {
        if (!bounds.contains(corner)) return false;
    }
    return true;
}

/** 指定された領域に近いセルを返す */
function getNearlyCellsForBounds<TLevel extends number>(
    bounds: L.LatLngBounds,
    level: TLevel
) {
    const result: Cell<TLevel>[] = [];
    const seenCellIds = new Set<CellId<TLevel>>();
    const remainingCells = [
        createCellFromCoordinates(bounds.getCenter(), level),
    ];
    for (let cell; (cell = remainingCells.pop()); ) {
        const id = cell.toString();
        if (seenCellIds.has(id)) continue;
        seenCellIds.add(id);

        const corners = cell.getCornerLatLngs();
        if (!bounds.intersects(L.latLngBounds(corners))) continue;
        result.push(cell);
        remainingCells.push(...cell.getNeighbors());
    }
    return result;
}

/** データベース中からセル14中のポータルを返す */
function* getPortalsInCell14s(
    store: PortalsStore,
    cell14s: readonly Cell<14>[]
) {
    const portals: PortalRecord[] = [];
    for (const cell14 of cell14s) {
        yield* store.iteratePortalsInCell14(cell14.toString(), (portal) => {
            portals.push(portal);
            return "continue";
        });
    }
    return portals;
}

export async function updateRecordsOfCurrentPortals(
    records: PortalRecords,
    portals: Record<string, IITCPortalInfo>,
    fetchBounds: L.LatLngBounds,
    fetchDate: number,
    signal: AbortSignal
) {
    const cell14s = getNearlyCellsForBounds(fetchBounds, 14);
    await records.enterTransactionScope({ signal }, function* (portalsStore) {
        // 領域内の古いポータルを削除
        for (const portal of yield* getPortalsInCell14s(
            portalsStore,
            cell14s
        )) {
            const coordinates = L.latLng(portal.lat, portal.lng);
            if (!fetchBounds.contains(coordinates)) continue;
            yield* portalsStore.removePortal(portal.guid);
        }

        // ポータルを追加
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

        // 全面が取得されたセル14を更新
        for (const cell14 of cell14s) {
            if (!boundsIncludesCell(cell14, fetchBounds)) continue;

            const coordinates = cell14.getLatLng();
            yield* portalsStore.setCell14({
                cellId: cell14.toString(),
                centerLat: coordinates.lat,
                centerLng: coordinates.lng,
                lastFetchDate: fetchDate,
            });
        }
    });
}

interface Cell17 {
    readonly cell: Cell<17>;
    count: number;
}
export interface Cell14 {
    readonly cell17s: Map<Cell17Id, Cell17>;
    readonly corner: [S2LatLng, S2LatLng, S2LatLng, S2LatLng];
    readonly cell: Cell<14>;
    readonly portals: Map<string, PortalRecord>;
}
export async function getNearlyCell14s(
    records: PortalRecords,
    bounds: L.LatLngBounds,
    signal: AbortSignal
) {
    return await records.enterTransactionScope({ signal }, function* (store) {
        const result: Cell14[] = [];
        for (const cell of getNearlyCellsForBounds(bounds, 14)) {
            const cellId = cell.toString();
            let cell14: Cell14 | undefined;
            yield* store.iteratePortalsInCell14(cellId, (portal) => {
                if (isSponsoredPortal(portal)) return "continue";

                cell14 ??= {
                    cell,
                    portals: new Map(),
                    corner: cell.getCornerLatLngs(),
                    cell17s: new Map(),
                };
                const latLng = L.latLng(portal.lat, portal.lng);
                const coordinateKey = latLng.toString();
                if (cell14.portals.get(coordinateKey) != null) return;

                cell14.portals.set(coordinateKey, portal);
                const cell17 = createCellFromCoordinates(latLng, 17);
                const cell17Key = cell17.toString();
                const cell17Cell =
                    cell14.cell17s.get(cell17Key) ??
                    setEntry(cell14.cell17s, cell17Key, {
                        cell: cell17,
                        count: 0,
                    });
                cell17Cell.count++;
            });
            if (cell14) result.push(cell14);
        }
        return result;
    });
}
