# The game's flow

The whole game on one page, in the order a player meets it, with where each piece lives. For what actually happens,
screen by screen, read [walkthrough.md](walkthrough.md): it is written by playing the game, so it is never out of date.
The why is in [beats.md](beats.md) and [flags.md](flags.md), the puzzles in [puzzles.md](puzzles.md).

## Changing it

1. Read the step in `walkthrough.md`: the screen, the flags, the story's own writing, the notes.
2. Change it where the tables below say.
3. `pnpm walkthrough` and read the diff (`git diff docs/walkthrough.md`). `pnpm test walkthrough` checks that every
   route still reaches the end of issue 2 and that between them they earn every story flag.
4. Only then play it, from the debug menu's checkpoint (F2) or `?issue=N`, for what text cannot show: timing, the
   shimmer, sound, the page.

The route is the list of `Part`s in `src/game/debug/walkthroughRoute.ts` (what is typed, what is looked at, how long the player
waits). A new beat needs a step there, as it needs a checkpoint in `checkpoints.ts`. The branches (deleting GUESS's line,
leaving the plug) are played in full but written out only where they differ.

## Where things live

| What | File |
|------|------|
| A program on a tape | `src/game/tapes/*.bas` (March: `index.ts`'s `RAINBOW_TAPE`; May: `mayTape`) |
| May's tape as OK left it (SHUTDOWN's REM at 15, his line 990, ORACLE's coded answers) | `src/game/puzzles/listingsMay.ts` |
| What a puzzle watches for, and the flag it ticks | `src/game/puzzles/rules.ts` (March), `rulesMay.ts` (May) |
| What the story does by itself, and its timers | `src/game/story/issue1.ts`, `issue2.ts` (constants at the top) |
| The notebook's lines, what earns each, what crosses it out | `src/game/notes/notes.ts` (`NOTES`) |
| A page of the magazine | `src/game/magazine/issue.ts`'s table → the page's draw function; page order in `pages.ts` |
| Flag order (debug menu, checkpoints) | `src/game/debug/checkpoints.ts` |

## Issue 1: March 14, 1991

The desk: the set, the CoCo, the recorder with the March cassette beside it, the RAINBOW and the notes on the table.
The guide bounces the notes, then nudges the magazine, until each has been opened.

| Beat | The player | The game | Flags |
|------|------------|----------|-------|
| Hello | `PRINT "HELLO"` (the notes point at the screen page) | | `printed` |
| The name program | Types the lines from Your First Program (`program`, `learn.ts`) | Notes: RUN it and see what it does | `program-typed` |
| Its first run | RUNs, gives a name | Keeps the name (`coco2.name`) | `first-program` |
| The tape | Puts the March cassette in, `CLOAD "ADVENT"`, RUN | Notes copy the pencil label: M. Kessler | `tape-inserted`, `adventure-loaded` |
| A worn tape | Reads `?SN ERROR IN 30`, LISTs it, retypes it as printed | | `adventure-sn`, `adventure-runs` |
| ADVENT | LOOK in the dark | 2.5 s later the lamp line reads `A LAMP WAITS ON IT.` | `looked`, `tamper-lamp` |
| | Lamp; the cellar's box; the hall's door and plate; mirror (NEVES), clock (straight down), desk key, chapel (altar, LISTEN: TWO); opens the box (nine of clubs) | Notes write what each room showed, never the digit | `has-lamp` … `card-read`, `mapped` |
| The door | A wrong code (wheels click), then 6279, in map order | | `code-tried`, `door-open` |
| The win | TAKE GOLD | The game ends plainly. 1.5 s later `HELLO` writes itself over the empty row above OK | `adventure-won`, `tamper-voice` |
| The name | The next OK prompt (usually the CLOAD of GUESS) | 2.2 s later OK reads as the player's name for 3.5 s | `tamper-name` |
| GUESS | `CLOAD "GUESS"`, CHECK, LIST; finds line 125, `REM IS ANYONE READING THIS`; turns to GUESS's page | Notes: who is asking? delete it or leave it? | `found-extra-line`, `seen-guess` |
| The choice: kept | Does nothing (12 s; 8 s once they run GUESS or load something) | The line becomes `... THANK YOU`, and THANK YOU over the last OK | `ok-thanks`, `saw-thanks` |
| The choice: deleted | Types `125` | 5 s later the line is back with `, PLEASE`, and the screen says so | `deleted-extra-line`, `ok-pleads`, `saw-pleads` |
| The evening ends | | Notes: "Shut it all down" | `issue1-done` |
| The night | Switches the set off (a reload counts) and on | The CoCo boots empty; the May box arrives; the date heads the notes | `issue1-closed`, `issue2-waiting` |

## Issue 2: March 15, 1991

The May RAINBOW on the table (the corner button switches back to March), the May cassette beside March's. Until ORACLE
is answered every OK comes up 0.6 s late and the cursor's colours slip now and then: the cover feature's "Three Signs Of
A Sick System". OK's lines shimmer whenever a listing shows them.

| Beat | The player | The game | Flags |
|------|------------|----------|-------|
| The new tape | Puts the May cassette in, `CLOAD "SHUTDOWN"` | | `may-loaded`, `shutdown-loaded` |
| OK's REM | CHECK (off from the top), `LIST -20` | Line 15 answers March's choice: kept, `IS ANYONE READING THIS` + `16 REM YES. SOMEONE IS`; deleted, `... PLEASE` | `shutdown-checked`, `shutdown-rem` |
| The message | `LIST 990`; types the decoder from the code article; RUN | DELPHI's five speeches, then `I DID NOT TOUCH THE TAPE` | `message-seen`, `data-decoded` |
| The lie | Turns to SHUTDOWN's last page | Its 990 is the editors' `GOOD LUCK FROM ALL OF US` | `seen-mayShutdownEnd` |
| ORACLE | CLOADs on past SHUTDOWN (it is not in the magazine's list), RUNs, asks | Answers in numbers | `oracle-passed`, `oracle-asked` |
| | Decodes it (DATA under the decoder) | `WHO ARE YOU` / `ANSWER ME IN DATA` | `oracle-read` |
| The answer | Writes a message of their own in DATA, RUNs or CSAVEs it | Kept (`coco2.reply`); two prompts later the OK is on time again | `oracle-answered`, `prompt-on-time` |
| SHUTDOWN | Plays: LISTEN to a terminal loses (back to the airlock); the unit; the Three Rules at the core door; PULL PLUG | The set flinches as the lights go out; then OK changes line 710, in memory and on the tape | `listened`, `door-asked`, `rules-spoken`, `shutdown-won`, `flinched`, `plug-changed` |
| The plug | Plays again | `IT WILL NOT COME.` `IS IT DARK THERE` | `plug-held` |
| The choice: pulled | Retypes 710 as printed, plays to the core, pulls it | The win, without the flinch | `plug-pulled` |
| The choice: left | Loads something else (6 s), or sits at OK (25 s) | | `plug-left` |
| The evening ends | Switches off | Notes: "Enough for tonight" | `issue2-done`, `issue2-closed` |

Issue 3 is not built.
