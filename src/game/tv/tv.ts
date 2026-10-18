import { FULLSCREEN_VERT, Program, Sound, createTexture, linkProgram, uploadTexture } from '../../engine';
import { COLS, HEIGHT, ROWS, Vdg, WIDTH } from '../vdg/vdg';
import { TUBE, TUBE_C } from './cabinetShader';
import { drawDialLabels } from './dialLabels';
import { GRIME_H, GRIME_W, Grime } from './grime';
import { Knobs } from './knobs';
import { Touch } from './touch';
import { Tuning } from './tuning';
import { readTvSettings } from './tvSave';
import { TvSound } from './tvSound';
import { ACTIVE, TAMPER_STYLES, TV_FRAG, TamperStyle } from './tvShader';

const FULL = { x: 0, y: 0, w: 1, h: 1 };

/** Something held in front of the set (the notebook page) and the shadow it casts, in pixels with a bottom-left origin. */
export interface Shade {
  cx: number;
  cy: number;
  hx: number;
  hy: number;
  rot: number;
  /** Where the shadow falls, in the page's own (rotated) axes. */
  ox: number;
  oy: number;
  soft: number;
  /** How much of the room's light it keeps off, 0..1. */
  k: number;
}

/** The colour smear there always is over RF, before any mistuning adds to it. */
const FRINGE = 0.35;

/**
 * The television: takes the VDG's image and draws the whole set around it with `TV_FRAG`. Knows when it was switched
 * on (for the warm-up) and where the pointer is (the reflections drift with it, as if you moved your head). Its parts:
 * the knobs, the tuner they set (`tuning`), the hand's other doings (`touch`), what's on the glass (`grime`), its sound.
 */
export class Tv {
  private readonly program: Program;
  private readonly texture: WebGLTexture;
  /** The channel numbers round the selector; blank until the typeface loads. */
  private dial: WebGLTexture;
  /** The VDG image of what tampered cells held before, and when each cell was tampered with. */
  private readonly ghost: WebGLTexture;
  private readonly tamperTex: WebGLTexture;
  /** The clock `showTampered`'s times are on (`Tamper.clock`). */
  tamperClock = 0;
  /** How a tampered cell shows (`?tamper=ghost|scan|both`), and how strongly (0..1). */
  tamperStyle: TamperStyle = 'ghost';
  tamperStrength = 1;
  private readonly vao: WebGLVertexArrayObject;
  /** Seconds since switched on; negative while off. */
  powerTime = -1;
  /** Seconds since switched off (the picture collapsing to a dot); negative if it hasn't been. */
  private offTime = -1;
  private look = { x: 0, y: 0 };
  private lookTarget = { x: 0, y: 0 };
  /** The picture's average colour (0..1), before the warm-up. */
  private average = [0, 0, 0];
  /** The light the lit screen throws on things in front of it (0..1 RGB): its average colour, once warmed up. */
  readonly glow = [0, 0, 0];
  /** Where the lit picture is, in pixels with a bottom-left origin: centre x, y, half width, half height (curve ignored). */
  readonly picture = [0, 0, 0, 0];
  /** The channel selector and the fine-tuning ring, the volume, the vertical hold: something to fiddle with. */
  readonly knobs: Knobs;
  readonly tuning: Tuning;
  readonly touch: Touch;
  readonly grime = new Grime();
  readonly sound: TvSound;
  private readonly grimeTex: WebGLTexture;
  /** A far station's picture (`broadcast`). */
  private readonly stationTex: WebGLTexture;
  /** The last draw's panel mapping: the set's centre in buffer pixels, buffer pixels per shader unit, and its rectangle. */
  private readonly view = { x: 0, y: 0, k: 1, x0: 0, y0: 0, x1: 0, y1: 0 };

  constructor(private readonly gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, sound: Sound) {
    this.program = linkProgram(gl, FULLSCREEN_VERT, TV_FRAG);
    this.texture = createTexture(gl, WIDTH, HEIGHT);
    this.ghost = createTexture(gl, WIDTH, HEIGHT);
    this.tamperTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tamperTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, COLS, ROWS, 0, gl.RED, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    this.vao = gl.createVertexArray()!;
    this.dial = createTexture(gl, 1, 1);
    drawDialLabels((rgba, w, h) => {
      this.dial = createTexture(gl, w, h);
      uploadTexture(gl, this.dial, w, h, rgba);
    });
    this.stationTex = createTexture(gl, WIDTH, HEIGHT);
    this.grimeTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.grimeTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, GRIME_W, GRIME_H, 0, gl.RG, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.sound = new TvSound(sound);
    const play = this.sound.play.bind(this.sound);
    // The knobs listen first: a turn is theirs before the touch code could take it for a smack.
    this.knobs = new Knobs(canvas, this, () => this.powerTime >= 0, readTvSettings());
    this.knobs.onEvent = play;
    this.tuning = new Tuning(this.knobs);
    const power = { isOn: () => this.powerTime >= 0, toggle: () => (this.powerTime >= 0 ? this.switchOff() : this.switchOn()) };
    this.touch = new Touch(canvas, this, power, this.grime, () => this.tuning.smack(), play);
    canvas.addEventListener('pointermove', (e) => {
      this.lookTarget.x = (e.clientX / canvas.clientWidth) * 2 - 1;
      this.lookTarget.y = 1 - (e.clientY / canvas.clientHeight) * 2;
    });
  }

  switchOn(warm = true): void {
    this.powerTime = warm ? 0 : 10;
    this.offTime = -1;
    if (!warm) return;
    this.sound.play('degauss');
    this.sound.play('crackle', 0.6); // the glass charging up
  }

  /** The CoCo runs on; only the set goes dark. */
  switchOff(): void {
    this.powerTime = -1;
    this.offTime = 0;
    this.sound.play('crackle', 0.3);
  }

  /**
   * Put a far-off station's picture on a dead channel (the story's, never the CoCo's 3): it comes through weak, grey
   * and ghosted, at best `strength` (0..1), when the selector's on `channel`. `null` takes it off the air.
   */
  broadcast(channel: number, vdg: Vdg | null, strength = 0.5): void {
    if (!vdg) {
      this.tuning.station = null;
      return;
    }
    uploadTexture(this.gl, this.stationTex, WIDTH, HEIGHT, vdg.pixels);
    this.tuning.station = { channel, strength };
  }

  /** A point in buffer pixels (bottom-left origin) in the shader's panel units, as the last frame drew it. */
  toPanel(x: number, y: number): [number, number] {
    const v = this.view;
    return [(x - v.x) / v.k + TUBE_C[0], (y - v.y) / v.k + TUBE_C[1]];
  }

  /** Whether a point in buffer pixels is in the TV's part of the window (not under the magazine). */
  covers(x: number, y: number): boolean {
    const v = this.view;
    return x >= v.x0 && x <= v.x1 && y >= v.y0 && y <= v.y1;
  }

  /** Send a new VDG frame to the tube. */
  show(vdg: Vdg): void {
    uploadTexture(this.gl, this.texture, WIDTH, HEIGHT, vdg.pixels);
    // Every fourth dot each way is plenty for an average.
    const sum = [0, 0, 0];
    let n = 0;
    for (let y = 0; y < HEIGHT; y += 4) {
      for (let x = 0; x < WIDTH; x += 4) {
        const i = (y * WIDTH + x) * 4;
        sum[0] += vdg.pixels[i];
        sum[1] += vdg.pixels[i + 1];
        sum[2] += vdg.pixels[i + 2];
        n++;
      }
    }
    for (let c = 0; c < 3; c++) this.average[c] = sum[c] / (n * 255);
  }

  /** Send which cells were tampered with (`Tamper.at`) and the VDG image of what they held before. */
  showTampered(at: Float32Array, ghost: Vdg): void {
    const gl = this.gl;
    uploadTexture(gl, this.ghost, WIDTH, HEIGHT, ghost.pixels);
    gl.bindTexture(gl.TEXTURE_2D, this.tamperTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, COLS, ROWS, gl.RED, gl.FLOAT, at);
  }

  /** `rect` is where the picture goes, in window fractions (bottom-left origin); `frame` how much border round it. */
  draw(dt: number, time: number, border: readonly number[], rect = FULL, frame = 0.08, shade?: Shade): void {
    const gl = this.gl;
    if (this.powerTime >= 0) this.powerTime += dt;
    if (this.offTime >= 0) this.offTime += dt;
    // As the shader's spill: the picture comes up over the first second and a half.
    const t = Math.min(1, Math.max(0, (this.powerTime - 0.3) / 1.2));
    const warm = this.powerTime < 0 ? 0 : t * t * (3 - 2 * t);
    this.knobs.update(dt);
    this.tuning.update(dt);
    this.touch.update(dt);
    this.grime.update(dt, this.powerTime >= 0);
    // Off the CoCo's channel the light thrown is the snow's grey.
    const signal = this.tuning.signal();
    const station = this.tuning.stationSignal();
    const detune = this.tuning.detune();
    const clear = Math.max(signal, station);
    for (let c = 0; c < 3; c++) this.glow[c] = (this.average[c] * signal + 0.15 * station + 0.4 * (1 - clear)) * warm;
    this.sound.update({
      on: this.powerTime >= 0,
      warm,
      volume: this.knobs.volume,
      snow: 1 - clear,
      buzz: Math.max(clear * Math.min(1, Math.max(0, (detune - 0.15) / 0.5)), Math.min(1, Math.abs(this.tuning.rollSpeed))),
    });
    const ease = 1 - Math.exp(-dt * 4);
    this.look.x += (this.lookTarget.x - this.look.x) * ease;
    this.look.y += (this.lookTarget.y - this.look.y) * ease;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.useProgram(this.program.prog);
    const u = this.program.u;
    gl.uniform2f(u.uRes, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uPower, this.powerTime);
    gl.uniform1f(u.uOff, this.offTime);
    gl.uniform2f(u.uLook, this.look.x, this.look.y);
    const W = gl.drawingBufferWidth;
    const H = gl.drawingBufferHeight;
    gl.uniform4f(u.uTvRect, rect.x * W, rect.y * H, rect.w * W, rect.h * H);
    gl.uniform1f(u.uFrame, frame);
    // As the shader's main(): the picture is TUBE * ACTIVE, scaled to fit the rectangle with `frame` round it.
    const [px, py] = [TUBE[0] * ACTIVE[0], TUBE[1] * ACTIVE[1]];
    const scale = (0.5 * rect.h * H) / Math.max(py + frame, (px + frame) / ((rect.w * W) / (rect.h * H)));
    this.picture[0] = (rect.x + rect.w / 2) * W;
    this.picture[1] = (rect.y + rect.h / 2) * H;
    this.picture[2] = px * scale;
    this.picture[3] = py * scale;
    this.view.x = this.picture[0];
    this.view.y = this.picture[1];
    this.view.k = scale;
    this.view.x0 = rect.x * W;
    this.view.y0 = rect.y * H;
    this.view.x1 = (rect.x + rect.w) * W;
    this.view.y1 = (rect.y + rect.h) * H;
    gl.uniform2f(u.uKnobs, this.knobs.turn[0], this.knobs.turn[1]);
    gl.uniform2f(u.uMore, this.knobs.turn[2], this.knobs.turn[3]);
    gl.uniform1f(u.uRock, this.touch.rock);
    gl.uniform1f(u.uSignal, signal);
    gl.uniform1f(u.uStationSignal, station);
    gl.uniform1f(u.uDetune, detune);
    gl.uniform1f(u.uFringe, Math.min(1, FRINGE + (1 - FRINGE) * detune));
    gl.uniform1f(u.uRoll, this.tuning.roll - Math.floor(this.tuning.roll));
    gl.uniform1f(u.uSmack, this.touch.sinceSmack);
    gl.uniform1f(u.uChannel, this.knobs.channel);
    gl.uniform1f(u.uChange, this.knobs.sinceChange);
    gl.uniform3f(u.uBorder, border[0] / 255, border[1] / 255, border[2] / 255);
    gl.uniform4f(u.uShade, shade?.cx ?? 0, shade?.cy ?? 0, shade?.hx ?? 0, shade?.hy ?? 0);
    gl.uniform4f(u.uShadeArc, shade?.rot ?? 0, shade?.ox ?? 0, shade?.oy ?? 0, shade?.soft ?? 1);
    gl.uniform1f(u.uShadeK, shade?.k ?? 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(u.uScreen, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.ghost);
    gl.uniform1i(u.uGhost, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.tamperTex);
    gl.uniform1i(u.uTamper, 2);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.dial);
    gl.uniform1i(u.uDial, 3);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, this.stationTex);
    gl.uniform1i(u.uStation, 4);
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, this.grimeTex);
    if (this.grime.dirty) {
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, GRIME_W, GRIME_H, gl.RG, gl.UNSIGNED_BYTE, this.grime.data);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
      this.grime.dirty = false;
    }
    gl.uniform1i(u.uGrime, 5);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1f(u.uTamperNow, this.tamperClock);
    gl.uniform1i(u.uTamperStyle, TAMPER_STYLES.indexOf(this.tamperStyle));
    gl.uniform1f(u.uTamperK, this.tamperStrength);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
