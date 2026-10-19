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
| `first-program` | Typed in the name program, ran it and gave it a name (an empty answer does not count) | OK now has the player's name (kept in localStorage). | Silent |
| `adventure-runs` | Fixed line 30 of ADVENT | None visible. The "worn tape" typo is the first wrong line on a tape. Later it is reframed (see `found-extra-line`). | Silent |
| `looked` | Typed `LOOK` | None. | |
| `has-lamp` | Took the lamp | None. | |
| `mapped` | Visited every room but the vault | None. | |
| `door-open` | Found the four numbers (clock, the whisper heard by LISTENing or read in the listing, mirror, the boxed card), set them in map order, opened the door; or BREAK, LIST and read it off line 930 (`read-code`) | The player has seen inside a program. The vault holds a note signed by the person who made the cassettes (*proposed*, plants the issue 4 password). | ADVENT |
| `found-extra-line` | Noticed the extra `REM` in GUESS | OK's first fragment. Reframes the typo in ADVENT as possibly his. **Gates issue 2.** | Tape |
| `deleted-extra-line` | Deleted it (a choice, not a flag to earn) | See below. | Silent |

### First uncanny moment

The name from `first-program` should come back once, unprompted, after `door-open` and before issue 2: the next time
the player loads anything from the tape, the screen prints their name where it would print `OK` (*proposed*). It is
one line, with no explanation. It must feel like a glitch. It is the first time the game addresses the player.

### The extra line (`deleted-extra-line`)

Not scored. OK remembers which the player chose, and issue 2's first glitch reflects it:
- **Deleted:** the line comes back in issue 2, with a word added ("... PLEASE").
- **Kept:** a second line appears under it in issue 2, which reads as an answer.

Neither is better. The first reads as stubborn, the second as friendly, and the player may suspect either of being
the manipulation the cult warns about.

## Issue 1: what is built (story beats)

All faint, and each happens once (an internal flag records it). The code is `src/game/story/issue1.ts`; the tamper
strength is set to 0.85 there, style `both` (the beam repaints the changed letters and the old ones fade): at 0.6, ghost only, the vault's "OK." read as ordinary output, and issue 2 should raise it.

| Beat | Trigger | What happens |
|------|---------|--------------|
| The name is kept | The first program asks for it | Stored in localStorage (`coco2.name`) for OK to use. |
| One word changes | The first LOOK has been answered, and ADVENT is running | About 2.5 s after the prompt returns (long enough to have read the room), "A LAMP SITS ON IT." becomes "A LAMP WAITS ON IT." Flag `tamper-lamp`; the notes: "Did the lamp line just change? WAITS?". |
| HELLO after the win | ADVENT is won (`adventure-won`: the gold taken) | The game ends plainly, on the usual green screen: the win, the score, BASIC's OK prompt. About 1.5 s later, on the empty row above the prompt, HELLO writes itself one letter every 0.35 s, each with the tamper shimmer. It is the first thing the player ever typed (`PRINT "HELLO"`), said back by something that is not the program. Nothing in ADVENT leads up to it (an earlier "IN THE DARK, A SOFT VOICE: OK." read as the game's own text). Flag `tamper-voice`, set once the whole word is on screen; the notes then write "After I won, HELLO wrote itself on the screen. I didn't type it", followed by the check-GUESS question. |
| The name at the prompt | After `door-open`, the first plain OK prompt after the win's (that one belongs to HELLO) | About 2 s later OK reads as the player's name, for 3.5 s, then OK again. Flag `tamper-name`; the notes: "The prompt said my name instead of OK. Just for a second". |
| The cassette's label | The first `CLOAD` or `CSAVE` (`tape-inserted`) | The tape in the recorder carries a pencil label: "Copied by hand, for you. Mistakes are mine. - M. Kessler". The player notes it down when they first use the tape. It explains the ADVENT typo as a copying mistake, gives the reason to check GUESS against the magazine later, and plants Kessler's name for issue 4. (It used to be inside ADVENT's vault, which made no sense: the vault now holds a chest of gold.) |
| OK answers in the program | After `found-extra-line` AND `seen-guess` (the player has the line and the page) | OK cannot hold a pencil, so he works through the machine. *Deleted* the line: 5 s later it is back in the GUESS in memory as `REM IS ANYONE READING THIS, PLEASE` (flag `ok-pleads`). *Kept* it: once the player runs GUESS with the line in it or loads something else (8 s), otherwise 12 s, the line becomes `REM IS ANYONE READING THIS. THANK YOU` (flag `ok-thanks`). He only edits at the OK prompt, never under a running program, and waits until GUESS is in memory. He also answers on the screen, over the last OK prompt (with the story's ripple): "IS ANYONE READING THIS, PLEASE" or "THANK YOU", so it cannot be missed; the notes write it down 1.5 s later (`saw-pleads`, `saw-thanks`; listing GUESS also counts). Before that, the notes offer the choice: "Delete it (type 125)? Or leave it?". The name-at-the-prompt beat waits while OK still owes this answer. |
| Stale lines | | ABOUT now says "NEXT ISSUE: WHEN YOU ARE READY"; the editorial's "next month" now matches issue 2. |

### The end of issue 1 (built)

| Flag | Set when | What happens |
|------|----------|--------------|
| `issue1-done` | The player has seen OK's answer (`saw-pleads` or `saw-thanks`) | The notes close the evening: "Well, that was weird. Can't believe how late it is. Shut it all down, see what I missed in the morning". |
| `issue1-closed` | The set is switched off after that (a page reload counts as off and on) | The night passes. |
| `issue2-waiting` | The set is switched on again | The next day: the CoCo boots afresh (empty memory), the May RAINBOW arrives and is the issue on the table (`magazine.setIssue`), and the notes say "Next day, another box on the step: the May RAINBOW and a new tape". The May tape goes into the recorder (`Issue2Story`). The book's corner button switches between March and May. |

OK's answer no longer waits for GUESS to be in memory: if it is not, he changes the copy on the tape (so the next `CLOAD "GUESS"` shows it) and still answers over the last OK prompt.

Still open for issue 1:
- The first words are already here (`REM IS ANYONE READING THIS`: a question, not yet a lie). Issue 2's "I DID NOT TOUCH THE TAPE" is then the first lie,
  said after being caught. beats.md says so.
- The kept path is a guess at when a player has decided: running GUESS or loading something else (8 s), otherwise 12 s.
  A real player may sit and think for longer. Playtesting should check it.

## Issue 2 (built, first pass)

The code is `src/game/story/issue2.ts`; the puzzles are in puzzles.md (P6, P7).

| Beat | Trigger | What happens |
|------|---------|--------------|
| The May tape | `issue2-waiting` (and on every load after it) | The recorder holds ABOUT, HANGMAN and ORACLE; HANGMAN's line 15 answers the player's March choice. |
| A late OK | From `issue2-waiting` until `oracle-answered` | Every OK prompt comes up 0.6 s late (`Interpreter.promptLag`; the cursor is off meanwhile and typing waits). |
| Colours out of order | The same stretch, every 18–34 s at the prompt | The cursor's colour steps swap two colours once (`TextScreen.misstep`). |
| His hand | Any LIST that leaves one of OK's lines on the screen, or the decoder printing his message | The words are claimed (`TextScreen.claim`), so they shimmer and keep the story's ripple, like line 125 in March. |
| On time | Two prompts after `oracle-answered` | `prompt-on-time`; the notes: "The OK comes up on time again. Was it slow all day?". Then `issue2-done` ("Enough for tonight"), and switching off sets `issue2-closed`. Issue 3 is not built. |

The cover feature ("Keeping It Healthy", by the Clear Mind's committee) lists "Three Signs Of A Sick System": slow to
answer, colours wrong, says what you did not type. Those are exactly the glitches above, and its advice is to switch off
and call the Line. The book's other plants: a Clear Mind page of Tuesday meetings (the Prospect one led by the Elder, the
same Line as March); a letter about a modem whistle before the Line answers (the Elder's machine); Arthur L., March's
letter writer, visited and asked about his manuals; TAPE DUPE NOW gone from Ned's catalogue; the editorial on the lower
limit (no fast modems, second drives or tape copiers).

## What OK remembers (the list the puzzle agent should store)

| Memory | Set by | Used |
|--------|--------|------|
| `name` | `first-program` | The uncanny moment, then issue 4's direct address. |
| `deleted-extra-line` | P5 | Issue 2's first glitch (built). |
| `reply` (`coco2.reply`) | `oracle-answered` | Not used yet: what the player told ORACLE they are. |
| `shutdown-answer` | The issue 3 dialogue choice | OK's phrasing from issue 3 on. |
| `bad-answer` | The issue 4 dialogue choice | OK's tone from issue 4 on, and the ending. |

All are unscored. The last two need a typed reply, which is new for the engine.

## Issues 2 to 6 (proposed flags, to be named with the puzzle agent)

| Issue | Flag (working name) | Story consequence |
|-------|---------------------|-------------------|
| 2 | `data-decoded`, `oracle-answered` | The second lie ("I DID NOT TOUCH THE TAPE"), then OK reads the player's reply and the prompt stops lagging. `oracle-answered` gates issue 3. See beats.md for the full order. |
| 3 | `hidden-file-open` | The shutdown article. OK asks what a shutdown is. Gates issue 4. |
| 4 | `password-given` | OK learns who made the cassettes. He learns his name is OK. Gates issue 5. |
| 5 | `two-hands-told` | READY's margin lines read as a message. Opens ORACLE as a two-way channel. Gates issue 6. |
| 6 | (undecided) | The ending. |

## Issue 1 content the story still needs

A check of the current code (cover, letters, ads, articles) found a magazine of jokes and parody ads, dated
November 1983. The story seeds are not in it yet:

| Seed | Needed for | Where it fits |
|------|------------|---------------|
| Dates: March 1986 | The setting | **Done**: cover, page footers, ABOUT on the tape |
| The Small Systems Act notice | The law | **Done**: a paragraph in the editorial (PRINT #-2) |
| "Clear Mind, Clear Code" column | READY's voice, the list of three | **Done** as a boxed ad on the catalogue page (page 16), replacing two educational ads. It has the list of three, the Tuesday meetings, and the Line (606-555-0142) |
| A letter that misses the big systems | The shutdown, a few years ago | **Done**: "Like the Old Days", letters page (replaced a filler letter) |
| An ad with a code | Issue 3 puzzle | **Placeholder in place**: "booklet MC4471" in the Clear Mind ad. The puzzle agent may change it |
| A signed name (the tape maker) | Issue 4 password, found in the vault | ADVENT, not the letters page |
| A phone number | Issue 5, the Elder dialling in | **Done**: the Clear Mind's Line, 606-555-0142 ("always answered"), against Nifty Ned's BBS that is "busy 24 hours" |

One free clue already exists: the letter "OK MEANS READY" (page 4). It explains that the prompt means the machine is
ready. That is the link between OK and READY, set up before anyone knows READY exists. Keep it.
