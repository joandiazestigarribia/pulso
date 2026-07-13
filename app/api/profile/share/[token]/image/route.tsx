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

async function getPersonaImageData(assetFile: string): Promise<string | null> {
  try {
    const imagePath = path.join(process.cwd(), "public", "images", "characters", assetFile)
    const image = await readFile(imagePath)
    return `data:image/png;base64,${image.toString("base64")}`
  } catch {
    return null
  }
}

export async function GET(_request: Request, { params }: ShareImageRouteContext) {
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

  const personaImage = await getPersonaImageData(share.personaAssetFile)
  const genreText = (share.dominantGenres.length > 0 ? share.dominantGenres.slice(0, 3) : ["Perfil mixto"]).join(" / ")

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
            border: "4px solid rgba(0,240,255,0.45)",
            borderRadius: 34,
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
            color: "#EAF7FF",
            display: "flex",
            height: 566,
            overflow: "hidden",
            padding: 46,
            position: "relative",
            width: 1136,
          }}
        >
          <div
            style={{
              background: "rgba(0,240,255,0.13)",
              borderRadius: 999,
              height: 600,
              left: -120,
              position: "absolute",
              top: -240,
              width: 600,
            }}
          />
          <div
            style={{
              background: "rgba(255,67,248,0.16)",
              borderRadius: 999,
              height: 560,
              position: "absolute",
              right: -180,
              top: -250,
              width: 560,
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", position: "relative", width: 340 }}>
            <div style={{ color: "#7BE3FF", fontSize: 30, fontWeight: 900, letterSpacing: 6 }}>PULSO</div>
            <div style={{ color: "#FFFFFF", fontSize: 54, fontWeight: 900, lineHeight: 1.02, marginTop: 12 }}>
              MI PERFIL SONORO
            </div>
            <div
              style={{
                alignItems: "center",
                background: "#121A40",
                border: "2px solid rgba(255,67,248,0.45)",
                borderRadius: 32,
                display: "flex",
                height: 320,
                justifyContent: "center",
                marginTop: 34,
                width: 320,
              }}
            >
              {personaImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  src={personaImage}
                  style={{
                    height: 286,
                    objectFit: "contain",
                    width: 268,
                  }}
                />
              ) : null}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              marginLeft: 50,
              paddingTop: 158,
              position: "relative",
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: "#111739",
                border: "2px solid rgba(255,67,248,0.45)",
                borderRadius: 28,
                display: "flex",
                height: 108,
                justifyContent: "center",
                padding: "0 28px",
                width: "100%",
              }}
            >
              <div
                style={{
                  color: "#FFE600",
                  fontSize: 48,
                  fontWeight: 900,
                  lineHeight: 1,
                  textAlign: "center",
                  textTransform: "uppercase",
                }}
              >
                {share.personaName}
              </div>
            </div>

            <div style={{ color: "#D8EBFF", fontSize: 34, fontWeight: 800, marginTop: 48 }}>
              Descubri mi card completa en Pulso
            </div>
            <div
              style={{
                color: "#7BE3FF",
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: 3,
                marginTop: 32,
                textTransform: "uppercase",
              }}
            >
              {genreText}
            </div>

            <div style={{ alignItems: "center", display: "flex", marginTop: 38 }}>
              <div
                style={{
                  alignItems: "center",
                  background: "rgba(0,240,255,0.16)",
                  border: "1px solid rgba(0,240,255,0.35)",
                  borderRadius: 18,
                  color: "#FFFFFF",
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 900,
                  height: 54,
                  justifyContent: "center",
                  padding: "0 26px",
                }}
              >
                pulsoapp.ar/profile/share
              </div>
              <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 22, fontWeight: 800, marginLeft: "auto" }}>
                {share.generatedFromVotes} VOTOS ANALIZADOS
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      height: 630,
      width: 1200,
    }
  )
}
