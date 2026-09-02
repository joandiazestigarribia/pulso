import React from "react"
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"
import { Flame, Lock, Play, Sparkles, Swords } from "lucide-react"
import { demoTracks, profileGenres, type DemoFormat, type DemoTrack } from "./demo-data"

interface PulsoLaunchDemoProps {
  format?: DemoFormat
}

type SceneVariant = "home" | "battle" | "music-dna"

const C = {
  cyan: "#00f0ff",
  cyanSoft: "#7be3ff",
  pink: "#ff43f8",
  pinkSoft: "#ffb5fb",
  yellow: "#ffe600",
  green: "#00ff66",
  ink: "#080b1a",
  panel: "#111739",
  text: "#eaf7ff",
  muted: "#d8e9ff",
}

const secondTrack: DemoTrack = {
  label: "Canci\u00f3n B",
  title: "Blinding Lights",
  artist: "The Weeknd",
  albumImage: "images/album-blinding-lights.jpg",
  genre: "Synthwave",
  year: "2019",
  elo: 1480,
  accent: C.pinkSoft,
}

function opacityInOut(frame: number, inStart: number, inEnd: number, outStart: number, outEnd: number): number {
  const fadeIn = interpolate(frame, [inStart, inEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  const fadeOut = interpolate(frame, [outStart, outEnd], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  return fadeIn * fadeOut
}

function FontFace() {
  return (
    <style>
      {`
        @font-face {
          font-family: PulsoSans;
          src: url('${staticFile("demo/fonts/pulso-font-a.woff2")}') format('woff2');
          font-weight: 100 900;
        }
        @font-face {
          font-family: PulsoMono;
          src: url('${staticFile("demo/fonts/pulso-font-b.woff2")}') format('woff2');
          font-weight: 100 900;
        }
      `}
    </style>
  )
}

function SceneBackground({ variant }: { variant: SceneVariant }) {
  const frame = useCurrentFrame()
  const image =
    variant === "home"
      ? "images/home/background-home.jpg"
      : variant === "battle"
        ? "images/battle/neon_campfire_background.png"
        : "images/music-dna/background-music-dna.png"
  const drift = Math.sin(frame / 90) * 9

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, overflow: "hidden" }}>
      <Img
        src={staticFile(image)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: variant === "battle" ? 0.84 : 0.74,
          transform: `scale(1.08) translate(${drift}px, ${-drift / 2}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 25% 15%, rgba(0,240,255,0.24), transparent 34%), radial-gradient(circle at 82% 12%, rgba(255,67,248,0.25), transparent 36%), linear-gradient(180deg, rgba(8,11,26,0.62), rgba(8,11,26,0.96))",
        }}
      />
    </AbsoluteFill>
  )
}

function Logo({ compact = false, campfire = true }: { compact?: boolean; campfire?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 10 : 14 }}>
      <div
        style={{
          width: compact ? 36 : 48,
          height: compact ? 36 : 48,
          borderRadius: compact ? 12 : 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(130deg, ${C.cyan}, ${C.pink}, ${C.yellow})`,
          boxShadow: "0 0 18px rgba(0,240,255,0.55)",
        }}
      >
        <Flame size={compact ? 20 : 26} color="#0b1129" strokeWidth={2.8} />
      </div>
      <div
        style={{
          fontSize: compact ? 24 : 31,
          lineHeight: 1,
          fontWeight: 950,
          letterSpacing: 0,
          textTransform: "uppercase",
          background: `linear-gradient(90deg, ${C.cyan}, ${C.pink}, ${C.yellow})`,
          WebkitBackgroundClip: "text",
          color: "transparent",
          whiteSpace: "nowrap",
        }}
      >
        {campfire ? "Pulso Campfire" : "Pulso"}
      </div>
    </div>
  )
}

function Shell({ children, format }: { children: React.ReactNode; format: DemoFormat }) {
  const isVertical = format === "vertical"
  return (
    <AbsoluteFill
      style={{
        padding: isVertical ? "64px 54px" : "70px 140px",
        color: C.text,
        fontFamily: "PulsoSans, Outfit, Arial, sans-serif",
      }}
    >
      {children}
    </AbsoluteFill>
  )
}

function Headline({
  eyebrow,
  children,
  lines,
  format,
  align = "left",
}: {
  eyebrow?: React.ReactNode
  children?: React.ReactNode
  lines?: readonly string[]
  format: DemoFormat
  align?: "left" | "center"
}) {
  const isVertical = format === "vertical"
  return (
    <div style={{ textAlign: align }}>
      {eyebrow ? (
        <div
          style={{
            display: "inline-flex",
            borderRadius: 999,
            border: "1px solid rgba(0,240,255,0.34)",
            background: "rgba(0,240,255,0.12)",
            color: C.cyanSoft,
            padding: isVertical ? "10px 16px" : "8px 14px",
            fontFamily: "PulsoMono, PulsoSans, sans-serif",
            fontSize: isVertical ? 18 : 13,
            fontWeight: 950,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <div
        style={{
          marginTop: eyebrow ? (isVertical ? 28 : 20) : 0,
          maxWidth: isVertical ? 972 : 900,
          fontSize: isVertical ? 78 : 72,
          lineHeight: 0.98,
          fontWeight: 1000,
          letterSpacing: 0,
          textTransform: "uppercase",
          background: `linear-gradient(90deg, ${C.cyan}, #c7bfff, ${C.pink}, #ff9aa8, ${C.yellow})`,
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        {lines
          ? lines.map((line) => (
              <span key={line} style={{ display: "block", whiteSpace: "nowrap" }}>
                {line}
              </span>
            ))
          : children}
      </div>
    </div>
  )
}

function PhoneFrame({
  children,
  format,
  large = false,
  verticalHeight,
}: {
  children: React.ReactNode
  format: DemoFormat
  large?: boolean
  verticalHeight?: number
}) {
  const isVertical = format === "vertical"
  return (
    <div
      style={{
        width: isVertical ? (large ? 900 : 820) : large ? 440 : 370,
        borderRadius: isVertical ? 52 : 42,
        padding: isVertical ? 18 : 14,
        background: "linear-gradient(145deg, rgba(255,255,255,0.24), rgba(255,255,255,0.05))",
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow: "0 32px 88px rgba(0,0,0,0.45), 0 0 46px rgba(0,240,255,0.18)",
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          height: isVertical ? (verticalHeight ?? (large ? 1120 : 1040)) : large ? 720 : 610,
          borderRadius: isVertical ? 38 : 30,
          background: "rgba(8,11,26,0.95)",
          border: "1px solid rgba(255,255,255,0.14)",
        }}
      >
        {children}
      </div>
    </div>
  )
}

function MiniHeader({ active }: { active: "home" | "battle" | "profile" }) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        height: 68,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 22px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(17,23,57,0.82)",
      }}
    >
      <Logo compact campfire={false} />
      <div
        style={{
          borderRadius: 999,
          background: active === "battle" ? "rgba(255,230,0,0.18)" : "rgba(0,240,255,0.16)",
          color: active === "battle" ? C.yellow : C.cyanSoft,
          padding: "8px 12px",
          fontSize: 12,
          fontWeight: 950,
          textTransform: "uppercase",
        }}
      >
        {active === "battle" ? "1 vs 1" : active === "profile" ? "Perfil" : "Inicio"}
      </div>
    </div>
  )
}

function ProductHome({ format }: { format: DemoFormat }) {
  const isVertical = format === "vertical"
  return (
    <PhoneFrame format={format} large verticalHeight={1180}>
      <SceneBackground variant="home" />
      <MiniHeader active="home" />
      <div style={{ position: "relative", padding: isVertical ? "68px 44px" : "44px 30px" }}>
        <div
          style={{
            fontSize: isVertical ? 64 : 43,
            lineHeight: 0.95,
            fontWeight: 1000,
            textTransform: "uppercase",
            background: `linear-gradient(90deg, ${C.cyan}, ${C.pink}, ${C.yellow})`,
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Descubri tu pulso musical
        </div>
        <div style={{ marginTop: 18, color: C.muted, fontSize: isVertical ? 25 : 17, lineHeight: 1.38, fontWeight: 760 }}>
          Elegi canciones en versus y desbloquea tu identidad sonora.
        </div>
        <div style={{ marginTop: 30 }}>
          <StatusStrip format={format} icon={<Swords size={isVertical ? 28 : 17} />}>
            Primer versus listo
          </StatusStrip>
        </div>
        <div style={{ marginTop: isVertical ? 50 : 34, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: isVertical ? 20 : 7 }}>
          <CompactTrackCard track={demoTracks[0]} scale={isVertical ? 1.68 : 0.84} />
          <VsBadge scale={isVertical ? 1.45 : 0.84} />
          <CompactTrackCard track={secondTrack} scale={isVertical ? 1.68 : 0.84} />
        </div>
      </div>
    </PhoneFrame>
  )
}

function StatusStrip({ children, icon, format }: { children: React.ReactNode; icon: React.ReactNode; format: DemoFormat }) {
  const isVertical = format === "vertical"
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: isVertical ? 12 : 9,
        borderRadius: 14,
        border: "1px solid rgba(0,240,255,0.32)",
        background: "rgba(0,240,255,0.13)",
        color: C.cyanSoft,
        padding: isVertical ? "15px 20px" : "12px 16px",
        fontSize: isVertical ? 20 : 13,
        fontWeight: 1000,
        letterSpacing: 1.1,
        textTransform: "uppercase",
        boxShadow: "0 14px 28px rgba(0,0,0,0.34)",
      }}
    >
      {icon}
      {children}
    </div>
  )
}

function CompactTrackCard({ track, scale = 1, selected = false }: { track: DemoTrack; scale?: number; selected?: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        width: 168 * scale,
        borderRadius: 18 * scale,
        border: `1.5px solid ${selected ? C.yellow : track.accent}`,
        background: "rgba(0,0,0,0.46)",
        padding: 8 * scale,
        boxShadow: selected ? `0 0 ${28 * scale}px rgba(255,230,0,0.42)` : "0 0 18px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden", borderRadius: 12 * scale, border: "1px solid rgba(255,255,255,0.22)" }}>
        <Img src={staticFile(track.albumImage)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(58%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.78))" }} />
      </div>
      <div
        style={{
          marginTop: 8 * scale,
          fontSize: 10 * scale,
          lineHeight: 1,
          fontWeight: 950,
          textTransform: "uppercase",
          color: "white",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {track.title}
      </div>
      <div style={{ marginTop: 4 * scale, color: C.muted, fontSize: 9 * scale, fontWeight: 800 }}>{track.artist}</div>
      <ReviewControl scale={scale} />
      <div
        style={{
          marginTop: 8 * scale,
          borderRadius: 10 * scale,
          background: selected ? C.yellow : track.accent,
          color: "#07101f",
          padding: `${7 * scale}px 0`,
          textAlign: "center",
          fontSize: 9 * scale,
          fontWeight: 950,
          letterSpacing: 1.5 * scale,
          textTransform: "uppercase",
        }}
      >
        Elegir
      </div>
    </div>
  )
}

function ReviewControl({ scale = 1 }: { scale?: number }) {
  return (
    <div style={{ marginTop: 8 * scale, display: "flex", height: 32 * scale, alignItems: "center", gap: 7 * scale }}>
      <div
        style={{
          width: 26 * scale,
          height: 26 * scale,
          borderRadius: 8 * scale,
          border: "1px solid rgba(255,255,255,0.24)",
          background: "rgba(0,0,0,0.45)",
          display: "grid",
          placeItems: "center",
          color: "white",
        }}
      >
        <Play size={12 * scale} fill="white" />
      </div>
      <div style={{ minWidth: 0, flex: 1, borderRadius: 8 * scale, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.38)", padding: `${4 * scale}px ${6 * scale}px` }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.74)", fontSize: 7 * scale, fontWeight: 950, letterSpacing: 0.7 * scale, textTransform: "uppercase" }}>
          <span>Revisar</span>
          <span>0:00 / 0:30</span>
        </div>
        <div style={{ marginTop: 3 * scale, height: 3 * scale, borderRadius: 999, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
          <div style={{ width: "18%", height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${C.cyan}, ${C.pink}, ${C.yellow})` }} />
        </div>
      </div>
    </div>
  )
}

function VsBadge({ scale = 1 }: { scale?: number }) {
  return (
    <div
      style={{
        width: 48 * scale,
        height: 48 * scale,
        borderRadius: 18 * scale,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(255,230,0,0.62)",
        background: "rgba(0,0,0,0.70)",
        color: C.yellow,
        fontSize: 20 * scale,
        fontWeight: 1000,
        boxShadow: "0 0 22px rgba(255,230,0,0.28)",
        transform: "rotate(6deg)",
      }}
    >
      VS
    </div>
  )
}

function IntroScene({ format }: { format: DemoFormat }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const isVertical = format === "vertical"
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 80 } })

  return (
    <AbsoluteFill>
      <SceneBackground variant="home" />
      <Shell format={format}>
        <div
          style={{
            height: "100%",
            display: "grid",
            gridTemplateColumns: isVertical ? "1fr" : "1.08fr 0.92fr",
            gap: isVertical ? 30 : 60,
            alignItems: "center",
            alignContent: "center",
            opacity: opacityInOut(frame, 0, 18, 146, 170),
          }}
        >
          <div style={{ transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)` }}>
            <Logo compact={isVertical} />
            <div style={{ height: isVertical ? 44 : 40 }} />
            <Headline
              format={format}
              lines={
                isVertical
                  ? ["Eleg\u00ed canciones.", "Descubr\u00ed tu", "Perfil Sonoro"]
                  : ["Eleg\u00ed canciones.", "Descubr\u00ed tu Perfil", "Sonoro"]
              }
            />
          </div>
          <div style={{ justifySelf: "center", transform: `scale(${interpolate(enter, [0, 1], [0.92, isVertical ? 1 : 0.96])}) rotate(${isVertical ? -1 : -1.2}deg)` }}>
            <ProductHome format={format} />
          </div>
        </div>
      </Shell>
    </AbsoluteFill>
  )
}

function TeaserScene({ format }: { format: DemoFormat }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const isVertical = format === "vertical"
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 82 } })

  return (
    <AbsoluteFill>
      <SceneBackground variant="music-dna" />
      <Shell format={format}>
        <div
          style={{
            height: "100%",
            display: "grid",
            gridTemplateColumns: isVertical ? "1fr" : "0.92fr 1.08fr",
            gap: isVertical ? 30 : 58,
            alignItems: "center",
            alignContent: "center",
            opacity: opacityInOut(frame, 0, 14, 58, 78),
          }}
        >
          <div style={{ transform: `translateY(${interpolate(enter, [0, 1], [22, 0])}px)` }}>
            <Logo compact={isVertical} />
            <div style={{ height: isVertical ? 42 : 38 }} />
            <Headline format={format} lines={["\u00bfQu\u00e9 dice tu m\u00fasica", "de vos?"]} />
            <div style={{ marginTop: 24, color: C.muted, fontSize: isVertical ? 29 : 22, lineHeight: 1.42, fontWeight: 760 }}>
              Pulso lo descubre a partir de tus versus.
            </div>
          </div>
          <div style={{ justifySelf: "center", transform: `scale(${interpolate(enter, [0, 1], [0.94, isVertical ? 0.92 : 0.98])})` }}>
            <ProfileMockup format={format} />
          </div>
        </div>
      </Shell>
    </AbsoluteFill>
  )
}

function BattleScene({ format }: { format: DemoFormat }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const isVertical = format === "vertical"
  const selected = frame > 102
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 84 } })

  return (
    <AbsoluteFill>
      <SceneBackground variant="battle" />
      <Shell format={format}>
        <div
          style={{
            height: "100%",
            display: "grid",
            gridTemplateColumns: isVertical ? "1fr" : "0.9fr 1.1fr",
            gap: isVertical ? 30 : 56,
            alignItems: "center",
            alignContent: "center",
            opacity: opacityInOut(frame, 0, 18, 176, 204),
          }}
        >
          <div>
            <Headline
              eyebrow="Paso 1"
              format={format}
              lines={isVertical ? ["Vot\u00e1 el tema que", "m\u00e1s te representa"] : ["Vot\u00e1 el tema que", "m\u00e1s te", "representa"]}
            />
            <div style={{ marginTop: 24, color: C.muted, fontSize: isVertical ? 29 : 22, lineHeight: 1.42, fontWeight: 760 }}>
              {"La app guarda cada elecci\u00f3n y suma se\u00f1ales para tu perfil."}
            </div>
          </div>
          <div style={{ justifySelf: "center", transform: `scale(${interpolate(enter, [0, 1], [0.95, 1])}) translateY(${interpolate(enter, [0, 1], [20, 0])}px)` }}>
            <BattleMockup format={format} selected={selected} />
          </div>
        </div>
      </Shell>
    </AbsoluteFill>
  )
}

function BattleMockup({ format, selected }: { format: DemoFormat; selected: boolean }) {
  const isVertical = format === "vertical"
  return (
    <PhoneFrame format={format} large verticalHeight={980}>
      <SceneBackground variant="battle" />
      <MiniHeader active="battle" />
      <div style={{ position: "relative", padding: isVertical ? "36px 34px" : "30px 24px" }}>
        <ProgressBar compact={isVertical} completed={7} total={20} />
        <div style={{ marginTop: isVertical ? 46 : 34, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: isVertical ? 18 : 11 }}>
          <BattleCard track={demoTracks[0]} format={format} selected={selected} />
          <VsBadge scale={isVertical ? 0.92 : 0.96} />
          <BattleCard track={secondTrack} format={format} selected={false} muted={selected} />
        </div>
      </div>
    </PhoneFrame>
  )
}

function ProgressBar({ compact, completed, total }: { compact: boolean; completed: number; total: number }) {
  return (
    <div
      style={{
        width: "100%",
        borderRadius: compact ? 22 : 17,
        border: "1px solid rgba(0,240,255,0.28)",
        background: "rgba(9,13,37,0.64)",
        padding: compact ? 18 : 13,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", color: "#c7dbf2", fontSize: compact ? 20 : 12, fontWeight: 950, letterSpacing: 1.7, textTransform: "uppercase" }}>
        <span>Perfil Sonoro</span>
        <span style={{ color: C.yellow }}>{completed}/{total} versus</span>
      </div>
      <div style={{ marginTop: 12, height: compact ? 14 : 8, borderRadius: 999, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
        <div style={{ width: `${(completed / total) * 100}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${C.cyan}, ${C.pink}, ${C.yellow})` }} />
      </div>
    </div>
  )
}

function BattleCard({ track, format, selected, muted = false }: { track: DemoTrack; format: DemoFormat; selected: boolean; muted?: boolean }) {
  const isVertical = format === "vertical"
  const width = isVertical ? 344 : 145

  return (
    <div
      style={{
        position: "relative",
        width,
        flexShrink: 0,
        borderRadius: isVertical ? 22 : 16,
        border: `2px solid ${selected ? C.yellow : track.accent}`,
        background: "rgba(0,0,0,0.50)",
        padding: isVertical ? 12 : 8,
        boxShadow: selected ? "0 0 34px rgba(255,230,0,0.52)" : `0 0 22px ${track.accent}55`,
        opacity: muted ? 0.42 : 1,
        transform: selected ? "scale(1.025)" : "scale(1)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: isVertical ? -19 : -13,
          left: track.label.endsWith("A") ? 18 : "auto",
          right: track.label.endsWith("A") ? "auto" : 18,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.34)",
          background: "rgba(0,0,0,0.72)",
          padding: isVertical ? "7px 13px" : "4px 9px",
          color: track.accent,
          fontSize: isVertical ? 13 : 9,
          fontWeight: 950,
          textTransform: "uppercase",
          transform: track.label.endsWith("A") ? "rotate(-5deg)" : "rotate(5deg)",
        }}
      >
        {track.label}
      </div>
      <div style={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden", borderRadius: isVertical ? 15 : 11, border: "1px solid rgba(255,255,255,0.25)" }}>
        <Img src={staticFile(track.albumImage)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: muted ? "grayscale(100%)" : "grayscale(22%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 42%, rgba(0,0,0,0.78))" }} />
        {selected ? (
          <div style={{ position: "absolute", top: 9, right: 9, borderRadius: 10, background: C.yellow, color: "#07101f", padding: isVertical ? "6px 9px" : "4px 7px", fontSize: isVertical ? 12 : 9, fontWeight: 950, textTransform: "uppercase" }}>
            Elegida
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: isVertical ? 12 : 7, minHeight: isVertical ? 40 : 28, fontSize: isVertical ? 20 : 12, lineHeight: 1.05, fontWeight: 1000, textTransform: "uppercase", color: "white" }}>{track.title}</div>
      <div style={{ marginTop: 5, color: C.muted, fontSize: isVertical ? 15 : 10, fontWeight: 850 }}>{track.artist}</div>
      <ReviewControl scale={isVertical ? 1.22 : 0.74} />
      <div
        style={{
          marginTop: isVertical ? 12 : 8,
          borderRadius: isVertical ? 12 : 9,
          background: selected ? C.yellow : track.accent,
          color: "#07101f",
          padding: isVertical ? "11px 0" : "7px 0",
          textAlign: "center",
          fontSize: isVertical ? 14 : 9,
          fontWeight: 950,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        Elegir
      </div>
    </div>
  )
}

function ProgressScene({ format }: { format: DemoFormat }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const isVertical = format === "vertical"
  const pop = spring({ frame, fps, config: { damping: 16, stiffness: 82 } })

  return (
    <AbsoluteFill>
      <SceneBackground variant="music-dna" />
      <Shell format={format}>
        <div
          style={{
            height: "100%",
            display: "grid",
            gridTemplateColumns: isVertical ? "1fr" : "1fr 0.92fr",
            gap: isVertical ? 34 : 58,
            alignItems: "center",
            alignContent: "center",
            opacity: opacityInOut(frame, 0, 18, 142, 168),
          }}
        >
          <div>
            <Headline eyebrow="Paso 2" format={format} lines={["Cada voto te acerca", "al Perfil Sonoro"]} />
          </div>
          <div style={{ transform: `scale(${interpolate(pop, [0, 1], [0.92, 1])})`, justifySelf: "center" }}>
            <UnlockCard format={format} />
          </div>
        </div>
      </Shell>
    </AbsoluteFill>
  )
}

function UnlockCard({ format }: { format: DemoFormat }) {
  const isVertical = format === "vertical"
  return (
    <div
      style={{
        width: isVertical ? 860 : 520,
        borderRadius: isVertical ? 34 : 26,
        border: "1px solid rgba(0,240,255,0.35)",
        background: "rgba(11,18,48,0.78)",
        padding: isVertical ? 42 : 34,
        boxShadow: "0 28px 72px rgba(0,0,0,0.48), 0 0 42px rgba(0,240,255,0.16)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: isVertical ? 74 : 56, height: isVertical ? 74 : 56, borderRadius: 20, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.42)", boxShadow: "inset 0 0 0 1px rgba(255,230,0,0.42)" }}>
          <Lock size={isVertical ? 34 : 25} color={C.yellow} />
        </div>
        <div>
          <div style={{ color: C.cyanSoft, fontSize: isVertical ? 23 : 14, fontWeight: 950, letterSpacing: 2.2, textTransform: "uppercase" }}>7/20 versus</div>
          <div style={{ marginTop: 6, color: "white", fontSize: isVertical ? 40 : 28, lineHeight: 1, fontWeight: 1000, textTransform: "uppercase" }}>Perfil bloqueado</div>
        </div>
      </div>
      <div style={{ marginTop: isVertical ? 34 : 26 }}>
        <ProgressBar compact={isVertical} completed={7} total={20} />
      </div>
      <div style={{ marginTop: 22, color: C.muted, fontSize: isVertical ? 26 : 16, lineHeight: 1.42, fontWeight: 760 }}>
        {"Segu\u00ed jugando hasta completar 20 versus. Pulso convierte tus elecciones en m\u00e9tricas musicales."}
      </div>
    </div>
  )
}

function ProfileScene({ format }: { format: DemoFormat }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const isVertical = format === "vertical"
  const enter = spring({ frame, fps, config: { damping: 17, stiffness: 82 } })

  return (
    <AbsoluteFill>
      <SceneBackground variant="music-dna" />
      <Shell format={format}>
        <div
          style={{
            height: "100%",
            display: "grid",
            gridTemplateColumns: isVertical ? "1fr" : "0.86fr 1.14fr",
            gap: isVertical ? 30 : 54,
            alignItems: "center",
            alignContent: "center",
            opacity: opacityInOut(frame, 0, 18, 184, 214),
          }}
        >
          <div>
            <Headline eyebrow="Perfil listo" format={format} lines={["Perfil Sonoro", "desbloqueado"]} />
            <div style={{ marginTop: 24, color: C.muted, fontSize: isVertical ? 29 : 22, lineHeight: 1.42, fontWeight: 760 }}>
              {"Energ\u00eda, g\u00e9neros y personalidad musical seg\u00fan tus decisiones."}
            </div>
          </div>
          <div style={{ transform: `translateY(${interpolate(enter, [0, 1], [22, 0])}px)`, justifySelf: "center" }}>
            <ProfileMockup format={format} />
          </div>
        </div>
      </Shell>
    </AbsoluteFill>
  )
}

function ProfileMockup({ format }: { format: DemoFormat }) {
  const isVertical = format === "vertical"
  return (
    <PhoneFrame format={format} large verticalHeight={1080}>
      <SceneBackground variant="music-dna" />
      <MiniHeader active="profile" />
      <div style={{ position: "relative", padding: isVertical ? "42px 34px" : "28px 24px" }}>
        <div style={{ borderRadius: 26, background: "rgba(24,11,44,0.58)", padding: isVertical ? 32 : 22, boxShadow: "0 0 32px rgba(255,67,248,0.14)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ color: C.pinkSoft, fontSize: isVertical ? 21 : 13, fontWeight: 950, letterSpacing: 2.4, textTransform: "uppercase" }}>Perfil Sonoro</div>
              <div style={{ marginTop: 6, color: "white", fontSize: isVertical ? 40 : 25, fontWeight: 1000, textTransform: "uppercase" }}>{"N\u00f3mada Ne\u00f3n"}</div>
            </div>
            <Sparkles size={isVertical ? 42 : 28} color={C.yellow} />
          </div>
          <div style={{ marginTop: isVertical ? 28 : 20, display: "grid", gap: isVertical ? 20 : 14 }}>
            <Metric label="Energia" value={76} compact={isVertical} />
            <Metric label="Mood" value={58} compact={isVertical} />
            <Metric label="Ritmo" value={82} compact={isVertical} />
          </div>
          <div style={{ marginTop: isVertical ? 28 : 20, display: "flex", gap: isVertical ? 13 : 8, flexWrap: "wrap" }}>
            {profileGenres.map((genre) => (
              <span key={genre} style={{ borderRadius: 999, background: "rgba(0,240,255,0.16)", color: C.cyanSoft, padding: isVertical ? "9px 14px" : "6px 10px", fontSize: isVertical ? 16 : 10, fontWeight: 950, textTransform: "uppercase" }}>
                {genre}
              </span>
            ))}
          </div>
        </div>
        <div style={{ marginTop: isVertical ? 28 : 20, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: isVertical ? 16 : 12, alignItems: "end" }}>
          {[
            "images/characters/neon_nomad_character_asset resize.png",
            "images/characters/synth_captain_character_asset resize.png",
            "images/characters/ranger_character_asset resize.png",
          ].map((asset) => (
            <div key={asset} style={{ borderRadius: 22, background: "rgba(9,13,37,0.54)", padding: isVertical ? 12 : 8, textAlign: "center" }}>
              <Img src={staticFile(asset)} style={{ width: "100%", height: isVertical ? 220 : 118, objectFit: "contain", filter: "drop-shadow(0 14px 16px rgba(0,0,0,0.48))" }} />
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  )
}

function Metric({ label, value, compact }: { label: string; value: number; compact: boolean }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", color: C.pinkSoft, fontSize: compact ? 18 : 11, fontWeight: 950, letterSpacing: 2, textTransform: "uppercase" }}>
        <span>{label}</span>
        <span style={{ color: C.yellow }}>{value}%</span>
      </div>
      <div style={{ marginTop: 8, height: compact ? 12 : 8, borderRadius: 999, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", borderRadius: 999, opacity: 0.74, background: `linear-gradient(90deg, ${C.cyan}, ${C.pink}, ${C.yellow})` }} />
      </div>
    </div>
  )
}

function FinalScene({ format }: { format: DemoFormat }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const isVertical = format === "vertical"
  const pop = spring({ frame, fps, config: { damping: 15, stiffness: 90 } })

  return (
    <AbsoluteFill>
      <SceneBackground variant="home" />
      <Shell format={format}>
        <div
          style={{
            height: "100%",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            opacity: interpolate(frame, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            transform: `scale(${interpolate(pop, [0, 1], [0.94, 1])})`,
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Logo compact={isVertical} />
            </div>
            <div
              style={{
                marginTop: isVertical ? 42 : 34,
                fontSize: isVertical ? 78 : 72,
                lineHeight: 0.98,
                fontWeight: 1000,
                letterSpacing: 0,
                textTransform: "uppercase",
                color: C.text,
              }}
            >
              <span style={{ display: "block" }}>Tu Perfil Sonoro</span>
              <span style={{ display: "block" }}>{"empieza ac\u00e1"}</span>
            </div>
            <div style={{ marginTop: 28, color: C.cyanSoft, fontSize: isVertical ? 42 : 34, fontWeight: 950 }}>pulsoapp.ar</div>
          </div>
        </div>
      </Shell>
    </AbsoluteFill>
  )
}

export function PulsoLaunchDemo({ format = "horizontal" }: PulsoLaunchDemoProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, fontFamily: "PulsoSans, Outfit, Arial, sans-serif" }}>
      <FontFace />
      <Audio src={staticFile("demo/pulso-soft-launch.wav")} volume={0.25} />
      <Sequence from={0} durationInFrames={84}>
        <TeaserScene format={format} />
      </Sequence>
      <Sequence from={60} durationInFrames={150}>
        <IntroScene format={format} />
      </Sequence>
      <Sequence from={180} durationInFrames={180}>
        <BattleScene format={format} />
      </Sequence>
      <Sequence from={330} durationInFrames={150}>
        <ProgressScene format={format} />
      </Sequence>
      <Sequence from={450} durationInFrames={174}>
        <ProfileScene format={format} />
      </Sequence>
      <Sequence from={618} durationInFrames={102}>
        <FinalScene format={format} />
      </Sequence>
    </AbsoluteFill>
  )
}
