/**
 * `?clear` starts the game over: it forgets everything this browser kept (the player's CSAVEs, the set's knobs, the
 * magazine's flags, scratched hints and page, the notebook's wear), then drops itself from the URL so a reload
 * doesn't wipe again. Imported first in main.ts, before anything reads localStorage.
 */
if (new URLSearchParams(location.search).has('clear')) {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key === 'coco2' || key.startsWith('coco2.')) localStorage.removeItem(key);
    }
  } catch {
    // storage blocked: nothing kept to clear
  }
  // Cut just `clear` so the other flags stay as typed (`?instant`, not `?instant=`).
  const search = location.search.slice(1).split('&').filter((p) => p.split('=')[0] !== 'clear').join('&');
  history.replaceState(null, '', location.pathname + (search ? `?${search}` : '') + location.hash);
}
