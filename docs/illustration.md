# Illustration style

How the RAINBOW's pictures should look: covers (one per issue, see [issues.md](issues.md)), the painted ads, and any
art inside the pages. The first cover (`magazine/cover.ts`, `coverArt.ts`, `coverDetail.ts`, `coverPaint.ts`) is
the reference.

## The rule

**A skilled 1980s illustrator, by hand.** Covers and painted ads of the time were airbrush and gouache on board,
photographed and printed. The artists were good: lines are true, curves are clean, shapes are drawn with rulers,
french curves and cut masking film. What they didn't have was illustration software. So the picture should never
look like vectors: no perfectly even gradient, no flat fill with nothing in it, no shape without light on it.

Don't make it look amateur either. Wobbly outlines read as bad drawing, not as hand-made. (The cover tried a 1–3 px
edge wobble and it made the TV look drunk; it's now a fraction of a pixel over long runs, barely there.)

## What makes it read as painted

In the order that matters most:

1. **Modelling by hand.** Every object gets light and shade from the scene's light source, painted in: a lit face and a
   shadow side, a highlight streak along a top edge, shade pooling underneath, rim light where something is backlit.
   Decide where the light is (on the cover it is the moon, `MOON_X` in `coverDetail.ts`) and turn every lit face
   toward it.
2. **Material.** Wood has grain (long, slightly curving dark strokes), knobs are round (a highlight up-left, a crescent
   of shadow down-right), rock has crevices brushed down the shadow side.
3. **Airbrushed softness where it was sprayed.** Glows, lit faces and mist have no hard edge. Paint them on a
   1/8-scale canvas and scale them up (see `modelRidge`); don't use `ctx.filter = 'blur()'`, which cost over a second.
4. **Hard edges where a mask was cut.** Silhouettes, cabinet outlines and windows stay crisp.
5. **Natural forms are irregular, made things are not.** Ridges use `roughLine` (small, seeded jitter along each
   segment); a TV, a keyboard or a castle wall stays straight.
6. **The paint pass** (`paintify`, below) last, over the whole picture.

**No stamps.** Anything that appears more than once (stars, sparkles, windows, trees, rivets) was painted one at a time,
so no two match. Give the drawing function a seed and vary proportions, tilt, ray lengths and glow (see `sparkle` in
`cover.ts`: uneven rays that curve in to a tip, the vertical pair longest, diagonal rays only sometimes). Background
stars are round dabs of every size and strength, never square pixels.

## The paint pass

`paintify(ctx)` in `coverPaint.ts` goes over the finished art (all of the page, or one `area` of it) before any type is set:

- **Uneven spray:** broad brightness blotches of about ±6%, plus finer ones.
- **Grain:** per-pixel airbrush noise, ±6 levels.
- **Brushwork:** about 14,000 short, tapering strokes in the colour already under them, a shade lighter or darker,
  following a slowly turning flow field. A stroke that would cross a hard edge (a colour jump) is skipped, so outlines
  stay clean.
- **Spatter:** a few hundred light and dark flecks.
- **Print:** the red plate shifted half a pixel and the blue a third, a press slightly out of register. Keep it under
  a pixel; at one pixel it fringes visibly.
- **Edge drift:** the barely-there wobble described above (amplitude 1.2 px, 60 px wavelength). Don't raise it.

All of it is seeded (`rng`), so the page looks the same every time it is drawn. It costs about 200 ms for a full page,
once, when the page is first drawn.

## Type stays sharp

Mastheads, cover lines, starbursts, barcodes and captions were set and stripped in after the painting was shot, so
they go on **after** `paintify` and stay crisp. The rainbow arc on the cover counts as type.

## Pixel art inside a painting

Computer subjects (an invader, a dragon sprite, a screen of text) are painted *of* pixel art: draw the sprite square,
then let the paint pass soften and grain it like everything else. A TV screen's text is part of the painting, not
set type.

## Doing the next one

- Build the scene as functions of plain shapes (like `coverArt.ts`), add modelling as separate helpers (like
  `coverDetail.ts`) so the scene file stays readable and under the size limit, then `paintify`, then the type.
- `paintify(ctx, area?, printOnly?)` takes a rectangle, so an illustration inside a page (a spot illustration, a
  painted ad among body type) is painted and the paper and type around it are left alone. Brushwork and spatter scale
  with the area. The painted ads do this: `adsGobbler.ts`, `adsLemonade.ts` and `adsDustCover.ts` build each picture
  (scene plus modelling, light chosen per picture), `adsDetail.ts` holds the shared painting helpers (`airbrush` for
  sprayed softness at any scale, `roundShade`, `glint`, `rimLight`, `cloud`, `grass`, `planks`), and `adsColor.ts`
  frames them, paints each one, then sets the type. Logos over a painting get a dark drop shadow so they read over a
  bright sky.
- `printOnly` keeps just the press (uneven ink, grain, misregistration) with no edge drift, brushwork or spatter: the
  inside front cover's printed sky round its paintings, and the spot-colour inside back cover.
- Inside pages printed on newsprint were coarser than the glossy cover: more grain, a little more misregistration,
  duller colour. Spot-colour ads (one or two inks) get the print effects but no brushwork.
- Check at 2× zoom (the book zooms) and at whole-page size. Brushwork should be visible up close and invisible as
  marks from a distance.
