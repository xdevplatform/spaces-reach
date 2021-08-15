import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';
import { chartKey } from '/consts.js';

export default class extends Domo {
  getInitialState() {
    return JSON.parse(sessionStorage.getItem(chartKey(this.dataset.spaceId)));
  }
  
  chartClick(e) {
    if (e.target.dataset.title === this.state.currentLabel) {
      this.setState({currentLabel: null});
    } else {
      this.setState({currentLabel: e.target.dataset.title})
    }
  }
  
  renderBars() {
    if (!this.state?.series) {
      return '';
    }

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