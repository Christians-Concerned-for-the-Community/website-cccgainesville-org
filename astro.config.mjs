import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
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
    csp: {
      scriptDirective: {
        /*
          Trust any scripts that were loaded by trusted scripts, without
          requiring them to be hashed.

          This is required by all third-party embeds, like Cloudflare Turnstile
          and Give Lively's donation widget.
         */
        strictDynamic: true,
      },
      /*
        TODO: we're currently overwriting style-src manually in middleware for
        the give/ endpoint alone, because Give Lively includes inline styles in
        their embedded widget. If we ever get them to fix that, uncomment the
        following chunk of code after you remove the middleware.
       */
      /*
      styleDirective: {
        resources: [
          "'self'",
          // These are needed for Give Lively's embedded donation widget.
          "https://secure.givelively.org",
          "https://fonts.googleapis.com",
        ],
      },
      //*/
      directives: [
        // disable insecure legacy embeds like Flash and Java
        "object-src 'none'",
        // prevents injection attacks that reset the base URL of relative links
        "base-uri 'none'",
        // upgrade http resource requests to https automatically
        "upgrade-insecure-requests",
        // needed for cloudflare turnstile preclearance, and for Give Lively's
        // embedded donation widget
        "connect-src 'self' https://secure.givelively.org",
        "frame-src 'self' https://secure.givelively.org https://challenges.cloudflare.com",
        // needed for Give Lively's embedded donation widget
        "font-src 'self' https://fonts.gstatic.com",
      ],
    },
    //*/
  },
})