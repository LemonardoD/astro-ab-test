// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://example.com", // Replace with your actual site URL
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
