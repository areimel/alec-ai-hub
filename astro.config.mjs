import { defineConfig, passthroughImageService } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://company-ai-prompts.netlify.app",
  output: "static",
  integrations: [tailwind(), mdx(), sitemap(), icon()],
  image: {
    service: passthroughImageService()
  }
});