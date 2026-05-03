import type { ActionAPIContext } from "astro:actions";

export type CaptchaValidator =
  (input: Record<string, any>, context: ActionAPIContext) => Promise<void>;

export type CaptchaPreprocessResult = {
  err: string; // error message to display, or empty string if we're OK to proceed
  id?: string; // id of element to use in error link (may be null, if it's an invisible captcha)
}