import test from 'node:test';
import assert from 'node:assert/strict';
import {Match, STEP} from '../app.js?v=20261119-cinema';
import {STYLES, STYLE_NAMES} from '../styles.js?v=20261119-cinema';
import {computePose} from '../pose.js?v=20261119-cinema';

function setup(style){
 const w=new Match(12,3,{styles:Array(3).fill(style)}),[a,b,c]=w.fighters;
 Object.assign(a,{x:500,y:400,age:2,cooldown:0,readyAt:100});
 Object.assign(b,{x:540,y:400,hp:500,maxHp:500,readyAt:100});
 Object.assign(c,{x:1000,y:550,readyAt:100});w.rng=()=>.5;
 const name=STYLES[style].signature.move;a.attackVariants[name]=2;
 return {w,a,b,name};
}
test('each third eligible style attack uses a signature with a readable windup and one real contact',()=>{
 for(const style of STYLE_NAMES){
  const {w,a,b,name}=setup(style);assert.ok(a.startAttack(name,b));
  assert.equal(a.attack.signature,STYLES[style].signature.text);assert.ok(a.signatureCooldown>=7);
  const move=a.getMove(name);assert.equal(a.attack.duration,move.duration);
  for(let i=0;i<Math.floor(move.windup/STEP)-1;i++)w.update();
  assert.equal(b.hp,500,'preparation does not cause an early hit');
  for(let i=0;i<140;i++)w.update();
  const hits=w.events.filter(e=>e.signature);assert.equal(hits.length,1,style);
  assert.equal(hits[0].text,STYLES[style].signature.text);assert.equal(w.stats.signatures,1);
  assert.ok(Math.abs(500-b.hp-move.damage*a.power)<1e-8,'signature is not a hidden damage boost');
  a.attack=null;a.cooldown=0;a.attackVariants[name]=5;
  assert.ok(a.startAttack(name,b));assert.equal(a.attack.signature,null,'seven-second gate prevents repeated signatures');
 }
});
test('signature poses preserve limb lengths through windup, contact and recovery without flipping the fighter',()=>{
 const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 for(const style of STYLE_NAMES){
  const {a,b,name}=setup(style);a.startAttack(name,b);
  const poses=new Set();
  for(let i=0;i<=80;i++){
   a.attack.elapsed=a.attack.duration*i/80;const p=computePose(a);poses.add(JSON.stringify(p));
   assert.ok(Math.abs(p.rotation)<.5);
   for(const arm of [p.main,p.off]){assert.ok(Math.abs(distance(p.shoulder,arm.joint)-23)<1e-6);assert.ok(Math.abs(distance(arm.joint,arm.tip)-23)<1e-6);}
   for(const leg of [p.front,p.back]){assert.ok(Math.abs(distance(p.hip,leg.joint)-29)<1e-6);assert.ok(Math.abs(distance(leg.joint,leg.tip)-29)<1e-6);}
  }
  assert.ok(poses.size>60);
 }
});
test('a signature interrupted in windup cannot produce a ghost hit; interrupted holds still release',()=>{
 for(const style of STYLE_NAMES){
  const {w,a,b,name}=setup(style);a.startAttack(name,b);w.update();a.receiveHit(1,-50,0,0);
  for(let i=0;i<150;i++)w.update();assert.equal(b.hp,500);assert.equal(w.stats.signatures||0,0);
 }
 const {w,a,b,name}=setup('Judo');a.startAttack(name,b);
 for(let i=0;i<40;i++)w.update();assert.equal(b.heldBy,a.id);
 a.receiveHit(1,-50,0,0);w.update();assert.equal(b.heldBy,null);
});
test('normal seeded rounds naturally show every signature and still rank all participants',()=>{
 const counts=Object.fromEntries(STYLE_NAMES.map(s=>[s,0]));
 for(let seed=0;seed<32;seed++){
  const w=new Match(seed),seen=new WeakSet();
  for(let i=0;i<10810&&!w.finished;i++){
   w.update();for(const e of w.events)if(!seen.has(e)){seen.add(e);if(e.signature)counts[e.style]++;}
  }
  assert.equal(w.finished,true);assert.equal(w.standings.length,8);assert.equal(w.arena,null);
 }
 for(const style of STYLE_NAMES)assert.ok(counts[style]>5,`${style}: ${counts[style]}`);
});
