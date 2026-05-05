import { defineAction } from 'astro:actions';
import { z } from "astro/zod";

export const formTester = {
  formTester: defineAction({
    input: z.looseObject({
      form: z.string(),
      ts: z.iso.datetime(),
      id: z.uuid(),
      data: z.record(z.string(), z.any())
    }),

    handler: async(input, context) => {
      console.log("--FormTester------");
      console.log(JSON.stringify(input, null, 2));
      console.log("--END FormTester--");
    }
  })
}