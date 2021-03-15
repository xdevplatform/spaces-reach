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

// app.delete('/hide/:id', async (request, response) => {
//   return response.json({success: true});
//   const token = request.cookies['access_token'] || null;

//   if (!token) {
//     response.status(400).json({success: false, error: 'other-error'});
//     return;
//   }

//   try {
//     await unmoderate({id: request.params.id}, {
//       consumer_key: process.env.TWITTER_CONSUMER_KEY,
//       consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
//       token: token.oauth_token,
//       token_secret: token.oauth_token_secret,
//     });
//   } catch (e) {
//     console.error('Moderation error:', e);
//     response.status(400).json({success: false, error: 'other-error'});
//   }

//   response.status(200);
// });

// app.post('/hide/:id', async (request, response) => {
//   return response.json({success: true});
//   const token = request.cookies['access_token'] || null;

//   if (!token) {
//     response.status(400).json({success: false, error: 'other-error'});
//     return;
//   }

//   try {
//     console.log('request');
//     const res = await moderate({id: request.params.id}, {
//       consumer_key: process.env.TWITTER_CONSUMER_KEY,
//       consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
//       token: token.oauth_token,
//       token_secret: token.oauth_token_secret,
//     });
//     console.log(res);
//   } catch (e) {
//     console.error('Moderation error:', e);
//     response.status(400).json({success: false, error: 'cannot-hide-reply'})
//   }

//   response.status(200);
// });

// app.get('/test', (req, res) => res.json({success: true, message: 'test'}));

app.get('/counts', async (request, response) => {
  return response.json({"results":[{"timePeriod":"202102130000","count":424594},{"timePeriod":"202102140000","count":439903},{"timePeriod":"202102150000","count":490756},{"timePeriod":"202102160000","count":513076},{"timePeriod":"202102170000","count":500841},{"timePeriod":"202102180000","count":507220},{"timePeriod":"202102190000","count":460923},{"timePeriod":"202102200000","count":597278},{"timePeriod":"202102210000","count":569671},{"timePeriod":"202102220000","count":467396},{"timePeriod":"202102230000","count":480023},{"timePeriod":"202102240000","count":427938},{"timePeriod":"202102250000","count":515445},{"timePeriod":"202102260000","count":464564},{"timePeriod":"202102270000","count":458256},{"timePeriod":"202102280000","count":455672},{"timePeriod":"202103010000","count":386009},{"timePeriod":"202103020000","count":431053},{"timePeriod":"202103030000","count":427710},{"timePeriod":"202103040000","count":433137},{"timePeriod":"202103050000","count":403013},{"timePeriod":"202103060000","count":400818},{"timePeriod":"202103070000","count":439445},{"timePeriod":"202103080000","count":317944},{"timePeriod":"202103090000","count":436296},{"timePeriod":"202103100000","count":422811},{"timePeriod":"202103110000","count":375261},{"timePeriod":"202103120000","count":390623},{"timePeriod":"202103130000","count":400381},{"timePeriod":"202103140000","count":398169},{"timePeriod":"202103150000","count":354545}],"totalCount":13790771,"requestParameters":{"bucket":"day","fromDate":"202102130000","toDate":"202103152330"}});
})

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