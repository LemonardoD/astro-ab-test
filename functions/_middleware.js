export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  if (url.pathname === "/") {
    const group = Math.random() < 0.5 ? "a" : "b";

    return fetch(new URL(`/${group}`, request.url), request);
  }

  return context.next();
}
