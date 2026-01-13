export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      const group = Math.random() < 0.5 ? "a" : "b";
      // Rewrite to the variant path
      return fetch(new Request(`${url.origin}/::${group}::1`, request));
    }

    // For other requests, proxy to your static site
    return fetch(request);
  }
};