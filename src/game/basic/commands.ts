import { checkSum } from './checksum';
import { evalStr } from './expr';
import type { Handler, Interpreter } from './interpreter';
import { MAX_LINE_NUMBER } from './program';
import type { TapeFile } from './tape';
import { TapeStep, tapeSeconds } from './tapeDeck';
import { fail } from './values';

/** The tape searching for `name`: S, then F NAME for every file it passes, then reading the one it wants. */
function search(m: Interpreter, name: string, loaded: (file: TapeFile) => void): TapeStep[] {
  const found = m.tape.find(name);
  const steps: TapeStep[] = [{ seconds: 1.2, banner: 'S' }];
  for (const passed of found ? found.passed : m.tape.files().map((f) => f.name)) {
    steps.push({ seconds: 0.5, banner: `F ${passed}` }, { seconds: 0.3, banner: 'S' });
  }
  if (!found) steps.push({ seconds: 0, done: () => fail('IO') });
  else steps.push({ seconds: tapeSeconds(found.file.text), banner: `F ${found.file.name}`, done: () => loaded(found.file) });
  return steps;
}

/** Working with the program itself: LIST, RUN, NEW, CONT, CHECK, and the cassette: CSAVE, CLOAD, SKIPF. */
export const COMMANDS: Record<string, Handler> = {
  // LIST · LIST 100 · LIST 100-200 · LIST -200 · LIST 100-
  LIST: (m, c) => {
    let from = 0;
    let to = MAX_LINE_NUMBER;
    if (c.peek()?.k === 'num') from = to = c.lineNumber();
    if (c.eatOp('-')) to = c.peek()?.k === 'num' ? c.lineNumber() : MAX_LINE_NUMBER;
    m.emit({ type: 'list', from, to });
    m.ensureLineStart();
    for (const line of m.program.list(from, to)) m.out(line + '\n');
  },

  RUN: (m, c) => m.run(c.peek()?.k === 'num' ? c.lineNumber() : undefined),

  NEW: (m) => {
    m.program.clear();
    m.edited();
    m.finish();
  },

  CONT: (m) => m.cont(),

  // CHECK: the RAINBOW CHECK of each line of the program in memory, to compare with the numbers a magazine prints.
  CHECK: (m) => {
    const lines = m.program.list();
    const sums = checkSum(lines);
    m.ensureLineStart();
    lines.forEach((l, i) => m.out(`AFTER ${l.split(' ')[0]}: ${sums[i]}\n`));
  },

  CSAVE: (m, c) => {
    const name = c.atStatementEnd() ? '' : evalStr(m, c);
    const text = m.program.save();
    m.emit({ type: 'csave', name });
    m.playTape(() => [{ seconds: tapeSeconds(text), done: () => {
      if (!m.tape.save(name, text)) fail('IO');
      m.state = 'running';
    } }], true);
  },

  // CLOAD ["NAME"]: wind to the file (or the next one) and load it; a running program ends there.
  CLOAD: (m, c) => {
    const name = c.atStatementEnd() ? '' : evalStr(m, c);
    m.emit({ type: 'cload', name });
    m.playTape(() => search(m, name, (file) => {
      m.program.load(file.text);
      m.edited();
      m.finish();
    }), false, 'S');
  },

  // SKIPF ["NAME"]: wind past the file without loading it (handy for seeing what's on the tape).
  SKIPF: (m, c) => {
    const name = c.atStatementEnd() ? '' : evalStr(m, c);
    m.playTape(() => search(m, name, () => {
      m.state = 'running';
    }), false, 'S');
  },
};
