import type { ActionAPIContext } from "astro:actions";

export type Captcha = {
  key: string,
  fieldname: string,
  validate: (input: Record<string, any>, context: ActionAPIContext) => Promise<void>,
};