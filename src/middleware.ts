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
  }

  return await next();
})