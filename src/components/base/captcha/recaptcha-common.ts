import type { ActionAPIContext } from "astro:actions";
import { getSecret } from "astro:env/server";
import { keyof } from "astro:schema";

// Arguments needed to create an assessment. Also returned as part of result.
// We're only specifying a subset of the fields here.
// See: https://docs.cloud.google.com/recaptcha/docs/reference/rest/v1/projects.assessments#Event
type AssessmentEvent = {
 event: {
    siteKey: string,
    token: string,
    expectedAction?: string,
    userAgent?: string,
    userIpAddress?: string,
    headers?: string[], //each header should be a string in key:value format
    ja4?: string,
 }, 
}

// Result returned from Google's create assessment endpoint (this is what
// replaced the legacy siteverify endpoint).
type Assessment = AssessmentEvent & {
 name: string,
 riskAnalysis: {
   reasons?: string[],
   extended_verdict_reasons?: string[],
   score: number,
   challenge?: "PASS" | "FAIL" | "NOCAPTCHA",
 },
 tokenProperties: {
   action: string,
   createTime: string,
   hostname: string,
   invalidReason: string,
   valid: boolean,
 }
}

// Function that performs the validation for all three types of reCAPTCHA
// tokens (score-based, checkbox, and policy).
// 1.0 -> definitely a human
// 0.0 -> definitely a bot
export const recaptchaValidate = async(
  input: Record<string, any>,
  context: ActionAPIContext,
  successThreshold: 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0 = 0.5,
  timeoutMs: number = 10000) => {
  
  let success = false;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
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

    const projectId = process.env.PUBLIC_CAPTCHA_ENDPOINT;
    if (!projectId) {
      throw new Error("project ID missing, forgot to set PUBLIC_CAPTCHA_ENDPOINT?");
    }

    const token = input["g-recaptcha-response"];
    if (!token) {
      throw new Error("token missing");
    }
    if (typeof token !== "string" || token.length > (2048*4)) {
      throw new Error("token invalid");
    }

    // ------------------------------
    // Construct the request payload.
    const request: AssessmentEvent = {event: {
      token: token,
      siteKey: sitekey,
      expectedAction: "BASE_SUBMIT",
    }};

    // get additional info from headers if available, to help identify bots:
    const hdrs = context.request.headers;

    // sort the headers by key for consistency, convert them to key:value format,
    request.event.headers = [...hdrs]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => `${key}:${value}`);

    const agent = hdrs.get("user-agent");
    if (agent) {
      request.event.userAgent = agent;
    }
    
    const ip =
      hdrs.get("CF-Connecting-IP") ||
      hdrs.get("X-Forwarded-For");
    if (ip) {
      request.event.userIpAddress = ip;
    }

    // Use ja4 fingerprints, if we find one in a header.
    const ja4 =
      // Cloudflare (only available for Enterprise with Bot Management)
      (context.request?.cf?.botManagement as any)?.ja4 ||
      hdrs.get("cf-ja4") ||
      // AWS Cloudfront
      hdrs.get("CloudFront-Viewer-JA4-Fingerprint") ||
      // Azure Front Door
      hdrs.get("X-Azure-JA4-Fingerprint") ||
      // Bunny.net
      hdrs.get("CDN-JA4") ||
      // Generic
      hdrs.get('X-JA4') ||
      hdrs.get('X-JA4-Fingerprint');

    if (ja4) {
      request.event.ja4 = ja4;
    }

    // ----------------------------------
    // Request an assessment from Google.
    const response = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${secret}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", },
        body: JSON.stringify(request),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`bad response from endpoint: [${response.status}] - ${response.statusText}`);
    }
    
    const res: Partial<Assessment> = await response.json();

    if (!res.tokenProperties?.valid) {
      throw new Error(`invalid token, reason: ${res.tokenProperties?.invalidReason}`);
    }
    
    if (res.event?.expectedAction !== res.tokenProperties.action) {
      throw new Error(
        `action mismatch, expected ${res.event?.expectedAction}, got ${res.tokenProperties.action}`
      );
    }

    const score = res.riskAnalysis?.score;
    if (score == null || typeof score !== "number") {
      throw new Error("risk analysis score missing or invalid");
    }
    
    if (score >= successThreshold) { //checking for success first ensures NaN won't register as pass
      console.log(`reCAPTCHA: accepted as human, score ${score} meets threshold ${successThreshold}`);
      success = true;
    } else {
      console.log(`reCAPTCHA: rejected as bot, score ${score} below threshold ${successThreshold}`);
    }
  } catch(err) {
    if (err === controller.signal.reason) {
      console.error("reCAPTCHA: validation timeout");
    } else {
      console.error(`reCAPTCHA: ${err}`);
    }
  }
  clearTimeout(timeoutId);
  return success;
}