export async function onRequest({ request, next }) {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    const group = Math.random() < 0.5 ? "a" : "b";

    return fetch(new URL(`/::${group}::1`, request.url), request);
  }

  return next();
}
