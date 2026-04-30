import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { fileURLToPath } from "url";

import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

const abspath = (path: string) => {
  return fileURLToPath(new URL(path, import.meta.url))
};

const csp = {
  connect: new Set(["'self'"]),
  font:    new Set(["'self'"]),
  frame:   new Set(["'self'"]),
  style:   new Set(["'self'"]),
};

// Add GiveLively CSP entries.
csp.connect.add("https://secure.givelively.org");
csp.font.add("https://fonts.gstatic.com");
csp.frame.add("https://secure.givelively.org");
csp.style.add("https://secure.givelively.org");
csp.style.add("https://fonts.googleapis.com");

// Add Captcha CSP entries.
//* -- Turnstile --
csp.connect.add("'self'");
csp.frame.add("https://challenges.cloudflare.com");
//*/
//* -- RecaptchaScore --
csp.connect.add("https://www.google.com/recaptcha/");
csp.frame.add("https://www.google.com/recaptcha/");
//*/


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
      styleDirective: {
        resources: [...csp.style],
      },
      directives: [
        // disable insecure legacy embeds like Flash and Java
        "object-src 'none'",
        // prevents injection attacks that reset the base URL of relative links
        "base-uri 'none'",
        // upgrade http resource requests to https automatically
        "upgrade-insecure-requests",
        //
        `connect-src ${[...csp.connect].join(" ")}`,
        `font-src ${[...csp.font].join(" ")}`,
        `frame-src ${[...csp.frame].join(" ")}`,
      ],
    },
  },
})