import { defineMiddleware } from 'astro:middleware'

/* [onRequest] is executed after a page is requested, but before rendering
 * begins. This happens for both static pages (pre-rendering) and dynamic pages
 * (server-side rendering - SSR).
 *
 * Values stored in [context.locals] are available to use inside the .astro files
 * that define the page, through the [Astro.locals] object.
 */
export const onRequest = defineMiddleware(async (context, next) => {

  // Skip middleware for our action handlers (they all accept POST's).
  if (context.request.method !== "GET") {
    return await next();
  }

  const isPath = (path: string) : boolean => {
    return context.url.pathname === path ||
           context.url.pathname.startsWith(path + "/");
  }

  if (isPath("/admin/editor")) {
    const response = await next();

    // Completely override Astro's CSP settings for this server-rendered route.
    const directives = [
      // basic csp settings:
      "object-src 'none'",
      "base-uri 'none'",
      "upgrade-insecure-requests",
      "default-src 'none'",

      // sveltia-specific stuff:
      // see: https://sveltiacms.app/en/docs/security#setting-up-content-security-policy
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' https://cdn.jsdelivr.net",
      "img-src 'self' blob: data: https://*.githubusercontent.com",
      "media-src blob:",
      "frame-src blob:",
      "manifest-src blob:",
      "script-src 'self' 'unsafe-inline' https://unpkg.com",
      "connect-src 'self' blob: data: https://unpkg.com https://api.github.com https://*.githubstatus.com https://api.cloudflare.com",
    ];
    response.headers.set('Content-Security-Policy', directives.join(";") + ";");

    return response;

  } else if (isPath("/admin/stats")) {
    const response = await next();

    // Completely override Astro's CSP settings for this server-rendered route.
    const directives = [
      // basic csp settings:
      "object-src 'none'",
      "base-uri 'none'",
      "upgrade-insecure-requests",
      "default-src 'none'",
      "img-src 'self'",

      // specific settings for the goatcounter dashboard:
      "connect-src 'self' https://unpkg.com https://*.goatcounter.com",
      "font-src 'self' https://fonts.gstatic.com",
      "script-src 'self' 'unsafe-inline' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    ];
    response.headers.set('Content-Security-Policy', directives.join(";") + ";");

    return response;
  }

  return await next();
})