if (window.opener) {
  window.opener.postMessage({oauth: location.search}, '*');
  window.close();
} else {
  location.href = '/moderate' + location.search;  
}