import './clear';
import { Engine, Sound } from './engine';
import { ColorBasic } from './game/coco/basic';
import { TextScreen } from './game/coco/screen';
import { Magazine } from './game/magazine/book';
import { Notebook } from './game/notes';
import { attachBookInput } from './game/magazine/bookInput';
import { SeenTracker } from './game/magazine/seen';
import { ComingSoon } from './game/story/comingSoon';
import { ISSUE_1_RULES, PuzzleWatcher } from './game/puzzles';
import { Issue1Story } from './game/story';
import { Tv } from './game/tv/tv';
import { TAMPER_STYLES, TamperStyle } from './game/tv/tvShader';
import { readTvSettings } from './game/tv/tvSave';
import { Vdg } from './game/vdg/vdg';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const engine = new Engine(canvas);
const params = new URLSearchParams(location.search);

const screen = new TextScreen();
const vdg = new Vdg();
/** `?instant` skips the tube's warm-up and makes the cassette instant. */
const basic = new ColorBasic(screen, params.has('instant'));
/** `?nosound` keeps the page silent (for test tabs). */
const sound = new Sound(!params.has('nosound'));
const tv = new Tv(engine.gl, canvas, sound);
/** What tampered cells showed before (`TextScreen.tamper`). */
const ghostVdg = new Vdg();
const magazine = new Magazine(engine.gl);
/** Made before the book's input so that a click on the paper is the paper's. */
const notebook = new Notebook(engine.gl, canvas, () => magazine.state.flags, () => magazine.tv, () => tv.glow, () => tv.picture, (page) => magazine.showPage(page));
const bookInput = attachBookInput(magazine, canvas);
const seen = new SeenTracker();
/** Placeholder for issue 2, shown once issue 1's night has passed. */
const comingSoon = new ComingSoon();
/** `?book` starts with the magazine open (for playtesting). */
if (params.has('book')) magazine.show();

const story = new Issue1Story(screen, tv, (f) => magazine.state.flags.has(f), (f) => magazine.setFlag(f), basic.interp, () => {
  // The next day: the CoCo is switched on again, with nothing in memory.
  if (basic.interp.state !== 'idle') basic.interp.halt();
  basic.interp.program.clear();
  basic.interp.edited();
  basic.boot();
});
const puzzles = new PuzzleWatcher(basic.interp, (f) => magazine.state.flags.has(f), (f) => magazine.setFlag(f), [...ISSUE_1_RULES, ...story.rules]);
/** `?tamper=ghost|scan|both` overrides how a tampered cell shows (for comparing; the story sets it per issue). */
const tamperStyle = params.get('tamper') as TamperStyle;
if (TAMPER_STYLES.includes(tamperStyle)) tv.tamperStyle = tamperStyle;

basic.boot();
// The set comes back as it was left: switched off stays off (the CoCo still boots behind it).
if (readTvSettings().on !== false) tv.switchOn(!params.has('instant'));

engine.earlyUpdaters.push((dt) => {
  basic.step(dt, engine.keyboard.drain());
});
// A page load is waking up: if the last session ended the evening without switching off, that counts as the night.
story.sleep();
story.wake();
let setOn = tv.powerTime >= 0;
engine.updaters.push((dt) => {
  screen.step(dt);
  story.step(dt);
  const on = tv.powerTime >= 0;
  if (on !== setOn) (on ? story.wake() : story.sleep());
  setOn = on;
});
engine.lateUpdaters.push((dt) => {
  if (screen.takeDirty()) {
    vdg.render(screen.vram, screen.cursor());
    tv.show(vdg);
  }
  if (screen.tampered.takeChanged()) {
    ghostVdg.render(screen.tampered.before);
    tv.showTampered(screen.tampered.at, ghostVdg);
  }
  tv.tamperClock = screen.tampered.clock;
  magazine.update(dt, engine.gl.drawingBufferWidth, engine.gl.drawingBufferHeight);
  seen.update(magazine, dt);
  notebook.update(dt);
  tv.draw(dt, engine.time, vdg.border, magazine.tv, magazine.frame, notebook.shade());
  magazine.draw();
  notebook.draw();
  bookInput.update();
  comingSoon.update(magazine.state.flags.has('issue2-waiting'));
  tv.knobs.cursor();
  tv.touch.cursor();
  notebook.cursor();
});
engine.start();

/** For the console and a hidden Browser pane: `coco.engine.advance(1/60)` runs one frame. */
/** Playtesting: `coco.tamperTest()` swaps a few letters on screen through `TextScreen.tamper`, as the story will. */
function tamperTest(count = 4): void {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const cells = [...screen.vram.keys()].filter((c) => (screen.vram[c] & 0x3f) >= 1 && (screen.vram[c] & 0x3f) <= 26);
  for (let i = 0; i < count && cells.length; i++) {
    const cell = cells.splice(Math.floor(Math.random() * cells.length), 1)[0];
    screen.tamper(cell, letters[Math.floor(Math.random() * letters.length)]);
  }
}
/** Playtesting: `coco.stationTest(9)` puts a far station's test card on channel 9 (`Tv.broadcast`); the story will its own. */
function stationTest(channel = 9): void {
  const card = new TextScreen();
  card.cls();
  card.writeAt(32 * 6 + 9, 'KCOC  CHANNEL ' + channel);
  card.writeAt(32 * 9 + 8, 'PLEASE STAND BY');
  const v = new Vdg();
  v.render(card.vram);
  tv.broadcast(channel, v, 0.6);
}
Object.assign(window, { coco: { engine, screen, basic, interp: basic.interp, tv, vdg, magazine, puzzles, story, notebook, tamperTest, stationTest } });

/** Playtesting: F2 opens the debug menu (checkpoints, flags, name, TV hooks) in dev builds; `?debug` opens it at start, in any build. */
if (import.meta.env.DEV || params.has('debug')) {
  void import('./game/debug').then(({ DebugMenu }) => {
    const menu = new DebugMenu({ magazine, notebook, basic, keyboard: engine.keyboard, tv, tamperTest, stationTest });
    if (params.has('debug')) menu.toggle(true);
  });
}
