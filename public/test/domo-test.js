import Domo, { html, diff } from '/domo.js'

const t = s => html([s]).children[0] || null;

export default class DomoTest extends Domo {
  get tests() {
    return {
      'no change': {
        currentDom: html`<div class="test">Hello <i>world<i></div>`,
        newDom: html`<div class="test">Hello <i>world<i></div>`,
        expected: {added: [], removed: []},
      },
      'siblings': {
        currentDom: html`
          <div class="test">Hello</div>
          <div>brave</div>
          <div>brave</div>
          <div>brave</div>
          <div>world</div>
          <div>new</div>`,
        newDom: html`
          <div>brave</div>
          <div class="test">Hello</div>
          <div>brave</div>
          <div>world</div>`,
        expected: {
          added: [t`<div>brave</div>`, t`<div class="test">Hello</div>`, t`<div>world</div>`],
          removed: [t`<div>new</div>`, t`<div>world</div>`, t`<div class="test">Hello</div>`, t`<div>brave</div>`, t`<div>brave</div>`],
        }
      },
      'children': {
        currentDom: html`<div class="chart-container down"><div on-click="histogramClick" data-title="Mar 5: 2,973,831" class="histogram  " style="height: 27.19%"></div><div on-click="histogramClick" data-title="Mar 6: 4,757,041" class="histogram  " style="height: 43.50%"></div><div on-click="histogramClick" data-title="Mar 7: 9,236,311" class="histogram  " style="height: 84.46%"></div><div on-click="histogramClick" data-title="Mar 8: 5,168,001" class="histogram  " style="height: 47.26%"></div><div on-click="histogramClick" data-title="Mar 9: 6,187,725" class="histogram  " style="height: 56.58%"></div><div on-click="histogramClick" data-title="Mar 10: 3,870,751" class="histogram  " style="height: 35.40%"></div><div on-click="histogramClick" data-title="Mar 11: 2,470,586" class="histogram  " style="height: 22.59%"></div><div on-click="histogramClick" data-title="Mar 12: 3,401,013" class="histogram  " style="height: 31.10%"></div><div on-click="histogramClick" data-title="Mar 13: 10,455,059" class="histogram  " style="height: 95.61%"></div><div on-click="histogramClick" data-title="Mar 14: 10,935,339" class="histogram  " style="height: 100.00%"></div><div on-click="histogramClick" data-title="Mar 15: 2,640,325" class="histogram  " style="height: 24.14%"></div><div on-click="histogramClick" data-title="Mar 16: 2,238,733" class="histogram  " style="height: 20.47%"></div><div on-click="histogramClick" data-title="Mar 17: 2,061,698" class="histogram  " style="height: 18.85%"></div><div on-click="histogramClick" data-title="Mar 18: 2,619,177" class="histogram  " style="height: 23.95%"></div><div on-click="histogramClick" data-title="Mar 19: 2,043,243" class="histogram  " style="height: 18.68%"></div><div on-click="histogramClick" data-title="Mar 20: 1,498,117" class="histogram  " style="height: 13.70%"></div><div on-click="histogramClick" data-title="Mar 21: 1,734,149" class="histogram  " style="height: 15.86%"></div><div on-click="histogramClick" data-title="Mar 22: 1,750,657" class="histogram  " style="height: 16.01%"></div><div on-click="histogramClick" data-title="Mar 23: 2,828,148" class="histogram  " style="height: 25.86%"></div><div on-click="histogramClick" data-title="Mar 24: 2,421,276" class="histogram  " style="height: 22.14%"></div><div on-click="histogramClick" data-title="Mar 25: 2,545,328" class="histogram  " style="height: 23.28%"></div><div on-click="histogramClick" data-title="Mar 26: 1,947,184" class="histogram  " style="height: 17.81%"></div><div on-click="histogramClick" data-title="Mar 27: 5,303,548" class="histogram  " style="height: 48.50%"></div><div on-click="histogramClick" data-title="Mar 28: 3,230,077" class="histogram  " style="height: 29.54%"></div><div on-click="histogramClick" data-title="Mar 29: 3,279,164" class="histogram  " style="height: 29.99%"></div><div on-click="histogramClick" data-title="Mar 30: 2,959,479" class="histogram  " style="height: 27.06%"></div><div on-click="histogramClick" data-title="Mar 31: 4,409,189" class="histogram  " style="height: 40.32%"></div><div on-click="histogramClick" data-title="Apr 1: 2,999,724" class="histogram  " style="height: 27.43%"></div><div on-click="histogramClick" data-title="Apr 2: 1,878,668" class="histogram  " style="height: 17.18%"></div><div on-click="histogramClick" data-title="Apr 3: 3,958,871" class="histogram  " style="height: 36.20%"></div><div on-click="histogramClick" data-title="Apr 4: 157,284" class="histogram  " style="height: 1.44%"></div></div>`,
        newDom: html`<div class="chart-container down"><div on-click="histogramClick" data-title="Mar 5: 2,973,831" class="histogram  " style="height: 27.19%"></div><div on-click="histogramClick" data-title="Mar 6: 4,757,041" class="histogram  " style="height: 43.50%"></div><div on-click="histogramClick" data-title="Mar 7: 9,236,311" class="histogram  selected" style="height: 84.46%"></div><div on-click="histogramClick" data-title="Mar 8: 5,168,001" class="histogram  " style="height: 47.26%"></div><div on-click="histogramClick" data-title="Mar 9: 6,187,725" class="histogram  " style="height: 56.58%"></div><div on-click="histogramClick" data-title="Mar 10: 3,870,751" class="histogram  " style="height: 35.40%"></div><div on-click="histogramClick" data-title="Mar 11: 2,470,586" class="histogram  " style="height: 22.59%"></div><div on-click="histogramClick" data-title="Mar 12: 3,401,013" class="histogram  " style="height: 31.10%"></div><div on-click="histogramClick" data-title="Mar 13: 10,455,059" class="histogram  " style="height: 95.61%"></div><div on-click="histogramClick" data-title="Mar 14: 10,935,339" class="histogram  " style="height: 100.00%"></div><div on-click="histogramClick" data-title="Mar 15: 2,640,325" class="histogram  " style="height: 24.14%"></div><div on-click="histogramClick" data-title="Mar 16: 2,238,733" class="histogram  " style="height: 20.47%"></div><div on-click="histogramClick" data-title="Mar 17: 2,061,698" class="histogram  " style="height: 18.85%"></div><div on-click="histogramClick" data-title="Mar 18: 2,619,177" class="histogram  " style="height: 23.95%"></div><div on-click="histogramClick" data-title="Mar 19: 2,043,243" class="histogram  " style="height: 18.68%"></div><div on-click="histogramClick" data-title="Mar 20: 1,498,117" class="histogram  " style="height: 13.70%"></div><div on-click="histogramClick" data-title="Mar 21: 1,734,149" class="histogram  " style="height: 15.86%"></div><div on-click="histogramClick" data-title="Mar 22: 1,750,657" class="histogram  " style="height: 16.01%"></div><div on-click="histogramClick" data-title="Mar 23: 2,828,148" class="histogram  " style="height: 25.86%"></div><div on-click="histogramClick" data-title="Mar 24: 2,421,276" class="histogram  " style="height: 22.14%"></div><div on-click="histogramClick" data-title="Mar 25: 2,545,328" class="histogram  " style="height: 23.28%"></div><div on-click="histogramClick" data-title="Mar 26: 1,947,184" class="histogram  " style="height: 17.81%"></div><div on-click="histogramClick" data-title="Mar 27: 5,303,548" class="histogram  " style="height: 48.50%"></div><div on-click="histogramClick" data-title="Mar 28: 3,230,077" class="histogram  " style="height: 29.54%"></div><div on-click="histogramClick" data-title="Mar 29: 3,279,164" class="histogram  " style="height: 29.99%"></div><div on-click="histogramClick" data-title="Mar 30: 2,959,479" class="histogram  " style="height: 27.06%"></div><div on-click="histogramClick" data-title="Mar 31: 4,409,189" class="histogram  " style="height: 40.32%"></div><div on-click="histogramClick" data-title="Apr 1: 2,999,724" class="histogram  " style="height: 27.43%"></div><div on-click="histogramClick" data-title="Apr 2: 1,878,668" class="histogram  " style="height: 17.18%"></div><div on-click="histogramClick" data-title="Apr 3: 3,958,871" class="histogram  " style="height: 36.20%"></div><div on-click="histogramClick" data-title="Apr 4: 157,284" class="histogram  " style="height: 1.44%"></div></div>`,
        expected: {
          added: [t`<div on-click="histogramClick" data-title="Mar 7: 9,236,311" class="histogram  selected" style="height: 84.46%"></div>`],
          removed: [t`<div on-click="histogramClick" data-title="Mar 7: 9,236,311" class="histogram  " style="height: 84.46%"></div>`]
        }
      },
      'empty': {
        currentDom: html`<div>Loading</div>`,
        newDom: html`
          <style> @import "/style.css" </style>
          <h2>name</h2>
          <h4>volume</h4>
          <bar-chart on-click="chartClick" data-trend="attribute" data-state="attribute"></bar-chart>`,
        expected: {
          added: [t`<h2>name</h2>`, t`<h4>volume</h4>`, t`<bar-chart on-click="chartClick" data-trend="attribute" data-state="attribute"></bar-chart>`, t`<style> @import "/style.css" </style>`],
          removed: [t`<div>Loading</div>`]
        }
      }
    }
  }

  constructor() {
    super();
    this.runTest();
  }

  compare(name, result, expected) {    
    let test = {};
    if (result.added.length !== expected.added.length) {
      test[name] = 'fail';
    } else if (result.removed.length !== expected.removed.length) {
      test[name] = 'fail';
    } else if (expected.added.filter((element, i) => !element.isEqualNode(result.added[i])).length > 0) {
      test[name] = 'fail';
    } else if (expected.removed.filter((element, i) => !element.isEqualNode(result.removed[i])).length > 0) {
      test[name] = 'fail';
    } else {
      test[name] = 'pass';
    }
    return this.setState(test);
  }

  runTest() {
    Object.keys(this.tests).map(name => {
      const test = this.tests[name];
      const [, result] = diff(test.currentDom, test.newDom);
      this.compare(name, result, test.expected);
    });
  }

  renderStatusIcon(name) {
    switch (this.state[name]) {
      case 'running': return '🟣';
      case 'fail': return '⚠️';
      case 'pass': return '✅';
    }
  }

  render() {
    const tests = Object.keys(this.tests).map(name => `<div>${this.renderStatusIcon(name)} ${name}</div>`)
    return html(tests);
  }
}