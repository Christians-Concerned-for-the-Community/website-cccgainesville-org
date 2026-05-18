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

  /*
    Give Lively's donation widget contains inline style elements that we don't
    have hashes for. Enable unsafe-inline style behavior just for the giving
    page, so we can still use it.

    TODO: can we get Give Lively to fix this?
  */
  if (context.url.pathname === "/give/") {
    const response = await next();
    const html = await response.text();

    // Replace contents of style-src, to allow inline styles without hashes.
    const newStyleSrc = [
      "'self'",
      "'unsafe-inline'",
      "https://secure.givelively.org",
      "https://fonts.googleapis.com"
    ].join(' ');

    const updatedHtml = html.replace(
      /(<meta\s+[^>]+"content-security-policy"[^>]+style-src )([^;]*)/i,
      `$1${newStyleSrc}`);
    
    return new Response(updatedHtml, {
      status: 200,
      headers: response.headers,
    });
  } else if (context.url.pathname === "/admin/editor" || context.url.pathname.startsWith("/admin/editor/")) {
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
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' blob: data: https://*.githubusercontent.com",
      "media-src blob:",
      "frame-src blob:",
      "script-src 'self' https://unpkg.com",
      "connect-src blob: data: https://unpkg.com https://api.github.com https://*.githubstatus.com",
    ];
    response.headers.set('Content-Security-Policy', directives.join(";") + ";");

    return response;
  }

  return await next();
})