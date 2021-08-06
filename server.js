const express = require('express');
const { createConnection } = require('net');
const app = express();
const server = require('http').Server(app);
const redis = require('redis');
const { promisify } = require('util');
const cron  = require('node-cron');
const { intervalToDuration } = require('date-fns');

const cache = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  auth_pass: process.env.REDIS_KEY
});

const cacheGet = promisify(cache.get).bind(cache);
const cachePut = promisify(cache.set).bind(cache);
const cacheDel = promisify(cache.del).bind(cache);
const cacheExpire = promisify(cache.expire).bind(cache);

const { get } = require('./client');
const { createCipher } = require('crypto');
require('dotenv').config();

app.use(express.static('public'));
app.use(express.json());

duration(start, end) {
  const {hours, minutes, seconds} = intervalToDuration({
    start: start, 
    end: end,
  });

  const zero = component => component <= 9 ? '0' + component : '' + component;

  if (hours > 0) {
    return `${zero(hours)}:${zero(minutes)}:${zero(seconds)}`;
  } else {
    return `${zero(minutes)}:${zero(seconds)}`;
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
app.get('/:id([0-9a-zA-Z]{1,13})?', (request, response) => {
  response.sendFile(__dirname + '/views/trends.html');
});

app.get('/2/counts', async (request, response) => {
    if (!request.query.q) {
    response.status(422).json({});
  }
  
  const count = async (q, next = null) => {
    const url = new URL('https://api.twitter.com/2/tweets/counts/recent');
    url.searchParams.append('granularity', 'day');
    url.searchParams.append('query', q);

    if (next) {
      url.searchParams.append('next_token', next);
    }

    const res = await get({
      url: url.href,
      options: {
        headers: {
          authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      }
    });

    if (res.statusCode !== 200) {
      return {statusCode: res.statusCode, body: null, next: null};
    }

    return {statusCode: res.statusCode, body: res.body, next: res.body.meta.next_token || null};
  }
  
  try {
    const cached = await cacheGet(request.query.q);
    if (cached) {
      response.json(JSON.parse(cached));
      return;
    }
  } catch (e) {
    console.warn(e);
  }
  
  let next = null;
  let body = [];
  let totalCount = 0;
  let statusCode = 200;
  do {
    const currentBody = await count(request.query.q, next);
    statusCode = currentBody.statusCode;
    body = [].concat(currentBody.body.data, body);
    totalCount += currentBody.body.meta.total_tweet_count || 0;
    next = currentBody.next;
    sleep(500);
  } while (next);
  
  if (body.length > 0) {
    try {
      await cachePut(request.query.q, JSON.stringify({results: body, totalCount}));   
    } catch (e) {
      console.warn('cacheput error')
      console.warn(e);
    }
    
    try {
      await cacheExpire(request.query.q, 60 * 60 * 24);  
    } catch (e) {
      console.warn('cache expire set error');
      console.warn(e);
    }
    
    response.json({results: body, totalCount});
  } else {
    response.status(statusCode).json({results: body, totalCount});
  }
});

app.get('/counts', async (request, response) => {
  if (!request.query.q) {
    response.status(422).json({});
  }
  
  const count = async (q, next = null) => {
    const url = new URL(process.env.TWITTER_SEARCH_URL);
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
  
  try {
    const cached = await cacheGet(request.query.q);
    if (cached) {
      response.json(JSON.parse(cached));
      return;
    }
  } catch (e) {
    console.warn(e);
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
    try {
      await cachePut(request.query.q, JSON.stringify({results: body, totalCount}));   
    } catch (e) {
      console.warn('cacheput error')
      console.warn(e);
    }
    
    try {
      await cacheExpire(request.query.q, 60 * 60 * 24);  
    } catch (e) {
      console.warn('cache expire set error');
      console.warn(e);
    }
    
    response.json({results: body, totalCount});
  } else {
    response.status(statusCode).json({results: body, totalCount});
  }  
});

app.get('/2/spaces/:id([0-9a-zA-Z]{1,13})', async (request, response) => {  
  track(request.params.id);
  

});

const cachePush = async (key, value) => {
  const cacheResult = await cacheGet(key);
  const cache = cacheResult?.split(',') || [];
  if (!cache.includes(value)) {
    cache.push(value);
    await cachePut(key, cache.join(','));
  }
}

const cacheRemoveFrom = async (key, value) => {
  const cacheResult = await cacheGet(key);
  const cache = cacheResult?.split(',') || [];
  const index = cache.indexOf(value);
  if (index > -1) {
    cache.splice(index, 1);
    await cachePut(key, cache.join(','));
  }
}

const track = async (id) => {
  let res;
  try {
    const url = new URL(`https://api.twitter.com/2/spaces/${id}`);
    url.searchParams.append('space.fields', 'title,created_at,started_at,participants')
    res = await get({
      url: url.href, 
      options: {
        headers: {
          authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          'x-des-apiservices': 'staging1',
          'X-Decider-Overrides': 'tfe_route:des_apiservice_staging1=on'
        }
      }
    });
  } catch (e) {
    console.warn(e);
    return;
  }

  if (res.statusCode !== 200) {
    console.warn(`Received HTTP ${res.statusCode}: ${JSON.stringify(res.body)}`);
    return;
  }

  if (res.body.errors) {
    return;
  }

  switch (res.body.data.state) {
    case 'Ended':
      await cachePush('ended', id);
      await cacheRemoveFrom('tracking', id);
      break;
    case 'Running':
    case 'NotStarted':
      await cachePush('tracking', id);
      break;
  }
    
  return res.body;
}

cron.schedule('* * * * *', async () => {
  // get list of things to track from redis
  const ids = await cacheGet('tracking');

  // make bulk request
  let res;
  try {
    const url = new URL(`https://api.twitter.com/2/spaces`);
    url.searchParams.append('ids', ids);
    url.searchParams.append('space.fields', 'title,created_at,started_at,participant_count')
    res = await get({
      url: url.href, 
      options: {
        headers: {
          authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          'x-des-apiservices': 'staging1',
          'X-Decider-Overrides': 'tfe_route:des_apiservice_staging1=on'
        }
      }
    });
  } catch (e) {
    console.warn(e);
    return;
  }

  // get result
  if (res.statusCode !== 200) {
    console.warn(`Received HTTP ${res.statusCode}: ${JSON.stringify(res.body)}`);
    return;
  }

  // for each space, check state and filter out ended spaces
  const { data } = await res.json();
  const trackingSpaces = data.filter(async (space) => {
    if (space.state === 'Ended') {
      await cachePush('ended', space.id);
      await cacheRemoveFrom('tracking', id);
      return false;
    }

    return true;
  });

  // if space is running, append participation details to payload
  // save each space by id in its own bucket
  trackingSpaces.forEach(async (space) => {
    const data = await cacheGet('space-' + space.id);
    let cacheData;
    try {
      cacheData = JSON.parse(data);
    } catch (e) {

    }
    
    if (!cacheData) {
      cacheData = {
        status: 'done',
        series: [],
        currentCount: space.participant_count,
        min: space.participant_count,
        max: space.participant_count
      };
    }

    cacheData.series.push({
      label: duration(new Date(space.started_at), new Date()),
      value: space.participant_count
    });
    await cachePut('space-' + space.id, JSON.stringify(cacheData));

  });

  const ids = trackingSpaces.map(({id}) => id).join(',');
  await cachePut('tracking', ids);
});

const listener = server.listen(process.env.PORT || 5000, async () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});