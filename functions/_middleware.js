export async function onRequest(context) {
  const { request } = context;

  // Hardcoded global experiments
  const experiments = ["landing:a", "cta:y"];

  // Uncomment below for KV-based experiments
  // const experiments = await EXPERIMENTS.get('experiments') ? JSON.parse(await EXPERIMENTS.get('experiments')) : [];

  let response = await context.next();

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
    response.headers.append("Set-Cookie", `experiments=${expString}; Path=/; HttpOnly`);
  }

  return response;
}
