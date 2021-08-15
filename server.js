import express from 'express';
import { Server } from 'http';
import redis from 'redis';
import { promisify } from 'util';
import SpaceRefresher from './space-refresher/index.js';

import { headers } from './config.js';
import { createReadStream } from 'fs';
import { Live, Ended, Scheduled, Canceled, spaceKey, chartKey, SpaceFields, SpaceUserExpansions, UserFields } from './public/consts.js';
import { get } from './client/index.js';
import dotenv from 'dotenv';
import TwitterOAuth1Router from './oauth1router/index.js';
import TwitterOAuth2Router from './oauth2router/index.js';
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
const cacheExpire = promisify(cache.expire).bind(cache);

dotenv.config();

app.use(express.static('public'));
app.use(express.json());

TwitterOAuth1Router(app, '/oauth1');
TwitterOAuth2Router(app, '/oauth2');

app.get('/:id([0-9a-zA-Z]{1,13})?', (_, response) => {
  response.sendFile(__dirname + '/views/trends.html');
});

app.get('/oauth/login', (_, response) => {
  response.sendFile(__dirname + '/views/login.html');
});

app.get('/code/view', (_, response) => {
  response.write('<html><head><style> html td {white-space: pre !important}</style><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/default.min.css"><script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/highlight.min.js"></script><script src="https://cdn.jsdelivr.net/npm/highlightjs-line-numbers.js@2.6.0/dist/highlightjs-line-numbers.min.js"></script></head><body><pre><code class="language-javascript">');
  createReadStream(__dirname + '/server.js').pipe(response).on('end', () => {
    response.write('</code></pre><script>hljs.highlightAll();hljs.initHighlightingOnLoad();hljs.initLineNumbersOnLoad();</script></body>');
    response.end();
  });
  
});

app.get('/2/spaces/:id([0-9a-zA-Z]{1,13})', async (request, response) => {  
  const key = spaceKey(request.params.id);
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
  const key = chartKey(request.params.id);
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

const refresher = new SpaceRefresher(cache);
refresher.run();

const listener = Server(app).listen(process.env.PORT || 5000, async () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});