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
            setToken();
            e.source.close();
            window.location.href = '/moderate';
          }, false);
        });
      }      
    }
  };
  
  const onColorSchemeChange = (query) => {
    <meta
  name="twitter:widgets:theme"
  content="dark">
  }
  
  const setupDarkTheme = () => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    onColorSchemeChange(query);
    query.addListener(onColorSchemeChange);
  }
  
  printConsoleMessage();
  setToken();
  prepareOAuthHandler();
  setupDarkTheme();

  if (twemoji) {
    twemoji.parse(document.body, {
      folder: 'svg',
      ext: '.svg'
    });
  }
})();