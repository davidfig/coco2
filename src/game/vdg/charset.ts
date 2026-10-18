/**
 * The MC6847 VDG's internal character ROM: 64 glyphs, 5×7 dots in an 8×12 cell (3 blank rows above, 2 below).
 * Each glyph is 7 rows; each row a byte with the dots in bits 5..1 (MSB is the cell's left column).
 * Order is the VDG's: @ A–Z [ \ ] ↑ ← then space ! " # … 0–9 … ? (ASCII 0x40–0x5F, then 0x20–0x3F).
 */
const ROM = [
  '1c22021a2a2a1c', // @
  '081422223e2222', // A
  '3c12121c12123c', // B
  '1c22202020221c', // C
  '3c12121212123c', // D
  '3e20203c20203e', // E
  '3e20203c202020', // F
  '1e20202622221e', // G
  '2222223e222222', // H
  '1c08080808081c', // I
  '0202020222221c', // J
  '22242830282422', // K
  '2020202020203e', // L
  '22362a2a222222', // M
  '22322a26222222', // N
  '3e22222222223e', // O (square on the 6847)
  '3c22223c202020', // P
  '1c2222222a241a', // Q
  '3c22223c282422', // R
  '1c22100804221c', // S
  '3e080808080808', // T
  '2222222222221c', // U
  '22222214140808', // V
  '2222222a2a3622', // W
  '22221408142222', // X
  '22221408080808', // Y
  '3e02040810203e', // Z
  '38202020202038', // [
  '20201008040202', // \
  '0e02020202020e', // ]
  '081c2a08080808', // ↑
  '0008103e100800', // ←
  '00000000000000', // space
  '08080808080008', // !
  '14141400000000', // "
  '14143600361414', // #
  '081e201c023c08', // $
  '32320408102626', // %
  '1028281028241a', // &
  '18181020000000', // '
  '08102020201008', // (
  '08040202020408', // )
  '082a1c3e1c2a08', // *
  '0008083e080800', // +
  '00000000181020', // ,
  '0000003e000000', // -
  '00000000001818', // .
  '02020408102020', // /
  '18242424242418', // 0 (narrow on the 6847)
  '0818080808081c', // 1
  '1c22021c20203e', // 2
  '1c22020c02221c', // 3
  '040c143e040404', // 4
  '3e203c0202221c', // 5
  '1c20203c22221c', // 6
  '3e020408102020', // 7
  '1c22221c22221c', // 8
  '1c22221e02021c', // 9
  '00181800181800', // :
  '18180018181020', // ;
  '04081020100804', // <
  '00003e003e0000', // =
  '10080402040810', // >
  '18240408080008', // ?
];

export const CELL_W = 8;
export const CELL_H = 12;

/** `GLYPHS[i * 12 + row]`: the 8 dots of glyph `i`'s row (0–11), MSB on the left. */
export const GLYPHS = (() => {
  const out = new Uint8Array(64 * CELL_H);
  ROM.forEach((hex, i) => {
    for (let r = 0; r < 7; r++) out[i * CELL_H + 3 + r] = parseInt(hex.slice(r * 2, r * 2 + 2), 16);
  });
  return out;
})();

/**
 * The screen byte Color BASIC writes for a character: bit 6 set is normal (dark on green), clear is inverse, which is
 * how a CoCo shows lower case. `null` for characters the VDG has no glyph for.
 */
export function screenCode(ch: string): number | null {
  if (ch === '↑' || ch === '^') return 0x5e;
  if (ch === '←') return 0x5f;
  const a = ch.charCodeAt(0);
  if (ch.length !== 1) return null;
  if (a >= 0x61 && a <= 0x7a) return (a - 0x20) & 0x3f; // lower case → inverse upper case
  if (a >= 0x20 && a <= 0x5d) return (a & 0x3f) | 0x40;
  return null;
}

/** The screen byte for a space: what CLS fills the screen with. */
export const SPACE = 0x60;
