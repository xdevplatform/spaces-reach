import { exchangeToken, refreshToken, revokeToken } from '../oauth2/index.js';

export default (app, baseRoute = '/twitter', redirectURI = `${process.env.BASE_URL}/oauth2/oauth-callback`) => {
  app.get(`${baseRoute}/refresh`, async (request, response) => {
    if (!request.cookies.token) {
      return response.status(400).json({error: 'Could not find a token to refresh in your browser session.'});
    }
    
    const tokenData = await refreshToken(request.cookies.token.refresh_token);
    if (tokenData.error) {
      response.status(400).json({error: tokenData.error});
      return;
    }
    
    tokenData.expires_at = new Date().getTime() + (tokenData.expires_in * 1000);
    response.cookie('token', tokenData);
    response.json({refresh: true, token: tokenData});
  });  

  app.get(`${baseRoute}/authorize`, (request, response) => {
    const state = new Date().getTime() * (1 + Math.random());
    response.cookie('state', state);
    const url = new URL('https://twitter.com/i/oauth2/authorize');
    
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('client_id', process.env.TWITTER_CLIENT_ID);
    url.searchParams.append('redirect_uri', redirectURI);
    url.searchParams.append('scope', 'users.read tweet.read space.read offline.access');
    // We implement the PCKE extension for additional security.
    // Here, we're passing a randomly generate state parameter, along
    // with a code challenge. In this example, the code challenge is
    // a plain string, but s256 is also supported.
    url.searchParams.append('state', state);
    url.searchParams.append('code_challenge', 'challenge');
    url.searchParams.append('code_challenge_method', 'plain');
    response.redirect(url.toString());
  });

  app.get(`${baseRoute}/oauth-callback`, async (request, response) => {  
    if (request.query.error) {
      return response.redirect(`/oauth/login?oauth=2&error=${encodeURIComponent(request.query.error)}`);
    }
    
    if (request.query.state !== request.cookies.state) {
      return response.redirect(`/oauth/login?oauth=2&error=${encodeURIComponent('State does not match')}`);
    }
    
    if (request.query.state && request.query.code) {
      // exchange token for code
      const tokenData = await exchangeToken(request.query.code, redirectURI);
      console.log(tokenData);
      tokenData.expires_at = new Date().getTime() + (tokenData.expires_in * 1000);
      response.clearCookie('state');
      response.cookie('token', tokenData);
      return response.redirect(`/oauth/login?oauth=2&success=true`);
    }
  });
  
  app.get('/oauth/refresh', async (request, response) => {
    if (!request.cookies.token) {
      return response.status(400).json({error: 'Could not find a token to refresh in your browser session.'});
    }
    
    const tokenData = await refreshToken(request.cookies.token.refresh_token);
    if (tokenData.error) {
      response.status(400).json({error: tokenData.error});
      return;
    }
    
    tokenData.expires_at = new Date().getTime() + (tokenData.expires_in * 1000);
    response.cookie('token', tokenData);
    response.json({refresh: true, token: tokenData});
  });

  app.get(`${baseRoute}/revoke`, async (request, response) => {
    if (!request.cookies.token) {
      response.json({revoked: true});
    } else {
      const r = await revokeToken(request.cookies.token.access_token);
      response.clearCookie('token');
      response.json(r);  
    }
  });
}