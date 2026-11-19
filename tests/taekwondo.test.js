import test from 'node:test';
import assert from 'node:assert/strict';
import {Match} from '../app.js?v=20261119-cinema';
import {normalizePreferences} from '../settings.js?v=20261119-cinema';
import {computePose} from '../pose.js?v=20261119-cinema';

test('Taekwondo can be selected, persisted and replayed without weapons',()=>{
 const prefs=normalizePreferences({styles:['Taekwondo']});assert.equal(prefs.styles[0],'Taekwondo');
 const a=new Match(7,4,{styles:prefs.styles}),b=new Match(7,4,{styles:prefs.styles});
 for(let i=0;i<1600;i++){a.update();b.update();}
 assert.equal(a.fighters[0].style,'Taekwondo');assert.deepEqual(a.fighters,b.fighters);assert.equal(a.fighters[0].weapon,'None');
});
test('Taekwondo starts a real three-kick chain from a connected kick',()=>{
 const w=new Match(5,3,{styles:Array(3).fill('Taekwondo')}),[a,b,c]=w.fighters;
 Object.assign(a,{x:500,y:400,cooldown:0,personality:'Aggressive'});
 Object.assign(b,{x:540,y:400,hp:500,maxHp:500,readyAt:100});Object.assign(c,{x:1000,y:550,readyAt:100});
 w.rng=()=>.5;a.startAttack('Kick',b);
 for(let i=0;i<190;i++)w.update();
 assert.deepEqual(w.events.filter(e=>e.type==='hit').map(e=>e.move).reverse(),['Kick','Kick','Kick']);
 assert.equal(a.z,0);assert.equal(a.vz,0);
});
test('side kick, roundhouse and signature hook use visibly different foot paths',()=>{
 const w=new Match(4,2,{styles:['Taekwondo']}),f=w.fighters[0];
 const at=(variant,signature)=>{f.attack={name:'Kick',duration:signature?.72:.46,elapsed:(signature?.72:.46)*.4,variant,signature:signature?'SPINNING HOOK KICK!':null};return computePose(f);};
 const side=at(0,false),round=at(1,false),hook=at(0,true);
 assert.ok(round.front.tip[1]<side.front.tip[1]-12);assert.notDeepEqual(hook,round);
 for(const p of [side,round,hook]){assert.equal(p.rotation,0);assert.ok(Math.abs(p.back.tip[1])<1e-8);}
});
