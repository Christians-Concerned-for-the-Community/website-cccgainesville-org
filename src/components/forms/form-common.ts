/**
 * Zod schema fields and error messages that are used across multiple forms.
 * 
 * Also has helper function to send form data to a webhook endpoint,
 * with retries and idempotency.
 * 
 * To use zod from here:
 *   import { z, zc } from "./form-common.ts"
 *   ...
 *   z.object {
 *     phone: zc.us_phone,
 *     email: zc.optional(zc.email),
 *     ...
 *   }
 * 
 * Notes on us_phone:
 *   This will accept a number of different US phone number formats, it's fairly
 *   lenient. Anything it accepts will be normalized to 555-555-5555, however.
 * 
 *   Examples of accepted inputs (not exhaustive):
 *    352-555-0132     <-- other variants will all be normalized to this one.
 *    (352) 555-0132
 *    352.555.0132
 *    352 555 0132
 *    3525550132
 *    tel:3525550132 <-- format seen when copy/pasting telephone number links.
 *    +13525550132
 *    tel+13525550132  <-- format seen when copy/pasting telephone number links.
 */
import { z } from 'astro/zod';
import { captchaImpl } from '@base/captcha.ts';
import { ActionError, defineAction } from 'astro:actions';
import { getSecret } from 'astro:env/server';
import crypto from 'node:crypto';

export { z } from 'astro/zod';

export const webhookHandler = <T extends z.ZodType>(
  formName: string,
  endpoint: string,
  schema: Record<string,T>,
) => {
  return defineAction({
    accept: 'form',

    input: z.looseObject(schema),

    handler: async (input, context) => {
      await captchaImpl.validate(input, context);
      await sendToWebhook(endpoint, formName, input);
    },
});
}

// Predefined limits for zod helpers for form validation (see zc below.
export const zclimits = {
  first_name: 40, // Salesforce length limit
  last_name: 80, // Salesforce length limit
  full_name: 255, // Salesforce length limit
  email: 80, // Salesforce length limit
  us_phone: 40, // for security, to prevent malicious actors from hammering the regex
}

const safe = (schema: z.ZodType) => (
  z.preprocess((v) => {
    if (typeof v === "string") {
      const vt = v.trim();
      return vt === ""? undefined : vt;
    }
    return v;
  }, schema
));

// Zod helpers for form validation.
export const zc = {
  full_name: safe(z
    .string("Enter your full name (John Smith).")
    .max(zclimits.full_name, `Enter a shorter full name (${zclimits.full_name} letters max).`)
  ),

  first_name: safe(z
    .string("Enter your first name (John).")
    .max(zclimits.first_name, `Enter a shorter first name (${zclimits.first_name} letters max).`)
  ),

  last_name: safe(z
    .string("Enter your last name (Smith).")
    .max(zclimits.last_name, `Enter a shorter last name (${zclimits.last_name} letters max).`)
  ),

  email: safe(z
    .email("Enter a valid email (jsmith@example.com)")
    .max(zclimits.email, `Enter a shorter email (${zclimits.email} letters max).`)
  ),

  us_phone: safe(z
    .string("Enter a valid phone number (352-555-0132).")
    .max(zclimits.us_phone)
    .regex(/^(tel:)?(\+1)?[\(]*[0-9]{3}[ .\-\)]*[0-9]{3}[ .\-]*[0-9]{4}$/,
      "Enter a valid phone number (352-555-0132).")
    .transform((phone)=> {
      // Remove all chars from phone number that aren't digits, then add dashes
      // at the right spots: xxx-xxx-xxxx
      const digits = phone.replace("tel:","").replace("+1","").replace(/\D/g, "");
      return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6,10)}`;
    })
  ),
  
  // An optional checkbox, properly converts the default data sent by native
  // FormData to a boolean true/false value.
  checkbox: z
    .preprocess((val) => val === 'on', z.boolean()),

  // A required checkbox, returns an error if the user didn't check it.
  // (Note that this is a function, to let you specify the error message)
  checkbox_required: (msg: string) => (z
    .preprocess((val) => val === 'on', z.literal(true, msg))
  ),

  // Pick one value from a list of options.
  single_pick: (options: Record<string,string>, msg: string) => safe(z
    .enum(Object.keys(options), msg)
  ),

  /*
    Fixes up form data by trimming whitespace, then replacing empty strings
    with undefined so that Zod sees the field as being unset. This makes
    .optional() work properly, and prevents us from having to add .min(1) in a
    lot of places. Also prevents needing to do string trimming on the client.

    The zc.* helpers already call safe internally where appropriate. Use zc.safe
    externally to wrap any direct calls you make with z.* functions.
  
    Example usage:
      zc.safe(z.string("Provide a string here! It's required"));
      zc.safe(z.string("This is optional.")).optional();
  */
  safe: (schema: z.ZodType) => safe(schema),
}

export const sendToWebhook = async (webhookUrlVar: string, formName: string, formData: Record<string,any>) => {
  const fetchTimeout = 10000; //10 seconds
  const backoffDelta = 5000; //5 seconds
  const maxAttempts = 3;

  const body = {
    form: formName,
    ts: new Date().toISOString(),
    id: crypto.randomUUID(),
    data: formData,
  }
  console.log(JSON.stringify(body, null, 2));

  const webhookUrl = getSecret(webhookUrlVar);
  if (!webhookUrl) {
    console.error(`Form ${formName}: missing destination for submission, forgot to set ${webhookUrlVar}?`);
    throw new ActionError({code:"SERVICE_UNAVAILABLE", message: "Could not save submission, try again later."});
  }

  let ok = false;
  for (let attempt = 1; attempt <= maxAttempts && !ok; attempt++) {
    if (attempt > 1) {
      console.warn(`Form ${formName}: retrying send, attempt ${attempt} of ${maxAttempts}`);
      // delay before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * backoffDelta));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      ok = response?.ok;
      if (!ok) {
        console.error(`Form ${formName}: bad response from webhook, [${response.status}] - ${response.statusText}`);
        console.error(`Body:\n${await response.text()}`);
      }
    } catch (err) {
      if (err === controller.signal.reason) {
        console.error(`Form ${formName}: validation timeout`);
      } else {
        console.error(`Form ${formName}: validation error: ${err}`);
      }
    }
    clearTimeout(timeoutId);
  }
  if (ok) {
    console.log(`Form ${formName}: successfully sent to webhook at ${webhookUrlVar}`);
  } else {
    throw new ActionError({code:"SERVICE_UNAVAILABLE", message: "Could not save submission, try again later."});
  }
}