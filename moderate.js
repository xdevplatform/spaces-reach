const { put } = require('./client');

const moderateRequest = async (tweet, hidden, oauth) => {
  if (!tweet.id) {
    throw new TypeError('Invalid Tweet ID.');
  }

  const config = {
    url: `https://api.twitter.com/2/tweets/${tweet.id}/hidden`,
    options: {
      json: true,
      body: {hidden: hidden},
      oauth: oauth,
    },
  };

  const res = await put(config);
  return res.body.hidden && res.body.hidden === hidden;
}

const moderate = (tweet, oauth) => moderateRequest(tweet, true, oauth);
const unmoderate = (tweet, oauth) => moderateRequest(tweet, false, oauth);

module.exports = { moderate, unmoderate };