import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

const sampleRate = 48_000
const durationSeconds = 30
const channels = 2
const bitsPerSample = 16
const totalSamples = sampleRate * durationSeconds
const outputPath = join(process.cwd(), "public", "demo", "pulso-soft-launch.wav")

function writeString(buffer, offset, value) {
  buffer.write(value, offset, value.length, "ascii")
}

function envelope(sampleIndex) {
  const t = sampleIndex / sampleRate
  const fadeIn = Math.min(1, t / 2.2)
  const fadeOut = Math.min(1, (durationSeconds - t) / 2.8)
  return Math.max(0, Math.min(fadeIn, fadeOut))
}

function tone(frequency, t) {
  return Math.sin(2 * Math.PI * frequency * t)
}

function sampleAt(sampleIndex, channel) {
  const t = sampleIndex / sampleRate
  const chordIndex = Math.floor(t / 3.75) % 4
  const chords = [
    [130.81, 196.0, 261.63, 392.0],
    [146.83, 220.0, 293.66, 440.0],
    [164.81, 246.94, 329.63, 493.88],
    [110.0, 164.81, 220.0, 329.63],
  ]
  const chord = chords[chordIndex]
  const pan = channel === 0 ? 0.96 : 1.04
  const pad =
    tone(chord[0] * pan, t) * 0.18 +
    tone(chord[1] * pan, t) * 0.12 +
    tone(chord[2] * pan, t) * 0.1 +
    tone(chord[3] * pan, t) * 0.06
  const pulse = Math.sin(2 * Math.PI * 0.5 * t) * 0.06
  const shimmer = tone(880 * pan, t) * (0.018 + Math.max(0, pulse))
  const softBeat = Math.sin(2 * Math.PI * 2 * t) > 0.985 ? 0.08 : 0

  return Math.max(-1, Math.min(1, (pad + shimmer + softBeat) * envelope(sampleIndex) * 0.72))
}

mkdirSync(dirname(outputPath), { recursive: true })

const dataSize = totalSamples * channels * (bitsPerSample / 8)
const buffer = Buffer.alloc(44 + dataSize)

writeString(buffer, 0, "RIFF")
buffer.writeUInt32LE(36 + dataSize, 4)
writeString(buffer, 8, "WAVE")
writeString(buffer, 12, "fmt ")
buffer.writeUInt32LE(16, 16)
buffer.writeUInt16LE(1, 20)
buffer.writeUInt16LE(channels, 22)
buffer.writeUInt32LE(sampleRate, 24)
buffer.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28)
buffer.writeUInt16LE(channels * (bitsPerSample / 8), 32)
buffer.writeUInt16LE(bitsPerSample, 34)
writeString(buffer, 36, "data")
buffer.writeUInt32LE(dataSize, 40)

let offset = 44
for (let index = 0; index < totalSamples; index += 1) {
  for (let channel = 0; channel < channels; channel += 1) {
    const value = Math.round(sampleAt(index, channel) * 32767)
    buffer.writeInt16LE(value, offset)
    offset += 2
  }
}

writeFileSync(outputPath, buffer)
console.log(`Generated ${outputPath}`)
