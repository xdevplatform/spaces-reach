class Tweet extends Emitter {
  constructor(component) {
    super(component);
    this.wrapper = component.querySelector('.tweet-wrapper');
    this.profilePic = component.querySelector('img');
    this.name = component.querySelector('.name');
    this.username = component.querySelector('.username');
    this.text = component.querySelector('h1');
    this.repliesCount = component.querySelector('.replies-count');
    this.timestamp = component.querySelector('.timestamp');
    // this.annotationsLabel = this.annotationsControls.querySelector('.related-label');
    this.datasetMap = ['profilePic', 'name', 'username', 'text', 'repliesCount', 'timestamp', 'tweetId'];
    this.props.tweet = {
      countsQuery: [],
    };
    this.datasetMap.forEach(key => {
      if (this.component.dataset[key]) {
        this.props.tweet[key] = this.component.dataset[key];
      }
    });
  }

  async didReceiveData(response) {
    if (response.url.match(/\/tweet\/\d{1,19}/)) {
      const tweet = await response.clone().json();
      this.setState({
        tweetId: tweet.data.id,
      });

      return this.dispatchTrends(tweet);
    }    
  }
  
  dispatchTrends(tweet) {
    const entities = [];
    
    if (!tweet.data.context_annotations) {
      tweet.data.context_annotations = [];
    }
    
    tweet.data.context_annotations = tweet.data.context_annotations.filter(ctx => {
      if (entities.includes(ctx.entity.id)) {
        return false;
      }
      entities.push(ctx.entity.id);
      return true;
    });

    this.props.tweet.countsQuery =
      [].concat(tweet.data.context_annotations ? tweet.data.context_annotations.map(ctx => {
        return { query: `context:${ctx.domain.id}.${ctx.entity.id}`, name: ctx.entity.name, search: `context:${ctx.domain.id}.${ctx.entity.id}` }
      }) : [])
      .concat(tweet.data.entities && tweet.data.entities.hashtags ? tweet.data.entities.hashtags.map(hashtag => {
        return { query: `#${hashtag.tag}`, name:  `#${hashtag.tag}`, search: encodeURIComponent(`#${hashtag.tag}`) }
      }) : [])
      .concat(tweet.data.entities && tweet.data.entities.mentions ? tweet.data.entities.mentions.map(mention => {
        return { query: `@${mention.username}`, name: `@${mention.username}`, search: `@${mention.username}` };
      }) : []);
    
    this.props.tweet.entities = tweet.data.entities;
    
    this.props.tweet.countsQuery.map(query => Emitter.dispatch(fetch(`/counts?q=${query.search}`)));
  }
  
  render() {
    if (this.state.tweetId) {
      twttr.widgets.createTweet(
        this.state.tweetId,
        this.wrapper,
        { 
          theme: document.querySelector('meta[name="twitter:widgets:theme"]')?.content || 'light',
          align: 'center'
        });
    }
    
    
    
//     this.component.classList.remove('hidden');
//     Object.keys(this.props.tweet).forEach(key => {
//       if (!this[key]) {
//         return;
//       }

//       switch (key) {
//         case 'profilePic':
//           this[key].src = this.props.tweet.profilePic;
//           this[key].addEventListener('click', () => window.open(`https://twitter.com/${this.props.tweet.username}`));
//           break;
//         case 'repliesCount':
//           this[key].innerText = `${this.props.tweet.repliesCount} ${this.props.tweet.repliesCount === 1 ? 'reply' : 'replies'}`;
//           break;
//         case 'username':
//           this[key].innerText = '@' + this.props.tweet.username;
//           break;
//         case 'timestamp':
//           this[key].innerText = Intl.DateTimeFormat(navigator.language, {dateStyle: 'long'}).format(new Date(this.props.tweet.timestamp));
//           break;
//         default:
//           this[key].innerHTML = this.props.tweet[key];
//       }
//     });
    
//     if (twemoji) {
//       twemoji.parse(this.component, {
//         folder: 'svg',
//         ext: '.svg'
//       });
//     }
  
  }
}