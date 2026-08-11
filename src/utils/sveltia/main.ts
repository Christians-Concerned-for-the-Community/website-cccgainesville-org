import { init, type CmsConfig } from '@sveltia/cms';

import { siteConfig } from './site-config';

export const setupSveltia = (githubToken: string | undefined) => {
  // If we have a Github PAT available to use, store it in localStorage where
  // Sveltia puts its session data. This lets us log in without user interaction,
  // using the PAT.
  if (githubToken) {
    const userKey = "sveltia-cms.user";
    const userVal = localStorage.getItem(userKey);

    const user: Record<string,any> = userVal? JSON.parse(userVal) : {};
    user.backendName = "github";
    user.token = githubToken;

    localStorage.setItem(userKey, JSON.stringify(user));
  }

  const config: CmsConfig = {
    load_config_file: false,

    app_title: "CCC Website Editor",
    logo: {
      src: '/favicon.svg',
      show_in_header: true,
    },

    backend: {
      name: "github",
      repo: "Christians-Concerned-for-the-Community/website-cccgainesville-org",
    },

    media_folder: "src/assets/media",

    collections: [
      siteConfig,
    ]
  };

  init({config: config});
};