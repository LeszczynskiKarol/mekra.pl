import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://www.mekra.pl",
  integrations: [
    tailwind(),
    sitemap({
      lastmod: new Date(),
      changefreq: "weekly",
      priority: 0.7,
      serialize(item) {
        if (item.url === "https://www.mekra.pl/") item.priority = 1.0;
        return item;
      },
    }),
  ],
  output: "static",
  // Najwęższa ramka to 12 mm, nie 7 mm (zmiana 2026-09). Właściwe 301 robi
  // funkcja CloudFront (aws-cloudfront/trailing-slash-redirect.js); te strony
  // z meta refresh są zapasem, gdyby funkcja nie była podpięta.
  redirects: {
    "/oferta/ramka-7mm": "/oferta/ramka-12mm/",
    "/realizacje/ramka-7mm": "/realizacje/ramka-12mm/",
  },
  build: {
    assets: "_assets",
    inlineStylesheets: "always",
  },
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
