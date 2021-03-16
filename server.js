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

app.get('/:id([0-9]{1,19})', (request, response) => {
  response.sendFile(__dirname + '/views/trends.html');
});

app.get('/counts', async (request, response) => {
  const url = new URL('https://gnip-api.twitter.com/search/fullarchive/accounts/daniele-bernardi/prod/counts.json');
  url.searchParams.append('bucket', 'day');
  url.searchParams.append('query', request.query.q);
  const authHash = Buffer.from(`${process.env.GNIP_USER}:${process.env.GNIP_PASS}`).toString('base64');
  setTimeout(async () => {
    const res = await get({
      url: url.href,
      options: {
        headers: {
          authorization: `Basic ${authHash}`
        }
      }
    });
    
    if (res.statusCode !== 200) {
      console.error('HTTP error', res.statusCode, res);
      response.status(400).json({success: false, error: 'api-error'});
    } else {
      response.json(res.body);  
    }
  }, 1000);
});

app.get('/embed/:id([0-9]{1,19})', async (request, response) => {  
  try {
    const url = new URL('https://publish.twitter.com/oembed');
    url.searchParams.append('url', `https://twitter.com/i/status/request.params.id`);
    url.searchParams.append('dnt', 'true');
    url.searchParams.append('hide_media', 'true');
    url.searchParams.append('hide_thread', 'true');
    const res = await get({
      url: url.href
    });
    response.json(res);
    
  }
  catch (e) {
    console.error(e);
    response.status(400).json({success: false, error: 'api-error'});
  }

});

app.get('/tweet/:id([0-9]{1,19})', async (request, response) => {  
  let res;
  try {
    const url = new URL(`https://api.twitter.com/2/tweets/${request.params.id}`);
    url.searchParams.append('tweet.fields', 'author_id,created_at,public_metrics,context_annotations,entities')
    url.searchParams.append('user.fields', 'profile_image_url');
    url.searchParams.append('expansions', 'author_id');
    res = await get({
      url: url.href, 
      options: {
        headers: {
          authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
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

  return response.status(200).json(res.body);
});

// app.get('/conversation/:id', async (request, response) => {
//   const token = request.cookies['access_token'] || null;

//   if (!token) {
//     response.status(400).json({success: false, error: 'other-error'});
//     return;
//   }

//   const userId = token.oauth_token.split('-')[0];

//   let res;
//   try {
//     const url = new URL('https://api.twitter.com/2/tweets/search/recent');
//     url.searchParams.append('tweet.fields', 'author_id,created_at,public_metrics,context_annotations')
//     url.searchParams.append('user.fields', 'profile_image_url');
//     url.searchParams.append('expansions', 'author_id');
//     url.searchParams.append('query', `conversation_id:${request.params.id} -from:${userId}`);

//     ['next_token', 'since_id'].forEach(query => request.query[query] ? url.searchParams.append(query, request.query[query]) : null);

//     res = await get({
//       url: url.href, 
//       options: {
//         oauth: {
//           consumer_key: process.env.TWITTER_CONSUMER_KEY,
//           consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
//           token: token.oauth_token,
//           token_secret: token.oauth_token_secret,
//         }
//       }
//     });
//   } catch (e) {
//     response.status(400).json({success: false, error: 'other-error'});
//     return;
//   }
  
//   if (res.statusCode !== 200) {
//     return response.status(400).json({success: false, error: 'api-error'});
//   }

//   return response.status(200).json(res.body);
// });

// app.get('/oauth', async (request, response) => {
//   try {
//     const requestToken = await oauth.requestToken(callbackURL);
//     response.cookie('request_token', requestToken);
//     const authorizeURL = oauth.getAuthorizeURL(requestToken);
//     response.redirect(authorizeURL);
//   } catch (e) {
//     console.error(e);
//     response.redirect('/oauth-callback/error');
//   }
// });

// app.get('/oauth-callback', async (request, response) => {
//   if (!request.query.oauth_verifier) {
//     console.error('OAuth callback: no oauth_verifier');
//     response.redirect('/');
//     return;
//   }

//   try {
//     const requestToken = request.cookies.request_token;
//     const accessToken = await oauth.accessToken(requestToken, request.query);

//     response.cookie('access_token', accessToken);
//     response.redirect(`/oauth-callback/success?user_id=${accessToken.user_id}`);
//   } catch (e) {    
//     console.error(e);
//     response.redirect('/oauth-callback/error');
//   }
// });

// app.get('/oauth-callback/success', async (request, response) => {
//   response.sendFile(__dirname + '/views/oauth-callback.html');
// });

// app.get('/oauth-callback/error', async (request, response) => {
//   response.sendFile(__dirname + '/views/oauth-error.html');
// });

// app.get('/moderate', async (request, response) => {
//   response.sendFile(__dirname + '/views/moderate.html');
// });

const listener = server.listen(process.env.PORT || 5000, async () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});