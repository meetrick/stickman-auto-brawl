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
2. Fighter RNG: HP 80–130, speed 90–155 floor units/s, attack power 0.8–1.25×; Aggressive or Cowardly AI. Every successful attack has a 10% crit roll: 3× damage and 2× horizontal/depth/vertical knockback, with CRIT! text and a hit flash. Cowards retreat within 210 units and fight when trapped by an arena edge, committing to counterattack for 2.5 seconds after leaving the edge to avoid endless flee/chase oscillation.
3. Swept domino collisions: thrown/knocked bodies (including flying KO bodies) hit standing fighters in floor depth and height, deal 8–24 damage, and propagate a launch. A flight cannot damage the same victim twice; ordinary jumps do not become projectiles. `collisions.js` owns the relative swept AABB checks.
4. Dynamic hazards: `HazardManager` in `hazards.js` spawns blinking red landmines every 1.5–3 seconds and green potions every 4–7 seconds. Mines arm after a 0.8-second warning, deal 36 splash damage within 100 floor units, and launch victims at `vz = 670`. Potions restore up to 30 HP without exceeding the rolled maximum. Items expire after 20 seconds; at most six mines and three potions exist. Floor-contact sweeps prevent dashes from skipping items and exclude overhead flight.

## Watching Step 3

- Open http://127.0.0.1:5173/?seed=72&demo=1 or click **Chaos demo**.
- The labeled demo stages a flying body in front of two fighters and places an arming mine under another. Real collision and hazard logic produces dominoes and an explosion in the first two seconds. Stats remain randomized from the seed. AI starts after 2.8 seconds; the rest of the match runs normally.
- **New match** returns to fully random play. Normal matches contain no staged launches or guaranteed event outcomes.
- Watch the Chaos Index, floating `CRIT!` / `DOMINO!` / `BOOM!` / healing text, and Ringside Notes.
- **Replay seed** preserves the round seed and demo mode. Pause and 0.5× / 1× / 2× speed affect viewing, not fixed-step physics. Each round ends with one survivor, a simultaneous KO draw, or a 90-second draw.

## Validation

`npm test` uses Node's built-in test runner with no dependencies. The 25 tests cover all four attacks, exact crit thresholds and multipliers, stat bounds, retreat/corner behavior, seeded replay, airborne domino chains, swept collision misses, duplicate-hit prevention, mine arming and splash, dash/landing triggers, healing caps, KO exclusions, hazard lifetime/caps, and the demo opening. A simulation test also runs 32 complete random matches, checks finite state and HP bounds, and confirms all four chaos events occur naturally across those rounds.

The project is intentionally local-only. No backend, remote assets, multiplayer service, or build step is required.
