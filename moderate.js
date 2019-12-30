const request = require('request');
const util = require('util');
const os = require('os');
const path = require('path');

const put = util.promisify(request.put);

const moderate = async (tweet, oauth = null) => {
  const id = tweet.id_str;
  if (!id) {
    throw new TypeError('Invalid Tweet ID.');
    return;
  }

  const config = {
    url: `https://api.twitter.com/labs/1/tweets/${id}/hidden`,
    json: true,
    body: {hidden: true},
    headers: {
      'User-Agent': 'HideRepliesQuickStartJavaScript',
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

module.exports = moderate;