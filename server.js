import express from 'express';
import { Server } from 'http';
import redis from 'redis';
import { promisify } from 'util';
import cron from 'node-cron';
import dateFns from 'date-fns';
import { headers } from './config.js';
import { createReadStream } from 'fs';
import { Live, Ended, Scheduled, Canceled } from './public/consts.js';
const { intervalToDuration } = dateFns;
import { get } from './client/index.js';
import dotenv from 'dotenv';

const app = express();

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const cache = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  auth_pass: process.env.REDIS_KEY
});

const cacheGet = promisify(cache.get).bind(cache);
const cachePut = promisify(cache.set).bind(cache);
const cacheDel = promisify(cache.del).bind(cache);
const cacheExpire = promisify(cache.expire).bind(cache);



dotenv.config();

app.use(express.static('public'));
app.use(express.json());

const SpaceFields = 'title,created_at,started_at,participant_count';
const SpaceUserExpansions = 'host_ids,creator_id,speaker_ids,invited_user_ids';
const UserFields = 'profile_image_url,public_metrics,description';

const duration = (start, end) => {
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

app.get('/:id([0-9a-zA-Z]{1,13})?', (request, response) => {
  response.sendFile(__dirname + '/views/trends.html');
});

app.get('/code/view', async (request, response) => {
  response.write('<html><head><style> html td {white-space: pre !important}</style><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/default.min.css"><script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/highlight.min.js"></script><script src="https://cdn.jsdelivr.net/npm/highlightjs-line-numbers.js@2.6.0/dist/highlightjs-line-numbers.min.js"></script></head><body><pre><code class="language-javascript">');
  createReadStream(__dirname + '/server.js').pipe(response).on('end', () => {
    response.write('</code></pre><script>hljs.highlightAll();hljs.initHighlightingOnLoad();hljs.initLineNumbersOnLoad();</script></body>');
    response.end();
  });
  
});

app.get('/2/spaces/:id([0-9a-zA-Z]{1,13})', async (request, response) => {  
  const key = 'space-' + request.params.id;
  const cache = await cacheGet(key);
  
  if (!cache) {
    const body = await track(request.params.id);
    response.json(body);
    
    await cachePut(key, JSON.stringify(body));
    await cacheExpire(key, 60);
    return;
  }

  response.json(JSON.parse(cache));
  return;
});

app.get('/2/chartdata/:id([0-9a-zA-Z]{1,13})', async (request, response) => {  
  const key = 'space-chartdata-' + request.params.id;
  const cache = await cacheGet(key);
  
  if (!cache) {
    response.json({});
    return;
  }

  response.json(JSON.parse(cache));
  return;
});

const cachePush = async (key, value) => {
  let cache;
  try {
    cache = (await cacheGet(key)).split(',');
  } catch (e) {
    console.warn(e);
    cache = [];
  }

  if (!cache.includes(value)) {
    cache.push(value);
    await cachePut(key, cache.join(','));
  }
}

const cacheRemoveFrom = async (key, value) => {
  let cache;
  try {
    cache = (await cacheGet(key)).split(',') || [];
  } catch (e) {
    console.warn(e);
    cache = [];
  }

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
    url.searchParams.append('space.fields', SpaceFields);
    url.searchParams.append('user.fields', UserFields);
    url.searchParams.append('expansions', SpaceUserExpansions);
    res = await get({
      url: url.href, 
      options: {
        headers: headers
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
    console.warn(res.body.errors);
    return;
  }

  switch (res.body.data.state) {
    case Ended:
    case Canceled:
      await cachePush('ended', id);
      await cacheRemoveFrom('tracking', id);
      break;
    case Live:
    case Scheduled:
      await cachePush('tracking', id);
      break;
  }
  
  return res.body;
}

cron.schedule('* * * * *', async () => {
  // get list of things to track from redis
  const ids = await cacheGet('tracking');

  if (!ids) {
    console.log('nothing to track');
    return;
  }

  console.log('currently tracking these spaces:', ids);
  // make bulk request
  let res;
  try {
    const url = new URL(`https://api.twitter.com/2/spaces`);
    url.searchParams.append('ids', ids.replace(/^,|,$/g, ''));
    url.searchParams.append('space.fields', SpaceFields);
    url.searchParams.append('user.fields', UserFields);
    url.searchParams.append('expansions', SpaceUserExpansions);
    res = await get({
      url: url.href, 
      options: {
        headers: headers
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
  const { data } = res.body;  
  const trackingSpaces = data.filter(async (space) => {
    if (space.state === Ended) {
      await cachePush('ended', space.id);
      await cacheRemoveFrom('tracking', space.id);
      console.log('this space has ended:', space.id);
      return false;
    }

    return true;
  });

  console.log('after filtering, tracking these spaces:', ids);

  // if space is running, append participation details to payload
  // save each space by id in its own bucket
  trackingSpaces.forEach(async (space) => {
    const data = await cacheGet('space-chartdata-' + space.id);
    let cacheData;
    try {
      cacheData = JSON.parse(data);
      console.log('got data from cache for', space.id);
    } catch (e) {
      console.warn('cannot get spaces series data for', space.id);
      console.warn(e);
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

    cacheData.currentCount = space.participant_count;
    cacheData.min = Math.min(...cacheData.series.map(series => series.value));
    cacheData.max = Math.max(...cacheData.series.map(series => series.value));

    await cachePut('space-chartdata-' + space.id, JSON.stringify(cacheData));

  });

  const trackingSpacesIds = trackingSpaces.map(({id}) => id).join(',');
  await cachePut('tracking', trackingSpacesIds);
});

const listener = Server(app).listen(process.env.PORT || 5000, async () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});