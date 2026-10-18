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

/** The faces the pages use, as `FontFaceSet.load` names them. */
export const FACES = [
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

/** One of the document's `@font-face` rules, as a worker can make the face again: its URLs made absolute. */
export interface FaceRule {
  family: string;
  src: string;
  descriptors: FontFaceDescriptors;
}

/** The document's `@font-face` rules (fontsource's, from the CSS imported above), for the page painter's worker. */
export function faceRules(): FaceRule[] {
  const out: FaceRule[] = [];
  for (const sheet of document.styleSheets) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // another origin's sheet
    }
    const base = sheet.href ?? document.baseURI;
    for (const rule of rules) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const st = rule.style;
      const get = (p: string) => st.getPropertyValue(p).trim() || undefined;
      const src = st.getPropertyValue('src').replace(/url\(\s*(['"]?)(.*?)\1\s*\)/g, (_, _q, u: string) => `url("${new URL(u, base).href}")`);
      const descriptors: FontFaceDescriptors = { style: get('font-style'), weight: get('font-weight'), stretch: get('font-stretch'), unicodeRange: get('unicode-range'), display: get('font-display') as FontDisplay | undefined };
      for (const k of Object.keys(descriptors) as (keyof FontFaceDescriptors)[]) if (descriptors[k] === undefined) delete descriptors[k];
      out.push({ family: (get('font-family') ?? '').replace(/^(['"])(.*)\1$/, '$2'), src, descriptors });
    }
  }
  return out;
}
