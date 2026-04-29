/**
 * Global type definitions for captcha-related functions on the window object.
 * Signature for turnstile reset taken from here:
 *  https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cloudflare-turnstile/index.d.ts
 */
export {}; //needed so that this is treated as a module

declare global {
  interface Window {
    turnstile: {
      reset: (container?: string | HTMLElement) => void;
    };

    captchaReset: () => void;
  }
}