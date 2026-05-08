import type { ActionAPIContext } from "astro:actions";

export type CaptchaPreprocessResult = {
  err: string; // error message to display, or empty string if we're OK to proceed
  id?: string; // id of element to use in error link (may be null, if it's an invisible captcha)
}

// Props and functions that individual captcha implementations may choose to export.
export type CaptchaImpl = {
  /**
   * Function that validates a submitted Captcha token.
   * 
   * @param input full FormData received during a submission (entries may be added by this function)
   * @param context context of the form handler action that needs to perform a validation
   * @throws a descriptive ActionError, if validation failed
   */
  validate: (input: Record<string, any>, context: ActionAPIContext) => Promise<void>;

  /**
   * Should the captcha be included on every page, not just in forms?
   */
  everyPage?: boolean;

  /**
   * Attribution string that should be displayed when the captcha is in use.
   * May be provided by invisible captchas.
   */
  attribution?: string;

  /**
   * List of preconnect domains that can be specified in HEAD to speed up
   * loading of the captcha script.
   * 
   * Use: <link rel="preconnect" href={href} crossorigin={crossorigin}/>
   */
  preconnects?: {
    href: string,
    crossorigin?: "anonymous" | "use-credentials" | "",
  }[];
}