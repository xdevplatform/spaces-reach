class TrendsContainer extends Emitter {
  constructor(element) {
    super(element);
    this.error = this.component.querySelector('.error');
    this.countsQuery = [];
  }
  
  async didReceiveData(response) {
    if (!response.url.match(/\/tweet\/\d{1,19}/)) {
      return;
    }

    if (!response.ok) {
      return;
    }

    const tweet = await response.clone().json();
    this.setState({
      tweetId: tweet.data.id,
    });

    return this.dispatchTrends(tweet);
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

    this.countsQuery =
      [].concat(tweet.data.context_annotations ? tweet.data.context_annotations.map(ctx => {
        return { query: `context:${ctx.domain.id}.${ctx.entity.id}`, name: ctx.entity.name, search: `context:${ctx.domain.id}.${ctx.entity.id}` }
      }) : [])
      .concat(tweet.data.entities && tweet.data.entities.hashtags ? tweet.data.entities.hashtags.map(hashtag => {
        return { query: `#${hashtag.tag}`, name:  `#${hashtag.tag}`, search: encodeURIComponent(`#${hashtag.tag}`) }
      }) : [])
      .concat(tweet.data.entities && tweet.data.entities.mentions ? tweet.data.entities.mentions.map(mention => {
        return { query: `@${mention.username}`, name: `@${mention.username}`, search: `@${mention.username}` };
      }) : []);
    
    // this.props.tweet.countsQuery.map(query => Emitter.dispatch(fetch(`/counts?q=${query.search}`)));
    
    if (this.countsQuery.length) {
      this.setState({hasQueries: true});
    }    
  }
  
  render() {
    if (!this.state.hasQueries) {
      this.error.hidden = false;
      return;
    }
    
    this.countsQuery.map(query => {
      const bigNumber = Emitter.template.BigNumber;
      bigNumber.dataset.name = query.name;
      bigNumber.dataset.query = query.query;
      bigNumber.dataset.search = query.search;
      this.component.appendChild(bigNumber);      
    });    
  }
}