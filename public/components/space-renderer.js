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
    
    // const cache = sessionStorage.getItem(this.dataset.spaceId);
    // if (cache) {
    //   try {
    //     const tweet = JSON.parse(cache);
    //     this.prepareQueries(tweet);
    //     return;
    //   } catch(e) { }
    // }
    
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

  getTitle() {
    const { space } = this.state;
    if (!space.data.title) {
      const creatorId = space.data.creator_id;
      const { name } = space.includes.users.find(({id}) => id === creatorId);
      return `${name}'s Space`;
    }

    return space.data.title;
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
          <h1>${this.getTitle()}</h1>
          <space-runtime data-space-id=${this.dataset.spaceId} data-state="${space.state}" data-started-at=${space.started_at}></space-runtime>
          <big-number data-space-id="${this.dataset.spaceId}"></big-number>
        `;
    }
  }  
}

