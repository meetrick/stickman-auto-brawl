import test from 'node:test';
import assert from 'node:assert/strict';
import {Match, STEP} from '../app.js?v=20261119-cinema';
import {MOVES} from '../fighter.js?v=20261119-cinema';
import {reactToThreat} from '../defense.js?v=20261119-cinema';
function pair(){
 const w=new Match(12,3),[a,b,c]=w.fighters;
 Object.assign(a,{x:500,y:400,cooldown:0,readyAt:100});Object.assign(b,{x:540,y:400,cooldown:0,readyAt:100,hp:500,maxHp:500});
 Object.assign(c,{x:1000,y:550,readyAt:100});w.rng=()=>.5;a.startAttack('Punch',b);
 return {w,a,b};
}
test('front guard reduces damage and push, stays grounded, and consumes the contact',()=>{
 const {w,a,b}=pair();b.startDefense('guard',a,w);b.defense.elapsed=.08;const stamina=b.stamina;
 assert.equal(a.hit(b,w,'Punch'),true);
 assert.ok(Math.abs(500-b.hp-MOVES.Punch.damage*a.power*.25)<1e-8);
 assert.equal(b.vx,MOVES.Punch.knockback*.22);assert.equal(b.vz,0);assert.equal(b.state,'guard');
 assert.ok(b.stamina<stamina);assert.equal(w.stats.blocks,1);assert.equal(a.attack.connected,false);
 assert.equal(b.defense.used,true);assert.equal(b.counterTargetId,a.id);
});
test('rear attacks and grabs bypass guard; critical and dash hits break it',()=>{
 for(const kind of ['rear','Grab','crit','Dash']){
  const {w,a,b}=pair();b.startDefense('guard',a,w);b.defense.elapsed=.08;
  if(kind==='rear')a.x=580;
  if(kind==='crit')a.attack.crit=true;
  a.hit(b,w,kind==='Grab'?'Grab':kind==='Dash'?'Dash':'Punch');
  assert.equal(b.defense,null);assert.equal(w.stats.blocks||0,0);
  assert.equal(w.stats.guardBreaks||0,['crit','Dash'].includes(kind)?1:0);
  assert.ok(b.hp<500);
 }
});
test('timed dodge avoids only its targeted attack once and never creates a connected combo',()=>{
 const {w,a,b}=pair();b.startDefense('dodge',a,w);b.defense.elapsed=.08;
 assert.equal(a.hit(b,w,'Punch'),true);assert.equal(b.hp,500);assert.equal(a.attack.connected,false);
 assert.equal(w.stats.dodges,1);assert.equal(w.stats.hits,0);
 a.attack=null;a.cooldown=0;a.startAttack('Punch',b);a.hit(b,w,'Punch');
 assert.ok(b.hp<500,'a new attack can hit during the same dodge');
});
test('dodge has startup and recovery exposure; other attackers and body collisions remain dangerous',()=>{
 for(const elapsed of [.01,.22]){
  const {w,a,b}=pair();b.startDefense('dodge',a,w);b.defense.elapsed=elapsed;a.hit(b,w,'Punch');assert.ok(b.hp<500);
 }
 const {w,a,b}=pair();b.startDefense('dodge',a,w);b.defense.elapsed=.08;
 const c=w.fighters[2];c.x=510;c.y=400;c.hit(b,w,'Punch');assert.ok(b.hp<500);
 b.defenseCooldown=0;b.stun=0;b.startDefense('guard',a,w);b.receiveHit(10,300,0,200);
 assert.equal(b.defense,null);assert.equal(b.vz,200);
});
test('defense cannot start while attacking, stunned, airborne, held, exhausted, or cooling down',()=>{
 for(const changes of [{stun:1},{z:10},{heldBy:2},{stamina:.1},{defenseCooldown:1},{attack:{name:'Punch'}}]){
  const {w,a,b}=pair();Object.assign(b,changes);assert.equal(b.startDefense('guard',a,w),false);
 }
 const {w,a,b}=pair();b.startDefense('dodge',a,w);assert.equal(b.startAttack('Punch',a),false);
 const before={x:b.x,y:b.y};for(let i=0;i<50;i++)w.update();
 assert.equal(b.defense,null);assert.ok(Math.hypot(b.x-before.x,b.y-before.y)>15);assert.ok(b.defenseCooldown>0);
 assert.equal(b.startDefense('dodge',a,w),false);
});
test('AI rolls at most once per incoming attack, and a successful guard opens a real counter attempt',()=>{
 const {w,a,b}=pair();a.attack.elapsed=.04;b.readyAt=0;w.rng=()=>.99;
 assert.equal(reactToThreat(b,w),false);assert.equal(b.reactedAttacks.size,1);
 w.rng=()=>0;assert.equal(reactToThreat(b,w),false);
 w.rng=()=>.5;b.startDefense('guard',a,w);b.defense.elapsed=.08;a.hit(b,w,'Punch');a.attack=null;
 b.defense.elapsed=.31;b.cooldown=0;b.personality='Cowardly';
 for(let i=0;i<16&&!b.attack;i++)w.update();
 assert.equal(b.attack?.name,'Punch');assert.equal(b.intent,'counter');
});
test('full seeded rounds naturally defend, stay finite, and retain reproducible standings',()=>{
 let blocks=0,dodges=0,breaks=0;
 for(let seed=0;seed<20;seed++){
  const a=new Match(seed),b=new Match(seed);
  for(let i=0;i<10810&&!a.finished;i++){a.update();b.update();}
  assert.equal(a.finished,true);assert.deepEqual(a.eliminations,b.eliminations);assert.deepEqual(a.fighters,b.fighters);
  assert.equal(a.standings.length,8);blocks+=a.stats.blocks||0;dodges+=a.stats.dodges||0;breaks+=a.stats.guardBreaks||0;
 }
 assert.ok(blocks>5);assert.ok(dodges>5);assert.ok(breaks>0);
});
