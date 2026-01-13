import { defineMiddleware } from "astro:middleware";

const cookieName = "ab-test-group";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, cookies } = context;

  if (url.pathname === "/") {
    let group = cookies.get(cookieName)?.value;

    if (!group) {
      group = Math.random() < 0.5 ? "a" : "b";
      cookies.set(cookieName, group, { path: "/", maxAge: 31536000 }); // 1 year
    }

    return context.rewrite(`/::${group}::1`);
  }

  return next();
});
