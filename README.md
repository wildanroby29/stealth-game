# The Quiet Gallery

[![make.fun bounty](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/wildanroby29/stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/wildanroby29/stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A complete original top-down stealth game — a museum heist at night — built
for make.fun's "Make the best stealth game" bounty.

You are the thief. Cross the gallery unseen, pocket the three gems, and slip
out through the green EXIT door. Three guards walk patrol routes you can
learn, pausing at every waypoint; their yellow vision cones sweep the floor,
turning orange, then red, as suspicion builds. Step into a cone and the meter
fills — break line of sight behind a display case or a statue and it drains
again, so a near miss is survivable. Fill the meter and the alarm sounds:
a guard chases you down, and if he catches you, you lose a life and start
over at the entrance.

- **Move** — WASD / arrow keys (Shift to sneak: slower, but a guard's vision
  range halves)
- **Distract** — click to throw a coin (3 per run); the nearest guard in
  earshot walks over to investigate it
- **Hide** — display cases, statues, benches and plants block movement *and*
  line of sight
- **Listen** — footsteps are synthesized in WebAudio; a guard's steps get
  louder the nearer he is, and a rising tone tracks suspicion
- **Pause** — P / Esc, **restart** — R

Plain JavaScript, no library, no network requests. The source is split into
one-job-per-file modules under `game/src/`: `config` (tuning), `world` (floor
plan, collision, line of sight), `guards` (patrols, cones, suspicion, chase),
`player` (movement, sneak, coin throw), `audio` (WebAudio synth), `render`
(canvas drawing, HUD, lighting), `input` (keyboard + mouse), `shots`
(staged screenshot scenes), `main` (boot + fixed-step loop + screens).

Run it locally with `node serve.ts`, then open http://localhost:8080.
