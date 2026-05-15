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

  /* Unique ID generator that works in both static and SSR modes.
   *
   * This is useful for components that need to specify a unique ID internally
   * (like a disclosure and its trigger button), but might also be used multiple
   * times on the same page.
   * 
   * Use this by calling Astro.locals.id('<component name>') inside your component.
   * 
   * See: https://andrewmara.com/blog/generate-unique-ids-per-request-in-astro
   */
  context.locals.id = (() => {
    const map = new Map<string, number>(); // prefix -> number of times used so far
    return (prefix: string) => {
      const count = (map.get(prefix) ?? 0) + 1;
      map.set(prefix, count);
      return (count === 1)? `${prefix}` : `${prefix}-${count}`;
    }
  })();

  /* Returns true if this is the first time this function has been called with
   * the given name during this page request.
   *
   * This is useful if you have a component that needs to do something different
   * during it's first rendering on the page.
   */
  context.locals.first = (() => {
    const names = new Set<string>();
    return (name: string) => {
      if (names.has(name)) {
        return false;
      }
      names.add(name);
      return true;
    }
  })();


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