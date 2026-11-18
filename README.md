# Stickman Auto Brawl

A dependency-free HTML5 Canvas spectator auto-battler. Eight procedural stick fighters fight in a depth-sorted 2.5D courtyard with four unarmed attack families (Dash, JumpKick, Uppercut, Grab) plus randomized weapon strikes.

## Play online

Open [Stickman Auto Brawl](https://meetrick.github.io/stickman-auto-brawl/) on a phone or desktop browser. No installation or sign-in is required to watch a match.

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
- `renderer.js`: articulated drawing, effects, depth sorting, and the courtyard.
- `pose.js`: keyframed end-effector targets and two-bone inverse kinematics.
- `arena.js`: seeded pole/trap placement and environmental collision.
- `random.js`: reproducible PRNG.
- `x` and `y` are floor coordinates; `z` is height and `vz` is vertical velocity. The projection is `(x, y - z)`.

## Character reference

The ink outlines, colored torso strokes, round heads, fluttering headbands, and paper palette are inspired by [meetrick/stick_brawl](https://github.com/meetrick/stick_brawl). Rendering and simulation here are newly implemented; no source or assets are copied. This workspace initially contained only a README, so the minimum combat foundation is included before the Step 3 additions.

## Implementation chunks

1. Working combat foundation with deterministic simulation and automated checks.
2. Fighter RNG: HP 80–130, speed 90–155 floor units/s, attack power 0.8–1.25×; Aggressive, Cowardly, Brawler, or Trickster AI. Every successful attack has a 10% crit roll: 3× damage and 2× horizontal/depth/vertical knockback, with CRIT! text and a hit flash. Cowards retreat within 210 units and fight when trapped by an arena edge, committing to counterattack for 2.5 seconds after leaving the edge to avoid endless flee/chase oscillation.
3. Swept domino collisions: thrown/knocked bodies (including flying KO bodies) hit standing fighters in floor depth and height, deal 8–24 damage, and propagate a launch. A flight cannot damage the same victim twice; ordinary jumps do not become projectiles. `collisions.js` owns the relative swept AABB checks.
4. Dynamic hazards: `HazardManager` in `hazards.js` spawns blinking red landmines every 1.5–3 seconds and green potions every 4–7 seconds. Mines arm after a 0.8-second warning, deal 36 splash damage within 100 floor units, and launch victims at `vz = 670`. Potions restore up to 30 HP without exceeding the rolled maximum. Items expire after 20 seconds; at most six mines and three potions exist. Floor-contact sweeps prevent dashes from skipping items and exclude overhead flight.

## Watching Step 3

- Open http://127.0.0.1:5173/?seed=72&demo=1 or click **Chaos demo**.
- The labeled demo stages a flying body in front of two fighters and places an arming mine under another. Real collision and hazard logic produces dominoes and an explosion in the first two seconds. Stats remain randomized from the seed. AI starts after 2.8 seconds; the rest of the match runs normally.
- **New match** returns to fully random play. Normal matches contain no staged launches or guaranteed event outcomes.
- Watch the Chaos Index, floating `CRIT!` / `DOMINO!` / `BOOM!` / healing text, and Ringside Notes.
- **Replay seed** preserves the round seed and demo mode. Pause and 0.5× / 1× / 2× speed affect viewing, not fixed-step physics. Each round ends with one survivor, a simultaneous KO draw, or a 90-second draw.

## Validation

`npm test` uses Node's built-in test runner with no dependencies. The 53 tests cover the four unarmed moves and weapon strikes, exact crit thresholds and multipliers, stat bounds, retreat/corner behavior, seeded replay, airborne domino chains, swept collision misses, duplicate-hit prevention, mine arming and splash, dash/landing triggers, healing caps, KO exclusions, hazard lifetime/caps, the demo opening, and camera framing/replay isolation. A simulation test also runs 32 complete random matches, checks finite state and HP bounds, and confirms all four chaos events occur naturally across those rounds.

The game runs as static files locally or on GitHub Pages. No backend, remote assets, multiplayer service, or build step is required.

## Mobile spectator experience

Mobile web is the primary viewing target. At phone widths, the opening title is compact and the match, chaos counters, and playback dock take priority. Fighter stats and ringside notes are native disclosure panels, collapsed initially on phones and open on desktop.

- The bottom dock keeps **New match**, **Pause/Resume**, **Speed**, and **More** within reach. Main phone controls have at least 48px touch targets; safe-area insets accommodate home indicators and display cutouts.
- **More** contains Replay seed and Chaos demo. Tap outside or press Escape to dismiss it.
- The mobile **auto camera** enlarges the active fight using a damped camera with a two-second focus hold. Numbered edge markers identify surviving fighters outside the frame. Tap **Overview** for the entire arena, then **Auto camera** to return. Camera framing changes presentation only; it never consumes match RNG or changes physics.
- Full-arena views preserve aspect ratio in portrait and landscape. Short landscape layouts reduce header and counter spacing to keep the arena and dock visible.
- Major events have readable screen-space callouts. The end-of-round overlay names the winner and points to New match. Paused and completed rounds stop continuous Canvas redraws; tab visibility resets elapsed time to avoid a catch-up burst on return.
- Fighter rows are created once per match; health values and bars are updated in place. Canvas size is observed with ResizeObserver instead of requesting layout every animation frame.
- Reduced-motion preference defaults to Overview. If auto framing is selected manually, continuous camera panning is suppressed. Browser zoom remains enabled.

Validation includes browser checks at 320×568, 390×844, 844×390, and 1280×900: no horizontal overflow, phone touch targets, arena/counter clearance above the dock, camera and pause toggles, More/replay controls, and desktop disclosure behavior. These are browser viewport checks, not a physical iOS/Android device certification.

## Arena variety

New rounds use 2–4 rotating sweep poles instead of static walls. Each seeded map varies pole count, position, arm length, height, rotation direction, speed, 2–5 timed spike traps, and 1–3 initial mine placement attempts. Placement leaves opening fighter spawns outside each pole's sweep. Replay seed reproduces the layout. Poles use swept moving-capsule contact, tangent knockback, jump clearance, and a per-victim cooldown. A 12% lucky ricochet removes pole damage and adds extra vertical launch. Pole arms and fighters share floor-depth sorting. Spikes cycle through safe, warning, and active phases; active floor contact deals 14 damage and launches at vz=300.

The earlier wall collision implementation is retained for isolated physics tests and optional legacy layouts: swept 3D impact, spring rebounds, crate destruction, lucky wall bounces, attack obstruction, and cached obstacle routing. Default random rounds generate no static walls.

## Motion and fighting styles

The animation architecture follows the ideas visible in `computePose`, `sampleKeys`, and `ik` in the [reference game](https://github.com/meetrick/stick_brawl/blob/main/script.js): interpolate hand/foot targets, solve elbows and knees with two-bone IK, and animate torso lean and crouch. `pose.js` contains newly authored unarmed keyframes, not imported character or weapon animations. Tests enforce constant limb lengths through each animation.

- **Dash:** compress into a windup, then commit to a locked 2D burst. The first body contact in the active window hits once; afterimages make acceleration legible.
- **JumpKick:** take off, tuck the knee, extend the foot during the active window, and retract for landing. The kick has forward travel and a separate recovery.
- **Uppercut:** crouch and wind the fist back, then straighten into an upward strike with an arm trail.
- **Grab:** lunge, attach a reachable standing opponent, lift them visibly, and release a physical throw at 0.55 seconds. Damage is dealt on release. Interrupting or KOing the holder drops the victim safely out of the held state.
- **Hits and knockdowns:** impact rays, velocity-driven tumbling, loose limbs in flight, grounded knockdown/get-up poses, and KO eyes.

Each fighter rolls Walker, Runner, or Sprinter movement, a favored attack, and attack tempo. Running uses a longer stride, higher knees, opposing arm swings, a forward lean, dust, and headband drag. Sprint stamina has separate exhaustion/recovery thresholds to avoid frame-by-frame gait flicker. Aggressive fighters chase, Cowardly fighters sprint away until cornered, Brawlers close for grabs, and Tricksters circle during recovery and favor jumping kicks. Close-range specialists close the gap instead of selecting Dash whenever it first enters range.

The simulation regression runs 32 complete random rounds and verifies all four unarmed attack types and all three weapon types occur naturally, alongside the existing physics and chaos checks. The motion checks cover IK lengths, distinct continuous attack poses, gait differences, diagonal dash timing, lift-before-throw, and interrupted-grab release.

## Random weapons and combat follow-ups

Each spawn rolls Unarmed, Sword, Staff, or Hammer from the match RNG. Weapon silhouettes are drawn procedurally and move with the hand, arm IK, and weapon-angle keyframes. Weapons stow during grabs so the hands can lift and throw. Fighter details show each loadout.

| Loadout | Base damage | Reach | Attack duration | Behavior |
| --- | ---: | ---: | ---: | --- |
| Sword | 16 | 92 | 0.52s | Quick slash; a connected slash has a 35% chance to allow one short dash follow-up. |
| Staff | 13 | 122 | 0.78s | Broad sweep; up to two distinct victims, once each. |
| Hammer | 24 | 88 | 1.03s | Long windup and recovery; heavy 480 horizontal / 390 vertical launch. |

Power and critical multipliers apply to these base values. A cleaving attack shares one 10% critical roll across its victims. Swing reach, depth width, active window, and per-attack victim IDs constrain contact; targets are not repeatedly damaged while remaining in range. Weapon attacks can be interrupted during windup. Armed fighters still mix in kicks, dashes, uppercuts, and grabs according to personality and range.

Cowardly fighters can occasionally jump away while fleeing. The sprint/evade cadence and finite sword follow-up add variation without creating unlimited attack chains. Automated tests cover loadout replay, each weapon's mechanics, staff cleave limits, shared critical rolls, windup interruption, sword follow-ups, and fleeing jumps. Integration tests verify natural use of all weapon types across complete seeded rounds.

## GitHub Pages deployment

GitHub Pages publishes the `main` branch from the repository root (`/`). The root `.nojekyll` file disables Jekyll processing; JavaScript modules, CSS, and the HTML entry point are served directly. All application paths are relative, so the project works under `/stickman-auto-brawl/`. Future pushes to `main` update the hosted game automatically through GitHub's Pages build/deployment process.

For a new fork, open **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/(root)**, and save. The local `server.js`, tests, and `package.json` are development tools; the published game needs only static browser assets.
