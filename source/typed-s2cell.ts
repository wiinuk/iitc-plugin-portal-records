import type { Tagged } from "./typed-idb";

/** `S2Cell.prototype.toString` で得られる ID */
export type CellId<TLevel extends number> = Tagged<string, TLevel>;
export type Cell17Id = CellId<17>;
export type Cell14Id = CellId<14>;

export interface S2Cell<TLevel extends number> extends S2.S2CellLike {
    getNeighbors(): [
        S2Cell<TLevel>,
        S2Cell<TLevel>,
        S2Cell<TLevel>,
        S2Cell<TLevel>
    ];
    toString(): CellId<TLevel>;
}
export function createCellFromCoordinates<TLevel extends number>(
    latLng: L.LatLng,
    level: TLevel
) {
    return S2.S2Cell.FromLatLng(latLng, level) as S2Cell<TLevel>;
}
export function getCellId<TLevel extends number>(
    latLng: L.LatLng,
    level: TLevel
) {
    return createCellFromCoordinates(latLng, level).toString();
}
