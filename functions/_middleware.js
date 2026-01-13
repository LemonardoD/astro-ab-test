export async function onRequest(context) {
  const { request, next } = context;

  if (new URL(request.url).pathname === "/") {
    const group = Math.random() < 0.5 ? "a" : "b";
    return context.rewrite(`/::${group}::1`);
  }

  // Proceed with the rewritten request
  return next();
}
