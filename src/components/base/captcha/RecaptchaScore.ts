/**
 * Contains "preconnect" and "validate" for RecaptchaScore.
 */

import { ActionError } from "astro:actions";
import type { CaptchaImpl } from "./captcha-types.ts";
import { recaptchaValidate } from "./recaptcha-common.ts";

const THRESHOLD = 0.5;
const TIMEOUT_MS = 10000;

export const impl: CaptchaImpl = {
  everyPage: true, //google recommends including recaptcha on every page, for better bot identification

  attribution: "This site is protected by reCAPTCHA.",

  preconnects: [
    {href: "https://www.google.com"},
    {href: "https://www.gstatic.com", crossorigin: ""},
  ],

  validate: async (input, context): Promise<void> => {
    if (!await recaptchaValidate(input, context, THRESHOLD, TIMEOUT_MS)) {
      throw new ActionError({code:"FORBIDDEN", message: "Captcha validation failed, try again later."});
    }
  },
}
