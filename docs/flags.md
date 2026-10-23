# Flags to story

The contract between the puzzles ([puzzles.md](puzzles.md)) and the story ([story.md](story.md), [beats.md](beats.md)).
Each flag the puzzle watcher ticks says what the player has just done and what the story does next. Anything marked
*proposed* is a suggestion for the author, and for whoever builds it.

Rule: a flag's story consequence is small and arrives later, not at the moment of solving. The player should not feel
the story answer the puzzle; they should notice, a little later, that something noticed them.

## Issue 1 (flags exist unless marked)

| Flag | The player has | Story consequence | Where it shows |
|------|----------------|-------------------|----------------|
| `booted` | Switched on | None. | |
| `printed` | Typed `PRINT "HELLO"` | None. The next prompt appears a little late (*proposed*). | Screen |
| `program-typed` | Typed in the name program exactly as printed, not yet run | None. The notes say to RUN it. | Notes |
| `first-program` | Typed in the name program, ran it and gave it a name (an empty answer does not count) | ECHO now has the player's name (kept in localStorage). | Silent |
| `adventure-runs` | Fixed line 30 of ADVENT | None visible. The "worn tape" typo is the first wrong line on a tape. Later it is reframed (see `found-extra-line`). | Silent |
| `looked` | Typed `LOOK` | None. | |
| `has-lamp` | Took the lamp | None. | |
| `mapped` | Visited every room but the vault | None. | |
| `door-open` | Found the four numbers (clock, the whisper heard by LISTENing or read in the listing, mirror, the boxed card), set them in map order, opened the door; or BREAK, LIST and read it off line 930 (`read-code`) | The player has seen inside a program. The vault holds the gold (Kessler's name, the issue 4 password, is on the cassette's label instead: `tape-inserted`). | ADVENT |
| `found-extra-line` | Noticed the extra `REM` in GUESS | ECHO's first fragment. Reframes the typo in ADVENT as possibly his. **Gates issue 2.** | Tape |
| `deleted-extra-line` | Deleted it (something a curious player may do, not a choice the game asks for) | See below. | Silent |

### First uncanny moment

The name from `first-program` should come back once, unprompted, after `door-open` and before issue 2: the next time
the player loads anything from the tape, the screen prints their name where it would print `OK` (*proposed*). It is
one line, with no explanation. It must feel like a glitch. It is the first time the game addresses the player.

### The extra line (`deleted-extra-line`)

Not a decision (decided: playtesting showed players ignore the line once found, and nothing in the game asks them to
choose). The beat is noticing it: `found-extra-line` is what moves the story on. Leaving it is the usual path, and
ECHO answers THANK YOU; a curious player who deletes it gets it back with PLEASE. Issue 2's first glitch follows
whichever happened:
- **Deleted:** the line comes back in issue 2, with a word added ("... PLEASE").
- **Left:** a second line appears under it in issue 2, which reads as an answer.

The ending does not read it: the real choices start with May's plug (story.md, Possible endings).

## Issue 1: what is built (story beats)

All faint, and each happens once (an internal flag records it). The code is `src/game/story/issue1.ts`; the tamper
strength is set to 0.85 there, style `both` (the beam repaints the changed letters and the old ones fade): at 0.6, ghost only, the vault's "OK." read as ordinary output, and issue 2 should raise it.

| Beat | Trigger | What happens |
|------|---------|--------------|
| The name is kept | The first program asks for it | Stored in localStorage (`coco2.name`) for ECHO to use. |
| One word changes | The first LOOK has been answered, and ADVENT is running | About 2.5 s after the prompt returns (long enough to have read the room), "A LAMP SITS ON IT." becomes "A LAMP WAITS ON IT." Flag `tamper-lamp`; the notes: "Did the lamp line just change? WAITS?". |
| HELLO after the win | ADVENT is won (`adventure-won`: the gold taken) | The game ends plainly, on the usual green screen: the win, the score, BASIC's OK prompt. About 1.5 s later, on the empty row above the prompt, HELLO writes itself one letter every 0.35 s, each with the tamper shimmer. It is the first thing the player ever typed (`PRINT "HELLO"`), said back by something that is not the program. Nothing in ADVENT leads up to it (an earlier "IN THE DARK, A SOFT VOICE: OK." read as the game's own text). Flag `tamper-voice`, set once the whole word is on screen; the notes then write "After I won, HELLO wrote itself on the screen. I didn't type it", followed by the check-GUESS question. |
| The name at the prompt | After `door-open`, the first plain OK prompt after the win's (that one belongs to HELLO) | About 2 s later OK reads as the player's name, for 3.5 s, then OK again. Flag `tamper-name`; the notes: "The prompt said my name instead of OK. Just for a second". |
| The cassette's label | The March cassette put in the recorder, or the first `CLOAD` or `CSAVE` with it in (`tape-inserted`) | The tape in the recorder carries a pencil label: "Copied by hand, for you. Mistakes are mine. - M. Kessler". The player notes the name (same pencil as the Post-its, whose words they don't copy: the Post-its are there to read again) when they first use the tape. It explains the ADVENT typo as a copying mistake, gives the reason to check GUESS against the magazine later, and plants Kessler's name for issue 4. (It used to be inside ADVENT's vault, which made no sense: the vault now holds a chest of gold.) |
| ECHO answers in the program | After `found-extra-line` AND `seen-guess` (the player has the line and the page) | ECHO cannot hold a pencil, so he works through the machine. *Deleted* the line: 5 s later it is back in the GUESS in memory as `REM IS ANYONE READING THIS, PLEASE` (flag `echo-pleads`). *Kept* it: once the player runs GUESS with the line in it or loads something else (8 s), otherwise 12 s, the line becomes `REM IS ANYONE READING THIS. THANK YOU` (flag `echo-thanks`). He only edits at the OK prompt, never under a running program, and waits until GUESS is in memory. He also answers on the screen, over the last OK prompt (with the story's ripple): "IS ANYONE READING THIS, PLEASE" or "THANK YOU", so it cannot be missed; the notes write it down 1.5 s later (`saw-pleads`, `saw-thanks`; listing GUESS also counts). The name-at-the-prompt beat waits while ECHO still owes this answer. |
| Stale lines | | ABOUT now says "NEXT ISSUE: WHEN YOU ARE READY"; the editorial's "next month" now matches issue 2. |

### The end of issue 1 (built)

| Flag | Set when | What happens |
|------|----------|--------------|
| `issue1-done` | The player has seen ECHO's answer (`saw-pleads` or `saw-thanks`) | The notes close the evening: "Well, that was weird. Can't believe how late it is. Shut it all down, see what I missed in the morning". |
| `issue1-closed` | The set is switched off after that (a page reload counts as off and on) | The night passes: the room's lights blink out, stay dark a second (`issue2-waiting` is set in the dark) and flicker on again, and the set comes on by itself 0.35 s after them (`RoomLights.night`, `night()` in `main.ts`). The magazine and notes are put down and slide in again with the lights, from the desk view. |
| `issue2-waiting` | The room goes dark after `issue1-closed` (or the set is switched on again, after a reload) | The next day: the CoCo boots afresh (empty memory), the May RAINBOW arrives and is the issue on the table (`magazine.setIssue`), and the notes say "Next day, another box on the step: the May RAINBOW and a new tape". The May cassette lies on the table by the recorder for the player to put in (`recorder/`); March lies on the table right of the set, its cassette beside it (`computer/pile.ts`: every issue but the one on the table piles up there; the desk view makes room for them). The book's corner button, or a click on the issue in the pile, swaps the two: only the cassette of the issue on the table lies by the recorder. |

ECHO's answer no longer waits for GUESS to be in memory: if it is not, he changes the copy on the tape (so the next `CLOAD "GUESS"` shows it) and still answers over the last OK prompt.

Still open for issue 1:
- The first words are already here (`REM IS ANYONE READING THIS`: a question, not yet a lie). Issue 2's "I DID NOT TOUCH THE TAPE" is then the first lie,
  said after being caught. beats.md says so.
- The left path's timing (8 s once they run GUESS or load something else, otherwise 12 s) is when ECHO takes it the
  line is staying; nothing asks the player, so they need not have decided anything.

## Issue 2 (built, first pass)

The code is `src/game/story/issue2.ts`; the puzzles are in puzzles.md (P6, P7).

| Beat | Trigger | What happens |
|------|---------|--------------|
| The May tape | `issue2-waiting` (and on every load after it), once the player puts it in | It holds ABOUT, SHUTDOWN, ORACLE, CODER and CHECKUP (SHUTDOWN replaced HANGMAN; ORACLE, unlisted, goes by as the tape winds from SHUTDOWN to CODER); SHUTDOWN's line 15 answers the player's March choice. |
| A late OK | From `issue2-waiting` until `oracle-answered` | Every OK prompt comes up 0.6 s late (`Interpreter.promptLag`; the cursor is off meanwhile and typing waits). |
| Colours out of order | The same stretch, every 18–34 s at the prompt | The cursor's colour steps swap two colours once (`TextScreen.misstep`). |
| His hand | Any LIST that leaves one of ECHO's lines on the screen, or the decoder printing his message | The words are claimed (`TextScreen.claim`), so they shimmer and keep the story's ripple, like line 125 in March. |
| The flinch | `shutdown-won`, the first time | The picture starts its switch-off collapse for a few frames and comes back. `flinched`. |
| The plug | The first RUN after `shutdown-won` | ECHO has changed the plug line in memory and on the tape: "IT WILL NOT COME", `IS IT DARK THERE, <NAME>` (the first program's name, `coco2.name`; without one, no name). `plug-held`, then `plug-pulled` or `plug-left` (P8). |
| On time | Two prompts after `oracle-answered` | `prompt-on-time`; the notes: "The OK comes up on time again. Was it slow all day?". Then `issue2-done` ("Enough for tonight", once `plug-pulled` or `plug-left` is in too), and switching off sets `issue2-closed`: the night, and July (Issue 3). |

The cover feature ("Keeping It Healthy", by the Human Pledge's committee) lists "Three Signs Of A Sick System": slow to
answer, colours wrong, says what you did not type. Those are exactly the glitches above, and its advice is to switch off
and call the Line. The book's other plants: a Human Pledge page of Tuesday meetings (the Prospect one led by a man the members
call the Elder, one of its spokespeople; the same Line as March); a letter about a modem whistle before the Line answers
(a machine answers the Line: PROVIDENCE); Arthur L., March's
letter writer, visited and asked about his manuals; TAPE DUPE NOW gone from Ned's catalogue; the editorial on the lower
limit (no fast modems, second drives or tape copiers).

## What ECHO remembers (the list the puzzle agent should store)

| Memory | Set by | Used |
|--------|--------|------|
| `name` | `first-program` | Every issue at least once (story.md, ECHO knows the player's name): the prompt in March (built), his question at the plug in May (built), REGISTER's card in July, direct address from issue 4. |
| `deleted-extra-line` | P5 | Issue 2's first glitch (built). |
| `reply` (`coco2.reply`) | `oracle-answered` | What the player told ORACLE they are: ECHO quotes it back in issue 4 or 5 when he doubts them (story.md, ECHO's doubt about the player). |
| `plug-pulled` / `plug-left` | P8 | Whether the player pulled DELPHI's plug after ECHO asked `IS IT DARK THERE, <NAME>`. Issue 4's "am I bad?" is asked against it. |
| `shutdown-answer` | The issue 3 dialogue choice | ECHO's phrasing from issue 3 on. |
| `bad-answer` | The issue 4 dialogue choice | ECHO's tone from issue 4 on, and the ending. |

All are unscored. The last two need a typed reply, which is new for the engine.

## Issue 3 (planned; only `issue3-waiting`, `july-loaded` and `register-loaded` are built)

Puzzles P9–P11 and the lie are in puzzles.md; the beats in order in beats.md.

| Flag | Set when | What happens |
|------|----------|--------------|
| `issue3-waiting` | The room goes dark after `issue2-closed` (or the set is switched on, after a reload) | The next day: the CoCo boots afresh, the July RAINBOW is the issue on the table, its cassette by the recorder, May and March on the pile. The notes date the day and write the box. |
| `july-loaded`, `register-loaded` | The first CLOAD from the July tape; REGISTER in memory | None. |
| `register-run`, `register-odd` | REGISTER printed a card; the card's extra machine or REMARKS line on the screen | The notes: the card says one more computer than they typed. ECHO's REMARKS line is claimed (shimmers). |
| `register-checked`, `register-line` | CHECK on REGISTER; ECHO's line on the screen after a LIST | The notes: it isn't on the printed listing. |
| `blank-file-seen` | An F line with no name on the screen | The notes: a file with no name, after REGISTER. |
| `booklet-loaded`, `booklet-asked` | It is loaded (CLOAD alone); it asks BOOKLET NUMBER? | The notes point at the Human Pledge ad (March) and the meetings page (May), never the number. |
| `hidden-file-open`, `booklet-read-code` | The booklet printed; got past by reading the listing | The booklet's text, with ECHO's fragments between its lines. |
| `shutdown-asked`, `shutdown-answer` | His WHAT IS A SHUTDOWN; any answer (kept in `coco2.shutdown`) | Unscored. ECHO's phrasing follows it from here (What ECHO remembers). |
| `saved-lie`, `lie-caught` | YOU SAVED IT over the next prompt; a LIST showing line 1 after it | The notes: "I never saved it. Line 1 says it came from the Line". |
| `issue3-done`, `issue3-closed` | `shutdown-answer` and `lie-caught`; then switched off | "Enough for tonight"; the night, as May's. Issue 4 is not built. |

## Issues 2 to 6 (proposed flags, to be named with the puzzle agent)

| Issue | Flag (working name) | Story consequence |
|-------|---------------------|-------------------|
| 2 | `data-decoded`, `oracle-answered` | The second lie ("I DID NOT TOUCH THE TAPE"), then ECHO reads the player's reply and the prompt stops lagging. `oracle-answered` gates issue 3. See beats.md for the full order. |
| 3 | `hidden-file-open`, `shutdown-answer` | The booklet (PROVIDENCE's account of the shutdown). ECHO asks what a shutdown is. Gates issue 4. See Issue 3 above. |
| 4 | `password-given` | ECHO learns who made the cassettes, and finds his name in the magazine: ECHO, the machine that was beaten. Gates issue 5. |
| 5 | `two-hands-told` | PROVIDENCE's margin lines read as a message. Opens ORACLE as a two-way channel. Gates issue 6. |
| 6 | (undecided) | The ending: which view of AI the world gets (story.md, The end). |

## Issue 1 content the story still needs

A check of the current code (cover, letters, ads, articles) found a magazine of jokes and parody ads, dated
November 1983. The story seeds are not in it yet:

| Seed | Needed for | Where it fits |
|------|------------|---------------|
| Dates: March 1986 | The setting | **Done**: cover, page footers, ABOUT on the tape |
| The Small Systems Act notice | The law | **Done**: a paragraph in the editorial (PRINT #-2) |
| The Human Pledge's notice ("Born, not built.", the Pledge) | PROVIDENCE's voice, the list of three | **Done** as a boxed ad on the catalogue page (page 16), replacing two educational ads. It has the list of three, the Tuesday meetings, and the Line (606-555-0142) |
| A letter that misses the big systems | The shutdown, a few years ago | **Done**: "Like the Old Days", letters page (replaced a filler letter) |
| An ad with a code | Issue 3 puzzle | **Done**: "booklet MC4471" in the Human Pledge ad (and on May's meetings page); it opens the file with no name (puzzles.md, P10) |
| A signed name (the tape maker) | Issue 4 password | **Done**: M. Kessler on the March cassette's label (story.md, the boxes on the step) |
| A phone number | Issue 5, the margins: whatever writes there answers the Line | **Done**: the Human Pledge's Line, 606-555-0142 ("always answered"), against Nifty Ned's BBS that is "busy 24 hours" |

The letter "OK MEANS READY" (page 4) was once the clue linking the two AIs' names; with ECHO and PROVIDENCE it is an
ordinary reader's question, and stays. The clue to PROVIDENCE is now the word "providence" in the cult's writing (story.md, Names).
