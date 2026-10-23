import './clear';
import { startAt } from './startAt';
import { Engine, Sound } from './engine';
import { ColorBasic } from './game/coco/basic';
import { Computer } from './game/computer/computer';
import { pileCassette, pileSlot } from './game/computer/pile';
import { IssueSwap } from './game/computer/swap';
import type { IssueId } from './game/magazine/pages';
import { drawPage } from './game/magazine/issue';
import { TextScreen } from './game/coco/screen';
import { Magazine } from './game/magazine/book';
import { Notebook } from './game/notes';
import { Recorder, RecorderSound } from './game/recorder';
import { attachBookInput } from './game/magazine/bookInput';
import { overPage, tvEnds } from './game/magazine/bookLayout';
import { SeenTracker } from './game/magazine/seen';
import { RoomLights } from './game/room/lights';
import { smooth } from './game/magazine/bookLayout';
import { ISSUE_1_RULES, ISSUE_2_RULES, ISSUE_3_RULES, PuzzleWatcher } from './game/puzzles';
import { Days, Framing, Guide, Hop, Issue1Story, Issue2Story } from './game/story';
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
const notebook = new Notebook(
  engine.gl,
  canvas,
  () => magazine.state.flags,
  () => magazine.notesTv,
  () => magazine.notesTuck,
  () => tv.glow,
  () => tv.picture,
  (page, issue) => magazine.showPage(page, issue),
  // The cassette in the notes: put the magazine away and pull back to the desk, where the recorder is.
  () => {
    magazine.close();
    framing.back(true);
  },
);
/** The CoCo 2 on the table in front of the set: a trial, `?nococo` leaves it out. Made after the notebook, so a click on the paper is the paper's. */
const computer = new Computer(engine.gl, canvas);
computer.visible = !params.has('nococo');
/** The covers of the issues piled beside the set are the book's own; until the book has painted its own, it shows the pile's. */
computer.pile.cover = (issue, ctx) => drawPage(issue, 0, ctx, magazine.state);
magazine.coverStandIn = (issue, ctx) => computer.pile.coverOf(issue, ctx);
/** A click on an issue in the pile puts it on the table (the one there goes on the pile) and opens it; one on its cassette only swaps them. */
computer.onPile = (issue, cassette) => magazine.pickUp(issue, !cassette);
/**
 * Another issue picked up (the pile, the book's corner, a note's page link into it): it opens from where it lies on the
 * pile, the open book first put away (`IssueSwap`, `stepSwap`); the one on the table and the cassettes change places
 * only once it is open, out of sight. A click on a cassette on the pile, which doesn't open it, has the two issues
 * carried past each other, the one coming over the one going back, and the cassettes with them (`Recorder.shift`). With
 * no table (`?nococo`) they change at once.
 */
let swap: IssueSwap | null = null;
/** The issue the desk shows on the table (and its cassette by the recorder): the one going back, while the other opens from the pile. */
const onTable = (): IssueId => (swap?.rising ? swap.from : magazine.issue);
/** The issues the player has but the one on the table, the oldest at the bottom: the pile beside the set. */
const pileOrder = (): IssueId[] => magazine.issues().filter((id) => id !== onTable());
magazine.pickUp = (issue, open, page) => {
  if (swap) return;
  if (issue === magazine.issue || !computer.visible) {
    magazine.setIssue(issue);
    if (open) magazine.show();
    if (page !== undefined) magazine.goto(page);
    return;
  }
  swap = new IssueSwap(magazine.issue, issue, page, open || magazine.open);
  if (notebook.open) notebook.putDown();
  if (!magazine.open) return;
  magazine.close();
  framing.back(true);
};
/** The book is drawn over the machine, so a click on it is the book's: its half of the window while open, else the page peeking in. */
computer.covered = (nx, ny) => (magazine.open ? magazine.inRect(magazine.book, nx, ny) : overPage(magazine.v, nx, ny));
/**
 * A click on the set itself (the glass, the cabinet; not a knob, the rocker or the smack) goes in to read the screen
 * from across the room, or back out from in. With the book out, only a click on the screen does, between the screen
 * close up and the whole set with the machine; anywhere else outside the book (the cabinet, the room) puts it away.
 */
computer.onSet = (x, y) => {
  if (magazine.open && tv.touch.at(x, y)?.part !== 'glass') return magazine.close();
  if (!tv.touch.onSet(x, y)) return;
  if (framing.wide) framing.closer();
  else framing.back();
};
/** Put away while the view is pulled back to the whole desk, the magazine lies on the table beside the machine if there's room. */
/** The guide's calls, as they show with the paper lying on the table: a hop. */
const hops = { magazine: new Hop(), notes: new Hop(), cassette: new Hop() };
for (const [what, paper] of [['magazine', magazine], ['notes', notebook]] as const) {
  paper.desk = () => {
    const d = computer.table(what);
    // With the magazine at reading size the notes lie on their spot on the table too, rather than shrinking into the corner (out of view, perhaps).
    const t = what === 'notes' ? Math.max(d.t, smooth(magazine.readT)) : d.t;
    // An issue picked up from the pile opens from its place on it, or is carried from there onto the table.
    const r = what === 'magazine' && swap?.rising;
    const pile = r ? { ...(swap!.opens ? r.pile : swap!.coming(d.spot)), behind: true } : {};
    return { ...d, t, picture: tv.picture, lift: hops[what].lift(), ...pile };
  };
}
/** The issue going back to the pile is carried there from the table while the other opens. */
magazine.where = () => {
  const r = swap?.rising;
  return r ? { t: r.t, picture: tv.picture, behind: true, ...swap!.going() } : null;
};
/** On the table, whichever of the two was looked at last lies on top (the notes, to begin with). */
let notesOnTop = true;
notebook.covered = (x, y) => !notesOnTop && overPage(magazine.v, x / engine.gl.drawingBufferWidth, y / engine.gl.drawingBufferHeight);
computer.busy = (x, y) => {
  if (notebook.open) return true;
  const part = tv.touch.at(x, y)?.part;
  return !!tv.knobs.at(x, y) || (part !== undefined && part !== 'glass');
};
const bookInput = attachBookInput(magazine, canvas, () => notebook.covers(), computer.visible ? () => {} : undefined);
const seen = new SeenTracker();
/** `?book` starts with the magazine open (for playtesting). */
if (params.has('book')) magazine.show();

const story = new Issue1Story(screen, tv, (f) => magazine.state.flags.has(f), (f) => magazine.setFlag(f), basic.interp);
const days = new Days((f) => magazine.state.flags.has(f), (f) => magazine.setFlag(f), () => {
  // The next day: the CoCo is switched on again, with nothing in memory.
  if (basic.interp.state !== 'idle') basic.interp.halt();
  basic.interp.program.clear();
  basic.interp.edited();
  basic.boot();
});
/** The cassette recorder beside the set: BASIC's tape commands wait for a cassette to be put in it. */
const recorder = new Recorder(basic.interp, (f) => magazine.state.flags.has(f), (f) => magazine.setFlag(f), instant);
computer.recorder = recorder;
/**
 * By the recorder lies the cassette of the issue on the table; the others lie in a pile beside the magazines' pile, in
 * the same order. Issues changing places without opening one, the cassettes go to their new places as the issues do.
 */
recorder.current = () => (swap?.rising && !swap.opens ? swap.to : onTable());
recorder.piled = (id) => {
  const i = magazine.issues().filter((x) => x !== recorder.current()).indexOf(id);
  return i < 0 ? null : pileCassette(i);
};
recorder.sound = new RecorderSound(sound);
const story2 = new Issue2Story(screen, (f) => magazine.state.flags.has(f), (f) => magazine.setFlag(f), basic.interp, () => tv.flinch());
/** A new player is drawn to the notes, and then to the magazine, until each has been opened once. */
const guide = new Guide((f) => magazine.state.flags.has(f), (f) => magazine.setFlag(f), () => !!recorder.wanted());
const puzzles = new PuzzleWatcher(basic.interp, (f) => magazine.state.flags.has(f), (f) => magazine.setFlag(f), [...ISSUE_1_RULES, ...story.rules, ...ISSUE_2_RULES, ...story2.rules, ...ISSUE_3_RULES]);
/** `?tamper=ghost|scan|both` overrides how a tampered cell shows (for comparing; the story sets it per issue). */
const tamperStyle = params.get('tamper') as TamperStyle;
if (TAMPER_STYLES.includes(tamperStyle)) tv.tamperStyle = tamperStyle;

basic.boot();
/** `?at=` (`startAt.ts`): the checkpoint's program goes into memory once the CoCo is up. */
if (startAt?.typed) engine.keyboard.type(startAt.typed);
/** The room is dark as the page opens; its lights flicker on, and then the set comes on. */
const lights = new RoomLights(engine.gl, instant);
/** Seconds since the lights came on for good: the magazine slides in from the right, then the notes come up (`ARRIVE`). */
let litFor = instant ? Infinity : 0;
const ARRIVE = { book: [0.15, 0.9], notes: [0.45, 0.8] } as const;
const arrival = ([start, secs]: readonly [number, number]): number => smooth(Math.min(1, Math.max(0, (litFor - start) / secs)));
magazine.arrive = notebook.arrive = arrival(ARRIVE.book);
/** The view rests on the whole desk and goes in to the set when the screen needs reading (`Framing`); the page opens there. */
const framing = new Framing(computer.visible && !instant && !params.has('book'));
if (framing.wide) computer.startWide();
let typedReal = false;
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
  const shifts = engine.keyboard.shiftsHeld();
  computer.keys.held(engine.keyboard.held(), shifts.left, shifts.right);
  typedReal ||= engine.keyboard.takeReal();
  computer.keys.typed(typed);
  basic.step(dt, typed);
});
// A page load is waking up: if the last session ended the evening without switching off, that counts as the night.
story.sleep();
story2.sleep();
days.wake();
let setOn = tv.powerTime >= 0;
/** The room is going dark at the end of an evening (`night`), and the next day hasn't been set out yet. */
let goingDark = false;
/**
 * The set switched off at the end of an evening: the room's lights blink out, the night passes in the dark, and they
 * come on again on the next day, the set and the CoCo with them and the next RAINBOW on the table.
 */
function night(): void {
  lights.night();
  goingDark = true;
  magazine.close();
  if (notebook.open) notebook.putDown();
  framing.back();
  tv.switchOn(true, lights.onAt + 0.35);
}
/**
 * The swap (`magazine.pickUp`): once the book is put away, the one picked up is opened from the pile (or carried from
 * it to the table) and the one going back carried there; once it has landed and the book is all the way open (or put
 * away again), the swap is over and the desk shows the new one on the table (`onTable`): the pile draws the one gone
 * back, and the cassettes, out of sight, have changed places (carried there meanwhile, if it wasn't opened).
 */
function stepSwap(dt: number): void {
  const s = swap;
  if (!s) return;
  if (s.waiting) {
    if (magazine.open || magazine.openT > 0) return;
    const have = magazine.issues();
    const [before, after] = [have.filter((id) => id !== s.from), have.filter((id) => id !== s.to)];
    const lying = computer.table('magazine');
    const cassettes = recorder.lyingNow();
    s.rise(lying.spot, lying.t, pileSlot(before.indexOf(s.to), before.length), pileSlot(after.indexOf(s.from), after.length));
    magazine.letGo();
    magazine.setIssue(s.to, true);
    if (!s.opens) return recorder.shift(cassettes);
    magazine.show();
    if (s.page !== undefined) magazine.goto(s.page);
    return;
  }
  if (!s.step(dt) || (magazine.open && magazine.openT < 1)) return;
  swap = null;
}
let bookWasOpen = magazine.open;
let wideBeforeBook = false;
engine.updaters.push((dt) => {
  screen.step(dt);
  recorder.step(dt);
  // A tape command waiting with no cassette in: the view pulls back to the desk, where the recorder is.
  if (recorder.takeBeckon()) framing.back(true);
  // Opening the book goes in to the screen, to copy a listing off the page; it stays in while the book is open. Put away,
  // the view goes back to where it was before (the desk, perhaps), unless the recorder has pulled it back to the desk meanwhile.
  if (magazine.open && !bookWasOpen) {
    wideBeforeBook = framing.wide;
    framing.closer();
  } else if (!magazine.open && bookWasOpen && !framing.desk) {
    if (wideBeforeBook) framing.back();
    else framing.closer();
  }
  bookWasOpen = magazine.open;
  framing.step(dt, typedReal, screen.tampered.takeMarked(), basic.interp.state === 'idle' && !magazine.open);
  if (computer.visible) computer.focused = framing.wide && (!magazine.open || framing.desk);
  stepSwap(dt);
  // Every issue the player has but the one on the table lies piled beside the set, the oldest at the bottom; one opening
  // from it is the book's to draw.
  computer.pile.have = magazine.issues();
  computer.pile.issues = pileOrder();
  computer.pile.hidden = swap?.rising ? swap.to : null;
  typedReal = false;
  story.step(dt);
  story2.step(dt);
  const on = tv.powerTime >= 0;
  if (on && !setOn) days.wake();
  if (!on && setOn) {
    const nights = days.nights();
    story.sleep();
    story2.sleep();
    if (days.nights() > nights) night();
  }
  setOn = on;
  // In the dark it is the next day: the CoCo starts afresh and the next issue is on the table, to come in with the lights.
  // Setting it out holds up a frame (its pages, the pile), so it waits until a frame has been drawn with the bulb gone cold:
  // the lights go out first and the stall passes in the dark.
  if (goingDark && lights.dark) {
    goingDark = false;
    days.wake();
    litFor = 0;
    magazine.arrive = notebook.arrive = 0;
  }
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
  // The paper is in once it has come in at the window's edge, or, lying on the table, as soon as the lights are up.
  const call = guide.step(dt, litFor === Infinity || (lights.on && framing.wide), notebook.open, magazine.open, framing.wide && computer.visible);
  if (call === 'notes') notebook.bounce();
  if (call) hops[call].start();
  for (const h of Object.values(hops)) h.step(dt);
  recorder.lift = hops.cassette.lift();
  magazine.beckoned = guide.magazineOut;
  magazine.update(dt, engine.gl.drawingBufferWidth, engine.gl.drawingBufferHeight);
  seen.update(magazine, dt);
  notebook.update(dt);
  // The view goes in one glide to where the book's move ends (`Computer.view`), in close on the screen beside it unless clicked out.
  const [bookOut, read, near] = [magazine.open, magazine.reading, !framing.wide].map(Number);
  const view = computer.view(dt, magazine.tv, magazine.frame, bookOut, tvEnds(engine.gl.drawingBufferWidth / engine.gl.drawingBufferHeight, bookOut, read, near));
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
  // Over the screen, a click goes in or out (`computer.onSet`); at reading size it would change nothing that shows.
  tv.touch.cursor(computer.overSet && !magazine.reading ? (framing.wide ? 'zoom-in' : 'zoom-out') : undefined);
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
Object.assign(window, { coco: { engine, lights, computer, framing, recorder, screen, basic, interp: basic.interp, tv, vdg, magazine, touchKeys, puzzles, story, story2, notebook, tamperTest, stationTest } });
