import { MAX_PAGES } from './issue';
import { PAGE_H, PAGE_W } from './paper';

/** The two layers past the issue's pages: the pages in view of an issue going back to the pile while the next is painted (`copy`). */
export const SPARE = MAX_PAGES;

/** `PAPER` (#f7f5ee), the stock a page is painted on. */
const PAPER_RGBA = [0xf7 / 255, 0xf5 / 255, 0xee / 255, 1];

/**
 * The pages on the GPU: a mipmapped texture array, one page a layer. A page goes in through a texture of its own,
 * mipmapped there and copied into its layer level by level: `generateMipmap` on the array would rebuild every layer's.
 */
export class PageTextures {
  readonly tex: WebGLTexture;
  private readonly stage: WebGLTexture;
  private readonly stageFb: WebGLFramebuffer;
  private readonly levels = Math.floor(Math.log2(Math.max(PAGE_W, PAGE_H))) + 1;
  /** Bumped whenever any layer's pixels change: a picture drawn from them before is out of date. */
  version = 0;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, this.levels, gl.RGBA8, PAGE_W, PAGE_H, SPARE + 2);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    if (aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);
    this.stage = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.stage);
    gl.texStorage2D(gl.TEXTURE_2D, this.levels, gl.RGBA8, PAGE_W, PAGE_H);
    this.stageFb = gl.createFramebuffer()!;
  }

  /** Put a painted page (`PAGE_W`×`PAGE_H`: a canvas, or the worker's ImageBitmap) into layer `layer`. */
  upload(layer: number, page: HTMLCanvasElement | ImageBitmap): void {
    const gl = this.gl;
    this.version++;
    gl.bindTexture(gl.TEXTURE_2D, this.stage);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, PAGE_W, PAGE_H, gl.RGBA, gl.UNSIGNED_BYTE, page);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.stageFb);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex);
    for (let l = 0; l < this.levels; l++) {
      gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.stage, l);
      gl.copyTexSubImage3D(gl.TEXTURE_2D_ARRAY, l, 0, 0, layer, 0, 0, Math.max(1, PAGE_W >> l), Math.max(1, PAGE_H >> l));
    }
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
  }

  /** Layer `from` copied into layer `to`, every level (the spare layers keep an issue's pages while its own layers are painted over). */
  copy(from: number, to: number): void {
    const gl = this.gl;
    this.version++;
    const scissor = gl.isEnabled(gl.SCISSOR_TEST);
    gl.disable(gl.SCISSOR_TEST);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fb);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex);
    for (let l = 0; l < this.levels; l++) {
      gl.framebufferTextureLayer(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.tex, l, from);
      gl.copyTexSubImage3D(gl.TEXTURE_2D_ARRAY, l, 0, 0, to, 0, 0, Math.max(1, PAGE_W >> l), Math.max(1, PAGE_H >> l));
    }
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
    if (scissor) gl.enable(gl.SCISSOR_TEST);
  }

  /** Bare paper in every page's layer (not the spares), every level: what shows of a page not painted yet (not black, nor another issue's page). */
  blank(): void {
    const gl = this.gl;
    this.version++;
    const scissor = gl.isEnabled(gl.SCISSOR_TEST);
    gl.disable(gl.SCISSOR_TEST);
    const was = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, fb);
    for (let layer = 0; layer < MAX_PAGES; layer++) {
      for (let l = 0; l < this.levels; l++) {
        gl.framebufferTextureLayer(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.tex, l, layer);
        gl.clearBufferfv(gl.COLOR, 0, PAPER_RGBA);
      }
    }
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, was);
    gl.deleteFramebuffer(fb);
    if (scissor) gl.enable(gl.SCISSOR_TEST);
  }
}
