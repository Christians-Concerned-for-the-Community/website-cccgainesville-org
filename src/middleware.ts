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


  /* Edit final HTML result of the request through before we . */
  const response = await next();
  const html = await response.text();
  let updatedHtml;

  if (context.url.pathname === "/give/") {
    // Replace contents of style-src, to allow inline styles without hashes.
    const newStyleSrc = [
      "'self'",
      "'unsafe-inline'",
      "https://secure.givelively.org",
      "https://fonts.googleapis.com"
    ].join(' ');

    updatedHtml = html.replace(
      /(<meta\s+[^>]+"content-security-policy"[^>]+style-src )([^;]*)/i,
      `$1${newStyleSrc}`);
  }

  /*
    Astro is adding style="object-position: center" to img tags as part
    of responsive image handling, but isn't generating a hash for it
    automatically with CSP. Add it ourselves.

    TODO: remove this once the bug is fixed, see: https://github.com/withastro/astro/issues/16656
  */
  const styleSrcAttr = "style-src-attr 'unsafe-hashes' "
    + "'sha256-0740ZBP3M2FiEkXbUWsIqxUsdOBsp+qkWY2dR0rl5T4=';";
  updatedHtml = html.replace(
    /(<meta\s+[^>]+"content-security-policy"[^>]+content=\"[^"]+)\"/i,
    `$1${styleSrcAttr}"`
  );

  return new Response(updatedHtml, {
    status: 200,
    headers: response.headers,
  });

  //return await next();
})