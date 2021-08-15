import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';
import { intervalToDuration } from 'https://esm.run/date-fns';
import { Live, Scheduled, Ended, Canceled } from '/consts.js';

export default class extends Domo {
  constructor() {
    super();
  }

  duration() {
    const {hours, minutes, seconds} = intervalToDuration({
      start: new Date(this.dataset.startedAt), 
      end: new Date(),
    });

    const zero = component => component <= 9 ? '0' + component : '' + component;

    if (hours > 0) {
      return `${zero(hours)}:${zero(minutes)}:${zero(seconds)}`;
    } else {
      return `${zero(minutes)}:${zero(seconds)}`;
    }
  }

  renderState() {
    switch (this.dataset.state) {
      case Live:
        return `🟣 ON AIR`;
      case Scheduled:
        return `⌚️ SCHEDULED`;
      case Ended:
      case Canceled:
        return `⚪️ ENDED`;
    }
  }

  getUserIncludesFromList(key) {
    const space = JSON.parse(sessionStorage.getItem(this.dataset.spaceId));
    return space.includes.users.filter(({id}) => space.data[key].includes(id));
  }

  renderUsers(key) {
    const users = this.getUserIncludesFromList(key);
    return users.map(({profile_image_url, username, name, public_metrics}) => 
      `<twitter-user
        data-profile-image-url=${profile_image_url}
        data-username="${username}"
        data-followers-count="${public_metrics.followers_count}"
        data-name="${name}">
        </twitter-user>`)
      .join('');
  }

  renderDuration() {
    if (this.dataset.state === Live) {
      return `(duration: ${this.duration()})`;
    }

    return '';
  }

  render() {
    return html`
      <p>${this.renderState()} ${this.renderDuration()}</p>
      <h1>Hosted by</h1>
      ${this.renderUsers('host_ids')}
      <h1>Speakers</h1>
      ${this.renderUsers('speaker_ids')}
    `;
  }

  componentDidRender() {
    if (this.dataset.state !== Live) {
      clearInterval(this.interval);
    } else if (!this.interval) {
      this.interval = setInterval(() => {
        this.setState({refresh: new Date().getTime()});
      }, 1000);
    }
  }
}

