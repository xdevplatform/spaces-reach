try {
  const isNativeWindow = window.top.location.href === location.href;
  if (isNativeWindow) {
    location.href = `/moderate?${location.search}`;
  }
} catch(e) {
  window.close();
}