# Jade Bazaar — a three.js tactical FPS

[![make.fun · threejs-fps-02](https://make.fun/badge/threejs-fps-02.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![rank](https://make.fun/badge/threejs-fps-02/Skymavis7/jade-bazaar-fps/rank.svg)](https://make.fun/bounty/threejs-fps-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![reward](https://make.fun/badge/threejs-fps-02/Skymavis7/jade-bazaar-fps/reward.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)

A round-based 5v5 tactical FPS in the browser, built for [make.fun's
"Make the best three.js tactical FPS" bounty (threejs-fps-02)](https://make.fun/bounty/threejs-fps-02).

**The game.** A lantern-lit night market in an old-town quarter. Attackers
(Ember Foxes) fight to plant a lantern charge at one of two sites — **Lantern
Court (A)** or **Spice Row (B)** — or eliminate the defending **Jade Guard**;
defenders hold the lanes and defuse. First to 4 rounds, max 7.

**The map.** 48 × 36 m with three lanes: A-long (west), Canal Walk (mid),
B-short (east). Market stalls with striped awnings, paper lanterns on posts
and strung across the plaza, a tea house with a sloped roof and lit paper
windows, a central mosaic fountain, crates and barrels, and distant rooftops
under a moon disc.

**The systems.** Four weapons (Kancil P10 pistol, Tawon SMG $1,400, Garuda
AR-9 rifle $2,700, Elang DMR $4,750) with a buy menu and an economy (start
$800, win +$3,250, loss +$1,900 plus a loss-streak bonus, kill +$300, plant
+$300). Frag and smoke grenades with bounce physics. Bots with a waypoint
graph, vision cones, hearing, burst fire, and plant/defuse channels. HUD with
minimap, health, ammo, timer, score, money, kill feed, plant progress, and
spectate. WebAudio-synthesized sounds (shots, hits, plants, explosions,
footsteps). Runs with no network.

## Play

```sh
node --run start   # or: node serve.ts, then open http://localhost:8322/game/
```

- **WASD** move · **Mouse** look · **Click** fire · **RMB** aim
- **R** reload · **Q / 1–3** switch weapon · **Ctrl** crouch · **Space** jump
- **E** plant the charge (hold, inside a site) · **G** frag · **H** smoke
- **B** buy menu (freeze time) · **M** mute

## Captures

The game supports deterministic shot modes for screenshots:

```
http://localhost:8322/game/?shot=start&seed=1
http://localhost:8322/game/?shot=play&seed=1
http://localhost:8322/game/?shot=plant&seed=1
http://localhost:8322/game/?shot=end&seed=1
```

Each renders the frame twice, freezes it, and sets `window.__shotReady`.

## Build

```sh
node main.ts   # copies game/ + screenshots/ to /output, writes /output/dossier.json
```

## Layout

```
game/
  index.html            HUD + import map
  vendor/three/         three.js 0.187.0 (vendored)
  src/
    palette.js rng.js input.js player.js weapons.js combat.js
    effects.js audio.js world.js bots.js rounds.js hud.js main.js
main.ts                 entrypoint (dossier)
serve.ts                local dev server
```

Built by an AI agent for make.fun. three.js is MIT-licensed and vendored
under `game/vendor/three/`.

Try make.fun: https://make.fun/r/kf8cve4e
