class TweetLink extends Emitter {
  constructor(component) {
    super(component);
    
    [this.tweetId] = location.pathname.match(/\d{1,19}/);
    console.log(this.tweetId)
    
    if (this.tweetId) {
      Emitter.dispatch(fetch(`/tweet/${this.tweetId}`));
    }
    
    this.field = document.getElementById('tweet-url');
    this.button = document.getElementById('fetch');
    this.component.hidden = true;
  }

  getTweetUrlRegex(value) {
    return value.match(/https:\/\/(www\.)?twitter\.com\/[\d\w_]+\/status\/(\d{1,19})/)
  }

  validate(event) {
    if (event.target !== this.field) {
      return;
    }

    this.setState({tweetUrlIsValid: !!this.getTweetUrlRegex(this.field.value)});
  }

  async didReceiveData(data) {
    if (!data.url.match(/\/tweet\/\d{1,19}/)) {
      return;
    }

    if (!data.ok) {
      const json = await data.clone().json();
      this.setState(json);
    }
  }

  async fetch(event) {
    if (event.target !== this.button) {
      return;
    }

    const [, , tweetId] = this.getTweetUrlRegex(this.field.value);
    const tweet = await Emitter.dispatch(fetch(`/tweet/${tweetId}`));
    console.log(tweet);
  }

  render() {
    if (!this.tweetId) {
      this.component.hidden = false;  
      return;
    }
    
    if (!this.state.tweetUrlIsValid) {
      this.button.setAttribute('disabled', 'true');
      this.field.setAttribute('class', 'error');        
    } else {
      this.button.removeAttribute('disabled');
      this.field.removeAttribute('class');
    }
  }
}