const cookieName = "ab-test-group";

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    let cookie = request.headers.get("cookie");
    let group;

    if (cookie && cookie.includes(`${cookieName}=`)) {
      // Extract group from cookie
      const match = cookie.match(new RegExp(`${cookieName}=([ab])`));
      group = match ? match[1] : "a"; // fallback
    } else {
      // Assign randomly
      group = Math.random() < 0.5 ? "a" : "b";
    }

    // Fetch the variant page
    const variantUrl = new URL(request.url);
    variantUrl.pathname = `/::${group}::1`;

    const asset = await env.ASSETS.fetch(variantUrl);
    const response = new Response(asset.body, asset);

    // Set cookie if not set
    if (!cookie || !cookie.includes(`${cookieName}=`)) {
      response.headers.append("Set-Cookie", `${cookieName}=${group}; path=/; max-age=31536000`); // 1 year
    }

    return response;
  }

  return next();
}
