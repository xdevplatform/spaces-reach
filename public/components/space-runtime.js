import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';
import { intervalToDuration } from 'https://esm.run/date-fns';

export default class extends Domo {
  constructor() {
    super();
    this.interval = setInterval(() => {
      this.setState({refresh: new Date().getTime()});
    }, 1000);
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
      case 'Running':
        return `🟣 ON AIR`;
      case 'Scheduled':
        return `⌚️ SCHEDULED`;
      case 'Ended':
        return `⚪️ ENDED`;
    }
  }

  render() {
    return html`
      <p>${this.renderState()} (duration: ${this.duration()})</p>
    `;
  }

  componentDidRender() {
    if (this.dataset.state !== 'Running') {
      clearInterval(this.interval);
    }
  }
}

