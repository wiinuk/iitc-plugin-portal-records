import * as Idb from "./typed-idb";

type DatabaseSchema = {
    portals: {
        record: PortalRecord;
        indexes: {
            coordinates: ["lat", "lng"];
        };
    };
};
export interface PortalRecord {
    /** key */
    readonly guid: string;
    /** index: coordinates */
    readonly lat: number;
    /** index: coordinates */
    readonly lng: number;
    readonly name: string;
    readonly data: IITCPortalData;
}

function upgradeDatabase(database: IDBDatabase) {
    const portals = database.createObjectStore("portals", {
        keyPath: "guid",
        autoIncrement: false,
    });
    portals.createIndex("coordinates", ["lat", "lng"]);
}

interface PortalStore {
    getValueOfCoordinates(
        lat: number,
        lng: number
    ): Idb.TransactionScope<PortalRecord | undefined>;
    setValue(value: PortalRecord): Idb.TransactionScope<PortalRecord>;
    iterateValues(
        action: (value: PortalRecord) => undefined | "continue" | "return"
    ): Idb.TransactionScope<void>;
}
export interface PortalRecords {
    enterTransactionScope<R>(
        scope: (portals: PortalStore) => Idb.TransactionScope<R>,
        signal: AbortSignal
    ): Promise<R>;
}
function createPortalStore(
    portals: Idb.Store<DatabaseSchema, "portals">
): PortalStore {
    const portalsCoordinatesIndex = Idb.getIndex(portals, "coordinates");
    return {
        getValueOfCoordinates(lat, lng) {
            return Idb.getValueOfIndex(portalsCoordinatesIndex, [lat, lng]);
        },
        setValue(value) {
            return Idb.putValue(portals, value);
        },
        iterateValues(action) {
            return Idb.iterateValues(portals, action);
        },
    };
}

const databaseName = "portal-records-da2ed70d-f28d-491e-bdbe-eb1726fc5e75";
const databaseVersion = 1;
export async function openRecords(): Promise<PortalRecords> {
    const database = await Idb.openDatabase<DatabaseSchema>(
        databaseName,
        databaseVersion,
        upgradeDatabase
    );
    return {
        enterTransactionScope(scope, signal) {
            return Idb.enterTransactionScope(
                database,
                "portals",
                "readwrite",
                (portals) => scope(createPortalStore(portals)),
                signal
            );
        },
    };
}
