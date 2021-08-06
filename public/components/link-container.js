import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';

export default class extends Domo {
  getSpaceId(value) {
    const [spaceId] = value.match(/\d\w{1,13}$/i) || [null];
    return spaceId;
  }
  
  submit() {
    location.href = '/' + this.getSpaceId(this.state.spaceId);
  }
  
  updateButton(e) {
    this.setState({spaceId: this.getSpaceId(e.target.value)});
  }
  
  render() {
    const spaceId = this.getSpaceId(location.pathname);
    
    if (spaceId) {
      return html``;
    } else {
      return html`
        <style>@import "/style.css"; :host {margin: 0 auto}</style>
        <input type="url" placeholder="Enter URL or Space ID" on-keyup="updateButton" />
        <button on-click="submit" ${this.state.spaceId ? '' : 'disabled'}>Get Space</button>`
    }
    
  }
}