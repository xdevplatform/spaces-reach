import { accessToken, requestToken, getAuthorizeURL } from '../oauth-signature/index.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default (app, baseRoute = '/twitter') => {
  app.use(cookieParser());

  const baseRouteName = baseRoute.replace(/\/+$/, '');
  // const baseURL = `https://${process.env.PROJECT_DOMAIN}.${process.env.PROJECT_BASE_URL || 'glitch.me'}`;
  const baseURL = 'http://localhost:5000';
  const callbackURL = new URL(`${baseURL}${baseRouteName}/oauth-callback`);

  app.get(`${baseRouteName}/oauth`, async (request, response) => {
    try {
      const token = await requestToken(callbackURL);
      response.cookie('request_token', token);
      const authorizeURL = getAuthorizeURL(token);
      response.redirect(authorizeURL);
    } catch (e) {
      console.error(e);
      response.redirect(`${baseRouteName}/oauth-callback/error`);
    }
  });

  app.get(`${baseRouteName}/oauth-callback`, async (request, response) => {
    if (!request.query.oauth_verifier) {
      console.error('OAuth callback: no oauth_verifier');
      response.redirect('/');
      return;
    }

    try {
      const requestToken = request.cookies.request_token;
      const token = await accessToken(requestToken, request.query);

      response.cookie('access_token', token);

      response.redirect(`/oauth/login?oauth=1&user_id=${token.user_id}`);
    } catch (e) {
      console.error(e);
      response.redirect(`/oauth/login?oauth=1&error=true`);
    }
  });
}
