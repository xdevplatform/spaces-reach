const express = require('express');
const app = express();
const server = require('http').Server(app);
const cookieParser = require('cookie-parser');

const { defaults } = require('./client');
defaults({headers: {'x-des-apiservices': 'staging2'}});
const { moderate, unmoderate } = require('./moderate');
const oauth = require('./oauth/index.js');

require('dotenv').config();

app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

const baseURL = process.env.PROJECT_DOMAIN ?
  `https://${process.env.PROJECT_DOMAIN}.glitch.me` :
  'http://127.0.0.1:5000';


const callbackURL = new URL(`${baseURL}/oauth-callback`);

app.get('/', (request, response) => {
  response.clearCookie('request_token');
  response.sendFile(__dirname + '/views/index.html');
});

app.delete('/hide/:id', async (request, response) => {
  const token = request.cookies['access_token'] || null;

  if (!token) {
    response.sendStatus(400).json({success: false, error: 'Missing access token'});
    return;
  }

  try {
    await unmoderate({id: request.params.id}, {
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

app.post('/hide/:id', async (request, response) => {
  const token = request.cookies['access_token'] || null;

  if (!token) {
    response.sendStatus(400).json({success: false, error: 'Missing access token'});
    return;
  }

  try {
    await moderate({id: request.params.id}, {
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

app.get('/oauth', async (request, response) => {
  try {
    const requestToken = await oauth.requestToken(callbackURL);
    response.cookie('request_token', requestToken);
    const authorizeURL = oauth.getAuthorizeURL(requestToken);
    response.redirect(authorizeURL);
  } catch (e) {
    console.error(e);
    response.redirect('/oauth-callback/error');
  }
});

app.get('/oauth-callback', async (request, response) => {
  if (!request.query.oauth_verifier) {
    console.error('OAuth callback: no oauth_verifier');
    response.redirect('/');
    return;
  }

  try {
    response.cookie('access_token', accessToken);
    response.redirect(`/oauth-callback/success?user_id=${accessToken.user_id}`);
  } catch (e) {    
    console.error(e);
    response.redirect('/oauth-callback/error');
  }
});

app.get('/oauth-callback/success', async (request, response) => {
  response.sendFile(__dirname + '/views/oauth-callback.html');
});

app.get('/oauth-callback/error', async (request, response) => {
  response.sendFile(__dirname + '/views/oauth-error.html');
});

app.get('/moderate', async (request, response) => {
  response.sendFile(__dirname + '/views/moderate.html');
});

const listener = server.listen(process.env.PORT || 5000, async () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});