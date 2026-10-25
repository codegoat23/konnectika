import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const searchCrawlerRules = {
  allow: "/",
  disallow: "/api/",
};

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", ...searchCrawlerRules },
      { userAgent: "Googlebot", ...searchCrawlerRules },
      { userAgent: "Bingbot", ...searchCrawlerRules },
      { userAgent: "OAI-SearchBot", ...searchCrawlerRules },
      { userAgent: "Claude-SearchBot", ...searchCrawlerRules },
      { userAgent: "PerplexityBot", ...searchCrawlerRules },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
