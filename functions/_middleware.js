export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.pathname === "/") {
    const group = Math.random() < 0.5 ? "a" : "b";
    url.pathname = `${url.pathname}::${group}::1`;
    // Rewrite to the variant path
    return fetch(new Request(url, request));
  }

  // For other requests, proceed normally
  return next();
}
