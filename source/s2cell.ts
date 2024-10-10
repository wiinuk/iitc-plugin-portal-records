// spell-checker: ignore bitpair cosphi faceuv LatLngs

export interface S2LatLng {
    lat: number;
    lng: number;
}
export type S2Face = 0 | 1 | 2 | 3 | 4 | 5;
export type S2IJ = [i: number, j: number];
type S2XYZ = [x: number, y: number, z: number];
type S2UV = [u: number, v: number];
type S2ST = [s: number, t: number];
type S2Vector2 = readonly [number, number];

export function createS2Namespace() {
    /// S2 Geometry functions
    // the regional scoreboard is based on a level 6 S2 Cell
    // - https://docs.google.com/presentation/d/1Hl4KapfAENAOf4gv-pSngKwvS_jwNVHRPZTTDzXXn6Q/view?pli=1#slide=id.i22
    // at the time of writing there's no actual API for the intel map to retrieve scoreboard data,
    // but it's still useful to plot the score cells on the intel map

    // the S2 geometry is based on projecting the earth sphere onto a cube, with some scaling of face coordinates to
    // keep things close to approximate equal area for adjacent cells
    // to convert a lat,lng into a cell id:
    // - convert lat,lng to x,y,z
    // - convert x,y,z into face,u,v
    // - u,v scaled to s,t with quadratic formula
    // - s,t converted to integer i,j offsets
    // - i,j converted to a position along a Hubbert space-filling curve
    // - combine face,position to get the cell id

    //NOTE: compared to the google S2 geometry library, we vary from their code in the following ways
    // - cell IDs: they combine face and the hilbert curve position into a single 64 bit number. this gives efficient space
    //             and speed. javascript doesn't have appropriate data types, and speed is not cricical, so we use
    //             as [face,[bitpair,bitpair,...]] instead
    // - i,j: they always use 30 bits, adjusting as needed. we use 0 to (1<<level)-1 instead
    //        (so GetSizeIJ for a cell is always 1)

    const LatLng = function (
        lat: number,
        lng: number,
        noWrap?: boolean
    ): S2LatLng {
        if (isNaN(lat) || isNaN(lng)) {
            throw new Error(
                "Invalid LatLng object: (" + lat + ", " + lng + ")"
            );
        }

        if (noWrap !== true) {
            lat = Math.max(Math.min(lat, 90), -90); // clamp latitude into -90..90
            lng =
                ((lng + 180) % 360) + (lng < -180 || lng === 180 ? 180 : -180); // wrap longtitude into -180..180
        }

        return { lat, lng };
    };

    const DEG_TO_RAD = Math.PI / 180;
    const RAD_TO_DEG = 180 / Math.PI;

    const LatLngToXYZ = function (latLng: Readonly<S2LatLng>): S2XYZ {
        const d2r = DEG_TO_RAD;
        const phi = latLng.lat * d2r;
        const theta = latLng.lng * d2r;
        const cosphi = Math.cos(phi);
        return [
            Math.cos(theta) * cosphi,
            Math.sin(theta) * cosphi,
            Math.sin(phi),
        ];
    };

    const XYZToLatLng = function (xyz: Readonly<S2XYZ>) {
        const r2d = RAD_TO_DEG;
        const lat = Math.atan2(
            xyz[2],
            Math.sqrt(xyz[0] * xyz[0] + xyz[1] * xyz[1])
        );
        const lng = Math.atan2(xyz[1], xyz[0]);
        return LatLng(lat * r2d, lng * r2d);
    };

    const largestAbsComponent = function (xyz: Readonly<S2XYZ>) {
        const tempX = Math.abs(xyz[0]),
            tempY = Math.abs(xyz[1]),
            tempZ = Math.abs(xyz[2]);

        if (tempX > tempY) {
            if (tempX > tempZ) {
                return 0;
            } else {
                return 2;
            }
        } else {
            if (tempY > tempZ) {
                return 1;
            } else {
                return 2;
            }
        }
    };

    const faceXYZToUV = function (face: S2Face, xyz: Readonly<S2XYZ>): S2UV {
        let u, v;

        switch (face) {
            case 0:
                u = xyz[1] / xyz[0];
                v = xyz[2] / xyz[0];
                break;
            case 1:
                u = -xyz[0] / xyz[1];
                v = xyz[2] / xyz[1];
                break;
            case 2:
                u = -xyz[0] / xyz[2];
                v = -xyz[1] / xyz[2];
                break;
            case 3:
                u = xyz[2] / xyz[0];
                v = xyz[1] / xyz[0];
                break;
            case 4:
                u = xyz[2] / xyz[1];
                v = -xyz[0] / xyz[1];
                break;
            case 5:
                u = -xyz[1] / xyz[2];
                v = -xyz[0] / xyz[2];
                break;
            default:
                throw { error: "Invalid face" };
        }

        return [u, v];
    };

    const XYZToFaceUV = function (
        xyz: Readonly<S2XYZ>
    ): [face: S2Face, uv: S2UV] {
        let face: S2Face = largestAbsComponent(xyz);

        if (xyz[face] < 0) {
            face += 3;
        }

        face = face as S2Face;
        const uv = faceXYZToUV(face, xyz);
        return [face, uv];
    };

    const FaceUVToXYZ = function (face: S2Face, uv: Readonly<S2UV>): S2XYZ {
        const u = uv[0];
        const v = uv[1];

        switch (face) {
            case 0:
                return [1, u, v];
            case 1:
                return [-u, 1, v];
            case 2:
                return [-u, -v, 1];
            case 3:
                return [-1, -v, -u];
            case 4:
                return [v, -1, -u];
            case 5:
                return [v, u, -1];
            default:
                throw { error: "Invalid face" };
        }
    };

    const singleSTtoUV = function (st: number) {
        if (st >= 0.5) {
            return (1 / 3.0) * (4 * st * st - 1);
        } else {
            return (1 / 3.0) * (1 - 4 * (1 - st) * (1 - st));
        }
    };
    const STToUV = function (st: Readonly<S2ST>): S2UV {
        return [singleSTtoUV(st[0]), singleSTtoUV(st[1])];
    };

    const singleUVtoST = function (uv: number) {
        if (uv >= 0) {
            return 0.5 * Math.sqrt(1 + 3 * uv);
        } else {
            return 1 - 0.5 * Math.sqrt(1 - 3 * uv);
        }
    };
    const UVToST = function (uv: Readonly<S2UV>): S2ST {
        return [singleUVtoST(uv[0]), singleUVtoST(uv[1])];
    };

    const singleSTtoIJ = function (st: number, maxSize: number) {
        const ij = Math.floor(st * maxSize);
        return Math.max(0, Math.min(maxSize - 1, ij));
    };
    const STToIJ = function (st: Readonly<S2ST>, order: number): S2IJ {
        const maxSize = 1 << order;
        return [singleSTtoIJ(st[0], maxSize), singleSTtoIJ(st[1], maxSize)];
    };

    const IJToST = function (
        ij: Readonly<S2IJ>,
        order: number,
        offsets: S2Vector2
    ): S2ST {
        const maxSize = 1 << order;

        return [(ij[0] + offsets[0]) / maxSize, (ij[1] + offsets[1]) / maxSize];
    };

    type SquareIndex = 0 | 1 | 2 | 3;
    type SquareId = "a" | "b" | "c" | "d";
    type Entry = readonly [SquareIndex, SquareId];
    let hilbertMapCache:
        | Readonly<Record<SquareId, readonly [Entry, Entry, Entry, Entry]>>
        | undefined;

    // hilbert space-filling curve
    // based on http://blog.notdot.net/2009/11/Damn-Cool-Algorithms-Spatial-indexing-with-Quadtrees-and-Hilbert-Curves
    // note: rather then calculating the final integer hilbert position, we just return the list of quads
    // this ensures no precision issues whth large orders (S3 cell IDs use up to 30), and is more
    // convenient for pulling out the individual bits as needed later
    const pointToHilbertQuadList = function (
        x: number,
        y: number,
        order: number,
        face: S2Face
    ) {
        const hilbertMap = (hilbertMapCache ??= {
            a: [
                [0, "d"],
                [1, "a"],
                [3, "b"],
                [2, "a"],
            ],
            b: [
                [2, "b"],
                [1, "b"],
                [3, "a"],
                [0, "c"],
            ],
            c: [
                [2, "c"],
                [3, "d"],
                [1, "c"],
                [0, "b"],
            ],
            d: [
                [0, "a"],
                [3, "c"],
                [1, "d"],
                [2, "d"],
            ],
        } as const);

        let currentSquare: SquareId = face % 2 ? "d" : "a";
        const positions = [];

        for (let i = order - 1; i >= 0; i--) {
            const mask = 1 << i;
            const quad_x = x & mask ? 1 : 0;
            const quad_y = y & mask ? 1 : 0;
            const t: Entry =
                hilbertMap[currentSquare][(quad_x * 2 + quad_y) as SquareIndex];
            positions.push(t[0]);
            currentSquare = t[1];
        }

        return positions;
    };

    const fromFaceIJWrap = function (
        face: S2Face,
        ij: Readonly<S2IJ>,
        level: number
    ) {
        const maxSize = 1 << level;
        if (ij[0] >= 0 && ij[1] >= 0 && ij[0] < maxSize && ij[1] < maxSize) {
            // no wrapping out of bounds
            return S2Cell.FromFaceIJ(face, ij, level);
        } else {
            // the new i,j are out of range.
            // with the assumption that they're only a little past the borders we can just take the points as
            // just beyond the cube face, project to XYZ, then re-create FaceUV from the XYZ vector

            let st = IJToST(ij, level, [0.5, 0.5]);
            let uv = STToUV(st);
            const xyz = FaceUVToXYZ(face, uv);
            const faceuv = XYZToFaceUV(xyz);
            face = faceuv[0];
            uv = faceuv[1];
            st = UVToST(uv);
            ij = STToIJ(st, level);
            return S2Cell.FromFaceIJ(face, ij, level);
        }
    };

    let offsetsCache:
        | readonly [S2Vector2, S2Vector2, S2Vector2, S2Vector2]
        | undefined;

    class S2Cell {
        constructor(
            readonly face: S2Face,
            readonly ij: Readonly<S2IJ>,
            readonly level: number
        ) {}

        //static method to construct
        static FromLatLng(latLng: Readonly<S2LatLng>, level: number) {
            const xyz = LatLngToXYZ(latLng);
            const faceuv = XYZToFaceUV(xyz);
            const st = UVToST(faceuv[1]);
            const ij = STToIJ(st, level);
            return S2Cell.FromFaceIJ(faceuv[0], ij, level);
        }
        static FromFaceIJ(face: S2Face, ij: Readonly<S2IJ>, level: number) {
            return new S2Cell(face, ij, level);
        }

        toString() {
            return (
                "F" +
                this.face +
                "ij[" +
                this.ij[0] +
                "," +
                this.ij[1] +
                "]@" +
                this.level
            );
        }
        getLatLng() {
            const st = IJToST(this.ij, this.level, [0.5, 0.5]);
            const uv = STToUV(st);
            const xyz = FaceUVToXYZ(this.face, uv);

            return XYZToLatLng(xyz);
        }
        getCornerLatLngs() {
            const result = [];
            const offsets = (offsetsCache ??= [
                [0.0, 0.0],
                [0.0, 1.0],
                [1.0, 1.0],
                [1.0, 0.0],
            ] as const);

            for (const offset of offsets) {
                const st = IJToST(this.ij, this.level, offset);
                const uv = STToUV(st);
                const xyz = FaceUVToXYZ(this.face, uv);

                result.push(XYZToLatLng(xyz));
            }
            return result as [S2LatLng, S2LatLng, S2LatLng, S2LatLng];
        }
        getFaceAndQuads(): [face: S2Face, quads: number[]] {
            const quads = pointToHilbertQuadList(
                this.ij[0],
                this.ij[1],
                this.level,
                this.face
            );
            return [this.face, quads];
        }
        toHilbertQuadkey() {
            const quads = pointToHilbertQuadList(
                this.ij[0],
                this.ij[1],
                this.level,
                this.face
            );

            return this.face.toString(10) + "/" + quads.join("");
        }
        getNeighbors(): [S2Cell, S2Cell, S2Cell, S2Cell] {
            const face = this.face;
            const i = this.ij[0];
            const j = this.ij[1];
            const level = this.level;

            return [
                fromFaceIJWrap(face, [i - 1, j], level),
                fromFaceIJWrap(face, [i, j - 1], level),
                fromFaceIJWrap(face, [i + 1, j], level),
                fromFaceIJWrap(face, [i, j + 1], level),
            ];
        }
    }
    return {
        S2Cell,
    };
}
