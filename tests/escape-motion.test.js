import test from 'node:test';
import assert from 'node:assert/strict';
import {Match,STEP} from '../app.js?v=20261119-martial-motion';
import {computePose} from '../pose.js?v=20261119-martial-motion';
import {STYLE_NAMES} from '../styles.js?v=20261119-martial-motion';
import {ImpactFeedback,selectMoment} from '../impact.js?v=20261119-martial-motion';
function setup(){
 const w=new Match(12,3),[f,a,c]=w.fighters;
 Object.assign(f,{x:500,y:400,cooldown:1,personality:'Cowardly',style:'Ninja'});
 Object.assign(a,{x:600,y:400,readyAt:100});Object.assign(c,{x:1000,y:550,readyAt:100});w.rng=()=>.1;
 return {w,f,a,c};
}
test('cowardly retreats zigzag on the floor, face the opponent, and stop retreating after a short burst',()=>{
 const {w,f}=setup();f.think(STEP,w);const first=f.vy;
 assert.equal(f.intent,'flee');assert.equal(f.facing,1);assert.ok(f.vx<0);assert.notEqual(first,0);assert.equal(f.vz,0);
 w.time=.55;f.think(STEP,w);assert.ok(first*f.vy<0);assert.ok(f.vx<0);assert.equal(f.facing,1);
 w.time=1.3;f.think(STEP,w);assert.notEqual(f.intent,'flee');assert.ok(f.courageUntil>w.time);
});
test('exhaustion, corners, and the final duel force a fleeing personality to engage',()=>{
 for(const scenario of ['exhausted','corner','duel']){
  const {w,f,a,c}=setup();
  if(scenario==='exhausted'){f.stamina=.2;f.exhausted=true;}
  if(scenario==='corner'){f.x=w.bounds.left+5;a.x=f.x+100;}
  if(scenario==='duel')c.receiveHit(999,0,0,0);
  f.think(STEP,w);assert.notEqual(f.intent,'flee');assert.ok(f.vx>0||f.attack);
 }
});
test('guard, slip and side-step silhouettes preserve joints through recovery for every style',()=>{
 const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const signatures=new Set();
 for(const style of STYLE_NAMES)for(const kind of ['guard','dodge']){
  const {w,f,a}=setup();f.style=style;f.startDefense(kind,a,w);const duration=f.defense.duration;
  for(let i=0;i<=50;i++){
   f.defense.elapsed=duration*i/50;const p=computePose(f);
   for(const arm of [p.main,p.off]){assert.ok(Math.abs(distance(p.shoulder,arm.joint)-23)<1e-6);assert.ok(Math.abs(distance(arm.joint,arm.tip)-23)<1e-6);}
   for(const leg of [p.front,p.back]){assert.ok(Math.abs(distance(p.hip,leg.joint)-29)<1e-6);assert.ok(Math.abs(distance(leg.joint,leg.tip)-29)<1e-6);}
   assert.ok(Math.abs(p.rotation)<.1);if(kind==='dodge'&&i===25)signatures.add(JSON.stringify(p));
  }
  f.hp=0;f.settleDeath(w);const frozen=computePose(f);f.age+=10;assert.deepEqual(computePose(f),frozen);
 }
 assert.ok(signatures.size>=3);
});
test('blocks do not trigger heavy hit-stop; routine defensive notices stay quiet',()=>{
 const f=new ImpactFeedback();assert.equal(f.observe([{type:'hit',move:'Uppercut',blocked:true}]),false);assert.equal(f.stop,0);
 const block={type:'block',time:1};assert.equal(selectMoment([{type:'heal',time:1.1},block],1.2),null);
});
test('natural rounds contain bounded escape bursts while preserving complete rankings',()=>{
 let escapes=0;
 for(let seed=0;seed<20;seed++){
  const w=new Match(seed);for(let i=0;i<10810&&!w.finished;i++)w.update();
  escapes+=w.stats.escapes||0;assert.equal(w.finished,true);assert.equal(w.standings.length,8);
  assert.ok(w.fighters.every(f=>[f.x,f.y,f.z,f.hp].every(Number.isFinite)));
 }
 assert.ok(escapes>5);
});
