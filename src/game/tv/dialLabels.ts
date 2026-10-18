import '@fontsource/archivo/700.css';
import { CH_FIRST, CH_LAST, LABEL_CELLS, LABEL_H, LABEL_W } from './cabinetShader';

const LABEL_COUNT = CH_LAST - CH_FIRST + 1;
const FONT = '700 34px Archivo';
/** ON / OFF by the power rocker: smaller, as a set's silkscreen words were beside its figures. */
const WORD_FONT = '700 22px Archivo';

/**
 * The channel numbers printed round the selector, then ON and OFF for the power rocker and V-HOLD, in the bold
 * grotesque of a 1980s set's silkscreen: one strip, a label per cell, white on clear (the shader tints it). Calls
 * `ready` with the pixels once the face has loaded.
 */
export function drawDialLabels(ready: (rgba: Uint8Array, w: number, h: number) => void): void {
  const draw = (): void => {
    const c = document.createElement('canvas');
    c.width = LABEL_W * LABEL_CELLS;
    c.height = LABEL_H;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fff';
    g.font = FONT;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let i = 0; i < LABEL_COUNT; i++) g.fillText(String(CH_FIRST + i), (i + 0.5) * LABEL_W, LABEL_H / 2 + 1);
    g.font = WORD_FONT;
    g.textAlign = 'left';
    ['ON', 'OFF'].forEach((w, i) => g.fillText(w, (LABEL_COUNT + i) * LABEL_W + 4, LABEL_H / 2 + 1));
    g.fillText('V-HOLD', (LABEL_COUNT + 2) * LABEL_W + 4, LABEL_H / 2 + 1); // across the last two cells
    ready(new Uint8Array(g.getImageData(0, 0, c.width, c.height).data.buffer), c.width, c.height);
  };
  Promise.all([document.fonts.load(FONT, '0123456789'), document.fonts.load(WORD_FONT, 'ONFVHLD-')]).then(draw, draw);
}
