import { type Program, scissor } from '../../engine';
import { type Quad, quadHalf, toSheet } from './onDesk';

/** What the whole pile is drawn with: held up (0..1), raised, the screen's light and where its picture is, the room's light on the paper. */
export interface PileLight {
  open: number;
  lift: number;
  glow: readonly number[];
  picture: readonly number[];
  light: number;
}

/**
 * Draw the pile from the bottom up (`sheets`, each a quad on screen with its texture), each sheet with its own
 * writing. The light from the screen behind reaches each one through the sheets already drawn (the four nearest it).
 */
export function drawPile(gl: WebGL2RenderingContext, program: Program, vao: WebGLVertexArrayObject, sheets: readonly { quad: Quad; tex: WebGLTexture }[], p: PileLight): void {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.useProgram(program.prog);
  const u = program.u;
  gl.uniform1f(u.uOpen, p.open);
  gl.uniform1f(u.uLift, p.lift);
  gl.uniform3f(u.uGlow, p.glow[0], p.glow[1], p.glow[2]);
  gl.uniform4f(u.uPicture, p.picture[0], p.picture[1], p.picture[2], p.picture[3]);
  gl.uniform1f(u.uLight, p.light);
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(u.uTex, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.bindVertexArray(vao);
  const order = sheets.map((s) => ({ ...s, m: toSheet(s.quad), half: quadHalf(s.quad) }));
  const under = new Float32Array(36);
  const halves = new Float32Array(8);
  order.forEach((s, i) => {
    const behind = order.slice(Math.max(0, i - 4), i);
    behind.forEach((b, j) => {
      under.set(b.m, j * 9);
      halves.set(b.half, j * 2);
    });
    gl.uniformMatrix3fv(u.uUnder, true, under);
    gl.uniform2fv(u.uUnderHalf, halves);
    gl.uniform1i(u.uUnderN, behind.length);
    gl.bindTexture(gl.TEXTURE_2D, s.tex);
    gl.uniformMatrix3fv(u.uToSheet, true, s.m);
    gl.uniform2f(u.uHalf, ...s.half);
    // Only the sheet's own pixels.
    const xs = s.quad.map((q) => q[0]);
    const ys = s.quad.map((q) => q[1]);
    if (scissor(gl, Math.min(...xs) - 2, Math.min(...ys) - 2, Math.max(...xs) + 2, Math.max(...ys) + 2)) gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST);
  });
  gl.disable(gl.BLEND);
}
