// spell-checker: ignore lngs
import type { PortalRecord } from "./portal-records";
import type { Cell } from "./typed-s2cell";

export interface FakePortalRecord extends Omit<PortalRecord, "isFake"> {
    readonly isFake: true;
}

export interface PortalModifier {
    readonly id?: string | symbol;
    // filterPortal(portal: PortalRecord): boolean;
    getPortals?(
        bounds: L.LatLngBounds,
        result: FakePortalRecord[]
    ): Promise<void>;
}

export async function getCell14PortalsByModifier(
    modifiers: readonly PortalModifier[],
    cell: Cell<14>
) {
    const cellId = cell.toString();
    const bounds = L.latLngBounds(cell.getCornerLatLngs());
    const portals: FakePortalRecord[] = [];
    for (const modifier of modifiers) {
        await modifier.getPortals?.(bounds, portals);
    }
    return portals.filter((p) => p.cell14Id === cellId);
}

export function generatePortalGuid() {
    return crypto.randomUUID().replace(/-/g, "") + ".16"; // .22 形式もある
}
