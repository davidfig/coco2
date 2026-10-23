import { HeadlessCoco } from '../coco/headless';
import { expect, test } from '../../test/check';
import type { TapeFile } from '../basic/tape';
import type { AboutIssue } from './about';
import { JULY_ABOUT, MARCH_ABOUT, MAY_ABOUT, MAY_TAPE_KEY, RAINBOW_TAPE, julyTape, mayTape } from '.';

const ISSUES: readonly [string, AboutIssue, readonly TapeFile[]][] = [
  ['MARCH', MARCH_ABOUT, RAINBOW_TAPE],
  ['MAY', MAY_ABOUT, mayTape(true)],
  ['JULY', JULY_ABOUT, julyTape()],
];

for (const [label, about, tape] of ISSUES) {
  test(`ABOUT: ${label}'s lists only what is on its tape, in tape order`, () => {
    const names = tape.map((f) => f.name);
    const listed = about.programs.map(([name]) => names.indexOf(name));
    expect(listed.every((i) => i >= 0)).toBe(true);
    expect(listed.every((i, n) => n === 0 || i > listed[n - 1])).toBe(true);
    expect(about.programs.length <= 5).toBe(true);
  });

  test(`ABOUT: ${label}'s shows its month, then its programs and how to load one`, () => {
    const coco = new HeadlessCoco();
    if (tape !== RAINBOW_TAPE) coco.interp.tape.insert(tape, MAY_TAPE_KEY);
    coco.type('CLOAD "ABOUT"\nRUN\n', 2);
    expect(coco.lines().join('\n')).toContain(about.month);
    coco.keys([{ key: ' ', shift: false, ctrl: false }]);
    // CLS 0's black shows as # in the text
    const screen = coco.lines().join('\n');
    for (const [name, what] of about.programs) expect(screen).toContain(`${name}${'#'.repeat(9 - name.length)}${what}`);
    expect(screen).toContain(`CLOAD "${about.programs[1][0]}"`);
    expect(screen).notToContain('ERROR');
  });
}
