import Domo, { html, diff } from '/domo.js'

export default class Test extends Domo {
  constructor() {
    super();
    this.runTest();
  }

  renderStatusIcon(name) {
    switch (this.state[name]) {
      case 'running': return '🟣';
      case 'fail': return '⚠️';
      case 'pass': return '✅';
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
    const tests = Object.keys(this.tests).map(name => `<div>${this.renderStatusIcon(name)} ${name}</div>`)
    tests.unshift(`<style>div {line-height: 2rem}</style>`);
    return html(tests);
  }
}