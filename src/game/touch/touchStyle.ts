/**
 * The touch keyboard's look: the CoCo 2's own keys, close up. Cream caps with charcoal legends on a black satin plate,
 * BREAK red with a white legend (as `computerShader.ts` paints them). Sizes follow the strip's width: `--u` is one key.
 */
export const TOUCH_CSS = `
body.coco-touch { display: flex; flex-direction: column; }
body.coco-touch canvas#game { flex: 1 1 auto; height: auto; min-height: 0; }
.coco-kb {
  /* One key: the row fills the width, but never more than 46px, nor so tall the set has no room (a phone on its side). */
  --u: min(calc((100vw - 12px) / 13.75), 46px, 7.2dvh);
  flex: 0 0 auto; position: relative; box-sizing: border-box; display: flex; flex-direction: column; align-items: center;
  padding: 7px 6px calc(8px + env(safe-area-inset-bottom)); gap: calc(var(--u) * 0.1);
  background: linear-gradient(#232220, #161514 30%, #121110); border-top: 1px solid #34322e;
  touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent; transition: margin-bottom 0.25s ease-out;
}
.coco-kb.hidden { margin-bottom: calc(-1 * var(--kb-h, 240px) + 22px); }
.coco-kb .row { position: relative; width: calc(var(--u) * 13.75); height: calc(var(--u) * 1.12); }
.coco-kb .key {
  position: absolute; top: 0; bottom: 0; box-sizing: border-box; margin: 0 calc(var(--u) * 0.05);
  border-radius: calc(var(--u) * 0.14); color: #1a1918;
  background: linear-gradient(#e2ddcf, #d2cdbd 55%, #bdb7a6);
  box-shadow: 0 calc(var(--u) * 0.09) 0 #7c7769, 0 calc(var(--u) * 0.12) calc(var(--u) * 0.1) rgba(0, 0, 0, 0.6);
  font: 700 calc(var(--u) * 0.42)/1 Helvetica, Arial, sans-serif;
  display: flex; align-items: center; justify-content: center; transform: translateY(0); transition: transform 0.06s;
}
.coco-kb .key.wide { font-size: calc(var(--u) * 0.24); letter-spacing: 0.02em; }
.coco-kb .key.arrow { font-size: calc(var(--u) * 0.5); }
.coco-kb .key.two { flex-direction: column; align-items: flex-start; justify-content: center; padding-left: calc(var(--u) * 0.2); gap: calc(var(--u) * 0.06); font-size: calc(var(--u) * 0.32); }
.coco-kb .key.brk { color: #f2efe8; background: linear-gradient(#a0261c, #8a1a12 55%, #74140e); box-shadow: 0 calc(var(--u) * 0.09) 0 #4a0c08, 0 calc(var(--u) * 0.12) calc(var(--u) * 0.1) rgba(0, 0, 0, 0.6); }
.coco-kb .key.down, .coco-kb .key.latched { transform: translateY(calc(var(--u) * 0.08)); box-shadow: 0 calc(var(--u) * 0.01) 0 #7c7769; filter: brightness(0.93); }
.coco-kb .key.brk.down { box-shadow: 0 calc(var(--u) * 0.01) 0 #4a0c08; }
.coco-kb .pop {
  position: fixed; pointer-events: none; display: none; transform: translate(-50%, -100%); padding: 6px 12px 10px;
  border-radius: 10px; background: #e2ddcf; color: #1a1918; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55);
  font: 700 30px/1 Helvetica, Arial, sans-serif; min-width: 24px; text-align: center; z-index: 5;
}
.coco-kb .tab {
  position: absolute; top: -22px; right: 10px; height: 22px; padding: 0 12px; border: 1px solid #34322e; border-bottom: none;
  border-radius: 8px 8px 0 0; background: #1d1c1a; color: #b9b2a2; font: 600 11px/22px Helvetica, Arial, sans-serif;
  letter-spacing: 0.06em;
}
/* A phone on its side: the keyboard docks at the right, the set keeps the window's full height on the left. The keys
   take half the width and stand a little taller than wide, for the thumbs; the tab moves to the strip's left edge. */
@media (orientation: landscape) and (max-height: 520px) {
  body.coco-touch { flex-direction: row; }
  body.coco-touch canvas#game { height: 100%; min-width: 0; }
  .coco-kb {
    --u: min(calc((48vw - 12px) / 13.75), 42px);
    justify-content: center; padding: 6px calc(6px + env(safe-area-inset-right)) 6px 6px; gap: calc(var(--u) * 0.14);
    border-top: none; border-left: 1px solid #34322e; transition: margin-right 0.25s ease-out;
  }
  .coco-kb.hidden { margin-bottom: 0; margin-right: calc(-1 * var(--kb-w, 400px) + 22px); }
  .coco-kb .row { height: calc(var(--u) * 1.4); }
  .coco-kb .tab {
    top: 12px; right: auto; left: -22px; width: 22px; height: auto; padding: 12px 0; writing-mode: vertical-rl;
    transform: rotate(180deg); border: 1px solid #34322e; border-left: none; border-radius: 0 8px 8px 0; line-height: 22px;
  }
}
`;
