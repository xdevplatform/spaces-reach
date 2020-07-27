const request = require('request');
const util = require('util');
const os = require('os');
const path = require('path');

const put = util.promisify(request.put);

const moderateRequest = async (tweet, hidden, oauth = null) => {
  const id = tweet.id_str;
  if (!id) {
    throw new TypeError('Invalid Tweet ID.');
    return;
  }

  const config = {
    url: `https://api.twitter.com/2/tweets/${id}/hidden`,
    json: true,
    body: {hidden: hidden},
    headers: {
      'User-Agent': 'HideRepliesJavaScript-v2',
    },
    oauth: oauth,
  };

  if (!oauth) {
    config.oauth = {
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      token: process.env.TWITTER_ACCESS_TOKEN,
      token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    };
  }

  const res = await put(config);
  return res.body.status && res.body.status === 'success';
}

const moderate = (tweet, oauth = null) => moderateRequest(tweet, true, oauth);
const unmoderate = (tweet, oauth = null) => moderateRequest(tweet, false, oauth);

module.exports = { moderate, unmoderate };