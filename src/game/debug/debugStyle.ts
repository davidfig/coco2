/** The debug menu's look: a plain dark panel on the right, out of the TV's way, scrolling if the window is short. */
export const DEBUG_CSS = `
.coco-debug {
  position: fixed; top: 8px; right: 8px; width: 400px; max-width: calc(100vw - 32px); max-height: calc(100vh - 16px);
  overflow-y: auto; display: none; padding: 8px 10px 10px; box-sizing: border-box; z-index: 10;
  background: rgba(14, 16, 14, 0.94); color: #d8e6d0; border: 1px solid #3c5a3c; border-radius: 6px;
  font: 12px/1.35 ui-monospace, Menlo, Consolas, monospace; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
}
.coco-debug.show { display: block; }
.coco-debug header { display: flex; align-items: center; gap: 8px; }
.coco-debug header b { font-size: 13px; color: #9fe39f; }
.coco-debug header span { opacity: 0.5; flex: 1; }
.coco-debug h3 { margin: 10px 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #8aa88a; }
.coco-debug button {
  font: inherit; color: inherit; background: #233023; border: 1px solid #3c5a3c; border-radius: 4px; padding: 3px 6px;
  cursor: pointer; text-align: left;
}
.coco-debug button:hover { background: #2f4a2f; }
.coco-debug .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.coco-debug .row { display: flex; align-items: center; gap: 6px; margin: 3px 0; }
.coco-debug input[type=text], .coco-debug input[type=number] {
  font: inherit; width: 90px; background: #0b0d0b; color: inherit; border: 1px solid #3c5a3c; border-radius: 3px; padding: 2px 4px;
}
.coco-debug .flags { display: flex; flex-direction: column; }
.coco-debug .flag { display: flex; align-items: baseline; gap: 6px; padding: 1px 0; cursor: pointer; }
.coco-debug .flag code { color: #bfe8bf; min-width: 140px; }
.coco-debug .flag span { opacity: 0.6; }
`;
