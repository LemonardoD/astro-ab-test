export const onRequest = async (context) => {
  const { request, env } = context;

  // Get the API base URL from environment variables
  const apiBaseUrl = "https://userspace-be-production.up.railway.app";
  if (!apiBaseUrl) {
    return new Response("API_BASE_URL not configured", { status: 500 });
  }

  const url = new URL(request.url);
  const path = url.pathname + url.search;

  // Remove /api prefix from path
  const targetPath = path.replace(/^\/api/, "");

  const targetUrl = `${apiBaseUrl}${targetPath}`;

  // return new Response(targetUrl, {
  //   status: 200,
  // });
  // console.log('targetUrl', targetUrl);

  try {
    const requestHeaders = new Headers(request.headers);

    // Remove headers to avoid conflicts
    requestHeaders.delete("host");
    requestHeaders.delete("origin");
    requestHeaders.delete("referer");

    // Create new request with modified headers
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      redirect: "manual"
    });

    // Forward the request to the target API
    const response = await fetch(proxyRequest);

    // Clone the response to modify headers
    const responseHeaders = new Headers(response.headers);

    // Remove CORS headers from the target API response
    responseHeaders.delete("access-control-allow-origin");
    responseHeaders.delete("access-control-allow-methods");
    responseHeaders.delete("access-control-allow-headers");
    responseHeaders.delete("access-control-allow-credentials");
    responseHeaders.delete("access-control-expose-headers");
    responseHeaders.delete("access-control-max-age");

    // Create new response with modified headers
    const proxyResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });

    return proxyResponse;
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response("Proxy error", { status: 502 });
  }
};
