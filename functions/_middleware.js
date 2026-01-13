// Pages functions for A/B testing
const pagesOrigin = 'https://astro-ab-test.pages.dev';

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.pathname === "/") {
    const group = Math.random() < 0.5 ? "a" : "b";
    // Rewrite to the variant path
    return fetch(new Request(`${pagesOrigin}/::${group}::1`, request));
  }

  // For other requests, proceed normally
  return next();
}