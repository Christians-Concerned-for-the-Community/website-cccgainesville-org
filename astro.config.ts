import tailwindcss from "@tailwindcss/vite";
import browserslistToEsbuild from 'browserslist-to-esbuild'
import { defineConfig } from "astro/config";
import { fileURLToPath } from "url";

import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

const abspath = (path: string) => {
  return fileURLToPath(new URL(path, import.meta.url))
};

const blist = browserslistToEsbuild();

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
      filter: (page) => {
        const pathname = (new URL(page)).pathname;
        const exclude = [
          /^\/admin\//, // omit any path from sitemap that lies under admin/
        ];
        return !exclude.some(regex => regex.test(pathname));
      },
      namespaces: {
        news: false,
        xhtml: false,
        video: false,
      }
    }),
  ],

  markdown: {
    // Use Prism for syntax highlighting instead of Shiki, which doesn't currently
    // work under Astro's strict CSP support.
    syntaxHighlight: 'prism',
  },

  image: {
    // Enable responsive images:
    layout: 'constrained',
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      target: blist,
      cssTarget: blist,
    },
    resolve: {
      alias: {
        '@':       abspath('./src'),
        '@public': abspath('./public'),
        '@base':   abspath('./src/components/base'),
      },
    },
  },

  /* We're following this for content security:
     https://web.dev/articles/strict-csp

     Components that require additional directives to work define them locally
     in the component frontmatter using the Astro.csp.* functions. Only
     put directives here in the global settings if they genuinely need to apply
     to every single page on the site, regardless of content.
   */
  security: {
    csp: {
      styleDirective: {
        /*
          Astro is adding style="object-position: center" to img tags as part
          of responsive image handling, but isn't generating a hash for it
          automatically with CSP. Add it ourselves.

          TODO: remove this once the bug is fixed, see: https://github.com/withastro/astro/issues/16656
        */
        resources: ["'self'", "'unsafe-hashes'"],
        hashes: ['sha256-0740ZBP3M2FiEkXbUWsIqxUsdOBsp+qkWY2dR0rl5T4='],
      },
      directives: [
        // disable insecure legacy embeds like Flash and Java
        "object-src 'none'",
        // prevents injection attacks that reset the base URL of relative links
        "base-uri 'none'",
        // upgrade http resource requests to https automatically
        "upgrade-insecure-requests",
        // default everything else to off, except for img-src and font-src
        "default-src 'none'",
        "img-src 'self'",
        "font-src 'self'",
      ],
    },
  },
})