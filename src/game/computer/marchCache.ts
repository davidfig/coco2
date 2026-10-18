import { FULLSCREEN_VERT, Program, linkProgram } from '../../engine';

const BLIT_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uScale; // the share of the window's size it was marched at
out vec4 outColor;
void main() { outColor = texture(uTex, gl_FragCoord.xy * uScale / vec2(textureSize(uTex, 0))); }`;

/**
 * A full-screen pass that is costly to run but changes only with what it is given (the computer's march): what it drew
 * is kept, window-sized and premultiplied, and drawn again only when `key` changes. At `scale` < 1 it runs on that share
 * of the window and is scaled up (while the view moves). Call `draw` with the scissor already set to where it may draw.
 */
export class MarchCache {
  private readonly blit: Program;
  private readonly tex: WebGLTexture;
  private readonly fb: WebGLFramebuffer;
  private w = 0;
  private h = 0;
  private key: number[] = [];
  private scale = 1;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.blit = linkProgram(gl, FULLSCREEN_VERT, BLIT_FRAG);
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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
   * Draw the kept picture over the window (straight-alpha output blended as SRC_ALPHA), running `pass` first if `key` or
   * `scale` changed. `pass` sets its program and uniforms (scaled by `scale`) and draws its full-screen triangle; it runs
   * into the kept texture, blended so that it comes out premultiplied. `clip` is the scissor (pixels) at full scale.
   */
  draw(key: number[], scale: number, clip: [number, number, number, number], pass: () => void): void {
    const gl = this.gl;
    const W = gl.drawingBufferWidth;
    const H = gl.drawingBufferHeight;
    if (this.w !== W || this.h !== H) {
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      [this.w, this.h] = [W, H];
      this.key = [];
    }
    key = [...key, scale];
    if (key.length !== this.key.length || key.some((v, i) => v !== this.key[i])) {
      this.key = key;
      this.scale = scale;
      const [x0, y0, x1, y1] = clip;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
      gl.viewport(0, 0, Math.ceil(W * scale), Math.ceil(H * scale));
      gl.scissor(Math.floor(x0 * scale), Math.floor(y0 * scale), Math.ceil((x1 - x0) * scale) + 2, Math.ceil((y1 - y0) * scale) + 2);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ZERO, gl.ONE, gl.ZERO);
      pass();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.scissor(Math.floor(x0), Math.floor(y0), Math.ceil(x1 - x0), Math.ceil(y1 - y0));
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.blit.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.uniform1i(this.blit.u.uTex, 0);
    gl.uniform1f(this.blit.u.uScale, this.scale);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
  }
}
