import {WIDTH,HEIGHT,MAX_LEVEL,path,towers,enemies,mapById,isBoss,abilities,emptyTalents,type MapId,type Talents,type Ability,type Point,type TowerKind,type EnemyKind} from './content.ts';
export type Tower=Point&{id:number,kind:TowerKind,level:number,branch:number,cool:number,angle:number,spent:number,stun?:number,bonus?:number,priority:'first'|'strong'|'near'};
export type Enemy=Point&{id:number,kind:EnemyKind,hp:number,maxHp:number,distance:number,angle:number,slow:number,poison:number,heal:number,hit:number,slowFactor?:number,poisonDps?:number,corrosion?:number,burn?:number,burnDps?:number,skill?:number,shield?:boolean,lane?:number,stride?:number};
export type Shot=Point&{kind:TowerKind,tx:number,ty:number,life:number,max:number};
export type Effect=Point&{kind:'hit'|'death'|'build'|'heal'|'leak'|'wave'|'meteor'|'freeze'|'guard'|'boss',color:number,life:number,max:number,radius?:number};
export type State={version:1,map?:MapId,talents?:Talents,cooldowns?:Record<Ability,number>,completed?:number,gold:number,lives:number,wave:number,score:number,phase:'ready'|'battle'|'won'|'lost',time:number,nextId:number,spawn:number,queue:EnemyKind[],towers:Tower[],enemies:Enemy[],shots:Shot[],effects:Effect[]};
export type Signal='shoot'|'magic'|'boom'|'death'|'build'|'upgrade'|'wave'|'leak'|'win'|'lose';
const routes=new Map<MapId,{path:Point[],seg:number[],length:number}>();
function route(id?:MapId){const m=mapById(id);let r=routes.get(m.id);if(!r){const p=m.path,seg=p.slice(1).map((b,i)=>Math.hypot(b.x-p[i].x,b.y-p[i].y));r={path:p,seg,length:seg.reduce((a,b)=>a+b,0)};routes.set(m.id,r)}return r}
export const routeLength=route().length;
export function position(d:number,id?:MapId){const {path,seg}=route(id);let i=0;while(i<seg.length-1&&d>seg[i]){d-=seg[i];i++}const a=path[i],b=path[i+1],k=Math.max(0,Math.min(1,d/seg[i]));return{x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,angle:Math.atan2(b.y-a.y,b.x-a.x)}}
// Three traffic lanes along the same route, with a short bevel at corners.
export const LANES=[-17,0,17] as const;
export function enemyPosition(d:number,id?:MapId,lane=1){const p=position(d,id),a=position(d-12,id),b=position(d+12,id),angle=Math.atan2(b.y-a.y,b.x-a.x),offset=LANES[lane]??0;return {...p,x:p.x-Math.sin(angle)*offset,y:p.y+Math.cos(angle)*offset}}
export function laneOf(e:Enemy){return e.lane??e.id%3}
export function footprint(e:Enemy){return isBoss(e.kind)?36:e.kind==='golem'||e.kind==='troll'?29:e.kind==='spiderling'?13:22}
export function advanceCrowd(s:State,dt:number){
 const lanes:Enemy[][]=[[],[],[]];
 for(const e of s.enemies)if(e.hp>0){e.lane=laneOf(e);lanes[e.lane].push(e)}
 for(const group of lanes){group.sort((a,b)=>b.distance-a.distance||a.id-b.id);let front:Enemy|undefined;
  for(const e of group){const speed=enemies[e.kind].speed*(e.slow>0?(isBoss(e.kind)?Math.max(.75,e.slowFactor??.58):e.slowFactor??.58):1);
   const gap=front?(footprint(front)+footprint(e))*.5+5:0;
   const limit=front?Math.max(e.distance,front.distance-gap):Infinity;
   const d=Math.min(e.distance+dt*speed,limit);e.stride=(e.stride??0)+(d-e.distance);e.distance=d;
   Object.assign(e,enemyPosition(d,s.map,e.lane));front=e;
  }
 }
}
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export function pathDistance(p:Point,id?:MapId){const path=route(id).path;return Math.min(...path.slice(1).map((b,i)=>{const a=path[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}))}
export function rallyPoint(p:Point,id?:MapId):Point{const path=route(id).path;let best=path[0],d=Infinity;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy))),q={x:a.x+t*dx,y:a.y+t*dy},n=dist(p,q);if(n<d){d=n;best=q}}return best}
export function fresh(id:MapId='forest',talents:Talents=emptyTalents()):State{return{version:1,map:id,talents:{...talents},cooldowns:{meteor:0,freeze:0,guard:0},completed:0,gold:mapById(id).gold+35*talents.economy,lives:20,wave:0,score:0,phase:'ready',time:0,nextId:1,spawn:0,queue:[],towers:[],enemies:[],shots:[],effects:[]}}
export function canBuild(s:State,p:Point,kind:TowerKind){return (s.phase==='ready'||s.phase==='battle')&&s.gold>=towers[kind].cost&&p.x>=28&&p.y>=35&&p.x<=WIDTH-28&&p.y<=HEIGHT-22&&pathDistance(p,s.map)>=43&&!mapById(s.map).obstacles.some(o=>dist(p,o)<o.r+18)&&!s.towers.some(t=>dist(t,p)<49)}
export function build(s:State,p:Point,kind:TowerKind){if(!canBuild(s,p,kind))return false;const cost=towers[kind].cost;s.gold-=cost;s.towers.push({...p,id:s.nextId++,kind,level:1,branch:-1,cool:0,angle:0,spent:cost,bonus:s.talents?.power??0,priority:'first'});effect(s,p,'build',0xffdb83,.6);return true}
export function stats(t:Tower){
 const d=towers[t.kind],l=t.level-1,rank=Math.max(0,t.level-2);
 let damage=d.damage*(1+l*.37)*(1+(t.bonus??0)*.06),range=d.range+l*5,rate=d.rate/(1+l*.075);
 let splash=0,extra=0,slowFactor=.58,slowDuration=1.8,poisonDps=7+l*2,corrosion=.5,burnDps=0;
 if(t.kind==='bomb')splash=43+l*3;if(t.kind==='lightning')extra=2;if(t.kind==='barracks'){slowFactor=.42;slowDuration=1.1;extra=1}
 if(t.branch===0)switch(t.kind){
  case 'archer': damage*=1.35+rank*.08;range+=22+rank*5;break;
  case 'ballista': damage*=1.25;extra=rank+1;break;
  case 'mage': damage*=1.4+rank*.13;range+=15;break;
  case 'frost': splash=32+rank*7;slowFactor=.5-rank*.04;slowDuration=2.3+rank*.4;break;
  case 'bomb': splash+=15+rank*5;damage*=1.22;rate*=1.1;break;
  case 'venom': poisonDps*=1.7+rank*.2;corrosion=.22;break;
 case 'lightning':damage*=1.5+rank*.12;break;
 case 'barracks':slowFactor=.2;slowDuration=2+rank*.2;damage*=1.15;break;
 }
 if(t.branch===1)switch(t.kind){
  case 'archer': extra=rank;rate*=.88;break;
  case 'ballista': rate*=.75-rank*.045;damage*=1.1;break;
  case 'mage': extra=rank;break;
  case 'frost': extra=rank;damage*=2+rank*.15;break;
  case 'bomb': burnDps=12+rank*6;rate*=.9;break;
  case 'venom': splash=30+rank*7;poisonDps*=1.2;break;
 case 'lightning':extra+=rank;rate*=.9;break;
 case 'barracks':extra+=rank;rate*=.75;break;
 }
 return{damage,range,rate,splash,extra,slowFactor,slowDuration,poisonDps,corrosion,burnDps};
}
export function upgradeCost(t:Tower){return Math.round(towers[t.kind].cost*([.85,1.3,2,2.9][t.level-1]??0))}
export function upgrade(s:State,t:Tower,branch=-1){if(!s.towers.includes(t)||t.level>=MAX_LEVEL||s.gold<upgradeCost(t)||s.phase==='won'||s.phase==='lost'||(t.level===2?![0,1].includes(branch):branch!==-1))return false;const cost=upgradeCost(t);s.gold-=cost;t.spent+=cost;t.level++;if(t.level===3)t.branch=branch;effect(s,t,'build',0xffdb83,.8);return true}
export function sell(s:State,t:Tower){if(!s.towers.includes(t)||s.phase==='won'||s.phase==='lost')return false;s.gold+=Math.floor(t.spent*.65);s.towers=s.towers.filter(x=>x!==t);return true}
export function canStart(s:State){return s.wave<mapById(s.map).waves.length&&(s.phase==='ready'||(s.phase==='battle'&&!s.queue.length&&s.enemies.length>0))}
export function start(s:State){if(!canStart(s))return false;const early=s.phase==='battle';s.completed??=s.phase==='battle'?Math.max(0,s.wave-1):s.wave;const groups=mapById(s.map).waves[s.wave].map(([kind,n])=>({kind,n}));s.queue=[];while(groups.some(g=>g.n>0))for(const g of groups)if(g.n>0){s.queue.push(g.kind);g.n--}s.wave++;s.phase='battle';s.spawn=0;if(early)s.gold+=20+s.wave*3;effect(s,mapById(s.map).path[0],'wave',0xffdd91,1);return true}
function effect(s:State,p:Point,kind:Effect['kind'],color:number,life:number,radius?:number){s.effects.push({x:p.x,y:p.y,kind,color,life,max:life,radius})}
function spawn(s:State,kind:EnemyKind,distance=0){const d=enemies[kind],scale=s.map==='marsh'?.76:s.map==='ash'?1.02:1,hp=Math.round(d.hp*(1+((s.wave-1)*.12+Math.max(0,s.wave-5)*.09)*scale));const id=s.nextId++,rank=[0,1,2].map(lane=>({lane,space:s.enemies.reduce((n,e)=>e.hp>0&&laneOf(e)===lane?Math.min(n,Math.abs(e.distance-distance)):n,Infinity)})).sort((a,b)=>b.space-a.space||((a.lane-id%3+3)%3)-((b.lane-id%3+3)%3));const lane=rank[0].lane;s.enemies.push({id,kind,hp,maxHp:hp,distance,...enemyPosition(distance,s.map,lane),lane,stride:0,slow:0,poison:0,heal:2,hit:0,skill:4})}
export function cast(s:State,a:Ability,p:Point={x:0,y:0}){if(s.phase!=='battle'||!s.enemies.length||!Object.hasOwn(abilities,a)||!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;s.cooldowns??={meteor:0,freeze:0,guard:0};if(s.cooldowns[a]>0)return false;const radius=a==='meteor'?90:a==='guard'?100:1000;const hits=s.enemies.filter(e=>e.hp>0&&(a==='freeze'||dist(e,p)<=radius));if(!hits.length)return false;s.cooldowns[a]=abilities[a].cooldown*(1-.12*(s.talents?.spells??0));for(const e of hits){if(a==='meteor'){e.hp-=240;e.hit=.25;e.burn=3;e.burnDps=18}else{e.slow=Math.max(e.slow,5);e.slowFactor=Math.min(e.slowFactor??1,a==='freeze'?.15:.28);if(a==='guard'){e.hp-=105;e.hit=.2}}}effect(s,a==='freeze'?{x:WIDTH/2,y:HEIGHT/2}:p,a,a==='meteor'?0xff9540:a==='freeze'?0xa9edff:0xe8d3a1,a==='guard'?2.2:1.3,radius);return true}
function damage(s:State,e:Enemy,n:number,t:Tower,st:ReturnType<typeof stats>){
 const kind=t.kind,magic=kind==='mage'||kind==='frost'||kind==='lightning',armor=magic?(e.kind==='demon'&&e.shield?.55:0):enemies[e.kind].armor*(kind==='ballista'?(t.branch===1?.1:.25):1)*(e.poison>0?(e.corrosion??.5):1);
 e.hp-=n*(1-armor);e.hit=.13;
 if(kind==='frost'||kind==='barracks'){e.slow=Math.max(e.slow,st.slowDuration);e.slowFactor=Math.min(e.slowFactor??1,st.slowFactor)}
 if(kind==='venom'){e.poison=Math.max(e.poison,4);e.poisonDps=Math.max(e.poisonDps??0,st.poisonDps);e.corrosion=Math.min(e.corrosion??1,st.corrosion)}
 if(st.burnDps){e.burn=Math.max(e.burn??0,3);e.burnDps=Math.max(e.burnDps??0,st.burnDps)}
 effect(s,e,'hit',towers[kind].color,.25);
}
function shot(s:State,t:Tower,e:Enemy,from:Point={x:t.x,y:t.y-23}){
 const life=t.kind==='bomb'?.28:t.kind==='mage'||t.kind==='lightning'?.23:.18;
 s.shots.push({...from,tx:e.x,ty:e.y-8,kind:t.kind,life,max:life});
}
export function step(s:State,dt:number,signal:(a:Signal)=>void=()=>{}){
 s.time+=dt;s.effects=s.effects.filter(e=>(e.life-=dt)>0);s.shots=s.shots.filter(e=>(e.life-=dt)>0);
 if(s.phase!=='battle')return;
 const routeLength=route(s.map).length;if(s.cooldowns)for(const a of Object.keys(abilities) as Ability[])s.cooldowns[a]=Math.max(0,s.cooldowns[a]-dt);
 s.spawn-=dt;if(s.queue.length&&s.spawn<=0){const room=[0,1,2].some(l=>!s.enemies.some(e=>e.hp>0&&laneOf(e)===l&&e.distance<32));if(room){spawn(s,s.queue.shift()!);s.spawn=Math.max(.24,.52-s.wave*.019)}else s.spawn=.08}
 for(const e of s.enemies){if(e.hp<=0)continue;e.hit=Math.max(0,e.hit-dt);if(e.poison>0){e.hp-=dt*(e.poisonDps??7);e.poison-=dt;if(e.poison<=0){e.poisonDps=0;e.corrosion=1}}if(e.slow>0){e.slow-=dt;if(e.slow<=0)e.slowFactor=1}if((e.burn??0)>0){e.hp-=dt*(e.burnDps??0);e.burn=(e.burn??0)-dt;if(e.burn<=0)e.burnDps=0}if(e.hp<=0)continue;if(e.kind==='shaman'||e.kind==='boss'){e.heal-=dt;if(e.heal<=0){e.heal=3;for(const a of s.enemies)if(a!==e&&a.hp>0&&dist(a,e)<90){a.hp=Math.min(a.maxHp,a.hp+a.maxHp*.09);effect(s,a,'heal',0x9ee88a,.6)}}}
 if(e.kind==='troll')e.hp=Math.min(e.maxHp,e.hp+dt*4);
 if(isBoss(e.kind)&&e.kind!=='boss'){e.skill=(e.skill??4)-dt;if(e.skill<=0){e.skill=e.kind==='lich'?10:8;effect(s,e,'boss',enemies[e.kind].color,1,100);if(e.kind==='lich'&&s.enemies.length<180){spawn(s,'skeleton',Math.max(0,e.distance-26));if(e.hp<e.maxHp*.5)spawn(s,'skeleton',Math.max(0,e.distance-52))}if(e.kind==='dragon')for(const t of s.towers)if(dist(t,e)<105)t.stun=1.8;if(e.kind==='demon')e.shield=!e.shield}}
 }
 advanceCrowd(s,dt);
 for(const t of s.towers){
  if((t.stun??0)>0){t.stun=Math.max(0,(t.stun??0)-dt);continue}t.cool=Math.max(0,t.cool-dt);if(t.cool>0)continue;
  const st=stats(t),rally=t.kind==='barracks'?rallyPoint(t,s.map):t,targets=s.enemies.filter(e=>e.hp>0&&e.distance<routeLength&&dist(e,t)<=st.range&&(t.kind!=='barracks'||dist(e,rally)<=44+t.level*4));
  targets.sort((a,b)=>t.priority==='near'?dist(a,t)-dist(b,t):t.priority==='strong'?b.hp-a.hp:b.distance-a.distance);
  const e=targets[0];if(!e)continue;t.cool=st.rate;t.angle=Math.atan2(e.y-t.y,e.x-t.x);shot(s,t,e,t.kind==='barracks'?rally:undefined);damage(s,e,st.damage,t,st);
  const hit=new Set([e.id]);
  if(st.splash){for(const a of s.enemies)if(!hit.has(a.id)&&a.hp>0&&dist(a,e)<st.splash){damage(s,a,st.damage*.65,t,st);hit.add(a.id)}effect(s,e,'hit',towers[t.kind].color,.5)}
  let previous=e;
  for(let i=0;i<st.extra;i++){
   const a=t.kind==='mage'||t.kind==='lightning'?s.enemies.filter(a=>a.hp>0&&!hit.has(a.id)&&dist(a,previous)<75).sort((a,b)=>dist(a,previous)-dist(b,previous))[0]:
    t.kind==='ballista'?targets.find(a=>{const dx=a.x-t.x,dy=a.y-t.y,along=dx*Math.cos(t.angle)+dy*Math.sin(t.angle);return !hit.has(a.id)&&a.hp>0&&along>dist(e,t)-8&&Math.abs(dx*Math.sin(t.angle)-dy*Math.cos(t.angle))<20}):
    targets.find(a=>a.hp>0&&!hit.has(a.id));
   if(!a)break;shot(s,t,a,t.kind==='mage'||t.kind==='lightning'?{x:previous.x,y:previous.y-8}:undefined);damage(s,a,st.damage*(t.kind==='ballista'?.72:.6),t,st);hit.add(a.id);previous=a;
  }
  signal(t.kind==='bomb'?'boom':t.kind==='mage'||t.kind==='frost'||t.kind==='venom'||t.kind==='lightning'?'magic':'shoot')
 }
 const offspring:number[]=[];s.enemies=s.enemies.filter(e=>{if(e.hp<=0){const reward=enemies[e.kind].gold;s.gold+=reward;s.score+=reward*10;effect(s,e,'death',enemies[e.kind].color,.65);if(e.kind==='spider')offspring.push(e.distance);signal('death');return false}if(e.distance>=routeLength){s.lives=Math.max(0,s.lives-(isBoss(e.kind)?5:1));effect(s,e,'leak',0xff5555,.7);signal('leak');return false}return true});for(const d of offspring){spawn(s,'spiderling',Math.max(0,d-12));spawn(s,'spiderling',d+12)}
 if(s.lives===0){s.phase='lost';signal('lose');return}
 if(!s.queue.length&&!s.enemies.length){for(let w=(s.completed??Math.max(0,s.wave-1))+1;w<=s.wave;w++){s.gold+=25+w*3+((s.map==='marsh'||s.map==='ash')?12:0);s.score+=w*100}s.completed=s.wave;if(s.wave===mapById(s.map).waves.length){s.phase='won';s.score+=s.lives*200;signal('win')}else{s.phase='ready'}}
}
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const nonnegative=(v:unknown):v is number=>finite(v)&&v>=0;
const isPoint=(p:unknown):p is Point=>!!p&&typeof p==='object'&&finite((p as Point).x)&&finite((p as Point).y);
export function validSave(v:unknown):v is State{
 if(!v||typeof v!=='object')return false;
 const s=v as State;if(s.map!==undefined&&mapById(s.map).id!==s.map)return false;if(s.completed!==undefined&&(!Number.isInteger(s.completed)||s.completed<0||s.completed>s.wave))return false;if(s.talents!==undefined&&(!s.talents||!Object.keys(emptyTalents()).every(k=>Number.isInteger(s.talents![k as keyof Talents])&&s.talents![k as keyof Talents]>=0&&s.talents![k as keyof Talents]<=3)))return false;if(s.cooldowns!==undefined&&(!s.cooldowns||!Object.keys(abilities).every(k=>nonnegative(s.cooldowns![k as Ability]))))return false;
 if(s.version!==1||!nonnegative(s.gold)||!Number.isInteger(s.wave)||s.wave<0||s.wave>mapById(s.map).waves.length||!nonnegative(s.lives)||s.lives>20||!nonnegative(s.score)||!nonnegative(s.time)||!Number.isSafeInteger(s.nextId)||s.nextId<1||!finite(s.spawn)||!['ready','battle','won','lost'].includes(s.phase))return false;
 const ids=new Set<number>();
 const validId=(id:number)=>{if(!Number.isSafeInteger(id)||id<1||id>=s.nextId||ids.has(id))return false;ids.add(id);return true};
 return Array.isArray(s.towers)&&s.towers.length<=400&&s.towers.every(t=>isPoint(t)&&Object.hasOwn(towers,t.kind)&&validId(t.id)&&[1,2,3,4,5].includes(t.level)&&(t.level>=3?[0,1].includes(t.branch):t.branch===-1)&&nonnegative(t.cool)&&finite(t.angle)&&[t.stun,t.bonus].every(n=>n===undefined||nonnegative(n))&&nonnegative(t.spent)&&['first','strong','near'].includes(t.priority))&&
 Array.isArray(s.enemies)&&s.enemies.length<=1000&&s.enemies.every(e=>isPoint(e)&&Object.hasOwn(enemies,e.kind)&&validId(e.id)&&finite(e.hp)&&nonnegative(e.maxHp)&&e.maxHp>0&&nonnegative(e.distance)&&finite(e.angle)&&finite(e.slow)&&finite(e.poison)&&finite(e.heal)&&finite(e.hit)&&(e.lane===undefined||[0,1,2].includes(e.lane))&&(e.stride===undefined||nonnegative(e.stride))&&[e.slowFactor,e.poisonDps,e.corrosion,e.burn,e.burnDps,e.skill].every(n=>n===undefined||finite(n)))&&
 Array.isArray(s.queue)&&s.queue.length<=1000&&s.queue.every(k=>typeof k==='string'&&Object.hasOwn(enemies,k))&&
 Array.isArray(s.shots)&&s.shots.length<=3000&&s.shots.every(a=>isPoint(a)&&Object.hasOwn(towers,a.kind)&&finite(a.tx)&&finite(a.ty)&&nonnegative(a.life)&&finite(a.max)&&a.max>0)&&
 Array.isArray(s.effects)&&s.effects.length<=3000&&s.effects.every(a=>isPoint(a)&&['hit','death','build','heal','leak','wave','meteor','freeze','guard','boss'].includes(a.kind)&&Number.isInteger(a.color)&&a.color>=0&&a.color<=0xffffff&&nonnegative(a.life)&&finite(a.max)&&a.max>0&&(a.radius===undefined||nonnegative(a.radius)));
}
