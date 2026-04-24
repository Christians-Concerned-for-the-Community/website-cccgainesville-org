/**
 * Global type definitions for turnstile functions on the window object.
 * Taken from:
 *  https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cloudflare-turnstile/index.d.ts
 */
export {}; //needed so that this is treated as a module

declare global {
  interface Window {
    turnstile: {
      reset: (container?: string | HTMLElement) => void;
    };
  }
}