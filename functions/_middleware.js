export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    const group = Math.random() < 0.5 ? "a" : "b";

    // Fetch the variant page
    const encodedFolder = encodeURIComponent(`::${group}::1`);
    const variantUrl = new URL(request.url);
    variantUrl.pathname = `/${encodedFolder}/`;

    // Fetch the static file from ASSETS
    const asset = await env.ASSETS.fetch(variantUrl);

    // Return the HTML
    return new Response(asset.body, {
      status: asset.status,
      headers: asset.headers
    });
  }

  return next();
}
