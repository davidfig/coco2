/** What one issue's ABOUT says: its month, the next-issue line, and the programs it lists, in tape order. */
export interface AboutIssue {
  /** As printed under the title, e.g. "MARCH 1986". */
  readonly month: string;
  /** The line under the credits (at most 31 characters). */
  readonly next: string;
  /** Name and what it is (at most 8 and 20 characters), as ABOUT lists them; the second is the one the CLOAD example names. */
  readonly programs: readonly (readonly [name: string, what: string])[];
}

/**
 * ABOUT, the first program on every issue's tape, written for that issue: the same title page and listing each time
 * (one template, so every tape's ABOUT stays alike), with the issue's month, its own programs in its DATA and the first
 * after ABOUT as the CLOAD example. A tape keeps at most five on its list: the rows below it are fixed.
 */
export function aboutTape(issue: AboutIssue): string {
  const { month, next, programs } = issue;
  const q = (s: string): string => `"${s}"`;
  const lines = [
    '10 REM ABOUT THIS TAPE',
    `20 REM RAINBOW ON TAPE, ${month}`,
    '30 CLS 0:GOSUB 900',
    '40 R=2:A$="RAINBOW ON TAPE":GOSUB 1000',
    `50 A$=${q(month)}:GOSUB 1000`,
    '60 R=5:A$="PROGRAMS FOR THE TANDY":GOSUB 1000',
    '70 A$="COLOR COMPUTER":GOSUB 1000',
    '80 R=8:A$="WRITTEN BY":GOSUB 1000',
    '90 A$="DAVID FIGATNER":GOSUB 1000',
    '95 A$="AND CLAUDE":GOSUB 1000',
    `100 R=12:A$=${q(next)}:GOSUB 1000`,
    '110 R=13:GOSUB 950',
    '120 GOSUB 800',
    '130 CLS 0:GOSUB 900',
    '140 R=2:A$="ON THIS TAPE":GOSUB 1000',
    `150 R=4:FOR I=1 TO ${programs.length}:READ A$,B$`,
    '160 PRINT @R*32+3,A$;:PRINT @R*32+12,B$;:R=R+1:NEXT',
    '170 R=9:A$="TO LOAD A PROGRAM, TYPE":GOSUB 1000',
    `180 A$="CLOAD "+CHR$(34)+${q(programs[1][0])}+CHR$(34):GOSUB 1000`,
    '190 A$="AND THEN RUN":GOSUB 1000',
    '200 R=13:A$="CLOAD ALONE LOADS THE NEXT ONE":GOSUB 1000',
    '210 PRINT @448,"";:END',
    '800 PRINT @485,"PRESS ANY KEY TO GO ON";',
    '810 IF INKEY$="" THEN 810',
    '820 RETURN',
    '900 FOR C=0 TO 7:PRINT STRING$(4,CHR$(143+C*16));:NEXT:RETURN',
    '950 PRINT @R*32,"";:GOTO 900',
    '1000 PRINT @R*32+INT((32-LEN(A$))/2),A$;:R=R+1:RETURN',
    ...programs.map(([name, what], i) => `${2000 + i * 10} DATA ${name},${what}`),
  ];
  return lines.join('\n');
}
