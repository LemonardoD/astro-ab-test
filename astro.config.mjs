// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com", // Replace with your actual site URL
  adapter: cloudflare(),
  integrations: [
    sitemap({
      serialize: (item) => {
        // Exclude variant pages from sitemap
        if (item.url.includes("::")) {
          return undefined;
        }
        return item;
      }
    })
  ]
});
