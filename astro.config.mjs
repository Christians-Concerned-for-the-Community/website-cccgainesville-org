import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'url'
import compress from 'astro-compress'
import icon from 'astro-icon'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

// Base Vite config
const viteConfig = {
  css: {
    preprocessorOptions: {
      scss: {
        logger: {
          warn: () => {},
        },
      },
    },
  },
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@content': fileURLToPath(new URL('./src/content', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@public': fileURLToPath(new URL('./public', import.meta.url)),
    },
  },
}


// https://astro.build/config
//
// Note: site can be overriden by using the "--site" flag when building.
//       (we do this for staging builds)
export default defineConfig({
  prefetch: {
    prefetchAll: true,
  },
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
    icon(),
    mdx(),
    sitemap({
      namespaces: {
        news: false,
        xhtml: false,
        video: false,
      }
    }),
    compress(),
  ],
  vite: viteConfig,
  image: {
    // Enable responsive images:
    layout: 'constrained',
    responsiveStyles: true,
  },
})
