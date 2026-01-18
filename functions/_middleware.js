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
  const { keys } = await env.EXPERIMENTS.list();
  if (!keys.length) return next();

  const configs = await env.EXPERIMENTS.get(keys.map((k) => k.name));
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const existingCookiesMap = parseExperimentsCookie(cookieHeader);
  let mutated = false;

  for (const [name, raw] of configs) {
    if (!raw) continue;

    let variants;
    try {
      variants = JSON.parse(raw);
    } catch {
      continue;
    }

    const current = existingCookiesMap.get(name);
    if (current && variants.some(({ variant }) => variant === current)) continue;

    const picked = pickWeightedVariant(variants, request, name);
    if (picked) {
      existingCookiesMap.set(name, picked);
      mutated = true;
    }
  }

  if (!mutated) return next();

  const res = new Response((await next()).body);
  const cookieValue = [...existingCookiesMap].map(([name, variant]) => `${name}:${variant}`).join(",");
  res.headers.set("Set-Cookie", `experiments=${cookieValue}; Path=/; SameSite=Lax`);

  return res;
}
