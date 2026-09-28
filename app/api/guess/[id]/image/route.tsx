import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"
import { NextResponse } from "next/server"
import { getPublicPlaylistInfo } from "@/lib/guess-store"

interface ImageRouteContext {
  params: Promise<{ id: string }>
}

const EQUALIZER_BAR_COUNT = 64
const EQUALIZER_BAR_HEIGHTS = Array.from({ length: EQUALIZER_BAR_COUNT }, (_, index) => {
  const t = index / (EQUALIZER_BAR_COUNT - 1)
  const wave = Math.sin(t * Math.PI * 3.4) * 0.5 + Math.sin(t * Math.PI * 8.3 + 1.2) * 0.32
  return Math.round(10 + Math.abs(wave) * 42)
})

function wrapLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    if (lines.length >= maxLines) {
      break
    }

    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current)
      current = word
      continue
    }

    current = candidate
  }

  if (current && lines.length < maxLines) {
    lines.push(current)
  }

  return lines
}

async function loadFont(fileName: string): Promise<Buffer> {
  return readFile(path.join(process.cwd(), "assets", "fonts", fileName))
}

export async function GET(_request: Request, { params }: ImageRouteContext) {
  const { id } = await params
  const playlist = await getPublicPlaylistInfo(id)
  if (!playlist) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND", message: "Lista no disponible." }, { status: 404 })
  }

  const [outfitRegular, outfitBold] = await Promise.all([loadFont("Outfit-500.woff"), loadFont("Outfit-800.woff")])
  const titleLines = wrapLines(`¿CUÁNTO CONOCÉS A ${playlist.title.toUpperCase()}?`, 20, 3)

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
              background: "rgba(255,67,248,0.12)",
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
                  background: index % 2 === 0 ? "#00F0FF" : "#FFE600",
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

          <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", position: "relative" }}>
            <div
              style={{
                display: "flex",
                color: "#FF43F8",
                background: "rgba(255,67,248,0.14)",
                borderRadius: 999,
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 2,
                padding: "8px 20px",
                marginBottom: 24,
                alignSelf: "flex-start",
              }}
            >
              ¿CUÁNTO CONOCÉS A TU AMIGO?
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {titleLines.map((line, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    color: "#FFE600",
                    fontSize: 62,
                    fontWeight: 800,
                    lineHeight: 1.1,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", color: "#D8EBFF", fontSize: 26, fontWeight: 500, marginTop: 24 }}>
              {`Jugá las ${playlist.roundCount} rondas y competí por el primer puesto del ranking.`}
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
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      },
      fonts: [
        { name: "Outfit", data: outfitRegular, weight: 500, style: "normal" },
        { name: "Outfit", data: outfitBold, weight: 800, style: "normal" },
      ],
    }
  )
}
