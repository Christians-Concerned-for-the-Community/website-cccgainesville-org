/**
 * Contains "preconnect" and "validate" for Cloudflare Turnstile.
 */

import { ActionError, type ActionAPIContext } from "astro:actions";
import { getSecret } from "astro:env/server";
import crypto from 'node:crypto';

export const preconnect = "https://challenges.cloudflare.com";

// Inner helper for turnstile validation.
const turnstileAttempt = async (params:{token: string, secret: string, ip: string, idemKey: string, timeout?: number}) => {
  const {token, secret, ip, idemKey, timeout=10000} = params;

  type TurnstileResp = {
    "success": boolean,
    "error-codes"?: string[],
    [key: string]: any, // allow any extra fields
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const res = {
    responseOk: false,
    success: false
  }
  try {
    const formData = new FormData();
    formData.append("secret", secret);
    formData.append("response", token);
    formData.append("remoteip", ip);
    formData.append("idempotency_key", idemKey);

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
        signal: controller.signal,
      },
    );

    if (response.ok) {
      res.responseOk = true;

      const result = (await response.json()) as TurnstileResp;
      res.success = result.success;
      if (result['error-codes']) {
        for (const err of result['error-codes']) {
          console.error(`Turnstile: ${err}`);
        }
      }
    } else {
      console.error(`Turnstile: [${response.status}]: ${response.statusText}`);
    }
  } catch (err) {
    if (err === controller.signal.reason) {
      console.error("Turnstile: validation timeout");
    } else {
      console.error("Turnstile: validation error: ", err);
    }
  }
  clearTimeout(timeoutId);
  return res;
};


// Main entry for turnstile validation.
export const validate = async (input: Record<string, any>, context: ActionAPIContext) => {

  const secret = getSecret("SECRET_CAPTCHA_KEY");
  if (!secret) {
    console.error("Turnstile: secret missing");
    throw new ActionError({code:"FORBIDDEN", message: "Turnstile validation failed, try again later."});
  }

  const token = input["cf-turnstile-response"];
  if (!token || typeof token !== "string" || token.length > (2048*4)) {
    console.error("Turnstile: token missing or invalid");
    throw new ActionError({code:"FORBIDDEN", message: "Turnstile validation failed, try again later."});
  }

  // Unique identifier for this request - lets us safely retry the request if
  // the response wasn't received due to some network issue.
  const idemKey = crypto.randomUUID();

  const ip =
    context.request.headers.get("CF-Connecting-IP") ||
    context.request.headers.get("X-Forwarded-For") ||
    "unknown";

  let res = {responseOk: false, success: false};
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts && !res.responseOk; attempt++) {
    if (attempt > 1) {
      console.warn(`Turnstile: retrying, attempt ${attempt} of ${maxAttempts}`);
      // delay before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
    res = await turnstileAttempt({
      token: token,
      secret: secret,
      ip: ip,
      idemKey: idemKey,
    });
  }

  if (!res.success) {
    throw new ActionError({code:"FORBIDDEN", message: "Turnstile validation failed, try again later."})
  }
}