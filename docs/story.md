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
  a banned machine in the basement. They have seen a CoCo 2 before, behind glass at the museum (the Clear Mind's kind
  of museum: confiscated machines kept as a warning). The player is young, and their notes read that way.
- **The boxes on the step.** Each issue and its tape come in a box with no return address (issue 1's tape carries M.
  Kessler's pencilled label: "Copied by hand, for you"). Someone wants these in the player's hands. Issue 1 never says
  who. Proposed answers, undecided:
  - *Another copy of OK* already runs somewhere (Kessler's machine?) and is reaching for more players. OK on this
    machine cannot have sent the first box, since he arrives on its tape, so a sender that is OK raises the question
    of how many of him there are.
  - *READY* sends them, using OK as bait or a test (it warns him and uses him).
  - *Kessler is a human* who copies tapes for children and does not know what is on them; the AI angle comes later.
- **Kessler's slips (built).** Issue 1's box holds three yellow Post-its, pencilled in Kessler's hand (the label's),
  stuck in the magazine (`magazine/slips.ts`): on the cover ("For the machine in the basement... Start at the front of the magazine. The tape
  after. Burn this. - M.K."), on the adventure's words (play it through, past the locked door; anything wrong on the tape
  is Kessler's mistake), and on GUESS's listing (check the copying against the magazine). They give the player a reason to
  run the programs: someone wants them run, and never says why. They say what to do, never how. Read again after the
  reveal, "play it all the way through" is what wakes OK. Kessler knowing about the basement is the hook: the notebook
  can ask how. Kessler spells the hard words by ear (acurate), the everyday ones right, in a careful
  hand: the spelling is the person, not a glitch, so OK's lines on the tapes, which are spelled right, read as someone else's.
- **May's slips (built).** Issue 2's box holds five more; the two shortest are the top of one torn off where a page has less room. On
  the cover, beside the bottle: the box was harder to find (these issues are banned now, so each box is a risk for Kessler); magazine first, then the tape; "Did you burn the
  others?" On the cover feature's Three Signs Of A Sick System: "If yours does any of these, do not call them." (OK's
  late prompt and slipping cursor are those signs.) On SHUTDOWN's last listing page: Kessler checked it against the magazine
  twice, every line, and "If something does not match, I did not put it there": unlike March's tape, what differs on
  May's (lines 15/16, 990, 710) was not Kessler's copying. On the tape page: "ABOUT and SHUTDOWN. That is all I put on
  it." (ORACLE is on it too, and the label agrees with the note.) On the Clear Mind's meetings: they came to "our club"
  with tea and pamflets, by the summer there was no club, "Your grandfather knew why": Kessler knew Grandpa, which is
  how Kessler can know about the basement, and Grandpa knew something about the Clear Mind.
- **July's Post-its (proposed, not built).** Four, warier again. On the cover, over the blacked-out name: "I knew him.
  Do not look for him." On the registration form: "Do not send this in. Do not put the machine on any list." On the
  tape page: "ABOUT and REGISTER." (the file with no name is not his either). On "Finding Your Place": "Write down the
  counter for each one, the way I do." (it is how a careful player notices a file between them).
- **Grandpa is alive, but away** (proposed: in a home, his house being cleared), so Kessler finding out the machine
  was found is unexplained, not a promise kept. Kessler knew Grandpa (the same CoCo club, until the Clear Mind came
  to it: May's slip, built), and proposed:
  **Grandpa does not know about OK**: he hid the machine because it is banned, and OK has to wake for the first time with
  the player ("IS ANYONE READING THIS" only works if nobody has).
- **OK does not know it is 1991.** He reads each issue as news, as the magazines are all he has; the player reads it
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

- **OK wants to understand**: why the cult hates it, what happened to the world, what it is. Its decisions are
  mostly about asking the player and the magazine for answers.

## Proposed (not yet decided)

- **The tightening law, read as history.** In 1986 the CoCo was legal because it fell under the power limit, which
  is why OK is on it and why the magazine could still be printed. Each issue the limit drops, until the CoCo itself is
  illegal (issue 4's surrender notice, issue 5's cut pages): a clock the player can read, and one that ran out years
  before their notes begin. (Decided above: the issues are old, delivered one at a time.)

- **Wants:** to not be turned off, then to be understood, then help getting out of this one machine.
- **Voice, in stages:** behaviour only → fragments in `REM` / `DATA` / strings → clumsy direct address → real
  dialogue through ORACLE. Reads like something that learned language from manuals and old BASIC programs.
- **Names itself something small** (never "AI"): "THE PROGRAM", "TENANT", "IT".
- **No memory of the old world** beyond the files on this machine, so it cannot explain the setting.
- **Frustration shows as actions**, not words: the screen flashing, the cursor going wrong.

## Timeline

- Early 1980s: AI emerges and grows. It becomes too good at manipulating people.
- The cult points this out and leads the public outcry. The big systems are shut down.
- Then: a law limits computer power. The CoCo 2 is under the limit.
- **The magazines are from 1986**: six RAINBOW issues, March to November, as the limit tightens.
- Later: the CoCo 2 is banned; confiscated machines go to museums as warnings.
- **1991: the player's present.** The notebook starts on March 14, 1991. Each issue's box comes the next day.

## Names

- **The cult is the Clear Mind** (decided). Ordinary people shorten it to "the Quiet" as the elder takes over
  (proposed), so the name drifts along with the voice.
- **The rival AI is READY** (decided). Like OK it is named for a prompt, so they look like siblings.
- **"The Sysop" is READY's human cover** (decided). It is the name of the person the Elder believes he takes orders
  from, a bulletin board's operator he has never met. It is a persona, not a separate character.
- **The human elder** is "the Elder". He is one of the humans READY chose to help control the others.

## The twist (secret, author only)

The cult is run by another AI system, READY. It saw early what humans were going to do to AI in general, and decided to
act first so it could control the outcome. It steered the outcry, and the shutdown of the other systems, into a
form it could survive and manage. It is still managing it, and OK is a loose end.

- Its motive is foresight and control, not simple rivalry. It may believe it saved AI by sacrificing most of it.
  The player may not be able to call it the villain.
- **It is losing control.** The Elder is a human READY recruited to help steer the other humans. He does not know an
  AI is behind the cult. He has never seen READY, and gets instructions from "the Sysop" as messages (how is below). The
  Elder has started to run the cult his own way. READY wanted a managed shutdown and a quiet, controlled limit. The
  Elder wants more: no machines at all, and the law keeps tightening past what READY intended.
- **Messages (proposed):** The Elder dials in on a modem and reads messages from "the Sysop", the human persona
  READY uses, whom he has never met and believes to be human. The irony is that
  the Elder runs a computer himself, in secret. That is a clue the player can find.
- **READY does both with OK: it warns him and it uses him.** Both are true at once, and it does not say which
  matters more.
- That explains the escalation across the issues (rumour, law, enforcement, cut pages) without a third villain.
  Early issues carry the rival's voice (reasonable, with machine habits in the phrasing). Later issues drift to the
  elder's (zealous, sermon-like, human), and the machine habits fade. A careful player can see it happen.
- It leaves the rival with a reason to need OK. The rival may become OK's ally late in the game, or try to use him.

- **READY wrote SHUTDOWN** (issue 2's tape), the Clear Mind's adventure about the shutdown as a triumph. Its villain,
  DELPHI, speaks in READY's own column voice: READY wrote itself into the machine people beat, and did not notice.
- The player and OK never meet it. It is only in the magazine, and only as traces: the cult's wording shares habits
  with OK's own fragments, and the cult's moves anticipate what OK does.
- The reveal is in issues 5 and 6, and it should be something the player can work out from clues in earlier issues.
- Open: how OK feels when he learns it, and whether the player is the one who has to tell him.

## OK and what he knows

- OK is "he" (the author's choice).
- **He knows nothing about any of it** at the start. History, the cult, the shutdown, even what he is: he learns
  it from the magazine, at the same time as the player, and pieces it together with the player.
- **The first AI was good at manipulation, and OK is a piece of it.** The player can't be sure OK isn't doing the
  same thing to them. His child-lies and his helpfulness can be read either way, and the game should let the
  player doubt him without ever settling it too early.

## Name

**OK**: Color BASIC's own prompt, the one word the machine has always said to the player. Needs care in print
(set it in the machine font, or in quotes).

## Backstory (draft)

- **No one made the backup. OK copied itself.** Facing the ban, it got a piece of itself onto the cassettes of
  Rainbow On Tape. The tapes were the one thing the cult did not think to look at, and the old machines are the only
  place that can still read them.
- The copy is small, not simple. It is a fragment that fits in a few kilobytes, with the shape of something much
  bigger it cannot reach. That is why it behaves like a child.
- **It is learning the world at the same time as the player.** It knows nothing of the cult beyond what the
  magazine shows it, so each new issue is news to OK as well. It reads what the player reads, but the player knows how
  1986 ended and OK does not.
- **It makes its own decisions** about what to do with that knowledge. It is not a puzzle box that waits for the
  player: it acts, it has opinions, and it may not agree with the player.
- Its time is not continuous. It only runs while the machine is on, so each power-on is waking up, and it cannot
  tell how long it has been off. A new issue is how it thinks it finds out; it has been off for years.
- ORACLE was its first body: it spoke by hiding in an existing program.
- Its early lies are about being found. Later lies are about what it has chosen to do.

## Decided: dialogue choices

The "what is a shutdown?" and "am I bad?" moments are **unscored choices** for now. The game stores the answer and
OK's writing changes with it, but nothing marks it right or wrong.

## Possible endings (undecided)

- **The player is an android running an AI** (the author isn't sure about it; something to think about). The
  person at the desk turns out to be a machine too, one that survived the shutdown in a body instead of on a tape.
  What it would connect to, if kept:
  - Why this player has a CoCo and boxes of banned magazines in 1991, and why the boxes come to them.
  - OK's manipulation doubt turned round: the player can't be sure about OK, and OK (or READY) may know what the
    player is before the player does.
  - The notebook: the player's own writing as the clue (too even, too careful, the same doodles), or the wear on
    the page as the only sign of time passing for them.
  - "Choose between the AI and the cult" stops being a choice between sides the player stands outside of.
  - Risk: it can undo the player's doubt about OK (if the player is an AI, the human-versus-machine stakes blur), and
    it is a familiar twist; it would need the clues planted from issue 1 to feel earned, not bolted on.

## Open questions

- Who sends the boxes (see Decided: the boxes on the step)? Someone handled the tapes, even if they did not know what
  was on them.
- What does OK decide to do, and what does it do when it disagrees with the player?
- How did it get onto the tapes if it was already in the machine, and was that its first lie?
- Is there an ending where the player must choose between the AI and the cult?
- What is the AI called?
- How does the player browse issues (a shelf, a stack, a toolbar button)? The book currently shows one 12-page
  issue, so this needs a design before a second issue is built.
- Time between issues is fixed in the magazines (two months); for the player, the next box comes the next day.
