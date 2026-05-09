import type { AstroInstance } from "astro";
import type { CaptchaImpl } from "./captcha/captcha-types";

const DEFAULT_CAPTCHA = "Turnstile";

const name = process.env.PUBLIC_CAPTCHA_NAME || DEFAULT_CAPTCHA


const component = ((await import(`./captcha/${name}.astro`).catch((e)=>{
  throw new Error(
    `Can't find captcha ${name}, missing "captcha/${name}.astro".\nError: ${e}`
  );
})) as AstroInstance).default;


const impl = (await import(`./captcha/${name}.ts`).catch((e)=>{
  throw new Error(
    `Can't find captcha ${name}, missing "captcha/${name}.ts".\nError: ${e}`
  );
})).impl;

if (!impl) {
    throw new Error(
`Can't find captcha backend for ${name}.
Backend should be defined in captcha/${name}.ts like this:
 "export const impl: CaptchaImpl = { ..."`);
}


export const captchaComponent = component;
export const captchaImpl = impl as CaptchaImpl;