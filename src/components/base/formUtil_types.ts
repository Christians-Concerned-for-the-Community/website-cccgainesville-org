import type { ActionAPIContext } from "astro:actions";

export type Captcha = {
  key: string,
  secret: string,
  fieldname: string,
  validate: (input: Record<string, any>, context: ActionAPIContext) => Promise<void>,
};