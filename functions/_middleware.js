function seededRandom(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0) / 4294967296;
}

function pickWeightedVariant(variants, request) {
  const total = variants.reduce((s, v) => s + v.probability, 0);
  if (total <= 0) return null;

  const seed = request.headers.get("CF-Connecting-IP") + request.headers.get("User-Agent");

  const rand = seededRandom(seed) * total;

  let acc = 0;
  for (const v of variants) {
    acc += v.probability;
    if (rand < acc) return v.variant;
  }

  return variants[variants.length - 1]?.variant ?? null;
}

function parseExperimentsCookie(cookieHeader) {
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
}

export async function onRequest(context) {
  const { request, env, next } = context;

  const { keys: experimentNames } = await env.EXPERIMENTS.list();
  if (!experimentNames.length) return next();

  const names = experimentNames.map(({ name }) => name);
  const experimetns = await env.EXPERIMENTS.get(names);

  let mutated = false;

  const cookieHeader = request.headers.get("Cookie") ?? "";
  const existingCookiesMap = parseExperimentsCookie(cookieHeader);

  for (const [name, rawConfig] of experimetns.entries()) {
    if (!rawConfig) continue;

    let variantsConfig;
    try {
      variantsConfig = JSON.parse(rawConfig);
    } catch {
      continue;
    }

    const variants = new Set(variantsConfig.map(({ variant }) => variant));
    const current = existingCookiesMap.get(name);

    // keep valid assignment
    if (current && variants.has(current)) continue;

    // assign missing or invalid
    const chosen = pickWeightedVariant(variantsConfig, request);
    if (chosen) {
      existingCookiesMap.set(name, chosen);
      mutated = true;
    }
  }

  if (!mutated) return next();

  const response = await next();
  const newResponse = new Response(response.body, response);

  const cookieValue = Array.from(existingCookiesMap.entries())
    .map(([name, variant]) => `${name}:${variant}`)
    .join(",");

  newResponse.headers.set("Set-Cookie", `experiments=${cookieValue}; Path=/; SameSite=Lax`);
  return newResponse;
}
