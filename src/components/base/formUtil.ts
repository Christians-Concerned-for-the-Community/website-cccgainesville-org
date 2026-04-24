import type { Captcha } from "./formUtil_types";
import { turnstile } from "./formUtil_turnstile";

interface FormUtil {
  [key: string]: Captcha,
}

export const formUtil: FormUtil = {
  turnstile: turnstile,
};