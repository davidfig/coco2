/**
 * The RAINBOW CHECK: a plain sum of the character codes in each line, kept to 0..255, carried on from line to line.
 * The magazine prints these next to its listings and the CHECK command prints them for the program in memory.
 */
export function checkSum(lines: readonly string[]): number[] {
  let total = 0;
  return lines.map((l) => {
    for (const ch of l) total = (total + ch.charCodeAt(0)) % 256;
    return total;
  });
}
