import type { Scratched } from './foil';

/** What the reader has done and uncovered; the hint page is drawn from it. */
export interface IssueState {
  /** Story flags the game sets as the player gets on (see `Magazine.setFlag`). */
  flags: Set<string>;
  /** Scratch-off hints already uncovered. */
  revealed: Set<string>;
  /** Hints being scratched, each with its own worn foil. Not saved: a half-scratched panel starts over next visit. */
  scratch: Record<string, Scratched>;
}

/** The commands the adventure's two-word parser understands; the "How to play" page prints this list. */
export const COMMANDS: readonly [string, string][] = [
  ['LOOK', 'Describe where you are again.'],
  ['GO NORTH', 'Walk that way. N, S, E and W will do.'],
  ['TAKE LAMP', 'Pick something up.'],
  ['DROP LAMP', 'Put it down again.'],
  ['EXAMINE DOOR', 'Look closely at one thing.'],
  ['INVENTORY', 'List what you are carrying. I will do.'],
  ['USE KEY', 'Try an object where you stand.'],
];

export function newState(): IssueState {
  return { flags: new Set(['booted']), revealed: new Set(), scratch: {} };
}

