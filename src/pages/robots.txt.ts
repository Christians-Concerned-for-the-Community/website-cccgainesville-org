// Outputs: /robots.txt
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
    // Advertise the requests below to every crawler.
    let content = 'User-agent: *\n';

    if (site?.hostname.startsWith('staging')) {
      // If we're building the staging version of the website, request that
      // no web crawling be done by search engines for this page.
      content += 'Disallow: /\n';

    } else {
      // Otherwise, make a production robots.txt that gives search engines
      // permission to index the site. Provide crawlers with the location of
      // our sitemap to make crawling easier/more accurate.
      const sitemapURL = new URL('sitemap-index.xml', site);
      content +=
          'Allow: /\n\n'
        + `Sitemap: ${sitemapURL.href}\n`;
    }

    return new Response(content);
  }