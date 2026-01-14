import { defineMiddleware } from "astro:middleware";
import { defaultLocale } from "./i18n/consts";

// Eagerly import all page modules to build route set
const pages = import.meta.glob<{
  getStaticPaths?: () => { params: Record<string, string | undefined> }[] | Promise<{ params: Record<string, string | undefined> }[]>;
}>("/src/pages/**/*.astro", { eager: true });

// Build set of all available routes by calling getStaticPaths on each page
async function buildAvailableRoutes(): Promise<Set<string>> {
  const routes = new Set<string>();

  for (const [path, mod] of Object.entries(pages)) {
    const match = path.match(/^\/src\/pages\/(.+)\.astro$/);
    if (!match) continue;

    const routeTemplate = match[1]!;

    if (typeof mod.getStaticPaths === "function") {
      try {
        const staticPaths = await mod.getStaticPaths();
        for (const p of staticPaths) {
          // Build path by replacing [...param] or [param] with actual values
          let route = routeTemplate;
          for (const [key, value] of Object.entries(p.params)) {
            // [...param] (rest/optional) or [param] (required)
            route = route.replace(`[...${key}]`, value ?? "");
            route = route.replace(`[${key}]`, value ?? "");
          }
          // Clean up: remove empty segments, normalize
          route = "/" + route.split("/").filter(Boolean).join("/");
          if (route !== "/" && !route.endsWith("/")) route += "/";
          // Handle index routes
          route = route.replace(/\/index\/?$/, "/");
          routes.add(route);
        }
      } catch {}
    } else {
      // Static page with no getStaticPaths
      let route = "/" + routeTemplate;
      route = route.replace(/\/index$/, "/");
      if (route !== "/" && !route.endsWith("/")) route += "/";
      routes.add(route);
    }
  }

  return routes;
}

const availableRoutes = await buildAvailableRoutes();

// Only process relative links that could be pages (no extension or .html)
function isPageLink(href: string): boolean {
  // Skip external, protocol, and anchor-only links
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) {
    return false;
  }
  if (href.startsWith("#") || href.includes(":")) {
    return false;
  }

  // Extract path without query/hash
  const path = href.split(/[?#]/)[0] ?? "";

  // Page links: no extension or .html
  const lastSegment = path.split("/").pop() ?? "";
  if (!lastSegment.includes(".")) return true;
  if (lastSegment.endsWith(".html")) return true;

  return false;
}

function normalizePath(path: string): string {
  const [basePath, suffix] = path.split(/([?#].*)$/);
  let normalized = basePath!;

  if (!normalized.startsWith("/")) {
    normalized = "/" + normalized;
  }
  if (!normalized.endsWith("/") && !normalized.includes(".")) {
    normalized = normalized + "/";
  }

  return normalized + (suffix || "");
}

function localizeHtml(html: string, locale: string, routes: Set<string>): string {
  if (locale === defaultLocale) {
    return html;
  }

  const hrefRegex = /(<a\s[^>]*href=["'])([^"']+)(["'][^>]*>)/gi;

  return html.replace(hrefRegex, (match, prefix, href, suffix) => {
    if (match.includes("hreflang") || match.includes("data-no-localize")) {
      return match;
    }

    if (!isPageLink(href)) {
      return match;
    }

    if (href.startsWith(`/${locale}/`) || href === `/${locale}`) {
      return match;
    }

    const normalizedHref = normalizePath(href);

    let localizedHref: string;
    if (normalizedHref === "/") {
      localizedHref = `/${locale}/`;
    } else {
      localizedHref = `/${locale}${normalizedHref}`;
    }

    const pathToCheck = localizedHref.split(/[?#]/)[0]!;

    // Only localize if the route exists
    if (!routes.has(pathToCheck)) {
      return match;
    }

    const querySuffix = normalizedHref.includes("?") || normalizedHref.includes("#") ? normalizedHref.slice(normalizedHref.search(/[?#]/)) : "";

    return prefix + pathToCheck + querySuffix + suffix;
  });
}

function getLocaleFromUrl(url: string): string {
  const parts = url.split("/").filter(Boolean);
  if (parts.length > 0 && /^[a-z]{2}$/.test(parts[0]!)) {
    return parts[0]!;
  }
  return defaultLocale;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("text/html")) {
    return response;
  }

  const locale = getLocaleFromUrl(context.url.pathname);
  if (locale === defaultLocale) {
    return response;
  }

  const html = await response.text();
  const localized = localizeHtml(html, locale, availableRoutes);

  return new Response(localized, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
});
