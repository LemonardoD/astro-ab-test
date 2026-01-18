export async function onRequest(context) {
  const { request, env } = context;

  // 1. List keys (names only)
  const { keys } = await env.EXPERIMENTS.list();
  if (!keys.length) {
    return context.next();
  }

  const keyNames = keys.map((k) => k.name);

  // 2. Fetch all values in ONE call
  const valuesMap = await env.EXPERIMENTS.get(keyNames);

  // 3. Build key:value,key:value
  const kvString = Array.from(valuesMap.entries())
    .filter(([, value]) => value !== null)
    .map(([key, value]) => `${key}:${value}`)
    .join(",");

  if (!kvString) {
    return context.next();
  }

  // 4. Continue request
  const response = await context.next();
  const newResponse = new Response(response.body, response);

  // 5. Only set cookie if changed
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const hasCookie = cookieHeader.includes(`experiments=${kvString}`);

  if (!hasCookie) {
    newResponse.headers.append("Set-Cookie", `experiments=${kvString}; Path=/; SameSite=Lax`);
  }

  return newResponse;
}
