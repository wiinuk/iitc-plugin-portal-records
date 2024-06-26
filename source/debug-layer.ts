import { escapeHtml } from "./document-extensions";

function createDebug(debugLayer: L.LayerGroup<L.ILayer>) {
    const maxLayerCount = 100;
    let zIndexOffset = 0;
    const layerToGroups = new WeakMap<L.ILayer, Set<string>>();
    const scopedGroups = new Set<string>();

    const addedLayers: L.ILayer[] = [];
    function add(layer: L.ILayer) {
        if (maxLayerCount < addedLayers.length) {
            const layer = addedLayers.shift();
            if (layer) debugLayer.removeLayer(layer);
        }
        debugLayer.addLayer(layer);
        layerToGroups.set(layer, new Set(scopedGroups));
    }
    function addMessage(center: L.LatLngExpression, message: string) {
        if (message == null || message === "") return;

        console.debug(message);
        add(
            L.marker(center, {
                keyboard: true,
                icon: L.divIcon({
                    className: "debug-message",
                    iconSize: [50, 50],
                    html: `<div style="background: unset; text-shadow: 0 0 2px white;">${escapeHtml(
                        message
                    )}</div>`,
                }),
                zIndexOffset: zIndexOffset++,
            })
        );
    }
    const boundOptions: L.PolylineOptions = {
        color: "black",
        weight: 1,
        opacity: 0.8,
        clickable: false,
        fill: false,
        fillOpacity: 0.5,
    };
    function groupEnd(groupName: string) {
        scopedGroups.delete(groupName);
    }
    return {
        point(center: L.LatLngExpression, message: string) {
            add(L.circleMarker(center, { radius: 16 }));
            addMessage(center, message);
        },
        line(
            points: [L.LatLngExpression, L.LatLngExpression],
            message: string,
            options: L.PolylineOptions
        ) {
            add(L.polyline(points, options));
            addMessage(L.latLngBounds(points).getCenter(), message);
        },
        bound(bound: L.LatLngBounds, message: string) {
            add(
                L.polygon(
                    [
                        bound.getNorthEast(),
                        bound.getSouthEast(),
                        bound.getSouthWest(),
                        bound.getNorthWest(),
                    ],
                    boundOptions
                )
            );
            addMessage(bound.getCenter(), message);
        },
        clear() {
            debugLayer.clearLayers();
        },
        group(groupName: string) {
            scopedGroups.add(groupName);

            return {
                [Symbol.dispose]() {
                    groupEnd(groupName);
                },
            };
        },
        groupEnd,
        clearGroup(groupName: string) {
            for (const layer of debugLayer.getLayers()) {
                if (layerToGroups.get(layer)?.has(groupName)) {
                    debugLayer.removeLayer(layer);
                }
            }
        },
    };
}
export function setDebug(debugLayer: L.LayerGroup<L.ILayer>) {
    debug = createDebug(debugLayer);
    return debugLayer;
}
export let debug: ReturnType<typeof createDebug> | undefined;
