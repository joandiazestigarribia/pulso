import path from "node:path"
import { pathToFileURL } from "node:url"

function parseArgs(argv) {
  const options = {
    bucket: null,
    source: "itunes",
    limit: 200,
    top: 50,
    json: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === "--bucket") {
      options.bucket = argv[index + 1] ?? null
      index += 1
      continue
    }

    if (token === "--source") {
      options.source = argv[index + 1] ?? "itunes"
      index += 1
      continue
    }

    if (token === "--limit") {
      options.limit = Number.parseInt(argv[index + 1] ?? "200", 10)
      index += 1
      continue
    }

    if (token === "--top") {
      options.top = Number.parseInt(argv[index + 1] ?? "50", 10)
      index += 1
      continue
    }

    if (token === "--json") {
      options.json = true
    }
  }

  if (!Number.isFinite(options.limit) || options.limit <= 0) {
    options.limit = 200
  }

  if (!Number.isFinite(options.top) || options.top <= 0) {
    options.top = 50
  }

  if (!["itunes", "spotify", "both"].includes(options.source)) {
    options.source = "itunes"
  }

  return options
}

function trackLabel(track) {
  return `${track.name} - ${track.artist}`
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const spotifyModulePath = path.resolve(process.cwd(), ".tmp-test/lib/spotify.js")
  const spotifyModuleUrl = pathToFileURL(spotifyModulePath).href
  const { fetchItunesBattleTracks, fetchSpotifyBattleTracks } = await import(spotifyModuleUrl)

  let tracks = []
  if (options.source === "itunes") {
    tracks = await fetchItunesBattleTracks(options.limit)
  } else if (options.source === "spotify") {
    tracks = await fetchSpotifyBattleTracks(options.limit)
  } else {
    const [itunesTracks, spotifyTracks] = await Promise.all([
      fetchItunesBattleTracks(options.limit),
      fetchSpotifyBattleTracks(options.limit),
    ])
    tracks = [...itunesTracks, ...spotifyTracks]
  }

  const filtered = options.bucket
    ? tracks.filter((track) => (track.catalogBucket ?? "general") === options.bucket)
    : tracks

  const rows = filtered.slice(0, options.top).map((track) => ({
    id: track.id,
    bucket: track.catalogBucket ?? "general",
    name: track.name,
    artist: track.artist,
    year: track.year,
    preview: Boolean(track.previewUrl),
  }))

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          source: options.source,
          bucket: options.bucket,
          totalFetched: tracks.length,
          totalMatched: filtered.length,
          sampleSize: rows.length,
          sample: rows,
        },
        null,
        2
      )
    )
    return
  }

  console.log(`source=${options.source}`)
  console.log(`bucket=${options.bucket ?? "all"}`)
  console.log(`totalFetched=${tracks.length}`)
  console.log(`totalMatched=${filtered.length}`)
  console.log(`showing=${rows.length}`)
  console.log("")

  rows.forEach((row, index) => {
    const previewTag = row.preview ? "preview" : "no-preview"
    console.log(`${index + 1}. [${row.bucket}] ${trackLabel(row)} (${row.year}) - ${previewTag}`)
  })
}

main().catch((error) => {
  console.error("catalog-preview failed:", error)
  process.exit(1)
})
