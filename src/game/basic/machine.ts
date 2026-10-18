import type { TextScreen } from '../coco/screen';
import type { Vars } from './vars';

/** What expressions and functions may touch: the variables, the screen, the keyboard and the clock. */
export interface Machine {
  readonly vars: Vars;
  readonly screen: TextScreen;
  /** TIMER: 60ths of a second, wrapping at 65536; assignable. */
  timer: number;
  /** INKEY$: the next waiting key, or "". */
  takeKey(): string;
  /** MEM: bytes free. */
  memFree(): number;
}
