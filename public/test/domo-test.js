import Domo, { html, diff } from '/domo.js'

export default class DomoTest extends Domo {
  constructor() {
    super();
    this.runTest();
  }
  
  get name() {
    return 'Test suite';
  }

  renderStatusIcon(name) {
    switch (this.state[name]) {
      case 'fail': return '⚠️';
      case 'pass': return '✅';
      default: return '🟣';
    }
  }
  
  pass(name) {
    const test = {};
    test[name] = 'pass';
    this.setState(test);
  }

  fail(name) {
    const test = {};
    test[name] = 'fail';
    this.setState(test);
  }

  render() {
    return html([
      `<style>div {line-height: 2rem}</style>`,
      `<h1>${this.name}</h1>`,
    ].concat(Object.keys(this.tests).map(name => `<div>${this.renderStatusIcon(name)} ${name}</div>`)));
  }
}