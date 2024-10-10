// spell-checker: ignore lngs
declare let S2: {
    readonly S2Cell: {
        FromLatLng(latLng: Readonly<S2LatLng>, level: number): S2Cell;
    };
};
interface S2LatLng {
    lat: number;
    lng: number;
}
interface S2Cell {
    readonly face: number;
    readonly ij: readonly [number, number];
    readonly level: number;
    getLatLng(): S2LatLng;
    getCornerLatLngs(): [S2LatLng, S2LatLng, S2LatLng, S2LatLng];
    getNeighbors(): [S2Cell, S2Cell, S2Cell, S2Cell];
    toString(): string;
}
