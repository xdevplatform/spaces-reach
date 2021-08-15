import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';
import { intervalToDuration } from 'https://esm.run/date-fns';
import { Live, chartKey } from '/consts.js';

export default class extends Domo { 
  key() {
    return `chart-${this.dataset.spaceId}`;
  }

  getInitialState() {
    this.fetch();
    return { status: 'loading', results: null, currentLabel: null };
  }

  duration(start, end) {
    const {hours, minutes, seconds} = intervalToDuration({
      start: start, 
      end: end,
    });

    const zero = component => component <= 9 ? '0' + component : '' + component;

    if (hours > 0) {
      return `${zero(hours)}:${zero(minutes)}:${zero(seconds)}`;
    } else {
      return `${zero(minutes)}:${zero(seconds)}`;
    }
  }

  
  async fetch() {   
    const response = await fetch(`/2/chartdata/${this.dataset.spaceId}`);
    if (!response.ok) {
      console.warning(response);
      return;
    }
    
    try {
      const state = await response.json();
      this.setState(state);
      sessionStorage.setItem(chartKey(this.dataset.spaceId), JSON.stringify(state));
      
    } catch (e) {
      console.warn(e)
      this.setState({status: 'error'});
    }
  }
  
  chartClick(e) {
    const [element] = e.composedPath();
    const label = element.dataset.title || null;
    if (label === this.state.currentLabel) {
      this.setState({currentLabel: null});
    } else {
      this.setState({currentLabel: label});
    }
    
  }
  
  reload() {
    this.fetch();
    this.setState({status: 'loading'});
  }

  renderParticipantCount() {
    const { state } = JSON.parse(sessionStorage.getItem(this.dataset.spaceId))?.data;
    if (state === Live) {
      return `<h4>Current participants: ${this.state.currentCount}</h4>
        <h5>Min: ${this.state.min}, max: ${this.state.max}</h5>`;
    }

    return '';
  }
   
  render() {
    switch (this.state.status) {
      case 'loading':
        return html`
          <style> @import "/style.css"; div {text-align: center;height:72px} </style>
          <h4></h4>
          <div>Loading…</div>`;

      case 'error':
        return html`
          <style> @import "/style.css"; div {text-align: center;height:72px} </style>
          <h4></h4>
          <div on-click="reload"><b>Error.</b> Tap to reload</div>`;

      case 'done':
        const volume = this.state.currentLabel || new Intl.NumberFormat().format(this.state.currentCount);
        return html`
          <style> @import "/style.css"; h2, h4 {margin: 1rem 0.5rem} </style>
          ${this.renderParticipantCount()}
          <bar-chart on-click="chartClick" data-refresh="${Date.now()}" data-space-id="${this.dataset.spaceId}"></bar-chart>`;
    }    
  }

  componentDidRender() {
    setTimeout(() => this.fetch(), 60 * 1000);
  }
}

