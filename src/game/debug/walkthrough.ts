import { HeadlessCoco } from '../coco/headless';
import type { AnyPageId } from '../magazine/pages';
import { isSolved, noteText, visibleNotes, type Note } from '../notes/notes';
import { ISSUE_1_RULES } from '../puzzles/rules';
import { ISSUE_2_RULES } from '../puzzles/rulesMay';
import { PuzzleWatcher } from '../puzzles/watcher';
import { Issue1Story } from '../story/issue1';
import { Issue2Story } from '../story/issue2';
import { rowText } from '../story/screenText';
import { MAY_TAPE_KEY, mayTape } from '../tapes';
import type { Tv } from '../tv/tv';
import { COLS } from '../vdg/vdg';
import { ROUTES, type Route } from './walkthroughRoute';

export { ROUTES };

/**
 * Playtesting without playing: the whole game run headlessly (BASIC, the tapes, both issues' stories and puzzles, the
 * notebook) by a scripted player, written out as text: what the player does, what the screen shows, what the story
 * changes on its own, which flags tick and what the notes say. `pnpm walkthrough` writes it to `docs/walkthrough.md`;
 * `walkthrough.test.ts` checks every route still reaches the end. Edit a tape, a rule, a timer or a note and run it
 * again to read the change, rather than playing up to it. The route itself is `walkthroughRoute.ts`.
 *
 * The magazine, the notebook, the recorder and the set's switch have no headless machine: a step's `act` stands in
 * for them, setting what the page would (`seen-guess`, the May cassette, the night between issues).
 */

/** One thing the player does. */
export interface Step {
  /** What they do, in a few words. */
  say: string;
  /** Typed at the CoCo, one line per entry (ENTER after each). */
  type?: readonly string[];
  /** Seconds that pass afterwards, doing nothing (default 1): the story's timers run. */
  wait?: number;
  /** Something done off the keyboard: the magazine, the notes, the recorder, the switch. */
  act?: (p: Play) => void;
}

/** A stretch of the route, under its own heading. */
export interface Part {
  title: string;
  steps: readonly Step[];
}

/** The game being played: the machine, the flags in the order they were set, and the story. */
export class Play {
  readonly coco = new HeadlessCoco();
  readonly flags = new Set<string>(['booted']);
  readonly story: Issue1Story;
  readonly story2: Issue2Story;
  /** Seconds of play so far. */
  t = 0;
  /** What happened since the step began, besides the typing: flags, the story's own writing on the screen. */
  private events: string[] = [];

  constructor() {
    try {
      localStorage.clear();
    } catch {
      /* no storage: nothing to clear */
    }
    const has = (f: string): boolean => this.flags.has(f);
    const set = (f: string): void => this.set(f);
    const { coco } = this;
    // The story writes through `tamper`: each change is shown as the row before and after.
    const tamper = coco.screen.tamper.bind(coco.screen);
    coco.screen.tamper = (cell, text) => {
      const row = Math.floor(cell / COLS);
      const before = rowText(coco.screen, row).trimEnd();
      tamper(cell, text);
      const after = rowText(coco.screen, row).trimEnd();
      if (before !== after) this.events.push(`**story** row ${row}: \`${before}\` → \`${after}\` (${this.clock()})`);
    };
    const tv = { tamperStrength: 0, tamperStyle: 'ghost' } as unknown as Tv;
    this.story = new Issue1Story(coco.screen, tv, has, set, coco.interp, () => {
      if (coco.interp.state !== 'idle') coco.interp.halt();
      coco.interp.program.clear();
      coco.interp.edited();
      coco.basic.boot();
      this.events.push(`**story** the next day: the CoCo boots afresh, memory empty (${this.clock()})`);
    });
    this.story2 = new Issue2Story(coco.screen, has, set, coco.interp, () => this.events.push(`**story** the set flinches: the picture starts to collapse and comes back (${this.clock()})`));
    new PuzzleWatcher(coco.interp, has, set, [...ISSUE_1_RULES, ...this.story.rules, ...ISSUE_2_RULES, ...this.story2.rules]);
    coco.onFrame = (dt) => {
      this.t += dt;
      this.story.step(dt);
      this.story2.step(dt);
    };
  }

  /** The time of play, as m:ss. */
  clock(): string {
    const s = Math.floor(this.t);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  /** A flag ticks (once), in the order the notebook will write it. */
  set(flag: string): void {
    if (this.flags.has(flag)) return;
    this.flags.add(flag);
    this.events.push(`flag \`${flag}\` (${this.clock()})`);
  }

  /** The player looks at a page of the magazine long enough to read it (what `SeenTracker` notices). */
  look(id: AnyPageId): void {
    if (id === 'guess' || id === 'mayShutdownEnd') this.set(`seen-${id}`);
  }

  /** The set's switch: off ends an evening once its story is told, on starts the next day. */
  switchOff(): void {
    this.story.sleep();
    this.story2.sleep();
  }

  switchOn(): void {
    this.story.wake();
  }

  /** The May cassette put in the recorder (it carries OK's answer to what was done with GUESS's extra line). */
  insertMay(): void {
    this.coco.interp.tape.insert(mayTape(this.flags.has('deleted-extra-line')), MAY_TAPE_KEY);
  }

  /** Run one step; returns what it showed and what happened. */
  run(step: Step): { screen: string[]; events: string[] } {
    this.events = [];
    const screen: string[] = [];
    step.act?.(this);
    for (const line of step.type ?? []) {
      const out = this.coco.type(`${line}\n`).output();
      // Each typing's output starts on the row it was typed on, which ended the one before (the prompt, or a blank row).
      const last = screen.at(-1);
      if (last !== undefined && out[0]?.startsWith(last)) screen.pop();
      screen.push(...out);
    }
    while (screen.length && screen.at(-1) === '') screen.pop();
    this.coco.run(step.wait ?? 1);
    return { screen, events: this.events };
  }
}

/** A long screen (a whole CHECK, a long LIST) cut to its start and end. */
const clip = (lines: readonly string[], keep = 12): string[] =>
  lines.length <= keep * 3 ? [...lines] : [...lines.slice(0, keep), `… ${lines.length - keep * 2} more rows …`, ...lines.slice(-keep)];

const noteLine = (n: Note, flags: ReadonlySet<string>): string => `${noteText(n, flags)}${n.ask ? ' ❓' : ''}`;

/** Play a route; returns it as Markdown, and the flags it ended with. */
export function walk(route: Route, level = '##'): { md: string[]; flags: ReadonlySet<string> } {
  const play = new Play();
  const md: string[] = [];
  let written = new Set<string>();
  let solved = new Set<string>();
  let n = 0;
  for (const part of route.parts) {
    const shown = !route.shows || route.shows.includes(part);
    if (shown) md.push(`${level}# ${part.title}`, '');
    for (const step of part.steps) {
      n++;
      const at = play.clock();
      const { screen, events } = play.run(step);
      const notes = visibleNotes(play.flags);
      const added = notes.filter((x) => !written.has(x.id));
      const crossed = notes.filter((x) => isSolved(x, play.flags) && !solved.has(x.id));
      written = new Set(notes.map((x) => x.id));
      solved = new Set(notes.filter((x) => isSolved(x, play.flags)).map((x) => x.id));
      if (!shown) continue;
      md.push(`**${n}. ${step.say}** (${at})`, '');
      if (screen.length) md.push('```', ...clip(screen), '```', '');
      for (const e of events) md.push(`- ${e}`);
      for (const x of crossed.filter((x) => !added.includes(x))) md.push(`- notes ~~${noteText(x, play.flags)}~~`);
      for (const x of added) {
        const words = x.date ? `**${noteText(x, play.flags)}**` : crossed.includes(x) ? `~~${noteText(x, play.flags)}~~ (answered at once)` : noteLine(x, play.flags);
        md.push(`- notes + ${words}`);
      }
      if (events.length || crossed.length || added.length) md.push('');
    }
  }
  return { md, flags: play.flags };
}

/** The whole walkthrough, every route, as one Markdown document. */
export function walkthrough(): string {
  const out = [
    '# Walkthrough',
    '',
    'Written by `pnpm walkthrough` (`src/game/debug/walkthrough.ts`): a scripted player plays the whole game headlessly and',
    'this is what happened. Do not edit it by hand: change the game (or the route in `walkthroughRoute.ts`) and run it again.',
    '',
    'Each step: what the player does and the time of play; what the screen showed; `flag`s as they tick; **story**, what',
    'the game wrote on the screen by itself (the row before → after); the notebook (+ a new line, ❓ an open question,',
    '~~crossed out~~ when answered). The magazine, the notes, the recorder and the switch are acted, not clicked.',
    '',
  ];
  for (const [i, route] of ROUTES.entries()) {
    out.push(`## ${i === 0 ? 'Main route' : 'Branch'}: ${route.name}`, '');
    if (route.shows) out.push('Only the parts that differ from the main route.', '');
    out.push(...walk(route).md);
  }
  return out.join('\n');
}
