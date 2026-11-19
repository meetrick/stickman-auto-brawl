# Cinematic motion rollout

The combat simulation is already functional. This work changes presentation,
not health, hit timing, reach, AI, RNG, ranking or knockout physics.

1. [x] Add an authored full-body rig and a two-character motion studio.
   Start with Boxing and Taekwondo. Separate the staged motion study from a
   real simulated bout; make effects optional and show contact frames.
2. [ ] Author run, braking, stance and grounded attack sequences. Add foot
   contact locking and short pose transitions. Verify bone lengths, grounded
   support, interruption and immutable defeated bodies.
3. [ ] Connect the motion layer to normal matches, preserving legacy styles
   as fallbacks. Verify deterministic combat with/without rendering, mobile
   portrait/landscape, reduced motion, replay and 24-fighter rendering cost.
4. [ ] Test and commit each chunk, merge, publish both the game and studio,
   and provide a reviewable visual result.

## Visual acceptance

- A support foot stays in the same world position through its contact phase.
- The torso has separate waist and chest motion; elbows and knees follow
  authored arcs instead of snapping between unreachable end targets.
- Run → brake → ready and attack → guard have short, continuous transitions.
- Boxing has compact guards, shoulder-led punches and low slips. Taekwondo
  has a side-on stance, a distinct knee chamber and long grounded kicks.
- Attacks remain readable without trails, flashes, hit-stop or camera shake.
- Staged defenses and reactions are explicitly labeled as choreography;
  simulated bout contacts are driven only by real combat events.

## Subsequent expansion

After this Boxing/Taekwondo foundation is visually reviewed, author the same
rig treatment for Ninja, Judo and Kickboxing. Their existing authored poses
remain in the game during this rollout. Do not claim film-quality motion or
full five-style migration based only on passing geometry tests.
