import type { ActionAPIContext } from "astro:actions";

export type CaptchaValidator =
  (input: Record<string, any>, context: ActionAPIContext) => Promise<void>;