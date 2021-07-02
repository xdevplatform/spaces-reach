import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';

export default class extends Domo { 
  getInitialState() {
    const cachedItem = sessionStorage.getItem(this.dataset.search);
    if (cachedItem) {
      const state = JSON.parse(cachedItem);
      return state;
    }

    this.fetch();
    return { status: 'loading', results: null, currentLabel: null };
  }
  
  async fetch() {   
    const response = await fetch(`/2/counts?q=${this.dataset.search}`)
    if (!response.ok) {
      this.setState({status: 'error'});
      return;
    }
    
    try {
      const results = await response.json();
      const dataCounts = results.data.map(data => data.tweet_count);
      const state = {
        status: 'done',
        results: results.data,
        totalCount: results.meta.total_tweet_count,
        dataCounts: dataCounts,
        max: Math.max(...dataCounts),
        trend: this.determineTrend(results),
      };
      sessionStorage.setItem(this.dataset.search, JSON.stringify(state));
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
  
  determineTrend(results) {   
    const length = results.data.length;
    let sumOfLength = results.data.reduce((ac, el, i) => ac + i, 0);
    let sumOfMultipliedValues = results.data.reduce((ac, el, i) => ac + el.tweet_count * i, 0);
    let sumOfValues = results.totalCount;
    let sumOfSquares = results.data.reduce((ac, el, i) => ac + el.count ** 2, 0);
    return (length * sumOfMultipliedValues - sumOfLength * sumOfValues) / (length * sumOfSquares - Math.sqrt(sumOfLength));
  }
  
  render() {
    switch (this.state.status) {
      case 'loading':
        return html`
          <style> @import "/style.css"; div {text-align: center;height:72px} </style>
          <h2>${this.dataset.name}</h2>
          <h4></h4>
          <div>Loading…</div>`;

      case 'error':
        return html`
          <style> @import "/style.css"; div {text-align: center;height:72px} </style>
          <h2>${this.dataset.name}</h2>
          <h4></h4>
          <div on-click="reload"><b>Error.</b> Tap to reload</div>`;

      case 'done':
        const volume = this.state.currentLabel || new Intl.NumberFormat().format(this.state.totalCount);
        const trend = this.state.trend >= 0 ? 'up' : 'down';       
        return html`
          <style> @import "/style.css"; h2, h4 {margin: 1rem 0.5rem} </style>
          <h2>${this.dataset.name}</h2>
          <h4>${volume}</h4>
          <bar-chart on-click="chartClick" data-trend="${trend}" data-state="${this.dataset.search}"></bar-chart>`;
    }    
  }
}

