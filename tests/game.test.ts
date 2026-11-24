import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,build,canBuild,upgrade,sell,start,step,validSave,position,routeLength,stats,upgradeCost} from '../src/game.ts';
import {waves,towers,MAX_LEVEL,type TowerKind} from '../src/content.ts';
test('construction respects terrain, road, budget and spacing',()=>{const s=fresh();assert(!canBuild(s,{x:90,y:112},'archer'));assert(!canBuild(s,{x:80,y:432},'archer'));assert(build(s,{x:100,y:190},'archer'));assert(!build(s,{x:101,y:190},'mage'));assert.equal(s.gold,245);s.gold=0;assert(!build(s,{x:250,y:190},'mage'))});
test('upgrade branches and refund',()=>{const s=fresh();assert(build(s,{x:100,y:190},'archer'));const t=s.towers[0];assert(upgrade(s,t));assert(!upgrade(s,t));assert(upgrade(s,t,1));assert.equal(t.branch,1);assert(!upgrade(s,t,0));s.gold=1000;assert(upgrade(s,t));assert(upgrade(s,t));assert.equal(t.level,5);assert.equal(t.branch,1);assert(!upgrade(s,t));const before=s.gold;assert(sell(s,t));assert.equal(s.gold,before+Math.floor(t.spent*.65))});
test('waves spawn, defend, reward and end',()=>{const s=fresh();s.gold=5000;for(const x of [48,100,224,276,328])assert(build(s,{x,y:180},'mage'));assert(start(s));assert(!start(s));for(let i=0;i<3600&&s.phase==='battle';i++)step(s,1/60);assert.equal(s.phase,'ready');assert(s.score>0);assert.equal(s.lives,20)});
test('loss and route endpoint',()=>{const s=fresh();s.lives=1;start(s);for(let i=0;i<7200&&s.phase==='battle';i++)step(s,1/60);assert.equal(s.phase,'lost');assert.equal(s.lives,0);assert.equal(position(routeLength).x,984)});
test('complete campaign and serialization',()=>{const s=fresh();s.wave=waves.length-1;s.gold=100000;for(let x=48;x<900;x+=48)for(let y=48;y<520;y+=48)if(build(s,{x,y},'mage')){const t=s.towers.at(-1)!;upgrade(s,t);upgrade(s,t,0)}assert(start(s));for(let i=0;i<7200&&s.phase==='battle';i++)step(s,1/60);assert.equal(s.phase,'won');assert(validSave(JSON.parse(JSON.stringify(s))));assert(!validSave({version:1}))});

test('every tower has five levels, two distinct paths and increasing prices',()=>{for(const k of Object.keys(towers) as TowerKind[]){const s=fresh();s.gold=10000;assert(build(s,{x:100,y:190},k));const t=s.towers[0],base=stats(t);let price=0;for(let i=1;i<MAX_LEVEL;i++){assert(upgradeCost(t)>price);price=upgradeCost(t);assert(upgrade(s,t,i===2?0:-1))}assert.equal(t.level,5);assert(stats(t).damage>base.damage);assert.notDeepEqual(stats(t),stats({...t,branch:1}));assert(validSave(JSON.parse(JSON.stringify(s))));assert(!upgrade(s,t));}});
test('legacy level-three towers remain valid and can advance',()=>{const s=fresh();s.gold=10000;build(s,{x:100,y:190},'mage');const t=s.towers[0];upgrade(s,t);upgrade(s,t,1);const old=JSON.parse(JSON.stringify(s));assert(validSave(old));assert(upgrade(old,old.towers[0]));assert.equal(old.towers[0].branch,1);assert.equal(old.towers[0].level,4)});
test('mixed waves alternate enemies and boss has resistance to slowing',()=>{const s=fresh();s.wave=5;start(s);assert.deepEqual(s.queue.slice(0,3),['goblin','boss','goblin']);});
test('boss resists freeze, venom and fire deal damage over time',()=>{
 const s=fresh();s.gold=10000;s.wave=5;start(s);s.queue=['boss'];step(s,1/60);const e=s.enemies[0];
 e.distance=125;Object.assign(e,position(e.distance));e.slow=3;e.slowFactor=.2;
 const x=e.distance;step(s,1);assert.equal(e.distance-x,27*.75);
 e.poison=3;e.poisonDps=21;e.burn=3;e.burnDps=12;const hp=e.hp;step(s,1);assert.equal(hp-e.hp,33);
});
test('specialized archers hit multiple targets',()=>{
 const s=fresh();s.gold=10000;build(s,{x:100,y:190},'archer');const t=s.towers[0];upgrade(s,t);upgrade(s,t,1);upgrade(s,t);upgrade(s,t);
 start(s);s.queue=['orc','orc','orc','orc'];t.cool=100;for(let i=0;i<120;i++)step(s,1/60);assert.equal(s.enemies.length,4);
 for(let i=0;i<4;i++){const e=s.enemies[i];e.distance=124+i*4;Object.assign(e,position(e.distance))}
 t.cool=0;step(s,1/60);assert.equal(s.enemies.filter(e=>e.hp<e.maxHp).length,4);assert.equal(s.shots.length,4)
});
