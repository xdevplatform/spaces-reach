import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';

export default class extends Domo {
  key() {
    return `chart-${this.dataset.spaceId}`;
  }

  getInitialState() {
    return JSON.parse(sessionStorage.getItem(this.key()));
  }
  
  chartClick(e) {
    if (e.target.dataset.title === this.state.currentLabel) {
      this.setState({currentLabel: null});
    } else {
      this.setState({currentLabel: e.target.dataset.title})
    }
  }
  
  renderBars() {
    return this.state.series.map(({label, value}, i) => {
      let height = (value / this.state.max) * 100;
      const zero = height === 0 ? 'zero' : '';
      const selected = this.state.currentLabel === label ? 'selected' : '';
      return `<div on-click="chartClick" data-title="${label} (${value})" class="histogram ${selected} ${zero}" style="height: ${height === 0 ? '100' : height.toFixed(2)}%"></div>`;
    }).join('');
  }
  
  render() {
    return html`
      <style> @import "/style.css"; </style>
      <div class="chart-container">${this.renderBars()}</div>`;
  }
}