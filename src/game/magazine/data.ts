/** What the reader has done: the story flags the pages and the notebook follow. */
export interface IssueState {
  /** Story flags the game sets as the player gets on (see `Magazine.setFlag`). */
  flags: Set<string>;
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
  ['LISTEN', 'Keep still and hear what is about.'],
];

export function newState(): IssueState {
  return { flags: new Set(['booted']) };
}

