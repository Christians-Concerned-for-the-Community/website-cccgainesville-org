import type { CmsConfig } from '@sveltia/cms';
type Collection = NonNullable<CmsConfig["collections"]>[number];

export const siteConfig: Collection = {
    label: "Site Configuration",
    name: "config",
    icon: "public",
    editor: { preview: false },
    files: [
      {
        label: "Navigation Menu",
        name: "nav",
        icon: "menu_open",
        file: "src/assets/nav.json",
        fields: [{
          label: "Nav Menu Link",
          name: "body",
          widget: "list",
          root: true,
          collapsed: true,
          min: 2,
          max: 8,
          fields: [
            {
              label: "Link Title",
              name: "label",
              widget: "string",
              required: true,
            },
            {
              label: "URL",
              name: "href",
              widget: "string",
              default: "/",
              required: true,
              before_input: "https://cccgainesville.org",
            },
          ],
        }],
      },

      {
        label: "Headers",
        name: "headers",
        icon: "label_important",
        file: "public/_headers",
        format: "raw",
        fields: [{
          label: "Headers",
          name: "body",
          widget: "code",
          default_language: "apacheconf",
          output_code_only: true,
          allow_language_selection: false,
        }],
      },

      {
        label: "Redirects",
        name: "redirects",
        icon: "airline_stops",
        file: "public/_redirects",
        format: "raw",
        fields: [{
          label: "Redirects",
          name: "body",
          widget: "code",
          default_language: "apacheconf",
          output_code_only: true,
          allow_language_selection: false,
        }],
      },
    ],
  }