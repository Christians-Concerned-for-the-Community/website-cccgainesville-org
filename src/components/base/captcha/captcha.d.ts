/**
 * Global type definitions for captcha-related functions.
 * 
 */
export {}; //needed so that this is treated as a module

declare global {
  interface Window {
    // Cloudflare Turnstile API.
    // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cloudflare-turnstile/index.d.ts
    turnstile: {
      reset: (container?: string | HTMLElement) => void;
    };


    // Function hooks that will be called by our form handler, if present.
    // Individual captcha implementations can define these if needed.

    // Allow captchas to add to the form data before it's sent to the backend.
    //
    // We can't just use the formdata event for this, because captcha's might need
    // to await an async operation during preprocessing, and there's no way to
    // make the main form submit handler wait for an async formdata callback before
    // proceeding.
    ccc_org_base_captchaPreprocess?: (formData: FormData) => (void | Promise<void>);

    // Recalculate the captcha token, if it's not already being recalculated on
    // every form submission. This lets us refresh only the captcha, instead of
    // having to refresh the whole page.
    ccc_org_base_captchaRefresh?: () => void;
  }

  // Google reCAPTCHA Enterprise API:
  // https://docs.cloud.google.com/recaptcha/docs/api-ref-checkbox-keys
  declare const grecaptcha: {
    enterprise: {
      ready: (callback: () => (void | Promise<void>)) => (void | Promise<void>),
      execute: (sitekey: string, action: {action: string}) => Promise<string>
    }
  };
}