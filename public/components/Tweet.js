class Tweet extends Emitter {
  constructor(component) {
    super(component);
    this.wrapper = component.querySelector('.tweet-wrapper');
    this.profilePic = component.querySelector('img');
    this.name = component.querySelector('.name');
    this.username = component.querySelector('.username');
    this.text = component.querySelector('h1');
    this.repliesCount = component.querySelector('.replies-count');
    this.timestamp = component.querySelector('.timestamp');
    // this.annotationsLabel = this.annotationsControls.querySelector('.related-label');
    this.datasetMap = ['profilePic', 'name', 'username', 'text', 'repliesCount', 'timestamp', 'tweetId'];
    this.props.tweet = {
      countsQuery: [],
    };
    this.datasetMap.forEach(key => {
      if (this.component.dataset[key]) {
        this.props.tweet[key] = this.component.dataset[key];
      }
    });
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