# Stickman Auto Brawl

A mobile-first HTML5 Canvas spectator auto-battler for 2–12 procedural fighters. Random stats, personalities, weapons, flying-body collisions, and rotating poles make each seeded match different.

[Play online](https://meetrick.github.io/stickman-auto-brawl/)

## Run and test

Requires Node.js 20.11 or later. No installation or build step is needed.

```sh
npm start
npm test
```

Open http://127.0.0.1:5173. Use `?seed=72` for a reproducible match or `?seed=72&demo=1` for a staged domino opening. GitHub Pages publishes `main` from the repository root; `.nojekyll` serves the static browser modules directly. Relative paths support the `/stickman-auto-brawl/` project URL.

## Match setup and language

**New match** opens a setup dialog for participant count (2–12) and names (up to 16 characters). Names appear above fighters, in the roster, combat notes, and victory announcement. Blank inputs receive defaults. Changing the count preserves hidden draft names; Cancel leaves the current match unchanged. Setup pauses the simulation until dismissed.

English is the first-visit default. The header language button and setup selector switch English/Korean UI and combat callouts without resetting a match. Count, names, and language are remembered in this browser's localStorage, with an in-memory fallback. Names are rendered as text and escaped in HTML. Replay preserves the current round's seed, names, and count; the staged demo uses eight fighters.

## Combat and arena

- HP 80–130, base speed 90–155, power 0.8–1.25×, random favored attacks and tempo.
- Aggressive, Cowardly, Brawler, and Trickster personalities; Walker, Runner, and stamina-limited Sprinter movement.
- Grounded jab/cross Punch chains into Kick, a braking Dash, a short-hop JumpKick, Uppercut, and a physical lift-and-throw Grab, plus weapon-specific strikes.
- Unarmed, Sword (fast slash), Staff (long sweep, two victims maximum), or Hammer (slow heavy launch) loadouts. Sword hits can open one short dash follow-up; cowards backstep instead of repeatedly jumping. Ordinary hits recoil on the floor; uppercuts, throws, heavy hammers, and poles retain launch physics.
- Each attack has a 10% critical roll: 3× damage and 2× knockback. Cleave victims share the attack's critical roll.
- Thrown and knocked bodies can bowl over standing fighters, including airborne KO bodies. Swept collision checks prevent tunneling and repeated damage to the same victim during one flight.
- Each map rolls 2–4 rotating poles with different positions, lengths, heights, speeds, and directions. Jumping over a low pole can avoid it; contact launches a fighter along the sweep. A 12% lucky ricochet avoids pole damage and adds lift.
- **No landmines or floor spike traps**, including in the demo. Floors are clear except for optional health potions, which restore up to 30 HP and never revive a KO. At most three potions exist, expiring after 20 seconds.
- Defeated fighters fall once, then remain permanently still: no flailing, breathing, sliding, get-up, or environmental relaunch. Round end settles KO bodies so they are never frozen in midair. Nonlethal hits can still recover.

Legacy static-wall physics is retained for isolated collision tests; normal maps use rotating poles.

## Mobile spectator UI

The arena and live crit/domino/weapon-hit/heal counters take priority. The bottom dock uses 48px phone touch targets and safe-area padding. Roster and combat notes collapse on phones. **More** contains setup, seed replay, and the demo. Automatic close-up framing enlarges the active fight; **Overview** shows the complete arena without stretching. Edge markers identify fighters outside the close-up. Reduced-motion preference defaults to Overview and suppresses continuous panning.

Pause, 0.5× / 1× / 2× speed, and camera selection affect presentation only. Physics runs at a fixed 120 Hz. A round ends with one survivor, simultaneous KO, or a 90-second draw. Hidden tabs avoid catch-up bursts; paused/finished rounds stop continuous drawing. Canvas resizing uses ResizeObserver and roster health values update in place.

## Architecture and reference

- `app.js`: deterministic match simulation. `fighter.js`: combat, AI, movement, and defeat.
- `pose.js`: keyframed hand/foot targets and two-bone IK. `renderer.js`: articulated drawing, trails, effects, and depth sorting.
- `arena.js`: rotating poles and swept collisions. `hazards.js`: potion spawning and floor pickup contact.
- `ui.js`: spectator controls and setup. `settings.js`: preference validation/storage. `i18n.js`: English/Korean messages.
- `x/y` are floor coordinates, `z` is height, `vz` is vertical velocity; projection is `(x, y - z)`.

The paper palette, ink outlines, fluttering headbands, and keyframed end-effector/IK architecture are inspired by [meetrick/stick_brawl](https://github.com/meetrick/stick_brawl/blob/main/script.js). Poses and unarmed/weapon moves are authored for this game; no source or assets are copied.

## Validation

Node's built-in tests cover attacks/crit boundaries, IK limb lengths, attack silhouettes, grabs and interruption, weapon differences/cleave limits, sprint/evade behavior, swept body/pole collisions, trap absence, potion limits, permanent defeat, preference persistence and safe names, translations, seeded replay, and complete 2-/6-/12-player rounds. Integration checks run 32 full random matches and verify natural use of all attack and weapon types without damaging floor traps.

Browser checks include phone portrait/landscape and desktop layouts, a scrollable 12-player setup at 320×568, language/name restoration, and published GitHub Pages execution. These are browser viewport checks, not physical-device certification.

## Combat choreography

Each weapon has independent hand/foot keyframes and angle tracks aligned to its active hit window: alternating descending/rising sword cuts, a full-turn staff sweep with a second-hand grip, and a two-handed overhead hammer slam with a deep follow-through. Jump kicks stay upright, use a low ballistic hop, and have a 3.5-second reuse delay plus landing recovery. The grab lift aligns the victim more closely with the holder's hands.

Weapon ribbons are sampled from the actual recent hand and weapon-tip path, rather than a generic circular arc. Dash and short-hop afterimages sample earlier poses and travel direction; hammer contacts kick up a brief dust burst. These effects are presentation-only and are suppressed by reduced-motion preference where appropriate. Ordinary hits use sparks instead of large floating attack labels, keeping fighters legible; critical and major-event callouts remain.

Motion tests verify distinct sword directions, a continuous staff revolution, hammer overhead-to-floor travel, stable IK lengths for every weapon and variant, upright short hops, bounded jump height, combo interruption, and a grounded-combat budget over 32 full seeded rounds.

## Copyright and license

Copyright 2026 Hwangjae Lee (meetrick).

This project is licensed under the **Apache License, Version 2.0**
([Apache-2.0](LICENSE)). See [NOTICE](NOTICE) for copyright and source
acknowledgments, including the reference project
[Stick Brawl](https://github.com/meetrick/stick_brawl).
