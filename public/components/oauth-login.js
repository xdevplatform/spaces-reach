import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';

export default class extends Domo {
  constructor() {
    super();
    const url = new URL(location.href);
    const userId = url.searchParams.get('user_id');
    if (userId) {
      localStorage.setItem('user_id', userId);
    }
  }

  getInitialState() {
    let state = {oauth1: false, oauth2: false};
    const userId = localStorage.getItem('user_id') || new URL(location.href).searchParams.get('user_id');
    if (userId) {
      state.oauth1 = true;
    }

    const cookie = document.cookie.split('; ').find(cookie => cookie.startsWith('token='))
    if (cookie) {
      state.oauth2 = true; 
    }

    return state;
  }

  renderOauth1Action() {
    if (this.state.oauth1) {
      return '✅';
    } else {
      return '<a class="button" href="/oauth1/oauth">Sign in with Twitter</a>';
    }
  }

  renderOauth2Action() {
    if (this.state.oauth2) {
      return '✅';
    } else {
      return '<a class="button" href="/oauth2/authorize">Authorize Spaces</a>';
    }
  }

  render() {
    return html`
      <style>@import "/style.css"; a.button { display: block }</style>
      <div style="width: 80%;margin: 0 auto">
        <div style="display: flex">
          <div style="flex: 1; flex-grow: 2">
            <h1>Step 1: Sign in with Twitter</h1>
            <p>Tap <b>Sign in with Twitter</b> to connect your account to this app. We use this step to determine your username (so you don't have to type it yourself).</p>
          </div>
          <div style="flex: 1">
            ${this.renderOauth1Action()}
          </div>
        </div>
        
        <div style="display: flex">
          <div style="flex: 1; flex-grow: 2">
            <h1>Step 2: Authorize Spaces</h1>
            <p>Tap <b>Authorize</b> to allow this app to see your live and upcoming Spaces.</p>
          </div>
          <div style="flex: 1">
            ${this.renderOauth2Action()}
          </div>
        </div>
      </div>`;
  }
}