// Fits the 16:9 game view into the screen, inside the safe area, and sizes the canvas
// backing store for the device pixel ratio.
import { SCREEN_W, SCREEN_H, DPR_CAP } from './config.js';

function insets() {
  const s = getComputedStyle(document.documentElement);
  const px = (name) => parseFloat(s.getPropertyValue(name)) || 0;
  return { top: px('--sat'), right: px('--sar'), bottom: px('--sab'), left: px('--sal') };
}

export function computeLayout(viewW, viewH, inset) {
  const availW = Math.max(1, viewW - inset.left - inset.right);
  const availH = Math.max(1, viewH - inset.top - inset.bottom);
  const scale = Math.min(availW / SCREEN_W, availH / SCREEN_H);
  const width = SCREEN_W * scale;
  const height = SCREEN_H * scale;
  return {
    scale,
    width,
    height,
    left: inset.left + (availW - width) / 2,
    top: inset.top + (availH - height) / 2,
  };
}

export function applyLayout(stage, canvas) {
  const view = window.visualViewport;
  const viewW = view ? view.width : window.innerWidth;
  const viewH = view ? view.height : window.innerHeight;
  const box = computeLayout(viewW, viewH, insets());
  Object.assign(stage.style, {
    left: `${box.left}px`,
    top: `${box.top}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  });
  document.documentElement.style.setProperty('--u', `${box.scale}px`);
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  const bw = Math.round(box.width * dpr);
  const bh = Math.round(box.height * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  return { ...box, pixelScale: bw / SCREEN_W };
}
