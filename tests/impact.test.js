import test from 'node:test';
import assert from 'node:assert/strict';
import {ImpactFeedback} from '../impact.js';
import {Match} from '../app.js';

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
