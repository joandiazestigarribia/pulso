import fs from "node:fs/promises"
import path from "node:path"

const DEFAULT_TERMS = [
  "rock en espanol",
  "reggaeton",
  "cumbia",
  "indie rock",
  "electronic",
  "pop en espanol",
  "alternative",
  "synthpop",
  "latin trap",
  "new wave",
]

const COVER_MARKERS = [
  " cover",
  "(cover",
  "tribute",
  "karaoke",
  "originally performed by",
  "originally by",
]

const INSTRUMENTAL_MARKERS = [
  "instrumental",
  "no vocals",
  "lofi",
  "lo-fi",
  "study beats",
  "sleep music",
  "meditation",
  "background music",
]

const FORCED_DENY_ARTIST_TOKENS = ["kids bop kids"]
const FORCED_DENY_TITLE_TOKENS = ["sped up", "slowed", "nightcore", "8d audio"]

function parseArgs(argv) {
  const options = {
    terms: [],
    limit: 50,
    top: 15,
    timeoutMs: 8000,
    compare: "itunes",
    market: "AR",
    deezerPlaylistId: null,
    out: null,
    json: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === "--term") {
      const value = argv[index + 1]
      if (value) {
        options.terms.push(value)
      }
      index += 1
      continue
    }

    if (token === "--terms") {
      const value = argv[index + 1]
      if (value) {
        options.terms.push(
          ...value
            .split(",")
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0)
        )
      }
      index += 1
      continue
    }

    if (token === "--limit") {
      options.limit = Number.parseInt(argv[index + 1] ?? "50", 10)
      index += 1
      continue
    }

    if (token === "--top") {
      options.top = Number.parseInt(argv[index + 1] ?? "15", 10)
      index += 1
      continue
    }

    if (token === "--timeout-ms") {
      options.timeoutMs = Number.parseInt(argv[index + 1] ?? "8000", 10)
      index += 1
      continue
    }

    if (token === "--compare") {
      options.compare = argv[index + 1] ?? "both"
      index += 1
      continue
    }

    if (token === "--market") {
      options.market = (argv[index + 1] ?? "AR").toUpperCase()
      index += 1
      continue
    }

    if (token === "--deezer-playlist-id") {
      options.deezerPlaylistId = argv[index + 1] ?? null
      index += 1
      continue
    }

    if (token === "--deezer-playlist-url") {
      const value = argv[index + 1] ?? ""
      const extracted = extractPlaylistId(value)
      options.deezerPlaylistId = extracted ?? null
      index += 1
      continue
    }

    if (token === "--out") {
      options.out = argv[index + 1] ?? null
      index += 1
      continue
    }

    if (token === "--json") {
      options.json = true
    }
  }

  if (options.terms.length === 0) {
    options.terms = DEFAULT_TERMS
  }

  if (!Number.isFinite(options.limit) || options.limit <= 0) {
    options.limit = 50
  }
  options.limit = Math.min(options.limit, 100)

  if (!Number.isFinite(options.top) || options.top <= 0) {
    options.top = 15
  }

  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    options.timeoutMs = 8000
  }

  if (!["none", "itunes", "both"].includes(options.compare)) {
    options.compare = "itunes"
  }

  return options
}

function extractPlaylistId(value) {
  const signal = String(value ?? "").trim()
  if (!signal) {
    return null
  }

  const direct = signal.match(/^\d+$/)
  if (direct) {
    return direct[0]
  }

  const fromPath = signal.match(/playlist\/(\d+)/i)
  if (fromPath) {
    return fromPath[1]
  }

  return null
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function buildTrackKey(track) {
  return `${normalize(track.title)}::${normalize(track.artist)}`
}

function includesAnyToken(value, tokens) {
  return tokens.some((token) => value.includes(token))
}

function isLikelyCoverOrInstrumental(track) {
  const signal = normalize(`${track.title} ${track.artist} ${track.album ?? ""}`)
  const titleSignal = normalize(track.title)
  const artistSignal = normalize(track.artist)

  if (includesAnyToken(artistSignal, FORCED_DENY_ARTIST_TOKENS)) {
    return true
  }

  if (includesAnyToken(titleSignal, FORCED_DENY_TITLE_TOKENS)) {
    return true
  }

  if (includesAnyToken(signal, COVER_MARKERS) || includesAnyToken(signal, INSTRUMENTAL_MARKERS)) {
    return true
  }

  return false
}

function isLikelyMojibake(value) {
  return typeof value === "string" && /Ã.|Â./.test(value)
}

function computePercent(numerator, denominator) {
  if (!Number.isFinite(denominator) || denominator <= 0) {
    return 0
  }
  return Number(((numerator / denominator) * 100).toFixed(2))
}

function percentile(values, fraction) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))
  return sorted[index]
}

function computeQualityScore({ usableRate, previewRate, uniquenessRate, mojibakeRate }) {
  const score = usableRate * 0.6 + previewRate * 0.2 + uniquenessRate * 0.15 + (100 - mojibakeRate) * 0.05
  return Number(score.toFixed(2))
}

function withTimeoutSignal(timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  }
}

async function fetchProviderSearch(provider, term, options) {
  const startedAt = Date.now()
  const timeout = withTimeoutSignal(options.timeoutMs)

  try {
    let url
    let requestInit = {
      signal: timeout.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    }

    if (provider === "deezer") {
      url = new URL("https://api.deezer.com/search")
      url.searchParams.set("q", term)
      url.searchParams.set("limit", String(options.limit))
    } else if (provider === "itunes") {
      url = new URL("https://itunes.apple.com/search")
      url.searchParams.set("media", "music")
      url.searchParams.set("entity", "song")
      url.searchParams.set("limit", String(options.limit))
      url.searchParams.set("country", options.market)
      url.searchParams.set("term", term)
    } else {
      return {
        provider,
        term,
        ok: false,
        skipped: true,
        status: null,
        latencyMs: 0,
        resultCount: 0,
        tracks: [],
        errorCode: "unsupported_provider",
        errorMessage: "Provider not supported by this probe.",
        url: null,
      }
    }

    const response = await fetch(url.toString(), requestInit)
    const latencyMs = Date.now() - startedAt

    if (!response.ok) {
      return {
        provider,
        term,
        ok: false,
        skipped: false,
        status: response.status,
        latencyMs,
        resultCount: 0,
        tracks: [],
        errorCode: `http_${response.status}`,
        errorMessage: `HTTP ${response.status}`,
        url: url.toString(),
      }
    }

    const payload = await response.json()
    let tracks = []

    if (provider === "deezer") {
      const rawTracks = Array.isArray(payload?.data) ? payload.data : []
      tracks = rawTracks.map((item) => ({
        provider,
        id: item.id ?? null,
        title: item.title ?? null,
        artist: item.artist?.name ?? null,
        album: item.album?.title ?? null,
        rank: item.rank ?? null,
        durationSec: item.duration ?? null,
        explicitLyrics: item.explicit_lyrics ?? null,
        previewUrl: item.preview ?? null,
        link: item.link ?? null,
      }))
    } else if (provider === "itunes") {
      const rawTracks = Array.isArray(payload?.results) ? payload.results : []
      tracks = rawTracks
        .filter((item) => item?.wrapperType === "track" && item?.kind === "song")
        .map((item) => ({
          provider,
          id: item.trackId ?? null,
          title: item.trackName ?? null,
          artist: item.artistName ?? null,
          album: item.collectionName ?? null,
          rank: null,
          durationSec:
            typeof item.trackTimeMillis === "number" ? Math.floor(item.trackTimeMillis / 1000) : null,
          explicitLyrics: item.trackExplicitness === "explicit",
          previewUrl: item.previewUrl ?? null,
          link: item.trackViewUrl ?? null,
        }))
    } else {
      tracks = []
    }

    return {
      provider,
      term,
      ok: true,
      skipped: false,
      status: response.status,
      latencyMs,
      resultCount: tracks.length,
      tracks,
      errorCode: null,
      errorMessage: null,
      url: url.toString(),
    }
  } catch (error) {
    const latencyMs = Date.now() - startedAt
    const isAbort = error instanceof Error && error.name === "AbortError"
    return {
      provider,
      term,
      ok: false,
      skipped: false,
      status: null,
      latencyMs,
      resultCount: 0,
      tracks: [],
      errorCode: isAbort ? "timeout" : "network_error",
      errorMessage: error instanceof Error ? error.message : String(error),
      url: null,
    }
  } finally {
    timeout.clear()
  }
}

async function fetchDeezerPlaylistTracks(playlistId, options) {
  const startedAt = Date.now()
  const timeout = withTimeoutSignal(options.timeoutMs)
  try {
    const url = new URL(`https://api.deezer.com/playlist/${encodeURIComponent(playlistId)}`)
    const response = await fetch(url.toString(), {
      signal: timeout.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    })

    const latencyMs = Date.now() - startedAt
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        latencyMs,
        errorCode: `http_${response.status}`,
        errorMessage: `HTTP ${response.status}`,
        playlist: null,
        tracks: [],
      }
    }

    const payload = await response.json()
    const tracks = Array.isArray(payload?.tracks?.data)
      ? payload.tracks.data.map((item) => ({
          provider: "deezer_playlist",
          id: item.id ?? null,
          title: item.title ?? null,
          artist: item.artist?.name ?? null,
          album: item.album?.title ?? null,
          rank: item.rank ?? null,
          durationSec: item.duration ?? null,
          explicitLyrics: item.explicit_lyrics ?? null,
          previewUrl: item.preview ?? null,
          link: item.link ?? null,
        }))
      : []

    return {
      ok: true,
      status: response.status,
      latencyMs,
      errorCode: null,
      errorMessage: null,
      playlist: {
        id: payload?.id ?? playlistId,
        title: payload?.title ?? null,
        trackCount: payload?.nb_tracks ?? tracks.length,
        creator: payload?.creator?.name ?? null,
        link: payload?.link ?? null,
      },
      tracks,
    }
  } catch (error) {
    const latencyMs = Date.now() - startedAt
    const isAbort = error instanceof Error && error.name === "AbortError"
    return {
      ok: false,
      status: null,
      latencyMs,
      errorCode: isAbort ? "timeout" : "network_error",
      errorMessage: error instanceof Error ? error.message : String(error),
      playlist: null,
      tracks: [],
    }
  } finally {
    timeout.clear()
  }
}

function summarizePlaylistValidation(result) {
  if (!result.ok || !result.playlist) {
    return {
      ok: false,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      status: result.status,
      latencyMs: result.latencyMs,
      playlist: result.playlist,
      counts: {
        rawCount: 0,
        blockedCount: 0,
        usableCount: 0,
        uniqueUsableCount: 0,
        previewCount: 0,
      },
      rates: {
        usableRatePercent: 0,
        previewCoveragePercent: 0,
        uniquenessRatePercent: 0,
        mojibakeRatePercent: 0,
      },
      qualityScore: 0,
      sample: [],
    }
  }

  const uniqueTrackMap = new Map()
  let blockedCount = 0
  let usableCount = 0
  let mojibakeCount = 0

  for (const track of result.tracks) {
    const normalizedTrack = {
      ...track,
      title: track.title ?? "Unknown",
      artist: track.artist ?? "Unknown",
      album: track.album ?? null,
    }

    if (isLikelyCoverOrInstrumental(normalizedTrack)) {
      blockedCount += 1
      continue
    }

    usableCount += 1
    if (isLikelyMojibake(normalizedTrack.title) || isLikelyMojibake(normalizedTrack.artist)) {
      mojibakeCount += 1
    }

    const key = buildTrackKey(normalizedTrack)
    if (!uniqueTrackMap.has(key)) {
      uniqueTrackMap.set(key, normalizedTrack)
    }
  }

  const uniqueTracks = Array.from(uniqueTrackMap.values())
  const previewCount = uniqueTracks.filter((track) => Boolean(track.previewUrl)).length
  const usableRate = computePercent(usableCount, result.tracks.length)
  const previewRate = computePercent(previewCount, uniqueTracks.length)
  const uniquenessRate = computePercent(uniqueTracks.length, Math.max(1, usableCount))
  const mojibakeRate = computePercent(mojibakeCount, Math.max(1, usableCount))
  const qualityScore = computeQualityScore({
    usableRate,
    previewRate,
    uniquenessRate,
    mojibakeRate,
  })

  return {
    ok: true,
    errorCode: null,
    errorMessage: null,
    status: result.status,
    latencyMs: result.latencyMs,
    playlist: result.playlist,
    counts: {
      rawCount: result.tracks.length,
      blockedCount,
      usableCount,
      uniqueUsableCount: uniqueTracks.length,
      previewCount,
    },
    rates: {
      usableRatePercent: usableRate,
      previewCoveragePercent: previewRate,
      uniquenessRatePercent: uniquenessRate,
      mojibakeRatePercent: mojibakeRate,
    },
    qualityScore,
    sample: uniqueTracks.slice(0, 12).map((track) => ({
      title: track.title,
      artist: track.artist,
      hasPreview: Boolean(track.previewUrl),
      link: track.link,
    })),
  }
}

function aggregateProviderResults(provider, queries, options) {
  const providerQueries = queries.filter((query) => query.provider === provider)
  const successfulQueries = providerQueries.filter((query) => query.ok)
  const failedQueries = providerQueries.filter((query) => !query.ok && !query.skipped)
  const skippedQueries = providerQueries.filter((query) => query.skipped)
  const latencies = successfulQueries.map((query) => query.latencyMs)

  const allTracks = successfulQueries.flatMap((query) => query.tracks)
  const uniqueTrackMap = new Map()
  let usableCount = 0
  let blockedCount = 0
  let mojibakeCount = 0

  for (const track of allTracks) {
    const normalizedTrack = {
      provider,
      id: track.id,
      title: track.title ?? "Unknown",
      artist: track.artist ?? "Unknown",
      album: track.album ?? null,
      rank: track.rank ?? null,
      durationSec: track.durationSec ?? null,
      explicitLyrics: track.explicitLyrics ?? null,
      previewUrl: track.previewUrl ?? null,
      link: track.link ?? null,
    }

    if (isLikelyCoverOrInstrumental(normalizedTrack)) {
      blockedCount += 1
      continue
    }

    usableCount += 1
    if (isLikelyMojibake(normalizedTrack.title) || isLikelyMojibake(normalizedTrack.artist)) {
      mojibakeCount += 1
    }

    const key = buildTrackKey(normalizedTrack)
    if (!uniqueTrackMap.has(key)) {
      uniqueTrackMap.set(key, normalizedTrack)
    }
  }

  const uniqueTracks = Array.from(uniqueTrackMap.values())
  const previewCount = uniqueTracks.filter((track) => Boolean(track.previewUrl)).length
  const rawCount = allTracks.length
  const usableRate = computePercent(usableCount, rawCount)
  const previewRate = computePercent(previewCount, uniqueTracks.length)
  const uniquenessRate = computePercent(uniqueTracks.length, Math.max(1, usableCount))
  const mojibakeRate = computePercent(mojibakeCount, Math.max(1, usableCount))
  const qualityScore = computeQualityScore({
    usableRate,
    previewRate,
    uniquenessRate,
    mojibakeRate,
  })

  const topTracks = uniqueTracks
    .sort((left, right) => (right.rank ?? 0) - (left.rank ?? 0))
    .slice(0, options.top)
    .map((track) => ({
      title: track.title,
      artist: track.artist,
      album: track.album,
      hasPreview: Boolean(track.previewUrl),
      rank: track.rank,
      link: track.link,
    }))

  return {
    provider,
    requestedTerms: options.terms.length,
    successfulQueries: successfulQueries.length,
    failedQueries: failedQueries.length,
    skippedQueries: skippedQueries.length,
    successRatePercent: computePercent(successfulQueries.length, options.terms.length),
    latencyMs: {
      min: latencies.length > 0 ? Math.min(...latencies) : 0,
      avg:
        latencies.length > 0
          ? Number((latencies.reduce((sum, value) => sum + value, 0) / latencies.length).toFixed(1))
          : 0,
      p50: percentile(latencies, 0.5),
      p95: percentile(latencies, 0.95),
      max: latencies.length > 0 ? Math.max(...latencies) : 0,
    },
    counts: {
      rawCount,
      blockedCount,
      usableCount,
      uniqueUsableCount: uniqueTracks.length,
      previewCount,
    },
    rates: {
      usableRatePercent: usableRate,
      previewCoveragePercent: previewRate,
      uniquenessRatePercent: uniquenessRate,
      mojibakeRatePercent: mojibakeRate,
    },
    qualityScore,
    topTracks,
  }
}

function compareProvidersByTerm(queries, term, leftProvider, rightProvider) {
  const leftQuery = queries.find((query) => query.provider === leftProvider && query.term === term && query.ok)
  const rightQuery = queries.find((query) => query.provider === rightProvider && query.term === term && query.ok)
  if (!leftQuery || !rightQuery) {
    return null
  }

  const leftSet = new Set(
    leftQuery.tracks.map((track) =>
      buildTrackKey({
        title: track.title ?? "Unknown",
        artist: track.artist ?? "Unknown",
      })
    )
  )
  const rightSet = new Set(
    rightQuery.tracks.map((track) =>
      buildTrackKey({
        title: track.title ?? "Unknown",
        artist: track.artist ?? "Unknown",
      })
    )
  )

  let intersection = 0
  for (const key of leftSet) {
    if (rightSet.has(key)) {
      intersection += 1
    }
  }
  const union = leftSet.size + rightSet.size - intersection
  const jaccard = computePercent(intersection, Math.max(1, union))

  return {
    term,
    leftProvider,
    rightProvider,
    leftCount: leftSet.size,
    rightCount: rightSet.size,
    overlapCount: intersection,
    overlapJaccardPercent: jaccard,
  }
}

function buildOutputPath(customPath) {
  if (customPath) {
    return path.resolve(process.cwd(), customPath)
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  return path.resolve(process.cwd(), "reports", `deezer-probe-v2-${stamp}.json`)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  const providers = ["deezer"]
  if (options.compare === "itunes" || options.compare === "both") {
    providers.push("itunes")
  }

  const queries = []
  for (const term of options.terms) {
    for (const provider of providers) {
      queries.push(await fetchProviderSearch(provider, term, options))
    }
  }

  const providerSummaries = Object.fromEntries(
    providers.map((provider) => [provider, aggregateProviderResults(provider, queries, options)])
  )

  const comparisons = []
  if (providers.includes("itunes")) {
    for (const term of options.terms) {
      const result = compareProvidersByTerm(queries, term, "deezer", "itunes")
      if (result) {
        comparisons.push(result)
      }
    }
  }
  const report = {
    version: 2,
    generatedAt: new Date().toISOString(),
    options,
    providers,
    notes: {
      compareMode: options.compare,
      qualityFormula: "usableRate*0.6 + previewRate*0.2 + uniquenessRate*0.15 + (100-mojibakeRate)*0.05",
      filtersApplied: [
        "cover markers",
        "instrumental markers",
        "forced deny artist tokens",
        "forced deny title tokens",
        "duplicate normalization by title+artist",
      ],
    },
    summary: providerSummaries,
    comparisonsByTerm: comparisons,
    queries: queries.map((query) => ({
      provider: query.provider,
      term: query.term,
      ok: query.ok,
      skipped: query.skipped,
      status: query.status,
      latencyMs: query.latencyMs,
      resultCount: query.resultCount,
      errorCode: query.errorCode,
      errorMessage: query.errorMessage,
      url: query.url,
      sample: query.tracks.slice(0, 5).map((track) => ({
        title: track.title ?? null,
        artist: track.artist ?? null,
        hasPreview: Boolean(track.previewUrl),
      })),
    })),
  }

  if (options.deezerPlaylistId) {
    const playlistResult = await fetchDeezerPlaylistTracks(options.deezerPlaylistId, options)
    report.playlistValidation = summarizePlaylistValidation(playlistResult)
  }

  const outputPath = buildOutputPath(options.out)
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), "utf-8")

  if (options.json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  console.log("provider=deezer-probe-v2")
  for (const provider of providers) {
    const summary = providerSummaries[provider]
    console.log(
      `${provider}: quality=${summary.qualityScore} usable=${summary.rates.usableRatePercent}% preview=${summary.rates.previewCoveragePercent}% unique=${summary.rates.uniquenessRatePercent}% p95=${summary.latencyMs.p95}ms ok=${summary.successfulQueries}/${summary.requestedTerms}`
    )
  }
  if (report.playlistValidation) {
    const playlistValidation = report.playlistValidation
    if (playlistValidation.ok) {
      console.log(
        `playlist(${playlistValidation.playlist.id}): quality=${playlistValidation.qualityScore} usable=${playlistValidation.rates.usableRatePercent}% preview=${playlistValidation.rates.previewCoveragePercent}% tracks=${playlistValidation.counts.rawCount}`
      )
    } else {
      console.log(
        `playlist(${options.deezerPlaylistId}): error=${playlistValidation.errorCode} status=${playlistValidation.status ?? "n/a"}`
      )
    }
  }
  console.log(`comparisons=${comparisons.length}`)
  console.log(`report=${outputPath}`)
}

main().catch((error) => {
  console.error("deezer-catalog-probe failed:", error)
  process.exit(1)
})
