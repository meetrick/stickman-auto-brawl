# Stickman Auto Brawl

A mobile-first HTML5 Canvas spectator auto-battler for 2–12 procedural fighters. Random stats, personalities, grounded unarmed combos, and flying-body collisions make each seeded match different. Normal matches have no weapons, poles, walls, or damaging floor traps.

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

English is the first-visit default. The header language button and setup selector switch English/Korean UI and combat callouts without resetting a match. Count, names, per-fighter style choices, and language are remembered in this browser's localStorage, with an in-memory fallback. Names are rendered as text and escaped in HTML. Replay preserves the current round's seed, names, count, and resolved styles; the staged demo uses eight fighters.

## Combat and arena

- HP 80–130, base speed 90–155, power 0.8–1.25×, random favored attacks and tempo.
- Random Ninja, Boxing, Judo, or Kickboxing disciplines affect attack weights, punch follow-ups, and recovery footwork independently of personality.
- Aggressive, Cowardly, Brawler, and Trickster personalities; Walker, Runner, and stamina-limited Sprinter movement.
- Grounded jab/cross Punch chains into Kick, a braking Dash, a short-hop JumpKick, Uppercut, and a physical lift-and-throw Grab, with no weapon attacks in normal matches.
- All fighters start and remain unarmed. Cowards backstep instead of repeatedly jumping, then commit to fighting when only two participants remain. Ordinary hits recoil on the floor; uppercuts and throws retain launch physics.
- Each attack has a 10% critical roll: 3× damage and 2× knockback. Cleave victims share the attack's critical roll.
- Thrown and knocked bodies can bowl over standing fighters, including airborne KO bodies. Swept collision checks prevent tunneling and repeated damage to the same victim during one flight.
- Open floor: no rotating poles or walls interrupt the fight.
- **No landmines or floor spike traps**, including in the demo. Floors are clear except for optional health potions, which restore up to 30 HP and never revive a KO. At most three potions exist, expiring after 20 seconds.
- Defeated fighters fall once, then remain permanently still: no flailing, breathing, sliding, get-up, or environmental relaunch. Round end settles KO bodies so they are never frozen in midair. Nonlethal hits can still recover.

Legacy wall, pole, and weapon code is retained for isolated regression tests. The browser creates open-floor, unarmed matches; it offers no weapon or obstacle mode.

## Mobile spectator UI

The arena and live crit/domino/hit/heal counters take priority. A compact first-out strip identifies last place; View standings opens the rank and elimination lists. The bottom dock uses 48px phone touch targets and safe-area padding. Roster and combat notes collapse on phones. **More** contains setup, seed replay, and the demo. Automatic close-up framing enlarges the active fight; **Overview** shows the complete arena without stretching. Edge markers identify fighters outside the close-up. Reduced-motion preference defaults to Overview and suppresses continuous panning.

Pause, 0.5× / 1× / 2× speed, and camera selection affect presentation only. Physics runs at a fixed 120 Hz. A round ends with one survivor, simultaneous KO, or a 90-second draw. Hidden tabs avoid catch-up bursts; paused/finished rounds stop continuous drawing. Canvas resizing uses ResizeObserver and roster health values update in place.

## Architecture and reference

- `styles.js`: discipline profiles and style validation.
- `app.js`: deterministic match simulation. `fighter.js`: combat, AI, movement, and defeat.
- `pose.js`: keyframed hand/foot targets and two-bone IK. `renderer.js`: articulated drawing, trails, effects, and depth sorting.
- `arena.js`: legacy obstacle physics for isolated tests. `hazards.js`: potion spawning and floor pickup contact.
- `results.js`: localized, escaped standings and elimination timeline markup.
- `ui.js`: spectator controls and setup. `settings.js`: preference validation/storage. `i18n.js`: English/Korean messages.
- `x/y` are floor coordinates, `z` is height, `vz` is vertical velocity; projection is `(x, y - z)`.

The paper palette, ink outlines, fluttering headbands, and keyframed end-effector/IK architecture are inspired by [meetrick/stick_brawl](https://github.com/meetrick/stick_brawl/blob/main/script.js). Poses and unarmed/weapon moves are authored for this game; no source or assets are copied.

## Validation

Node's built-in tests cover attacks/crit boundaries, IK limb lengths, attack silhouettes, grabs and interruption, weapon differences/cleave limits, sprint/evade behavior, swept body/pole collisions, trap absence, potion limits, permanent defeat, preference persistence and safe names, translations, seeded replay, and complete 2-/6-/12-player rounds. Integration checks run 32 full random matches and verify natural use of unarmed attacks without weapons, poles, walls, or damaging floor traps. Ranking tests cover KO-time recording, shared places, timeout survivors, event-log truncation, duplicate/unsafe names, replay reset, and deterministic complete rounds. Style tests check AI move preferences, valid combinations and interruption, legacy preference migration, resolved-style replay, distinct stances, every attack/variant's IK lengths, inert KO poses, and full rounds for all four disciplines.

Browser checks include phone portrait/landscape and desktop layouts, a scrollable 12-player setup at 320×568, language/name restoration, and published GitHub Pages execution. These are browser viewport checks, not physical-device certification.

## Fighting styles

Each participant can use **Random style**, **Ninja**, **Boxing**, **Judo**, or **Kickboxing** in the match setup dialog. Random is the default, including for older saved preferences. Choices are saved per participant; decreasing and increasing the fighter count preserves hidden draft choices. Cancel discards style edits. Changing UI language translates choices without changing the battle. The roster and standings display the resolved discipline.

| Style | Movement and pose | Attack preference and punch follow-up |
| --- | --- | --- |
| Ninja | Low stance, forward-leaning run, wider lateral recovery steps, face wrap | Low sweeping kicks and dashes; Punch → Kick → Dash |
| Boxing | High guard, short grounded shuffles, gloves | Punches and uppercuts; Punch → Punch → Uppercut. AI never chooses kicks or grabs. |
| Judo | Wide base, open hands, close pressure, waist belt | Grips and a lower hip-loading throw; Punch → Grab |
| Kickboxing | Guarded steps, hand wraps, alternating side/high roundhouse kicks | Kicks mixed with punches; Punch → Punch → Kick |

These are stylized procedural game disciplines rather than sporting-rule simulations. Styles affect choices, combinations, footwork, and presentation; they do not directly multiply HP, attack damage, or movement speed. Random base stats and personality remain independent. A follow-up requires contact, range, and recovery, and a hit cancels pending combinations. Short-hop cooldowns and grounded-combat limits still apply. Pure pose sampling consumes no simulation RNG. Fixed style selections still consume the normal spawn style roll, so they cannot shift another participant's base stat rolls.

## Impact feedback

Heavy uppercuts/throws receive a 25 ms presentation hit-stop; critical or signature contacts receive 45 ms. A shared 200 ms gate prevents overlapping contacts from stacking freezes. A short expanding contact ring and damped Canvas shake (at most 2.2 CSS pixels horizontally) emphasize the hit. Light jabs do not stop play. Reduced-motion preference disables hit-stop, shake, and the expanding ring.

`impact.js` observes event objects without mutating the match or consuming RNG. The UI delays fixed simulation steps briefly and drops excess frame backlog on impact, preventing a fast-forward burst after the hold. Seeded physics, combat time, and elimination ordering remain deterministic; presentation time can run slightly longer. New matches reset feedback, and manual pause/setup do not advance it.

## Combat choreography

Normal matches use original procedural jab/cross, side-kick, dash, short-hop kick, uppercut, and lift-and-throw poses. Jabs and rear-hand crosses alternate torso loading and extension, then finish with a planted side kick. End-effector trails follow the fist/foot path. Grounded victims recoil through their chest and head while keeping their feet planted; landing bends the knees before recovery. Jump kicks stay upright, use a low ballistic hop, and have a 3.5-second reuse delay plus landing recovery.

The grounded exchange direction was requested with the [Stickman Fighter Epic Battle reference](https://poki.com/kr/g/stickman-fighter-epic-battle). No assets or source were copied. Legacy weapon choreography remains in isolated regression tests, but weapons never spawn in browser matches.

## Elimination order and standings

Each knockout is recorded when HP reaches zero at the end of a fixed 120 Hz physics step, even if the body is still airborne. The elimination ledger is independent of the bounded combat-event feed. First out is last place; the survivor is first. Same-step knockouts share a place and an elimination position, using competition ranking (for example, 1, 2, 2, 4). Participant IDs only order display rows inside a tie; they do not decide a winner.

During a round, surviving fighters have no assigned place. At the 90-second limit, any remaining survivors share first place, without an HP tiebreak or a fabricated elimination. If everyone is knocked out, there is no surviving winner, and the last simultaneous KO group shares first place. The UI explains ties and timeout results in English and Korean.

The first-out strip stays visible below the arena. Final standings open automatically at round end; View standings scrolls to all participants and the chronological elimination log, with participant numbers and times shown to 0.01 seconds. Long summary names are limited to two lines; full names remain in the lists. Results belong to the current round and reset on a new match, replay, or page reload; match history is not persisted. Names, style choices, and participant/language preferences remain saved separately.

## Copyright and license

Copyright 2026 Hwangjae Lee (meetrick).

This project is licensed under the **Apache License, Version 2.0**
([Apache-2.0](LICENSE)). See [NOTICE](NOTICE) for copyright and source
acknowledgments, including the reference project
[Stick Brawl](https://github.com/meetrick/stick_brawl).
