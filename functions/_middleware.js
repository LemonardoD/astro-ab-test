export async function onRequest(context) {
  const { request, next } = context;

  if (new URL(request.url).pathname === "/") {
    const group = Math.random() < 0.5 ? "a" : "b";
    // Rewrite by modifying the request URL
    request.url = request.url.replace(/\/$/, `/::${group}::1`);
  }

  // Proceed with the rewritten request
  return next();
}
