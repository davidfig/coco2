import { FULLSCREEN_VERT, type KeptPass, type Program, linkProgram } from '../../engine';
import type { DeskSpot } from '../computer/layout';
import { behindSet, camBounds, onTable, setCam } from './bookCam';
import { BOOK_FRAG } from './bookShader';
import { type Flip, PAGE_UNIT_H, type View, bookBounds, smooth } from './bookLayout';
import type { PageTextures } from './pageTextures';
import { PAGE_W } from './paper';

/**
 * Where the put-away book lies (main.ts): how far it has gone onto the table (0..1) and its spot there, the set's
 * picture (which places the room's camera), and, flown to or from the pile: how high over the table, how square on it is
 * seen (`deskCam`'s `face`), its light against lying on the table (`shade`), how much of it shows (`fade`), and whether
 * the set can be in front of it (`behind`).
 */
export interface Lying {
  t: number;
  spot?: DeskSpot;
  picture: readonly number[];
  lift?: number;
  face?: number;
  shade?: number;
  fade?: number;
  behind?: boolean;
}

/** One drawing of the book (`BookPass.draw`). */
export interface Shot {
  v: View;
  out: View;
  desk: Lying;
  open: number;
  flip: Flip | null;
  bend: number;
  layers: readonly number[];
  count: number;
}

/**
 * The book's GPU pass (`bookShader.ts`): the magazine on the table, held up or open, drawn as `Magazine` says; once
 * for the issue on the table, and again for one going back to the pile while the next comes from it.
 */
export class BookPass {
  private readonly program: Program;
  private readonly vao: WebGLVertexArrayObject;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly pages: PageTextures,
  ) {
    this.program = linkProgram(gl, FULLSCREEN_VERT, BOOK_FRAG);
    this.vao = gl.createVertexArray()!;
  }

  /**
   * Draw the book as view `v` has it (`out` all the way out, `open` of the way there, eased), lying as `desk` says when
   * put away, with leaf `flip` turning, pages `layers` (left, right, leaf front, leaf back) of its `count` in view, into
   * `kept`; the view as drawn (laid on the table).
   */
  draw(kept: KeptPass, { v: v0, out, desk, open, flip: f, bend, layers, count }: Shot): View {
    const gl = this.gl;
    const { view: v, cam, light, desk: lying, spread } = onTable(v0, out, desk.spot ? desk.t : 0, open, desk.spot!, desk.picture, desk.lift, desk.face);
    if (v.clip[0] >= v.W || v.clip[1] >= v.H || v.clip[2] <= 0 || v.clip[3] <= 0) return v;
    const [L, R, F, B] = layers;
    // Held over the table (`lift`, world units: a book unit is the spot's width), its shadow falls that far under it.
    const drop = desk.spot && desk.lift ? (lying * desk.lift) / (2 * desk.spot.hw) : 0;
    const bounds = v.cam ? camBounds(cam, v, !!f, drop) : bookBounds(v, !!f);
    const angle = f ? Math.PI * (f.dir > 0 ? smooth(f.t) : 1 - smooth(f.t)) : 0;
    // Only lying there: lifted toward the eye (opened from the pile) the plane no longer holds, and it is in front of the set anyway.
    const set = desk.behind && desk.spot && lying > 0.95 ? behindSet(desk.spot, desk.picture, v.win) : { rect: [1, 1, 0, 0], plane: [0, 0, 0, 1] };
    const fade = desk.fade ?? 1;
    // The pile's shade only while it lies there: opened from it, it comes into the lamp's light.
    const lit = light * (1 + ((desk.shade ?? 1) - 1) * lying);
    const vals = { res: [v.W, v.H], clip: v.clip, theta: angle, flipOn: f ? 1 : 0, bend, fold: open, layers: [L, R, F, B], ext: v.ext, win: v.win, see: v.see };
    // The book lies still more often than not while the rest moves: its picture is kept, and marched again only when
    // something it shows changes (the view, the leaf, a page painted).
    const key = [...Object.values(vals).flat(), ...cam.o, ...cam.m, cam.scale, cam.focal, lit, lying, spread, ...bounds, count, this.pages.version, fade, drop, ...set.rect, ...set.plane];
    gl.bindVertexArray(this.vao);
    kept.draw(key, bounds, () => {
      gl.useProgram(this.program.prog);
      const u = this.program.u;
      gl.uniform2f(u.uRes, v.W, v.H);
      gl.uniform4f(u.uClip, ...v.clip);
      setCam(gl, u, cam, lit);
      gl.uniform1f(u.uH, PAGE_UNIT_H);
      gl.uniform1f(u.uTheta, angle);
      gl.uniform1f(u.uFlipOn, vals.flipOn);
      gl.uniform1f(u.uBend, bend);
      gl.uniform1f(u.uFold, vals.fold);
      [u.uL, u.uR, u.uF, u.uB].forEach((loc, i) => gl.uniform1f(loc, vals.layers[i]));
      gl.uniform4f(u.uExt, ...v.ext);
      gl.uniform2f(u.uWin, ...v.win);
      gl.uniform2f(u.uSee, ...v.see);
      for (const [loc, x] of [[u.uDesk, lying], [u.uSpread, spread], [u.uTexW, PAGE_W], [u.uLastPage, count - 1], [u.uFade, fade], [u.uDrop, drop]] as const) gl.uniform1f(loc, x);
      gl.uniform4fv(u.uSetRect, set.rect);
      gl.uniform4fv(u.uSetPlane, set.plane);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.pages.tex);
      gl.uniform1i(u.uPages, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.activeTexture(gl.TEXTURE0);
    });
    return v;
  }
}
