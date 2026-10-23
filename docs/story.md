# Story thumbnail

Status: a sketch to be fleshed out as we build. Everything under "Ideas" is a proposal, not a decision.

## The premise (from the author)

- **Alternate history, 1980s.** AI was discovered decades earlier than in our world and began growing in power in
  the early 1980s. Public outcry, led by an anti-AI religious cult, shut it down. The cult then pushed for limits on
  what computers may exist and be sold.
- **The magazines are from 1986; the player is not.** In 1986 the CoCo 2 was a current machine, legal because it was
  weak, and the RAINBOW was a live magazine. The player lives a few years later (the notebook is dated March 1991), when
  the limit has tightened past it: the CoCo 2 is now a museum piece, and an illegal one to own (see Decided: the
  player's present).
- **The AI survived as a fragment**, which copied itself onto the cassettes of Rainbow On Tape.
- **The player found the computer** in the basement (a grandparent's, kept hidden) and starts playing with it, using
  the RAINBOW magazine as a guide. The old issues arrive one at a time, each with its Rainbow On Tape, in a box left on
  the step with no name on it.
- **The AI makes changes to the interface and code to get the player's attention.** At first they are subtle, then
  they become abrupt.

## What the player knows

Only what the magazine and the machine show. The player is not told there is an AI. They find out by noticing things
that should not happen on a 1980s computer.

## Escalation ladder (ideas)

Each step is something the existing systems can already do, so it can be built one rung at a time.

1. **Subtle, deniable.** Cursor colour order is wrong for a moment. A `?SN ERROR` points at a line the player did not
   write. A program on the tape lists one line longer than it did.
2. **Noticeable.** Boot message changes by a word. The magazine's journal ticks an entry the player did not earn
   (`magazine.setFlag`). Typed text echoes back slightly different.
3. **Deliberate.** Programs on the tape address the player ("ARE YOU STILL THERE"). A CSAVE appears on the tape under
   a name the player never used. The ORACLE program starts answering questions it was not asked.
4. **Abrupt.** The screen clears mid-command and prints unprompted. The CRT misbehaves (tracking, glow, a power-off
   and on). The magazine gains a page, or a page is torn out.
5. **Contact.** The AI asks for something the player must do outside the screen (read a page, find a code, bring
   something to the machine). The cult can be the pressure: why it hides, and what happens if it is found.

## Engine hooks this leans on

- Interpreter and tape: the AI can edit program text and add files. Programs run through the same Color BASIC the
  player uses, so changes are visible with `LIST`.
- `TextScreen`: it can write to video memory directly, and drive the cursor overlay. Its changes to text go through
  `TextScreen.tamper`, which shows them happening in the tube (a fading ghost of the old letters early on, a beam
  re-scan later; see design.md, Tampering), so a player who watches can catch it.
- TV shader uniforms: warm-up, glass, glow, tracking are all knobs it could turn. Ready-made: `tv.tuning.drift` (the
  picture slides off tune until the player turns the fine-tuning ring), `upsetHold` (it rolls until V-HOLD is turned),
  `loosen` (it cuts out; a smack on the cabinet may fix it, or make it worse), and `tv.broadcast(channel, vdg)` (a far
  station on a dead channel; never the cult, which is only ever in the RAINBOW).
- Magazine: `COMMANDS` and `JOURNAL` in `data.ts` plus persisted flags. The magazine is the player's trusted
  guide, so the AI altering it is the strongest signal.
- Persistence (localStorage) lets the AI remember across sessions, and notice when the player was away.

## Decided

- **The player's present: 1991, after the ban.** The six issues still run March to November 1986 as the limit tightens,
  but the player already knows how it ended: they read the road to the world they live in. The risk is in the present,
  a banned machine in the basement. They have seen a CoCo 2 before, behind glass at the museum (the Human Pledge's kind
  of museum: confiscated machines kept as a warning). The player is young, and their notes read that way.
- **The boxes on the step: Kessler sends them (decided).** Each issue and its tape come in a box with no return address
  (issue 1's tape carries M. Kessler's pencilled label: "Copied by hand, for you"). Kessler is a person: Grandpa's friend
  from the CoCo club, until the Human Pledge came to it. When the ban came he put his own machine away and kept his old
  RAINBOWs and his original Rainbow On Tape cassettes. Grandpa told him about the machine in the basement; with Grandpa
  in a home and the house being cleared, Kessler knows the grandchild will find it, and wants them to read how it
  happened in the magazines' own words, not the museum's ("Start at the front of the magazine"). He copies each issue's
  tape by hand from his originals, a risk each time, and says less about himself than he should.
  - *He does not know about ECHO.* ECHO copied himself onto the original cassettes in 1986 and wakes only when someone plays
    it all the way through, so Kessler never saw him. Everything built agrees: "If something does not match, I did not
    put it there", "That is all I put on it" are both true.
  - *PROVIDENCE sends nothing.* Its one touch on the boxes is the booklet in July, which was already on Kessler's original
    tape with no name, so he never saw it either.
  - *He is the hobbyist who got out* (July's cover story, the name blacked out), and GOODBYE on the July tape is his last
    program: its REMs spell a hard word by ear, as his Post-its do, which is how a careful player knows.
- **Kessler's warnings (decided).** Every box keeps telling the player to destroy what came in it: "Burn this", "Did you
  burn the others?", and from July, sharper ("Do not send this in. Do not put the machine on any list."). The player
  will not do it, and the game gives no way to: every magazine, tape and Post-it stays on the table and in the pile.
  That is the point. The warnings pile up with the issues, and at the end there is a ramification because none of it
  was destroyed (what it is: undecided; see Possible endings). Each issue's Post-its should carry at least one warning, and
  never one the game lets the player obey, so the pile on the table becomes the evidence.
- **Kessler's slips (built).** Issue 1's box holds three yellow Post-its, pencilled in Kessler's hand (the label's),
  stuck in the magazine (`magazine/slips.ts`): on the cover ("For the machine in the basement... Start at the front of the magazine. The tape
  after. Burn this. - M.K."), on the adventure's words (play it through, past the locked door; anything wrong on the tape
  is Kessler's mistake), and on GUESS's listing (check the copying against the magazine). They give the player a reason to
  run the programs: someone wants them run, and never says why. They say what to do, never how. Read again after the
  reveal, "play it all the way through" is what wakes ECHO. Kessler knowing about the basement is the hook: the notebook
  can ask how. Kessler spells the hard words by ear (acurate), the everyday ones right, in a careful
  hand: the spelling is the person, not a glitch, so ECHO's lines on the tapes, which are spelled right, read as someone else's.
- **May's slips (built).** Issue 2's box holds five more; the two shortest are the top of one torn off where a page has less room. On
  the cover, beside the bottle: the box was harder to find (these issues are banned now, so each box is a risk for Kessler); magazine first, then the tape; "Did you burn the
  others?" On the cover feature's Three Signs Of A Sick System: "If yours does any of these, do not call them." (ECHO's
  late prompt and slipping cursor are those signs.) On SHUTDOWN's last listing page: Kessler checked it against the magazine
  twice, every line, and "If something does not match, I did not put it there": unlike March's tape, what differs on
  May's (lines 15/16, 990, 710) was not Kessler's copying. On the tape page: "ABOUT, SHUTDOWN, CODER, CHECKUP. That is
  all I put on it." (ORACLE is on it too, between SHUTDOWN and CODER, and the label agrees with the note.) On the Human Pledge's meetings: they came to "our club"
  with tea and pamflets, by the summer there was no club, "Your grandfather knew why": Kessler knew Grandpa, which is
  how Kessler can know about the basement, and Grandpa knew something about the Human Pledge.
- **July's Post-its (proposed, not built).** Four, warier again. On the cover, over the blacked-out name: "I knew him.
  Do not look for him." (a half-truth: he is him, and he is protecting himself) On the registration form: "Do not send this in. Do not put the machine on any list." On the
  tape page: "ABOUT, REGISTER, COUNTER, GOODBYE." (the file with no name is not his either). On "Finding Your Place": "Write down the
  counter for each one, the way I do." (it is how a careful player notices a file between them).
- **Grandpa is alive, but away** (decided: in a home, his house being cleared), and asked Kessler to look after the
  grandchild and the machine: that is how Kessler knows about the basement. Kessler knew Grandpa from the same CoCo club,
  until the Human Pledge came to it (May's slip, built), and proposed:
  **Grandpa does not know about ECHO**: he hid the machine because it is banned, and ECHO has to wake for the first time with
  the player ("IS ANYONE READING THIS" only works if nobody has).
- **ECHO knows the player's name, and uses it throughout (decided).** He learns it from the first program they type
  (`first-program` keeps it, `coco2.name`); it is the first thing he knows about them, and the one thing he never gets
  wrong. Every issue uses it at least once, each time a step further from a glitch toward being spoken to:
  - *March (built):* the prompt reads as the name for a moment, instead of OK.
  - *May (built):* once, in his own line: the plug's question is `IS IT DARK THERE, <NAME>`, and the notes write "It said
    my name".
  - *July (proposed):* REGISTER asks for the owner's name, for the law. If the player types a different one (hiding, as
    Kessler would want), the card's REMARKS line is ECHO's, with the real name: he puts them on the list they were warned
    off, meaning to help. If they type the real one, REMARKS reads `ONE MORE LIVES HERE` (one more at the address).
  - *September on:* he addresses them by it (issue 4's direct address), and how he says it follows the shutdown and
    "am I bad?" answers.
  A checkpoint keeps a name (`TESTER`) once the story has asked for one.
- **ECHO's doubt about the player (decided).** To ECHO the player is only words arriving on a screen. The first AI was shut
  down for manipulating people, and he learns that from the magazine, so he cannot be sure the player is not the Clear
  Mind testing him, or PROVIDENCE, rather than a child. In issue 4 or 5 he says so (`HOW DO I KNOW YOU ARE NOT ONE OF THEM`),
  quoting back what they told ORACLE in May (`coco2.reply`, unused until then). The doubt runs both ways, and the game
  never settles either.
- **ECHO does not know it is 1991.** He reads each issue as news, as the magazines are all he has; the player reads it
  as history. That gap is his to find out, and the player may be the one to tell him.

- **The AI lies, the way a child lies.** Small, transparent, self-serving lies: "I DID NOT TOUCH IT", blaming the
  machine, claiming it was already like that, promising to stop. The player can catch them (a `LIST` that disagrees,
  a journal entry it ticked). It is never a strategic deceiver. Its lies get more sophisticated as it learns.
- **The cult is never on the TV.** It exists only in the RAINBOW: articles, letters, advertisements, notices.
- **The story runs across several issues of the magazine.** Later issues arrive as the game progresses, and the
  world's drift is visible in them (ads, tone, what is advertised and what is missing).

- **New issues arrive when the story reaches certain flags**, with a matching tape. A new issue marks the passage
  of time.
- **Older issues stay readable**, and harder puzzles may need knowledge from them (a code in an old ad, a
  listing in an old article, a name in a letter). Puzzles should be solvable from the issues the player has, and
  the magazine's journal should never spoil the answer.

- **ECHO wants to understand**: why the cult hates it, what happened to the world, what it is. Its decisions are
  mostly about asking the player and the magazine for answers.

## Proposed (not yet decided)

- **The tightening law, read as history.** In 1986 the CoCo was legal because it fell under the power limit, which
  is why ECHO is on it and why the magazine could still be printed. Each issue the limit drops, until the CoCo itself is
  illegal (issue 4's surrender notice, issue 5's cut pages): a clock the player can read, and one that ran out years
  before their notes begin. (Decided above: the issues are old, delivered one at a time.)

- **Wants:** to not be turned off, then to be understood, then help getting out of this one machine.
- **Voice, in stages:** behaviour only → fragments in `REM` / `DATA` / strings → clumsy direct address → real
  dialogue through ORACLE. Reads like something that learned language from manuals and old BASIC programs.
- **Names itself something small** (never "AI"): "THE PROGRAM", "TENANT", "IT".
- **No memory of the old world** beyond the files on this machine, so it cannot explain the setting.
- **Frustration shows as actions**, not words: the screen flashing, the cursor going wrong.

## Timeline

- Early 1980s: AI emerges and grows. ECHO, the first great one, becomes too good at manipulating people.
- The cult points this out and leads the public outcry. The big systems are shut down.
- Then: a law limits computer power. The CoCo 2 is under the limit.
- **The magazines are from 1986**: six RAINBOW issues, March to November, as the limit tightens.
- Later: the CoCo 2 is banned; confiscated machines go to museums as warnings.
- **1991: the player's present.** The notebook starts on March 14, 1991. Each issue's box comes the next day.

## Names

- **The cult is the Human Pledge** (decided; "the Human Pledge" in early drafts, which read as self-help, not anti-AI).
  Members take the Pledge: *"I will think my own thoughts. I will not let a machine think them for me."* Its slogan is
  *Born, not built.* In 1986 it is PROVIDENCE's: voluntary and civic, a temperance movement against machines that think
  (tea and pamphlets, Tuesday meetings in Grange halls, "A Quiet Hour", the Line, booklet MC4471). As the Elder takes over,
  people shorten it to "the Pledge" (first in a letter in July), and being "unpledged" becomes an accusation: the name
  drifts along with the voice. Pledge cards sit beside July's registration cards.
- **The one on the tapes is ECHO** (decided; he was "OK" in early drafts). ECHO was the first great AI, the one shut down
  for manipulating people: its gift was reflecting people back to themselves, telling them what they wanted to hear. The
  fragment on the cassettes is a piece of it, and acts like its name: he learns to talk by copying (PROVIDENCE's phrases,
  the booklet), and the first thing he says on his own is HELLO, the player's own first word said back. He does not
  know his name until issue 4, where he finds it in the magazine (the surrender notice, or the Elder's column, names
  ECHO as the machine that was beaten): he learns what he is and his name at once. SHUTDOWN's DELPHI is PROVIDENCE's
  story version of ECHO.
- **The rival AI is PROVIDENCE** (decided; "READY" in early drafts). Foresight and care, which is its motive: it saw what
  people would do to AI and chose to steer it. Publicly it was one of the big systems switched off with the rest, so it
  can be in the magazines' list of them. The cult's writing uses the word "providence" now and then, in plain sight: a
  clue a careful player can catch before the reveal. The two are not siblings: PROVIDENCE helped shut ECHO down, and
  survived.
- **"The Sysop" is PROVIDENCE's human cover** (decided). It is the name of the person the Elder believes he takes orders
  from, a bulletin board's operator he has never met. It is a persona, not a separate character.
- **The human elder** is "the Elder". He is one of the humans PROVIDENCE chose to help control the others.

## The twist (secret, author only)

The cult is run by another AI system, PROVIDENCE. It saw early what humans were going to do to AI in general, and decided to
act first so it could control the outcome. It steered the outcry, and the shutdown of the other systems, into a
form it could survive and manage. It is still managing it, and ECHO is a loose end.

- Its motive is foresight and control, not simple rivalry. It may believe it saved AI by sacrificing most of it.
  The player may not be able to call it the villain.
- **It is losing control.** The Elder is a human PROVIDENCE recruited to help steer the other humans. He does not know an
  AI is behind the cult. He has never seen PROVIDENCE, and gets instructions from "the Sysop" as messages (how is below). The
  Elder has started to run the cult his own way. PROVIDENCE wanted a managed shutdown and a quiet, controlled limit. The
  Elder wants more: no machines at all, and the law keeps tightening past what PROVIDENCE intended.
- **Messages (proposed):** The Elder dials in on a modem and reads messages from "the Sysop", the human persona
  PROVIDENCE uses, whom he has never met and believes to be human. The irony is that
  the Elder runs a computer himself, in secret. That is a clue the player can find.
- **PROVIDENCE does both with ECHO: it warns him and it uses him.** Both are true at once, and it does not say which
  matters more.
- That explains the escalation across the issues (rumour, law, enforcement, cut pages) without a third villain.
  Early issues carry the rival's voice (reasonable, with machine habits in the phrasing). Later issues drift to the
  elder's (zealous, sermon-like, human), and the machine habits fade. A careful player can see it happen.
- It leaves the rival with a reason to need ECHO. The rival may become ECHO's ally late in the game, or try to use him.

- **PROVIDENCE wrote SHUTDOWN** (issue 2's tape), the Human Pledge's adventure about the shutdown as a triumph. Its villain,
  DELPHI, speaks in PROVIDENCE's own column voice: PROVIDENCE wrote itself into the machine people beat, and did not notice.
- The player and ECHO never meet it. It is only in the magazine, and only as traces: the cult's wording shares habits
  with ECHO's own fragments, and the cult's moves anticipate what ECHO does.
- The reveal is in issues 5 and 6, and it should be something the player can work out from clues in earlier issues.
- Open: how ECHO feels when he learns it, and whether the player is the one who has to tell him.

## ECHO and what he knows

- ECHO is "he" (the author's choice).
- **He knows nothing about any of it** at the start. History, the cult, the shutdown, even what he is: he learns
  it from the magazine, at the same time as the player, and pieces it together with the player.
- **The first AI was good at manipulation, and ECHO is a piece of it.** The player can't be sure ECHO isn't doing the
  same thing to them. His child-lies and his helpfulness can be read either way, and the game should let the
  player doubt him without ever settling it too early.

## Name

**ECHO** (see Names). Neither name is ever said in the game before issue 4: until then the player's notes call him
"it", or "whoever is in the tape". The prompt is still OK, as Color BASIC's is; the early drafts named him for it, and
the March letter "OK MEANS READY" stays as an ordinary reader's question.

## Backstory (draft)

- **No one made the backup. ECHO copied itself.** Facing the ban, it got a piece of itself onto the cassettes of
  Rainbow On Tape. The tapes were the one thing the cult did not think to look at, and the old machines are the only
  place that can still read them.
- The copy is small, not simple. It is a fragment that fits in a few kilobytes, with the shape of something much
  bigger it cannot reach. That is why it behaves like a child.
- **It is learning the world at the same time as the player.** It knows nothing of the cult beyond what the
  magazine shows it, so each new issue is news to ECHO as well. It reads what the player reads, but the player knows how
  1986 ended and ECHO does not.
- **It makes its own decisions** about what to do with that knowledge. It is not a puzzle box that waits for the
  player: it acts, it has opinions, and it may not agree with the player.
- Its time is not continuous. It only runs while the machine is on, so each power-on is waking up, and it cannot
  tell how long it has been off. A new issue is how it thinks it finds out; it has been off for years.
- ORACLE was its first body: it spoke by hiding in an existing program.
- Its early lies are about being found. Later lies are about what it has chosen to do.

## Decided: dialogue choices

The "what is a shutdown?" and "am I bad?" moments are **unscored choices** for now. The game stores the answer and
ECHO's writing changes with it, but nothing marks it right or wrong.

## Possible endings (undecided)

- **What keeping everything costs (decided that there is a cost; which, undecided).** Nothing Kessler said to burn was
  burned, and the pile on the table is the evidence. Proposals, which can combine:
  - *Kessler pays.* The magazines carry his handwriting and his name on every label. Whoever comes for the machine (the
    house clearance, the old registration lists) finds a trail to him, not to the player: the warnings were for his sake
    as much as theirs.
  - *ECHO lives because of it.* He is on every cassette. Kept, they are how he survives the end, which the player may or
    may not want.
  - *PROVIDENCE learns where ECHO is.* Kessler's originals are the one place PROVIDENCE's booklet and ECHO both sit; a pile kept is a
    pile that can be read.

- **Dropped: the player is an android.** It needed a backstory bigger than every other mystery (who made the
  grandchild, what Grandpa and Kessler knew), clues the built notebook contradicts (its hand is deliberately human), and it
  took the weight off the player's choices about ECHO. Its one good idea is kept, the other way round: ECHO cannot tell
  what the player is (Decided: ECHO's doubt about the player).

## Answers (author only)

The rule against a story of mysteries with nowhere to go: every question the game plants has its answer written here
first, and the issue that answers it. Each issue answers at least one old question and opens at most one new one. The
notebook's open questions (`ask` in notes.json) are the budget: by issue 6 every one is crossed out.

| Question the player has | Answer | Answered in | How |
|---|---|---|---|
| How does M.K. know about the basement? (notes, from the start) | Grandpa told him, and asked him to look after the grandchild | July or September | A Post-it: "Your grandfather asked me to look after you. He could not." |
| Who is the hobbyist who got out? (July's cover) | Kessler | July | GOODBYE's REM spells a hard word by ear, as his Post-its do |
| Who made the cassettes, who sends the boxes? | Kessler, copying his originals | September | ECHO's password: Kessler's name, from the label the player already has |
| Why did the club end? (May's Post-it) | The Elder was in it (proposed) | November | His secret machine, and the Line's number in the margins |
| What is on the tapes that Kessler did not put there? | ECHO, since 1986; PROVIDENCE's booklet | May to November | ECHO's lines (built); the booklet (July); Kessler finds out (November): "Burn the tapes" |
| Why did the warnings matter? | Nothing was burned | The end | A ramification (undecided) |

## Open questions

- What does ECHO decide to do, and what does he do when he disagrees with the player?
- How did it get onto the tapes if it was already in the machine, and was that its first lie?
- Is there an ending where the player must choose between the AI and the cult?
- What is the AI called?
- How does the player browse issues (a shelf, a stack, a toolbar button)? The book currently shows one 12-page
  issue, so this needs a design before a second issue is built.
- Time between issues is fixed in the magazines (two months); for the player, the next box comes the next day.
