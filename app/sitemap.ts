import type { MetadataRoute } from "next"

const siteUrl = "https://pulsoapp.ar"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/battle`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/music-dna`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ]
}
