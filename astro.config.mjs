import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";
import { fileURLToPath } from "url";

import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";

const abspath = (path) => {
  return fileURLToPath(new URL(path, import.meta.url))
};

// https://astro.build/config
//
// Note: site can be overriden by using the "--site" flag when building.
//       (we do this for staging builds)
export default defineConfig({
  compressHTML: true,
  site: 'https://staging.cccgainesville.org',

  env: {
    schema: {
      /* Cloudflare turnstile widget keys. The default ones shown here are test
         keys that always succeed, do not use these in production. Define the keys
         as variables in the worker up on the Cloudflare dashboard instead. */
      TURNSTILE_KEY: envField.string({context: "client", access: "public",
        default:"1x00000000000000000000AA"}), //visible client - always succeeds
      TURNSTILE_SECRET: envField.string({context: "server", access: "secret",
        default:"1x0000000000000000000000000000000AA"}), //server - always succeeds
    },
  },

  output: 'static',

  adapter: cloudflare({
    imageService: 'compile' //'cloudflare-binding' // haven't been able to get this to work for local previews
  }),

  integrations: [
    sitemap({
      namespaces: {
        news: false,
        xhtml: false,
        video: false,
      }
    }),
  ],

  image: {
    // Enable responsive images:
    layout: 'constrained',
  },

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@':       abspath('./src'),
        '@public': abspath('./public'),
      },
    },
  },

  security: {
    /*
    // Works for most of the website, as of Astro v6.0.8 (3/22/2026).
    //
    // May be challenging to get it working with the embedded Give Lively donation
    // widget, but I haven't tried yet.
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
    //*/
  },
})