const express = require('express');
const app = express();
const server = require('http').Server(app);
const cookieParser = require('cookie-parser');

const { defaults, get } = require('./client');
const { moderate, unmoderate } = require('./moderate');
const oauth = require('./oauth/index.js');

require('dotenv').config();

app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

const baseURL = process.env.PROJECT_DOMAIN ?
  `https://${process.env.PROJECT_DOMAIN}.glitch.me` :
  'http://localhost';


const callbackURL = new URL(`${baseURL}/oauth-callback`);

app.get('/', (request, response) => {
  response.clearCookie('request_token');
  response.sendFile(__dirname + '/views/index.html');
});

app.delete('/hide/:id', async (request, response) => {
  return response.json({success: true});
  const token = request.cookies['access_token'] || null;

  if (!token) {
    response.status(400).json({success: false, error: 'other-error'});
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
    response.status(400).json({success: false, error: 'other-error'});
  }

  response.status(200);
});

app.post('/hide/:id', async (request, response) => {
  return response.json({success: true});
  const token = request.cookies['access_token'] || null;

  if (!token) {
    response.status(400).json({success: false, error: 'other-error'});
    return;
  }

  try {
    console.log('request');
    const res = await moderate({id: request.params.id}, {
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      token: token.oauth_token,
      token_secret: token.oauth_token_secret,
    });
    console.log(res);
  } catch (e) {
    console.error('Moderation error:', e);
    response.status(400).json({success: false, error: 'cannot-hide-reply'})
  }

  response.status(200);
});

app.get('/test', (req, res) => res.json({success: true, message: 'test'}));

app.get('/tweet/:id([0-9]{1,19})', async (request, response) => {
  const token = request.cookies['access_token'] || null;

  if (!token) {
    response.status(400).json({success: false, error: 'other-error'});
    return;
  }

  let res;
  try {
    const url = new URL(`https://api.twitter.com/2/tweets/${request.params.id}`);
    url.searchParams.append('tweet.fields', 'author_id,created_at,public_metrics')
    url.searchParams.append('user.fields', 'profile_image_url');
    url.searchParams.append('expansions', 'author_id');
    res = await get({
      url: url.href, 
      options: {
        oauth: {
          consumer_key: process.env.TWITTER_CONSUMER_KEY,
          consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
          token: token.oauth_token,
          token_secret: token.oauth_token_secret,
        }
      }
    });
  } catch (e) {
    response.status(400).json({success: false, error: 'other-error'});
    return;
  }

  if (res.statusCode !== 200) {
    return response.status(400).json({success: false, error: 'api-error'});
  }

  if (res.body.data && res.body.data.author_id !== token.oauth_token.split('-')[0]) {
    return response.status(400).json({success: false, error: 'not-authorized-for-resource'});
  }

  if (res.body.errors) {
    const error = res.body.errors.pop();
    const type = error.type.split('/').pop();
    switch (type) {
      case 'not-authorized-for-resource':
      case 'resource-not-found':
        return response.status(400).json({success: false, error: type});
      
      default:
        return response.status(400).json({success: false, error: 'other-error'});
    }
  }

  if (res.body.data.public_metrics.reply_count === 0) {
    return response.status(400).json({success: false, error: 'no-replies'});
  }

  const sevenDaysAgo = new Date().setDate(new Date().getDate() - 7);
  const tweetDate = new Date(res.body.created_at);
  
  if (Math.round((tweetDate - sevenDaysAgo) / 1000 / 60 / 60 / 24) >= 7) {
    return response.status(400).json({success: false, error: 'tweet-too-old'});
  }

  return response.status(200).json(res.body);
});

app.get('/conversation/:id', async (request, response) => {
  const token = request.cookies['access_token'] || null;

  if (!token) {
    response.status(400).json({success: false, error: 'other-error'});
    return;
  }

  const userId = token.oauth_token.split('-')[0];

  let res;
  try {
    const url = new URL('https://api.twitter.com/2/tweets/search/recent');
    url.searchParams.append('tweet.fields', 'author_id,created_at,public_metrics,context_annotations')
    url.searchParams.append('user.fields', 'profile_image_url');
    url.searchParams.append('expansions', 'author_id');
    url.searchParams.append('query', `conversation_id:${request.params.id} -from:${userId}`);

    ['next_token', 'since_id'].forEach(query => request.query[query] ? url.searchParams.append(query, request.query[query]) : null);

    res = await get({
      url: url.href, 
      options: {
        oauth: {
          consumer_key: process.env.TWITTER_CONSUMER_KEY,
          consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
          token: token.oauth_token,
          token_secret: token.oauth_token_secret,
        }
      }
    });
  } catch (e) {
    response.status(400).json({success: false, error: 'other-error'});
    return;
  }
  
  if (res.statusCode !== 200) {
    return response.status(400).json({success: false, error: 'api-error'});
  }

  return response.status(200).json(res.body);
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
    const requestToken = request.cookies.request_token;
    const accessToken = await oauth.accessToken(requestToken, request.query);

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