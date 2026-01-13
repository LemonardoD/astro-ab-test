// Replace with your Pages site origin
const pagesOrigin = 'https://your-pages-site.pages.dev';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      const group = Math.random() < 0.5 ? "a" : "b";
      // Rewrite to the variant path on Pages site
      return fetch(new Request(`${pagesOrigin}/::${group}::1`, request));
    }

    // For other requests, proxy to your static site
    return fetch(new Request(`${pagesOrigin}${url.pathname}${url.search}`, request));
  }
};