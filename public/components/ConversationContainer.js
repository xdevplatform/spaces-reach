class ConversationContainer extends Emitter {
  constructor(component) {
    super(component)
  }

  getInitialState() {
    return {show: false, canLoadConversation: false};
  }

  async didReceiveData(response) {
    if (response.url.match(/\/conversation\/\d{1,19}/) && response.ok) {
      const data = await response.clone().json();

      const state = {show: true, conversation: data};
      if (data.meta) {
        state.token = data.meta.token;
      }
      this.setState(state);
    }

    // TODO: handle pagination    
  }

  render() {
    if (!this.state.show) {
      this.component.classList.add('hidden');
      return;
    }
    
    this.component.classList.remove('hidden');
    this.state.conversation.data.forEach(tweet => {
      const tweetComponent = document.querySelector('[e\\:class="Tweet"]').cloneNode(true);
      const user = this.state.conversation.includes.users.find(user => user.id === tweet.author_id);
  
      tweetComponent.dataset.profilePic = user.profile_image_url;
      tweetComponent.dataset.name = user.name;
      tweetComponent.dataset.username = user.username;
      tweetComponent.dataset.text = tweet.text;
      tweetComponent.dataset.repliesCount = tweet.public_metrics.reply_count;
      tweetComponent.dataset.timestamp = tweet.timestamp;
      this.component.appendChild(tweetComponent);
      tweetComponent.classList.remove('hidden');
    });
  }
}