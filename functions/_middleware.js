export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.pathname === "/") {
    const group = Math.random() < 0.5 ? "a" : "b";
    const newUrl = request.url.replace(/\/$/, `/::${group}::1`);
    return fetch(new Request(newUrl, request));
  }

  return next();
}
