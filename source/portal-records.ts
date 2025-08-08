// spell-checker: ignore Lngs
import {
    getCell14PortalsByModifier,
    type FakePortalRecord,
    type PortalModifier,
} from "./portal-modifier";
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
    readonly firstFetchDate?: ClientDate;
    readonly lastFetchDate: ClientDate;

    readonly cell17Id: Cell17Id;
    readonly cell14Id: Cell14Id;

    readonly isFake?: undefined;
}
export interface CellRecord<TLevel extends number> {
    readonly cellId: CellId<TLevel>;
    readonly firstFetchDate?: ClientDate;
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

export interface PortalsStore {
    getPortalOfGuid(
        guid: string
    ): Idb.TransactionScope<PortalRecord | undefined>;
    getPortalOfCoordinates(
        lat: number,
        lng: number
    ): Idb.TransactionScope<PortalRecord | undefined>;
    setPortal(value: PortalRecord): Idb.TransactionScope<PortalRecord>;
    removePortal(guid: string): Idb.TransactionScope<void>;
    iteratePortals(
        action: (value: PortalRecord) => Idb.IterationFlow
    ): Idb.TransactionScope<void>;
    iteratePortalsInCell14(
        cell14Id: Cell14Id,
        action: (portal: PortalRecord) => Idb.IterationFlow
    ): Idb.TransactionScope<void>;
    iteratePortalsInCell17(
        cell17Id: Cell17Id,
        action: (portal: PortalRecord) => Idb.IterationFlow
    ): Idb.TransactionScope<void>;
    getCell14(
        cell14Id: Cell14Id
    ): Idb.TransactionScope<CellRecord<14> | undefined>;
    setCell14(cell: CellRecord<14>): Idb.TransactionScope<CellRecord<14>>;
    iterateCell14s(
        action: (cell14: CellRecord<14>) => Idb.IterationFlow
    ): Idb.TransactionScope<void>;
}
export interface PortalRecords {
    enterTransactionScope<R>(
        options: { signal?: AbortSignal } | null | undefined,
        scope: (portals: PortalsStore) => Idb.TransactionScope<R>
    ): Promise<R>;
}
class IdbPortalsStore implements PortalsStore {
    private _coordinatesIndex:
        | Idb.Index<DatabaseSchema, "portals", "coordinates">
        | undefined;
    private _cell14IdIndex:
        | Idb.Index<DatabaseSchema, "portals", "cell14Id">
        | undefined;
    private _cell17IdIndex:
        | Idb.Index<DatabaseSchema, "portals", "cell17Id">
        | undefined;

    constructor(
        private _portals: Idb.Store<DatabaseSchema, "portals">,
        private _cell14s: Idb.Store<DatabaseSchema, "cell14s">
    ) {}

    getPortalOfGuid(guid: string) {
        return Idb.getValue(this._portals, guid);
    }
    getPortalOfCoordinates(lat: number, lng: number) {
        return Idb.getValueOfIndex(
            (this._coordinatesIndex ??= Idb.getIndex(
                this._portals,
                "coordinates"
            )),
            [lat, lng]
        );
    }
    setPortal(value: PortalRecord) {
        return Idb.putValue(this._portals, value);
    }
    removePortal(guid: string) {
        return Idb.deleteValue(this._portals, guid);
    }
    iteratePortals(action: (value: PortalRecord) => Idb.IterationFlow) {
        return Idb.iterateValues(this._portals, null, action);
    }
    iteratePortalsInCell14(
        cell14Id: Cell14Id,
        action: (portal: PortalRecord) => Idb.IterationFlow
    ) {
        return Idb.iterateValuesOfIndex(
            (this._cell14IdIndex ??= Idb.getIndex(this._portals, "cell14Id")),
            cell14Id,
            action
        );
    }
    iteratePortalsInCell17(
        cell17Id: Cell17Id,
        action: (portal: PortalRecord) => Idb.IterationFlow
    ) {
        return Idb.iterateValuesOfIndex(
            (this._cell17IdIndex ??= Idb.getIndex(this._portals, "cell17Id")),
            cell17Id,
            action
        );
    }
    getCell14(cell14Id: Cell14Id) {
        return Idb.getValue(this._cell14s, cell14Id);
    }
    setCell14(cell: CellRecord<14>) {
        return Idb.putValue(this._cell14s, cell);
    }
    iterateCell14s(action: (cell14: CellRecord<14>) => Idb.IterationFlow) {
        return Idb.iterateValues(this._cell14s, null, action);
    }
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
                (stores) =>
                    scope(new IdbPortalsStore(stores.portals, stores.cell14s)),
                "portals",
                "cell14s"
            );
        },
    };
}

function isSponsoredPortal({ name }: PortalRecord | FakePortalRecord) {
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
        if (!bounds.contains(L.latLng(corner))) return false;
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
        // 領域内に存在しないポータル記録を削除
        for (const portal of yield* getPortalsInCell14s(
            portalsStore,
            cell14s
        )) {
            if (portals[portal.guid]) continue;
            const coordinates = L.latLng(portal.lat, portal.lng);
            if (!fetchBounds.contains(coordinates)) continue;
            yield* portalsStore.removePortal(portal.guid);
        }

        // ポータルを更新
        for (const [guid, p] of Object.entries(portals)) {
            const latLng = p.getLatLng();
            const name = p.options.data.title ?? "";
            const portal: PortalRecord = (yield* portalsStore.getPortalOfGuid(
                guid
            )) ?? {
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
            if (!boundsIncludesCell(cell14, fetchBounds)) continue;

            const cell14Id = cell14.toString();
            const coordinates = cell14.getLatLng();
            const cell14Record: CellRecord<14> = (yield* portalsStore.getCell14(
                cell14Id
            )) ?? {
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

type CellStatisticMap<TLevel extends number> = Map<
    CellId<TLevel>,
    {
        readonly cell: Cell<TLevel>;
        count: number;
    }
>;
export interface Cell14Statistics {
    readonly cell17s: CellStatisticMap<17>;
    readonly cell16s: CellStatisticMap<16>;
    readonly corner: [S2LatLng, S2LatLng, S2LatLng, S2LatLng];
    readonly cell: Cell<14>;
    readonly portals: Map<string, PortalRecord | FakePortalRecord>;
}
function createEmptyCell14Statistics(cell: Cell<14>): Cell14Statistics {
    return {
        cell,
        portals: new Map(),
        corner: cell.getCornerLatLngs(),
        cell17s: new Map(),
        cell16s: new Map(),
    };
}
function updateCellStatistics<TLevel extends number>(
    cells: CellStatisticMap<TLevel>,
    portalLatLng: L.LatLng,
    level: TLevel
) {
    const cell = createCellFromCoordinates(portalLatLng, level);
    const key = cell.toString();
    const statistics =
        cells.get(key) ??
        setEntry(cells, key, {
            cell,
            count: 0,
        });
    statistics.count++;
}
export async function getNearlyCell14s(
    records: PortalRecords,
    modifiers: readonly PortalModifier[],
    bounds: L.LatLngBounds,
    signal: AbortSignal
) {
    const result: Cell14Statistics[] = [];
    for (const cell of getNearlyCellsForBounds(bounds, 14)) {
        const cellId = cell.toString();
        let cell14: Cell14Statistics | undefined;
        const collectPortal = (portal: PortalRecord | FakePortalRecord) => {
            if (isSponsoredPortal(portal)) return "continue";

            cell14 ??= createEmptyCell14Statistics(cell);
            const latLng = L.latLng(portal.lat, portal.lng);
            const coordinateKey = latLng.toString();
            if (cell14.portals.get(coordinateKey) != null) return;

            cell14.portals.set(coordinateKey, portal);
            updateCellStatistics(cell14.cell16s, latLng, 16);
            updateCellStatistics(cell14.cell17s, latLng, 17);
        };
        await records.enterTransactionScope({ signal }, function* (store) {
            yield* store.iteratePortalsInCell14(cellId, collectPortal);
        });
        const portals = await getCell14PortalsByModifier(
            modifiers,
            cell,
            signal
        );
        if (portals) for (const portal of portals) collectPortal(portal);
        if (cell14) result.push(cell14);
    }
    return result;
}
