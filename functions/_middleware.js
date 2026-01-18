// Global cache for experiment config
let experimentConfig = null;

function getVariant(variants) {
  const total = Object.values(variants).reduce((sum, pct) => sum + pct, 0);
  const random = Math.random() * total;
  let cumulative = 0;
  for (const [variant, pct] of Object.entries(variants)) {
    cumulative += pct;
    if (random < cumulative) {
      return variant;
    }
  }
  return Object.keys(variants)[0]; // fallback
}

function parseCookie(cookieString) {
  const cookies = {};
  if (!cookieString) return cookies;
  for (const cookie of cookieString.split(";")) {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies[name] = value;
    }
  }
  return cookies;
}

export async function onRequest(context) {
  const { request, env, next } = context;

  // Load experiment config from KV if not cached
  if (!experimentConfig) {
    const { keys } = await env.EXPERIMENTS.list();
    if (keys.length > 0) {
      const keyNames = keys.map(({ name }) => name);
      const values = await env.EXPERIMENTS.get(keyNames);
      experimentConfig = {};
      for (const keyName of keyNames) {
        if (values[keyName]) {
          try {
            experimentConfig[keyName] = JSON.parse(values[keyName]);
          } catch (e) {}
        }
      }
    } else {
      experimentConfig = {}; // empty if no keys
    }
  }

  // If no experiments, skip
  if (Object.keys(experimentConfig).length === 0) return next();

  const response = await next();
  const newResponse = new Response(response.body, response);

  const cookies = parseCookie(request.headers.get("Cookie"));
  const currentExperiments = cookies.experiments ? cookies.experiments.split(",") : [];
  const experimentMap = {};
  for (const exp of currentExperiments) {
    const [key, value] = exp.split(":");
    if (key && value) {
      experimentMap[key] = value;
    }
  }

  const updatedExperiments = { ...experimentMap };
  let hasNewAssignment = false;

  // Assign variants for all experiments
  for (const [expName, expConfig] of Object.entries(experimentConfig)) {
    if (!(expName in updatedExperiments)) {
      updatedExperiments[expName] = getVariant(expConfig);
      hasNewAssignment = true;
    }
  }

  if (hasNewAssignment) {
    const kvString = Object.entries(updatedExperiments)
      .map(([key, value]) => `${key}:${value}`)
      .join(",");
    newResponse.headers.append("Set-Cookie", `experiments=${kvString}; Path=/; SameSite=Lax`);
  }

  return newResponse;
}
