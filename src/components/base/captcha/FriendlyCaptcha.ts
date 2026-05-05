/**
 * Contains "preconnect" and "validate" for FriendlyCaptcha.
 */

import { ActionError } from "astro:actions";
import { getSecret } from "astro:env/server";
import type { CaptchaValidator, Preconnect } from "./captcha-types";

const TIMEOUT_MS = 10000;

export const preconnects: Preconnect[] = [{href:"https://cdn.jsdelivr.net"}];


type Response = {
  success: boolean,
  data?: {
    event_id: string, // Unique identifier for the siteverify request.
    challenge: {
        timestamp: string, // ISO 8601 timestamp when the captcha challenge was completed.
        origin?: string // Origin where the challenge happened. This can be empty if unknown.
    },
  },
  error?: {
    error_code: string,
    detail?: any,
  }
}

export const validate: CaptchaValidator = async (input, context): Promise<void> => {
  let success = false;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // --------------------------
    // Get captcha-specific info.
    const secret = getSecret("SECRET_CAPTCHA_KEY");
    if (!secret) {
      throw new Error("secret missing, forgot to set SECRET_CAPTCHA_KEY?");
    }

    const sitekey = process.env.PUBLIC_CAPTCHA_KEY;
    if (!sitekey) {
      throw new Error("sitekey missing, forgot to set PUBLIC_CAPTCHA_KEY?");
    }

    const token = input["frc-captcha-response"];
    if (!token) {
      throw new Error("token missing");
    }
    if (typeof token !== "string" || token.length > (2048*4)) {
      throw new Error("token invalid");
    }

    // ------------------------------
    // Construct the request payload.
    const request = {
      response: token,
      sitekey: sitekey,
    };

    // ----------------------------------
    // Request an assessment from FriendlyCaptcha's backend.
    const response = await fetch("https://global.frcapi.com/api/v2/captcha/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": secret,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      let err;
      try {
        err = ((await response.json()) as Partial<Response>)?.error?.error_code;
      } catch(e){};
      throw new Error(`bad response from endpoint: [${response.status}] - ${response.statusText}, err code: ${err}`);
    }
    
    const res: Partial<Response> = await response.json();

    if (res.data?.challenge.origin) {
      const expected = new URL(context.request.url).hostname;
      const got = new URL(res.data?.challenge.origin).hostname;
      if (expected !== got) {
        throw new Error(`invalid token, origin mismatch: expected ${expected}, got ${got}`);
      }
    }

    if (res.success) {
      console.log("FriendlyCaptcha: accepted as human");
      success = true;
    } else {
      console.log("FriendlyCaptcha: rejected as bot");
    }
  } catch(err) {
    if (err === controller.signal.reason) {
      console.error("FriendlyCaptcha: validation timeout");
    } else {
      console.error(`FriendlyCaptcha: ${err}`);
    }
  }
  clearTimeout(timeoutId);
  
  if (!success) {
    throw new ActionError({code:"FORBIDDEN", message: "Captcha validation failed, try again later."});
  }
};