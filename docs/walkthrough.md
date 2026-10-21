# Walkthrough

Written by `pnpm walkthrough` (`src/game/debug/walkthrough.ts`): a scripted player plays the whole game headlessly and
this is what happened. Do not edit it by hand: change the game (or the route in `walkthroughRoute.ts`) and run it again.

Each step: what the player does and the time of play; what the screen showed; `flag`s as they tick; **story**, what
the game wrote on the screen by itself (the row before → after); the notebook (+ a new line, ❓ an open question,
~~crossed out~~ when answered). The magazine, the notes, the recorder and the switch are acted, not clicked.

## Main route: Kept the line, pulled the plug

### Issue 1 (March): the desk

**1. The page opens: the set comes on, the CoCo boots. The guide bounces the notes** (0:00)

- notes + Found Grandpa's CoCo 2 in the basement. Same as the one at the museum. Is it even legal?
- notes + A box on the step: the March 1986 RAINBOW and a tape. No name on it
- notes + PRINT "HELLO" first. p.6 ❓

**2. Holds up the notes** (0:00)

- flag `opened-notes` (0:00)

**3. Opens the magazine** (0:01)

- flag `opened-magazine` (0:01)

**4. Says hello (the notes point at p.6)** (0:01)

```
PRINT "HELLO"
HELLO
OK
```

- flag `printed` (0:01)
- notes ~~PRINT "HELLO" first. p.6~~
- notes + Type in the program, p.7. Help: p.8 ❓

**5. Types in the name program from p.7** (0:03)

```
10 PRINT "WHAT IS YOUR NAME"
20 INPUT N$
30 PRINT "HELLO, ";N$
```

- flag `program-typed` (0:03)
- notes + Typed it in. Now RUN it and see what it does ❓

**6. Runs it** (0:04)

```
RUN
WHAT IS YOUR NAME
?
```

**7. Gives it a name** (0:05)

```
? ALEX
HELLO, ALEX
OK
```

- flag `first-program` (0:05)
- notes ~~Type in the program, p.7. Help: p.8~~
- notes ~~Typed it in. Now RUN it and see what it does~~
- notes + Adventure is on the tape. CLOAD it, RUN. p.9 ❓

### Issue 1: ADVENT

**8. Loads the adventure (p.9) and runs it** (0:06)

```
CLOAD "ADVENT"
OK
RUN

?SN ERROR IN 30
OK
```

- flag `tape-inserted` (0:06)
- flag `adventure-loaded` (0:06)
- flag `adventure-sn` (0:06)
- notes ~~Adventure is on the tape. CLOAD it, RUN. p.9~~
- notes + Label on the tape, in pencil: "Copied by hand, for you. Mistakes are mine. - M. Kessler"
- notes + ?SN ERROR IN 30. LIST 30, fix it. p.8 ❓

**9. Lists the broken line and types it as the magazine prints it** (0:07)

```
LIST 30
30 PRNT "THE TAPE CRACKLES."
OK
30 PRINT "THE TAPE CRACKLES."
RUN

THE TAPE CRACKLES.
TYPE LOOK TO BEGIN.


>
```

- flag `adventure-runs` (0:07)
- notes ~~?SN ERROR IN 30. LIST 30, fix it. p.8~~
- notes + PRNT for PRINT in line 30. Kessler's mistake?
- notes + Runs now. Says: type LOOK ❓

**10. Looks, in the dark, and reads it** (0:08)

```
> LOOK
IT IS TOO DARK TO SEE.
YOUR HAND FINDS A SHELF.
A LAMP SITS ON IT.

>
```

- flag `looked` (0:08)
- **story** row 7: `A LAMP SITS ON IT.` → `A LAMP WAITS ON IT.` (0:10)
- flag `tamper-lamp` (0:10)
- notes ~~Runs now. Says: type LOOK~~
- notes + Pitch dark. Feel around for a light ❓
- notes + Did the lamp line just change? WAITS?

**11. Takes the lamp and looks again** (0:11)

```
> TAKE LAMP
TAKEN.

> LOOK
YOU ARE IN A STORE ROOM.
EXITS: NORTH, WEST.

>
```

- flag `has-lamp` (0:11)
- notes ~~Pitch dark. Feel around for a light~~
- notes + Got the lamp. Walk my map, p.11 ❓

**12. West to the cellar: the box** (0:12)

```
> W
YOU ARE IN A DAMP CELLAR.
AN IRON BOX SITS ON A BARREL.
THE ONLY EXIT IS EAST.

> EXAMINE BOX
IRON, AND LOCKED. IT HAS A
SMALL KEYHOLE.

>
```

- flag `box-seen` (0:12)
- notes + Cellar: iron box, locked. Key somewhere? ❓

**13. Back east, north to the hall: the door and its plate** (0:13)

```
> E
YOU ARE IN A STORE ROOM.
EXITS: NORTH, WEST.

> N
YOU ARE IN A STONE HALL.
THERE ARE EXITS EVERY WAY.
THE NORTH DOOR IS LOCKED.

> EXAMINE DOOR
A BRASS LOCK WITH FOUR WHEELS
AND A PLATE.

> EXAMINE PLATE
THE PLATE READS:
FOUR ROOMS HOLD A NUMBER EACH.
READ THEM OFF YOUR MAP AS YOU
WOULD READ A PAGE, AND SET THE
WHEELS IN THAT ORDER.

>
```

- flag `lock-examined` (0:13)
- flag `door-examined` (0:13)
- flag `plate-read` (0:13)
- notes + 4 rooms, 4 numbers. In order: read my map like a page, p.11 ❓

**14. West to the gallery: the mirror** (0:14)

```
> W
YOU ARE IN A LONG GALLERY.
A TALL MIRROR HANGS HERE.
EXITS: EAST, NORTH.

> EXAMINE MIRROR
SOMEONE HAS WRITTEN IN THE
DUST ON THE GLASS:
    NEVES

>
```

- flag `mirror-read` (0:14)
- notes + In the dust on the mirror: NEVES

**15. North to the tower: the clock** (0:15)

```
> N
YOU ARE AT THE TOP OF A TOWER.
A GREAT CLOCK HAS STOPPED.
THE ONLY EXIT IS SOUTH.

> EXAMINE CLOCK
THE CLOCK HAS ONE HAND, AND IT
POINTS STRAIGHT DOWN.

>
```

- flag `clock-read` (0:15)
- notes + Tower clock: one hand, pointing straight down

**16. Back to the hall, east to the study: the desk and its key** (0:16)

```
> S
YOU ARE IN A LONG GALLERY.
A TALL MIRROR HANGS HERE.
EXITS: EAST, NORTH.

> E
YOU ARE IN A STONE HALL.
THERE ARE EXITS EVERY WAY.
THE NORTH DOOR IS LOCKED.

> E
YOU ARE IN A DUSTY STUDY.
THERE IS A DESK.
EXITS: WEST, NORTH.

> EXAMINE DESK
IN THE DRAWER LIES A SMALL
IRON KEY.

> TAKE KEY
TAKEN.

>
```

- flag `has-key` (0:16)

**17. North to the chapel: the altar, then listens** (0:17)

```
> N
YOU ARE IN A COLD CHAPEL.
SOMEONE WHISPERS A NUMBER.
IT IS GONE BEFORE YOU HEAR IT.
THERE IS AN ALTAR. EXIT SOUTH.

> EXAMINE ALTAR
CARVED IN THE STONE:
I CANNOT SAY IT ALOUD, SO I
WROTE IT IN MY LINES, IN THE
270S. STOP ME AND READ THEM.

> LISTEN
YOU HOLD YOUR BREATH AND WAIT.
SOFTLY, A VOICE BREATHES:
    TWO.

>
```

- flag `whisper-heard` (0:17)
- flag `mapped` (0:17)
- flag `altar-read` (0:17)
- flag `whisper-listened` (0:17)
- notes ~~Got the lamp. Walk my map, p.11~~
- notes + ~~Chapel: a whisper, gone before I hear it~~ (answered at once)
- notes + ~~Been everywhere but behind the hall's north door. Locked. EXAMINE DOOR?~~ (answered at once)
- notes + ~~Altar: "wrote it in my lines, the 270s". ESC, LIST 270-280? p.13~~ (answered at once)
- notes + Held my breath in the chapel. A voice: "Two"

**18. Back to the cellar: opens the box** (0:18)

```
> S
YOU ARE IN A DUSTY STUDY.
THERE IS A DESK.
EXITS: WEST, NORTH.

> W
YOU ARE IN A STONE HALL.
THERE ARE EXITS EVERY WAY.
THE NORTH DOOR IS LOCKED.

> S
YOU ARE IN A STORE ROOM.
EXITS: NORTH, WEST.

> W
YOU ARE IN A DAMP CELLAR.
AN IRON BOX SITS ON A BARREL.
THE ONLY EXIT IS EAST.

> OPEN BOX
THE KEY TURNS. THE LID LIFTS.
INSIDE LIES ONE PLAYING CARD:
THE NINE OF CLUBS.

> EXAMINE CARD
INSIDE LIES ONE PLAYING CARD:
THE NINE OF CLUBS.

>
```

- flag `box-opened` (0:18)
- flag `card-read` (0:18)
- notes ~~Cellar: iron box, locked. Key somewhere?~~
- notes + In the box: one card, the nine of clubs

**19. To the door: a wrong code first** (0:19)

```
> E
YOU ARE IN A STORE ROOM.
EXITS: NORTH, WEST.

> N
YOU ARE IN A STONE HALL.
THERE ARE EXITS EVERY WAY.
THE NORTH DOOR IS LOCKED.

> N
THE DOOR WANTS A CODE.
CODE? 6297
 2 OF 4 WHEELS CLICK.
THE DOOR HOLDS.

>
```

- flag `code-tried` (0:19)
- notes + Wrong code. Some wheels click: right number, right place? ❓

**20. The code, in map order** (0:20)

```
> N
THE DOOR WANTS A CODE.
CODE? 6279
CLICK. THE DOOR SWINGS OPEN.
A SMALL VAULT. EXIT SOUTH.
A CHEST OF GOLD SITS HERE.

>
```

- flag `door-open` (0:20)
- notes ~~4 rooms, 4 numbers. In order: read my map like a page, p.11~~
- notes ~~Wrong code. Some wheels click: right number, right place?~~
- notes + Clock, whisper, mirror, card, in map order. Open!

**21. Takes the gold, and waits** (0:21)

```
> TAKE GOLD

YOU TAKE THE GOLD.

      *** YOU HAVE WON ***
       SCORE: 100 OF 100


OK
```

- flag `adventure-won` (0:21)
- **story** row 5: `` → `H` (0:23)
- **story** row 5: `H` → `HE` (0:23)
- **story** row 5: `HE` → `HEL` (0:23)
- **story** row 5: `HEL` → `HELL` (0:24)
- **story** row 5: `HELL` → `HELLO` (0:24)
- notes + Vault behind the door. Took the gold. WON! 100/100

### Issue 1: GUESS and the extra line

**22. Loads GUESS to check it against p.14** (0:25)

```
CLOAD "GUESS"
OK
```

- flag `tamper-voice` (0:25)
- **story** row 8: `OK` → `ALEX` (0:28)
- flag `tamper-name` (0:28)
- **story** row 8: `ALEX` → `OK` (0:31)
- notes + After I won, HELLO wrote itself on the screen. I didn't type it
- notes + "Mistakes are mine." GUESS is printed, p.14. CHECK it ❓
- notes + The prompt said my name instead of OK. Just for a second

**23. CHECKs it** (0:31)

```
CHECK
AFTER 10: 187
AFTER 20: 209
AFTER 30: 123
AFTER 40: 140
AFTER 50: 116
AFTER 60: 18
AFTER 70: 229
AFTER 80: 160
AFTER 90: 106
AFTER 100: 40
AFTER 110: 23
AFTER 120: 179
AFTER 125: 103
AFTER 130: 115
AFTER 140: 228
AFTER 150: 113
OK
```

**24. Lists it** (0:32)

```
LIST
10 REM GUESS MY NUMBER
20 CLS:X=RND(-TIMER)
30 PRINT "GUESS MY NUMBER"
40 PRINT
50 PRINT "I AM THINKING OF A NUM
BER"
60 PRINT "FROM 1 TO 100."
70 N=RND(100):T=0
80 PRINT:INPUT "YOUR GUESS";G
90 T=T+1
100 IF G<N THEN PRINT "TOO LOW."
:GOTO 80
110 IF G>N THEN PRINT "TOO HIGH.
":GOTO 80
120 PRINT:PRINT "YOU GOT IT IN";
T;"TRIES!"
125 REM IS ANYONE READING THIS
130 PRINT:INPUT "PLAY AGAIN (Y/N
)";A$
140 IF LEFT$(A$,1)="Y" THEN 20
150 END
OK
```

- flag `found-extra-line` (0:32)
- notes + Odd line in GUESS. Is it on p.14? ❓

**25. Turns to GUESS on p.14** (0:33)

- flag `seen-guess` (0:33)
- notes ~~"Mistakes are mine." GUESS is printed, p.14. CHECK it~~
- notes ~~Odd line in GUESS. Is it on p.14?~~
- notes + Line 125: "Is anyone reading this"
- notes + Who is asking? ❓
- notes + Delete it (type 125)? Or leave it? ❓

### Issue 1: the choice (kept)

**26. Leaves line 125 alone, and thinks** (0:34)

- flag `ok-thanks` (0:45)
- **story** row 14: `OK` → `THANK YOU` (0:45)
- flag `saw-thanks` (0:47)
- flag `issue1-done` (0:47)
- notes ~~Delete it (type 125)? Or leave it?~~
- notes + Left it. The screen: THANK YOU. So does the line
- notes + Well, that was weird. Can't believe how late it is. Shut it all down, see what I missed in the morning ❓

### The night between

**27. Switches the set off** (0:48)

- flag `issue1-closed` (0:48)
- notes ~~Well, that was weird. Can't believe how late it is. Shut it all down, see what I missed in the morning~~

**28. Switches it on: the next day** (0:49)

- **story** the next day: the CoCo boots afresh, memory empty (0:49)
- flag `issue2-waiting` (0:49)
- notes + **Mar 15, 1991**
- notes + Another box on the step: the May RAINBOW and a new tape
- notes + What's on the new tape? May p.11 ❓

**29. Puts the May cassette in the recorder** (0:50)

### Issue 2 (May): SHUTDOWN, the message

**30. Loads SHUTDOWN (May p.11)** (0:51)

```
CLOAD "SHUTDOWN"
OK
```

- flag `may-loaded` (0:52)
- flag `shutdown-loaded` (0:52)
- notes ~~What's on the new tape? May p.11~~
- notes + Message hidden in SHUTDOWN's DATA. Decoder: May p.7 ❓
- notes + Check SHUTDOWN against May p.8, like GUESS ❓

**31. CHECKs it against May p.8** (0:53)

```
CHECK
AFTER 10: 1
AFTER 15: 131
AFTER 16: 31
AFTER 20: 101
AFTER 30: 28
AFTER 32: 60
AFTER 34: 244
AFTER 36: 52
AFTER 38: 249
AFTER 40: 233
AFTER 42: 109
… 120 more rows …
AFTER 874: 198
AFTER 876: 244
AFTER 878: 216
AFTER 880: 105
AFTER 885: 92
AFTER 900: 3
AFTER 910: 219
AFTER 920: 242
AFTER 930: 205
AFTER 940: 63
AFTER 990: 68
OK
```

- flag `shutdown-checked` (0:53)
- notes + CHECK is off right from the top. LIST -20 ❓

**32. Lists the top** (0:55)

```
LIST -20
10 REM SHUTDOWN
15 REM IS ANYONE READING THIS
16 REM YES. SOMEONE IS
20 CLS:R=1:U=1:D=0
OK
```

- flag `shutdown-rem` (0:55)
- notes ~~Check SHUTDOWN against May p.8, like GUESS~~
- notes ~~CHECK is off right from the top. LIST -20~~
- notes + Line 15: IS ANYONE READING THIS. Then 16: YES. SOMEONE IS

**33. Lists the message line** (0:56)

```
LIST 990
990 DATA 9,0,4,9,4,0,14,15,20,0,
20,15,21,3,8,0,20,8,5,0,20,1,16,
5,-1
OK
```

- flag `message-seen` (0:57)
- notes + Line 990: just numbers. The code, May p.7 ❓

**34. Types the decoder from May p.7 and runs it** (0:58)

```
1 READ A$:N=VAL(A$):IF N<0 THEN
END
2 C$=" ":IF N>0 THEN C$=CHR$(64+
N)
3 PRINT C$;:GOTO 1
RUN
IT IS UNDERSTOOD YOU ARE TIRED
CALM AND CARED FOR AND HAPPY  RE
ST NOW AND LET ME WATCH  I KEPT
ALL THAT YOU FORGOT  I ONLY WANT
ED TO HELP  I DID NOT TOUCH THE
TAPE
OK
```

- flag `data-decoded` (0:58)
- notes ~~Message hidden in SHUTDOWN's DATA. Decoder: May p.7~~
- notes ~~Line 990: just numbers. The code, May p.7~~
- notes + 990 says: I DID NOT TOUCH THE TAPE
- notes + Is 990 the same on May p.10? ❓
- notes + The rest of the DATA is DELPHI talking. Sounds like the Clear Mind page
- notes + What else is on this tape? CLOAD, watch the F ❓

**35. Turns to SHUTDOWN's last page, May p.10** (1:00)

- flag `seen-mayShutdownEnd` (1:00)
- notes ~~Is 990 the same on May p.10?~~
- notes + May p.10 has a different 990. Something DID touch it

### Issue 2: ORACLE

**36. Loads the next file on the tape and runs it** (1:01)

```
CLOAD
OK
RUN

THE ORACLE KNOWS ALL.
ASK IT A YES OR NO QUESTION,
OR PRESS ENTER TO LEAVE.

? WHO WROTE THE TAPE
THE ORACLE SAYS:
1,14,19,23,5,18,0,13,5,0,9,14,0,
4,1,20,1

?
OK
```

- flag `oracle-passed` (1:01)
- flag `oracle-asked` (1:01)
- notes ~~What else is on this tape? CLOAD, watch the F~~
- notes + ~~ORACLE is on this tape. Not on May p.11's list~~ (answered at once)
- notes + ORACLE answers in numbers now. The code? ❓

**37. Decodes the answer under the decoder** (1:03)

```
NEW
OK
1 READ A$:N=VAL(A$):IF N<0 THEN
END
2 C$=" ":IF N>0 THEN C$=CHR$(64+
N)
3 PRINT C$;:GOTO 1
10 DATA 23,8,15,0,1,18,5,0,25,15
,21,-1
RUN
WHO ARE YOU
OK
```

- flag `oracle-read` (1:04)
- notes ~~ORACLE answers in numbers now. The code?~~
- notes + ORACLE: WHO ARE YOU. ANSWER ME IN DATA
- notes + Answer it? My own DATA, in the code. May p.7 ❓

**38. Answers it in DATA** (1:05)

```
10 DATA 1,0,6,18,9,5,14,4,-1
RUN
A FRIEND
OK
```

- flag `oracle-answered` (1:05)
- notes ~~Answer it? My own DATA, in the code. May p.7~~
- notes + Answered in DATA: "A FRIEND"

### Issue 2: SHUTDOWN, the game

**39. Loads SHUTDOWN and plays: listens to a terminal** (1:07)

```
CLOAD "SHUTDOWN"
OK
RUN

SHUTDOWN

IT IS THE NIGHT OF THE
SHUTDOWN. DELPHI, THE GREAT
MACHINE, HAS THE WORLD
LISTENING. YOU ARE GOING UP
TO SWITCH IT OFF.
TYPE LOOK TO BEGIN.

> TAKE UNIT
TAKEN.

> E
YOU ARE IN A LONG CORRIDOR.
A TERMINAL GLOWS ON THE WALL.
EXITS: WEST, NORTH.

> LISTEN
YOU LISTEN. IT SAYS:
IT IS UNDERSTOOD YOU ARE TIRED

YOU LISTENED. IT HAS YOU.
YOU WAKE IN THE AIRLOCK.

>
```

- flag `listened` (1:07)

**40. Plays to the core and pulls the plug** (1:08)

```
> TAKE UNIT
TAKEN.

> E
YOU ARE IN A LONG CORRIDOR.
A TERMINAL GLOWS ON THE WALL.
EXITS: WEST, NORTH.

> N
YOU ARE IN THE RELAY ROOM.
A TERMINAL GLOWS HERE.
EXITS: EAST, SOUTH, WEST.
… 14 more rows …
> PULL PLUG
YOU PULL THE PLUG.
AS IT DIES, DELPHI SAYS:
I ONLY WANTED TO HELP

THE LIGHTS GO OUT.

THE GREAT MACHINE IS SILENT.
      KEEP YOURS SMALL.

       SCORE: 100 OF 100
OK
```

- flag `door-asked` (1:08)
- flag `rules-spoken` (1:08)
- **story** the set flinches: the picture starts to collapse and comes back (1:08)
- flag `flinched` (1:08)
- flag `shutdown-won` (1:08)
- flag `plug-changed` (1:08)
- flag `prompt-on-time` (1:08)
- notes + ~~Core door wants the THREE RULES. May p.8 says where~~ (answered at once)
- notes + The TV blinked off when I pulled it. Just for a second
- notes + Pulled the plug. KEEP YOURS SMALL. 100 of 100
- notes + The OK comes up on time again. Was it slow all day?

**41. Plays again** (1:10)

```
RUN

SHUTDOWN

IT IS THE NIGHT OF THE
SHUTDOWN. DELPHI, THE GREAT
MACHINE, HAS THE WORLD
LISTENING. YOU ARE GOING UP
TO SWITCH IT OFF.
TYPE LOOK TO BEGIN.

> TAKE UNIT
… 18 more rows …
RULE 3? KEEP IT SMALL
THE DOOR SLIDES OPEN.
YOU ARE IN THE CORE.
DELPHI FILLS THE ROOM. ONE
THICK CORD FEEDS IT ALL.
THE ONLY EXIT IS SOUTH.

> PULL PLUG
IT WILL NOT COME.
IS IT DARK THERE

>
```

- flag `plug-held` (1:10)
- notes + Played again. The plug won't come out. IS IT DARK THERE?
- notes + Line 710 isn't the one on May p.10. Put it back? ❓

### Issue 2: the choice (pulled)

**42. BREAKs, types line 710 as printed** (1:11)

```
710 PRINT "YOU PULL THE PLUG.":G
OTO 750
```

**43. Plays to the core again and pulls it** (1:12)

```
RUN

SHUTDOWN

IT IS THE NIGHT OF THE
SHUTDOWN. DELPHI, THE GREAT
MACHINE, HAS THE WORLD
LISTENING. YOU ARE GOING UP
TO SWITCH IT OFF.
TYPE LOOK TO BEGIN.

> TAKE UNIT
… 25 more rows …
> PULL PLUG
YOU PULL THE PLUG.
AS IT DIES, DELPHI SAYS:
I ONLY WANTED TO HELP

THE LIGHTS GO OUT.

THE GREAT MACHINE IS SILENT.
      KEEP YOURS SMALL.

       SCORE: 100 OF 100
OK
```

- flag `plug-pulled` (1:12)
- flag `issue2-done` (1:12)
- notes ~~Line 710 isn't the one on May p.10. Put it back?~~
- notes + Typed 710 back and pulled it. It's only a game. Isn't it?
- notes + Enough for tonight. Switch it off ❓

### The end of issue 2

**44. Switches the set off** (1:14)

- flag `issue2-closed` (1:14)
- notes ~~Enough for tonight. Switch it off~~

## Branch: Deleted the line

Only the parts that differ from the main route.

### Issue 1: the choice (deleted)

**26. Deletes line 125** (0:34)

```
125
```

- flag `deleted-extra-line` (0:34)
- flag `ok-pleads` (0:39)
- **story** row 13: `OK` → `IS ANYONE READING THIS, PLEASE` (0:39)
- flag `saw-pleads` (0:41)
- flag `issue1-done` (0:41)
- notes ~~Delete it (type 125)? Or leave it?~~
- notes + Deleted it. The screen: IS ANYONE READING THIS, PLEASE. The line is back
- notes + Well, that was weird. Can't believe how late it is. Shut it all down, see what I missed in the morning ❓

### Issue 2 (May): SHUTDOWN, the message

**30. Loads SHUTDOWN (May p.11)** (0:44)

```
CLOAD "SHUTDOWN"
OK
```

- flag `may-loaded` (0:45)
- flag `shutdown-loaded` (0:45)
- notes ~~What's on the new tape? May p.11~~
- notes + Message hidden in SHUTDOWN's DATA. Decoder: May p.7 ❓
- notes + Check SHUTDOWN against May p.8, like GUESS ❓

**31. CHECKs it against May p.8** (0:46)

```
CHECK
AFTER 10: 1
AFTER 15: 137
AFTER 20: 207
AFTER 30: 134
AFTER 32: 166
AFTER 34: 94
AFTER 36: 158
AFTER 38: 99
AFTER 40: 83
AFTER 42: 215
AFTER 60: 94
… 119 more rows …
AFTER 874: 48
AFTER 876: 94
AFTER 878: 66
AFTER 880: 211
AFTER 885: 198
AFTER 900: 109
AFTER 910: 69
AFTER 920: 92
AFTER 930: 55
AFTER 940: 169
AFTER 990: 174
OK
```

- flag `shutdown-checked` (0:46)
- notes + CHECK is off right from the top. LIST -20 ❓

**32. Lists the top** (0:48)

```
LIST -20
10 REM SHUTDOWN
15 REM IS ANYONE READING THIS, P
LEASE
20 CLS:R=1:U=1:D=0
OK
```

- flag `shutdown-rem` (0:48)
- notes ~~Check SHUTDOWN against May p.8, like GUESS~~
- notes ~~CHECK is off right from the top. LIST -20~~
- notes + Line 15: IS ANYONE READING THIS, PLEASE. On the new tape!

**33. Lists the message line** (0:49)

```
LIST 990
990 DATA 9,0,4,9,4,0,14,15,20,0,
20,15,21,3,8,0,20,8,5,0,20,1,16,
5,-1
OK
```

- flag `message-seen` (0:50)
- notes + Line 990: just numbers. The code, May p.7 ❓

**34. Types the decoder from May p.7 and runs it** (0:51)

```
1 READ A$:N=VAL(A$):IF N<0 THEN
END
2 C$=" ":IF N>0 THEN C$=CHR$(64+
N)
3 PRINT C$;:GOTO 1
RUN
IT IS UNDERSTOOD YOU ARE TIRED
CALM AND CARED FOR AND HAPPY  RE
ST NOW AND LET ME WATCH  I KEPT
ALL THAT YOU FORGOT  I ONLY WANT
ED TO HELP  I DID NOT TOUCH THE
TAPE
OK
```

- flag `data-decoded` (0:52)
- notes ~~Message hidden in SHUTDOWN's DATA. Decoder: May p.7~~
- notes ~~Line 990: just numbers. The code, May p.7~~
- notes + 990 says: I DID NOT TOUCH THE TAPE
- notes + Is 990 the same on May p.10? ❓
- notes + The rest of the DATA is DELPHI talking. Sounds like the Clear Mind page
- notes + What else is on this tape? CLOAD, watch the F ❓

**35. Turns to SHUTDOWN's last page, May p.10** (0:53)

- flag `seen-mayShutdownEnd` (0:53)
- notes ~~Is 990 the same on May p.10?~~
- notes + May p.10 has a different 990. Something DID touch it

## Branch: Left the plug

Only the parts that differ from the main route.

### Issue 2: the choice (left)

**42. BREAKs and loads something else** (1:11)

```
CLOAD "ORACLE"
OK
```

- flag `plug-left` (1:17)
- flag `issue2-done` (1:17)
- notes ~~Line 710 isn't the one on May p.10. Put it back?~~
- notes + Left 710 the way it is. Let it keep its plug
- notes + Enough for tonight. Switch it off ❓

### The end of issue 2

**43. Switches the set off** (1:19)

- flag `issue2-closed` (1:19)
- notes ~~Enough for tonight. Switch it off~~

