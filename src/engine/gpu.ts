export interface Program {
  prog: WebGLProgram;
  u: Record<string, WebGLUniformLocation | null>;
}

/** Compile and link a program, looking up every active uniform by name (arrays by their base name). */
export function linkProgram(gl: WebGL2RenderingContext, vert: string, frag: string): Program {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader error');
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link error');
  const u: Program['u'] = {};
  const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < n; i++) {
    const name = gl.getActiveUniform(prog, i)!.name.replace(/\[0\]$/, '');
    u[name] = gl.getUniformLocation(prog, name);
  }
  return { prog, u };
}

/** A vertex shader for one triangle that covers the whole viewport (draw with `gl.drawArrays(gl.TRIANGLES, 0, 3)`). */
export const FULLSCREEN_VERT = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/** An RGBA8 texture of `w`×`h`, mipmapped (for glow), clamped at the edges. Fill it with `uploadTexture`. */
export function createTexture(gl: WebGL2RenderingContext, w: number, h: number): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

/** Replace a `createTexture` texture's pixels (rows top first) and rebuild its mipmaps. */
export function uploadTexture(gl: WebGL2RenderingContext, tex: WebGLTexture, w: number, h: number, rgba: Uint8Array): void {
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
  gl.generateMipmap(gl.TEXTURE_2D);
}
