# Stickman Auto Brawl

A dependency-free HTML5 Canvas spectator auto-battler. Eight procedural stick fighters fight in a depth-sorted 2.5D courtyard with four attacks: Dash, JumpKick, Uppercut, and Grab.

## Run

Requires Node.js 20.11 or later. No installation is needed.

```sh
npm start
```

Open http://127.0.0.1:5173. Use New match, Pause, Speed, and Replay seed. Add `?seed=72` to reproduce a round. Physics runs at a fixed 120 Hz independently of rendering.

```sh
npm test
```

## Coordinates and architecture

- `fighter.js`: autonomous combat, move timing, damage, knockback, and gravity.
- `app.js`: seeded match simulation, fixed-step loop, and spectator controls.
- `renderer.js`: procedural articulated poses, depth sorting, and the courtyard.
- `random.js`: reproducible PRNG.
- `x` and `y` are floor coordinates; `z` is height and `vz` is vertical velocity. The projection is `(x, y - z)`.

## Character reference

The ink outlines, colored torso strokes, round heads, fluttering headbands, and paper palette are inspired by [meetrick/stick_brawl](https://github.com/meetrick/stick_brawl). Rendering and simulation here are newly implemented; no source or assets are copied. This workspace initially contained only a README, so the minimum combat foundation is included before the Step 3 additions.

## Implementation chunks

1. Working combat foundation with deterministic simulation and automated checks.
2. Fighter RNG and personalities (next).
3. Swept domino collisions (next).
4. Dynamic landmines and health potions (next).
