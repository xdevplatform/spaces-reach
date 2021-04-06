import Domo, { html } from '/domo.js';

export default class extends Domo {
  getTweetId(value) {
    const [tweetId] = value.match(/\d{1,19}$/) || [null];
    return tweetId;
  }
  
  submit() {
    location.href = '/' + this.getTweetId(this.shadowRoot.querySelector('input')?.value);
  }
  
  isValidTweetId() {
    const value = this.shadowRoot.querySelector('input')?.value || '';
    return !!this.getTweetId(value);
  }
  
  updateButton() {
    this.setState({validTweet: this.isValidTweetId()})
  }
  
  render() {
    const tweetId = this.getTweetId(location.pathname);
    
    if (tweetId) {
      return html``;
    } else {
      return html`
        <style>@import "/style.css"; :host {margin: 0 auto}</style>
        <input type="url" placeholder="Enter URL or Tweet ID" on-keyup="updateButton" />
        <button on-click="submit" ${this.isValidTweetId() ? '' : 'disabled'}>Get trends</button>`
    }
    
  }
}