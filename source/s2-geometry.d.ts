// spell-checker: ignore lngs
declare namespace S2 {
    export interface S2CellLike {
        readonly face: number;
        readonly ij: readonly [number, number];
        readonly level: number;
        getLatLng(): S2LatLng;
        getCornerLatLngs(): [S2LatLng, S2LatLng, S2LatLng, S2LatLng];
        getNeighbors(): [S2Cell, S2Cell, S2Cell, S2Cell];
        toString(): string;
    }
    export class S2Cell extends S2CellLike {
        static FromLatLng(latLng: Readonly<S2LatLng>, level: number): S2Cell;
        static FromFaceIJ(
            face: number,
            ij: readonly [number, number],
            level: number
        ): S2Cell;
    }
}
interface S2LatLng {
    lat: number;
    lng: number;
}
