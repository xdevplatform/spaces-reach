const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
const authorizeURL = 'https://api.twitter.com/oauth/authorize';
const requestTokenURL = 'https://api.twitter.com/oauth/request_token';

require('dotenv').config();
const request = require('request');
const util = require('util');
const qs = require('querystring');

const post = util.promisify(request.post);

async function accessToken({
  oauth_token,
  oauth_token_secret
}, {oauth_verifier}) {
  const oAuthConfig = {
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    token: oauth_token,
    token_secret: oauth_token_secret,
    verifier: oauth_verifier,
  };

  const req = await post({
    url: accessTokenURL,
    oauth: oAuthConfig
  });
  if (req.body) {
    return qs.parse(req.body);
  } else {
    throw new Error('Cannot get an OAuth request token');
  }
}

async function requestToken(callback) {
  if (!(callback instanceof URL)) {
    throw new TypeError('callback must be of type URL');
    return;
  }

  const oAuthConfig = {
    callback: callback.href,
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  };

  const req = await post({
    url: requestTokenURL,
    oauth: oAuthConfig
  });
  if (req.body) {
    return qs.parse(req.body);
  } else {
    throw new Error('Cannot get an OAuth request token');
  }
}

const getAuthorizeURL = (requestToken) => {
  if (!requestToken.oauth_token) {
    throw new TypeError('getAuthorizeURL: missing field oauth_token in requestToken');
    return;
  }

  const url = new URL(authorizeURL);
  url.searchParams.append('oauth_token', requestToken.oauth_token);
  return url;
};

module.exports = {accessToken, requestToken, getAuthorizeURL};