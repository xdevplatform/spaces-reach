(() => {
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
  
  setupDarkTheme();

  if (twemoji) {
    twemoji.parse(document.body, {
      folder: 'svg',
      ext: '.svg'
    });
  }
})();