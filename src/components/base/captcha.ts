import type { CaptchaValidator } from "./captcha/captcha-types";


export type CaptchaCsp = {
  frame?: string[],
  connect?: string[],
  font?: string[],
};

const DEFAULT_CAPTCHA = "RecaptchaScore";

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

if (!captcha.mod.validate) {
    throw new Error(
`Can't find captcha validator for ${captcha.name}.
Validator should be defined in captcha/${captcha.name}.ts like this:
 "export const validate = (input: Record<string, any>, context: ActionAPIContext) => { ..."`);
}

export const captchaEveryPage = captcha.name === "RecaptchaScore";
export const captchaComponent = captcha.component;
export const captchaPreconnect = captcha.mod.preconnect as string | undefined;
export const validateCaptcha = captcha.mod.validate as CaptchaValidator;