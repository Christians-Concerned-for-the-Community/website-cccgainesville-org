/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

/* Type for custom middleware functions (defined in middleware.ts). */
declare namespace App {
  interface Locals {
    id: (prefix: string) => string,
    first: (name: string) => boolean,
  }
}