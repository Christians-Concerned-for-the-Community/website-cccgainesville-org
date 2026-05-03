/**
 * Global type definitions for captcha-related functions.
 * 
 */
export {}; //needed so that this is treated as a module

import type { CaptchaPreprocessResult } from "./captcha-types.ts";

type MaybePromise<T> = T | Promise<T>;

type FriendlyCaptchaWidget = {
  reset: () => void;
  start: () => void;
}

declare global {
  interface Window {
    // Cloudflare Turnstile API.
    // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cloudflare-turnstile/index.d.ts
    turnstile: {
      reset: (container?: string | HTMLElement) => void;
    };


    // FriendlyCaptcha SDK:
    // https://developer.friendlycaptcha.com/docs/v2/sdk/reference/sdk
    frcaptcha: {
      getAllWidgets: () => FriendlyCaptchaWidget[];
    }

    // Function hooks that will be called by our form handler, if present.
    // Individual captcha implementations can define these if needed.

    // Allow captchas to add to the form data before it's sent to the backend.
    //
    // This also allows captchas to cancel the form submission if they're not
    // ready.
    ccc_org_base_captchaPreprocess?: (form: HTMLFormElement, formData: FormData)
      => MaybePromise<CaptchaPreprocessResult>;

    // Recalculate the captcha token, if it's not already being recalculated on
    // every form submission. This lets us refresh only the captcha, instead of
    // having to refresh the whole page.
    ccc_org_base_captchaRefresh?: () => MaybePromise<void>;
  }

  // Google reCAPTCHA Enterprise API:
  // https://docs.cloud.google.com/recaptcha/docs/api-ref-checkbox-keys
  declare const grecaptcha: {
    enterprise: {
      ready: (callback: () => MaybePromise<void>) => MaybePromise<void>,
      execute: (sitekey: string, action: {action: string}) => Promise<string>
    }
  };
}