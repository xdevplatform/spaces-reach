import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';

export default class extends Domo {
  componentDidRender() {
    twttr.widgets.createTweet(
      this.dataset.tweetId,
      document.getElementById('tweet'),
      { 
        theme: document.querySelector('meta[name="twitter:widgets:theme"]')?.content || 'light',
        align: 'center',
        dnt: true,
        conversation: 'none'
      })
  }
  
  render() {
    return true;
  }
}

