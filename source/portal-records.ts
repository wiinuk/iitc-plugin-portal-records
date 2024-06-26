import { id } from "./standard-extensions";
import * as Idb from "./typed-idb";

/** `S2Cell.prototype.toString` で得られる ID */
export type CellId = string;

/** ローカルマシンから取得した時間 */
type ClientDate = number;
export interface PortalRecord {
    /** key */
    readonly guid: string;
    /** index: coordinates */
    readonly lat: number;
    /** index: coordinates */
    readonly lng: number;
    readonly name: string;
    readonly data: IITCPortalData;
    readonly lastFetchDate: ClientDate;

    /** index: cell17Id */
    readonly cell17Id: CellId;
    /** index: cell14Id */
    readonly cell14Id: CellId;
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
        cell14Id: CellId,
        action: (portal: PortalRecord) => Idb.IterationFlow
    ): Idb.TransactionScope<void>;
    iteratePortalsInCell17(
        cell17Id: CellId,
        action: (portal: PortalRecord) => Idb.IterationFlow
    ): Idb.TransactionScope<void>;
}
export interface PortalRecords {
    enterTransactionScope<R>(
        options: { signal: AbortSignal },
        scope: (portals: PortalsStore) => Idb.TransactionScope<R>
    ): Promise<R>;
}
function createPortalStore(
    portals: Idb.Store<DatabaseSchema, "portals">
): PortalsStore {
    const coordinatesIndex = Idb.getIndex(portals, "coordinates");
    const cell14IdIndex = Idb.getIndex(portals, "cell14Id");
    const cell17IdIndex = Idb.getIndex(portals, "cell17Id");
    return {
        getPortalOfGuid(guid) {
            return Idb.getValue(portals, guid);
        },
        getPortalOfCoordinates(lat, lng) {
            return Idb.getValueOfIndex(coordinatesIndex, [lat, lng]);
        },
        setPortal(value) {
            return Idb.putValue(portals, value);
        },
        removePortal(guid) {
            return Idb.deleteValue(portals, guid);
        },
        iteratePortals(action) {
            return Idb.iterateValues(portals, null, action);
        },
        iteratePortalsInCell14(cell14Id, action) {
            return Idb.iterateValuesOfIndex(cell14IdIndex, cell14Id, action);
        },
        iteratePortalsInCell17(cell17Id, action) {
            return Idb.iterateValuesOfIndex(cell17IdIndex, cell17Id, action);
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
        enterTransactionScope({ signal }, scope) {
            return Idb.enterTransactionScope(
                database,
                { storeName: "portals", mode: "readwrite", signal },
                (portals) => scope(createPortalStore(portals))
            );
        },
    };
}
