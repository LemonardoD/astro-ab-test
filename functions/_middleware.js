export async function onRequest(context) {
  const { request, env } = context;
  console.log("🚀 ~ onRequest ~ env.EXPERIMENTS:", env.EXPERIMENTS);
  console.log(`🚀 ~ onRequest ~ env.EXPERIMENTS.get("experiments"):`, env.EXPERIMENTS.get("experiments"));

  // Uncomment below for KV-based experiments
  const experiments = [];

  let response = await context.next();

  if (!experiments.lenght) return response;
  // Clone response to modify headers
  response = new Response(response.body, response);

  // Check and update experiments cookie if needed
  const expString = experiments.join(",");
  const currentCookie = request.headers.get("cookie");
  const existingExp = currentCookie
    ?.split(";")
    .find((c) => c.trim().startsWith("experiments="))
    ?.split("=")[1];
  if (existingExp !== expString) {
    response.headers.append("Set-Cookie", `experiments=${expString}; Path=/`);
  }

  return response;
}
