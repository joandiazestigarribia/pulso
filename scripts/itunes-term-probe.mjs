function parseArgs(argv) {
  const options = {
    terms: [],
    genres: [],
    limit: 25,
    country: "AR",
    media: "music",
    entity: "song",
    top: 10,
    ranked: false,
    chartSize: 100,
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

    if (token === "--genre") {
      const value = argv[index + 1]
      if (value) {
        options.genres.push(value)
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

    if (token === "--genres") {
      const value = argv[index + 1]
      if (value) {
        options.genres.push(
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
      options.limit = Number.parseInt(argv[index + 1] ?? "25", 10)
      index += 1
      continue
    }

    if (token === "--country") {
      options.country = (argv[index + 1] ?? "AR").toUpperCase()
      index += 1
      continue
    }

    if (token === "--media") {
      options.media = argv[index + 1] ?? "music"
      index += 1
      continue
    }

    if (token === "--entity") {
      options.entity = argv[index + 1] ?? "song"
      index += 1
      continue
    }

    if (token === "--top") {
      options.top = Number.parseInt(argv[index + 1] ?? "10", 10)
      index += 1
      continue
    }

    if (token === "--ranked") {
      options.ranked = true
      continue
    }

    if (token === "--chart-size") {
      options.chartSize = Number.parseInt(argv[index + 1] ?? "100", 10)
      index += 1
      continue
    }

    if (token === "--json") {
      options.json = true
    }
  }

  if (options.genres.length === 0 && options.terms.length === 0) {
    options.genres = ["latin", "rock"]
  }

  if (!Number.isFinite(options.limit) || options.limit <= 0) {
    options.limit = 25
  }

  if (!Number.isFinite(options.top) || options.top <= 0) {
    options.top = 10
  }

  if (!Number.isFinite(options.chartSize) || options.chartSize <= 0) {
    options.chartSize = 100
  }

  options.chartSize = Math.min(options.chartSize, 100)

  return options
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function genreMatches(targetGenre, candidateGenre) {
  const target = normalize(targetGenre)
  const candidate = normalize(candidateGenre)
  if (target.length === 0 || candidate.length === 0) {
    return false
  }

  return candidate.includes(target) || target.includes(candidate)
}

function groupByPrimaryGenre(items) {
  const grouped = new Map()
  for (const item of items) {
    const key = item.primaryGenreName ?? "Unknown"
    grouped.set(key, (grouped.get(key) ?? 0) + 1)
  }

  return Array.from(grouped.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
}

async function fetchChartRankMap(country, chartSize) {
  const normalizedCountry = String(country ?? "AR").toLowerCase()
  const rssUrl = `https://rss.applemarketingtools.com/api/v2/${encodeURIComponent(normalizedCountry)}/music/most-played/100/songs.json`
  const rssResponse = await fetch(rssUrl, { cache: "no-store" })
  if (!rssResponse.ok) {
    return new Map()
  }

  const rssPayload = await rssResponse.json()
  const ids = (rssPayload?.feed?.results ?? [])
    .map((entry) => Number.parseInt(String(entry.id), 10))
    .filter((value) => Number.isInteger(value))
    .slice(0, chartSize)
  if (ids.length === 0) {
    return new Map()
  }

  const rankMap = new Map()
  const chunkSize = 50
  let absoluteRank = 1
  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize)
    const lookupUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(chunk.join(","))}&entity=song&country=${encodeURIComponent(country)}`
    const lookupResponse = await fetch(lookupUrl, { cache: "no-store" })
    if (!lookupResponse.ok) {
      absoluteRank += chunk.length
      continue
    }

    const lookupPayload = await lookupResponse.json()
    const results = Array.isArray(lookupPayload.results) ? lookupPayload.results : []
    for (const item of results) {
      if (item.wrapperType !== "track" || item.kind !== "song") {
        continue
      }

      const trackId = Number.parseInt(String(item.trackId), 10)
      if (Number.isInteger(trackId) && !rankMap.has(trackId)) {
        rankMap.set(trackId, absoluteRank)
      }
    }

    absoluteRank += chunk.length
  }

  return rankMap
}

async function probeQuery(term, options, expectedGenre, rankMap) {
  const url = new URL("https://itunes.apple.com/search")
  url.searchParams.set("media", options.media)
  url.searchParams.set("entity", options.entity)
  url.searchParams.set("limit", String(options.limit))
  url.searchParams.set("country", options.country)
  url.searchParams.set("term", term)

  const response = await fetch(url.toString(), { cache: "no-store" })
  if (!response.ok) {
    return {
      term,
      ok: false,
      status: response.status,
      resultCount: 0,
      sample: [],
      url: url.toString(),
    }
  }

  const payload = await response.json()
  const results = Array.isArray(payload.results) ? payload.results : []
  const filtered = expectedGenre
    ? results.filter((item) => genreMatches(expectedGenre, item.primaryGenreName))
    : results
  const ordered = options.ranked
    ? [...filtered].sort((left, right) => {
        const leftRank = rankMap.get(Number.parseInt(String(left.trackId), 10))
        const rightRank = rankMap.get(Number.parseInt(String(right.trackId), 10))
        const leftValue = typeof leftRank === "number" ? leftRank : Number.POSITIVE_INFINITY
        const rightValue = typeof rightRank === "number" ? rightRank : Number.POSITIVE_INFINITY
        return leftValue - rightValue
      })
    : filtered
  const sample = filtered.slice(0, options.top).map((item) => ({
    trackName: item.trackName ?? null,
    artistName: item.artistName ?? null,
    primaryGenreName: item.primaryGenreName ?? null,
    releaseDate: item.releaseDate ?? null,
    previewUrl: item.previewUrl ?? null,
    chartRank: rankMap.get(Number.parseInt(String(item.trackId), 10)) ?? null,
  }))
  const rankedSample = ordered.slice(0, options.top).map((item) => ({
    trackName: item.trackName ?? null,
    artistName: item.artistName ?? null,
    primaryGenreName: item.primaryGenreName ?? null,
    releaseDate: item.releaseDate ?? null,
    previewUrl: item.previewUrl ?? null,
    chartRank: rankMap.get(Number.parseInt(String(item.trackId), 10)) ?? null,
  }))
  const chartMatchedCount = ordered.reduce((count, item) => {
    const trackId = Number.parseInt(String(item.trackId), 10)
    return Number.isInteger(trackId) && rankMap.has(trackId) ? count + 1 : count
  }, 0)

  return {
    term,
    expectedGenre: expectedGenre ?? null,
    ok: true,
    status: response.status,
    resultCount: Number.isInteger(payload.resultCount) ? payload.resultCount : results.length,
    matchedCount: filtered.length,
    chartMatchedCount,
    genreBreakdown: groupByPrimaryGenre(results),
    sample: options.ranked ? rankedSample : sample,
    url: url.toString(),
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const reports = []
  const rankMap = options.ranked ? await fetchChartRankMap(options.country, options.chartSize) : new Map()

  if (options.genres.length > 0 && options.terms.length > 0) {
    for (const term of options.terms) {
      for (const genre of options.genres) {
        reports.push(await probeQuery(term, options, genre, rankMap))
      }
    }
  } else if (options.genres.length > 0) {
    for (const genre of options.genres) {
      reports.push(await probeQuery(genre, options, genre, rankMap))
    }
  } else {
    for (const term of options.terms) {
      reports.push(await probeQuery(term, options, null, rankMap))
    }
  }

  if (options.json) {
    console.log(JSON.stringify({ options, reports }, null, 2))
    return
  }

  for (const report of reports) {
    const label = report.expectedGenre
      ? `term="${report.term}" genre="${report.expectedGenre}"`
      : `term="${report.term}"`
    const matched =
      typeof report.matchedCount === "number" ? ` matchedByGenre=${report.matchedCount}` : ""
    const ranked =
      options.ranked && typeof report.chartMatchedCount === "number"
        ? ` chartMatched=${report.chartMatchedCount}`
        : ""
    console.log(`${label} status=${report.status} ok=${report.ok} results=${report.resultCount}${matched}${ranked}`)
    console.log(`url=${report.url}`)
    if (Array.isArray(report.genreBreakdown) && report.genreBreakdown.length > 0) {
      const topGenres = report.genreBreakdown
        .slice(0, 5)
        .map((entry) => `${entry.genre}:${entry.count}`)
        .join(", ")
      console.log(`topGenres=${topGenres}`)
    }
    report.sample.forEach((entry, index) => {
      const previewTag = entry.previewUrl ? "preview" : "no-preview"
      const rankTag = typeof entry.chartRank === "number" ? ` | chart#${entry.chartRank}` : ""
      console.log(
        `${index + 1}. ${entry.trackName ?? "Unknown"} - ${entry.artistName ?? "Unknown"} | ${entry.primaryGenreName ?? "Unknown"} | ${previewTag}${rankTag}`
      )
    })
    console.log("")
  }
}

main().catch((error) => {
  console.error("itunes-term-probe failed:", error)
  process.exit(1)
})
