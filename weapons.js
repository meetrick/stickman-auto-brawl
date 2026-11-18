// Loadouts affect real combat timing, reach, knockback, and target coverage.
export const WEAPONS = Object.freeze({
  None: { label: 'Unarmed', length: 0 },
  Sword: { label: 'Sword', length: 46, strike: { damage: 16, knockback: 330, lift: 200, reach: 92, engage: 108, windup: .21, duration: .52, activeEnd: .36, cleave: 1, arcWidth: 42 } },
  Staff: { label: 'Staff', length: 70, strike: { damage: 13, knockback: 290, lift: 170, reach: 122, engage: 138, windup: .31, duration: .78, activeEnd: .58, cleave: 2, arcWidth: 78 } },
  Hammer: { label: 'Hammer', length: 43, strike: { damage: 24, knockback: 480, lift: 390, reach: 88, engage: 100, windup: .42, duration: 1.03, activeEnd: .66, cleave: 1, arcWidth: 48 } },
});
