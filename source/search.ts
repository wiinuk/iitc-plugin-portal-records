import type { PortalRecord, PortalRecords } from "./portal-records";
import storageSvg from "../images/storage.svg";
import type { IterationFlow } from "./typed-idb";

function normalize(word: string) {
    return word.normalize("NFKC").toLowerCase();
}
function eachAllTextsInPortal(
    portal: PortalRecord,
    action: (text: string) => IterationFlow
) {
    if (action(portal.name) === "break") return;
    const { team } = portal.data;
    if (team && action(team) === "break") return;
}

let includesInPortal_normalizedWord = "";
let includesInPortal_result = false;
function includesInPortal(text: string) {
    if (normalize(text).includes(includesInPortal_normalizedWord)) {
        includesInPortal_result = true;
        return "break";
    }
}
function includes(normalizedWord: string, portal: PortalRecord) {
    try {
        includesInPortal_normalizedWord = normalizedWord;
        includesInPortal_result = false;
        eachAllTextsInPortal(portal, includesInPortal);
        return includesInPortal_result;
    } finally {
        includesInPortal_normalizedWord = "";
    }
}
function toThreeLetterTeamName(t: IITCPortalData["team"]) {
    switch (t) {
        case "E":
            return "ENL";
        case "R":
            return "RES";
        case "N":
        case "M":
            return "NEU";
        default:
            return t;
    }
}

export async function appendIitcSearchResult(
    iitc: IITCGlobals,
    query: IITCSearchQuery,
    records: PortalRecords,
    signal: AbortSignal
) {
    if (!query.confirmed) return;

    let storageIconCache: string | undefined;
    const normalizedWords = query.term.split(/\s+/).map(normalize);
    const oldResults = query.results.slice();
    await records.enterTransactionScope({ signal }, function* (portals) {
        yield* portals.iteratePortals((portal) => {
            for (const word of normalizedWords) {
                if (!includes(word, portal)) return undefined;
            }

            const position = L.latLng(portal.lat, portal.lng);
            if (
                oldResults.find(
                    (r) => r.position && r.position.equals(position)
                )
            ) {
                return;
            }
            const team = toThreeLetterTeamName(portal.data.team) ?? "???";
            const level = portal.data.level ?? "?";
            const health = portal.data.health ?? "?";
            const resonatorCount = portal.data.resCount ?? "?";
            query.addResult({
                title: portal.name,
                position,
                description: `${team}, L${level}, ${health}%, ${resonatorCount} Resonators`,
                icon: (storageIconCache ??=
                    `data:image/svg+xml;base64,` + btoa(storageSvg)),
                onSelected(_result, _clickEvent) {
                    iitc.renderPortalDetails(portal.guid);
                },
            });
        });
    });
}
