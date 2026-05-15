import { defineAction } from 'astro:actions';
import { getSecret } from "astro:env/server";

import { statCounterSchema } from '@/components/StatCounter.astro';
import { headersGetIp, headersGetCountry } from "@base/utils/headers";

// Got from here: https://www.goatcounter.com/api2.html#post-/api/v0/count
type Request = {
  /**
   * Filter pageviews
   * 
   * Accepted values:
   * 
   *   ip: Ignore requests coming from IP addresses listed in "Settings → Ignore IP".
   *       Requires the IP field to be set.
   *
   * ["ip"] is used if this field isn't sent; send an empty array ([]) to not filter
   * anything.
   * 
   * The X-Goatcounter-Filter header will be set to a list of indexes if any pageviews
   * are filtered; for example:
   *   X-Goatcounter-Filter: 5, 10
   * 
   * This header will be omitted if nothing is filtered.
   */
  filter?: string[];

  /**
   * By default it's an error to send pageviews that don't have either a Session
   * or UserAgent and IP set. This avoids accidental errors.
   * 
   * When this option is set, GoatCounter will just silently ignore count requests
   * that don't have these parameters set.
   */
  no_sessions?: boolean;

  /**
   * The list of pageviews to report.
   */
  hits: [{
    /**
     * Path of the pageview (relative to site root), or the event name.
     * 
     * Ex: "/", "/about", "/forms/contact"
     */
    path: string;

    /**
     * Query parameters for this pageview, used to get campaign parameters.
     */
    query?: string;

    /**
     * Originating IP of request.
     * 
     * GC uses this for session management, bot detection, and also to get location
     * data if 'location' is not set.
     */
    ip?: string;

    /**
     * User-Agent header.
     * 
     * GC uses this for session management, and bot detection.
     */
    user_agent?: string;

    /**
     * Originating country of request, as ISO-3166-1 alpha2 string.
     * 
     * Ex: "NL", "ID", etc.
     */
    location?: string;

    /**
     * Referrer value, can be an URL (i.e. the Referal: header) or any string.
     */
    ref?: string;

    /**
     * Screen width in pixels.
     * 
     * For compatibility it also accepts the size as "width,height,scaling", but
     * the height and scaling are not used and this format is deprecated.
     */
    size?: number;

    /**
     * Time this pageview should be recorded at, as an ISO timestamp.
     * 
     * Ex: "1970-01-01T00:00:00.000Z"
     * 
     * This can be in the past, but not in the future.
     */
    created_at?: string;

    /**
     * Provide custom session ID.
     * 
     * Normally a session is calculated by GoatCounter automatically, based on
     * hash(User-Agent+IP+salt). However, if you don't send the IP address then
     * GC can't make a session ID for you.
     * 
     * In those cases, you can store your own session identifiers and send them
     * along. Note these will not be stored in the database as the sessionID (just
     * as the hashes aren't), they're just used as a unique grouping identifier.
     */
    session?: string;

    /**
     * Is this an event?
     * 
     * For basic page hits, this should be false or left blank. This is meant for
     * the client-side goatcounter API, where you can also track things like clicks
     * or other user actions.
     */
    event?: boolean;

    /**
     * Page title, or some descriptive event title.
     */
    title?: string;
    
    /**
     * Hint if you've determined that this should be considered a bot.
     * 
     * GoatCounter does its own bot detection, only use this if you have your
     * own insight that goat counter doesn't (like headers provided by Cloudflare
     * bot protection, that sort of thing).
     * 
     * Should be one of the JSBot*` constants from isbot; note the backend may
     * override this if it detects a bot using another method.
     * 
     * See: https://github.com/zgoat/isbot/blob/master/isbot.go#L28
     */
    bot?: 
      | 0  // NoBotKnown
      | 1  // NoBotNoMatch
      | 2  // BotPrefetch
      | 3  // BotLink
      | 4  // BotClientLibrary
      | 5  // BotKnownBot
      | 6  // BotBoty
      | 7  // BotShort
      | 8  // BotRangeAWS
      | 9  // BotRangeDigitalOcean
      | 10  // BotRangeServersCom
      | 11  // BotRangeGoogleCloud
      | 12  // BotRangeHetzner
      | 13  // BotRangeAzure
      | 14  // BotRangeAlibaba
      | 15  // BotRangeLinode
      | 150  // BotJSPhanton
      | 151  // BotJSNightmare
      | 152  // BotJSSelenium
      | 153  // BotJSWebDriver
    ;
  }]; // END hits param
}; // END type Request

// note: use the name "goatCart" instead of "goatCounter", to prevent the path
//       from getting flagged by ad blockers.
export const actionName = "goatCart";

export const goatCounter = {
  [actionName]: defineAction({
    accept: "form",

    input: statCounterSchema,

    handler: async(input, context) => {
      const hdrs = context.request.headers;

      const width = Number(input.screenSize ||
        hdrs.get("Sec-CH-Viewport-Width") ||
        hdrs.get("Viewport-Width") ||
        hdrs.get("Width") ||
        undefined
      );

      const request: Request = {
        hits: [{
          path: input.path,
          query: input.query,
          created_at: new Date().toISOString(),
          user_agent: hdrs.get("user-agent") || undefined,
          ip: headersGetIp(context) || undefined,
          location: headersGetCountry(context) || undefined,
          ref: input.referrer || hdrs.get("Referer") || undefined,
          title: input.title,
          size: Number.isFinite(width)? width : undefined,
        }]
      };

      // To improve stats accuracy, filter out non-US or unknown locations. We're
      // a small org, almost all our legit traffic is going to be from inside the US.
      if (request.hits[0].location !== "US") {
        console.log(`Dropping stats hit from non-US location:\n${JSON.stringify(request.hits[0],null,2)}`);
        return;
      }

      const endpoint = process.env.PUBLIC_GOATCOUNTER_ENDPOINT;
      if (!endpoint) {
        throw new Error("endpoint missing, forgot to set PUBLIC_GOATCOUNTER_ENDPOINT?");
      }
      const endpointUrl = new URL(endpoint);
      endpointUrl.protocol = "https:";
      endpointUrl.pathname = "/api/v0/count";
      
      const secret = getSecret("SECRET_GOATCOUNTER_KEY");
      if (!secret) {
        throw new Error("secret missing, forgot to set SECRET_GOATCOUNTER_KEY?");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        await fetch(endpointUrl.href, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${secret}`,
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
      } catch(e) {}
      clearTimeout(timeoutId);
    }
  })
}