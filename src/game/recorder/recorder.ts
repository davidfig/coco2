import type { Interpreter } from '../basic/interpreter';
import { TAPE_KEY } from '../basic/tape';
import { MAY_TAPE_KEY, RAINBOW_TAPE, mayTape } from '../tapes';
import { LID, LIFT, REC, type Pose, seatPose, spotPose } from './layout';

/** The two cassettes: Rainbow On Tape for March, and for May (once May has come). */
export type CassetteId = 'march' | 'may';
const CASSETTES: readonly CassetteId[] = ['march', 'may'];

/** Where the recorder's state is kept: which cassette is in it, and the spot on the table each lies at when out. */
export const RECORDER_KEY = 'coco2.recorder';

/** Seconds: the door swinging open or shut; a cassette carried in or out; STOP/EJECT going down and up. */
const LID_TIME = 0.28;
const MOVE_TIME = 0.95;
const EJECT_TIME = 0.3;
/** How fast the hubs turn while the motor runs (radians a second): a cassette's hub, about 1.5 turns a second at the start. */
const REEL_SPEED = 9;
/** Seconds a tape command waits with no cassette before the view is drawn back to the recorder (`takeBeckon`). */
const BECKON_AFTER = 1.2;

const smooth = (t: number): number => t * t * (3 - 2 * t);
const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

/** A cassette carried from one place to another: into the recorder (`'deck'`) or onto a spot on the table. */
interface Move {
  id: CassetteId;
  to: 'deck' | number;
  t: number;
}

function readSaved(): { deck: CassetteId | null; spots: Partial<Record<CassetteId, number>> } {
  try {
    const raw = localStorage.getItem(RECORDER_KEY);
    if (raw) {
      const v = JSON.parse(raw) as { deck?: string; spots?: Record<string, number> };
      const deck = CASSETTES.find((c) => c === v.deck) ?? null;
      return { deck, spots: v.spots ?? {} };
    }
  } catch {
    // private window or blocked storage: an empty recorder
  }
  return { deck: null, spots: {} };
}

/**
 * The cassette recorder beside the set, and the cassettes lying in front of it (see `layout.ts`). It starts empty: a
 * click on a cassette puts it in (the door swings up, the cassette goes down into the well, the door shuts and PLAY
 * latches down), and a click on the recorder with one in takes it out again (STOP/EJECT) onto the table. Only a
 * cassette seated with the door shut is in for BASIC (`Tape.present`): CLOAD, SKIPF and CSAVE wait for one. The May
 * cassette lies on the table once May has come (`issue2-waiting`); putting it in loads the May tape into BASIC's
 * cassette (`Tape.insert`), March's the March one. Drawn by the computer's march (`recorderGlsl.ts`, `uniforms`).
 */
export class Recorder {
  /** The cassette in the recorder (seated, or on its way in or out). */
  private deck: CassetteId | null;
  /** The spot on the table each cassette lies at when out. */
  private readonly spots: Record<CassetteId, number> = { march: 0, may: 1 };
  private readonly moves: Move[] = [];
  /** The door: how far open (0..1). STOP/EJECT: how far through its press (0..1). */
  private lid = 0;
  private eject = 1;
  private reel = 0;
  /** How much of the tape has wound onto the right-hand reel (0..1). */
  private wound = 0;
  /** The cassette BASIC's tape holds now (a cassette taken out and put back keeps its place). */
  private loaded: CassetteId | null = null;
  private waited = 0;
  private beckon = false;
  /** Seconds a move takes: none with `?instant`. */
  private readonly speed: number;

  constructor(
    private readonly interp: Interpreter,
    private readonly has: (flag: string) => boolean,
    private readonly set: (flag: string) => void,
    instant = false,
  ) {
    const saved = readSaved();
    this.deck = saved.deck;
    for (const c of CASSETTES) if (saved.spots[c] === 0 || saved.spots[c] === 1) this.spots[c] = saved.spots[c]!;
    if (this.spots.march === this.spots.may) this.spots.may = 1 - this.spots.march;
    this.speed = instant ? Infinity : 1;
    this.interp.tape.present = false;
  }

  /** The cassettes there are: March's always, May's once May has come. */
  private available(id: CassetteId): boolean {
    return id === 'march' || this.has('issue2-waiting');
  }

  /** Whether the recorder is busy: a cassette moving, or the motor running (taking one out then would spoil the load). */
  private busy(): boolean {
    return this.moves.length > 0 || this.interp.deck.running;
  }

  /** A click on a cassette lying on the table (it goes in, after the one in there comes out) or on the recorder (the one in it comes out). */
  click(what: CassetteId | 'recorder'): void {
    if (this.busy()) return;
    if (what === 'recorder') {
      if (!this.deck) return;
      this.eject = 0;
      this.moves.push({ id: this.deck, to: this.spots[this.deck], t: 0 });
      return;
    }
    if (what === this.deck || !this.available(what)) return;
    if (this.deck) {
      this.eject = 0;
      this.moves.push({ id: this.deck, to: this.freeSpot(what), t: 0 });
    }
    this.moves.push({ id: what, to: 'deck', t: 0 });
  }

  /** The spot left for the cassette coming out when `coming` goes in: the one it lay on, or the other. */
  private freeSpot(coming: CassetteId): number {
    const other = CASSETTES.find((c) => c !== coming)!;
    return this.spots[other] === this.spots[coming] ? 1 - this.spots[coming] : this.spots[other];
  }

  /** Playtesting (the debug menu's checkpoints): this cassette in the recorder at once, the other on the table. */
  put(id: CassetteId): void {
    this.moves.length = 0;
    this.deck = id;
    this.lid = 0;
    this.eject = 1;
    this.bind();
    this.save();
  }

  /** Once, when a tape command has waited a moment for a cassette: the view should pull back to show the recorder. */
  takeBeckon(): boolean {
    const b = this.beckon;
    this.beckon = false;
    return b;
  }

  step(dt: number): void {
    // A cassette that isn't there any more (a checkpoint went back before May) comes out of the recorder.
    if (this.deck && !this.available(this.deck) && !this.moves.length) this.deck = null;
    const move = this.moves[0];
    // The door opens for a cassette to go in or come out, and shuts once there's nothing more to carry.
    this.lid = clamp01(this.lid + ((move ? dt : -dt) * this.speed) / LID_TIME);
    this.eject = clamp01(this.eject + (dt * this.speed) / EJECT_TIME);
    if (move && this.lid === 1) {
      if (move.t === 0 && move.to !== 'deck') this.deck = null;
      if (move.t === 0 && move.to === 'deck') this.deck = move.id;
      move.t = clamp01(move.t + (dt * this.speed) / MOVE_TIME);
      if (move.t === 1) {
        this.moves.shift();
        if (move.to !== 'deck') this.spots[move.id] = move.to;
        else if (move.id === 'march') this.set('tape-inserted');
        this.save();
      }
    }
    this.bind();
    if (this.interp.deck.running) {
      this.reel += dt * REEL_SPEED;
      this.wind();
    }
    // A tape command waiting with no cassette in: after a moment, the view is drawn to the recorder.
    const waiting = this.interp.state === 'tape' && this.interp.deck.waiting;
    this.waited = waiting ? this.waited + dt : 0;
    if (this.waited > BECKON_AFTER && this.waited - dt <= BECKON_AFTER) this.beckon = true;
  }

  /** BASIC's tape follows the cassette in the recorder: in only while it is seated with the door shut. */
  private bind(): void {
    const seated = !!this.deck && this.lid === 0 && !this.moves.length;
    if (seated && this.deck !== this.loaded) {
      this.loaded = this.deck;
      if (this.deck === 'may') this.interp.tape.insert(mayTape(this.has('deleted-extra-line')), MAY_TAPE_KEY);
      else this.interp.tape.insert(RAINBOW_TAPE, TAPE_KEY);
      this.wind();
    }
    this.interp.tape.present = seated;
  }

  /** How much of the tape is on the right-hand reel: as far along as the head is through the files on it. */
  private wind(): void {
    const n = this.interp.tape.files().length;
    this.wound = n ? Math.min(1, this.interp.tape.position / n) : 0;
  }

  private save(): void {
    try {
      localStorage.setItem(RECORDER_KEY, JSON.stringify({ deck: this.deck, spots: this.spots }));
    } catch {
      // blocked storage: it starts empty next time
    }
  }

  /** Where a cassette is now: seated, on its spot, or on the way between (lifted over the door, then lowered into the well). */
  pose(id: CassetteId): Pose | null {
    if (!this.available(id)) return null;
    const move = this.moves.find((m) => m.id === id && m.t > 0);
    if (!move) return this.deck === id ? seatPose() : spotPose(this.spots[id]);
    const spot = spotPose(move.to === 'deck' ? this.spots[id] : move.to);
    const seat = seatPose();
    // 0 lying on the table, 1 seated: going out is the way in backwards.
    const u = move.to === 'deck' ? move.t : 1 - move.t;
    const across = smooth(clamp01(u / 0.75));
    const top = REC.h + LIFT;
    const y = u < 0.72 ? spot.y + (top - spot.y) * smooth(clamp01(u / 0.3)) : top + (seat.y - top) * smooth((u - 0.72) / 0.28);
    const mix = (a: number, b: number) => a + (b - a) * across;
    return { x: mix(spot.x, seat.x), y, z: mix(spot.z, seat.z), yaw: mix(spot.yaw, seat.yaw), tilt: 0.22 * Math.sin(Math.PI * across) };
  }

  /**
   * The shader's uniforms, in order: the door (radians), the keys (RECORD, PLAY, STOP/EJECT down, the record lamp), each
   * cassette's centre and turn (one not there is put under the table), their tilts, the hubs' turn and the tape wound.
   */
  uniforms(): number[] {
    const playing = !!this.deck && this.lid === 0 && !this.moves.length;
    const recording = this.interp.deck.mode === 'record' && this.interp.deck.running;
    const press = this.eject < 1 ? Math.sin(Math.PI * this.eject) : 0;
    const out = [smooth(this.lid) * LID.open, recording ? 1 : 0, playing ? 1 : 0, press, recording ? 1 : 0];
    const poses = CASSETTES.map((c) => this.pose(c));
    for (const p of poses) out.push(...(p ? [p.x, p.y, p.z, p.yaw] : [0, -10, 0, 0]));
    out.push(poses[0]?.tilt ?? 0, poses[1]?.tilt ?? 0);
    out.push(this.reel % (Math.PI * 2), this.wound);
    return out;
  }

  /** What lies where for a click: each cassette's pose (null when not there), and whether one is in the recorder. */
  cassettes(): { id: CassetteId; pose: Pose; out: boolean }[] {
    return CASSETTES.flatMap((id) => {
      const pose = this.pose(id);
      return pose ? [{ id, pose, out: this.deck !== id }] : [];
    });
  }
}
