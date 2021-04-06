import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';

export default class extends Domo {  
  getTweetId() {
    const [tweetId] = location.pathname.match(/\d{1,19}$/) || [null];
    return tweetId;
  }
  
  getInitialState() {
    const tweetId = this.getTweetId();
    return { tweetId: tweetId };
  }
  
  render() {
    const tweetIdAttribute = this.state.tweetId ? `data-tweet-id="${this.state.tweetId}"` : '';
    return html`
      <link-container ${tweetIdAttribute}></link-container>
      <tweet-renderer ${tweetIdAttribute}></tweet-renderer>
      <trends-container ${tweetIdAttribute}></trends-container>
    `;
  }
}