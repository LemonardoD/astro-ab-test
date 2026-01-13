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
        // Exclude pages like _a_ or _b_ from sitemap
        if (/\/_[a-zA-Z]_/.test(item.url)) {
          return undefined;
        }
        return item;
      }
    })
  ]
});
