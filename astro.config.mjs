import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { fileURLToPath } from "url";

import sitemap from "@astrojs/sitemap";
import minify from 'astro-minify-html-swc'

const abspath = (path) => {
  return fileURLToPath(new URL(path, import.meta.url))
};

// Base Vite config
const viteConfig = {
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@':       abspath('./src'),
      '@public': abspath('./public'),
      '@node_modules': abspath('./node_modules'),
    },
  },
}

// https://astro.build/config
//
// Note: site can be overriden by using the "--site" flag when building.
//       (we do this for staging builds)
export default defineConfig({
  security: {
    /*
    // This still doesn't work, as of Astro 6.0.0-beta-1 (1/18/2026). Keep trying, though. 
    //
    // See:
    //   https://docs.astro.build/en/reference/configuration-reference/#securitycsp
    //   https://web.dev/articles/strict-csp
    //
    csp: {
      scriptDirective: {
        strictDynamic: true, // trust any scripts that were loaded by trusted scripts, without requiring them to be hashed
      },
      directives: [
        "object-src 'none'", // disable insecure legacy embeds like Flash and Java
        "base-uri 'none'", // prevents injection attacks that reset the base URL of relative links
        "upgrade-insecure-requests", // upgrade http resource requests to https automatically
        "manifest-src 'self' cccgainesville.cloudflareaccess.com",
      ],
    },
    */
  },
  compressHTML: true,
  site: 'https://staging.cccgainesville.org',
  integrations: [
    sitemap({
      namespaces: {
        news: false,
        xhtml: false,
        video: false,
      }
    }),
    minify(),
  ],
  vite: viteConfig,
  image: {
    // Enable responsive images:
    layout: 'constrained',
  },
})