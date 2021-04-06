import Domo, { html } from '/domo.js';

export default class extends Domo {
  getInitialState() {
    return JSON.parse(sessionStorage.getItem(this.dataset.state));
  }
  
  histogramClick(e) {
    if (e.target.dataset.title === this.state.currentLabel) {
      this.setState({currentLabel: null});
    } else {
      this.setState({currentLabel: e.target.dataset.title})
    }
  }
  
  renderBars() {
    const dateFormatter = new Intl.DateTimeFormat('default', {month: 'short', day: 'numeric'});
    const numberFormatter = new Intl.NumberFormat();
    
    return this.state.results.map(({count, timePeriod}, i) => {
      let height = (count / this.state.max) * 100;
      let dateParts = timePeriod.match(/(\d{4})(\d{2})(\d{2})/).splice(1,3);
      dateParts[1] -= 1;
      dateParts = dateParts.concat([0, 0, 0, 0]);
      const date = new Date(Date.UTC(...dateParts));
      const dateLabel = `${dateFormatter.format(date)}: ${numberFormatter.format(count)}`;
      const zero = height === 0 ? 'zero' : '';
      const selected = this.state.currentLabel === dateLabel ? 'selected' : '';
      return `<div on-click="histogramClick" data-title="${dateLabel}" class="histogram ${selected} ${zero}" style="height: ${height === 0 ? '100' : height.toFixed(2)}%"></div>`;
    }).join('');
  }
  
  render() {
    const trend = this.state.trend >= 0 ? 'up' : 'down';
    return html`
      <style> @import "/style.css"; </style>
      <div class="chart-container ${trend}">${this.renderBars()}</div>`;
  }
}