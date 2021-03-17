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
  
  
  const onColorSchemeChange = (query) => {
    if (query.matches) {
      document.head.innerHTML += '<meta name="twitter:widgets:theme" content="dark">'  
    } else {
      document.querySelector('meta[content="dark"]')?.remove();
    }
  }
  
  const setupDarkTheme = () => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    onColorSchemeChange(query);
    query.addListener(onColorSchemeChange);
  }
  
  printConsoleMessage();
  setupDarkTheme();

  if (twemoji) {
    twemoji.parse(document.body, {
      folder: 'svg',
      ext: '.svg'
    });
  }
})();