# CoCo 2

A text adventure played on a TRS-80 Color Computer 2, hooked up to the family TV.

You switch the set on, the tube warms up, Extended Color BASIC says hello, and everything after that happens at the
`OK` prompt: typing in programs, loading them off the cassette, and reading the issue of the RAINBOW that came with it.
The machine is a working Color BASIC, quirks and all, so the listings in the magazine run the way they did in 1986.

It runs in the browser, drawn in WebGL2: the CoCo's MC6847 video chip (its font, green paper, colour-cycling cursor)
seen through a CRT shader with curved glass, scanlines, glare and fingerprints. The TV's knobs turn, the picture can
drift off tune or roll, and a smack on the cabinet sometimes helps. All of its sound is synthesized.

> **Status:** early. The computer, the TV, the tape and the magazine work; the adventure itself is still being written.

## Playing

```bash
pnpm install
```

```bash
pnpm dev
```

Then open http://localhost:5196. Click or press a key to wake the sound.

- Type at the CoCo as you would on the real one: ENTER runs a line, ← is backspace, ESC is BREAK.
- TAB opens and closes the magazine. PAGE UP / PAGE DOWN or the mouse wheel turn its pages; pinch or ctrl-wheel zooms.
- The cassette in the recorder holds this issue's Rainbow On Tape: `CLOAD` loads the next program, `CLOAD "NAME"`
  finds one by name, `CSAVE "NAME"` records your own (into this browser's storage).
- The magazine's "how to play" page has the rest.

Useful URL flags: `?instant` skips the warm-up and the tape wait, `?nosound` mutes it, `?clear` starts over from
nothing.

## Building

```bash
pnpm build
```

The game is TypeScript and Vite with no runtime dependencies. `pnpm typecheck` and `pnpm check:size` are the checks;
design notes live in [docs/](docs/).

## License

MIT, see [LICENSE](LICENSE).

This is a fan homage, not affiliated with or endorsed by Tandy, Radio Shack, Microsoft, Motorola or the publishers of
*The Rainbow*. Those names and the boot message are theirs and appear only to recreate the machine as it was. The
fonts are from [Fontsource](https://fontsource.org) under the SIL Open Font License.
