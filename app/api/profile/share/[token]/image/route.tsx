import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"
import { NextResponse } from "next/server"
import { getPublicProfileShare } from "@/lib/profile-share"

interface ShareImageRouteContext {
  params: Promise<{
    token: string
  }>
}

const EQUALIZER_BAR_COUNT = 64
const EQUALIZER_BAR_HEIGHTS = Array.from({ length: EQUALIZER_BAR_COUNT }, (_, index) => {
  const t = index / (EQUALIZER_BAR_COUNT - 1)
  const wave = Math.sin(t * Math.PI * 3.4) * 0.5 + Math.sin(t * Math.PI * 8.3 + 1.2) * 0.32
  return Math.round(10 + Math.abs(wave) * 42)
})

function wrapLines(text: string, maxCharsPerLine: number, maxLines: number, truncate: boolean): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""
  let wordIndex = 0

  while (wordIndex < words.length && lines.length < maxLines) {
    const word = words[wordIndex]
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current)
      current = ""
      continue
    }

    current = candidate
    wordIndex += 1
  }

  if (current && lines.length < maxLines) {
    lines.push(current)
  }

  if (truncate && wordIndex < words.length && lines.length > 0) {
    lines[lines.length - 1] = `${lines[lines.length - 1]}...`
  }

  return lines
}

function getTagline(description: string): string {
  const match = description.match(/^[^.!?]+[.!?]/)
  return (match ? match[0] : description).trim()
}

const CHARACTER_CONTENT_HEIGHT_RATIO: Record<string, number> = {
  "chill_oracle_character_asset resize.png": 0.935,
  "hyperpop_pilot_character_asset resize.png": 0.925,
  "lo_fi_alchemist_character_asset resize.png": 0.937,
  "neon_nomad_character_asset resize.png": 0.937,
  "ranger_character_asset resize.png": 0.938,
  "retro_scout_character_asset resize.png": 0.966,
  "synth_captain_character_asset resize.png": 0.944,
  "vaporwave_druid_character_asset resize.png": 0.941,
  "metal_character.png": 0.602,
  "jester_character.png": 0.602,
  "pop_paladin_character.png": 0.57,
  "pop_color_character.png": 0.83,
}
const DEFAULT_CONTENT_HEIGHT_RATIO = 0.94
const TARGET_CONTENT_HEIGHT_PX = 300

function readPngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24 || buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
    return null
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

interface PersonaImage {
  dataUrl: string
  displayWidth: number
  displayHeight: number
}

async function getPersonaImage(assetFile: string, origin: string): Promise<PersonaImage | null> {
  try {
    const imageUrl = new URL(`/images/characters/${encodeURIComponent(assetFile)}`, origin)
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return null
    }

    const contentType = response.headers.get("content-type") ?? "image/png"
    const buffer = Buffer.from(await response.arrayBuffer())
    const dimensions = readPngDimensions(buffer)
    const contentRatio = CHARACTER_CONTENT_HEIGHT_RATIO[assetFile] ?? DEFAULT_CONTENT_HEIGHT_RATIO
    const displayHeight = TARGET_CONTENT_HEIGHT_PX / contentRatio
    const nativeAspect = dimensions ? dimensions.width / dimensions.height : 0.6

    return {
      dataUrl: `data:${contentType};base64,${buffer.toString("base64")}`,
      displayHeight,
      displayWidth: displayHeight * nativeAspect,
    }
  } catch {
    return null
  }
}

async function loadFont(fileName: string): Promise<Buffer> {
  return readFile(path.join(process.cwd(), "assets", "fonts", fileName))
}

export async function GET(request: Request, { params }: ShareImageRouteContext) {
  const { token } = await params
  const share = await getPublicProfileShare(token)
  if (!share) {
    return NextResponse.json(
      {
        ok: false,
        code: "NOT_FOUND",
        message: "Perfil sonoro no disponible.",
      },
      { status: 404 }
    )
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
  const [personaImage, outfitRegular, outfitBold] = await Promise.all([
    getPersonaImage(share.personaAssetFile, origin),
    loadFont("Outfit-500.woff"),
    loadFont("Outfit-800.woff"),
  ])
  const nameLines = wrapLines(share.personaName.toUpperCase(), 14, 2, false)
  const taglineLines = wrapLines(getTagline(share.description), 42, 4, true)

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#080B1A",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: 32,
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#0F1638",
            border: "4px solid rgba(0,240,255,0.4)",
            borderRadius: 34,
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
            color: "#EAF7FF",
            display: "flex",
            flexDirection: "column",
            fontFamily: "Outfit",
            height: 566,
            overflow: "hidden",
            padding: "40px 48px",
            position: "relative",
            width: 1136,
          }}
        >
          <div
            style={{
              background: "rgba(0,240,255,0.1)",
              borderRadius: 999,
              height: 520,
              position: "absolute",
              right: -180,
              top: -300,
              width: 520,
            }}
          />

          <div
            style={{
              alignItems: "flex-end",
              bottom: 0,
              display: "flex",
              gap: 6,
              height: 120,
              left: 0,
              opacity: 0.16,
              padding: "0 48px 0",
              position: "absolute",
              width: 1136,
            }}
          >
            {EQUALIZER_BAR_HEIGHTS.map((height, index) => (
              <div
                key={index}
                style={{
                  background: index % 2 === 0 ? "#00F0FF" : "#FF43F8",
                  borderRadius: 3,
                  display: "flex",
                  height,
                  width: 8,
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
            <div style={{ display: "flex", width: 10, height: 10, borderRadius: 999, background: "#FFE600" }} />
            <div
              style={{
                display: "flex",
                color: "#7BE3FF",
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 7,
                marginLeft: 12,
              }}
            >
              PULSO
            </div>
          </div>

          <div style={{ display: "flex", flex: 1, alignItems: "center", position: "relative" }}>
            <div
              style={{
                alignItems: "center",
                background: "#121A40",
                borderRadius: 999,
                boxShadow:
                  "0 0 0 3px rgba(0,240,255,0.55), 0 0 0 9px rgba(8,11,26,0.9), 0 0 60px rgba(0,240,255,0.3), 0 0 100px rgba(255,67,248,0.22)",
                display: "flex",
                flexShrink: 0,
                height: 340,
                justifyContent: "center",
                overflow: "hidden",
                width: 340,
              }}
            >
              {personaImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  src={personaImage.dataUrl}
                  style={{
                    height: personaImage.displayHeight,
                    width: personaImage.displayWidth,
                  }}
                />
              ) : null}
            </div>

            <div
              style={{
                alignItems: "flex-start",
                display: "flex",
                flexDirection: "column",
                marginLeft: 64,
                minWidth: 0,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                {nameLines.map((line, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      color: "#FFE600",
                      fontSize: 68,
                      fontWeight: 800,
                      lineHeight: 1.08,
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>

              {share.sharerName ? (
                <div
                  style={{
                    display: "flex",
                    color: "#080B1A",
                    background: "#7BE3FF",
                    borderRadius: 999,
                    fontSize: 21,
                    fontWeight: 800,
                    marginTop: 22,
                    padding: "6px 18px",
                  }}
                >
                  {`PERFIL DE ${share.sharerName.toUpperCase()}`}
                </div>
              ) : null}

              <div style={{ display: "flex", flexDirection: "column", marginTop: share.sharerName ? 24 : 28 }}>
                {taglineLines.map((line, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      color: "#D8EBFF",
                      fontSize: 26,
                      fontWeight: 500,
                      lineHeight: 1.4,
                      marginTop: index === 0 ? 0 : 2,
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", position: "relative" }}>
            <div style={{ display: "flex", color: "#7BE3FF", fontSize: 21, fontWeight: 800, letterSpacing: 1 }}>
              www.pulsoapp.ar
            </div>
          </div>
        </div>
      </div>
    ),
    {
      height: 630,
      width: 1200,
      fonts: [
        { name: "Outfit", data: outfitRegular, weight: 500, style: "normal" },
        { name: "Outfit", data: outfitBold, weight: 800, style: "normal" },
      ],
    }
  )
}
