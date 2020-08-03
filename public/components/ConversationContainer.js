class ConversationContainer extends Emitter {
  constructor(component) {
    super(component);
    this.conversation = this.component.querySelector('.conversation');
    this.paginationLabel = this.component.querySelector('.pagination h4');
    this.paginationButton = this.component.querySelector('.pagination button');
  }

  getInitialState() {
    return {show: false, reset: false};
  }

  async didReceiveData(response) {
    if (response.url.match(/\/tweet\/\d{1,19}/)) {
      let state = {};
      if (response.ok) {
        const conversationId = response.url.match(/\/tweet\/(\d{1,19})/)[1];

        state = {canRenderConversation: true};
        if (conversationId !== this.state.conversationId) {
          state.reset = true;
          state.conversationId = conversationId;
        }
      } else {
        state = {canRenderConversation: false, show: false};
      }

      this.setState(state);
      return;
    }

    if (response.url.match(/\/conversation\/\d{1,19}/) && response.ok) {
      const data = await response.clone().json();

      const state = {
        show: true, 
        reset: false,
        canRenderConversation: true, 
        conversation: data,
      };

      if (data.meta) {

        if (data.meta.newest_id && !data.meta.token) {
          state.token = null;
          state.sinceId = data.meta.newest_id;
        } else if (data.meta.newest_id && data.meta.token) {
          state.token = null;
        }

        state.token = data.meta.token || null;
        
        if (data.meta.newest_id && (this.state.sinceId && this.state.sinceId < data.meta.newest_id)) {
          state.sinceId = data.meta.newest_id || 0;
        }
      }

      if (state.token) {
        state.paginationLabel = 'There are more replies in this conversation';
        state.buttonLabel = 'Load more replies';
      } else {
        state.paginationLabel = 'All caught up!';
        state.buttonLabel = 'Check for new replies';
      }

      this.setState(state);
    }
  }

  refresh() {
    const query = [];
    
    if (this.state.token) {
      query.push('next_token=' + this.state.token);
    }

    if (this.state.sinceId) {
      query.push('since_id=' + this.state.sinceId);
    }

    Emitter.dispatch(fetch(`/conversation/${this.state.conversationId}?${query.join('&')}`));  
  }

  render() {
    if (!this.state.show || !this.state.canRenderConversation) {
      this.component.classList.add('hidden');
      return;
    }

    if (this.state.reset) {
      this.component.classList.add('hidden');
      this.conversation.innerHTML = '';
      return;
    }
    
    this.component.classList.remove('hidden');

    this.paginationLabel.innerText = this.state.paginationLabel;
    this.paginationButton.innerText = this.state.buttonLabel;

    if (!this.state.conversation.data) {
      return;
    }

    this.state.conversation.data.forEach(tweet => {
      const tweetComponent = document.querySelector('[e\\:class="Tweet"]').cloneNode(true);
      const user = this.state.conversation.includes.users.find(user => user.id === tweet.author_id);
        
      tweetComponent.dataset.profilePic = user.profile_image_url;
      tweetComponent.dataset.name = user.name;
      tweetComponent.dataset.username = user.username;
      tweetComponent.dataset.text = tweet.text;
      tweetComponent.dataset.tweetId = tweet.id;
      tweetComponent.dataset.repliesCount = tweet.public_metrics.reply_count;
      tweetComponent.dataset.timestamp = tweet.created_at;

      if (tweet.context_annotations) {
        tweetComponent.dataset.domains = tweet.context_annotations.map(ctx => ctx.domain.id).join(',');
      }
      
      tweetComponent.dataset.annotationsControls = 'true';
      this.conversation.appendChild(tweetComponent);
      tweetComponent.classList.remove('hidden');
    });
  }
}