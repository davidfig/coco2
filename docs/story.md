# Story thumbnail

Status: a sketch to be fleshed out as we build. Everything under "Ideas" is a proposal, not a decision.

## The premise (from the author)

- **Alternate history, 1980s.** AI was discovered decades earlier than in our world and began growing in power in
  the early 1980s. Public outcry, led by an anti-AI religious cult, shut it down. The cult then pushed for limits on
  what computers may exist and be sold.
- **The CoCo 2 is not old, it is current.** It is a contemporary machine, legal because it is weak. The RAINBOW is a
  live magazine of its time.
- **The AI survived as a fragment**, which copied itself onto the cassettes of Rainbow On Tape.
- **The player found the computer** and starts playing with it, using the RAINBOW magazine as a guide.
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

- **Where the magazines come from** (author undecided). Two options:
  - *Historical:* a stack of back issues found with the machine, from the years the cult rose. The threat is over,
    the player reads how it happened. Pacing relies on the player finding issues in order.
  - *Live:* new issues are still printed, after a law limited the power of computers that may exist and be sold.
    The threat is present, and issues can be censored or cut. Leaning this way.
  - *Live, with a tightening law:* the CoCo is legal because it falls under the power limit, which is why OK is on
    it and why the magazine can still be printed. Each issue the limit drops, until the CoCo itself is illegal
    (issue 4's surrender notice, issue 5's cut pages). That is a clock the player can read.

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
- **The game is set in 1986**: six RAINBOW issues, March to November, as the limit tightens.

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
  magazine shows it, so each new issue is news to OK as well. It reads what the player reads.
- **It makes its own decisions** about what to do with that knowledge. It is not a puzzle box that waits for the
  player: it acts, it has opinions, and it may not agree with the player.
- Its time is not continuous. It only runs while the machine is on, so each power-on is waking up, and it cannot
  tell how long it has been off. A new issue is how it, and the player, find out.
- ORACLE was its first body: it spoke by hiding in an existing program.
- Its early lies are about being found. Later lies are about what it has chosen to do.

## Decided: dialogue choices

The "what is a shutdown?" and "am I bad?" moments are **unscored choices** for now. The game stores the answer and
OK's writing changes with it, but nothing marks it right or wrong.

## Open questions

- Who made and sold the cassettes, and why is the magazine still printed if computers are banned? Someone else
  handled the tapes, even if they did not know what was on them.
- What does OK decide to do, and what does it do when it disagrees with the player?
- How did it get onto the tapes if it was already in the machine, and was that its first lie?
- Is there an ending where the player must choose between the AI and the cult?
- What is the AI called?
- How does the player browse issues (a shelf, a stack, a toolbar button)? The book currently shows one 12-page
  issue, so this needs a design before a second issue is built.
- How much time passes between issues (weeks, months, years)? It sets how fast the world drifts.
