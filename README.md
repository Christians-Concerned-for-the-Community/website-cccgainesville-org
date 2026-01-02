# Main Website for Christians Concerned for the Community
## https://cccgainesville.org (production)
## https://staging.cccgainesville.org (staging)

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/small.svg)](https://astro.build)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)

This website is based on the [Accessible Astro Starter](https://github.com/incluud/accessible-astro-starter)
theme, version 4.3.1. You can find the documentation for the theme and components
[here](https://accessible-astro.incluud.dev/getting-started/introduction/).

## Common Places to Make Edits
 * [Home page](src/pages/index.astro)
 * [Services page](src/pages/about/services.astro)
 * [Give page](src/pages/give.astro)
 * [Volunteer page](src/pages/volunteer.astro)
 * [Contact page](src/pages/contact.astro)
 * [Navigation bar/menu](src/components/Header.astro)
 * [Color palette definition](src/assets/scss/base/_root.scss)

## Admin Links
 * [Cloudflare Deployments - Staging](https://dash.cloudflare.com/bd31516cf452a595955169731b95d1bf/workers/services/view/website-cccgainesville-org-staging/production/deployments)

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

## Why Accessible Astro?

This theme was built to help comply with web accessibility rules, such as
[WCAG 2.2 AA](https://www.levelaccess.com/blog/wcag-2-2-aa-summary-and-checklist-for-website-owners/),
the [European Accessibility Act](https://www.levelaccess.com/compliance-overview/european-accessibility-act-eaa/),
and modern web standards in general. This makes it easier for neighbors to use screen readers and
keyboard shortcuts when viewing our website, and the theme includes tools to make sure the color contrasts
used meet WCAG readability standards.

A series of legal cases in Gainesville in 2025 where local businesses were being sued for errors in
their websites' accessibility implementations also prompted this change.

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
for the development setup I use (Visual Studio Code and Ubuntu via WSL on Windows), but you can use
whatever setup you want - you just have to modify Step 1 for your OS.

1. Set up the development environment.
```console
sudo apt update && sudo apt install nvm gh git
nvm install node && nvm alias default node
gh auth login
git config --global user.email "your.email@cccgainesville.org"
git config --global user.name "Your Name"
```

2. Check out the code, install dependencies, and open visual studio code to make edits.
```console
git clone https://github.com/Christians-Concerned-for-the-Community/website-cccgainesville.org.git
cd website-cccgainesville.org
npm install
code .
```

3. Build the website and deploy it on localhost, so you can test it locally.
```console
npm run preview
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
