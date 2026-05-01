/**
 * Contains "preconnect" and "validate" for RecaptchaScore.
 */

import { ActionError } from "astro:actions";
import type { CaptchaValidator } from "./captcha-types";
import { recaptchaValidate } from "./recaptcha-common";

const THRESHOLD = 0.5;
const TIMEOUT_MS = 10000;

export const preconnect = "https://www.google.com";

export const validate: CaptchaValidator = async (input, context): Promise<void> => {
  if (!await recaptchaValidate(input, context, THRESHOLD, TIMEOUT_MS)) {
    throw new ActionError({code:"FORBIDDEN", message: "Captcha validation failed, try again later."});
  }
};