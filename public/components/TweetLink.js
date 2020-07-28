class TweetLink extends Emitter {
  constructor(component) {
    super(component);
    this.field = document.getElementById('tweet-url');
    this.button = document.getElementById('fetch');
    this.initFieldListener();
  }

  initFieldListener() {
    this.field.addEventListener('keyup', () => {
      if (!this.field.value.match(/https:\/\/(www\.)?twitter\.com\/[\d\w_]+\/status\/(\d{1,19})/)) {
        this.button.setAttribute('disabled', 'true');
        this.field.setAttribute('class', 'error');
      } else {
        this.button.removeAttribute('disabled');
        this.field.removeAttribute('class');
      }
    });
  }
}