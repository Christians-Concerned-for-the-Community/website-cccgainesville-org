import type { CmsConfig } from '@sveltia/cms';
type Collection = NonNullable<CmsConfig["collections"]>[number];

export const siteConfig: Collection = {
    label: "Site Configuration",
    name: "config",
    icon: "public",
    editor: { preview: false },
    files: [
      {
        label: "Contact Info",
        name: "contactInfo",
        icon: "contact_page",
        file: "src/assets/contact-info.json",
        fields: [
          {
            label: "Email",
            name: "email",
            widget: "string",
            comment: "Public email, leave empty to hide on website<br>Example: *office@example.<span>com</span>*",
            type: "email",
            required: false,
          },
          {
            label: "Phone",
            name: "phone",
            widget: "string",
            comment: "Public phone number, leave empty to hide on website<br>Example: *352-555-0132*",
            pattern: /^(tel:)?(\+1)?[\(]*[0-9]{3}[ .\-\)]*[0-9]{3}[ .\-]*[0-9]{4}$/,
            required: false,
          },
          {
            label: "Mailing Address",
            name: "address",
            widget: "string",
            comment: "Public mailing address, leave empty to hide on website<br>Example: *PO Box 12345, Anytown, FL 12345*",
            required: false,
          },
          {
            label: "Office Hours",
            name: "hours",
            widget: "string",
            comment: "Public office hours, leave empty to hide on website<br>Example: *Tuesday - Thursday, 9:00AM - 5:00PM*",
            required: false,
          }
        ],
      },
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
            },
            {
              label: "URL",
              name: "href",
              widget: "string",
              default: "/",
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
          preview: false,
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
          preview: false,
        }],
      },
    ],
  }