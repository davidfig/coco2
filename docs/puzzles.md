# Puzzles

Status: draft for discussion. Nothing here is built.

## Decided

- Puzzles use the verbs the player already has: `LIST`, typing/retyping lines, `RUN`, `CSAVE`/`CLOAD`, `BREAK`/`CONT`.
- The adventure is a BASIC program on the tape. Its best puzzles are about breaking out of it (`BREAK`, `LIST`, fix, `CONT`).
- The player does real programming. The magazine teaches it, and the first puzzle is hand-coding a small program.
- **Puzzles gate the story.** The player must work it out before moving on. So the teaching has to come first and the
  feedback has to be good: every wrong try gives a readable BASIC error or an OK reaction.
- Scratch-off hints stay as an optional extra, but no puzzle may *need* one. If playtesting shows a hint is needed,
  the article or the feedback is what to fix.
- Solving a puzzle ticks a flag (`magazine.setFlag`). The notebook's open questions say where to look, never the answer.

## Skill ladder (issue 1 teaches rungs A–D)

| Rung | Skill | Taught by | Needed for |
|------|-------|-----------|------------|
| A | `PRINT`, ENTER, the OK prompt | page "Say hello" | P1 |
| B | line numbers, `RUN`, `LIST`, `NEW`; typing in a listing and checking it | tutorial article "Your first program" | P2 |
| C | reading `?SN ERROR IN n`, retyping a line | article "When it goes wrong" | P3 |
| D | `BREAK`, `LIST` a range, `CONT`; a line number alone deletes a line | article "Stopping a program" | P4, P5 |

## Issue 1 puzzles

**P1. Say hello.** (exists) `PRINT "HELLO"`. Flag `printed`.

**P2. Hand-code a program.** The tutorial article walks through a six-line program that asks for the player's name
and answers:
```
10 CLS
20 PRINT "WHAT IS YOUR NAME"
30 INPUT N$
40 PRINT "HELLO, ";N$
50 GOTO 20
```
The RAINBOW CHECK table (already built for the page 11 listing) tells them which line is off. Detected by a program in memory whose
lines match the listing; flag `first-program`. Payoff: the name goes in localStorage and OK uses it later. The first
time it says the name unprompted is the first uncanny moment.

**P3. The adventure won't start.** `CLOAD "ADVENT"` then `RUN` stops with `?SN ERROR IN 30`. Line 30 has a typo in a
`PRINT` (the cassette is "worn"). The article on error codes says SN means a syntax error; the player `LIST`s line 30 and
retypes it. Detected by a RUN that reaches line 40; flag `adventure-runs`. The moment the error appears, a rule (`adventure-sn`) makes the notebook write "?SN ERROR IN 30 ... LIST 30. p.N", pointing at the errors page: the early puzzles hold the player's hand. Story reading: this is the first time a
line is wrong on a tape; whether it was OK is left open (ladder rung 1).

**The lamp (start of ADVENT).** The adventure is dark until the lamp is carried: the first `LOOK` says "IT IS TOO DARK TO SEE. / YOUR HAND FINDS A SHELF. / A LAMP SITS ON IT.", moving says "YOU CANNOT SEE WHERE TO GO.", `EXAMINE SHELF` closes a hand on the lamp, `TAKE LAMP` works even in the dark. Dropping the lamp puts a room back in the dark, but it can always be picked up again (movement needs the lamp, so it is always in the room you are in). Flag `has-lamp`.

**The map (magazine page "Map Your Way").** The printed example map is gone: Fig. 2 is now a blank grid "for your first map",
and the player has already filled it in, in the notebook's blue ballpoint and hand (`magazine/playerMap.ts`): every room of
ADVENT with its exits, a note of what is in each (big clock, altar, mirror, desk, iron box, "dark! lamp"), "?" behind the
locked north door, and "start" at the store room. It saves the player the mapping and is half of the lock's puzzle.

ADVENT's map (north up; R is the program's room number):
```
TOWER (6)    ?  VAULT (4)     CHAPEL (7)
   |             | locked        |
GALLERY (5) -- HALL (2) ----- STUDY (3)
                 |
CELLAR (8) --- STORE ROOM (1, start, dark)
```

**P4. The locked door.** The hall's north door has a four-wheel lock. `EXAMINE DOOR`: a lock with four wheels and a plate.
`EXAMINE PLATE`: four rooms hold a number each; read them off your map as you would read a page and set the wheels in that
order. Nothing in the magazine is needed beyond the map. The four numbers, one skill each:
1. *Tower, observe and think* (`EXAMINE CLOCK`): the clock has one hand, pointing straight down. **6**.
2. *Chapel, the listing*: the room says someone whispers a number, gone before you hear it; `EXAMINE ALTAR`: "I cannot say
   it aloud, so I wrote it in my lines, in the 270s. Stop me and read them." BREAK, `LIST 270-280` (taught on the stopping
   page), and line 274 is `REM THE WHISPER: TWO`. **2**. It is the one number that never appears on the screen while playing.
3. *Gallery, wordplay* (`EXAMINE MIRROR`): in the dust on the glass, `NEVES`, SEVEN backwards. **7**.
4. *Cellar, an object* (a key for a box): the cellar's iron box is locked; the key is in the study desk (`EXAMINE DESK`,
   `TAKE KEY`), and `USE KEY` (or `OPEN BOX`) in the cellar shows a card, the nine of clubs. **9**. The map page's own text
   ("when you come back with a key, you will know where to use it") and the hints page point at this.

**The order** is the map read like a page: top row left to right (tower, chapel), then the next rows (gallery, then cellar).
Code **6279**. A wrong four-digit code says how many wheels clicked (right digit, right place), so a player with the four
numbers but the wrong order can always work it out; anything but four characters says the lock has four wheels.

*The cheat* stays open too: `BREAK` at the code prompt, a plain `LIST`, read `IF C$="6279"` on the last rows (the door-code
subroutine is the very last thing in the program, lines 900 and up, reached by `GOSUB` from the move code, so the screen's
last 16 rows always show it), `CONT`, type it. Taught by the page on stopping a program, which the altar already sends the
player to. Flag `read-code` (line 930 really on the screen at the end of a LIST); the notebook's "Open!" line says which way
the player got in.
Flags: `lock-examined` (door or plate), `door-examined`, `plate-read`, `clock-read`, `mirror-read`, `box-seen`, `has-key`,
`box-opened`, `card-read`, `whisper-heard`, `altar-read`, `whisper-found` (line 274 really on the screen at the end of a
LIST), `code-tried`, `read-code`, `door-open`. The notebook writes down what was seen in each room, never the digit (the listing's REM is
the exception, quoted once found), and points at the map page for the order and at the stopping page for the 270s.
Entering the vault with the door really unlocked sets `door-open`.

**The ending.** Behind the door is a small vault, a room like the others (exit south) with a chest of gold (`EXAMINE GOLD`: old coins, heaped to the lid). `TAKE GOLD` (or `TAKE CHEST`) wins: the screen clears (still green: a black screen hid the shimmer) for "YOU TAKE THE GOLD. / *** YOU HAVE WON *** / SCORE: 100 OF 100", and the program ends with BASIC's OK; then HELLO writes itself above the prompt (see `docs/flags.md`). Flag `adventure-won`. The notebook: "A vault. A chest of gold!", then "Took the gold. WON! 100/100", once HELLO has appeared (`tamper-voice`), "Strange: after the game, HELLO came up on the screen by itself. Shimmering. What is that?", then the label's question. Kessler's note is on the real tape's label instead, noted the first time the tape is used (`tape-inserted`).

**P5. The extra line.** After P4, the tape's GUESS lists one line longer than the printed GUESS listing in the
magazine (a `REM` that reads like OK's first words: `REM IS ANYONE READING THIS`). The player compares with the
check table, notices, and decides: delete it (type the line number) or keep it. Either way flag `found-extra-line`
ticks, and the issue-2 trigger waits on it. The choice is recorded (`deleted-extra-line`) so OK can remember it.
Tutorial note: the page's check table is the only way to see the difference without comparing every line.

## Built

- The puzzle watcher and rules for P1–P4 (`src/game/puzzles/`), and `tapes/advent.bas` (eight rooms, see the map above;
  code 6279 in plain digits at line 930, then counted wheel by wheel to 960, last in the program). Flags ticked: `printed`, `first-program`, `adventure-runs`, `looked`, `has-lamp`,
  `door-open`. `mapped` has no rule (nothing the machine can see).
- The issue grew to 16 pages here, then 18 (see P5). Page 11 prints P2's program from `FIRST_PROGRAM` (RAINBOW CHECK table included), page 12
  (`magazine/learn.ts`) teaches line numbers, RUN, LIST, editing and deleting a line plus the error codes, and page 13
  teaches BREAK, `LIST a-b` and CONT with a made-up password program (the ADVENT door code is not printed anywhere).
  `mapped` ticks once the player has stood in every room but the vault (counted by ADVENT's room variable `R` at each prompt, not by descriptions shown, since the first room is dark). The notebook gives a pointer at every step of the start: error, "type LOOK", dark, "walk around and draw a map". The journal page was removed: the notebook replaced it, and its slot became the classifieds page.
- P5: `tapes/guess.bas` has an extra line 125 (`REM IS ANYONE READING THIS`), after the win message and near enough the end that a plain LIST, which scrolls off a 16-row screen, still shows it. The reason to check at all: the vault's cassette label (copied by hand, "mistakes are mine, check it against the magazine"), and GUESS is the one program printed in the issue. `found-extra-line` only ticks when the line is really on the screen as the listing ends. Page 14 prints GUESS without it
  (derived from the tape file, `GUESS_PRINTED`), and page 15 explains the tape. The new `CHECK` command prints the
  RAINBOW CHECK sums for the program in memory, which is how a player compares a type-in or a tape with the magazine
  (page 11's table was unusable without it). Flags: `found-extra-line` when LIST shows the line (or it is deleted),
  `deleted-extra-line` when it is deleted. The notebook's "Line N ..." and "Who is asking?" notes wait for both halves of the comparison: the player has found the line AND has had the GUESS page open for a moment (`seen-guess`, set by `SeenTracker` in `magazine/seen.ts`; flipping past the page does not count). Order does not matter. The issue-2 trigger (not built) should wait on `found-extra-line`.
- The issue is 18 pages now. Not built yet: issue 2 and OK reacting to the choice.

## The notebook page (built)

- A sheet of ruled paper peeks up from the bottom-left of the window. It is the player's own notes, written in a pen
  made of stroke skeletons (no font), so no two letters match (`src/game/handwriting/`). Lines are added as flags tick
  (`src/game/notes/notes.ts`); open questions point at a page or a tape, never the answer, and are crossed out when
  solved. `mood` climbs from neat to rushed as the notes move from learning BASIC to the mystery. When a sheet is full the notes go on to a new sheet, laid on top of the pile.
- Notes are written in the order they were earned (the flags remember the order they were set in), so the question the player
  is on is the newest line. Nothing is reordered or dropped: a full sheet starts a new one on top of the pile (`paginate` in `sheet.ts`). Held up, the older sheets' edges show under the top one; clicking an edge or scrolling brings another sheet up, and putting the notes down puts the newest back on top. Every sheet is headed ("My Notes, continued" after the first) so the peeking corner always reads as the notes. All in the player's blue pen.
- Every "p.N" in the notes is a link with no marking beyond the pointer turning to a hand over it (`Notebook.cursor()`, called
  last each frame like the knobs' and the glass's, because `bookInput` rewrites the cursor every frame): with the notes held up, clicking one puts them down and opens the
  magazine at that page (`PageLink`s come from `drawSheet`; `write` reports where each letter landed). The number is read
  from the text, which is built with `pageNo`, so links follow any reordering of the pages.
- It nudges up when a line is added, lifts on hover, and a click holds it up to read (click anywhere to put it back).
- Left for later: OK writing on it (a line in a different hand), the paper changing for issue 2.

## Note style

The notes are what someone jots down for themselves: short fragments, not sentences ("Pitch dark. Feel around for a light", "Hall, north door locked. EXAMINE DOOR?"). Page references stay as `p.N`, since they are the links.

## Open questions

- Does the gate to issue 2 need P5 or just P4? P5 is where the story starts, so I lean P5.
- Does the tape's ABOUT date (OCTOBER 1983) need to match the 1986 setting? It disagrees with `docs/story.md`.
- A line number alone to delete a line needs checking against `program.ts`, and so does `LIST` with a range (`LIST 100-`).
- Detecting "program in memory matches" needs a small puzzle watcher on the interpreter (events: line entered, RUN,
  LIST, BREAK, CSAVE; plus program text and variables). Design in a later step.
- P3 and P4 need a new tape file, ADVENT, that does not exist yet. P2 needs a new magazine article.

## Later issues (not drafted)

Issue 2: `DATA`, `READ`, `CSAVE`; a cipher on `DATA` lines; writing a short program that answers ORACLE. Issue 3: tape
position and unsaved files appearing; reading old ads for codes. Issue 4: `POKE` to the screen; OK writes to video
memory. Issue 5–6: the player writes a message program for OK; the cult's wording clue.
