import { MAX_PAGES } from './issue';
import { PAGE_H, PAGE_W } from './paper';

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

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.tex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, this.levels, gl.RGBA8, PAGE_W, PAGE_H, MAX_PAGES);
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

  /** Bare paper in every layer, every level: what shows of a page not painted yet (not black, nor another issue's page). */
  blank(): void {
    const gl = this.gl;
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
