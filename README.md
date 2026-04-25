# Main Website for Christians Concerned for the Community

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/small.svg)](https://astro.build) &nbsp;
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) &nbsp;
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)

* ### https://staging.cccgainesville.org ← edits to [main branch](../../tree/main) show up here
* ### https://cccgainesville.org ← edits to [production branch](../../tree/production) show up here

&nbsp;

## Main Pages
 * [Home](src/pages/index.astro)
 * [Services](src/pages/services.astro)
 * [Give](src/pages/give.astro)
 * [Contact](src/pages/contact.astro)
 * [News](src/pages/news.astro)
 * [Volunteer](src/pages/volunteer.astro)
 * [Our Values](src/pages/our-values.astro)
 * [Documents](src/pages/documents.astro)

## Other Commonly-Edited Files
 * [Redirects](public/_redirects)
 * [HTTP Headers](public/_headers)
 * [robots.txt](src/pages/robots.txt.ts)
 * [Default page layout](src/layouts/DefaultLayout.astro)
 * [Navigation bar/menu](src/components/Header.astro)
 * [Color palette definition](src/assets/scss/base/_root.scss)

## Admin Links
 * [Cloudflare Deployments - Staging](https://dash.cloudflare.com/bd31516cf452a595955169731b95d1bf/workers/services/view/website-cccgainesville-org-staging/production/deployments)
 * [Cloudflare Deployments - Production](https://dash.cloudflare.com/bd31516cf452a595955169731b95d1bf/workers/services/view/website-cccgainesville-org-prod/production/deployments)

## Why Astro?

We used to use a WordPress site hosted with DreamHost. WordPress is a dynamic website solution -
when the user requests a page, it is generated with PHP behind the scenes right before it is delivered.
We then added caching plugins on top to make it faster. All this requires a separate server with its
own admin page and login, and a bunch of plugins that you have to check periodically to make sure that
they're still supported. There are many security vulnerabilities and performance hits inherent to this
model.

Instead, this project uses Astro as a static site generator. We rebuild the whole website
whenever something changes, and the only thing uploaded to the public server are the static files
(HTML, CSS, JS, copies of images) produced by the build. There's no public admin console to hack
into, no plugins, nothing but the site itself.

## What is this based on?

We ended up rolling our own [base components](src/components/base) after trying a few different libraries, because we
wanted to:
  * carefully evaluate and tune every accessibility feature
  * minimize the amount of javascript
  * prefer semantic HTML and modern CSS features, if included in [Baseline Widely Available](https://web.dev/how-to-use-baseline)
  * limit our npm dependencies
  * not add any code without knowing precisely *why* it's needed.

We took inspiration for accessibility behavior and component design from the following projects, any of which
we'd happily recommend others to use:
  * [Accessible Astro Starter](https://github.com/incluud/accessible-astro-starter)
  * [Starwind UI](https://starwind.dev/)
  * [Flowbite](https://flowbite.com/docs/getting-started/introduction/)

The following blogs were very helpful for accessibility tuning:
  * [Adrian Roselli](https://adrianroselli.com/posts)
  * [Scott O'Hara](https://www.scottohara.me/)
  * [Susanna Celso](https://plousia.com/blog)
  * [Pope Tech](https://www.pope.tech/) - especially posts on [form validation](https://blog.pope.tech/2025/09/30/accessible-form-validation-with-examples-and-code/) and [main nav](https://blog.pope.tech/2024/01/30/how-to-create-accessible-navigations-and-sub-menus/)
  * [UK Design System](https://design-system.service.gov.uk/patterns/validation/)

A series of [legal cases](https://www.mainstreetdailynews.com/news/local/gainesville-businesses-ada-lawsuits)
in Gainesville where local businesses were being sued for errors in their websites' accessibility
implementations brought the need for a more accessible website to our attention. It's especially important
for our organization because many of the neighbors we serve are elderly and/or have serious health issues,
and we want to do a better job of serving them.

## Okay, so how does this stuff here in GitHub wind up on cccgainesville.org?

Astro is a static site generator, which means that the code in this repo is used to produce a package
of static html, CSS, and JS files that are then uploaded to Cloudflare. Cloudflare caches these files
and serves them to any user who wishes to view them. This removes the need to have a separate hosting
server that manages the files. It's also very fast, and very secure.

Whenever a new commit is made to this GitHub repo, Cloudflare will automatically pull in the changes,
rebuild the site, and upload it to the internet for us.

Commits made to the main branch of the repo will be displayed at "staging.cccgainesville.org". Once
you've made sure the new version of the website displays correctly, and you've fixed any bugs, rebase
the "production" branch on the main branch to update the main website at "cccgainesville.org".

## Setup - Local Development

Follow these instructions if you're a developer and need to make a lot of changes. They're written
for the development setup I (Stephen) use (Visual Studio Code and Ubuntu via WSL on Windows), but you
can use whatever setup you want - you just have to modify Step 1 for your OS.

1. Set up the development environment.
```console
sudo apt update && sudo apt install gh git
curl -fsSL https://get.pnpm.io/install.sh | sh -
pnpm env use --global lts
gh auth login
git config --global user.email "your.email@cccgainesville.org"
git config --global user.name "Your Name"
```

2. Check out the code, install dependencies, and open visual studio code to make edits.
```console
git clone https://github.com/Christians-Concerned-for-the-Community/website-cccgainesville.org.git
cd website-cccgainesville.org
pnpm install
code .
```

3. Build the website and deploy it on localhost, so you can test it locally (follow prompts in console).
```console
pnpm dev
```

4. Commit changes to the main branch (automatically deploys to https://staging.cccgainesville.org).
```console
git add .
git commit -m "describe your changes here"
git push
```

5. Upload to the production branch (automatically deploys to https://cccgainesville.org).
```console
git checkout production && git pull --rebase origin main && git push && git checkout -
```
