import type { CellRecord, PortalRecord, PortalRecords } from "./portal-records";
import type { IterationFlow } from "./typed-idb";
import { getCellId } from "./typed-s2cell";

export function createPublicApi(records: PortalRecords) {
    return {
        getS2Cell14(
            lat: number,
            lng: number,
            options?: { signal?: AbortSignal }
        ): Promise<{
            cell: CellRecord<14> | undefined;
            portals: Map<string, PortalRecord>;
        }> {
            return records.enterTransactionScope(options, function* (records) {
                const cellId = getCellId(L.latLng(lat, lng), 14);
                const cell = yield* records.getCell14(cellId);
                const portals = new Map<string, PortalRecord>();
                yield* records.iteratePortalsInCell14(cellId, (portal) => {
                    portals.set(portal.guid, portal);
                    return "continue";
                });
                return {
                    cell,
                    portals,
                };
            });
        },
        iterateAllPortals(
            action: (portal: PortalRecord) => IterationFlow,
            options?: { signal?: AbortSignal }
        ): Promise<void> {
            return records.enterTransactionScope(options, (portals) =>
                portals.iteratePortals(action)
            );
        },
        iterateAllS2Cell14(
            action: (cell14: CellRecord<14>) => IterationFlow,
            options?: { signal?: AbortSignal }
        ): Promise<void> {
            return records.enterTransactionScope(options, (portals) =>
                portals.iterateCell14s(action)
            );
        },
    };
}
