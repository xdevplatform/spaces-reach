const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
const authorizeURL = 'https://api.twitter.com/oauth/authorize';
const requestTokenURL = 'https://api.twitter.com/oauth/request_token';

require('dotenv').config();
const qs = require('querystring');
const { URL } = require('url');
const crypto = require('crypto');
const {post} = require('../client');

async function accessToken({
  oauth_token,
  oauth_token_secret
}, {oauth_verifier}) {
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
}

async function requestToken(callback) {
  if (!(callback instanceof URL)) {
    throw new TypeError('callback must be of type URL');
  }

  const oAuthConfig = {
    callback: callback.href,
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    token: process.env.TWITTER_ACCESS_TOKEN,
    token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  };

  const req = await post({
    url: requestTokenURL,
    options: {
      oauth: oAuthConfig,
    }
  });

  if (req.statusCode !== 200) {
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
}

const getAuthorizeURL = (requestToken) => {
  if (!requestToken.oauth_token) {
    throw new TypeError('getAuthorizeURL: missing field oauth_token in requestToken');
  }

  const url = new URL(authorizeURL);
  url.searchParams.append('oauth_token', requestToken.oauth_token);
  return url;
};

const encode = (str) =>
  encodeURIComponent(str)
    .replace(/!/g,'%21')
    .replace(/\*/g,'%2A')
    .replace(/\(/g,'%28')
    .replace(/\)/g,'%29')
    .replace(/'/g,'%27');

const oAuthFunctions = {
  nonceFn: () => crypto.randomBytes(16).toString('base64'),
  timestampFn: () => Math.floor(Date.now() / 1000).toString(),
};

const setNonceFn = (fn) => {
  if (typeof fn !== 'function') {
    throw new TypeError(`OAuth: setNonceFn expects a function`)
  }

  oAuthFunctions.nonceFn = fn;
};

const setTimestampFn = (fn) => {
  if (typeof fn !== 'function') {
    throw new TypeError(`OAuth: setTimestampFn expects a function`)
  }

  oAuthFunctions.timestampFn = fn;
}

const parameters = (url, auth, body = {}) => {
  let params = {};

  const urlObject = new URL(url);
  for (const key of urlObject.searchParams.keys()) {
    params[key] = urlObject.searchParams.get(key);
  }

  if (typeof body === 'string') {
    body = qs.parse(body);
  }

  if (Object.prototype.toString.call(body) !== '[object Object]') {
    throw new TypeError('OAuth: body parameters must be string or object');
  }

  params = Object.assign(params, body);

  if (auth.callback) {
    params.oauth_callback = auth.callback;
  }

  params.oauth_consumer_key = auth.consumer_key;
  params.oauth_token = auth.token;
  params.oauth_nonce = oAuthFunctions.nonceFn();
  params.oauth_timestamp = oAuthFunctions.timestampFn();
  params.oauth_signature_method = 'HMAC-SHA1';
  params.oauth_version = '1.0';

  return params;
}

const parameterString = (url, auth, params) => {
  const sortedKeys = Object.keys(params).sort();

  let sortedParams = [];
  for (const key of sortedKeys) {
    sortedParams.push(`${key}=${encode(params[key])}`);
  }

  return sortedParams.join('&');  
}

const hmacSha1Signature = (baseString, signingKey) => 
  crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');

const signatureBaseString = (url, method, paramString) => {
  const urlObject = new URL(url);
  const baseURL = urlObject.origin + urlObject.pathname;
  return `${method.toUpperCase()}&${encode(baseURL)}&${encode(paramString)}`;
}

const createSigningKey = ({consumer_secret, token_secret}) => `${encode(consumer_secret)}&${encode(token_secret)}`;

const header = (url, auth, signature, params) => {
  params.oauth_signature = signature;
  const sortedKeys = Object.keys(params).sort();

  const sortedParams = [];
  for (const key of sortedKeys) {
    if (key.indexOf('oauth_') !== 0) {
      continue;
    }

    sortedParams.push(`${key}="${encode(params[key])}"`);
  }

  return `OAuth ${sortedParams.join(', ')}`;

}

const oauth = (url, method, {oauth}, body = {}) => {
  return 'OAuth' + oauth.sign(
    'HMAC-SHA1',
    method,
    url,
    Object.assign(oauth, body),
    oauth.consumer_secret,
    oauth.token_secret
  );
}

module.exports = {accessToken, requestToken, getAuthorizeURL, oauth, setNonceFn, setTimestampFn};
