/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

/* Type for Astro.locals.id function (defined in middelware.ts). */
declare namespace App {
  interface Locals {
    id: (prefix: string) => string
  }
}