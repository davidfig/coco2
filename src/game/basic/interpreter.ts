import type { TextScreen } from '../coco/screen';
import type { BasicEvent, BasicListener } from './events';
import type { Machine } from './machine';
import { Program, splitList } from './program';
import { STATEMENTS } from './statements';
import type { Tape } from './tape';
import { TapeDeck, TapeStep } from './tapeDeck';
import { Cursor, Token, crunch } from './tokens';
import { Target, Vars } from './vars';
import { BasicError, fail, isNumberText } from './values';

/** idle: at the OK prompt · running · input: waiting for an INPUT reply · waiting: SOUND · tape: the cassette is moving. */
export type RunState = 'idle' | 'running' | 'input' | 'waiting' | 'tape';

/** A place in the program (li -1 is the line typed at the OK prompt). */
export interface Pos {
  li: number;
  toks: Token[];
  p: number;
}

export type Frame = ({ kind: 'for'; name: string; limit: number; step: number } | { kind: 'gosub' }) & { at: Pos };

interface PendingInput {
  prompt: string;
  targets: Target[];
  next: number;
  whole: boolean;
}

/** A statement, its keyword already read. Return 'inline' when the rest of the line runs on (IF … THEN PRINT). */
export type Handler = (m: Interpreter, c: Cursor) => void | 'inline';

/** Milliseconds of BASIC per frame: fast enough to feel instant, short enough to keep the screen smooth. */
const BUDGET_MS = 6;

/**
 * Color BASIC: the program, its variables and where it's up to. The shell hands it typed lines (`enter`), INPUT
 * replies (`input`), keys for INKEY$ (`pressKey`) and BREAK; `step` runs a slice of the program each frame.
 */
export class Interpreter implements Machine {
  readonly program = new Program();
  readonly vars = new Vars();
  readonly deck: TapeDeck;
  state: RunState = 'idle';
  timer = 0;
  /** Index of the running line in `program.lines`, -1 for a typed (direct) line. */
  li = -1;
  c = new Cursor([]);
  stack: Frame[] = [];
  /** READ's place in the program's DATA items. */
  dataIndex = 0;
  private contAt: Pos | null = null;
  private stmtStart = 0;
  private keys: string[] = [];
  private wait = 0;
  private pending: PendingInput | null = null;
  /** Told what the player does (see `events.ts`); the puzzle watcher listens here. */
  listener: BasicListener | null = null;

  constructor(readonly screen: TextScreen, readonly tape: Tape) {
    this.deck = new TapeDeck(screen);
  }

  /** A line typed at the OK prompt: a numbered line is stored, anything else runs now. */
  enter(text: string): void {
    const m = /^\s*(\d+)(.*)$/.exec(text);
    try {
      if (m) {
        this.program.set(Number(m[1]), m[2]);
        this.edited();
        this.emit({ type: 'edit', num: Number(m[1]), deleted: m[2].trim() === '' });
        return;
      }
      this.emit({ type: 'direct', text });
      this.li = -1;
      this.c = new Cursor(crunch(text));
      this.state = 'running';
    } catch (e) {
      this.report(e);
    }
  }

  step(dt: number): void {
    this.timer = (this.timer + dt * 60) % 65536;
    if (this.state === 'tape') {
      try {
        this.deck.step(dt);
      } catch (e) {
        this.report(e);
      }
    }
    if (this.state === 'waiting') {
      this.wait -= dt;
      if (this.wait > 0) return;
      this.state = 'running';
    }
    if (this.state !== 'running') return;
    const end = performance.now() + BUDGET_MS;
    try {
      for (let n = 1; this.state === 'running'; n++) {
        this.statement();
        if ((n & 31) === 0 && performance.now() > end) break;
      }
    } catch (e) {
      this.report(e);
    }
  }

  private statement(): void {
    const c = this.c;
    while (c.eatOp(':'));
    if (c.atEnd()) return this.nextLine();
    this.stmtStart = c.p;
    const t = c.next();
    let r: void | 'inline';
    if (t.k === 'kw') r = (STATEMENTS[t.v] ?? fail('SN'))(this, c);
    else if (t.k === 'id') { c.p--; r = STATEMENTS.LET(this, c); }
    else fail('SN');
    if (this.c !== c || r === 'inline') return;
    if (c.isKw('ELSE')) c.p = c.toks.length;
    else if (!c.atEnd() && !c.isOp(':')) fail('SN');
  }

  private nextLine(): void {
    if (this.li < 0 || this.li + 1 >= this.program.lines.length) return this.finish();
    this.li++;
    this.c = new Cursor(this.program.lines[this.li].toks);
    this.reached();
  }

  /** The program (or typed line) is done: back to OK. */
  finish(): void {
    this.state = 'idle';
    this.emit({ type: 'idle' });
    this.deck.stop();
    this.keys = [];
    this.pending = null;
    this.ensureLineStart();
    this.screen.print('OK\n');
  }

  private lineSuffix(): string {
    return this.li >= 0 ? ` IN ${this.program.lines[this.li].num}` : '';
  }

  private report(e: unknown): void {
    if (!(e instanceof BasicError)) console.error(e);
    const code = e instanceof BasicError ? e.code : 'FC';
    this.emit({ type: 'error', code, line: this.li >= 0 ? this.program.lines[this.li].num : null });
    this.ensureLineStart();
    this.screen.print(`?${code} ERROR${this.lineSuffix()}\n`);
    this.contAt = null;
    this.finish();
  }

  /** BREAK key, or STOP: halt where we are, remembering the spot for CONT. */
  halt(): void {
    if (this.state === 'idle') return;
    const p = this.state === 'input' ? this.stmtStart : this.c.p;
    this.contAt = this.li >= 0 ? { li: this.li, toks: this.c.toks, p } : null;
    this.emit({ type: 'break', line: this.li >= 0 ? this.program.lines[this.li].num : null });
    this.ensureLineStart();
    this.screen.print(`BREAK${this.lineSuffix()}\n`);
    this.finish();
  }

  /** The program changed: variables and anything to CONTinue are gone. */
  edited(): void {
    this.vars.clear();
    this.stack = [];
    this.contAt = null;
    this.dataIndex = 0;
  }

  /** RUN [line]. */
  run(from?: number): void {
    this.edited();
    this.emit({ type: 'run', from });
    if (this.program.lines.length === 0) return this.finish();
    this.state = 'running';
    if (from === undefined) this.jump({ li: 0, toks: this.program.lines[0].toks, p: 0 });
    else this.goto(from);
  }

  cont(): void {
    if (!this.contAt) fail('CN');
    this.emit({ type: 'cont' });
    this.jump(this.contAt);
    this.contAt = null;
    this.state = 'running';
  }

  goto(num: number): void {
    const li = this.program.index(num);
    if (li < 0) fail('UL');
    this.jump({ li, toks: this.program.lines[li].toks, p: 0 });
  }

  here(): Pos {
    return { li: this.li, toks: this.c.toks, p: this.c.p };
  }

  jump(at: Pos): void {
    this.li = at.li;
    this.c = new Cursor(at.toks, at.p);
    if (at.p === 0) this.reached();
  }

  private reached(): void {
    if (this.listener && this.li >= 0) this.listener({ type: 'line', num: this.program.lines[this.li].num });
  }

  /** Tell the listener (commands use this for LIST and the cassette). */
  emit(e: BasicEvent): void {
    this.listener?.(e);
  }

  /** Print a BASIC string: char codes 32–127 as text, 128–255 as graphics blocks, 13 a new line, 8 a backspace. */
  out(text: string): void {
    for (let i = 0; i < text.length; i++) this.screen.putChar(text.charCodeAt(i));
  }

  ensureLineStart(): void {
    if (this.screen.pos % 32 !== 0) this.screen.newline();
  }

  /** INPUT: show the prompt and wait for the shell to hand a reply to `input`. */
  awaitInput(prompt: string, targets: Target[], whole: boolean): void {
    if (this.li < 0) fail('ID');
    this.pending = { prompt, targets, next: 0, whole };
    this.out(prompt);
    this.state = 'input';
  }

  input(text: string): void {
    const p = this.pending;
    if (!p || this.state !== 'input') return;
    try {
      if (p.whole) this.vars.set(p.targets[0], text);
      else {
        const items = splitList(text);
        for (const item of items) {
          if (p.next >= p.targets.length) {
            this.screen.print('?EXTRA IGNORED\n');
            break;
          }
          const t = p.targets[p.next];
          if (Vars.isString(t.name)) this.vars.set(t, item.text);
          else if (item.text === '' || isNumberText(item.text)) this.vars.set(t, Number(item.text) || 0);
          else {
            this.screen.print('?REDO\n');
            p.next = 0;
            this.out(p.prompt);
            return;
          }
          p.next++;
        }
        if (p.next < p.targets.length) return this.out('?? ');
      }
      this.pending = null;
      this.state = 'running';
    } catch (e) {
      this.report(e);
    }
  }

  /** Run the cassette through these steps; the last one's `done` decides what happens next. */
  playTape(steps: TapeStep[]): void {
    this.state = 'tape';
    this.deck.play(steps);
  }

  /** SOUND's duration: hold the program this long. */
  pause(seconds: number): void {
    this.wait = seconds;
    this.state = 'waiting';
  }

  /** A key for INKEY$ (only while a program runs; the CoCo keeps just a few). */
  pressKey(ch: string): void {
    if (this.state === 'running' || this.state === 'waiting') this.keys = [...this.keys, ch].slice(-8);
  }

  takeKey(): string {
    return this.keys.shift() ?? '';
  }

  memFree(): number {
    return Math.max(0, 22823 - this.program.bytes());
  }
}
