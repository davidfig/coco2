import { PAGE_IDS, PageId } from './pages';

const SAVE_KEY = 'coco2.rainbow';

/**
 * What a reload brings back of the magazine: the notebook's flags, the scratched hints, and the page the reader was on
 * (by id, so a reordered issue still opens on the same page) with whether the book was out. The CoCo itself starts
 * cold, as the real one did.
 */
export interface Save {
  flags: string[];
  revealed: string[];
  page: PageId;
  open: boolean;
  reading: boolean;
}

export function readSave(): Partial<Save> {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as Partial<Save> | null;
    if (raw?.page && !PAGE_IDS.includes(raw.page)) delete raw.page;
    return raw ?? {};
  } catch {
    return {}; // unreadable save: start fresh
  }
}

export function writeSave(save: Save): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* private window or blocked storage: the journal just starts afresh next time */
  }
}
