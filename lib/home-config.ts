export type Feature = {
  title: string
  description: string
  tag: string
  accent: string
}

export type ModuleStatus = "Live" | "In Progress" | "Planned"

export type Module = {
  name: string
  status: ModuleStatus
  href?: string
}

export const homeFeatures: Feature[] = [
  {
    title: "Battles 1v1 en tiempo real",
    description: "Comparacion directa de tracks con voto rapido y resultados visibles al instante.",
    tag: "Core Arena",
    accent: "#00F0FF",
  },
  {
    title: "Progreso de jugador",
    description: "Sistema de nivel y evolucion para reforzar retencion y metas dentro de la experiencia.",
    tag: "Player Loop",
    accent: "#00FF66",
  },
  {
    title: "Identidad sonora",
    description: "Perfil Sonoro para convertir el historial de votos en una huella musical única.",
    tag: "Personalization",
    accent: "#FF2A6D",
  },
]

export const homeModules: Module[] = [
  { name: "Login Tactical", status: "Live", href: "/login" },
  { name: "Battle Arena", status: "Live", href: "/battle" },
  { name: "Perfil Sonoro", status: "In Progress", href: "/music-dna" },
  { name: "Leaderboard Global", status: "Planned" },
]
