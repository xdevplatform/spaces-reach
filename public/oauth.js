try {
  const isNativeWindow = window.top.location.href === location.href;
  location.href = '/moderate' + location.search;
} catch (e) {
  window.opener.postMessage({oauth: location.search});
}