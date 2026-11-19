# Stickman Auto Brawl

A mobile-first HTML5 Canvas spectator auto-battler for 2–24 procedural fighters. Random stats, personalities, grounded unarmed combos, and flying-body collisions make each seeded match different. Normal matches have no weapons, poles, walls, or damaging floor traps.

[Play online](https://meetrick.github.io/stickman-auto-brawl/)

## Run and test

Requires Node.js 20.11 or later. No installation or build step is needed. The HTML entry calls UI boot once, with a shared release query on module imports so existing browsers fetch a consistent action-module release. Keep that query aligned in the HTML, runtime imports, and Node tests when updating the release.

```sh
npm start
npm test
```

Open http://127.0.0.1:5173. Use `?seed=72` for a reproducible match or `?seed=72&demo=1` for a staged domino opening. GitHub Pages publishes `main` from the repository root; `.nojekyll` serves the static browser modules directly. Relative paths support the `/stickman-auto-brawl/` project URL.

## Match setup and language

New installations default to eight participants; existing saved counts and names are preserved. Up to 24 participants can join.

**New match** opens a setup dialog for participant count (2–24) and names (up to 16 characters). Names appear above fighters, in the roster, combat notes, and victory announcement. Blank inputs receive defaults. Changing the count preserves hidden draft names; Cancel leaves the current match unchanged. Setup pauses the simulation until dismissed.

English is the first-visit default. The header language button and setup selector switch English/Korean UI and combat callouts without resetting a match. Count, names, per-fighter style choices, and language are remembered in this browser's localStorage, with an in-memory fallback. Names are rendered as text and escaped in HTML. Replay preserves the current round's seed, names, count, and resolved styles; the staged demo uses eight fighters.

## Combat and arena

- HP 80–130, base speed 90–155, power 0.8–1.25×, random favored attacks and tempo.
- Random Ninja, Boxing, Judo, Kickboxing, or Taekwondo disciplines affect attack weights, punch follow-ups, and recovery footwork independently of personality.
- Aggressive, Cowardly, Brawler, Trickster, Opportunist, and Counterfighter personalities; Walker, Runner, and stamina-limited Sprinter movement.
- Grounded jab/cross Punch chains into Kick, a braking Dash, a grounded Uppercut, and a low physical lift-and-throw Grab. Normal AI never selects JumpKick; the legacy move remains available to direct physics tests. There are no weapon attacks in normal matches.
- All fighters start and remain unarmed. Cowards retreat with alternating lateral steps and short grounded bursts instead of repeatedly jumping, then commit to fighting when only two participants remain. Ordinary hits and uppercuts recoil on the floor; throws retain a short, low flight for collateral collisions.
- Each attack has a 10% critical roll: 3× damage and 2× knockback. Cleave victims share the attack's critical roll.
- Thrown and knocked bodies can bowl over standing fighters, including airborne KO bodies. Swept collision checks prevent tunneling and repeated damage to the same victim during one flight.
- Open floor: no rotating poles or walls interrupt the fight.
- **No landmines or floor spike traps**, including in the demo. Floors are clear except for optional health potions, which restore up to 30 HP and never revive a KO. At most three potions exist, expiring after 20 seconds.
- Defeated fighters fall once, then remain permanently still: no flailing, breathing, sliding, get-up, or environmental relaunch. Round end settles KO bodies so they are never frozen in midair. Nonlethal hits can still recover.

Legacy wall, pole, and weapon code is retained for isolated regression tests. The browser creates open-floor, unarmed matches; it offers no weapon or obstacle mode.

## Mobile spectator UI

The arena and live crit/domino/hit/heal counters take priority. A compact first-out strip identifies last place; View standings opens the rank and elimination lists. The bottom dock uses 48px phone touch targets and safe-area padding. Roster and combat notes collapse on phones. **More** contains setup, seed replay, and the demo. Automatic close-up framing enlarges the active fight and briefly prioritizes a signature attacker and its target from windup, with a 1.1-second hold to avoid competing signatures stealing focus; **Overview** shows the complete arena without stretching. Edge markers identify fighters outside the close-up. Reduced-motion preference defaults to Overview and suppresses continuous panning.

Pause, 0.5× / 1× / 2× speed, and camera selection affect presentation only. Physics runs at a fixed 120 Hz. A round ends with one survivor, simultaneous KO, or a 90-second draw. Hidden tabs avoid catch-up bursts; paused/finished rounds stop continuous drawing. Canvas resizing uses ResizeObserver and roster health values update in place.

## Architecture and reference

- `styles.js`: discipline profiles and style validation. `defense.js`: timed guards/dodges, reaction reads, and directional contact resolution.
- `app.js`: deterministic match simulation. `fighter.js`: combat, AI, movement, and defeat.
- `pose.js`: keyframed hand/foot targets and two-bone IK. `renderer.js`: articulated drawing, trails, effects, and depth sorting.
- `arena.js`: legacy obstacle physics for isolated tests. `hazards.js`: potion spawning and floor pickup contact.
- `results.js`: localized, escaped standings and elimination timeline markup.
- `ui.js`: spectator controls and setup. `settings.js`: preference validation/storage. `i18n.js`: English/Korean messages.
- `x/y` are floor coordinates, `z` is height, `vz` is vertical velocity; projection is `(x, y - z)`.

The paper palette, ink outlines, fluttering headbands, and keyframed end-effector/IK architecture are inspired by [meetrick/stick_brawl](https://github.com/meetrick/stick_brawl/blob/main/script.js). Poses and unarmed/weapon moves are authored for this game; no source or assets are copied.

## Validation

Node's built-in tests cover attacks/crit boundaries, IK limb lengths, attack silhouettes, grabs and interruption, weapon differences/cleave limits, sprint/evade behavior, swept body/pole collisions, trap absence, potion limits, permanent defeat, preference persistence and safe names, translations, seeded replay, and complete 2-/6-/12-/16-/24-player rounds. Integration checks run 32 full random matches and verify natural use of unarmed attacks without weapons, poles, walls, or damaging floor traps. Ranking tests cover KO-time recording, shared places, timeout survivors, event-log truncation, duplicate/unsafe names, replay reset, and deterministic complete rounds. Style tests check AI move preferences, valid combinations and interruption, legacy preference migration, resolved-style replay, distinct stances, every attack/variant's IK lengths, inert KO poses, and full rounds for all five disciplines.

Browser checks include phone portrait/landscape and desktop layouts, a scrollable 24-player setup at 320×568, language/name restoration, and published GitHub Pages execution. These are browser viewport checks, not physical-device certification.

## Fighting styles

Each participant can use **Random style**, **Ninja**, **Boxing**, **Judo**, **Kickboxing**, or **Taekwondo** in the match setup dialog. Random is the default, including for older saved preferences. Choices are saved per participant; decreasing and increasing the fighter count preserves hidden draft choices. Cancel discards style edits. Changing UI language translates choices without changing the battle. The roster and standings display the resolved discipline.

| Style | Movement and pose | Attack preference and punch follow-up |
| --- | --- | --- |
| Ninja | Low stance, forward-leaning run, wider lateral recovery steps, face wrap | Low sweeping kicks and dashes; Punch → Kick → Dash |
| Boxing | High guard, short grounded shuffles, gloves | Punches and uppercuts; Punch → Punch → Uppercut. AI never chooses kicks or grabs. |
| Judo | Wide base, open hands, close pressure, waist belt | Grips and a lower hip-loading throw; Punch → Grab |
| Kickboxing | Guarded steps, hand wraps, alternating side/high roundhouse kicks | Kicks mixed with punches; Punch → Punch → Kick |
| Taekwondo | Side-on stance, chambered side kicks, higher roundhouse kicks, collar and belt | Kick → Kick → Kick; spinning hook signature. No AI grabs or uppercuts. |

These are stylized procedural game disciplines rather than sporting-rule simulations. Styles affect choices, combinations, footwork, and presentation; they do not directly multiply HP, attack damage, or movement speed. Random base stats and personality remain independent. A follow-up requires contact, range, and recovery, and a hit cancels pending combinations. Short-hop cooldowns and grounded-combat limits still apply. Pure pose sampling consumes no simulation RNG. Fixed style selections still consume the normal spawn style roll, so they cannot shift another participant's base stat rolls.

## Defense and counters

`brain.js` separates temperament from martial art. Aggressive fighters pursue the nearest opponent; Brawlers pressure and briefly retaliate against the last attacker; Cowardly fighters use bounded zigzag retreats and look for safe nearby healing when injured; Tricksters retain wide flanking routes. Opportunists prefer vulnerable opponents already occupied by another fighter, while Counterfighters circle at range and wait for visible recovery before committing. Counterfighters also attempt defense more often. No temperament predicts critical rolls or gets extra HP, damage, invulnerability, or free healing.

Tactical movement plans refresh at most every 0.2 seconds, opportunists hold a valid target for 0.6 seconds, and patient waits last at most 0.45–0.65 seconds before a forced commitment. Emergency withdrawals last 0.7 seconds before 1.1 seconds of re-engagement. Flee routes score nearby opponents and walls to avoid blindly backing into another fighter. Injured survival personalities may pursue an armed potion within 230 units if opponents do not occupy it; pursuits are bounded. Real counters, connected combinations and the final duel override tactical waiting. Attack, hold, stun and KO physics continue to own their respective states. Brain calculations consume no combat RNG; the same seed and setup reproduce the round.

Fighters can react once to a targeted incoming windup. Style and personality influence whether they try a frontal guard or grounded dodge. Defense costs stamina, has startup/recovery exposure, and shares a 1.15–1.65 second reuse gate. It cannot start while attacking, stunned, airborne, held, or low on stamina.

A successful frontal guard covers one contact, takes 25% chip damage and 22% horizontal push, and prevents launch. Grabs and rear attacks bypass it; critical, signature, and dash contacts break it while retaining some damage reduction. A dodge's brief active window avoids only the specific attack it read, once; another attacker, a new attack, grabs, or a flying body remain dangerous. Dodged and successfully blocked attacks cannot open the attacker's connected combo. Successful defense opens a short counter opportunity rather than a guaranteed hit. The defender must recover and remain in range.

Cowardly fighters face their nearest opponent while retreating along alternating diagonal routes. Short escape accelerations stay on the floor and use the existing stamina-limited sprint. A retreat lasts 0.8–1.25 seconds before a 1.2-second commitment to re-engage; exhaustion, corners, successful defensive counter opportunities, and the final duel also prevent endless fleeing. These behaviors apply when the random Cowardly personality is assigned; no participant receives a forced personality.

Guard poses raise both forearms, boxing dodges duck through the torso, and ninja dodges use a low side-step. Grounded backward run cycles look toward the threat. Dodge afterimages and short motion streaks obey reduced-motion preference. A small guard crescent and one localized BLOCK / DODGED / GUARD BREAK notice explain defensive contacts without adding another floating label. Chip hits on a successful guard do not trigger heavy hit-stop.

Defense tests cover directional chip damage, guard breaks/bypasses, one-attack dodge windows, recovery exposure, resource/cooldown gates, counters, natural defense and escape use, deterministic full-round rankings, and IK geometry for every style's defense and recovery.

## Impact feedback

Heavy uppercuts/throws receive a 25 ms presentation hit-stop; critical or signature contacts receive 45 ms. A shared 200 ms gate prevents overlapping contacts from stacking freezes. A short expanding contact ring and damped Canvas shake (at most 2.2 CSS pixels horizontally) emphasize the hit. Light jabs do not stop play. Reduced-motion preference disables hit-stop, shake, and the expanding ring.

`impact.js` observes event objects without mutating the match or consuming RNG. The UI delays fixed simulation steps briefly and drops excess frame backlog on impact, preventing a fast-forward burst after the hold. Seeded physics, combat time, and elimination ordering remain deterministic; presentation time can run slightly longer. New matches reset feedback, and manual pause/setup do not advance it.

## Combat choreography

`martial-motion.js` supplies original discipline-specific ordinary attack poses, not only special moves. Ninja keeps a deep crouch and sweeps near the floor; Boxing uses a narrow high guard, driven jabs/crosses and deep uppercut loading; Judo reaches with both hands and lowers the hips before the throw; Kickboxing drives forward into body kicks; Taekwondo leans away into large, high extended kicks. Hip drive, chambering, follow-through and recoil make the silhouettes visibly different before a signature unlocks. New strike poses align full extension to the attack's actual contact time without changing damage, reach or collision timing.

Turning projection keeps the hip and supporting foot in place and preserves at least 72% of the torso's authored horizontal silhouette when edge-on. Limbs wrap around the body instead of collapsing and sliding the whole fighter. Authored limbs still retain their original IK lengths. Regression tests compare ordinary style silhouettes and attack heights, including low Ninja sweeps, Kickboxing body kicks and Taekwondo high kicks.

Guard and dodge poses also differ by discipline: low Ninja slips, compact Boxing shell/weave, wide open-hand Judo frames, squared Kickboxing guard, and side-on Taekwondo leans. Judo hands use a small open grip silhouette. Grounded hit reactions bend the torso farther in the actual push direction while retaining the discipline's stance height; they do not introduce launches or extra stun. Settled KO bodies remain inert.

Each style periodically upgrades its familiar attack into a signature animation: Ninja **Shadow Kick**, Boxing **Dynamite Hook**, Judo **Hip Throw**, Kickboxing **Spinning Heel**, and Taekwondo **Spinning Hook Kick**. After 1.5 seconds of fighter age, every third use of the matching move can become a signature when its seven-second reuse gate is clear. Signatures use longer, explicit windup/contact/recovery timing, two restrained pose afterimages, and a longer fist/foot trail. The Judo victim visibly rotates across the hip before release. The attacker stays grounded; no full-body flips or extra jumps are introduced.

Signature contacts use the same damage and knockback values as their base attack and retain the normal 10% critical roll. Windups can be interrupted, missed signatures deal no damage, and interrupted holds release the victim. Technique names remain available in the collapsed combat notes. The arena keeps impact flashes and trails, but no floating attack names. Its single brief banner prioritizes eliminations and otherwise shows only a connected combo finisher, without naming the technique. Tests exercise all five signature contacts, interruptibility, cooldowns, IK lengths, bounded body rotation, and natural signature use across 32 full matches.

Normal matches use original procedural jab/cross, side-kick, dash, grounded uppercut, and low lift-and-throw poses. Jabs and rear-hand crosses alternate torso loading and extension, then finish with a planted side kick. End-effector trails follow the fist/foot path. Grounded victims recoil through their chest and head while keeping their feet planted; landing bends the knees before recovery. The legacy JumpKick remains upright with a low ballistic hop and a 3.5-second reuse delay plus landing recovery, but no normal AI discipline selects it.

The grounded exchange direction was requested with the [Stickman Fighter Epic Battle reference](https://poki.com/kr/g/stickman-fighter-epic-battle). No assets or source were copied. Legacy weapon choreography remains in isolated regression tests, but weapons never spawn in browser matches.

Grounded turning choreography also takes movement inspiration from the [Supreme Duelist Stickman animation reference](https://www.youtube.com/watch?v=d5YYlPaWbIk), using independently authored procedural motion. Ninja signature kicks and Kickboxing/Taekwondo turning kicks rotate around the upright axis on a planted support foot, completing the turn at contact. This is a shallow 3D projection, not a screen-space flip: head height and the support foot stay fixed during projection, while torso/limb depth and the visible face change through the turn. Punches alternate loading and releasing the shoulders, with a sharper jab recovery. Normal unarmed attack recovery is 0.18–0.42 seconds before the fighter's tempo multiplier, keeping exchanges brisk without shortening interruptible signature windups. No extra particles, flashes or shake were added for this change.

Authored IK geometry stays separate from its visual projection. The same projection is used for the fighter, existing afterimages and existing strike trails. Rotation and projection consume no RNG and never move collision boxes, extend attack reach or add contacts. Tests verify planted-foot turns, forward-facing contact, torso loading, finite projected geometry, interruption, immutable KO bodies, and identical battle results with or without rendering poses.

## Connected combos and finishers

Connected follow-ups form readable sequences: Ninja Punch → Kick → Silent Rush, Boxing Punch → Punch → Rising Uppercut, Judo Punch → Grand Hip Throw, Kickboxing Punch → Punch → Spinning Heel, and Taekwondo Kick → Kick → Spinning Hook Kick. An eligible final follow-up can use its named finisher after 1.5 seconds of fighter age while the shared seven-second signature gate is clear. Otherwise it remains a normal final attack. Ninja's low dash and Boxing's rising uppercut have dedicated finisher tracks; Judo, Kickboxing, and Taekwondo extend their existing signature choreography with the appropriate finish timing.

The single moment banner shows eliminations and real combo finishes; routine hits, counters, guards, dodges, and critical notices stay quiet. Dodged or guarded contacts cannot advance a combo. Combo finish notices identify the attacking fighter; the combat feed shows attacker → victim for hits. The display does not fabricate multi-hits or add damage multipliers. All five styles retain grounded movement, defense/counterplay, and immutable settled KO poses. Tests verify finisher contact/interruption, all-style IK geometry, localized combo/counter labels, correct actor attribution, and natural finishers across 40 seeded rounds.

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


## Crowd movement

For 13–24 participants, two spaced starting rows prevent overlapping spawn clusters. Every 0.2 seconds, a deterministic planner chooses approach positions around opponents and favors nearby free space. Aggressive fighters continue to chase the nearest opponent; cowardly fighters keep reacting to the nearest threat. Other personalities can spread pressure between opponents, while active attacks, follow-ups and counter opportunities retain their commitment.

Approach distance respects each discipline: Judo closes for throws, Boxing steps into punching range, and kick specialists keep more room. Local steering and gentle separation reduce overlapping feet during free movement. They do not reposition attacks, guards, dodges, held fighters, airborne bodies, recoil, or defeated fighters. Temporary contact during a grab or rush remains intentional. The final duel uses direct pursuit. The planner consumes no combat RNG and remains reproducible with the same seed and settings.

Close-up edge markers show at most four badges per side, grouping additional offscreen fighters into a `+N` badge. Full standings still include every participant. Navigation tests cover spawn spacing, reachable approach positions, protected combat/death states, deterministic 24-player rankings, and reduced sustained crowd overlap without suppressing attack activity.
