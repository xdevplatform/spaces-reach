class Tweet extends Emitter {
  constructor(component) {
    super(component);
    this.wrapper = component.querySelector('.tweet-wrapper');
  }

  async didReceiveData(response) {
    if (response.url.match(/\/tweet\/\d{1,19}/)) {
      const tweet = await response.clone().json();
      this.setState({
        tweetId: tweet.data.id,
      });
    }    
  }
   
  render() {
    if (this.state.tweetId) {
      twttr.widgets.createTweet(
        this.state.tweetId,
        this.wrapper,
        { 
          theme: document.querySelector('meta[name="twitter:widgets:theme"]')?.content || 'light',
          align: 'center',
          dnt: true,
          conversation: 'none'
        });
    }
  }
}