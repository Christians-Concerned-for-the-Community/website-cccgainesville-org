import { defineMiddleware } from 'astro:middleware'

/* [onRequest] is executed after a page is requested, but before rendering
 * begins. This happens for both static pages (pre-rendering) and dynamic pages
 * (server-side rendering - SSR).
 *
 * Values stored in [context.locals] are available to use inside the .astro files 
 * that define the page, through the [Astro.locals] object.
 */
export const onRequest = defineMiddleware(async (context, next) => {

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

  return await next();
})