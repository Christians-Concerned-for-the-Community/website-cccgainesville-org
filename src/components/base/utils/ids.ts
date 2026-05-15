/*
 * Time to wait before we're sure that the next call to uniqueIds must be from a
 * new request, even if the URL is the same.
 *
 * This is a bit of a hack, to help SSR and local dev server work a bit better in
 * the case where the user has forgotten to add resetIdMaps() to their middleware.
 */
const TIMEOUT_MS = 2000;

let requestUrl: (string | null) = null;
let lastTime: number = 0;
const map = new Map<string, number>(); // prefix -> number of times used so far

const updateRequestUrl = (url: string | null) => {
  const newTime = Date.now();
  if (requestUrl !== url || (newTime - lastTime) > TIMEOUT_MS) {
    // If we just started a new request, wipe out all the old data so we start
    // over from scratch.
    requestUrl = url;
    resetIds();
  }
  lastTime = newTime;
}

/* Call this in middleware if you want to make sure yourunqiue ID's start over at one
 * when you reload the same route, with server-side rendering or the local dev server.
 * 
 * If you don't do this, every time you click "Refresh" you'll see the element ID's
 * get higher and higher (if you click refresh before the timeout expires).
 */
export const resetIds = () => {
  map.clear();
};

/* Unique ID generator.
 *
 * This is useful for components that need to specify a unique ID internally
 * (like a disclosure and its trigger button), but might also be used multiple
 * times on the same page.
 * 
 * See: https://andrewmara.com/blog/generate-unique-ids-per-request-in-astro
 */
export const uniqueId = (url: URL, prefix: string) => {
  updateRequestUrl(url.href);
  const count = (map.get(prefix) ?? 0) + 1;
  map.set(prefix, count);
  return (count === 1)? `${prefix}` : `${prefix}-${count}`;
};
