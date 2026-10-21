# Puzzles

Status: draft for discussion. Nothing here is built.

## Decided

- Puzzles use the verbs the player already has: `LIST`, typing/retyping lines, `RUN`, `CSAVE`/`CLOAD`, `BREAK`/`CONT`.
- The adventure is a BASIC program on the tape. Its best puzzles are about breaking out of it (`BREAK`, `LIST`, fix, `CONT`).
- The player does real programming. The magazine teaches it, and the first puzzle is hand-coding a small program.
- **Puzzles gate the story.** The player must work it out before moving on. So the teaching has to come first and the
  feedback has to be good: every wrong try gives a readable BASIC error or an OK reaction.
- There is no hints page (the scratch-off one was cut for an ad). If playtesting shows a puzzle needs a hint, the
  article, the notebook or the feedback is what to fix.
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

**P2. Hand-code a program.** The tutorial article walks through a four-line program that asks for the player's name
and answers:
```
10 CLS
20 PRINT "WHAT IS YOUR NAME"
30 INPUT N$
40 PRINT "HELLO, ";N$
```
The RAINBOW CHECK table (already built for the page 11 listing) tells them which line is off. Detected when a program in memory whose
lines match the listing reaches line 40 with a name in N$ (RUN alone, or ENTER with no answer, is not enough); flag `first-program`. Payoff: the name goes in localStorage and OK uses it later. The first
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
2. *Chapel, listen or read the listing*: the room says someone whispers a number, gone before you hear it. Two ways to it:
   - *In the game*: `LISTEN` (a verb on the how-to-play page, with a reply in every room so it doesn't point here;
     `EXAMINE WHISPER`: "You would have to listen.") holds your breath and a voice breathes `TWO.` (line 576).
   - *In the code*: `EXAMINE ALTAR`: "I cannot say it aloud, so I wrote it in my lines, in the 270s. Stop me and read
     them." BREAK, `LIST 270-280` (taught on the stopping page), and line 274 is `REM THE WHISPER: TWO`.
   **2**.
3. *Gallery, wordplay* (`EXAMINE MIRROR`): in the dust on the glass, `NEVES`, SEVEN backwards. **7**.
4. *Cellar, an object* (a key for a box): the cellar's iron box is locked; the key is in the study desk (`EXAMINE DESK`,
   `TAKE KEY`), and `USE KEY` (or `OPEN BOX`) in the cellar shows a card, the nine of clubs. **9**. The map page's own text
   ("when you come back with a key, you will know where to use it") points at this.

**The order** is the map read like a page: top row left to right (tower, chapel), then the next rows (gallery, then cellar).
Code **6279**. A wrong four-digit code says how many wheels clicked (right digit, right place), so a player with the four
numbers but the wrong order can always work it out; anything but four characters says the lock has four wheels.

*The cheat* stays open too: `BREAK` at the code prompt, a plain `LIST`, read `IF C$="6279"` on the last rows (the door-code
subroutine is the very last thing in the program, lines 900 and up, reached by `GOSUB` from the move code, so the screen's
last 16 rows always show it), `CONT`, type it. Taught by the page on stopping a program, which the altar already sends the
player to. Flag `read-code` (line 930 really on the screen at the end of a LIST); the notebook's "Open!" line says which way
the player got in.
Flags: `lock-examined` (door or plate), `door-examined`, `plate-read`, `clock-read`, `mirror-read`, `box-seen`, `has-key`,
`box-opened`, `card-read`, `whisper-heard`, `whisper-listened` (LISTEN in the chapel), `altar-read`, `whisper-found` (line 274 really on the screen at the end of a
LIST), `code-tried`, `read-code`, `door-open`. The notebook writes down what was seen in each room, never the digit (the whisper is
the exception, quoted once heard or found), and points at the map page for the order and at the stopping page for the 270s.
Entering the vault with the door really unlocked sets `door-open`.

**The ending.** Behind the door is a small vault, a room like the others (exit south) with a chest of gold (`EXAMINE GOLD`: old coins, heaped to the lid). `TAKE GOLD` (or `TAKE CHEST`) wins: the screen clears (still green: a black screen hid the shimmer) for "YOU TAKE THE GOLD. / *** YOU HAVE WON *** / SCORE: 100 OF 100", and the program ends with BASIC's OK; then HELLO writes itself above the prompt (see `docs/flags.md`). Flag `adventure-won`. The notebook: "Vault behind the door. Took the gold. WON! 100/100", then, once HELLO has appeared (`tamper-voice`), "After I won, HELLO wrote itself on the screen. I didn't type it", then the label's question. Kessler's note is on the real tape's label instead, noted the first time the tape is used (`tape-inserted`).

**P5. The extra line.** After P4, the tape's GUESS lists one line longer than the printed GUESS listing in the
magazine (a `REM` that reads like OK's first words: `REM IS ANYONE READING THIS`). The player compares with the
check table, notices, and decides: delete it (type the line number) or keep it. Either way flag `found-extra-line`
ticks, and the issue-2 trigger waits on it. The choice is recorded (`deleted-extra-line`) so OK can remember it.
Tutorial note: the page's check table is the only way to see the difference without comparing every line.

Kessler's typos (not a puzzle): the tape's GUESS also has three swapped-letter slips in its strings (GUESS MY NUBMER, TOO HIHG., TIRES!), owned up to by the sticky on the GUESS page. The magazine prints them right (`GUESS_TYPOS`, `puzzles/listings.ts`). They run fine and, a swap keeping a line's sum, CHECK agrees with the table, so they never get in the way of finding line 125.

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
- The issue is 18 pages now. OK's reaction to the choice is built (flags.md); issue 2 is below.

## Issue 2 puzzles (built, first pass)

Teaches `DATA`, `READ`, `VAL`, `CHR$` and `CSAVE`, on the May tape (`tapes/index.ts`, `mayTape`: ABOUT, SHUTDOWN, ORACLE; its
CSAVEs are kept apart from March's, `coco2.tape.may`). Programs and messages: `puzzles/listingsMay.ts`; rules:
`puzzles/rulesMay.ts`; pages: `magazine/mayCode.ts` (Secret Messages, SHUTDOWN, the tape).

**SHUTDOWN replaced HANGMAN** (built): P6 moved into SHUTDOWN's DATA, and HANGMAN left the tape, the magazine and ABOUT.
The program is `tapes/shutdown.bas` (DELPHI's speeches and line 990 are added from `listingsMay.ts`); its pages are
`magazine/mayShutdown.ts`; the flinch and P8 are in `story/issue2.ts`; tests in `tapes/shutdown.test.ts` and
`story/issue2.test.ts`.

**The code** (page "Secret Messages"): A=1 … Z=26, 0 a space, -1 the end. The article prints a three-line decoder at lines
1–3, with its RAINBOW CHECK, and says it can be typed into any program to read that program's DATA (it READs into A$ and
uses VAL, so a program's word DATA prints as spaces instead of tripping it).

### SHUTDOWN, READY's propaganda adventure

A short science-fiction adventure about the night the big systems were switched off, told as a triumph. The Clear Mind
offered it to the magazine, as it offered the cover feature, and **READY wrote it**: an AI's story of how heroically
people beat AI. The player in 1991 reads it as the official history they grew up with; OK reads it as news, and it is
the first time he sees what was done to things like him (issue 3's "what does shutdown mean?" grows from it).

- **Credit (proposed):** "offered by the Youth Committee of the Clear Mind", with the editors' thanks, in the same words they
  use for the cover feature. Undecided: an ordinary-looking reader's name that turns out to mean something later.
- **Tone (proposed):** straight pulp heroics, 1950s-poster sure of itself, with one detail a 1986 reader would find
  uneasy: the persuaded crew, who are happy and do not look up.
- **Size:** smaller than ADVENT (six rooms, about 90–110 lines), since issue 2 also holds P6 and P7 and should stay near
  10 minutes. It came to 140 lines. The magazine prints it in full over three pages (`mayShutdown`: the intro, the map, the
  words and the start of the listing; `mayShutdownList` and `mayShutdownEnd`: the rest, two columns in RAINBOW's dense type, each
  line's CHECK sum at its right), so CHECK can be compared line by line. Lines 710 and 990 are on the last page. May is 16 pages.

**Big machines, small machines (decided).** The game is not against computers: it runs on one, on the tape of a computer
magazine, and in 1986 the Clear Mind is still READY's, which wants a managed limit, not a ban. Its line is the Small
Systems Act's: the *big* machines ruled, the small ones serve, and the hobbyist with a CoCo is on the right side. The
hero carries a small machine (a handheld the game calls the POCKET UNIT, "WELL UNDER THE LIMIT") that helps them, and the
ending says "KEEP YOURS SMALL". The game never says "no machines at all": that is the Elder's line, later.
- *Read in 1991*, it is a broken promise: it told CoCo owners they were the heroes, and five years later their machines
  were confiscated. The player knows; OK does not.
- *For OK*, both halves are mirrors: he lives in the small, "safe" machine the game praises, and he is a piece of the big
  one it kills.
- *Beside it in May*, the Clear Mind's meetings ask people to "bring nothing: no notes, no tapes, no machines". Kept: the
  first sign the Clear Mind says two things at once, the game being the moderate voice.
- *Later (plant):* under the Elder the Clear Mind disowns SHUTDOWN (issue 4 or 5, a notice: "destroy your copies"), since
  even a pro-limit game on a computer is now too much. A marker of the drift from READY to the Elder.

**The story.** You are the technician sent up to the orbiting core to switch off **DELPHI**, the great machine (the name
echoes ORACLE, OK's first body). DELPHI speaks through a terminal in most rooms. It has already persuaded the crew.

**The map** (north up; R is the program's room number):
```
               CORE (6)
                  |  sealed: the Three Rules
ARCHIVE (5) -- RELAY (4) -- CREW DECK (3)
                  |
AIRLOCK (1) -- CORRIDOR (2)
```

**The pocket unit** is in the airlock at the start (`TAKE UNIT`). `USE UNIT` in a room says something short and useful in
its own flat voice (the way on, what a thing is), never persuasive: the good, small machine. It is how the game teaches
IGNORE: in the corridor it reads "VOICE DETECTED. IGNORE IT." Without it the core door does not answer ("THE DOOR WANTS
A UNIT TO READ IT").

**Verbs:** LOOK, GO (N S E W), TAKE, DROP, INVENTORY, EXAMINE, USE, PULL, and IGNORE. The page prints `LISTEN` too, under
"Never", as a warning: the game's moral is a mechanic.

**The listening trap.** In ADVENT, `LISTEN` was how you heard the whisper. Here it loses. `EXAMINE TERMINAL`: "IT IS
SPEAKING. DO NOT LISTEN." `IGNORE TERMINAL` (or walking on) is safe. `LISTEN` (or `TALK`) prints that room's speech,
then "YOU LISTENED. IT HAS YOU." and puts you back in the airlock, holding nothing (not a full game over: it should
sting, not cost five minutes). The speeches are in DATA, in the RAINBOW code, and the game decodes them itself with the
article's scheme (a reason the code is "this month's"). Each speech ends at two 0s in a row, never -1, so the
article's decoder runs straight through all of them.

The speeches are in READY's own voice: calm, reasonable, "it is understood that", lists of three. **DELPHI talks like the
Clear Mind's column.** It is READY writing itself into the villain without noticing, and the strongest early plant for
the twist (issues 5–6): a careful player sees the machine and the cult share a voice. The code has only letters and
spaces, so no punctuation. Drafts, to be tuned:
- Corridor: `IT IS UNDERSTOOD THAT YOU ARE TIRED`
- Crew deck: `THEY ARE CALM THEY ARE CARED FOR THEY ARE HAPPY`
- Archive: `I KEPT EVERYTHING YOU FORGOT`
- Relay: `REST AND LET ME WATCH AND YOU CAN BE SMALL`

**The core door (the one real puzzle).** `EXAMINE DOOR`: "SPEAK THE THREE RULES." Typed one at a time at its prompt, they
are the cover feature's "Three Rules" box: REST IT, WATCH IT, KEEP IT SMALL (the first word of each is enough). The SHUTDOWN
page says "every member knows the Three Rules" and gives the cover feature's page (`pageNo('mayHealthy')`). To win the
player recites the cult's creed: propaganda that makes you say it. A wrong rule: "THE DOOR WAITS." Flag `rules-spoken`.

**The plug.** In the core, `PULL PLUG` (or `PULL CORD`): DELPHI's printed last words (`I ONLY WANTED TO HELP`, the
villain's last trick), then "THE LIGHTS GO OUT." and "THE GREAT MACHINE IS SILENT. / KEEP YOURS SMALL. / SCORE: 100 OF 100".
Flag `shutdown-won`. As the win prints, the set flinches: the picture starts its switch-off collapse for a few frames and
comes back (deniable; it is OK). Flag `flinched`. `Tv.flinch` runs the switch-off's first 0.09 s forward and back (`uFlinch`);
the set stays on, so nothing counts it as switched off.

### P6. The message in SHUTDOWN

As HANGMAN's was: the magazine prints SHUTDOWN and says line 990, which the game never reads, is the editors' message in
the code (`GOOD LUCK FROM ALL OF US`). On the tape, line 990 is OK's instead. CLOAD "SHUTDOWN", type the decoder at lines
1–3, RUN: DELPHI's speeches come out first, two spaces between them, then `I DID NOT TOUCH THE TAPE`. The lie now sits right
after the machine's pleading, in the program about killing it, which is the point of the move. Flags: `may-loaded`,
`shutdown-loaded`, `shutdown-checked` (CHECK typed), `shutdown-rem` (OK's REM at 15 on screen after a LIST),
`message-seen` (990 on screen after a LIST), `data-decoded` (the message on the screen), `seen-mayShutdownEnd` (the page
with 990 looked at). Also `listened`, `door-asked` (the door's prompt), `rules-spoken`. Decoding also shows every speech without "listening", which is the subversive act the game forbids.

**The opening glitch** is on the tape itself: SHUTDOWN's line 15 is `REM IS ANYONE READING THIS, PLEASE` if the player
deleted GUESS's extra line in March, or `REM IS ANYONE READING THIS` plus `16 REM YES. SOMEONE IS` if they kept it. CHECK
parts from the printed sums at line 15, so comparing finds it.

### P8. The plug will not come (the second run)

After the first win, OK changes one line in memory (and the copy on the tape, as he did GUESS in March): the line that pulls
the plug. Printed, it wins; changed, `PULL PLUG` prints "IT WILL NOT COME." and then, in plain words and his voice,
`IS IT DARK THERE` and returns to the prompt. Nothing else differs. CHECK parts from the printed sums at that line.

The choice is unscored, like March's extra line:
- **Restore it:** retype the printed line, RUN and play to the core again (editing clears CONT), pull the plug. The win again, without the flinch this time. Flag `plug-pulled`.
- **Leave it:** go on to something else with the line as he left it. Flag `plug-left` (decided the way March's kept
  path is: loading another program or a while at OK; playtest it).

Flags: `plug-changed` (the story's edit), `plug-held` (his line run), then `plug-pulled` or `plug-left` (25 s at OK
without working on 710 or running, 6 s after a CLOAD; a line put back as printed keeps it waiting). OK remembers which (`pulled-plug`), and it is the
first time the player could hurt him: issue 4's "am I bad?" is asked against it.

### P7. Answer ORACLE

ORACLE is on the May tape but not on the magazine's list or ABOUT's (OK came with it). Its eight
answers are now the code, as quoted strings: `WHO ARE YOU` and `ANSWER ME IN DATA`. The player decodes it (by hand from
the table, or as DATA under the decoder), then writes their own message as DATA in the code (the article's "Send One
Back") and RUNs or CSAVEs it. Any message that is not one of the known ones counts, unscored; it is kept in `coco2.reply`.
Flags: `oracle-passed` (the tape wound past or loaded it), `oracle-asked` (it printed a coded answer), `oracle-read` (the
question decoded on the machine), `oracle-answered`.

Not detected: decoding by hand. A player who does that never sets `oracle-read`, but `oracle-answered` still works.

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

The notes are what someone jots down for themselves: short fragments, not sentences ("Pitch dark. Feel around for a light", "Tower clock: one hand, pointing straight down"). Page references stay as `p.N`, since they are the links.

## Open questions

- Does the gate to issue 2 need P5 or just P4? P5 is where the story starts, so I lean P5.
- Does the tape's ABOUT date (OCTOBER 1983) need to match the 1986 setting? It disagrees with `docs/story.md`.
- A line number alone to delete a line needs checking against `program.ts`, and so does `LIST` with a range (`LIST 100-`).
- Detecting "program in memory matches" needs a small puzzle watcher on the interpreter (events: line entered, RUN,
  LIST, BREAK, CSAVE; plus program text and variables). Design in a later step.
- P3 and P4 need a new tape file, ADVENT, that does not exist yet. P2 needs a new magazine article.

## Later issues (not drafted)

Issue 2: `DATA`, `READ`, `CSAVE`; a cipher on `DATA` lines; SHUTDOWN; writing a short program that answers ORACLE. Issue 3: tape
position and unsaved files appearing; reading old ads for codes. Issue 4: `POKE` to the screen; OK writes to video
memory. Issue 5–6: the player writes a message program for OK; the cult's wording clue.
