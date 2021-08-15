import fetch from 'node-fetch';

const exchangeToken = async (code, callback = process.env.REDIRECT_URI) => {
  const url = 'https://api.twitter.com/2/oauth2/token';
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', process.env.TWITTER_CLIENT_ID);
  params.append('redirect_uri', callback);
  params.append('code_verifier', 'challenge');
  params.append('code', code);
  
  const response = await fetch(url, {method: 'POST', body: params});
  const json = await response.json();
  return json;
}

const refreshToken = async (token, callback = process.env.REDIRECT_URI) => {
  const url = 'https://api.twitter.com/2/oauth2/token';
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', process.env.TWITTER_CLIENT_ID);
  params.append('redirect_uri', callback);
  params.append('refresh_token', token);
  
  const response = await fetch(url, {method: 'POST', body: params});
  const json = await response.json();
  return json;
}

const revokeToken = async (token) => {
  const url = 'https://api.twitter.com/2/oauth2/revoke';
  const params = new URLSearchParams();
  params.append('client_id', process.env.TWITTER_CLIENT_ID);
  params.append('token', token);
  params.append('token_type_hint', 'access_token');
  
  const response = await fetch(url, {method: 'POST', body: params});
  const json = await response.json();
  console.log(json);
  return json;
}

export { exchangeToken, refreshToken, revokeToken };