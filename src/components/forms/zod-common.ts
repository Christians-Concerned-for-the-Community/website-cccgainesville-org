/**
 * Zod schema fields and error messages that are used across multiple forms.
 * 
 * Also has helper function to send form data to a webhook endpoint,
 * with retries and idempotency.
 * 
 * To use zod from here:
 *   import { z, zc } from "./zod-common.ts"
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
import { validateCaptcha } from '@/components/base';
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
      await validateCaptcha(input, context);
      await sendToWebhook(endpoint, formName, input);
    },
});
}

export const zclimits = {
  full_name: 255, // Salesforce length limit
  email: 80, // Salesforce length limit
  us_phone: 40, // for security, to prevent malicious actors from hammering the regex
}

export const zc = {
  full_name: z
    .string("Enter your full name (John Smith).")
    .max(zclimits.full_name, `Enter a shorter name (${zclimits.full_name} letters max).`),

  email: z
    .email("Enter a valid email (jsmith@example.com)")
    .max(zclimits.email, `Enter a shorter email (${zclimits.email} letters max).`),

  us_phone: z
    .string("Enter a valid phone number (352-555-0132).")
    .max(zclimits.us_phone)
    .regex(/^(tel:)?(\+1)?[\(]*[0-9]{3}[ .\-\)]*[0-9]{3}[ .\-]*[0-9]{4}$/,
      "Enter a valid phone number (352-555-0132).")
    .transform((phone)=> {
      // Remove all chars from phone number that aren't digits, then add dashes
      // at the right spots: xxx-xxx-xxxx
      const digits = phone.replace("tel:","").replace("+1","").replace(/\D/g, "");
      return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6,10)}`;
    }),

  checkbox: z
    .preprocess((val) => val === 'on', z.boolean()),

  checkbox_required: (msg: string) => { return z
    .preprocess((val) => val === 'on', z.literal(true, msg))
  },


  /*
    Improved version of Zod's optional() that works better for forms by correctly
    interpreting the empty string as the field being unset.
  
    Example usage: zc.optional(zc.us_phone)
  */
  optional: (schema: z.ZodType) => (
    z.preprocess((v) => (v === "" ? undefined : v), schema.optional())
  ),
}

export const sendToWebhook = async (webhookUrlVar: string, formName: string, formData: Record<string,any>) => {
  const body = {
    form: formName,
    ts: new Date().toISOString(),
    id: crypto.randomUUID(),
    data: formData,
  }
  console.log(JSON.stringify(body, null, 2));

  const webhookUrl = getSecret(webhookUrlVar);
  if (!webhookUrl) {
    console.error(`Form ${formName}: missing destination for submission, forgot to set SECRET_FORM_DEST_CONTACT?`);
    return false;
  }

  const maxAttempts = 4;
  let ok = false;
  for (let attempt = 1; attempt <= maxAttempts && !ok; attempt++) {
    if (attempt > 1) {
      console.warn(`Form ${formName}: retrying send, attempt ${attempt} of ${maxAttempts}`);
      // delay before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 10000));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
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