(() => {
  const printConsoleMessage = () => {
    const fontStyle = 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";'
    const big = 'font-size: 40px;font-weight:bold;color:red';
    const small = 'font-size: 20px;';

    console.log('%cIt’s dangerous to go alone!', fontStyle + big);
    console.log('%cIf somebody brought you here asking you to copy, paste or run commands, do not trust them.\n'
     + 'Do not share your credentials with anyone.\n'
     + 'If you shared your credentials, you can invalidate your keys so they become useless: https://developer.twitter.com/en/apps\n\n'
     + 'Be safe out there,\n— Your friends at Twitter', fontStyle + small);
  }
  
  const setToken = () => {
    const url = new URL(location.href);
    for (const [key, value] of url.searchParams.entries()) {
      localStorage.setItem(key, value);
    }
  };

  const prepareStopHideButton = () => {
    const button = document.querySelector('#moderate-stop');
    if (!button) {
      return;
    }

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const response = await fetch('/moderate/stop', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({user_id: localStorage.getItem('user_id')}),
      });

      const json = await response.json();
      if (json.success) {
        localStorage.clear();
        location.href = '/';        
      } else {
        console.error(json);
      }
    });
  };

  const parseOriginalTweet = (body) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(body, 'text/html');
    return doc.querySelector('blockquote p').innerText || '';
  }

  const renderTweet = (tweet) => {
    const now = new Date();
    const formattedTime = new Intl.DateTimeFormat(navigator.language, {
      hour: 'numeric',
      minute: 'numeric',
    }).format(now);

    const originalTweet = parseOriginalTweet(tweet.original_tweet);
    const rendering = `<section class="replies"><p><small>${formattedTime}</small></p><p>Hidden <a target="_blank" href="https://twitter.com/${tweet.user.name}">@${tweet.user.name}</a>’s reply to “${originalTweet}”<a target="_blank" href="https://twitter.com/${tweet.user.name}/status/${tweet.id_str}" class="tweet-link">Show reply on Twitter</a></p></section>`;
    document.querySelector('main.replies-container').innerHTML += rendering;
  };

  const endHideReplies = () => {
    const now = new Date();
    const formattedTime = new Intl.DateTimeFormat(navigator.language, {
      hour: 'numeric',
      minute: 'numeric',
    }).format(now);

    document.querySelector('#moderate-stop').style.display = 'none';

    const rendering = `<section class="end-hide"><p><small>${formattedTime}</small>Time’s up! Finished hiding replies on your behalf. <a href="/">Restart</a></p></section>`;
    document.querySelector('main.replies-container').innerHTML += rendering;
  }

  const hideTweet = async (tweet) => {
    try {
      await fetch('/hide/' + tweet.id_str, {method: 'POST'});  
    } catch (e) {
      console.error('Cannot hide Tweet:', e);
    }
  };
  
  const unhideTweet = async (tweet) => {
    try {
      await fetch('/hide/' + tweet.id_str, {method: 'DELETE'});
    } catch (e) {
      console.error('Cannot unhide Tweet:', e);
    }
  };

  const startSocket = () => {
    const url = new URL(location.href);
    const socket = io.connect(url.origin);
    socket.emit('set id', {user_id: localStorage.getItem('user_id')});
    socket.on('tweet', async (tweet) => {
      await hideTweet(tweet);
      renderTweet(tweet);
    });
    socket.on('end moderation', endHideReplies);
  };
  
  const prepareOAuthHandler = () => {
    try {
      const isNativeWindow = window.top.location.href === location.href;
    } catch (e) {
      const button = document.querySelector('form>button');
      const windowSize = 500;
      const top = (window.screen.height - windowSize) / 2;
      const left = (window.screen.width - windowSize) / 2;
      if (button) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          const url = document.querySelector('form[action]').getAttribute('action');
          const oAuthWindow = window.open(
            url,
            '',
            `width=${windowSize},height=${windowSize},top=${top},left=${left},resizable=0`);
          window.addEventListener('message', (e) => {
            console.log('message received');
            setToken();
            e.source.close();
            window.location.href = '/moderate';
          }, false);
        });
      }      
    }
    
  }
  
  printConsoleMessage();
  setToken();
  prepareStopHideButton();
  prepareOAuthHandler();
  if (typeof io !== 'undefined') {
    startSocket();
  }

})();