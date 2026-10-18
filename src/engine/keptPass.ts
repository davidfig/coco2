import { FULLSCREEN_VERT, type Program, linkProgram, scissor } from './gpu';

const BLIT_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uTex;
out vec4 outColor;
void main() { outColor = texelFetch(uTex, ivec2(gl_FragCoord.xy), 0); }`;

/**
 * A full-screen pass whose picture changes only with what it is given (the magazine, lying still while the set and the
 * notes move round it): drawn into a kept window-sized texture and run again only when `key` changes; otherwise the kept
 * picture is laid over the window. The pass's output must be premultiplied (it is laid on with ONE, ONE_MINUS_SRC_ALPHA).
 */
export class KeptPass {
  private readonly blit: Program;
  private readonly tex: WebGLTexture;
  private readonly fb: WebGLFramebuffer;
  private w = 0;
  private h = 0;
  private key: number[] = [];

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.blit = linkProgram(gl, FULLSCREEN_VERT, BLIT_FRAG);
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    this.fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** Forget what was kept: the next `draw` runs the pass. */
  invalidate(): void {
    this.key = [];
  }

  /**
   * Lay the pass's picture over the window within `clip` (pixels: x0, y0, x1, y1), running `pass` into the kept texture
   * first if `key` changed. `pass` draws its full-screen triangle with whatever program, uniforms and blending it needs;
   * it finds the scissor set to `clip` and the target cleared. Leaves blending and the scissor test off.
   */
  draw(key: readonly number[], clip: readonly [number, number, number, number], pass: () => void): void {
    const gl = this.gl;
    const [W, H] = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    if (this.w !== W || this.h !== H) {
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      [this.w, this.h] = [W, H];
      this.key = [];
    }
    if (!scissor(gl, ...clip)) return;
    if (key.length !== this.key.length || key.some((v, i) => v !== this.key[i])) {
      this.key = [...key];
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      pass();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      scissor(gl, ...clip);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.blit.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(this.blit.u.uTex, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
  }
}
