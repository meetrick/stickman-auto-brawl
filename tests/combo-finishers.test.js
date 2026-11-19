import test from 'node:test';
import assert from 'node:assert/strict';
import {Match} from '../app.js?v=20261119-fight-camera';
import {STYLES,STYLE_NAMES} from '../styles.js?v=20261119-fight-camera';
import {computePose} from '../pose.js?v=20261119-fight-camera';
import {momentActorId,selectMoment} from '../impact.js?v=20261119-fight-camera';
import {momentText,setLanguage} from '../i18n.js?v=20261119-fight-camera';

function setup(style){
 const w=new Match(5,3,{styles:Array(3).fill(style)}),[a,b,c]=w.fighters;
 Object.assign(a,{x:500,y:400,age:2,cooldown:0,comboStep:STYLES[style].combo.length,readyAt:100});
 Object.assign(b,{x:540,y:400,hp:500,maxHp:500,readyAt:100});Object.assign(c,{x:1000,y:550,readyAt:100});
 w.rng=()=>.5;const name=STYLES[style].combo.at(-1);a.startAttack(name,b);return{w,a,b,name};
}
test('every discipline has a real, interruptible grounded combo finisher with unchanged base damage',()=>{
 for(const style of STYLE_NAMES){
  const {w,a,b}=setup(style);assert.equal(a.attack.finisher,true);assert.equal(a.attack.chain,STYLES[style].combo.length+1);
  assert.equal(a.attack.signature,STYLES[style].finisher.text);const move=a.getMove(a.attack.name);
  for(let i=0;i<160;i++)w.update();
  const hits=w.events.filter(e=>e.finisher);assert.equal(hits.length,1);assert.equal(hits[0].source,a.id);
  assert.ok(hits[0].chain>=2);assert.ok(Math.abs(500-b.hp-move.damage*a.power)<1e-8);assert.equal(a.z,0);
  const stopped=setup(style);stopped.a.receiveHit(1,-50,0,0);for(let i=0;i<160;i++)stopped.w.update();
  assert.equal(stopped.b.hp,500);assert.equal(stopped.w.stats.comboHits||0,0);
 }
});
test('new finisher tracks preserve limb geometry throughout the whole sequence',()=>{
 const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 for(const style of STYLE_NAMES){const {a}=setup(style);for(let i=0;i<=80;i++){
  a.attack.elapsed=a.attack.duration*i/80;const p=computePose(a);assert.equal(p.rotation,0);
  for(const arm of [p.main,p.off]){assert.ok(Math.abs(distance(p.shoulder,arm.joint)-23)<1e-6);assert.ok(Math.abs(distance(arm.joint,arm.tip)-23)<1e-6);}
  for(const leg of [p.front,p.back]){assert.ok(Math.abs(distance(p.hip,leg.joint)-29)<1e-6);assert.ok(Math.abs(distance(leg.joint,leg.tip)-29)<1e-6);}
 }}
});
test('combo and counter labels stay localized, identify the attacker, and keep defenders on defensive notices',()=>{
 const hit={type:'hit',fighter:2,source:0,signature:'SPINNING HOOK KICK!',chain:3,crit:false,time:1};
 assert.equal(momentActorId(hit),0);assert.equal(momentActorId({...hit,type:'block'}),2);
 assert.equal(momentActorId({...hit,source:undefined}),2);
 setLanguage('en');assert.equal(momentText(hit),'SPINNING HOOK KICK! · 3-HIT COMBO');
 setLanguage('ko');assert.equal(momentText(hit),'태권 뒤후려차기! · 3연속 명중');
 assert.equal(momentText({text:'PUNCH!',counter:true}),'반격! · 펀치!');setLanguage('en');
 assert.equal(selectMoment([{type:'heal',time:1.2},{type:'hit',chain:2,time:1.1}],1.3),null);
});
test('full random matches naturally connect combos, counters and every style finisher',()=>{
 const counts=Object.fromEntries(STYLE_NAMES.map(s=>[s,0]));let combos=0,counters=0;
 for(let seed=0;seed<40;seed++){
  const w=new Match(seed),seen=new WeakSet();for(let i=0;i<10810&&!w.finished;i++){
   w.update();for(const e of w.events)if(!seen.has(e)){seen.add(e);if(e.finisher)counts[e.style]++;if(e.chain>1)combos++;if(e.counter)counters++;}
  }
  assert.equal(w.finished,true);assert.equal(w.standings.length,8);
 }
 assert.ok(combos>40);assert.ok(counters>5);for(const style of STYLE_NAMES)assert.ok(counts[style]>0,style);
});
