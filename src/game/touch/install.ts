/**
 * The game as an app on the home screen (`public/manifest.webmanifest`, linked from index.html): full screen, and it
 * plays offline through `public/sw.js`. Installed, iOS keeps its localStorage (the story, the CSAVEs, the notebook's
 * wear), which it otherwise clears from a site not visited for seven days; elsewhere the browser is asked to keep it.
 * Production builds only: in development a cached page would hide every edit.
 */
export function installable(production: boolean): void {
  void navigator.storage?.persist?.().catch(() => false);
  if (!production || !('serviceWorker' in navigator)) return;
  const register = (): void => void navigator.serviceWorker.register('./sw.js').catch(() => {});
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
}
