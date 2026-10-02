import type { MetadataRoute } from "next";

/**
 * Static sitemap for public, indexable routes. App routes under /app require
 * authentication and are intentionally excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/auth/sign-in`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/auth/sign-up`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
