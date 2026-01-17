export async function onRequest(context) {
  const { request, env } = context;

  // Default experiments
  let experiments = { landing: "a", cta: "y" };

  // Try to load from KV if available
  if (env.EXPERIMENTS) {
    try {
      const kvData = await env.EXPERIMENTS.get("experiments");
      if (kvData) {
        const parsed = JSON.parse(kvData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          experiments = {};
          for (const pair of parsed) {
            const [exp, val] = pair.split(":");
            if (exp && val) experiments[exp.trim()] = val.trim();
          }
        }
      }
    } catch (error) {
      console.error("Error loading experiments from KV:", error);
    }
  }

  let response = await context.next();

  // Clone response to modify headers
  response = new Response(response.body, response);

  // Set individual experiment cookies
  for (const [exp, val] of Object.entries(experiments)) {
    const cookieName = `experiment-${exp}`;
    response.headers.append("Set-Cookie", `${cookieName}=${val}; Path=/`);
  }

  return response;
}
