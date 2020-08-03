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
    this.annotationsControls = component.querySelector('.annotations-controls');
    this.hideReplyButton = this.annotationsControls.querySelector('button');
    this.annotationsLabel = this.annotationsControls.querySelector('.related-label');
    this.datasetMap = ['profilePic', 'name', 'username', 'text', 'repliesCount', 'timestamp', 'tweetId', 'domains'];
    this.props.tweet = {};
    this.isHidden = false;
    this.datasetMap.forEach(key => {
      if (this.component.dataset[key]) {
        this.props.tweet[key] = this.component.dataset[key];
      }

      if (key === 'domains') {
        this.props[key] = this.component.dataset[key] ? this.component.dataset[key].split(',') : [];
      }
    });

    if (Object.keys(this.props.tweet).length > 0) {
      this.setState({show: true});
    }

    this.props.acceptsDataFromApi = false;
    if (typeof this.component.dataset.acceptsDataFromApi !== 'undefined' && this.component.dataset.acceptsDataFromApi !== 'false') {
      this.props.acceptsDataFromApi = true;
    }
  }

  getInitialState() {
    const state = {
      replyIsHidden: 
        typeof this.component.dataset.tweetId !== 'undefined' ? 
          this.getHiddenStatus(this.component.dataset.tweetId) : 
          false,
      showAnnotationsControls: 
        typeof this.component.dataset.annotationsControls !== 'undefined' &&
          this.component.dataset.annotationsControls === 'false' ?
            false :
            true,
    };

    if (this.component.dataset.text) {
      state.show = true;
    }

    return state;
  }

  showAnnotationsControls(value) {
    this.setState({showAnnotationsControls: value});
  }

  async didReceiveData(response) {
    if (!this.props.acceptsDataFromApi) {
      return;
    }

    if (!response.url.match(/\/tweet\/\d{1,19}/)) {
      return;
    }

    if (!response.ok) {
      this.setState({show: false});
      return;
    }

    const tweet = await response.clone().json();

    this.props.tweet.profilePic = tweet.includes.users[0].profile_image_url;
    this.props.tweet.name = tweet.includes.users[0].name;
    this.props.tweet.username = tweet.includes.users[0].username;
    this.props.tweet.text = tweet.data.text;
    this.props.tweet.repliesCount = tweet.data.public_metrics.reply_count;
    this.props.tweet.timestamp = tweet.data.created_at;
    this.props.tweet.domains = tweet.data.context_annotations ? tweet.data.context_annotations.map(ctx => ctx.domain.id) : [];

    this.setState({
      show: true,
      replyIsHidden: this.getHiddenStatus(tweet.data.id) || false,
      tweetId: tweet.data.id,
    });
  }

  getDomainAffinityLabel() {
    const sportsDomains = ['6', '11', '12', '26', '27', '28', '39', '40', '60', '68', '92', '93', '136', '137', '138'];
    const intersection = sportsDomains.filter(domain => typeof this.props.tweet.domains !== 'undefined' && this.props.tweet.domains.includes(domain));

    if (intersection.length > 0) {
      return {
        annotationsLabel: 'Sports related according to Twitter’s AI',
        buttonLabel: 'Hide anyway',
      };
    } else {
      return {
        annotationsLabel: 'Probably not sports related',
        buttonLabel: 'Hide',
      };
    }
  }

  renderAnnotationsControls() {
    if (this.state.showAnnotationsControls) {
      this.annotationsControls.classList.remove('hidden');
    } else {
      this.annotationsControls.classList.add('hidden');
      return;
    }

    if (this.state.replyIsHidden) {
      this.annotationsLabel.innerText = 'You hid this Tweet.';
      this.hideReplyButton.innerText = 'Undo';
    } else {
      const labels = this.getDomainAffinityLabel();
      this.annotationsLabel.innerText = labels.annotationsLabel;
      this.hideReplyButton.innerText = labels.buttonLabel;
    }

  }
  
  hideReply() {
    const tweetWillHide = !this.state.replyIsHidden;

    if (tweetWillHide) {
      Emitter.dispatch(fetch(`/hide/${this.props.tweet.tweetId}`, {method: 'POST'}));
    } else {
      Emitter.dispatch(fetch(`/hide/${this.props.tweet.tweetId}`, {method: 'DELETE'}));
    }

    this.setHiddenStatus(this.props.tweet.tweetId, tweetWillHide);
  }

  setHiddenStatus(tweetId, hiddenStatus) {
    try {
      window.localStorage.setItem(tweetId, hiddenStatus);
    } catch (e) {
      window.sessionStorage.setItem(tweetId, hiddenStatus);
    }
    this.setState({replyIsHidden: hiddenStatus});
  }

  getHiddenStatus(tweetId) {
    let storageValue = null;
    try {
      storageValue = window.localStorage.getItem(tweetId);
    } catch (e) {
      storageValue = window.sessionStorage.getItem(tweetId);
    }

    return storageValue === null || storageValue === 'false' ? false : true;
  }

  render() {
    if (!this.state.show) {
      this.component.classList.add('hidden');
      return;
    }

    this.component.classList.remove('hidden');

    this.renderAnnotationsControls();

    if (this.state.replyIsHidden) {
      this.wrapper.classList.add('hidden');
    } else {
      this.wrapper.classList.remove('hidden');
    }

    Object.keys(this.props.tweet).forEach(key => {
      if (!this[key]) {
        return;
      }

      switch (key) {
        case 'profilePic':
          this[key].src = this.props.tweet.profilePic;
          break;
        case 'repliesCount':
          this[key].innerText = `${this.props.tweet.repliesCount} ${this.props.tweet.repliesCount === 1 ? 'reply' : 'replies'}`;
          break;
        case 'username':
          this[key].innerText = '@' + this.props.tweet.username;
          break;
        case 'timestamp':
          this[key].innerText = Intl.DateTimeFormat(navigator.language, {dateStyle: 'long'}).format(new Date(this.props.tweet.timestamp));
          break;
        default:
          this[key].innerText = this.props.tweet[key];
      }
    });

    if (twemoji) {
      twemoji.parse(this.component, {
        folder: 'svg',
        ext: '.svg'
      });
    }
  
  }
}