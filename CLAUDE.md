# CoCo 2

A text adventure played on a TRS-80 Color Computer 2, drawn in WebGL2: a close-up of a 1980s TV's picture (it fills
the window, with a strip of the tube's black border), showing the CoCo's VDG screen (MC6847 font, green paper, colour-cycling cursor) through a CRT
shader with curved glass and glare. TypeScript, Vite, no runtime dependencies. Sister project to the *-geometry games
(`../sword-geometry`, `../space-geometry`, `../astronaut-geometry`); it may never go online, but it follows their rules.

Commands: `pnpm dev` (port 5196, set in `package.json`) · `pnpm typecheck` · `pnpm check:size` · `pnpm test` · `pnpm build` ·
`pnpm walkthrough`.
Run `typecheck`, `check:size` and `test` before finishing any change. Design notes: `docs/design.md`.

**Keep the docs current, in the same change.** A change to anything the player meets (a tape, a listing, a puzzle rule,
a story timer or tampering, a note, a flag, a magazine page the story points at, a checkpoint) isn't finished until:
- `pnpm walkthrough` has been run and the `docs/walkthrough.md` diff read and committed with it (it is generated: never
  edit it by hand; if the diff shows something you didn't mean, fix the code). A new beat gets a step in
  `walkthroughRoute.ts` and a checkpoint in `checkpoints.ts`, and `pnpm test walkthrough` passes.
- `docs/flow.md` still says where each beat lives (a moved, renamed or new file or constant gets its row).
- The design docs match what is built: `flags.md` (a flag added, removed or its consequence changed), `puzzles.md`,
  `beats.md` / `issues.md` / `story.md` (a beat that now plays differently from what they say), `illustration.md`.
- This file's folder map and sections, for a new file, folder, URL flag, console hook or rule.
Say in the wrap-up which docs changed, or why none needed to.

@../server-geometry/claude/games.md

## Not like the other games

- No 3D scene and no copied geometry engine: `src/engine/` is a slim one (loop, WebGL2 context, `gpu` helpers,
  typed-key queue, `audio`: one AudioContext made on the first click or key) with the same `earlyUpdaters` / `updaters` / `lateUpdaters` shape. The fixed step is 60 Hz (the
  VDG's field rate). The game layer still imports it only through the barrel.
- Sound is all synthesized, no recordings: the TV's (`tv/tvSound.ts`) and the cassette recorder's (`recorder/recorderSound.ts`: keys, door, cassette, motor). `?nosound` turns it off; test
  tabs always use it. To check the sound graph silently, `build` a `TvSound` into an `OfflineAudioContext`.
- No online play and no dependency on `../server-geometry` (only its `claude/games.md` rules, above). If it goes
  online, add `server-geometry-client`, an entry in `../server-geometry/src/games.ts`, and copy astronaut-geometry's
  `net/roomClient.ts`.

## Tests

- `pnpm test` runs every `src/**/*.test.ts` in Node through Vite (`scripts/test.mjs`; TypeScript and `?raw` work), no page
  and no GPU; `pnpm test ADVENT` runs only the cases whose name contains "ADVENT". No framework: `test` / `expect` come
  from `src/test/check.ts`. localStorage is an empty in-memory one per run, so a CSAVE leaves nothing behind.
- `HeadlessCoco` (`coco/headless.ts`) is the machine without the page: keyboard → BASIC → screen. `type('RUN\n')` (or
  `keys([...])`, `break()`) runs until BASIC settles at OK or an INPUT (a program looping on INKEY$ runs out
  `maxSeconds` instead); `output()` / `text()` are what that typing showed, `transcript()` everything since boot (scrolled
  off and CLSed rows too), `lines()` the screen now. Test BASIC and the tapes here rather than in the Browser pane.

## Playtesting

- **The dev server is the user's.** In this checkout, use the one already running on 5196: open
  `http://localhost:5196/...` with `preview_start` `{url}`, never `{name: "dev"}` or `pnpm dev`, and never start a second
  one on another port. Only an agent working in a git worktree starts its own (another port, from that worktree), and it
  stops it (`preview_stop`, or kills it) as soon as it is done with it, before finishing.
- Read before playing: `pnpm walkthrough` plays the whole game headlessly (`debug/walkthrough.ts`, the route in
  `walkthroughRoute.ts`: BASIC, the issues' stories and puzzles, the notes) and writes `docs/walkthrough.md`, step by step: what is typed, the screen, the
  story's own writing, the flags, the notes. `docs/flow.md` maps each beat to the file that makes it. After changing a
  tape, rule, timer or note, run it again and read the diff; a new beat gets a step in its route.
- `?clear` starts over: it removes every `coco2.*` localStorage key (CSAVEs, TV knobs, magazine flags, notebook wear)
  and then drops itself from the URL (`src/clear.ts`, imported first in `main.ts`).
- `?at=<id>` starts at a checkpoint (`CHECKPOINTS` in `debug/checkpoints.ts`, each with a short `id`: `?at=thanks` is
  the end of issue 1's evening, the set to switch off next). It writes the story save (exactly that flag list, in order),
  puts its issue on the table shut and its cassette in the recorder, keeps a name if the story has asked for one by then
  (`TESTER`), forgets CSAVEs and the ORACLE reply, keeps the TV knobs and notebook wear, drops itself from the URL so a
  reload carries on, and once the CoCo has booted types the checkpoint's CLOAD plus fixes (`src/startAt.ts`). An unknown
  id lists the ids in the console. `?issue=N` is the start of issue N, the issues before it played through
  (`ISSUE_STARTS`: `?issue=2` is `?at=may`, `?issue=3` is `?at=july`). There is no debug menu: to get the player somewhere, write a URL (add a
  checkpoint if none fits). A new issue adds its start to `ISSUE_STARTS`, its day to `DAYS` (`notes/notes.ts`: each
  issue is one day, its date written in the notes as its box arrives), the flag that brings it to `ISSUE_ARRIVES`
  (`magazine/pages.ts`) and the night before it to `NIGHTS` (`story/days.ts`), its cassette's tape to `issueTape` and
  `TAPE_KEYS` (`tapes/index.ts`) and its label to `LABELS` (`recorder/print.ts`; the shader draws three cassettes,
  `uCasA`–`uCasC`). A new story flag goes in `STORY_FLAGS`, and a new
  beat gets a checkpoint. Flags, the name and wear can also be set from the console (`coco.magazine.setFlag`,
  `coco.notebook.handled`), as can the TV hooks below.
- `?touch` forces the touch keyboard (a finger-driven device gets it anyway), `?notouch` leaves it out. In the Browser
  pane, the mobile preset counts as touch but a custom size doesn't: add `?touch`. Synthetic presses on its keys are
  `pointerdown` on the key, then `pointerup` on `window`.
- The service worker runs only in a build: the `preview` entry in `.claude/launch.json` serves one (`pnpm build` first).
  It stays registered for that port after the tab closes, so unregister it and clear its cache when done.
- `?instant&nosound` is the usual test URL. `?instant` skips the room's lights coming on, the tube warm-up and the
  magazine and notes sliding in, and makes the cassette instant (CLOAD / CSAVE normally take tape time).
- The view rests on the whole desk and goes in to the set only to read the screen (`story/framing.ts`): the story tampering
  goes in, as does a click on the set itself (glass or cabinet, not a knob, the rocker or the smack), and another such click comes back out;
  10 s at OK with nothing typed, or a tape waiting for the recorder, go back. Typing never moves it (real keys only hold off the drift back). No other click moves it (a click on the
  machine's keys types from across the room). With the magazine open the same click goes between the screen close up
  (`NEAR_FRAME`, `bookLayout.ts`; above the book in a tall window) and the whole set with the machine (`SIDE_FRAME`), but only on the
  screen itself (the pointer is a zoom-in or zoom-out glass over the screen wherever a click would go in or out): a click anywhere else outside the book (the cabinet, the room) puts it away. Opening it goes in, it doesn't drift back out while open, putting it away goes back to the view it was opened from
  (the desk or the set), and only the recorder pulls back to the desk (`Framing.desk`).
  Each change of where the view is going is one glide there from where it is (`computer/glide.ts`), never the
  book's, the desk's and the close-up's easings stacked, which would move it twice. The desk and the papers going on or off the table
  take the glide's time (the book's 0.9 s as it comes out or goes away), so everything ends together. Without `?instant` (or `?book`) the page opens
  there, the magazine and notes already on the table (`Computer.startWide`). The guide's calls (the notes until held
  up, then the magazine until opened, then a cassette waiting to go in the recorder) show there as a hop (`story/hop.ts`). `?instant` starts in at the set. `keyboard.type` in the console counts as clicked
  keys (`coco.framing.wide = false` goes in, until the next drift back).
- The Browser pane's `type` action sends text as input events, not keydowns, so it doesn't reach the game. Type with
  `coco.engine.keyboard.type('LOOK\n')` ("\n" is ENTER, "\b" is ←), then `coco.engine.advance(1/60)`.
- `coco` on `window` exposes `engine`, `screen`, `basic`, `interp`, `tv`, `vdg`. A hidden pane runs ~1 fps; step with `advance`.
- To test BASIC, type a whole session at once (`keyboard.type('NEW\n10 PRINT 1\nRUN\n')`) and advance ~60 frames: keys
  after an ENTER wait until that line has run. BREAK is `coco.basic.key({ key: 'Escape', shift: false, ctrl: false })`.
- `?tamper=ghost|scan|both` (ghost is the default) picks how story-made screen changes show; `coco.tamperTest()` swaps a few letters to
  see it (`coco.tv.tamperStyle` / `tamperStrength` switch it live).
- CSAVE writes to this browser's localStorage (`coco2.tape`), so a test CSAVE leaves a file behind.
- The recorder starts empty (`coco2.recorder` keeps what is in it): `coco.recorder.click('march')` puts the cassette in
  (`'recorder'` takes it out), `coco.recorder.put('may')` at once; the checkpoints put the right one in. Its door and the
  carry run on `recorder.step`, so a hidden pane needs `advance` frames to finish them.
- The set starts as it was left (`coco2.tv`: channel, volume, fine tuning, vertical hold, power, saved once the knobs
  come to rest); a test that turns a knob or switches off leaves it that way. `localStorage.removeItem('coco2.tv')`
  gives channel 3, on.
- The set's story hooks, to try from the console: `coco.tv.tuning.drift(0.6)` (off tune), `.upsetHold(1.2)` (the
  picture rolls), `.loosen(0.6)` (it cuts out); `coco.tv.flinch()` (the picture starts to collapse and opens again, SHUTDOWN's first win); `coco.stationTest(9)` puts a far station on 9 (`tv.broadcast`).
- Synthetic pointer events on the canvas need `canvas.setPointerCapture = () => {}` first (it throws for a pointer the
  browser never saw), or a knob drag silently does nothing.
- Pulled back to the whole desk, the view widens to take in the table where the magazine and the
  notes lie (either side of the machine, or both to its right in a narrower window: `DESK_LAYOUTS` in
  `computer/layout.ts`), so long as the set keeps 60% of its size; otherwise they stay where they are (`Computer.table`).
  Each that lies there gives the desk view back the window edge it keeps put away, and a wide window crops the table's
  front edge to come in closer (`deskTable.ts`: only the set, the machine and the papers, as drawn square on, must show;
  spare width goes to the right, where the magazine's facing page fills it or runs off the side).
- The notebook page wears with each time it is held up and put down (`coco2.notebook`): `coco.notebook.handled = 60`
  shows an old page (a coffee ring at 7, a fold at 12, dog-ear 18; it never loses marks), `= 0` a clean one.

## Folder map

```
src/test/check.ts     the test kit (test, expect, run); test files sit beside their code as *.test.ts
src/main.ts           wires keyboard → BASIC → screen → VDG → TV, ?instant
src/engine/           engine (loop, canvas size), keyboard (typed-key queue), gpu (programs, full-screen triangle, textures),
                      keptPass (a pass's picture kept, drawn again only when its inputs change)
src/game/
  debug/              playtesting only: checkpoints (story flags in order, the `?at=` jump points; `src/startAt.ts` starts at one),
                      walkthrough + walkthroughRoute (the whole game played headlessly, `pnpm walkthrough`)
  vdg/                the MC6847: charset (the 64-glyph ROM, ASCII → screen byte), palette, vdg (512 bytes → 256×192 RGBA)
  coco/               screen (video memory at $0400, print/scroll, the blinking cursor), blocks (SET/RESET/POINT dots),
                      basic (boot message; the keyboard side: line editor, INPUT replies, INKEY$ keys, BREAK),
                      headless (the machine with no page, for `pnpm test`)
  basic/              the Color BASIC language:
                        tokens (crunching keywords, Cursor), values (errors, number formatting), vars (2-letter names, arrays),
                        expr (precedence), functions (ABS…TIMER), program (numbered lines, DATA), tape (the cassette's
                        files and position), tapeDeck (S / F NAME, tape timing), interpreter (run state, stepping, INPUT, BREAK/CONT), statements = flow + io + store + commands
  handwriting/        the pens, no font: glyphs (the player's stroke skeletons, some letters with two forms), hand (rebuilds every
                      letter on each use with its own size, tilt, slant, shaken points, pressure; `mood` loosens it all),
                      hands (who writes: `PLAYER`, ballpoint; `KESSLER`, pencilled draughtsman's capitals with a tremor, on the
                      cassette labels and the slips) + pencil (graphite grain, the tremor) + rand
  notes/              the notebook page that peeks up from the bottom-left: notes (what the player has worked out, one per
                      flag, open questions that point at a page or tape), sheet (ruled paper + the writing), sheetPainter + sheetWorker
                      (sheets written off the main thread, only those that changed), note (GL quads,
                      one texture per sheet; hover/click, drag a held-up sheet aside to send it under, input captured before the book's)
                      + linkMark (the page references, each ringed in red pen on a ring layer below the sheet in its texture, one colour channel per overlapping ring: under the pointer noteShader lifts that ring off and draws it again)
                      + noteShader (the screen's light dims through each sheet behind) + pile (where each sheet lies, the turn animation) + onDesk (the pile lying on the table, in perspective), wear (the page ages with each reading and note:
                      yellowing, folds, coffee rings, pen blots; `handled` in localStorage) + stains (the marks), doodles (what the pen draws in the
                      margins beside each note: its own picture or an idle one, uneasier as the mood climbs; heading, ringed holes)
  puzzles/            the puzzle watcher: listings (programs the magazine asks the player to type, single source), rules
                      (one function per puzzle, ticks a flag), watcher (feeds it the interpreter's `BasicEvent`s; see docs/puzzles.md);
                      listingsMay + rulesMay are issue 2's (the code, SHUTDOWN, ECHO's ORACLE); rulesJuly issue 3's (being built)
  room/               lights: the page opens in a dark room; the lamp flickers on (a multiply pass drawn last), then the set
                      comes on and the magazine and notes slide in (`arrive`, main.ts); at the end of each evening
                      (`night`) they blink out, a second of dark, and the same again with the next issue on the table
  story/              what the story does besides the puzzles, one class per issue (issue1, issue2: timers, tampering, the tape swap)
                      + days (the nights between issues: each evening closed brings the next issue's box)
                      + guide (draws a new player to the notes, then the magazine, until each is opened: `opened-notes`, `opened-magazine`;
                      then, on the desk, hops the cassette the story waits on: `Recorder.wanted`)
  touch/              phones and tablets: touchKeys (the machine's keyboard as a strip along the bottom, or at the right on
                      a phone on its side, pressed through `CocoKeys` so the cap on the table goes down too; the canvas
                      takes what's left) + touchStyle,
                      shake (a phone shaken smacks the set; iOS asks leave at the first smack by hand), install (the
                      home-screen app: `public/manifest.webmanifest`, `public/sw.js` for offline, production builds only)
  tapes/              Rainbow On Tape, the cassette in the recorder: index (tape order, each issue's ABOUT list) and one .bas file per
                      program, except ABOUT: about.ts writes it for each issue from one template
  recorder/           the cassette recorder left of the set (a Realistic CCR-81) and the cassettes in front of it, marched in the
                      computer's pass: layout (sizes, places, poses; single source), recorderGlsl (SDF, materials, the smoked
                      window, shadows), print (its top's legends, the pencilled labels), recorder (which cassette is where, the
                      door and the carry, PLAY latched, `Tape.present`; `coco2.recorder`), hit (clicks),
                      recorderSound (the keys, the door, the cassette dropping in, the motor and tape hiss)
  magazine/           the RAINBOW: book (state, slide-in) + bookPass (its GPU pass, drawn again for an issue going back to the pile), pagePainter + pageWorker (pages painted off the main thread, on an OffscreenCanvas; painted here where a worker can't), pageTextures (the texture array), bookShader (page-turn; lying on the table, folded back on a rounded spine, or open flat at a left-hand page) + bookEdges (the block of paper's sides), bookLayout (TV/book split), bookInput
                      (TAB, PAGE UP/DOWN, wheel zoom) + bookCorner (the starburst buttons pinned to the page corner) + bookCam (the shader's camera: the book's own, or the room's with it lying on the table), pages (the ordered list of page ids; `pageNo(id)` gives a page's number),  pageLinks (the contents' page numbers, clickable: noted as each page is painted), issue (draws each page by id), slips (Kessler's pencilled Post-its, full 3-inch squares or the top of one torn off, stuck to a page and drawn over it), data (commands), paper (typesetting), cover + coverArt (its airbrushed scene) + coverDetail (painted modelling: lit hill faces, rim light, wood grain) + coverPaint (the pass that makes it look hand-painted and printed: brushwork, uneven spray, grain), may (the May cover: a message in a bottle) + maySky (its spring morning over still water) + mayArticles (contents, editorial, the Human Pledge's feature and meetings) + mayCode (Secret Messages, the tape) + mayShutdown (SHUTDOWN's three pages) + mayLetters (letters, classifieds) + mayNed (Ned's May catalogue) + mayInsideFront + mayLake + mayFish (THE ONE THAT GOT AWAY, painted) + mayInsideBack + mayProducts (THE HERMIT, CLOAD-A-MATIC) + mayBackCover + mayTimer (LIGHTS-OUT): May's ads, each issue's its own (docs/issues.md, Advertisements), julyDraft (July's pages as placeholders, each saying what it will hold), articles, letters, extras (type-ins), learn (tutorials), classifieds, ads + adsColor + adsCleaner + adsMemory (parody ads), adsInsideBack + adsBackCover (the back
                      pages, laid out like real 1986 mail-order and national ads) + adsMail (their type: tight headlines, raised-cent
                      prices, slugs, coupons) + adsProducts (painted studio shots)
  tv/                 tv (uploads the VDG frame, uniforms, power-on, `broadcast`), tvShader (uniforms, main: room → cabinet → tube),
                      pictureShader (the beam: RF colour smear, scanlines, warm-up and switch-off, jolts, roll, herringbone,
                      a far station), glassShader (reflections, fingerprints, dust), cabinetShader (room, wood, panel,
                      grille) + controlsShader (knobs, fine ring, rocker, worn print) + wearShader (scuffed veneer),
                      knobs (drag/wheel: channel selector 2–13 in detents, the fine-tuning ring behind it, volume, V-HOLD),
                      tuning (what gets through: the CoCo on 3, a weak copy on 4, snow elsewhere; mistuning, a rolling
                      picture, a loose contact, a far station; a smack may fix them), touch (the power rocker, no pilot
                      lamp; a smack on the cabinet's top-left, under an open-hand pointer; wiping the glass), grime (fingerprints and dust, wiped off; dust
                      settles back), tvSound, tvSave, dialLabels (the printed typeface)
```

## How the screen works

- The game never draws text itself: it writes bytes into `TextScreen.vram` the way Color BASIC does (bit 6 set =
  normal dark-on-green, clear = inverse, which is how lower case shows; 0x80+ = semigraphics 4 blocks). `Vdg` turns
  that into pixels only when it changes; the shader does every analogue effect.
- The cursor is a VDG overlay (`TextScreen.cursor()`), not a byte in memory: a full semigraphics block whose colour
  steps through the eight SG4 colours every 0.25 s, as Color BASIC's does.
- The story changes the screen with `TextScreen.tamper(cell, text)`, never `print`/`writeAt`: it marks the cells
  (`coco/tamper.ts`: when, and what they held before), and the TV shader disturbs only those cells for a moment
  (`TAMPER_STYLES` in `tvShader.ts`: phosphor ghost, beam re-scan). BASIC's own writes never do this.
- TV geometry (tube size and place, cabinet, knobs) lives in constants at the top of `cabinetShader.ts`; the share of
  the tube the VDG picture fills (the black border) is `ACTIVE` in `pictureShader.ts`, and how much border shows round the
  picture is `FRAME`. The rest of the set (wood, knobs, grille) is still drawn and comes back into view if `FRAME` grows.
- Every pass over the TV's is a full-screen triangle, so each sets `scissor()` (engine) to the pixels it can touch
  (`bookBounds`, the sheet's quad, the table's back edge): a new pass, or a shader that draws further, needs its bounds
  widened. The CoCo's march is kept (`computer/marchCache.ts`) and marched again only when the glow (held past the
  cursor's blink) or keys change (just round the keys) or the view moves. Its picture is fixed in panel units, so while the
  view moves the kept one is drawn moved and scaled with it and only what comes into view is marched, at CSS-pixel
  resolution; the next kept one is made a band a frame in a second texture (a band is every eighth block of 16 rows,
  so the machine's costly pixels are shared out over the frames), aimed where the view is going, before the
  shown one blurs or runs out of margin, and once the view stops the sharp one is made the same way. The magazine's pass
  is kept too (`KeptPass`, engine): marched again only when something it shows changes. `main.ts` draws one dark frame and waits for it before starting
  the clock, so the GPU builds every shader (seconds on a cold cache) before the lights come on: a new pass should draw
  in that first frame. The TV's pass sets no blend state and expects blending off; leave it off after a pass. To time passes, sync with a 1-pixel `readPixels` from the framebuffer the pass drew into (one from the window
  doesn't wait for a kept texture's draws: their cost turns up later, when it is shown) and keep
  blending on: ANGLE/Metal timer queries are meaningless, and Apple GPUs skip opaque draws that a later one covers.
- The magazine and the notes move between their own place and the table rigidly (`computer/pose.ts`): a sheet is a
  real sheet held before the eye and laid on the table (slerped, its centre straight across the view, receding evenly),
  and the book's camera is split into turn × lens × place (`mixCam`). Never blend corners or camera matrices: the
  in-between frames shear. Lying on the table each is seen square on (`computer/facing.ts`): by the eye slid sideways
  till it is straight in front of it, the picture moved back to where it lies, so the desk view's wide angle doesn't
  lean it toward the middle (its edges stay level with the table's, its sides upright; the notes slide into it as they
  go down). Only they are; everything else is the room's camera. A thing's size on the table must match the shape it is drawn, at its real size (`INCH` in `layout.ts`: the magazine 8½ × 11 in, the torn-out notebook page `SHEET_W` × `SHEET_H` at `SHEET_DPI`, about 7¾ × 10½). On the table the one looked at last lies on top (`notesOnTop` in `main.ts`), and takes the click where they overlap.

## Color BASIC

- It behaves like the real one, quirks included: keywords are found anywhere (`FORI=1TO10` works, and `SCORE=5` is
  `SC OR E=5`, a ?SN ERROR), only two letters of a name count, arrays without DIM get 0–10, a FOR body always runs once,
  errors are two-letter codes (`?SN ERROR IN 20`). Don't "fix" these: old listings depend on them.
- `Interpreter.step` runs ~6 ms of statements per frame, so nothing blocks the page; INPUT and SOUND set a state and
  return. A statement is a `Handler` in one of the groups in `statements.ts`; return `'inline'` if the rest of the line
  should run on (IF … THEN).
- Strings are JS strings of char codes 0–255: 32–127 print as text, 128–255 as semigraphics blocks.
- Supported: PRINT (; , TAB @) INPUT, LINE INPUT, LET, IF/THEN/ELSE, GOTO, GOSUB/RETURN, ON GOTO/GOSUB, FOR/NEXT/STEP,
  END, STOP, CONT, REM ', DATA/READ/RESTORE, DIM, CLEAR, CLS n, SET/RESET/POINT, POKE/PEEK (screen memory only), SOUND
  (silent, but waits), TIMER, LIST, RUN, NEW, CSAVE/CLOAD/SKIPF, CHECK (the RAINBOW CHECK sums the magazine prints beside its listings); functions ABS INT FIX SGN SQR SIN COS TAN ATN LOG EXP RND LEN
  ASC CHR$ STR$ VAL LEFT$ RIGHT$ MID$ INSTR STRING$ HEX$ INKEY$ MEM POS. Hex and octal literals (&HFF, &O17).

## The tape

- **The recorder** (`game/recorder/`) starts empty: a click on a cassette on the table puts it in (the door swings up,
  it is lowered into the well, PLAY latches), a click on the recorder takes it out. CLOAD, SKIPF and CSAVE wait (`S`,
  `TapeDeck.waiting`) until a cassette is seated with the door shut (`Tape.present`), and after a moment pull the view
  back to the desk to show it. Only the cassette of the issue on the table (`Magazine.issue`, `Recorder.current`) lies
  by the recorder; every other issue the player has lies piled right of the set (the RF lead runs back in the gap between them), its cassette in a
  pile of cassettes beside it (`Recorder.piled`),
  and one taken out of the recorder is carried back there in front of the set and over the machine, flat, through
  `ACROSS` (`recorder/layout.ts`; `Recorder.far`: that move marches everything, in `farBox`).
  A click on an issue in the pile puts it on the table and opens it (the one there goes on the pile), one on a cassette
  there only swaps them, shut (`Computer.onPile`, main.ts; `IssueSwap.opens` false): the one coming is carried from the
  pile to the table over the one going back (`IssueSwap.coming`; the book draws it on top of the other all the way),
  and the cassettes lying out go to their new places over the machine meanwhile (`Recorder.shift`); the book's corner button and a note's page link into the
  other issue open it too (`Magazine.pickUp`). The open book is first put away onto the table (the view pulls back to
  the desk), then the one picked up opens straight off the pile, shut on its cover and turning to the page it was left
  at (`computer/swap.ts`, `IssueSwap`; `stepSwap` in main.ts), and the one going back is carried from the table to the
  pile meanwhile, setting off a moment later, lifted over the table, landing as the pile draws it (`Magazine.letGo`
  keeps its pages in the spare layers, `SPARE`, `pageTextures.ts`). The cassettes stay where they were (`onTable` in
  main.ts is still the old issue) until it has landed and the book is all the way open, the view in on the set; then,
  out of sight, they change places at once. Opening, the book takes over the
  pile's drawing of it (`Pile.hidden`), hidden behind the set only while it still lies there (`behindSet`, `bookCam.ts`)
  and coming out of the pile's shade into the lamp's light. It shows the pile's cover until its own is painted, so it
  is never bare paper. The pile is laid from the top down, each further down pushed out
  right and toward the room so an edge of each shows (`computer/pile.ts`: places, the SDF, clicks; `pileCovers.ts`: the
  book's own covers, painted once as each issue comes, and the spines; `Computer.pile`). The cassette in the recorder
  decides which tape BASIC reads. `HeadlessCoco` has no recorder: its tape is always present.
- The cassette holds this issue of Rainbow On Tape (`game/tapes/`: March's ABOUT, GUESS, RAINBOW, ORACLE, ADVENT; from issue 2,
  the May tape: ABOUT, SHUTDOWN, ORACLE, CODER, CHECKUP; from issue 3, July's: ABOUT, REGISTER, COUNTER, GOODBYE) followed by the player's CSAVEs (localStorage, one key per cassette); a CSAVE under a
  built-in name records over it for that browser. `Tape.insert` swaps cassettes (the recorder does, as one goes in).
- It has a position, like a real tape: `CLOAD` alone loads the next file, `CLOAD "NAME"` winds forward (wrapping) and
  shows `F NAME` for each file it passes, `SKIPF` winds past one. Not found after a whole pass is ?IO ERROR.
- A new program: a `.bas` file in `game/tapes/` (numbered lines, upper case, mind the crunching: no keywords inside
  variable names), an entry in `tapes/index.ts`, and a line in its issue's ABOUT list there
  (`MARCH_ABOUT`, `MAY_ABOUT`, `JULY_ABOUT`; a new issue's tape gets its own, made by `aboutTape`). Keep PRINTed text to 31 characters: a
  full 32-character line followed by a new line leaves a blank line, as on the real screen.

## The magazine

- Issues (`magazine/pages.ts`: `ISSUES` lists each issue's pages in order, the cover being page 1; March has 18, May 16, July 16 (placeholders); `pageNo(id)` finds a page in whichever issue holds it, and the notes link "May p.N" into May, "July p.N" into July). The book holds one issue at a time (`Magazine.issue`, `setIssue`; a corner button switches once May has come, as does a click on the other issue in the pile beside the set, which opens straight off it: The tape, above), each drawn with Canvas 2D into a texture array, one page per layer, lazily. The shader does the
  turning leaf in perspective. Window split: TV left / book right (top / bottom when tall); the ⤢ button (reading mode) shrinks the TV to a strip, and a click on the page goes between that and beside the set (it never puts the book away; TAB, ✕ or a click outside it do).
- The TV pulls back as the book opens: `Tv.draw(..., rect, frame)` takes the rectangle it fits in and how much of the set shows.
- **Never write a page number by hand.** Name a page by id and ask `pageNo(id)` (`magazine/pages.ts`): contents, editorial,
  letters, the cover's "page N" and the notebook's pointers all do, so reordering `PAGE_IDS` fixes every
  reference. To add a page: add its id there, a draw function in `issue.ts`'s table, and (if it should be listed) a
  contents entry.
- It is the player's guide: `COMMANDS` in `data.ts` is the single source for the "how to play" page. The story calls
  `magazine.setFlag(name)` to record progress (`bookSave.ts`: flags and the page the book is open to, by id, persist in localStorage; a reload always starts at the set with the book and notes closed, and the CoCo cold); the player's notebook (`notes/`) shows it.
  There are no hints in the book (the scratch-off page became the HEAD CASE ad). Typing still goes to the CoCo while it is open; TAB opens/closes.
- **Illustrations** (covers, painted ads, art inside the pages) look like a skilled 1980s illustrator's airbrush and gouache: true lines, hand-painted light and shade, brushwork, print grain; never vector-perfect and never wobbly. Paint pass before type, type stays crisp. Read `docs/illustration.md` before drawing any.

## Known debt

- The adventure itself doesn't exist yet. Premise and escalation ideas: `docs/story.md`.
- Missing from Extended BASIC: DEF FN, EDIT, RENUM, DEL, PRINT USING, MID$ as a statement, graphics modes (PMODE,
  LINE, CIRCLE, PAINT…), PLAY, and SOUND's actual tone (it could now go through the TV's speaker, `tvSound.ts`). No string-space limit (CLEAR's size is ignored).
- Phones: portrait already works one thing at a time through the tall-window layouts (the set, the set over the book,
  reading mode, the notes held up), and a phone on its side docks the keyboard at the right. Hover needs no stand-in: a
  tap opens the notebook or the magazine as a click does. Not yet tried on a real phone.
- Lower case (SHIFT-0) isn't modelled: everything typed comes out upper case.
