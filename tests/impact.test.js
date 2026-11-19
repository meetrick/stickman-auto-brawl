import test from 'node:test';
import assert from 'node:assert/strict';
import {ImpactFeedback} from '../impact.js?v=20261119-headline';
import {Match} from '../app.js?v=20261119-headline';

test('light hits never freeze; heavy contacts stop briefly and cannot stack per frame',()=>{
 const f=new ImpactFeedback(), light={type:'hit',move:'Punch'}, heavy={type:'hit',move:'Uppercut'};
 assert.equal(f.observe([light]),false); assert.equal(f.observe([heavy]),true); assert.equal(f.stop,.025);
 assert.equal(f.observe([heavy]),false);assert.equal(f.advance(.010),0);assert.ok(Math.abs(f.advance(.025)-.010)<1e-9);
 assert.equal(f.observe([{type:'hit',crit:true}]),false);
 f.advance(.21);assert.equal(f.observe([{type:'hit',signature:'HIP THROW!'}]),true);assert.equal(f.stop,.045);
});
test('feedback is bounded, reduced-motion safe, resettable and never changes replay results',()=>{
 const f=new ImpactFeedback(), a=new Match(12), b=new Match(12);
 for(let i=0;i<1800;i++){
  a.update();b.update();f.advance(1/120);f.observe(a.events);
  const offset=f.offset(); assert.ok(Math.abs(offset.x)<=2.2&&Math.abs(offset.y)<=1.21);
 }
 assert.deepEqual(a.fighters,b.fighters);assert.deepEqual(a.eliminations,b.eliminations);
 f.reset();assert.equal(f.stop,0);assert.deepEqual(f.offset(),{x:0,y:0});
 f.observe([{type:'hit',crit:true}]);assert.equal(f.advance(.01,true),.01);assert.equal(f.stop,0);
 assert.deepEqual(f.offset(true),{x:0,y:0});assert.equal(f.observe([{type:'hit',crit:true}],true),false);
});

test('quiet highlights prioritize eliminations and only show real combo finishes',async()=>{
 const {selectMoment}=await import('../impact.js?v=20261119-headline');const {momentText,watchMomentText,setLanguage}=await import('../i18n.js?v=20261119-headline');
 const signature={time:1,type:'hit',signature:'DYNAMITE HOOK!',finisher:true,chain:3,crit:true,text:'CRIT!'};
 const elimination={time:1.3,type:'elimination'};
 const events=[{time:1.5,type:'heal'},elimination,{time:1.2,type:'hit',crit:true},signature];
 assert.equal(selectMoment(events,1.5),elimination);assert.equal(selectMoment(events,2.9),elimination);
 assert.equal(selectMoment(events,4),null);assert.equal(selectMoment([{...signature,time:10}],1),null);
 assert.equal(selectMoment([signature],1.5),signature);
 assert.equal(selectMoment([{...signature,blocked:true}],1.5),null);
 assert.equal(selectMoment([{...signature,finisher:false}],1.5),null);
 setLanguage('en');assert.equal(watchMomentText(signature),'3-HIT FINISH');assert.equal(momentText(signature),'DYNAMITE HOOK! · CRIT! · 3-HIT COMBO');
 setLanguage('ko');assert.equal(watchMomentText(signature),'3연타 마무리');assert.equal(momentText(signature),'다이너마이트 훅! · 치명타! · 3연속 명중');setLanguage('en');
});
