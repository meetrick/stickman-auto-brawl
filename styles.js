// Stylized game disciplines, not a simulation of sporting rules.
export const STYLES = Object.freeze({
  Ninja: { preferred: 'Kick', flank: .65, recovery: .17, sideStep: 80,
    weights: { Punch: 2, Kick: 5, Dash: 3, JumpKick: .65, Uppercut: .4, Grab: .4 }, combo: ['Kick', 'Dash'] },
  Boxing: { preferred: 'Punch', flank: .15, recovery: .14, sideStep: 35,
    weights: { Punch: 8, Kick: 0, Dash: 1, JumpKick: 0, Uppercut: 3, Grab: 0 }, combo: ['Punch', 'Uppercut'] },
  Judo: { preferred: 'Grab', flank: .08, recovery: 0, sideStep: 0,
    weights: { Punch: 2, Kick: .3, Dash: 1, JumpKick: 0, Uppercut: .4, Grab: 9 }, combo: ['Grab'] },
  Kickboxing: { preferred: 'Kick', flank: .25, recovery: .10, sideStep: 30,
    weights: { Punch: 4, Kick: 7, Dash: 1, JumpKick: .35, Uppercut: 1, Grab: .3 }, combo: ['Punch', 'Kick'] },
});
export const STYLE_NAMES = Object.keys(STYLES);
export function normalizeStyle(value) { return STYLE_NAMES.includes(value) ? value : 'Random'; }
export function styleProfile(value) { return STYLES[value] || STYLES.Kickboxing; }
