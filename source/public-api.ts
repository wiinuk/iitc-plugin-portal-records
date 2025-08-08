import {
    generatePortalGuid,
    getCell14PortalsByModifier,
    type FakePortalRecord,
    type PortalModifier,
} from "./portal-modifier";
import type { CellRecord, PortalRecord, PortalRecords } from "./portal-records";
import type { IterationFlow } from "./typed-idb";
import { createCellFromCoordinates, getCellId } from "./typed-s2cell";

export interface PublicApi {
    getS2Cell14(
        lat: number,
        lng: number,
        options?: { readonly signal?: AbortSignal }
    ): Promise<{
        cell: CellRecord<14> | undefined;
        portals: Map<string, PortalRecord | FakePortalRecord>;
    }>;
    iterateAllPortals(
        action: (portal: PortalRecord) => IterationFlow,
        options?: { readonly signal?: AbortSignal }
    ): Promise<void>;
    iterateAllS2Cell14(
        action: (cell14: CellRecord<14>) => IterationFlow,
        options?: { readonly signal?: AbortSignal }
    ): Promise<void>;

    registerModifier(modifier: PortalModifier): void;
    unregisterModifier(id: NonNullable<PortalModifier["id"]>): void;
    createNewFakePortal(
        lat: number,
        lng: number,
        name: string
    ): FakePortalRecord;
}

export function createPublicApi(
    records: PortalRecords,
    modifiers: PortalModifier[]
): PublicApi {
    return {
        async getS2Cell14(lat, lng, options) {
            const cell14 = createCellFromCoordinates(L.latLng(lat, lng), 14);
            const cellId = cell14.toString();
            const portals = new Map<string, PortalRecord | FakePortalRecord>();
            let cell;
            await records.enterTransactionScope(options, function* (records) {
                cell = yield* records.getCell14(cellId);
                yield* records.iteratePortalsInCell14(cellId, (portal) => {
                    portals.set(portal.guid, portal);
                    return "continue";
                });
            });
            const additionalPortals = await getCell14PortalsByModifier(
                modifiers,
                cell14
            );
            for (const portal of additionalPortals) {
                portals.set(portal.guid, portal);
            }

            return {
                cell,
                portals,
            };
        },
        iterateAllPortals(action, options) {
            return records.enterTransactionScope(options, (portals) =>
                portals.iteratePortals(action)
            );
        },
        iterateAllS2Cell14(action, options) {
            return records.enterTransactionScope(options, (portals) =>
                portals.iterateCell14s(action)
            );
        },
        registerModifier(modifier) {
            if (modifier.id != null) this.unregisterModifier(modifier.id);
            modifiers.push(modifier);
        },
        unregisterModifier(id) {
            if (id == null) return;

            modifiers.splice(
                0,
                modifiers.length,
                ...modifiers.filter((m) => m.id !== id)
            );
        },
        createNewFakePortal(lat, lng, name): FakePortalRecord {
            const latLng = L.latLng(lat, lng);
            return {
                guid: generatePortalGuid(),
                lat,
                lng,
                name,
                cell14Id: getCellId(latLng, 14),
                cell17Id: getCellId(latLng, 17),
                data: {},
                lastFetchDate: Date.now(),
                isFake: true,
            };
        },
    };
}
