export async function onRequest({ request, env }) {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    const group = Math.random() < 0.5 ? "a" : "b";

    // Point to the static HTML file
    const encodedFolder = encodeURIComponent(`::${group}::1`);
    const assetUrl = new URL(request.url);
    assetUrl.pathname = `/${encodedFolder}/`;

    // Fetch the asset from env.ASSETS
    const asset = await env.ASSETS.fetch(assetUrl);

    // Clone headers, fix Content-Type
    const headers = new Headers(asset.headers);
    headers.set("Content-Type", "text/html; charset=utf-8");

    // Return HTML directly — URL stays "/"
    return new Response(asset.body, {
      status: asset.status,
      headers
    });
  }

  return fetch(request); // other paths
}
