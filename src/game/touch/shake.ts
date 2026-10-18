/** A jolt harder than this (m/s², gravity left out) is a shake; walking about or turning the phone is well under it. */
const JOLT = 17;
/** After a shake, this long (s) before the next counts: one swing of the arm is one smack, not three. */
const SETTLE = 0.6;

interface MotionPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/**
 * A phone shaken is the set smacked (`Touch.smack`): the hand that would land on the cabinet's side is the player's
 * own. iOS asks permission to read the motion, and only from a tap, so the ask waits for the first smack by hand
 * (`ask`), when the player already knows what a smack does; elsewhere it listens from the start.
 */
export class Shake {
  private listening = false;
  private asked = false;
  private last = -Infinity;

  constructor(private readonly onShake: () => void) {
    if (typeof DeviceMotionEvent === 'undefined') return;
    if (!(DeviceMotionEvent as unknown as MotionPermission).requestPermission) this.listen();
  }

  /** Called from a tap: on iOS, ask (once) to read the motion. */
  ask(): void {
    const request = typeof DeviceMotionEvent === 'undefined' ? undefined : (DeviceMotionEvent as unknown as MotionPermission).requestPermission;
    if (this.listening || this.asked || !request) return;
    this.asked = true;
    request()
      .then((answer) => {
        if (answer === 'granted') this.listen();
      })
      .catch(() => {});
  }

  private listen(): void {
    this.listening = true;
    window.addEventListener('devicemotion', (e) => {
      const a = e.acceleration;
      if (!a || a.x === null || a.y === null || a.z === null) return;
      const now = e.timeStamp / 1000;
      if (Math.hypot(a.x, a.y, a.z) < JOLT || now - this.last < SETTLE) return;
      this.last = now;
      this.onShake();
    });
  }
}
