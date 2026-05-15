import type { ActionAPIContext } from 'astro:actions';

export const headersGetIp = (context: ActionAPIContext): (string | null | undefined) => {
  const hdrs = context.request.headers;
  return (
      // Cloudflare
      hdrs.get("CF-Connecting-IP") ||
      // AWS Cloudfront
      hdrs.get("CloudFront-Viewer-Address")?.replace(/:(\d+)$/,"") ||
      // Azure Front Door
      hdrs.get("X-Azure-ClientIP") ||
      // Fastly
      hdrs.get("Fastly-Client-IP") ||
      // Bunny.net, Nginx
      hdrs.get("X-Real-IP") ||
      // Generic
      hdrs.get("true-client-ip") ||
      hdrs.get("X-Forwarded-For") ||
      // The IP that directly made the request (if not proxied)
      context.clientAddress
  );
};

export const headersGetCountry = (context: ActionAPIContext): (string | null | undefined) => {
  const hdrs = context.request.headers;
  return (
    // Cloudflare
    hdrs.get("CF-IPCountry") ||
    // AWS Cloudfront
    hdrs.get("CloudFront-Viewer-Country") ||
    // Azure Front Door
    hdrs.get("geo-match") ||
    // Fastly
    hdrs.get("Fastly-Geo-Country-Code") ||
    // Bunny.net
    hdrs.get("CDN-RequestCountryCode") ||
    // Generic
    hdrs.get("X-Country-Code")
  );
}

export const headersGetJa4 = (context: ActionAPIContext): (string | null | undefined) => {
  const hdrs = context.request.headers;
  return (
    // Cloudflare (only available for Enterprise with Bot Management)
    (context.request?.cf?.botManagement as any)?.ja4 ||
    hdrs.get("cf-ja4") ||
    // AWS Cloudfront
    hdrs.get("CloudFront-Viewer-JA4-Fingerprint") ||
    // Azure Front Door
    hdrs.get("X-Azure-JA4-Fingerprint") ||
    // Bunny.net
    hdrs.get("CDN-JA4") ||
    // Generic
    hdrs.get('X-JA4') ||
    hdrs.get('X-JA4-Fingerprint')
  );
};