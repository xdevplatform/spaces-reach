import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';

export default class extends Domo {
  getInitialState() {
    return JSON.parse(sessionStorage.getItem(this.dataset.state));
  }
  
  chartClick(e) {
    if (e.target.dataset.title === this.state.currentLabel) {
      this.setState({currentLabel: null});
    } else {
      this.setState({currentLabel: e.target.dataset.title})
    }
  }
  
  renderBars() {
    const dateFormatter = new Intl.DateTimeFormat('default', {month: 'short', day: 'numeric'});
    const numberFormatter = new Intl.NumberFormat();
    
    return this.state.results.map(({tweet_count, end}, i) => {
      let height = (tweet_count / this.state.max) * 100;
      // let dateParts = end.match(/(\d{4})(\d{2})(\d{2})/).splice(1,3);
      // dateParts[1] -= 1;
      // dateParts = dateParts.concat([0, 0, 0, 0]);
      const date = new Date(end);
      const dateLabel = `${dateFormatter.format(date)}: ${numberFormatter.format(tweet_count)}`;
      const zero = height === 0 ? 'zero' : '';
      const selected = this.state.currentLabel === dateLabel ? 'selected' : '';
      return `<div on-click="chartClick" data-title="${dateLabel}" class="histogram ${selected} ${zero}" style="height: ${height === 0 ? '100' : height.toFixed(2)}%"></div>`;
    }).join('');
  }
  
  render() {
    const trend = this.state.trend >= 0 ? 'up' : 'down';
    return html`
      <style> @import "/style.css"; </style>
      <div class="chart-container ${trend}">${this.renderBars()}</div>`;
  }
}