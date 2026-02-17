import { defineMiddleware } from 'astro:middleware'

/* Unique ID generator function that works in both static and SSR modes.
 *
 * This is useful for components that need to specify a unique ID internally
 * (like a disclosure and its trigger button), but might also be used multiple
 * times on the same page.
 * 
 * Use this by calling Astro.locals.id('<component name>') inside your component.
 * 
 * See: https://andrewmara.com/blog/generate-unique-ids-per-request-in-astro
 */
export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.id = (() => {
    // The map to store how many times each prefix has been used in this request.
    const map = new Map<string, number>()
    return (prefix: string) => {
      const count = (map.get(prefix) ?? 0) + 1
      map.set(prefix, count)
      return `${prefix}-${count}`
    }
  })()

  return await next();
})