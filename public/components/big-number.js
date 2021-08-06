import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';
import { intervalToDuration } from 'https://esm.run/date-fns';

export default class extends Domo { 
  key() {
    return `chart-${this.dataset.spaceId}`;
  }

  getInitialState() {
    const cachedItem = sessionStorage.getItem(this.key());
    if (cachedItem) {
      const state = JSON.parse(cachedItem);
      return state;
    }

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
    const response = await fetch(`/2/spaces/${this.dataset.spaceId}`)
    if (!response.ok) {
      console.warning(response);
      // this.setState({status: 'error'});
      return;
    }
    
    try {
      const { data } = await response.json();
      const state = {
        status: 'done',
        series: this.state.series || [],
        currentCount: data.participant_count,
        max: 0,
        min: 0,
      };
      state.series.push({
        label: this.duration(new Date(data.started_at), new Date()),
        value: data.participant_count
      });
      state.max = Math.max(...state.series.map(({ value }) => value));
      state.min = Math.min(...state.series.map(({ value }) => value));
      sessionStorage.setItem(this.key(), JSON.stringify(state));
      this.setState(state);
      
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
          <h4>Current participants: ${volume}</h4>
          <h5>Min: ${this.state.min}, max: ${this.state.max}</h5>
          <bar-chart on-click="chartClick" data-refresh="${Date.now()}" data-space-id="${this.dataset.spaceId}"></bar-chart>`;
    }    
  }

  componentDidRender() {
    setTimeout(() => this.fetch(), 60 * 1000);
  }
}

