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
  };
  
  const fetchTweet = async (tweetId) => {
    const tweet = await fetch('/')
  }

  const getTweetId = () => document.getElementById('tweet-url').match(/status\/(\d{1,19})/)[1];

  const prepareFetchButton = async () => {
    document.getElementById('fetch').addEventListener('click', async () => {
      await fetchTweet(getTweetId());
    });
  };
  
  printConsoleMessage();
  setToken();
  prepareOAuthHandler();

  if (twemoji) {
    twemoji.parse(document.body, {
      folder: 'svg',
      ext: '.svg'
    });
  }

  /*
    1. User clicks fetch tweets
    2. tweet lookup
      a. Error: tweet not found
      b. Error: tweet older than 7 days
      c. Error: no replies found for tweet
    3. Show original tweet
    4. Show replies
      a. "Pet related"
      b. "Probably not pet related" -> hide / unhide
    5. Fetch more tweets
  */

})();