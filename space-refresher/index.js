import { Ended, chartKey, SpaceFields, SpaceUserExpansions, UserFields } from '../public/consts.js';
import cron from 'node-cron';
import dateFns from 'date-fns';
const { intervalToDuration } = dateFns;
import { promisify } from 'util';

export default class {
  constructor(cache) {
    this.cacheGet = promisify(cache.get).bind(cache);
    this.cachePut = promisify(cache.set).bind(cache);
    this.cacheExpire = promisify(cache.expire).bind(cache);

  }

  duration (start, end) {
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

  run() {
    cron.schedule('* * * * *', async () => {
      // get list of things to track from redis
      const ids = await this.cacheGet('tracking');
    
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
          await this.cachePush('ended', space.id);
          await this.cacheRemoveFrom('tracking', space.id);
          console.log('this space has ended:', space.id);
          return false;
        }
    
        return true;
      });
    
      console.log('after filtering, tracking these spaces:', ids);
    
      // if space is running, append participation details to payload
      // save each space by id in its own bucket
      trackingSpaces.forEach(async (space) => {
        const data = await this.cacheGet(chartKey(space.id));
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
          label: this.duration(new Date(space.started_at), new Date()),
          value: space.participant_count
        });
    
        cacheData.currentCount = space.participant_count;
        cacheData.min = Math.min(...cacheData.series.map(series => series.value));
        cacheData.max = Math.max(...cacheData.series.map(series => series.value));
    
        await this.cachePut(chartKey(space.id), JSON.stringify(cacheData));
    
      });
    
      const trackingSpacesIds = trackingSpaces.map(({id}) => id).join(',');
      await this.cachePut('tracking', trackingSpacesIds);
    });
  }
}

