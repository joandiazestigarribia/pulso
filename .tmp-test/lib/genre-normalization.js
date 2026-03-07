"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTrackGenre = normalizeTrackGenre;
const MACRO_GENRE_LABELS = {
    pop: "Pop",
    urbano: "Urbano",
    hiphop_rap: "Hip-Hop/Rap",
    rnb_soul: "R&B/Soul",
    rock: "Rock",
    metal_hardrock: "Metal/Hard Rock",
    electronic: "Electronic",
    indie_alt: "Indie/Alternative",
    cumbia_latina: "Cumbia/Latin",
    folk_regional: "Folk/Regional",
    classics: "Classics",
    unknown: "Unknown",
};
const GENRE_RULES = [
    { macro: "hiphop_rap", subgenre: "Hip Hop", tokens: ["hip hop", "hip-hop", "rap", "boombap", "trap"] },
    { macro: "rnb_soul", subgenre: "R&B/Soul", tokens: ["r&b", "rnb", "soul", "neo soul"] },
    { macro: "urbano", subgenre: "Reggaeton", tokens: ["reggaeton", "latin trap", "trap latino", "dembow"] },
    { macro: "urbano", subgenre: "Latin Urban", tokens: ["urbano", "latin urban"] },
    { macro: "folk_regional", subgenre: "Folklore", tokens: ["folklore", "chacarera", "zamba", "cueca", "vidala"] },
    { macro: "cumbia_latina", subgenre: "Cumbia", tokens: ["cumbia", "villera", "sonidera"] },
    { macro: "electronic", subgenre: "House", tokens: ["house", "deep house", "future house"] },
    { macro: "electronic", subgenre: "Techno", tokens: ["techno"] },
    { macro: "electronic", subgenre: "EDM", tokens: ["edm", "electro", "dance"] },
    { macro: "electronic", subgenre: "Drum and Bass", tokens: ["drum and bass", "dnb"] },
    { macro: "indie_alt", subgenre: "Indie Pop", tokens: ["indie pop"] },
    { macro: "indie_alt", subgenre: "Indie Rock", tokens: ["indie rock", "indie"] },
    { macro: "indie_alt", subgenre: "Alternative", tokens: ["alternative", "alternativa", "alt rock"] },
    { macro: "indie_alt", subgenre: "Shoegaze", tokens: ["shoegaze"] },
    { macro: "rock", subgenre: "Rock", tokens: ["rock", "rock en espanol"] },
    { macro: "metal_hardrock", subgenre: "Metal", tokens: ["metal", "hard rock", "nu metal"] },
    { macro: "rock", subgenre: "Punk", tokens: ["punk", "post punk"] },
    { macro: "rock", subgenre: "Grunge", tokens: ["grunge"] },
    { macro: "classics", subgenre: "70s/80s/90s", tokens: ["classic rock", "new wave", "disco"] },
    { macro: "classics", subgenre: "2000s/2010s", tokens: ["2000s", "2010s", "nostalgia 2000s"] },
    { macro: "pop", subgenre: "Synthpop", tokens: ["synthpop", "synth wave", "synthwave"] },
    { macro: "pop", subgenre: "Latin Pop", tokens: ["latin pop", "pop latino", "pop en espanol"] },
    { macro: "pop", subgenre: "Pop", tokens: ["pop"] },
];
function normalizeText(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function normalizeLabel(value) {
    return normalizeText(value).replace(/\s+/g, "");
}
function fallbackMacroGenre(signal) {
    if (signal.includes("rnb") || signal.includes("r b") || signal.includes("soul")) {
        return "rnb_soul";
    }
    if (signal.includes("hip hop") || signal.includes("rap")) {
        return "hiphop_rap";
    }
    if (signal.includes("folklore") || signal.includes("chacarera") || signal.includes("zamba")) {
        return "folk_regional";
    }
    if (signal.includes("latin")) {
        return "cumbia_latina";
    }
    if (signal.includes("electro") || signal.includes("dance")) {
        return "electronic";
    }
    if (signal.includes("alternative") || signal.includes("indie")) {
        return "indie_alt";
    }
    if (signal.includes("rock")) {
        return "rock";
    }
    if (signal.includes("metal")) {
        return "metal_hardrock";
    }
    if (signal.length === 0 || signal === "unknown") {
        return "unknown";
    }
    return "pop";
}
function normalizeTrackGenre(rawGenre) {
    const signal = normalizeText(rawGenre);
    for (const rule of GENRE_RULES) {
        if (rule.tokens.some((token) => signal.includes(token))) {
            const macroGenre = MACRO_GENRE_LABELS[rule.macro];
            const subgenre = normalizeLabel(rule.subgenre) === normalizeLabel(macroGenre) ? null : rule.subgenre;
            return {
                macroGenre,
                subgenre,
            };
        }
    }
    const fallbackKey = fallbackMacroGenre(signal);
    return {
        macroGenre: MACRO_GENRE_LABELS[fallbackKey],
        subgenre: null,
    };
}
