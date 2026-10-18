/**
 * The cassette in the recorder: the files that came on it (this issue of Rainbow On Tape, `game/tapes/`) followed by
 * whatever the player CSAVEd, which lives in this browser's localStorage. Saving under a name that's already on the
 * tape records over it. The tape has a position: CLOAD with no name loads the next file, and a search for a name winds
 * forward through the files in between (wrapping round, as if rewound).
 */
export const TAPE_KEY = 'coco2.tape';

export interface TapeFile {
  name: string;
  text: string;
}

/** Names are at most 8 characters on a CoCo tape. */
export const tapeName = (name: string): string => name.slice(0, 8);

function readSaved(key: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return (JSON.parse(raw) as { files?: Record<string, string> }).files ?? {};
  } catch {
    // private window or blocked storage: nothing saved
  }
  return {};
}

export class Tape {
  /** Index of the next file under the head. */
  private pos = 0;
  /** Every name the head has passed or loaded since this cassette went in (the story watches for one). */
  readonly seen = new Set<string>();

  /** `key` is where this cassette's own recordings are kept: each cassette has its own. */
  constructor(private builtIn: readonly TapeFile[], private key = TAPE_KEY) {}

  /** Take the cassette out and put another in, wound back to the start. */
  insert(builtIn: readonly TapeFile[], key: string): void {
    [this.builtIn, this.key, this.pos] = [builtIn, key, 0];
    this.seen.clear();
  }

  /** Every file on the tape, in order. */
  files(): TapeFile[] {
    const saved = readSaved(this.key);
    const out = this.builtIn.map((f) => (f.name in saved ? { name: f.name, text: saved[f.name] } : f));
    for (const [name, text] of Object.entries(saved)) if (!this.builtIn.some((f) => f.name === name)) out.push({ name, text });
    return out;
  }

  /**
   * Wind to the file called `name` (or just the next file, for ""). Returns the names passed on the way and the file,
   * leaving the head after it; null if a whole pass of the tape didn't find it.
   */
  find(name: string): { passed: string[]; file: TapeFile } | null {
    const files = this.files();
    const want = tapeName(name);
    const passed: string[] = [];
    for (let k = 0; k < files.length; k++) {
      const i = (this.pos + k) % files.length;
      this.seen.add(files[i].name);
      if (!want || files[i].name === want) {
        this.pos = i + 1;
        return { passed, file: files[i] };
      }
      passed.push(files[i].name);
    }
    return null;
  }

  save(name: string, text: string): boolean {
    const files = readSaved(this.key);
    files[tapeName(name)] = text;
    try {
      localStorage.setItem(this.key, JSON.stringify({ files }));
      return true;
    } catch {
      return false;
    }
  }
}
