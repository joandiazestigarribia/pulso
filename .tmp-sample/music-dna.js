"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personaCopyCatalog = void 0;
exports.fetcher = fetcher;
exports.toUnit = toUnit;
exports.toPercent = toPercent;
exports.getDominantGenres = getDominantGenres;
exports.resolveSonicPersona = resolveSonicPersona;
exports.resolvePersonaShareCopy = resolvePersonaShareCopy;
exports.resolveDynamicPersonaDescription = resolveDynamicPersonaDescription;
exports.buildDynamicHandle = buildDynamicHandle;
exports.buildDynamicCode = buildDynamicCode;
exports.formatMetricPercent = formatMetricPercent;
exports.getRadarAxes = getRadarAxes;
exports.polarPoint = polarPoint;
exports.buildRadarPolygon = buildRadarPolygon;
exports.buildRadarPath = buildRadarPath;
const sonicPersonas = {
    chill_oracle: {
        id: "chill_oracle",
        name: "Oraculo Chill",
        handleBase: "oraculo_chill",
        codename: "SO-01",
        assetFile: "chill_oracle_character_asset resize.png",
    },
    hyperpop_pilot: {
        id: "hyperpop_pilot",
        name: "Piloto Hyperpop",
        handleBase: "piloto_hyperpop",
        codename: "SO-02",
        assetFile: "hyperpop_pilot_character_asset resize.png",
    },
    lo_fi_alchemist: {
        id: "lo_fi_alchemist",
        name: "Alquimista Lo-Fi",
        handleBase: "alquimista_lofi",
        codename: "SO-03",
        assetFile: "lo_fi_alchemist_character_asset resize.png",
    },
    neon_nomad: {
        id: "neon_nomad",
        name: "Nomada Neon",
        handleBase: "nomada_neon",
        codename: "SO-04",
        assetFile: "neon_nomad_character_asset resize.png",
    },
    ranger: {
        id: "ranger",
        name: "Explorador Ranger",
        handleBase: "sonic_ranger",
        codename: "SO-05",
        assetFile: "ranger_character_asset resize.png",
    },
    retro_scout: {
        id: "retro_scout",
        name: "Scout Retro",
        handleBase: "scout_retro",
        codename: "SO-06",
        assetFile: "retro_scout_character_asset resize.png",
    },
    synth_captain: {
        id: "synth_captain",
        name: "Capitan Synth",
        handleBase: "capitan_synth",
        codename: "SO-07",
        assetFile: "synth_captain_character_asset resize.png",
    },
    vaporwave_druid: {
        id: "vaporwave_druid",
        name: "Druida Vaporwave",
        handleBase: "druida_vaporwave",
        codename: "SO-08",
        assetFile: "vaporwave_druid_character_asset resize.png",
    },
};
exports.personaCopyCatalog = {
    chill_oracle: {
        archetypeLabel: "Calma Magnetica",
        toneCopy: {
            low: "fluyes en modo brisa, sin ruido extra",
            medium: "equilibras calma y empuje con precision",
            high: "levantas la energia sin perder elegancia",
        },
        templates: [
            "Tu mapa mezcla {genre} con una lectura fina del ritmo. {toneCopy}.",
            "Tu criterio en {genre} suena limpio y directo. {toneCopy}.",
            "Cuando eliges, {genre} gana por textura y detalle. {toneCopy}.",
            "Tu DNA ordena {genre} con pulso estable y curaduria clara. {toneCopy}.",
        ],
    },
    hyperpop_pilot: {
        archetypeLabel: "Impulso Neon",
        toneCopy: {
            low: "administras la tension para que cada golpe importe",
            medium: "sostienes aceleracion constante con control",
            high: "vas al frente con picos brillantes y precisos",
        },
        templates: [
            "Tu radar prioriza {genre} con decision quirurgica. {toneCopy}.",
            "Lees {genre} como una pista de lanzamiento. {toneCopy}.",
            "En tus votos, {genre} entra con timing agresivo. {toneCopy}.",
            "Tu seleccion convierte {genre} en una carrera bien medida. {toneCopy}.",
        ],
    },
    lo_fi_alchemist: {
        archetypeLabel: "Laboratorio Nocturno",
        toneCopy: {
            low: "prefieres capas suaves que dejan espacio al detalle",
            medium: "combinas intimidad y groove en dosis exacta",
            high: "subes intensidad sin perder atmosfera",
        },
        templates: [
            "Tu formula cruza {genre} con enfoque artesanal. {toneCopy}.",
            "Tu perfil en {genre} favorece texturas sobre exceso. {toneCopy}.",
            "Cada voto refina {genre} con mirada de estudio. {toneCopy}.",
            "Tu escucha empuja {genre} hacia un balance fino. {toneCopy}.",
        ],
    },
    neon_nomad: {
        archetypeLabel: "Ruta Hibrida",
        toneCopy: {
            low: "exploras con pausa y criterio abierto",
            medium: "saltas entre climas sin romper continuidad",
            high: "encadenas contrastes con hambre de descubrimiento",
        },
        templates: [
            "Tu DNA conecta {genre} con rutas poco obvias. {toneCopy}.",
            "Tu perfil convierte {genre} en territorio de cruce. {toneCopy}.",
            "Tus elecciones leen {genre} como mapa expandible. {toneCopy}.",
            "Hay firma viajera en como ordenas {genre}. {toneCopy}.",
        ],
    },
    ranger: {
        archetypeLabel: "Brigada Central",
        toneCopy: {
            low: "mantienes el foco en decisiones consistentes",
            medium: "equilibras impacto y claridad en cada duelo",
            high: "aceleras el pulso sin salirte del plan",
        },
        templates: [
            "Tu perfil sostiene {genre} con criterio competitivo. {toneCopy}.",
            "Tu curaduria de {genre} muestra disciplina y buena lectura. {toneCopy}.",
            "En batalla, eliges {genre} con enfoque estrategico. {toneCopy}.",
            "Tu DNA deja una firma estable en torno a {genre}. {toneCopy}.",
        ],
    },
    retro_scout: {
        archetypeLabel: "Archivo Analogico",
        toneCopy: {
            low: "priorizas cadencia y memoria antes que volumen",
            medium: "mezclas tradicion y actualidad con soltura",
            high: "reactivas clasicos con energia renovada",
        },
        templates: [
            "Tu estilo lleva {genre} con mirada historica. {toneCopy}.",
            "Tu seleccion rescata {genre} con sensibilidad de archivo. {toneCopy}.",
            "En tus votos, {genre} conserva raiz y direccion. {toneCopy}.",
            "Tu DNA convierte {genre} en puente entre epocas. {toneCopy}.",
        ],
    },
    synth_captain: {
        archetypeLabel: "Comando Electrico",
        toneCopy: {
            low: "prefieres pulsos controlados y lineas limpias",
            medium: "mantienes groove firme con enfoque tecnico",
            high: "enciendes la pista con traccion sostenida",
        },
        templates: [
            "Tu firma empuja {genre} con precision mecanica. {toneCopy}.",
            "Tu lectura de {genre} prioriza arquitectura sonora. {toneCopy}.",
            "Cada decision en {genre} suena calibrada para movimiento. {toneCopy}.",
            "Tu DNA electrifica {genre} sin perder estructura. {toneCopy}.",
        ],
    },
    vaporwave_druid: {
        archetypeLabel: "Mirador Onirico",
        toneCopy: {
            low: "sostienes un clima introspectivo y envolvente",
            medium: "combinas color emocional con paso firme",
            high: "amplificas la vibra sin romper el hechizo",
        },
        templates: [
            "Tu perfil modela {genre} desde la atmosfera. {toneCopy}.",
            "Tu seleccion en {genre} prioriza paisaje y sensacion. {toneCopy}.",
            "En cada duelo, {genre} aparece con narrativa visual. {toneCopy}.",
            "Tu DNA orienta {genre} hacia un viaje inmersivo. {toneCopy}.",
        ],
    },
};
function isPersonaArchetype(value) {
    return value in exports.personaCopyCatalog;
}
function fetcher(url) {
    return fetch(url).then((response) => response.json());
}
function toUnit(value) {
    if (value === null || Number.isNaN(value) || !Number.isFinite(value)) {
        return 0.5;
    }
    return Math.max(0, Math.min(1, value));
}
function toPercent(value) {
    return Math.round(value * 100);
}
function hasGenreSignal(genreValues, signals) {
    const normalized = genreValues.map((value) => value.toLowerCase());
    return signals.some((signal) => normalized.some((genre) => genre.includes(signal)));
}
function getDominantGenres(profileState) {
    const baseGenres = profileState?.teaser.topGenres ?? [];
    const subGenres = profileState?.teaser.topSubgenres ?? [];
    const labels = [...baseGenres, ...subGenres].map((item) => item.genre).filter(Boolean);
    const selected = [];
    for (const label of labels) {
        if (isRedundantGenreLabel(label, selected)) {
            continue;
        }
        selected.push(label);
        if (selected.length >= 5) {
            break;
        }
    }
    return selected;
}
function resolveSonicPersona(profileState, genreValues) {
    const profile = profileState?.profile;
    const energy = toUnit(profile?.averageEnergy ?? null);
    const danceability = toUnit(profile?.averageDanceability ?? null);
    const valence = toUnit(profile?.averageValence ?? null);
    const variety = Math.max(0, Math.min(1, profile?.genreVarietyScore ?? 0.5));
    const topDecade = Object.entries(profile?.decadeDistribution ?? {})[0]?.[0]?.toLowerCase() ?? "";
    if (danceability >= 0.72 && energy >= 0.68) {
        return sonicPersonas.hyperpop_pilot;
    }
    if (variety >= 0.75) {
        return sonicPersonas.neon_nomad;
    }
    if (energy <= 0.43 && valence <= 0.58) {
        return sonicPersonas.lo_fi_alchemist;
    }
    if (valence >= 0.7 && energy <= 0.62) {
        return sonicPersonas.chill_oracle;
    }
    if (topDecade.includes("70") || topDecade.includes("80") || topDecade.includes("90")) {
        return sonicPersonas.retro_scout;
    }
    if (hasGenreSignal(genreValues, ["synth", "electro", "electronic", "house", "edm", "techno"])) {
        return sonicPersonas.synth_captain;
    }
    if (hasGenreSignal(genreValues, ["dream", "ambient", "shoegaze", "indie"])) {
        return sonicPersonas.vaporwave_druid;
    }
    return sonicPersonas.ranger;
}
function levelBand(value) {
    if (value === null || !Number.isFinite(value)) {
        return "media";
    }
    if (value < 0.4) {
        return "baja";
    }
    if (value > 0.65) {
        return "alta";
    }
    return "media";
}
function hashStringFnv1a(value) {
    let hash = 0x811c9dc5;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
}
function pickDeterministicIndex(seed, slot, size) {
    if (size <= 0) {
        return 0;
    }
    return hashStringFnv1a(`${seed}|${slot}`) % size;
}
function resolvePersonaTone(profileState) {
    const energy = toUnit(profileState?.profile?.averageEnergy ?? null);
    const valence = toUnit(profileState?.profile?.averageValence ?? null);
    const weightedMood = energy * 0.65 + valence * 0.35;
    if (weightedMood < 0.4) {
        return "low";
    }
    if (weightedMood > 0.68) {
        return "high";
    }
    return "medium";
}
function getDominantDecadeLabel(profileState) {
    const distributionEntries = Object.entries(profileState?.profile?.decadeDistribution ?? {});
    if (distributionEntries.length === 0) {
        return "mixed eras";
    }
    let dominantEntry = distributionEntries[0];
    for (const currentEntry of distributionEntries.slice(1)) {
        if (currentEntry[1] > dominantEntry[1]) {
            dominantEntry = currentEntry;
        }
    }
    return dominantEntry[0];
}
function mapDecadeGroup(decadeLabel) {
    const match = decadeLabel.match(/(\d{4})/);
    if (!match) {
        return "millennial";
    }
    const decade = Number.parseInt(match[1] ?? "", 10);
    if (!Number.isFinite(decade)) {
        return "millennial";
    }
    if (decade <= 1979) {
        return "classic";
    }
    if (decade <= 1999) {
        return "retro";
    }
    if (decade <= 2014) {
        return "millennial";
    }
    return "current";
}
function getDecadeCopy(group) {
    const decadeCopyMap = {
        classic: "Ancla tu identidad en eras fundacionales.",
        retro: "Respiras referencias noventeras y ochenteras con criterio moderno.",
        millennial: "Tu norte cae en la etapa de transicion digital.",
        current: "Tu pulso se alinea con la ola mas reciente.",
    };
    return decadeCopyMap[group];
}
function getHeadline(style, persona, archetypeLabel, dominantGenre, decadeGroup) {
    if (style === "totem") {
        return `${persona.name} // ${archetypeLabel}`;
    }
    const decadeTagMap = {
        classic: "Classic Circuit",
        retro: "Retro Signal",
        millennial: "Millennial Wave",
        current: "Current Mode",
    };
    return `${decadeTagMap[decadeGroup]}: ${dominantGenre}`;
}
function resolvePersonaShareCopy(params) {
    const { persona, profileState, dominantGenres, userId = null, anonymousId = null } = params;
    const archetype = isPersonaArchetype(persona.id) ? persona.id : "ranger";
    const catalogEntry = exports.personaCopyCatalog[archetype];
    const dominantGenre = dominantGenres[0] ?? profileState?.profile?.dominantGenre ?? "sonidos mixtos";
    const dominantDecadeLabel = getDominantDecadeLabel(profileState);
    const decadeGroup = mapDecadeGroup(dominantDecadeLabel);
    const tone = resolvePersonaTone(profileState);
    const generatedFromVotes = profileState?.profile?.generatedFromVotes ?? profileState?.completedBattlesCount ?? 0;
    const identitySeed = userId ?? anonymousId ?? "guest";
    const sourceSeed = [
        persona.id,
        dominantGenre.toLowerCase(),
        decadeGroup,
        String(generatedFromVotes),
        identitySeed.toLowerCase(),
    ].join("|");
    const seed = hashStringFnv1a(sourceSeed);
    const templateIndex = pickDeterministicIndex(sourceSeed, "template", catalogEntry.templates.length);
    const headlineStyleIndex = pickDeterministicIndex(sourceSeed, "headline-style", 2);
    const headlineStyle = headlineStyleIndex === 0 ? "totem" : "signal";
    const template = catalogEntry.templates[templateIndex];
    const toneCopy = catalogEntry.toneCopy[tone];
    const description = `${template.replace("{genre}", dominantGenre).replace("{toneCopy}", toneCopy)} ${getDecadeCopy(decadeGroup)}`;
    const headline = getHeadline(headlineStyle, persona, catalogEntry.archetypeLabel, dominantGenre, decadeGroup);
    return {
        headline,
        description,
        meta: {
            archetype,
            tone,
            templateIndex,
            headlineStyle,
            decadeGroup,
            seed,
        },
    };
}
function resolveDynamicPersonaDescription(persona, profileState, dominantGenres) {
    const profile = profileState?.profile;
    const mainGenre = dominantGenres[0] ?? profile?.dominantGenre ?? "generos mixtos";
    const secondGenre = dominantGenres[1] ?? "senales variadas";
    const topDecade = Object.entries(profile?.decadeDistribution ?? {})[0]?.[0] ?? "decadas mixtas";
    const energy = levelBand(profile?.averageEnergy ?? null);
    const dance = levelBand(profile?.averageDanceability ?? null);
    const mood = levelBand(profile?.averageValence ?? null);
    return `${persona.name}: tu seleccion prioriza ${mainGenre} y ${secondGenre}, con energia ${energy}, animo ${mood} y bailabilidad ${dance}. El patron general muestra una preferencia consistente por ${topDecade}, con un criterio curatorial estable y enfocado.`;
}
function buildDynamicHandle(base, userId, anonymousId) {
    const identity = userId ?? anonymousId ?? "guest";
    const suffix = identity.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toLowerCase() || "0000";
    return `@${base}_${suffix}`;
}
function buildDynamicCode(baseCode, profileState) {
    const battles = profileState?.completedBattlesCount ?? 0;
    const variety = Math.round((profileState?.profile?.genreVarietyScore ?? 0) * 100);
    return `${baseCode}-${String(Math.min(999, battles)).padStart(3, "0")}-${String(variety).padStart(2, "0")}`;
}
function formatMetricPercent(value) {
    if (value === null || !Number.isFinite(value)) {
        return "N/D";
    }
    return `${toPercent(value)}%`;
}
function getRadarAxes(profile) {
    const energy = toUnit(profile?.averageEnergy ?? null);
    const dance = toUnit(profile?.averageDanceability ?? null);
    const valence = toUnit(profile?.averageValence ?? null);
    const variety = Math.max(0, Math.min(1, profile?.genreVarietyScore ?? 0.5));
    const topDecade = Object.keys(profile?.decadeDistribution ?? {})[0] ?? "";
    const nostalgia = getNostalgiaScore(topDecade);
    const rhythm = Math.max(0, Math.min(1, dance * 0.62 + energy * 0.38));
    return [
        { key: "energy", label: "Intensidad", value: energy },
        { key: "bpm", label: "Ritmo", value: rhythm },
        { key: "dance", label: "Baile", value: dance },
        { key: "nostalgia", label: "Nostalgia", value: nostalgia },
        { key: "valence", label: "Animo", value: valence },
        { key: "obscurity", label: "Exploracion", value: variety },
    ];
}
function polarPoint(index, total, radius, center) {
    const angle = ((Math.PI * 2) / total) * index - Math.PI / 2;
    return {
        x: center + Math.cos(angle) * radius,
        y: center + Math.sin(angle) * radius,
    };
}
function buildRadarPolygon(axes, radius, center) {
    return axes
        .map((axis, index) => {
        const point = polarPoint(index, axes.length, radius * axis.value, center);
        return `${point.x},${point.y}`;
    })
        .join(" ");
}
function buildRadarPath(axes, radius, center) {
    return (axes
        .map((axis, index) => {
        const point = polarPoint(index, axes.length, radius * axis.value, center);
        return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
    })
        .join(" ") + " Z");
}
function normalizeGenreText(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/urban/g, "urbano")
        .replace(/&/g, " ")
        .replace(/[^\w\s/]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function genreTokenSet(value) {
    const normalized = normalizeGenreText(value).replace(/\//g, " ");
    const tokens = normalized
        .split(" ")
        .map((token) => token.trim())
        .filter((token) => token.length > 0 && token !== "music" && token !== "genre");
    return new Set(tokens);
}
function isSubset(left, right) {
    if (left.size === 0 || right.size === 0 || left.size > right.size) {
        return false;
    }
    for (const token of left) {
        if (!right.has(token)) {
            return false;
        }
    }
    return true;
}
function isRedundantGenreLabel(candidate, selected) {
    const candidateNormalized = normalizeGenreText(candidate);
    const candidateTokens = genreTokenSet(candidate);
    for (const existing of selected) {
        const existingNormalized = normalizeGenreText(existing);
        if (candidateNormalized === existingNormalized) {
            return true;
        }
        const existingTokens = genreTokenSet(existing);
        if (isSubset(candidateTokens, existingTokens) || isSubset(existingTokens, candidateTokens)) {
            return true;
        }
    }
    return false;
}
function getNostalgiaScore(decadeLabel) {
    const match = decadeLabel.match(/(\d{4})/);
    if (!match) {
        return 0.5;
    }
    const decade = Number.parseInt(match[1] ?? "", 10);
    if (!Number.isFinite(decade) || decade < 1950) {
        return 0.5;
    }
    const nowYear = 2026;
    const age = Math.max(0, nowYear - decade);
    return Math.max(0, Math.min(1, age / 70));
}
