const seededRandom = (seed) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0) / 4294967296;
};

const pickWeightedVariant = (variants, request, name) => {
  let total = 0;
  for (const { probability } of variants) total += probability;
  if (!total) return null;

  const seed = name + request.headers.get("CF-Connecting-IP") + request.headers.get("User-Agent");

  let random = seededRandom(seed) * total;

  for (const { variant, probability } of variants) {
    if ((random -= probability) < 0) return variant;
  }

  return variants.at(-1)?.variant ?? null;
};

const parseExperimentsCookie = (cookieHeader) => {
  const map = new Map();

  const cookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("experiments="));

  if (!cookie) return map;

  const value = cookie.replace("experiments=", "");
  if (!value) return map;

  for (const pair of value.split(",")) {
    const [key, variant] = pair.split(":");
    if (key && variant) map.set(key, variant);
  }

  return map;
};

export async function onRequest({ request, env, next }) {
  const countryCode = request.cf?.country || request.headers.get("CF-IPCountry");

  const cookieHeader = request.headers.get("Cookie") || "";

  const originalResponse = await next();

  const cookieCountryCode = cookieHeader
    .split("; ")
    .find((row) => row.startsWith("countryCode="))
    ?.split("=")[1];

  const response = new Response(originalResponse.body, originalResponse);

  response.headers.set("Set-Cookie", `countryCode=${countryCode}; Path=/; SameSite=Lax;`);

  return response;
}
