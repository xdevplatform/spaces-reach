const express = require('express');
const app = express();
const oauth = require('./oauth');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const request = require('request');
const util = require('util');
const cookieParser = require('cookie-parser');
const scoreTweet = require('./analyze');

const get = util.promisify(request.get);

const { Autohook, validateWebhook } = require('../twitter-autohook');
const moderate = require('./moderate');
require('dotenv').config();

app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

const storage = {users: {}};

const baseURL = `https://${process.env.PROJECT_DOMAIN}.${process.env.PROJECT_BASE_URL || 'glitch.me'}`;

const callbackURL = new URL(`${baseURL}/oauth-callback`);
const webhookURL = new URL(`${baseURL}/webhook`);

app.get('/', (request, response) => {
  response.sendFile(__dirname + '/views/index.html');
});

const autohookConfig = {
  token: process.env.TWITTER_ACCESS_TOKEN,
  token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  env: process.env.TWITTER_WEBHOOK_ENV,
};

const webhook = new Autohook(autohookConfig);

const u = id => storage.users[id] || null;

io.on('connection', (socket) => {
  socket.on('set id', (msg) => {
    storage.users[msg.user_id] = socket;
  });
});

const parseEvent = async (event) => {
  if (!Array.isArray(event.tweet_create_events)) {
    return;
  }

  const tweet = event.tweet_create_events[0];
  const socket = u(tweet.in_reply_to_user_id_str);

  if (socket) {
    try {
      const toxicityScore = scoreTweet(tweet);
      if (!isNaN(toxicityScore) && toxicityScore >= 0.94) {
        const url = new URL('https://publish.twitter.com/oembed');
        url.searchParams.append('url', `https://twitter.com/${tweet.in_reply_to_screen_name}/status/${tweet.in_reply_to_status_id_str}`);
        const originalTweet = await get({url: url, json: true});
        tweet.original_tweet = originalTweet.body.html;
        socket.emit('tweet', tweet);
      }
    } catch (e) {
      console.error('Error while scoring Tweet:', e);
    }
  }
}

app.post('/hide/:id', async (request, response) => {
  const token = request.cookies['access_token'] || null;

  if (!token) {
    response.sendStatus(400).json({success: false, error: 'Missing access token'});
    return;
  }

  try {
    const res = await moderate({id_str: request.params.id}, {
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      token: token.oauth_token,
      token_secret: token.oauth_token_secret,
    });
  } catch (e) {
    console.error('Moderation error:', e);
  }

  response.sendStatus(200);
});

app.all('/webhook', async (request, response) => {
  if (request.query.crc_token) {
    const signature = validateWebhook(request.query.crc_token, {consumer_secret: process.env.TWITTER_CONSUMER_SECRET});
    response.json(signature);
  } else {
    parseEvent(request.body);
    response.sendStatus(200);
  }
});

app.get('/oauth', async (request, response) => {
  try {
    const requestToken = await oauth.requestToken(callbackURL);
    response.cookie('request_token', requestToken);
    const authorizeURL = oauth.getAuthorizeURL(requestToken);
    response.redirect(authorizeURL);
  } catch (e) {
    console.error(e);
    response.redirect('/');
  }
});

app.get('/oauth-callback', async (request, response) => {
  if (!request.query.oauth_verifier) {
    console.error('OAuth callback: no oauth_verifier');
    response.redirect('/');
    return;
  }

  try {
    const requestToken = request.cookies.request_token;
    const accessToken = await oauth.accessToken(requestToken, request.query);
    await webhook.subscribe(accessToken);

    response.cookie('access_token', accessToken);

    setTimeout(async (userId) => {
      await webhook.unsubscribe(userId);
      const socket = u(userId);
      if (socket) {
        socket.emit('end moderation');
      }
    }, 1000 * 60 * 15, accessToken.user_id);

    response.redirect(`/moderate?user_id=${accessToken.user_id}`);
  } catch (e) {
    console.error(e);
    response.redirect('/');
  }
});

app.get('/moderate', async (request, response) => {
  response.sendFile(__dirname + '/views/moderate.html');
});

app.post('/bearer', async (request, response) => {
  const consumerKey = request.body.consumer_key || null;
  const consumerSecret = request.body.consumer_secret || null;

  if (!consumerKey || !consumerSecret) {
    response.sendStatus(400);
    return;
  }
  
  try {
    const token = await bearerToken(consumerKey.trim(), consumerSecret.trim());
    response.json({bearer_token: token});
    return;
  } catch (e) {
    response.sendStatus(400);
    return;
  }
});

app.post('/moderate/stop', async (request, response) => {
  if (!request.body.user_id) {
    response.status(400).json({success: false, error: 'Missing user ID'});
    return;
  }

  if (!u(request.body.user_id)) {
    response.json({success: true});
    return;
  }

  try {
    const result = await webhook.unsubscribe(request.body.user_id);
    if (result === false) {
      response.status(400).json({success: false, error: e.getMessage()});
      return;  
    }

    delete storage.users[request.body.user_id];
    response.clearCookie('access_token');
    response.clearCookie('request_token');
    response.json({success: true});
  } catch(e) {
    console.error(e);
    response.json({success: true});
  }
});


const listener = server.listen(process.env.PORT || 5000, async () => {
  await webhook.removeWebhooks();
  await webhook.start(webhookURL.href);

  console.log(`Your app is listening on port ${listener.address().port}`);
});
