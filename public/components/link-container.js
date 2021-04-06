import Domo, { html } from '/domo.js';

export default class extends Domo {
  getTweetId(value) {
    const [tweetId] = value.match(/\d{1,19}$/) || [null];
    return tweetId;
  }
  
  submit() {
    location.href = '/' + this.getTweetId(this.state.tweetId);
  }
  
  updateButton(e) {
    this.setState({tweetId: this.getTweetId(e.target.value)});
  }
  
  render() {
    const tweetId = this.getTweetId(location.pathname);
    
    if (tweetId) {
      return html``;
    } else {
      return html`
        <style>@import "/style.css"; :host {margin: 0 auto}</style>
        <input type="url" placeholder="Enter URL or Tweet ID" on-keyup="updateButton" />
        <button on-click="submit" ${this.state.tweetId ? '' : 'disabled'}>Get trends</button>`
    }
    
  }
}