import Domo, { html, diff } from '/domo.js'

export default class TestSuite extends Domo {
  render() {
    return html`
      <diff-test></diff-test>
    `;
  }
}