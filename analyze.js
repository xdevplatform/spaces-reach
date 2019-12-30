const request = require('request');
const util = require('util');

const post = util.promisify(request.post);

const commentAnalyzerURL = new URL('https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze');
const commentAnalyzerKey = process.env.COMMENT_ANALYZER_KEY;

const scoreTweet = async (tweet) => {
  commentAnalyzerURL.searchParams.append('key', commentAnalyzerKey);
  let text = tweet.text;

  if (tweet.display_text_range) {
    text = text.substring(tweet.display_text_range[0], tweet.display_text_range[1]);
  }

  const requestConfig = {
    url: commentAnalyzerURL,
    json: {
      comment: {text: text},
      languages: [(typeof tweet.land === 'undefined' || tweet.lang === 'und') ? 'en' : tweet.lang],
      // IMPORTANT: your app (and any other API) must not send any Tweet text
      // (or other metadata) to an external service.
      // Check out the Twitter Developer Policy for more details.
      doNotStore: true,
      requestedAttributes: {
        TOXICITY: {}
      }
    }
  };

  const res = await post(requestConfig);

  if (res.statusCode === 200 && res.body.attributeScores && res.body.attributeScores.TOXICITY) {
    return res.body.attributeScores.TOXICITY.summaryScore.value;
  } else {
    return NaN;
  }
}

module.exports = scoreTweet;