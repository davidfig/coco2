import '@fontsource/archivo/400.css';
import '@fontsource/archivo/400-italic.css';
import '@fontsource/archivo/700.css';
import '@fontsource/archivo/700-italic.css';
import '@fontsource/archivo-black/400.css';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/400-italic.css';
import '@fontsource/source-serif-4/700.css';
import '@fontsource/source-serif-4/700-italic.css';
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import '@fontsource/kaushan-script/400.css';
import '@fontsource/caveat/400.css';

const FACES = [
  '400 16px Archivo',
  'italic 400 16px Archivo',
  '700 16px Archivo',
  'italic 700 16px Archivo',
  '400 16px "Archivo Black"',
  '400 16px "Source Serif 4"',
  'italic 400 16px "Source Serif 4"',
  '700 16px "Source Serif 4"',
  'italic 700 16px "Source Serif 4"',
  '400 16px "Courier Prime"',
  '700 16px "Courier Prime"',
  '400 16px "Kaushan Script"',
  '400 16px Caveat',
];

/** Start the magazine's typefaces loading; resolves when every face is ready (pages are redrawn then). */
export function loadFonts(): Promise<void> {
  return Promise.all(FACES.map((f) => document.fonts.load(f, 'AaBb1'))).then(
    () => undefined,
    () => undefined,
  );
}
