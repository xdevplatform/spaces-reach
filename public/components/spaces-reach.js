import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';

export default class extends Domo {  
  getSpaceId() {
    const [spaceId] = location.pathname.match(/\d\w{1,13}$/i) || [null];
    return spaceId;
  }
  
  getInitialState() {
    const spaceId = this.getSpaceId();
    return { spaceId: spaceId };
  }
  
  render() {
    const spaceIdAttribute = this.state.spaceId ? `data-space-id="${this.state.spaceId}"` : '';
    return html`
      <link-container ${spaceIdAttribute}></link-container>
      <space-renderer ${spaceIdAttribute}></space-renderer>
    `;
  }
}