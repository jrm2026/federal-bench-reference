// @ts-check
import { defineConfig } from "astro/config";

// The `site` field is deliberately unset. It feeds absolute URLs and the
// sitemap, and the domain is still an open decision in docs/LAUNCH-CHECKLIST.md.
// Set it, and add @astrojs/sitemap, when the domain is chosen — not before, or
// the site will emit canonical URLs pointing at a host nobody owns.

export default defineConfig({
  output: "static",
  outDir: "./dist",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  devToolbar: {
    enabled: false,
  },
});
