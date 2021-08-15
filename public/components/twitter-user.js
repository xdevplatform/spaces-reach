import Domo, { html } from 'https://cdn.jsdelivr.net/gh/iamdaniele/domo/domo.js';

export default class extends Domo { 
  renderFollowersLabel(followers) {
    switch (followers) {
      case 0:
        return 'zero followers';
      case 1:
        return '1 follower';
      default:
        return `${followers} followers`;
    }
  }

  renderBio(description = '') {
    return description.replaceAll('\n', '<br>');
  }

  render() {
    return html`
      <style>@import '/style.css'</style>
      <a href="https://twitter.com/${this.dataset.username}" target="_blank" style="text-decoration: none; display: flex; flex-wrap: nowrap;font-size: 0.8rem">
        <div><img style="border-radius: 32px;display:block;margin: 0.5rem" src="${this.dataset.profileImageUrl}" height="64" width="64"></div>
        <div style="flex-grow: 2"><h2 style="margin:0;padding:0">${this.dataset.name}</h2><h4 style="margin:0;padding:0">${this.dataset.username}</h4><p>${this.renderBio(this.dataset.description)}</p><p>${this.renderFollowersLabel(this.dataset.followersCount)}</p></div>
      </a>`;
  }
}

