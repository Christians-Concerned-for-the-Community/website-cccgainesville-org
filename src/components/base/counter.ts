/* Maintains a global Map that keeps track of how many times a given ID has
 * been counted.
 *
 * Calling count("some-id") increments the counter for that id, then returns
 * the new value.
 * 
 * This allows you to assign unique ID's to Astro components automatically.
 */
const counts = new Map();

export const countGet = (id: string) :number => {
  return (counts.get(id) ?? 0);
}

export const countAddAndGet = (id: string) :number => {
  const count = countGet(id) + 1;
  counts.set(id, count);
  return count;
}