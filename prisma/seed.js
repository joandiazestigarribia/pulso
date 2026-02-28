/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const mockTracks = [
  {
    id: "1",
    name: "Midnight City",
    artist: "M83",
    albumImage: "/images/album-midnight-city.jpg",
    previewUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
    eloScore: 1520,
    battlesCount: 34,
    bpm: 105,
    duration: "04:03",
    genre: "Synthpop",
    year: 2011,
  },
  {
    id: "2",
    name: "Running Up That Hill",
    artist: "Kate Bush",
    albumImage: "/images/album-running-up.jpg",
    previewUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
    eloScore: 1510,
    battlesCount: 28,
    bpm: 103,
    duration: "04:56",
    genre: "Art Pop",
    year: 1985,
  },
  {
    id: "3",
    name: "One More Time",
    artist: "Daft Punk",
    albumImage: "/images/album-one-more-time.jpg",
    previewUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
    eloScore: 1550,
    battlesCount: 42,
    bpm: 122,
    duration: "05:20",
    genre: "French House",
    year: 2001,
  },
  {
    id: "4",
    name: "Blinding Lights",
    artist: "The Weeknd",
    albumImage: "/images/album-blinding-lights.jpg",
    previewUrl: null,
    eloScore: 1480,
    battlesCount: 38,
    bpm: 171,
    duration: "03:20",
    genre: "Synthwave",
    year: 2019,
  },
  {
    id: "5",
    name: "Smells Like Teen Spirit",
    artist: "Nirvana",
    albumImage: "/images/album-teen-spirit.jpg",
    previewUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
    eloScore: 1530,
    battlesCount: 45,
    bpm: 117,
    duration: "05:01",
    genre: "Grunge",
    year: 1991,
  },
  {
    id: "6",
    name: "Titi Me Pregunto",
    artist: "Bad Bunny",
    albumImage: "/images/album-titi.jpg",
    previewUrl: null,
    eloScore: 1490,
    battlesCount: 31,
    bpm: 130,
    duration: "04:03",
    genre: "Reggaeton",
    year: 2022,
  },
]

async function main() {
  for (const track of mockTracks) {
    await prisma.track.upsert({
      where: { id: track.id },
      create: track,
      update: {
        name: track.name,
        artist: track.artist,
        albumImage: track.albumImage,
        previewUrl: track.previewUrl,
        bpm: track.bpm,
        duration: track.duration,
        genre: track.genre,
        year: track.year,
      },
    })
  }

  await prisma.user.upsert({
    where: { id: "guest" },
    create: { id: "guest" },
    update: {},
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
