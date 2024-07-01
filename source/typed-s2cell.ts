import type { Tagged } from "./typed-idb";

/** `S2Cell.prototype.toString` で得られる ID */
export type CellId<TLevel extends number> = Tagged<string, TLevel>;
export type Cell17Id = CellId<17>;
export type Cell14Id = CellId<14>;

export interface Cell<TLevel extends number> {
    readonly face: number;
    readonly ij: readonly [number, number];
    readonly level: number;
    getLatLng(): S2LatLng;
    getCornerLatLngs(): [S2LatLng, S2LatLng, S2LatLng, S2LatLng];
    getNeighbors(): [Cell<TLevel>, Cell<TLevel>, Cell<TLevel>, Cell<TLevel>];
    toString(): CellId<TLevel>;
}
export function createCellFromCoordinates<TLevel extends number>(
    latLng: L.LatLng,
    level: TLevel
) {
    return S2.S2Cell.FromLatLng(latLng, level) as unknown as Cell<TLevel>;
}
export function getCellId<TLevel extends number>(
    latLng: L.LatLng,
    level: TLevel
) {
    return createCellFromCoordinates(latLng, level).toString();
}
