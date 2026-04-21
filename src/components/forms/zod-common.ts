/**
 * Zod schema fields and error messages that are used across multiple forms.
 * 
 * To use:
 *   import { zc } from "./zod-common.ts"
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
 *   Examples of accepted inputs:
 *    352-555-0132     <-- other variants will all be normalized to this one.
 *    (352) 555-0132
 *    352.555.0132
 *    352 555 0132
 *    3525550132
 *    tel+13525550132  <-- format seen when copy/pasting telephone number links.
 */
import { z } from 'astro/zod';

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
    .string("Enter a valid phone number (352-555-0132)")
    .max(zclimits.us_phone)
    .regex(/^(tel:\+1)?[\(]*[0-9]{3}[ .\-\)]*[0-9]{3}[ .\-]*[0-9]{4}$/,
      "Enter a valid phone number (352-555-0132)")
    .transform((phone)=> {
      // Remove all chars from phone number that aren't digits, then add dashes
      // at the right spots: xxx-xxx-xxxx
      const digits = phone.replace("tel:+1","").replace(/\D/g, "");
      return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6,10)}`;
    }),


  /*
    Improved version of Zod's optional() that works better for forms by correctly
    interpreting the empty string as the field being unset.
  
    Example usage: zc.optional(zc.us_phone)
  */
  optional: (schema: z.ZodType) => (
    z.preprocess((v) => (v === "" ? undefined : v), schema.optional())
  ),
}