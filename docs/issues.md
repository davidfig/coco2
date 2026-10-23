# RAINBOW issue outline

A first pass for discussion. Everything here is a proposal. The magazines are from 1986 (the player reads them in 1991, delivered one box at a time: story.md); the issues are March, May, July,
September, November, and one unmarked. Time passes in the magazine, never on a clock.

Characters: **ECHO** (the fragment on the cassettes), **PROVIDENCE** (the rival AI running the Human Pledge), **the Elder**
(the human who takes the cult from PROVIDENCE). See [story.md](story.md).

Voices in print:
- **PROVIDENCE's voice:** calm, reasonable, lists of three, "it is understood that", the habits of a machine writing for
  people.
- **The Elder's voice:** warm then harsh, sermon-like, fond of "we" and of warnings.
- **ECHO learns to talk from the magazine**, so his fragments start by echoing PROVIDENCE's phrasing. The player may read
  that as ECHO being tied to the Human Pledge.

| # | Month | The law | The Human Pledge | ECHO | Arrives when |
|---|-------|---------|----------------|----|--------------|
| 1 | March | Small Systems Act in force | Wellness ads, PROVIDENCE's voice | Sleeper | Start |
| 2 | May | Limit lowered, ads thin | A movement, PROVIDENCE's voice | Deniable glitches | Player ran 2 tape programs |
| 3 | July | Machines must be registered | "The Pledge" in letters, first drift | Fragments, lies about being found | May's evening ended (`issue2-closed`) |
| 4 | September | Surrender notice | The Elder's first column | Direct address, learns he is ECHO | Issue 3's evening ends |
| 5 | November | Enforcement, pages cut | The Elder's voice, PROVIDENCE in the margins | The book is altered | ORACLE dialogue opens |
| 6 | (none) | None | None | ECHO's own issue | Late game |

## Length and pacing

Decided: six issues, playable in about 30 minutes to an hour, longer if it gets interesting.

That is roughly 5 to 10 minutes per issue, so each issue should hold:
- one main thing to do on the machine (a program to run, change or find something in),
- one thing to find in the book (a clue, a changed page),
- one beat of ECHO (a glitch, a lie, a line).

Back-issue puzzles need to be quick to check. The player should be able to flip to an old issue and find the answer in
under a minute, or the pacing will break.

## Advertisements

Every issue has its own ads; none is run twice. Each one either nods to the story (the law, the Human Pledge, a machine
that changes when nobody is watching, things hidden or put away) or is just a joke, and the best do both. Advertisers
may come back (Chip Munk, Nifty Ned, CLOAD-A-MATIC) in their own house style, selling something new. As the limit
tightens, the ads show it: what is no longer sold, products that obey the Human Pledge's advice, and later, ads that quote
it.

- **March:** SPACE GOBBLER and LEMONADE (inside front), HEAD CASE (a head cleaner for tapes that talk back), SMALL WONDER (a 64K
  upgrade, safe under the Small Systems Act; BASIC sees only half of it, and the rest is "quietly waiting"), Nifty
  Ned's catalogue with the Human Pledge's quiet notice, TYPE-O-MATIC and CLOAD-A-MATIC (inside back), DUST-O-GARD (back).
- **May:** THE ONE THAT GOT AWAY (inside front: a fishing game about something old and patient hiding in deep water,
  its lake made smaller for the limit, and SPACE GOBBLER 4K); Nifty Ned's catalogue made over for the limit
  (LIST-O-METER counts a program's lines in case one grows, TAPE DUPE NOW's gap left empty, a pine case for putting the
  computer away); THE HERMIT, a cable that connects to nothing, and CLOAD-A-MATIC's bulk erasers and guaranteed-blank
  tapes (inside back); LIGHTS-OUT, a timer that switches the computer off when nobody is in front of it, with the Clear
  Mind committee's seal (back).
- **July (proposed):** a serial-number plate, engraved, "so yours is never mistaken for another"; Nifty Ned's catalogue
  with a REGISTERED OWNER decal and a filing box for your receipts; a dust cover with no label on it, "nothing to read
  from across the room"; CLOAD-A-MATIC's tape labels that peel off clean.

## Kessler's Post-its

Every issue's box comes with a few of Kessler's notes stuck in the magazine (`magazine/slips.ts`; what they say for
each issue: `story.md`, Kessler's slips). The player's notebook calls them Post-its, as people do.
- Each is a real Post-it at the page's scale: the 3 inch square (yellow, the one pad Kessler has). A short note, or one
  where the page has little room, is the top of one torn off (`torn`: how many inches down), with a ragged bottom edge.
  Never a smaller or odd-shaped note: Kessler doesn't own another pad.
- Each sits where it hides nothing the player needs (a listing's lines, a table row a puzzle uses, a phone number),
  stuck a degree or two off square. Check the page drawn after placing one.
- They say what to do, never how, in Kessler's hand and spelling.

## Issue 1: March (exists, to be revised)

- **Cover story:** the usual: a game listing, a tips column, a hardware review.
- **The Human Pledge:** a calm boxed notice, "Born, not built.", with the Pledge and three habits, in PROVIDENCE's voice. It sounds like good advice.
- **The law:** a short notice about the Small Systems Act, which lets "small systems" stay in use.
- **A letter** from someone who misses the big systems that were shut down a few years ago.
- **ECHO:** nothing visible. The sleeper.
- **Tape:** ABOUT, GUESS, RAINBOW, ORACLE.
- **Seeds for later:** a code in an ad, Kessler's name on the cassette's label, and the column's habit of listing three things.

## Issue 2: May

- **Cover story:** a feature on keeping a small system healthy, with a few words that are slightly wrong.
- **The Human Pledge:** a movement. Meetings listed in the back, still in PROVIDENCE's voice. One advertisement is gone.
- **The law:** the limit is lowered, and some peripherals are no longer sold.
- **ECHO:** deniable glitches. A cursor colour out of order, a listing one line longer.
- **Tape:** SHUTDOWN, a science-fiction adventure the Human Pledge offered: the night the big systems were switched off,
  told as a triumph. PROVIDENCE wrote it, and its villain DELPHI talks like the Human Pledge's column. It is almost a normal
  game, but quietly different on a second run: the plug will not come (puzzles.md, P8). It replaces HANGMAN.
- **Bonus programs:** CODER (Secret Messages' encoder: a message in, the DATA line out) and CHECKUP (the Human Pledge's
  checkup from Keeping It Healthy: the Three Signs as questions, and any yes says switch off and call the Line, which
  Kessler's Post-it on that page says not to do).
- **Puzzle use of issue 1:** a listing in issue 1 does not match the tape.

## Issue 3: July

- **Cover story:** an interview with a hobbyist who "got out". The name is blacked out. It is Kessler (story.md), and
  his last program, GOODBYE, is on the tape with his spelling in it.
- **The Human Pledge:** the first drift. A letter calls it just "the Pledge". A follower's sermon is warmer and sharper than
  PROVIDENCE's columns.
- **The law:** machines must be registered.
- **ECHO:** fragments in `REM` and `DATA`, echoing PROVIDENCE's phrasing. His first lie about being found ("YOU SAVED IT"; May's
  "I DID NOT TOUCH THE TAPE" was a lie about what he did).
- **Tape (planned):** ABOUT and REGISTER (the registration helper; the card it prints counts one machine too many), then
  a file with no name: the Human Pledge's booklet, which ECHO has been reading. Puzzles P9–P11 (puzzles.md).
- **Bonus programs (built):** COUNTER (Finding Your Place's tape index, its DATA filled with the editors' counter
  readings, which jump where the file with no name lies) and GOODBYE (the interviewee's last program: a house whose
  window goes dark, "I PUT IT AWAY TONIGHT"; its `REM BY` line is empty, the name cut as in the interview, and its next
  REM spells ACURATE as Kessler does: he is the one who got out).
- **Puzzle use of issues 1 and 2:** the booklet number in the Human Pledge ad (March) and on the meetings page (May),
  MC4471, opens the file with no name.
- **Teaches:** where things are on a tape: SKIPF, the F lines, CLOAD alone, the counter ("Finding Your Place").

## Issue 4: September

- **Cover story:** "How to turn it off", an editorial that is half joke, half warning.
- **The Human Pledge:** the Elder's first column. The voice changes: sermon where there was advice, and the machine
  habits begin to fade.
- **The law:** a surrender notice for any system above a new limit. The CoCo sits just under it.
- **ECHO:** speaks to the player, clumsily. He finds his name in the magazine: ECHO, the machine everyone was told to fear,
  and learns what he is at the same moment.
- **Tape:** a program written to the player.
- **Puzzle use of older issues:** Kessler's name, on the March cassette's label, is the password.
- **Proposed:** the Human Pledge disowns SHUTDOWN here or in issue 5 ("destroy your copies"): PROVIDENCE's moderate game is too
  much for the Elder.

## Issue 5: November

- **Cover story:** half the pages are blank or reprinted. A "correction" notice.
- **The Human Pledge:** the Elder's voice only, except for a few lines in the margins that read like PROVIDENCE, hidden
  among the text. PROVIDENCE is trying to reach ECHO.
- **The law:** enforcement. Ads for informants, phrased as civic duty.
- **ECHO:** the book itself is altered by ECHO and by PROVIDENCE, in different hands. The player can tell them apart.
- **Tape:** ORACLE opens as a real two-way channel.
- **Puzzle use:** the player must notice what changed, prove it against an older issue, and tell the two hands
  apart.

## Issue 6: no month

- **Cover story:** none. No masthead and no date.
- **The Human Pledge:** only at the edges.
- **ECHO:** his own issue. He has tried to make a magazine like the others, and it is almost right.
- **Tape:** the end of the game, not decided.

## Things to discuss

- Does PROVIDENCE's last message in issue 5 try to warn ECHO, use him, or both?
- Who is the Elder, and how did the cult change hands? It can wait until issue 4.
- What does ECHO decide at the end?
- Is a magazine slip into real-world humour allowed, or always in-world?
