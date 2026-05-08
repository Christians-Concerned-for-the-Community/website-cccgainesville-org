import type { CaptchaImpl } from "./captcha/captcha-types";

const DEFAULT_CAPTCHA = "Turnstile";

const captcha: Record<string, any> = {};

captcha.name = process.env.PUBLIC_CAPTCHA_NAME || DEFAULT_CAPTCHA

try {
  captcha.component = (await import(`./captcha/${captcha.name}.astro`)).default;
} catch (err) {
  throw new Error(
    `Can't find captcha ${captcha.name}, missing "captcha/${captcha.name}.astro".\nError: ${err}`
  );
}

try {
  captcha.mod = (await import(`./captcha/${captcha.name}.ts`));
} catch (err) {
  throw new Error(
    `Can't find captcha ${captcha.name}, missing "captcha/${captcha.name}.ts".\nError: ${err}`
  );
}

if (!captcha.mod.impl) {
    throw new Error(
`Can't find captcha backend for ${captcha.name}.
Backend should be defined in captcha/${captcha.name}.ts like this:
 "export const impl: CaptchaImpl = { ..."`);
}

export const captchaComponent = captcha.component;
export const captchaImpl = captcha.mod.impl as CaptchaImpl;