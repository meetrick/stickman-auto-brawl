import test from 'node:test';
import assert from 'node:assert/strict';
import {Fighter, MOVES} from '../fighter.js?v=20261119-cinema';
import {computePose} from '../pose.js?v=20261119-cinema';
import {STYLE_NAMES} from '../styles.js?v=20261119-cinema';
import {seededRandom} from '../random.js?v=20261119-cinema';
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

test('each style has a distinct idle and running silhouette without consuming RNG',()=>{
  for(const state of ['idle','run']){
    const poses=STYLE_NAMES.map(style=>{
      const f=new Fighter(0,0,0,seededRandom(1)); Object.assign(f,{style,state,stridePhase:.7});
      const before=structuredClone(f),pose=computePose(f); assert.deepEqual(structuredClone(f),before); return JSON.stringify(pose);
    });
    assert.equal(new Set(poses).size,STYLE_NAMES.length);
  }
});
test('all style attacks and variants preserve IK lengths and finite geometry',()=>{
  const f=new Fighter(0,0,0,seededRandom(1));
  for(const style of STYLE_NAMES) for(const name of Object.keys(MOVES)) for(const variant of [0,1]) for(let i=0;i<=40;i++){
    f.style=style;f.attack={name,variant,duration:MOVES[name].duration,elapsed:MOVES[name].duration*i/40};
    const p=computePose(f);
    for(const arm of [p.main,p.off]){
      assert.ok(Math.abs(distance(p.shoulder,arm.joint)-23)<1e-6);
      assert.ok(Math.abs(distance(arm.joint,arm.tip)-23)<1e-6);
    }
    for(const leg of [p.front,p.back]){
      assert.ok(Math.abs(distance(p.hip,leg.joint)-29)<1e-6);
      assert.ok(Math.abs(distance(leg.joint,leg.tip)-29)<1e-6);
    }
    assert.ok(Number.isFinite(p.rotation));
  }
});
test('ninja kicks sweep low, kickboxing alternates high kicks, and judo loads the throw at the hip',()=>{
  const f=new Fighter(0,0,0,seededRandom(1));
  const at=(style,name,progress,variant=0)=>{
    f.style=style;f.attack={name,variant,duration:MOVES[name].duration,elapsed:MOVES[name].duration*progress};return computePose(f);
  };
  const sweep=at('Ninja','Kick',.4),high=at('Kickboxing','Kick',.4,1);
  assert.ok(sweep.front.tip[1]>high.front.tip[1]+25);
  assert.notDeepEqual(at('Kickboxing','Kick',.4,0),high);
  const hipThrow=at('Judo','Grab',.44),generic=at('Kickboxing','Grab',.44);
  assert.ok(hipThrow.main.tip[1]>generic.main.tip[1]+20);
});
test('style presentation never animates a settled KO body',()=>{
  const f=new Fighter(0,0,0,seededRandom(1)); f.hp=0; f.state='ko';
  for(const style of STYLE_NAMES){f.style=style;const before=computePose(f);f.age+=100;assert.deepEqual(computePose(f),before);}
});
