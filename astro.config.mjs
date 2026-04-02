import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://mekra.pl",
  integrations: [tailwind(), sitemap()],
  output: "static",
  build: {
    assets: "_assets",
  },
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
