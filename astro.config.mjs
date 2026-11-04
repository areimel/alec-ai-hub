import { defineConfig, passthroughImageService } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://ai-hub.alecreimel.com",
  output: "static",
  // Old URLs that now point somewhere else. Add new entries here.
  redirects: {
    "/ai-personas": "/custom-agents",
    "/ai-personas/creative-collaborator": "/custom-agents",
    "/ai-personas/curious-teacher": "/custom-agents",
    "/ai-personas/empathetic-counselor": "/custom-agents",
    "/ai-personas/professional-assistant": "/custom-agents",
    "/ai-personas/strategic-business-advisor": "/custom-agents",
    "/ai-personas/technical-mentor": "/custom-agents",
  },
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    service: passthroughImageService()
  }
});
