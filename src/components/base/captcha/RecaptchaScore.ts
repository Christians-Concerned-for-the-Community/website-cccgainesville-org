/**
 * Contains "preconnect" and "validate" for RecaptchaScore.
 */

import { ActionError } from "astro:actions";
import type { CaptchaValidator, Preconnect } from "./captcha-types";
import { recaptchaValidate } from "./recaptcha-common";

const THRESHOLD = 0.5;
const TIMEOUT_MS = 10000;

export const preconnects: Preconnect[] = [
  {href: "https://www.google.com"},
  {href: "https://www.gstatic.com", crossorigin: ""},
];

export const attribution = "This site is protected by reCAPTCHA.";

export const validate: CaptchaValidator = async (input, context): Promise<void> => {
  if (!await recaptchaValidate(input, context, THRESHOLD, TIMEOUT_MS)) {
    throw new ActionError({code:"FORBIDDEN", message: "Captcha validation failed, try again later."});
  }
};