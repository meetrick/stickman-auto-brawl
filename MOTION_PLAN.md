# Cinematic motion rollout

The combat simulation is already functional. This work changes presentation,
not health, hit timing, reach, AI, RNG, ranking or knockout physics.

1. [x] Add an authored full-body rig and a two-character motion studio.
   Start with Boxing and Taekwondo. Separate the staged motion study from a
   real simulated bout; make effects optional and show contact frames.
2. [x] Author run, braking, stance and grounded attack sequences. Add foot
   contact locking and short pose transitions. Verify bone lengths, grounded
   support, interruption and immutable defeated bodies.
3. [x] Connect the motion layer to normal matches, extending the rig to all
   five styles. Preserve held, airborne and legacy attack poses as fallbacks.
   Verify deterministic combat with/without rendering, mobile portrait and
   landscape, reduced motion, replay and 24-fighter rendering cost.
4. Test and commit each chunk, merge, publish both the game and studio,
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

## Refinement after this rollout

The foundation was reviewed with Boxing/Taekwondo before adding Ninja's low
sweeps, Judo's grip/hip throw and Kickboxing's body/heel kicks to the same rig.
The studio deliberately retains the focused Boxing/Taekwondo choreography;
normal matches use all five disciplines. Further clip polish should be judged
in the effects-free studio first, not inferred from passing geometry tests.
