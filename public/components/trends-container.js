import Domo, { html } from '/domo.js';

export default class extends Domo {
  constructor() {
    super();
    this.fetch();
  }
  
  getInitialState() {
    return { status: 'loading' };
  }
  
  async fetch() {
    if (!this.dataset.tweetId) {
      return;
    }
    
    const cache = sessionStorage.getItem(this.dataset.tweetId);
    if (cache) {
      try {
        const tweet = JSON.parse(cache);
        this.prepareQueries(tweet);
        return;
      } catch(e) { }
    }
    
    const response = await fetch(`/tweet/${this.dataset.tweetId}`);
    if (!response.ok) {
      this.setState({status: 'error'});
      return;
    }
    
    try {
      const tweet = await response.json();
      sessionStorage.setItem(this.dataset.tweetId, JSON.stringify(tweet));
      this.prepareQueries(tweet);
    } catch (e) {
      this.setState({status: 'error'});
    }
  }
  
  reload() {
    this.fetch();
    this.setState({ status: 'loading'});
  }
  
  render() {
    console.log(this.dataset.tweetId)
    if (!this.dataset.tweetId) {
      return html``;
    }
    
    switch (this.state.status) {
      case 'loading':
        return html`<div style="text-align: center; font-size: 2rem">Loading…</div>`;
      case 'error':
        return html`<div style="text-align: center; font-size: 2rem" on-click="reload"><b>Error.</b> Tap to retry</div>`;
      case 'done':
        const elements = this.countsQuery.map(({name, query, search}) => 
          `<big-number data-name="${name}" data-query="${query}" data-search="${search}"></big-number>`);
        
        if (elements.length === 0) {
          elements.push(`<div style="text-align: center; font-size: 2rem"><b>No trends for this Tweet.</b><br><a class="button" style="display: inline-block;margin: 1rem" href="/">Try a different Tweet</a></div>`);
        }
        elements.push('<style> @import "/style.css"; </style>');
        return html(elements);
    }
  }
  
  prepareQueries(tweet) {
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
    
    this.setState({queriesDidPrepare: true, status: 'done'});
  }
}

