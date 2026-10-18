# CoCo 2 — design notes

## The idea

A text adventure that plays as if typed into a Tandy Color Computer 2 hooked up to the family TV. The frame is part
of the fiction: you switch on, the set warms up, Extended Color BASIC says hello, and the adventure runs from the OK
prompt.

## What the screen must get right

- **Boot text**, exactly: `EXTENDED COLOR BASIC 1.1` / `COPYRIGHT (C) 1982 BY TANDY` / `UNDER LICENSE FROM MICROSOFT`,
  a blank line, `OK`.
- **The MC6847 font**: 5×7 dots in an 8×12 cell, 32×16 characters, upper case only (lower case is inverse video). Its
  quirks show: a square `O` and a narrow `0`.
- **Colours**: bright green paper, dark green ink, a black border round the picture.
- **The cursor**: a solid block cycling through green, yellow, blue, red, buff, cyan, magenta, orange.

## The TV

The view is close in on the picture: it fills the window with a strip of black border round it (`FRAME`). Off-frame
is a late-70s/early-80s portable: walnut-vinyl cabinet, charcoal front, channel and volume knobs, speaker slots and a
red power lamp. The tube is 4:3 with rounded corners and a barrel curve, 192 visible scanlines (one per VDG line), a
faint slot mask, bloom and halation, a slow hum bar, flicker and a little RF snow. On the glass: a dim room
reflection, a window behind the viewer, a hot spot and a diagonal glare streak, and a highlight where the glass curves
into the bezel. The reflections drift a little with the pointer, as if you shifted your head.

Tuning knobs: `ACTIVE` (border size), scanline gain and bloom amounts in `pictureShader.ts`; colours in `vdg/palette.ts`.

### Tampering

When the story changes text on the screen, it should look like the tube is doing it, not the data. So the story never
uses `print` / `writeAt` for that: it calls `TextScreen.tamper(cell, text)`. That writes the bytes like `writeAt`, and
for every cell that actually changes it records when and what the cell held before (`coco/tamper.ts`; the marks scroll
with the text and CLS wipes them). The TV uploads those as a 32×16 float texture of times plus a second VDG image of
the old characters, and the shader disturbs only those cells, for about two seconds. BASIC's and the player's own
writes never set it off, so the effect always means "something else did this".

Styles (`TAMPER_STYLES` in `tvShader.ts`, `Tv.tamperStyle`):

- **ghost** (default, the subtle one): the old character starts at 60% under the new one and fades out over about
  half a second, like phosphor persistence.
- **scan** (louder, for later): the beam repaints the cell top to bottom over ~0.16 s with a bright leading line;
  below the beam the old character still shows.
- **both**: the re-scan, then the ghost.

After the change has settled, text the story wrote keeps a continuous effect no real CoCo could produce, for as long as it stays on screen: it ripples a fraction of a dot along each scanline, and a soft light runs along it (`tamperMark` in `pictureShader.ts`). The mark goes when BASIC writes over the cell itself (`Tamper.forget`, from `print` / `writeAt` / backspace), scrolls with the text, and is cleared by CLS, so ordinary text never inherits it. `Tv.tamperStrength` (0..1) scales the effect, so the story can start faint and turn it up as it escalates. A flare
(brighten and bloom) was tried and dropped: too in-your-face. Playtest with `?tamper=ghost|scan|both` and
`coco.tamperTest()`.

## The magazine

THE RAINBOW (Nov 1983, fictional issue), modelled on the real Color Computer monthly: cream newsprint, sans headings with a
six-stripe rainbow rule, serif body, a PRINT#-2 editorial, "Letters to RAINBOW", type-in listings in printer type with a
RAINBOW CHECK table, advertisements, running heads with the date and folio. It slides in beside the TV (which pulls back to
show the whole set), turns pages like a real book, zooms to read small print, and carries the player's journal ("what to do
next") and scratch-off hints.

## Next

- The adventure: written in this Color BASIC as a program that is loaded and RUN, or as a built-in command; to decide.
- Sound: the CoCo's 6-bit DAC beeps (`SOUND`), with `?nosound`.
- A touch keyboard for phones.
