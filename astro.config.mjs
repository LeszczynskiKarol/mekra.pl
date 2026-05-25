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
