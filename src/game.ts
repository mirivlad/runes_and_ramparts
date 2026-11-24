import {WIDTH,HEIGHT,path,obstacles,towers,enemies,waves,type Point,type TowerKind,type EnemyKind} from './content.ts';
export type Tower=Point&{id:number,kind:TowerKind,level:number,branch:number,cool:number,angle:number,spent:number,priority:'first'|'strong'|'near'};
export type Enemy=Point&{id:number,kind:EnemyKind,hp:number,maxHp:number,distance:number,angle:number,slow:number,poison:number,heal:number,hit:number};
export type Shot=Point&{kind:TowerKind,tx:number,ty:number,life:number,max:number};
export type Effect=Point&{kind:'hit'|'death'|'build'|'heal'|'leak'|'wave',color:number,life:number,max:number};
export type State={version:1,gold:number,lives:number,wave:number,score:number,phase:'ready'|'battle'|'won'|'lost',time:number,nextId:number,spawn:number,queue:EnemyKind[],towers:Tower[],enemies:Enemy[],shots:Shot[],effects:Effect[]};
export type Signal='shoot'|'magic'|'boom'|'death'|'build'|'upgrade'|'wave'|'leak'|'win'|'lose';
const seg=path.slice(1).map((b,i)=>Math.hypot(b.x-path[i].x,b.y-path[i].y));
export const routeLength=seg.reduce((a,b)=>a+b,0);
export function position(d:number){let i=0;while(i<seg.length-1&&d>seg[i]){d-=seg[i];i++}const a=path[i],b=path[i+1],k=Math.min(1,d/seg[i]);return{x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,angle:Math.atan2(b.y-a.y,b.x-a.x)}}
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
function pathDistance(p:Point){return Math.min(...path.slice(1).map((b,i)=>{const a=path[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}))}
export function fresh():State{return{version:1,gold:310,lives:20,wave:0,score:0,phase:'ready',time:0,nextId:1,spawn:0,queue:[],towers:[],enemies:[],shots:[],effects:[]}}
export function canBuild(s:State,p:Point,kind:TowerKind){return (s.phase==='ready'||s.phase==='battle')&&s.gold>=towers[kind].cost&&p.x>=22&&p.y>=22&&p.x<=WIDTH-22&&p.y<=HEIGHT-22&&pathDistance(p)>=43&&!obstacles.some(o=>dist(p,o)<o.r+18)&&!s.towers.some(t=>dist(t,p)<43)}
export function build(s:State,p:Point,kind:TowerKind){if(!canBuild(s,p,kind))return false;const cost=towers[kind].cost;s.gold-=cost;s.towers.push({...p,id:s.nextId++,kind,level:1,branch:-1,cool:0,angle:0,spent:cost,priority:'first'});effect(s,p,'build',0xffdb83,.6);return true}
export function stats(t:Tower){const d=towers[t.kind],power=1+(t.level-1)*.62;return{damage:d.damage*power*(t.branch===0?1.4:1),range:d.range+(t.level-1)*10+(t.branch===0?20:0),rate:d.rate/(1+(t.level-1)*.13+(t.branch===1?.48:0))}}
export function upgradeCost(t:Tower){return Math.round(towers[t.kind].cost*(t.level===1?.85:1.3))}
export function upgrade(s:State,t:Tower,branch=-1){if(!s.towers.includes(t)||t.level>=3||s.gold<upgradeCost(t)||s.phase==='won'||s.phase==='lost'||(t.level===2&&![0,1].includes(branch)))return false;const cost=upgradeCost(t);s.gold-=cost;t.spent+=cost;t.level++;if(t.level===3)t.branch=branch;effect(s,t,'build',0xffdb83,.8);return true}
export function sell(s:State,t:Tower){if(!s.towers.includes(t)||s.phase==='won'||s.phase==='lost')return false;s.gold+=Math.floor(t.spent*.65);s.towers=s.towers.filter(x=>x!==t);return true}
export function start(s:State){if(s.phase!=='ready'||s.wave>=waves.length)return false;s.queue=waves[s.wave].flatMap(([kind,n])=>Array<EnemyKind>(n).fill(kind));s.wave++;s.phase='battle';s.spawn=0;effect(s,path[0],'wave',0xffdd91,1);return true}
function effect(s:State,p:Point,kind:Effect['kind'],color:number,life:number){s.effects.push({x:p.x,y:p.y,kind,color,life,max:life})}
function spawn(s:State,kind:EnemyKind){const d=enemies[kind],hp=Math.round(d.hp*(1+(s.wave-1)*.09));s.enemies.push({id:s.nextId++,kind,hp,maxHp:hp,distance:0,...position(0),slow:0,poison:0,heal:2,hit:0})}
function damage(s:State,e:Enemy,n:number,kind:TowerKind){const armor=kind==='mage'||kind==='frost'?0:enemies[e.kind].armor*(kind==='ballista'?.25:e.poison>0?.5:1);e.hp-=n*(1-armor);e.hit=.13;if(kind==='frost')e.slow=2.5;if(kind==='venom')e.poison=4;effect(s,e,'hit',towers[kind].color,.25)}
export function step(s:State,dt:number,signal:(a:Signal)=>void=()=>{}){
 if(s.phase==='won'||s.phase==='lost')return;
 s.time+=dt;s.effects=s.effects.filter(e=>(e.life-=dt)>0);s.shots=s.shots.filter(e=>(e.life-=dt)>0);
 if(s.phase!=='battle')return;
 s.spawn-=dt;if(s.queue.length&&s.spawn<=0){spawn(s,s.queue.shift()!);s.spawn=.5}
 for(const e of s.enemies){if(e.hp<=0)continue;e.hit=Math.max(0,e.hit-dt);if(e.poison>0){e.hp-=dt*7;e.poison-=dt}if(e.slow>0)e.slow-=dt;e.distance+=dt*enemies[e.kind].speed*(e.slow>0?.53:1);Object.assign(e,position(e.distance));if(e.kind==='shaman'||e.kind==='boss'){e.heal-=dt;if(e.heal<=0){e.heal=3;for(const a of s.enemies)if(a!==e&&a.hp>0&&dist(a,e)<90){a.hp=Math.min(a.maxHp,a.hp+a.maxHp*.09);effect(s,a,'heal',0x9ee88a,.6)}}}}
 for(const t of s.towers){t.cool=Math.max(0,t.cool-dt);if(t.cool>0)continue;const st=stats(t);const targets=s.enemies.filter(e=>e.hp>0&&e.distance<routeLength&&dist(e,t)<=st.range);targets.sort((a,b)=>t.priority==='near'?dist(a,t)-dist(b,t):t.priority==='strong'?b.hp-a.hp:b.distance-a.distance);const e=targets[0];if(!e)continue;t.cool=st.rate;t.angle=Math.atan2(e.y-t.y,e.x-t.x);s.shots.push({x:t.x,y:t.y-14,tx:e.x,ty:e.y-8,kind:t.kind,life:.18,max:.18});damage(s,e,st.damage,t.kind);if(t.kind==='bomb'){for(const a of s.enemies)if(a!==e&&a.hp>0&&dist(a,e)<48)damage(s,a,st.damage*.72,t.kind);effect(s,e,'hit',0xffb16b,.5)}if(t.kind==='archer'&&t.branch===1&&targets[1])damage(s,targets[1],st.damage*.55,t.kind);signal(t.kind==='bomb'?'boom':t.kind==='mage'||t.kind==='frost'?'magic':'shoot')}
 s.enemies=s.enemies.filter(e=>{if(e.hp<=0){const reward=enemies[e.kind].gold;s.gold+=reward;s.score+=reward*10;effect(s,e,'death',enemies[e.kind].color,.65);signal('death');return false}if(e.distance>=routeLength){s.lives=Math.max(0,s.lives-(e.kind==='boss'?5:1));effect(s,e,'leak',0xff5555,.7);signal('leak');return false}return true});
 if(s.lives===0){s.phase='lost';signal('lose');return}
 if(!s.queue.length&&!s.enemies.length){s.gold+=25+s.wave*3;s.score+=s.wave*100;if(s.wave===waves.length){s.phase='won';s.score+=s.lives*200;signal('win')}else{s.phase='ready'}}
}
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const nonnegative=(v:unknown):v is number=>finite(v)&&v>=0;
const isPoint=(p:unknown):p is Point=>!!p&&typeof p==='object'&&finite((p as Point).x)&&finite((p as Point).y);
export function validSave(v:unknown):v is State{
 if(!v||typeof v!=='object')return false;
 const s=v as State;
 if(s.version!==1||!nonnegative(s.gold)||!Number.isInteger(s.wave)||s.wave<0||s.wave>waves.length||!nonnegative(s.lives)||s.lives>20||!nonnegative(s.score)||!nonnegative(s.time)||!Number.isSafeInteger(s.nextId)||s.nextId<1||!finite(s.spawn)||!['ready','battle','won','lost'].includes(s.phase))return false;
 const ids=new Set<number>();
 const validId=(id:number)=>{if(!Number.isSafeInteger(id)||id<1||id>=s.nextId||ids.has(id))return false;ids.add(id);return true};
 return Array.isArray(s.towers)&&s.towers.length<=400&&s.towers.every(t=>isPoint(t)&&Object.hasOwn(towers,t.kind)&&validId(t.id)&&[1,2,3].includes(t.level)&&(t.level===3?[0,1].includes(t.branch):t.branch===-1)&&nonnegative(t.cool)&&finite(t.angle)&&nonnegative(t.spent)&&['first','strong','near'].includes(t.priority))&&
 Array.isArray(s.enemies)&&s.enemies.length<=1000&&s.enemies.every(e=>isPoint(e)&&Object.hasOwn(enemies,e.kind)&&validId(e.id)&&finite(e.hp)&&nonnegative(e.maxHp)&&e.maxHp>0&&nonnegative(e.distance)&&finite(e.angle)&&finite(e.slow)&&finite(e.poison)&&finite(e.heal)&&finite(e.hit))&&
 Array.isArray(s.queue)&&s.queue.length<=1000&&s.queue.every(k=>typeof k==='string'&&Object.hasOwn(enemies,k))&&
 Array.isArray(s.shots)&&s.shots.length<=3000&&s.shots.every(a=>isPoint(a)&&Object.hasOwn(towers,a.kind)&&finite(a.tx)&&finite(a.ty)&&nonnegative(a.life)&&finite(a.max)&&a.max>0)&&
 Array.isArray(s.effects)&&s.effects.length<=3000&&s.effects.every(a=>isPoint(a)&&['hit','death','build','heal','leak','wave'].includes(a.kind)&&Number.isInteger(a.color)&&a.color>=0&&a.color<=0xffffff&&nonnegative(a.life)&&finite(a.max)&&a.max>0);
}
