import { basename, extname } from "node:path";

// Put actions in here.
export const server: Record<string, any> = {
  
}


// Automatically grab form handlers from each form, and add them to the server
// instance. Uses the filename without extension, prefixed by the word "handle",
// as the action name. E.g.: ContactForm.astro --> handleContactForm
const formModules = import.meta.glob("./components/forms/*Form.astro", {
  import: 'handleForm',
  eager: true,
});
for(const [path, func] of Object.entries(formModules)) {
  server["handle"+basename(path, extname(path))] = func;
}