import { basename, extname } from "node:path";

// Put actions in here.
export const server: Record<string, any> = {

}


// Automatically grab form handlers from each form, and add them to the server
// instance. Uses the filename without extension, prefixed by the word "handle",
// as the action name. E.g.: ContactForm.astro --> handleContactForm
const formModules = import.meta.glob("/src/components/forms/*Form.astro", {
  import: 'handleForm',
  eager: true,
});
for(const [path, func] of Object.entries(formModules)) {
  if (func) {
    server["handle"+basename(path, extname(path))] = func;
  } else {
    console.error(
`Can't find form handler in ${path}.
Form handler should be defined in the frontmatter like this:
 "export const handleForm = defineAction(...)"`);
  }
}