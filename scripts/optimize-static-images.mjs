
import { mkdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const SOURCES = [
  "public/images/home/background-home.jpg",
  "public/images/battle/neon_campfire_background.png",
  "public/images/music-dna/background-music-dna.png",
]

const TARGETS = [
  { ext: "avif", encode: (img) => img.avif({ quality: 55, effort: 6 }) },
  { ext: "webp", encode: (img) => img.webp({ quality: 72 }) },
]

function formatKb(bytes) {
  return (bytes / 1024).toFixed(0) + "KB"
}

for (const source of SOURCES) {
  const sourceBytes = (await stat(source)).size
  const dir = path.dirname(source)
  const base = path.basename(source, path.extname(source))

  await mkdir(dir, { recursive: true })

  for (const target of TARGETS) {
    const outPath = path.join(dir, `${base}.${target.ext}`)
    const buffer = await target.encode(sharp(source)).toBuffer()
    await writeFile(outPath, buffer)

    const saved = (100 * (1 - buffer.length / sourceBytes)).toFixed(0)
    console.log(`${outPath}  ${formatKb(sourceBytes)} -> ${formatKb(buffer.length)}  (-${saved}%)`)
  }
}
