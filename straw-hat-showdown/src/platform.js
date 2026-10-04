// Browser and device details: fullscreen, orientation lock and home-screen mode.

export function isIPhone(ua = navigator.userAgent) {
  return /iPhone|iPod/.test(ua);
}

export function isStandalone() {
  return navigator.standalone === true
    || window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches;
}

// iPhone Safari cannot put a web page in fullscreen; installing to the home screen is the way.
export function shouldShowHomeScreenHint() {
  return isIPhone() && !isStandalone();
}

// Called from a tap. Both steps are allowed to fail (unsupported browser, already fullscreen).
export function enterFullscreen() {
  const root = document.documentElement;
  if (document.fullscreenElement || !root.requestFullscreen || isStandalone()) return;
  root.requestFullscreen({ navigationUI: 'hide' })
    .then(() => screen.orientation?.lock?.('landscape'))
    .catch(() => {});
}
