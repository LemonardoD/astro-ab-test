import { parse } from 'cookie';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const cookie = parse(request.headers.get('cookie') || '');

  if (cookie[env.AUTH_COOKIE_NAME] != null) {
    const url = new URL(request.url);

    // TODO change to with redirect to /transfer?code=${transferCode}
    const transferCode = url.searchParams.get('t');
    if (transferCode) {
      // redirect to /analytics with transferCode
      return new Response(null, {
        status: 302,
        headers: { Location: `/analytics?t=${transferCode}` },
      });
    }
    return new Response(null, {
      status: 302,
      headers: { Location: '/analytics' },
    });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (code) {
    // redirect to /analytics with code
    return new Response(null, {
      status: 302,
      headers: { Location: `/analytics?code=${code}` },
    });
  }

  // if (code) {
  //   try {
  //     const resp = await fetch(
  //       `${env.VITE_BASE_API_URL}/users/github-auth?code=${encodeURIComponent(code)}`,
  //       {
  //         method: 'GET',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       },
  //     );

  //     if (resp.ok) {
  //       const { token } = await resp.json<{ token: string }>();

  //       return new Response(null, {
  //         status: 302,
  //         headers: {
  //           'Set-Cookie': `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=None; Domain=${env.VITE_BASE_API_URL}; Max-Age=${60 * 60 * 24 * 365}`,
  //           Location: '/analytics',
  //         },
  //       });
  //     } else {
  //       return context.next();
  //     }
  //   } catch (e) {
  //     return context.next();
  //   }
  // }

  return context.next();
};
