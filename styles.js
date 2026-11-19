// Stylized game disciplines, not a simulation of sporting rules.
export const STYLES = Object.freeze({
  Ninja: { preferred: 'Kick', flank: .65, recovery: .17, sideStep: 80,
    finisher: { text: 'SILENT RUSH!', timing: { windup: .16, activeEnd: .39, duration: .64 } },
    signature: { move: 'Kick', text: 'SHADOW KICK!', timing: { windup: .24, activeEnd: .39, duration: .70 } },
    weights: { Punch: 2, Kick: 5, Dash: 3, JumpKick: .65, Uppercut: .4, Grab: .4 }, combo: ['Kick', 'Dash'] },
  Boxing: { preferred: 'Punch', flank: .15, recovery: .14, sideStep: 35,
    finisher: { text: 'RISING UPPERCUT!', timing: { windup: .25, activeEnd: .36, duration: .64 } },
    signature: { move: 'Punch', text: 'DYNAMITE HOOK!', timing: { windup: .23, activeEnd: .32, duration: .60 } },
    weights: { Punch: 8, Kick: 0, Dash: 1, JumpKick: 0, Uppercut: 3, Grab: 0 }, combo: ['Punch', 'Uppercut'] },
  Judo: { preferred: 'Grab', flank: .08, recovery: 0, sideStep: 0,
    finisher: { text: 'GRAND HIP THROW!', timing: { windup: .22, throwAt: .70, liftDuration: .40, duration: 1.06 } },
    signature: { move: 'Grab', text: 'HIP THROW!', timing: { windup: .20, throwAt: .67, liftDuration: .38, duration: 1.0 } },
    weights: { Punch: 2, Kick: .3, Dash: 1, JumpKick: 0, Uppercut: .4, Grab: 9 }, combo: ['Grab'] },
  Kickboxing: { preferred: 'Kick', flank: .25, recovery: .10, sideStep: 30,
    finisher: { text: 'SPINNING HEEL!', timing: { windup: .29, activeEnd: .43, duration: .76 } },
    signature: { move: 'Kick', text: 'SPINNING HEEL!', timing: { windup: .29, activeEnd: .43, duration: .76 } },
    weights: { Punch: 4, Kick: 7, Dash: 1, JumpKick: .35, Uppercut: 1, Grab: .3 }, combo: ['Punch', 'Kick'] },
  Taekwondo: { preferred: 'Kick', flank: .35, recovery: .12, sideStep: 45, comboStarter: 'Kick',
    finisher: { text: 'SPINNING HOOK KICK!', timing: { windup: .27, activeEnd: .42, duration: .72 } },
    signature: { move: 'Kick', text: 'SPINNING HOOK KICK!', timing: { windup: .27, activeEnd: .42, duration: .72 } },
    weights: { Punch: 1, Kick: 10, Dash: .6, JumpKick: .4, Uppercut: 0, Grab: 0 }, combo: ['Kick', 'Kick'] },
});
export const STYLE_NAMES = Object.keys(STYLES);
export function normalizeStyle(value) { return STYLE_NAMES.includes(value) ? value : 'Random'; }
export function styleProfile(value) { return STYLES[value] || STYLES.Kickboxing; }
