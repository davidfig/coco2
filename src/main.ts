import './clear';
import './startIssue';
import { Engine, Sound } from './engine';
import { ColorBasic } from './game/coco/basic';
import { Computer } from './game/computer/computer';
import { TextScreen } from './game/coco/screen';
import { Magazine } from './game/magazine/book';
import { Notebook } from './game/notes';
import { Recorder, RecorderSound } from './game/recorder';
import { attachBookInput } from './game/magazine/bookInput';
import { overPage } from './game/magazine/bookLayout';
import { SeenTracker } from './game/magazine/seen';
import { RoomLights } from './game/room/lights';
import { smooth } from './game/magazine/bookLayout';
import { ISSUE_1_RULES, ISSUE_2_RULES, PuzzleWatcher } from './game/puzzles';
import { Guide, Issue1Story, Issue2Story } from './game/story';
import { Shake, TouchKeys, installable, noZoom, wantsTouchKeys } from './game/touch';
import { Tv } from './game/tv/tv';
import { TAMPER_STYLES, TamperStyle } from './game/tv/tvShader';
import { readTvSettings } from './game/tv/tvSave';
import { Vdg } from './game/vdg/vdg';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const engine = new Engine(canvas);
const params = new URLSearchParams(location.search);

const screen = new TextScreen();
const vdg = new Vdg();
/** `?instant` skips the tube's warm-up and the room's lights coming on, and makes the cassette instant. */
const instant = params.has('instant');
const basic = new ColorBasic(screen, instant);
/** `?nosound` keeps the page silent (for test tabs). */
const sound = new Sound(!params.has('nosound'));
const tv = new Tv(engine.gl, canvas, sound);
/** What tampered cells showed before (`TextScreen.tamper`). */
const ghostVdg = new Vdg();
const magazine = new Magazine(engine.gl);
/** Made before the book's input so that a click on the paper is the paper's. */
const notebook = new Notebook(engine.gl, canvas, () => magazine.state.flags, () => magazine.notesTv, () => magazine.notesTuck, () => tv.glow, () => tv.picture, (page, issue) => magazine.showPage(page, issue));
/** The CoCo 2 on the table in front of the set: a trial, `?nococo` leaves it out. Made after the notebook, so a click on the paper is the paper's. */
const computer = new Computer(engine.gl, canvas);
computer.visible = !params.has('nococo');
/** The book is drawn over the machine, so a click on it is the book's: its half of the window while open, else the page peeking in. */
computer.covered = (nx, ny) => (magazine.open ? magazine.inRect(magazine.book, nx, ny) : overPage(magazine.v, nx, ny));
/** A click on the set pulls back or goes in, unless it is the set's own (a knob, the rocker, the smack) or the book or notebook is out: then it puts that away. */
computer.isOut = () => magazine.open;
computer.putAway = () => magazine.close();
/** Put away while the view is pulled back to the whole desk, the magazine lies on the table beside the machine if there's room. */
magazine.desk = () => ({ ...computer.table('magazine'), picture: tv.picture });
notebook.desk = () => ({ ...computer.table('notes'), picture: tv.picture });
/** On the table, whichever of the two was looked at last lies on top (the notes, to begin with). */
let notesOnTop = true;
notebook.covered = (x, y) => !notesOnTop && overPage(magazine.v, x / engine.gl.drawingBufferWidth, y / engine.gl.drawingBufferHeight);
computer.busy = (x, y) => {
  if (notebook.open) return true;
  const part = tv.touch.at(x, y)?.part;
  return !!tv.knobs.at(x, y) || (part !== undefined && part !== 'glass');
};
const bookInput = attachBookInput(magazine, canvas, () => notebook.covers());
const seen = new SeenTracker();
/** Placeholder for issue 2, shown once issue 1's night has passed. */
/** `?book` starts with the magazine open (for playtesting). */
if (params.has('book')) magazine.show();

const story = new Issue1Story(screen, tv, (f) => magazine.state.flags.has(f), (f) => magazine.setFlag(f), basic.interp, () => {
  // The next day: the CoCo is switched on again, with nothing in memory.
  if (basic.interp.state !== 'idle') basic.interp.halt();
  basic.interp.program.clear();
  basic.interp.edited();
  basic.boot();
});
/** The cassette recorder beside the set: BASIC's tape commands wait for a cassette to be put in it. */
const recorder = new Recorder(basic.interp, (f) => magazine.state.flags.has(f), (f) => magazine.setFlag(f), instant);
computer.recorder = recorder;
recorder.sound = new RecorderSound(sound);
const story2 = new Issue2Story(screen, (f) => magazine.state.flags.has(f), (f) => magazine.setFlag(f), basic.interp);
/** A new player is drawn to the notes, and then to the magazine, until each has been opened once. */
const guide = new Guide((f) => magazine.state.flags.has(f), (f) => magazine.setFlag(f));
const puzzles = new PuzzleWatcher(basic.interp, (f) => magazine.state.flags.has(f), (f) => magazine.setFlag(f), [...ISSUE_1_RULES, ...story.rules, ...ISSUE_2_RULES, ...story2.rules]);
/** `?tamper=ghost|scan|both` overrides how a tampered cell shows (for comparing; the story sets it per issue). */
const tamperStyle = params.get('tamper') as TamperStyle;
if (TAMPER_STYLES.includes(tamperStyle)) tv.tamperStyle = tamperStyle;

basic.boot();
/** The room is dark as the page opens; its lights flicker on, and then the set comes on. */
const lights = new RoomLights(engine.gl, instant);
/** Seconds since the lights came on for good: the magazine slides in from the right, then the notes come up (`ARRIVE`). */
let litFor = instant ? Infinity : 0;
const ARRIVE = { book: [0.15, 0.9], notes: [0.45, 0.8] } as const;
const arrival = ([start, secs]: readonly [number, number]): number => smooth(Math.min(1, Math.max(0, (litFor - start) / secs)));
magazine.arrive = notebook.arrive = arrival(ARRIVE.book);
// The set comes back as it was left: switched off stays off (the CoCo still boots behind it).
if (readTvSettings().on !== false) tv.switchOn(!instant, instant ? 0 : lights.onAt + 0.35);

/** A click on one of the machine's keys types it; whatever is typed presses its cap. */
computer.onKey = (k) => engine.keyboard.push(k);
/** Phones and tablets get the machine's keyboard as a strip along the bottom (`?touch` forces it, `?notouch` leaves it out). */
const touchKeys = wantsTouchKeys(params) ? new TouchKeys(computer.keys) : null;
noZoom();
/** A phone shaken smacks the set (iOS asks leave to read the motion at the first smack by hand). */
installable(import.meta.env.PROD);
const shake = new Shake(() => tv.touch.smack());
tv.touch.onHandSmack = () => shake.ask();
engine.earlyUpdaters.push((dt) => {
  const typed = engine.keyboard.drain();
  computer.keys.typed(typed);
  basic.step(dt, typed);
});
// A page load is waking up: if the last session ended the evening without switching off, that counts as the night.
story.sleep();
story2.sleep();
story.wake();
let setOn = tv.powerTime >= 0;
engine.updaters.push((dt) => {
  screen.step(dt);
  recorder.step(dt);
  // A tape command waiting with no cassette in: the view pulls back to the desk, where the recorder is.
  if (recorder.takeBeckon() && computer.visible) computer.focused = true;
  story.step(dt);
  story2.step(dt);
  const on = tv.powerTime >= 0;
  if (on && !setOn) story.wake();
  if (!on && setOn) {
    story.sleep();
    story2.sleep();
  }
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
  if (lights.on && litFor < Infinity) {
    litFor += dt;
    magazine.arrive = arrival(ARRIVE.book);
    notebook.arrive = arrival(ARRIVE.notes);
    if (magazine.arrive === 1 && notebook.arrive === 1) litFor = Infinity;
  }
  if (guide.step(dt, litFor === Infinity, notebook.open, magazine.open) === 'notes') notebook.bounce();
  magazine.beckoned = guide.magazineOut;
  magazine.update(dt, engine.gl.drawingBufferWidth, engine.gl.drawingBufferHeight);
  seen.update(magazine, dt);
  notebook.update(dt);
  const view = computer.view(dt, magazine.tv, magazine.frame, magazine.openT);
  tv.draw(dt, engine.time, vdg.border, view.rect, view.frame, notebook.shade());
  computer.draw(tv.picture, tv.glow);
  // On the table the one looked at last lies on top; the notes held up, or peeking from the corner, are always over the book.
  if (notebook.open) notesOnTop = true;
  else if (magazine.open) notesOnTop = false;
  const notesUnder = notebook.onDesk() > 0 && !notesOnTop;
  if (notesUnder) notebook.draw();
  magazine.draw();
  if (!notesUnder) notebook.draw();
  lights.update(dt);
  lights.draw();
  bookInput.update(lights.css());
  tv.knobs.cursor();
  tv.touch.cursor();
  computer.cursor();
  notebook.cursor();
});
// One dark frame before the clock starts, waited for: the GPU builds every pass's shader now (seconds, the first
// time in a browser), behind the page's dark background, rather than in the middle of the lights or the warm-up.
engine.advance(0);
engine.gl.readPixels(0, 0, 1, 1, engine.gl.RGBA, engine.gl.UNSIGNED_BYTE, new Uint8Array(4));
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
Object.assign(window, { coco: { engine, lights, computer, recorder, screen, basic, interp: basic.interp, tv, vdg, magazine, touchKeys, puzzles, story, story2, notebook, tamperTest, stationTest } });

/** Playtesting: F2 opens the debug menu (checkpoints, flags, name, TV hooks) in dev builds; `?debug` opens it at start, in any build. */
if (import.meta.env.DEV || params.has('debug')) {
  void import('./game/debug').then(({ DebugMenu }) => {
    const menu = new DebugMenu({ magazine, notebook, basic, keyboard: engine.keyboard, tv, recorder, tamperTest, stationTest });
    if (params.has('debug')) menu.toggle(true);
  });
}
