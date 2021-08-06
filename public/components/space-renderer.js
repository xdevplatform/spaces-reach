import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';

export default class extends Domo {
  constructor() {
    super();
    this.fetch();
  }
  
  getInitialState() {
    return { status: 'loading' };
  }
  
  async fetch() {
    if (!this.dataset.spaceId) {
      return;
    }
    
    const cache = sessionStorage.getItem(this.dataset.spaceId);
    if (cache) {
      try {
        const tweet = JSON.parse(cache);
        this.prepareQueries(tweet);
        return;
      } catch(e) { }
    }
    
    const response = await fetch(`/2/spaces/${this.dataset.spaceId}`);
    if (!response.ok) {
      this.setState({status: 'error'});
      return;
    }
    
    try {
      const space = await response.json();
      sessionStorage.setItem(this.dataset.spaceId, JSON.stringify(space));
      this.setState({space: space, status: 'done'});
    } catch (e) {
      this.setState({status: 'error'});
    }
  }
  
  reload() {
    this.fetch();
    this.setState({ status: 'loading'});
  }
  
  render() {
    if (!this.dataset.spaceId) {
      return html``;
    }
    
    switch (this.state.status) {
      case 'loading':
        return html`<div style="text-align: center; font-size: 2rem">Loading…</div>`;
      case 'error':
        return html`<div style="text-align: center; font-size: 2rem" on-click="reload"><b>Error.</b> Tap to retry</div>`;
      case 'done':
        const space = this.state.space.data;
        return html`
          <h1>${space.title}</h1>
          <space-runtime data-state="${space.state}" data-started-at=${space.started_at}></space-runtime>
          <big-number data-space-id="${this.dataset.spaceId}"></big-number>
        `;
        // const elements = this.countsQuery.map(({name, query, search}) => 
        //   `<big-number data-name="${name}" data-query="${query}" data-search="${search}"></big-number>`);
        
        // if (elements.length === 0) {
        //   elements.push(`<div style="text-align: center; font-size: 1.5rem;line-height: 2rem"><b>This Tweet has to annotations, hashtags, or mentions.</b><br><a class="button" style="display: inline-block;margin: 1rem" href="/">Try a different Tweet</a></div>`);
        // }
        // elements.push('<style> @import "/style.css"; </style>');
        // return html(elements);
    }
  }  
}

