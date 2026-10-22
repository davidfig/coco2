import type { Interpreter } from '../basic/interpreter';
import { TAPE_KEY } from '../basic/tape';
import { MAY_TAPE_KEY, RAINBOW_TAPE, mayTape } from '../tapes';
import type { RecorderSound } from './recorderSound';
import { ACROSS, CAS, LID, type Pose, seatPose, spotPose } from './layout';

/** The two cassettes: Rainbow On Tape for March, and for May (once May has come). */
export type CassetteId = 'march' | 'may';
const CASSETTES: readonly CassetteId[] = ['march', 'may'];

/** Where the recorder's state is kept: which cassette is in it, and the spot on the table each lies at when out. */
export const RECORDER_KEY = 'coco2.recorder';

/** Seconds: the door swinging open or shut; a cassette carried in or out; STOP/EJECT going down and up. */
const LID_TIME = 0.28;
const MOVE_TIME = 1.35;
/** A cassette carried between the recorder and the pile of old issues, over the machine, takes this much longer. */
const FAR_TIME = 1.8;
/** Seconds a cassette takes between its spot by the recorder and the pile as the issues change places (`shift`). */
const SHIFT_TIME = 1.5;
const EJECT_TIME = 0.3;
/** How fast the hubs turn while the motor runs (radians a second): a cassette's hub, about 1.5 turns a second at the start. */
const REEL_SPEED = 9;
/** Seconds from the door shutting on a cassette to PLAY latching down. */
const LATCH_AFTER = 0.2;
/** Seconds a tape command waits with no cassette before the view is drawn back to the recorder (`takeBeckon`). */
const BECKON_AFTER = 1.2;

const smooth = (t: number): number => t * t * (3 - 2 * t);
const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));

/**
 * A cassette goes in as into a real top-loader: tipped, its top (the edge across from the tape opening) down toward
 * the back of the well and its tape edge up (`TIP`, radians), lowered so the top goes in first, then its tape edge
 * pushed down onto the heads until it lies flat. It is held `HOVER` over the well (and `AHEAD` in front of its place)
 * before it goes down.
 */
const TIP = 0.4;
const HOVER = 0.26;
const AHEAD = 0.05;
/** Through a move (0 on the table, 1 seated): carried over the well by `OVER`, its edge down in the well by `DOWN`. */
const OVER = 0.55;
const DOWN = 0.8;

/** Where the lower corner of a cassette's top edge is from its centre (model frame), at a turn and tilt. */
function topEdge(yaw: number, tilt: number): [number, number, number] {
  const [ct, st] = [Math.cos(tilt), Math.sin(tilt)];
  const [y, z] = [-CAS.hh, -CAS.hd];
  const [ty, tz] = [y * ct + z * st, -y * st + z * ct];
  return [tz * Math.sin(yaw), ty, tz * Math.cos(yaw)];
}

/**
 * A cassette `s` of the way from `a` to `b` on the other side of the set: in front of it and over the machine (a curve
 * through `ACROSS` halfway), lifted up to there before it goes over and let down after. Its turn goes between; it is
 * carried flat over the machine, tipped only as it is lifted and let down.
 */
function across(a: Pose, b: Pose, s: number): Pose {
  const q = (p: number, m: number, r: number) => {
    const c = 2 * m - (p + r) / 2;
    return (1 - s) * (1 - s) * p + 2 * s * (1 - s) * c + s * s * r;
  };
  const [up, down] = [smooth(clamp01(s / 0.3)), smooth(clamp01((s - 0.7) / 0.3))];
  return {
    x: q(a.x, ACROSS.x, b.x),
    y: a.y + (ACROSS.y - a.y) * up + (b.y - ACROSS.y) * down,
    z: q(a.z, ACROSS.z, b.z),
    yaw: a.yaw + (b.yaw - a.yaw) * s,
    tilt: a.tilt * (1 - up) + b.tilt * down,
  };
}

/** A cassette carried from one place to another: into the recorder (`'deck'`), onto a spot on the table, or onto the pile of old issues. */
interface Move {
  id: CassetteId;
  to: 'deck' | number | 'pile';
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
 * cassette (`Tape.insert`), March's the March one. Only the cassette of the issue on the table lies by the recorder
 * (`current`); the others lie on the pile of old issues beside the set (`piled`), and one taken out of the recorder goes
 * back there. Drawn by the computer's march (`recorderGlsl.ts`, `uniforms`).
 */
export class Recorder {
  /** The cassette in the recorder (seated, or on its way in or out). */
  private deck: CassetteId | null;
  /** The spot on the table each cassette lies at when out. */
  private readonly spots: Record<CassetteId, number> = { march: 0, may: 1 };
  private readonly moves: Move[] = [];
  /** Cassettes lying out carried to where they lie now, the issues having changed places (`shift`): from where each lay. */
  private readonly shifts: { id: CassetteId; from: Pose; t: number }[] = [];
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
  /** Seconds until PLAY latches down after the door shuts on a cassette (-1: not waiting to). */
  private latchIn = -1;
  /** How high the cassette the story waits on (`wanted`) is off the table now: the guide's hop (main.ts). */
  lift = 0;
  /** The cassette of the issue on the table (main.ts: `Magazine.issue`): the one that lies by the recorder. */
  current: () => CassetteId = () => 'march';
  /** Where a cassette lies on the pile of old issues, if its issue is there (main.ts, `pileCassette`). */
  piled: (id: CassetteId) => Pose | null = () => null;
  /** The recorder's sounds (main.ts; none in tests or with `?nosound`). */
  sound: RecorderSound | null = null;
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

  /**
   * The cassette the story waits on to be put in, lying on the table: March's once the magazine has been opened, until
   * it has gone in (`tape-inserted`); May's once it has come, until something has been loaded from it (`may-loaded`).
   */
  wanted(): CassetteId | null {
    const id: CassetteId | null = this.has('issue2-waiting')
      ? this.has('may-loaded') ? null : 'may'
      : this.has('opened-magazine') && !this.has('tape-inserted') ? 'march' : null;
    return id && this.deck !== id && !this.moving(id) ? id : null;
  }

  /** Whether a cassette is on its way somewhere. */
  private moving(id: CassetteId): boolean {
    return this.moves.some((m) => m.id === id) || this.shifts.some((m) => m.id === id);
  }

  /** Whether the recorder is busy: a cassette moving, or the motor running (taking one out then would spoil the load). */
  private busy(): boolean {
    return this.moves.length > 0 || this.shifts.length > 0 || this.interp.deck.running;
  }

  /** A click on a cassette lying on the table (it goes in, after the one in there comes out) or on the recorder (the one in it comes out). */
  click(what: CassetteId | 'recorder'): void {
    if (this.busy()) return;
    if (what === 'recorder') {
      if (!this.deck) return;
      this.open();
      this.moves.push({ id: this.deck, to: this.home(this.deck), t: 0 });
      return;
    }
    if (what === this.deck || !this.available(what) || what !== this.current()) return;
    this.open();
    if (this.deck) this.moves.push({ id: this.deck, to: this.home(this.deck), t: 0 });
    this.moves.push({ id: what, to: 'deck', t: 0 });
  }

  /** Where a cassette goes when it comes out: its spot by the recorder if its issue is on the table, else the pile. */
  private home(id: CassetteId): number | 'pile' {
    return id !== this.current() && this.piled(id) ? 'pile' : this.spots[id];
  }

  /** Whether a cassette is going between the recorder and the pile (the march looks for it in all the space between them). */
  far(): boolean {
    return this.carrying();
  }

  /** Whether a cassette is being carried between the recorder's side and the pile, over the machine (all the march between them is redrawn). */
  carrying(): boolean {
    return this.shifts.length > 0 || this.moves.some((m) => m.to === 'pile' && m.t > 0);
  }

  /** Where each cassette lying out of the recorder lies now: for `shift`, taken before the issues change places. */
  lyingNow(): Partial<Record<CassetteId, Pose>> {
    const out: Partial<Record<CassetteId, Pose>> = {};
    for (const id of CASSETTES) if (this.available(id) && this.deck !== id && !this.moving(id)) out[id] = this.lying(id);
    return out;
  }

  /** The issues have changed places (`current`, `piled`): each cassette lying out (`was`, `lyingNow`) is carried from where it lay to where it lies now. */
  shift(was: Partial<Record<CassetteId, Pose>>): void {
    for (const id of CASSETTES) {
      const from = was[id];
      const to = this.lying(id);
      if (from && this.deck !== id && !this.moving(id) && (from.x !== to.x || from.z !== to.z)) this.shifts.push({ id, from, t: 0 });
    }
  }

  /** STOP/EJECT pressed: PLAY lets go and the door springs up. */
  private open(): void {
    this.eject = 0;
    this.sound?.eject();
  }

  /** Playtesting (`coco.recorder.put` in the console): this cassette in the recorder at once, the other on the table. */
  put(id: CassetteId): void {
    this.moves.length = 0;
    this.shifts.length = 0;
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
    const wasOpen = this.lid > 0;
    this.lid = clamp01(this.lid + ((move ? dt : -dt) * this.speed) / LID_TIME);
    if (wasOpen && this.lid === 0) {
      this.sound?.shut();
      if (this.deck) this.latchIn = LATCH_AFTER;
    }
    if (this.latchIn >= 0 && (this.latchIn -= dt) < 0) this.sound?.latch();
    this.eject = clamp01(this.eject + (dt * this.speed) / EJECT_TIME);
    if (move && this.lid === 1) {
      if (move.t === 0 && move.to !== 'deck') this.deck = null;
      if (move.t === 0 && move.to === 'deck') this.deck = move.id;
      move.t = clamp01(move.t + (dt * this.speed) / (move.to === 'pile' ? MOVE_TIME * FAR_TIME : MOVE_TIME));
      if (move.t === 1) {
        this.moves.shift();
        if (typeof move.to === 'number') this.spots[move.id] = move.to;
        else {
          this.sound?.drop();
          if (move.id === 'march') this.set('tape-inserted');
        }
        this.save();
      }
    }
    for (const m of this.shifts) m.t = clamp01(m.t + (dt * this.speed) / SHIFT_TIME);
    for (let i = this.shifts.length - 1; i >= 0; i--) if (this.shifts[i].t === 1) this.shifts.splice(i, 1);
    this.bind();
    this.sound?.motor(this.interp.deck.running, this.interp.deck.winding);
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

  /**
   * Where a cassette is now: seated, on its spot, or on the way between: lifted and carried over the well, tipping as
   * it goes, its top lowered in first, then its tape edge pushed down (going out is the same backwards).
   */
  pose(id: CassetteId): Pose | null {
    if (!this.available(id)) return null;
    const shift = this.shifts.find((m) => m.id === id);
    if (shift) return across(shift.from, this.lying(id), smooth(shift.t));
    const move = this.moves.find((m) => m.id === id && m.t > 0);
    if (!move && this.deck === id) return seatPose();
    if (!move) {
      const p = this.lying(id);
      return this.lift > 0 && this.wanted() === id ? { ...p, y: p.y + this.lift } : p;
    }
    const spot = move.to === 'deck' ? this.lying(id) : move.to === 'pile' ? (this.piled(id) ?? spotPose(this.spots[id])) : spotPose(move.to);
    const seat = seatPose();
    const u = move.to === 'deck' ? move.t : 1 - move.t;
    // The top edge's place when seated: the cassette turns about it as its tape edge goes down.
    const e = topEdge(seat.yaw, 0);
    const edge = [seat.x + e[0], seat.y + e[1], seat.z + e[2]];
    const at = (tilt: number, up: number, ahead: number): Pose => {
      const o = topEdge(seat.yaw, tilt);
      const [bx, bz] = [ahead * Math.sin(seat.yaw), ahead * Math.cos(seat.yaw)];
      return { x: edge[0] + bx - o[0], y: edge[1] + up - o[1], z: edge[2] + bz - o[2], yaw: seat.yaw, tilt };
    };
    if (u >= DOWN) return at(TIP * (1 - smooth((u - DOWN) / (1 - DOWN))), 0, 0);
    if (u >= OVER) {
      const d = smooth((u - OVER) / (DOWN - OVER));
      return at(TIP, HOVER * (1 - d), AHEAD * (1 - d));
    }
    // Lifted off the table first, then carried across, tipping on the way: from the pile, in front of the set and over the machine.
    const over = at(TIP, HOVER, AHEAD);
    if (move.to === 'pile') return across(spot, over, smooth(u / OVER));
    const along = smooth(u / OVER);
    const mix = (a: number, b: number) => a + (b - a) * along;
    const y = spot.y + (over.y - spot.y) * smooth(clamp01(u / (0.55 * OVER)));
    return { x: mix(spot.x, over.x), y, z: mix(spot.z, over.z), yaw: mix(spot.yaw, over.yaw), tilt: mix(0, TIP) };
  }

  /** Where a cassette lies out of the recorder: by it if its issue is on the table, else on the pile (the issues changing places, it is there at once, or carried there: `shift`). */
  private lying(id: CassetteId): Pose {
    return (id !== this.current() && this.piled(id)) || spotPose(this.spots[id]);
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

  /** What lies where for a click: each cassette's pose (null when not there), whether it lies by the recorder to be put in (`out`) or on the pile. */
  cassettes(): { id: CassetteId; pose: Pose; out: boolean; piled: boolean }[] {
    return CASSETTES.flatMap((id) => {
      const pose = this.pose(id);
      const lying = this.deck !== id && !this.moving(id);
      const piled = lying && id !== this.current() && !!this.piled(id);
      return pose ? [{ id, pose, out: lying && !piled, piled }] : [];
    });
  }
}
