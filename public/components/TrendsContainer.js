class TrendsContainer extends Emitter {
  constructor(element) {
    super(element);
  }
  
  async didReceiveData(response) {
    if (!response.url.match(/\/counts/)) {
      return;
    }

    if (!response.ok) {
      return;
    }
    
    const url = new URL(response.url);
    const query = url.searchParams.get('q');
    if (!query) {
      return;
    }

    const countsQuery = Emitter.registry.get(document.querySelector('main.tweet')).props.tweet.countsQuery;
    const { name } = countsQuery.find(q => q.query === query);
    
    if (!name) {
      return;
    }

    const json = await response.json();
    this.setState({query: query, name: name, stats: json});
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
    if (document.querySelector(`[data-query="${this.state.query}"]`)) {
      return;
    }
    
    if (!this.state.stats) {
      return;
    }
    
    const bigNumber = Emitter.template.BigNumber;
    bigNumber.dataset.results = JSON.stringify(this.state.stats.results);
    bigNumber.dataset.volume = this.state.stats.totalCount;
    bigNumber.dataset.name = this.state.name;
    bigNumber.dataset.query = this.state.query;
    this.component.appendChild(bigNumber);
  }
}