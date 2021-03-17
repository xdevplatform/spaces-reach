const express = require('express');
const app = express();
const server = require('http').Server(app);

const { get } = require('./client');
require('dotenv').config();

app.use(express.static('public'));
app.use(express.json());

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

app.get('/tweet/:id([0-9]{1,19})', async (request, response) => {  
  let res;
  try {
    const url = new URL(`https://api.twitter.com/2/tweets/${request.params.id}`);
    url.searchParams.append('tweet.fields', 'context_annotations,entities')
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

const listener = server.listen(process.env.PORT || 5000, async () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});