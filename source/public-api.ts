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

    readonly Modifier: ModifierNamespace;
    readonly FakePortal: FakePortalNamespace;
}
export interface ModifierNamespace {
    registerGlobal(modifier: PortalModifier): void;
    updateGlobal(updater: (modifier: PortalModifier) => PortalModifier): void;

    combine(
        modifier1: PortalModifier,
        modifier2: PortalModifier
    ): PortalModifier;
}
export interface FakePortalNamespace {
    createNew(lat: number, lng: number, name: string): FakePortalRecord;
}

export function createPublicApi(
    records: PortalRecords,
    modifierCell: { contents: PortalModifier }
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
                modifierCell.contents,
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
        Modifier: {
            registerGlobal(modifier) {
                modifierCell.contents = this.combine(
                    modifierCell.contents,
                    modifier
                );
            },
            updateGlobal(updater) {
                modifierCell.contents = updater(modifierCell.contents);
            },
            combine(m1, m2): PortalModifier {
                const id = `combine(${m1.id?.toString() ?? "<unknown>"}, ${
                    m2.id?.toString() ?? "<unknown>"
                })`;
                if (!m1.getPortals && !m2.getPortals) {
                    return {
                        id,
                    };
                }
                return {
                    id,
                    async getPortals(bounds, result) {
                        await m1.getPortals?.(bounds, result);
                        await m2.getPortals?.(bounds, result);
                    },
                };
            },
        },
        FakePortal: {
            createNew(lat, lng, name): FakePortalRecord {
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
        },
    };
}
