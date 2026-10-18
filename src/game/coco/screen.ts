import { SPACE, screenCode } from '../vdg/charset';
import { COLS, ROWS } from '../vdg/vdg';
import { Tamper } from './tamper';

/** Seconds between the cursor's colour changes. */
const BLINK = 0.25;

/**
 * The text screen as Color BASIC keeps it: 512 bytes of video memory at $0400, a cursor position, printing that wraps
 * and scrolls, and the cursor: a solid block that steps through the eight semigraphics colours.
 */
export class TextScreen {
  readonly vram = new Uint8Array(COLS * ROWS).fill(SPACE);
  /** The cell the next character goes in (0–511). */
  pos = 0;
  /** Cells changed behind BASIC's back (`tamper`), for the TV to disturb. */
  readonly tampered = new Tamper();
  cursorOn = true;
  /** The cursor's semigraphics colour (0–7). */
  private cursorColor = 0;
  /** Steps the cursor's colour takes instead of +1, one per blink (`misstep`). */
  private missteps: number[] = [];
  private blinkTimer = 0;

  /** Called with each row as it leaves the screen, by scrolling or CLS (the headless harness keeps a transcript). */
  onLostRow?: (row: Uint8Array) => void;

  /** Video memory changed (or the cursor stepped) since the last `takeDirty`. */
  private dirty = true;

  /** Clear to spaces, or fill with any screen byte (CLS 3 fills with blue blocks). */
  cls(code = SPACE): void {
    const rows = Math.floor(Math.min(this.pos, this.vram.length - 1) / COLS) + 1;
    for (let r = 0; r < rows && this.onLostRow; r++) this.onLostRow(this.vram.slice(r * COLS, (r + 1) * COLS));
    this.vram.fill(code);
    this.pos = 0;
    this.tampered.clear();
    this.dirty = true;
  }

  /** Print text at the cursor. "\n" goes to the start of the next line; characters with no glyph are skipped. */
  print(text: string): void {
    for (const ch of text) {
      if (ch === '\n') this.newline();
      else {
        const code = screenCode(ch);
        if (code !== null) this.putCode(code);
      }
    }
  }

  /** Print a BASIC character code: 32–127 text, 128–255 graphics blocks, 13 (or 10) a new line, 8 a backspace. */
  putChar(code: number): void {
    if (code === 13 || code === 10) this.newline();
    else if (code === 8) this.backspace();
    else if (code >= 128) this.putCode(code);
    else if (code >= 32) {
      const sc = screenCode(String.fromCharCode(code));
      if (sc !== null) this.putCode(sc);
    }
  }

  /** Write text straight into memory at `cell`, leaving the cursor where it is (the tape's S / F NAME corner). */
  writeAt(cell: number, text: string): void {
    for (const ch of text) {
      const code = screenCode(ch);
      if (code === null || cell >= this.vram.length) continue;
      this.tampered.forget(cell);
      this.vram[cell++] = code;
    }
    this.dirty = true;
  }

  /**
   * Change text at `cell` the way nothing in the CoCo would: the story's hand on the screen. Like `writeAt`, but every
   * cell that changes is marked, and the TV shows the change happening in the tube. The cursor stays where it is.
   */
  tamper(cell: number, text: string): void {
    for (const ch of text) {
      const code = screenCode(ch);
      if (code === null || cell >= this.vram.length) continue;
      if (this.vram[cell] !== code) this.tampered.mark(cell, this.vram[cell]);
      this.vram[cell++] = code;
    }
    this.dirty = true;
  }

  /**
   * Claim `count` cells from `cell` as the story's without changing them: text BASIC printed that is really OK's (his line in a
   * listing). They shimmer as they are claimed and keep the story's ripple until BASIC writes over them. Cells already
   * claimed are left alone, so claiming again does not replay the shimmer.
   */
  claim(cell: number, count: number): void {
    for (let i = cell; i < Math.min(cell + count, this.vram.length); i++) {
      if (!this.tampered.isMarked(i)) this.tampered.mark(i, this.vram[i]);
    }
    this.dirty = true;
  }

  /** Memory was written directly (POKE, SET): redraw. */
  touch(): void {
    this.dirty = true;
  }

  /** Write one raw screen byte at the cursor and move on (semigraphics blocks too). */
  putCode(code: number): void {
    this.tampered.forget(this.pos);
    this.vram[this.pos++] = code;
    if (this.pos >= this.vram.length) this.scroll();
    this.dirty = true;
  }

  newline(): void {
    this.pos = (Math.floor(this.pos / COLS) + 1) * COLS;
    if (this.pos >= this.vram.length) this.scroll();
    this.dirty = true;
  }

  /** Step back one cell and blank it (BASIC's ← key). */
  backspace(): void {
    if (this.pos === 0) return;
    this.vram[--this.pos] = SPACE;
    this.tampered.forget(this.pos);
    this.dirty = true;
  }

  /** Move everything up a line and clear the bottom one; the cursor moves up with it. */
  private scroll(): void {
    this.onLostRow?.(this.vram.slice(0, COLS));
    this.vram.copyWithin(0, COLS);
    this.vram.fill(SPACE, this.vram.length - COLS);
    this.tampered.scroll();
    this.pos -= COLS;
  }

  /** Restart the blink so the cursor shows right away (after a key). */
  wake(): void {
    this.blinkTimer = 0;
    this.dirty = true;
  }

  step(dt: number): void {
    this.tampered.step(dt);
    this.blinkTimer += dt;
    if (this.blinkTimer >= BLINK) {
      this.blinkTimer -= BLINK;
      this.cursorColor = (this.cursorColor + (this.missteps.shift() ?? 1)) & 7;
      this.dirty = true;
    }
  }

  /** For a moment the cursor's colours come out of order: two of them swap places, once. No CoCo does this. */
  misstep(): void {
    this.missteps = [2, -1, 2];
  }

  /** What the VDG shows over memory at the cursor, if anything: a full semigraphics block in the cursor colour. */
  cursor(): { at: number; code: number } | undefined {
    return this.cursorOn ? { at: this.pos, code: 0x8f | (this.cursorColor << 4) } : undefined;
  }

  takeDirty(): boolean {
    const d = this.dirty;
    this.dirty = false;
    return d;
  }
}
