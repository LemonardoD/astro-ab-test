import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url } = context;

  if (url.pathname === "/") {
    const group = Math.random() < 0.5 ? "a" : "b";
    return context.rewrite(`/::${group}::1`);
  }

  return next();
});
