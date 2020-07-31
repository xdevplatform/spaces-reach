class Tweet extends Emitter {
  constructor(component) {
    super(component);
    this.profilePic = component.querySelector('img');
    this.name = component.querySelector('.name');
    this.username = component.querySelector('.username');
    this.text = component.querySelector('h1');
    this.repliesCount = component.querySelector('.replies-count');
    this.timestamp = component.querySelector('.timestamp');
    this.annotationsControls = component.querySelector('.annotations-controls');
    this.datasetMap = ['profilePic', 'name', 'username', 'text', 'repliesCount', 'timestamp'];
    this.props.tweet = {};
    this.datasetMap.forEach(key => {
      if (this.component.dataset[key]) {
        this.props.tweet[key] = this.component.dataset[key];
      }
    });

    this.props.acceptsDataFromApi = false;
    if (typeof this.component.dataset.acceptsDataFromApi !== 'undefined' && this.component.dataset.acceptsDataFromApi !== 'false') {
      this.props.acceptsDataFromApi = true;
    }

  }

  getInitialState() {
    const state = {
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

    const data = await response.clone().json();

    this.setState({
      show: true,
      tweetId: data.data.id,
    });
  }

  render() {
    console.log(this.props);
    if (!this.state.show) {
      this.component.classList.add('hidden');
      return;
    }

    this.component.classList.remove('hidden');

    if (this.state.showAnnotationsControls) {
      this.annotationsControls.classList.remove('hidden');
    } else {
      this.annotationsControls.classList.add('hidden');
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