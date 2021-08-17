import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';

export default class extends Domo {  
  getInitialState() {
    this.fetch();
    return { status: 'loading', results: null };
  }

  async fetch() {
    const userId = localStorage.getItem('user_id');
    const response = await fetch('/2/spaces/by/creator_ids?user_ids=' + userId);
    if (!response.ok) {
      this.setState({status: 'error'});
      return;
    }

    try {
      const results = await response.json();
      console.log(results);
      this.setState({status: 'done', results: results});
    } catch (e) {
      console.warn(e)
      this.setState({status: 'error'});
    }
  }
  
  render() {
    console.log(this.state);
    if (this.state.status === 'loading') {
      return html`<h1 style="text-align: center">Loading…</h1>`;
    }

    if (this.state.results.meta.result_count === 0) {
      return html`
        <div style="text-align: center;width: 80%;margin: 0 auto">
          <h1>No Spaces found</h1>
          <p>You have no live or scheduled Spaces yet. Open the Twitter app on your phone and create a Space.</p>
        </div>`;
    }
    
  }
}