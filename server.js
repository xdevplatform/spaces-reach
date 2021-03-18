const express = require('express');
const app = express();
const server = require('http').Server(app);

const { get } = require('./client');
require('dotenv').config();

app.use(express.static('public'));
app.use(express.json());

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
app.get('/:id([0-9]{1,19})?', (request, response) => {
  response.sendFile(__dirname + '/views/trends.html');
});

app.get('/counts', async (request, response) => {  
  if (!request.query.q) {
    response.status(422).json({});
  }
  
  const count = async (q, next = null) => {
    const url = new URL('https://gnip-api.twitter.com/search/30day/accounts/daniele-bernardi/prod/counts.json');
    url.searchParams.append('bucket', 'day');
    url.searchParams.append('query', q);
    
    if (next) {
      url.searchParams.append('next', next);
    }
    
    const authHash = Buffer.from(`${process.env.GNIP_USER}:${process.env.GNIP_PASS}`).toString('base64');
    
    const res = await get({
      url: url.href,
      options: {
        headers: {
          authorization: `Basic ${authHash}`
        }
      }
    });
    
    if (res.statusCode !== 200) {
      return {statusCode: res.statusCode, body: null, next: null};
    }
    
    return {statusCode: res.statusCode, body: res.body, next: res.body.next || null};
  }
  
  let next = null;
  let body = [];
  let totalCount = 0;
  let statusCode = 200;
  do {
    const currentBody = await count(request.query.q, next);
    statusCode = currentBody.statusCode;
    body = [].concat(currentBody.body.results, body);
    totalCount += currentBody.body.totalCount || 0;
    next = currentBody.next;
    sleep(500);
  } while (next);
  
  if (body.length > 0) {
    response.json({results: body, totalCount});
  } else {
    response.status(statusCode).json({results: body, totalCount});
  }  
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