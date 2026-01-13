// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  output: "server",
  site: "https://example.com", // Replace with your actual site URL
  adapter: cloudflare(),
  integrations: [
    sitemap({
      serialize: (item) => {
        // Exclude variant pages from sitemap
        // if (item.url.includes("::")) {
        //   return undefined;
        // }
        return item;
      }
    })
  ]
});
