/**
 * The page never zooms. iOS Safari ignores the viewport's `user-scalable=no`, so a double tap anywhere `touch-action`
 * allows it (a corner button, the safe-area margin) zooms the whole game, and a pinch outside the canvas does too.
 * `index.html` sets `touch-action: none` on everything; this stops Safari's own pinch gesture, which skips it.
 */
export function noZoom(): void {
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
  }
}
