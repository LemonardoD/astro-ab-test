export async function onRequest({ request }) {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    const group = Math.random() < 0.5 ? "a" : "b";

    const file = group === "a" ? "/::a::1.html" : "/::b::1.html";

    return fetch(new URL(file, request.url));
  }

  return fetch(request);
}
