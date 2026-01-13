import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url } = context;

  if (url.pathname === "/") {
    const variant = Math.random() < 0.5 ? "a" : "b";
    return context.redirect(`/${variant}`, 302);
  }

  return next();
});
