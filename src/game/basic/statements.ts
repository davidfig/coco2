import { COMMANDS } from './commands';
import { FLOW } from './flow';
import type { Handler } from './interpreter';
import { IO } from './io';
import { STORE } from './store';

/** Every statement keyword and what runs it. A new statement goes in the group it belongs to. */
export const STATEMENTS: Record<string, Handler> = { ...FLOW, ...IO, ...STORE, ...COMMANDS };
