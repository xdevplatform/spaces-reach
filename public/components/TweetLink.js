class TweetLink extends Emitter {
  constructor(component) {
    super(component);
    this.field = document.getElementById('tweet-url');
    this.button = document.getElementById('fetch');
    this.initValidationListener();
    this.initFetchButton();
  }

  getTweetUrlRegex(value) {
    return value.match(/https:\/\/(www\.)?twitter\.com\/[\d\w_]+\/status\/(\d{1,19})/)
  }

  initValidationListener() {
    this.field.addEventListener('keyup', () => {
      if (!this.getTweetUrlRegex(this.field.value)) {
        this.button.setAttribute('disabled', 'true');
        this.field.setAttribute('class', 'error');        
      } else {
        this.button.removeAttribute('disabled');
        this.field.removeAttribute('class');
      }
    });
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

  initFetchButton() {
    this.button.addEventListener('click', () => {
      const [, , tweetId] = this.getTweetUrlRegex(this.field.value);
      Emitter.fetch(fetch(`/tweet/${tweetId}`));
    });
  }

  render() {}
}