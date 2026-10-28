import { defineConfig, passthroughImageService } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://ai-hub.homelab.alecreimel.com",
  output: "static",
  integrations: [tailwind(), mdx(), sitemap(), icon()],
  image: {
    service: passthroughImageService()
  }
});