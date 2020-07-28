const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
const authorizeURL = 'https://api.twitter.com/oauth/authorize';
const requestTokenURL = 'https://api.twitter.com/oauth/request_token';

const qs = require('querystring');
const { URL } = require('url');
const {post} = require('../client');

const accessToken = async ({
  oauth_token,
  oauth_token_secret
}, {oauth_verifier}) => {
  const oAuthConfig = {
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    token: oauth_token,
    token_secret: oauth_token_secret,
  };

  const url = new URL(accessTokenURL);
  url.searchParams.append('oauth_token', oauth_token);
  url.searchParams.append('oauth_verifier', oauth_verifier);
  const req = await post({
    url: url.href,
    options: {
      oauth: oAuthConfig
    }
  });
  if (req.body) {
    return qs.parse(req.body);
  } else {
    throw new Error('Cannot get an OAuth access token');
  }
};

const requestToken = async (callback) => {
  if (!(callback instanceof URL)) {
    throw new TypeError('callback must be of type URL');
  }

  const oAuthConfig = {
    callback: callback.href,
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  };

  const req = await post({
    url: requestTokenURL,
    options: {
      oauth: oAuthConfig,
    }
  });

  if (req.statusCode !== 200) {
    console.log(req.body)
    try {
      const {code, message} = req.body.errors[0];
      throw new Error(`An error occurred while trying to get an OAuth request token: ${message} (Twitter code: ${code}, HTTP status: ${req.statusCode})`);
    } catch (e) {
      throw e;
    }
  }
  if (req.body) {
    return qs.parse(req.body);
  } else {
    throw new Error('Cannot get an OAuth request token');
  }
};

const getAuthorizeURL = (requestToken) => {
  if (!requestToken.oauth_token) {
    throw new TypeError('getAuthorizeURL: missing field oauth_token in requestToken');
  }

  const url = new URL(authorizeURL);
  url.searchParams.append('oauth_token', requestToken.oauth_token);
  return url;
};

module.exports = {accessToken, requestToken, getAuthorizeURL};