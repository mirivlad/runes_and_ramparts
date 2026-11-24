import {Application,Container,Graphics,Sprite,Texture} from 'pixi.js';
import {WIDTH,HEIGHT,MAX_LEVEL,mapById,isBoss,towers,enemies,type MapId,type Point,type TowerKind,type EnemyKind} from './content.ts';
import type {Ability} from './content.ts';
import {canBuild,stats,rallyPoint,pathDistance,type State,type Tower} from './game.ts';
import {Presentation,cameraTransform,unproject,type VisualQuality} from './feel.ts';
type Paint=(c:CanvasRenderingContext2D)=>void;
function texture(w:number,h:number,paint:Paint){const a=document.createElement('canvas');a.width=w;a.height=h;const c=a.getContext('2d')!;c.imageSmoothingEnabled=false;paint(c);const t=Texture.from(a);t.source.scaleMode='nearest';return t}
function r(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)}
function oval(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,color:string){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
function poly(c:CanvasRenderingContext2D,p:number[][],color:string){c.fillStyle=color;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
let seed=3;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
function pine(c:CanvasRenderingContext2D,x:number,y:number,s:number){c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);oval(c,3,3,13,6,'#24372b');r(c,-2,-7,5,11,'#74513b');for(let i=0;i<3;i++){const h=-9-i*9,w=14-i*3;poly(c,[[-w,h+5],[0,h-17],[w,h+5],[0,h+8]],'#203f31');poly(c,[[-w+2,h+3],[0,h-15],[0,h+5]],'#46724a');poly(c,[[0,h-15],[w-2,h+3],[0,h+5]],'#31583d')}c.restore()}
function terrain(id:MapId){const m=mapById(id),{path,obstacles,palette}=m,[ground,light,dark,roadColor,edge,high]=palette;return texture(WIDTH/2,HEIGHT/2,c=>{c.scale(.5,.5);seed=17+id.charCodeAt(0);r(c,0,0,WIDTH,HEIGHT,ground);
 for(let y=0;y<HEIGHT;y+=8)for(let x=0;x<WIDTH;x+=8){const n=rand();if(n<.24)r(c,x,y,8,8,n<.12?light:dark)}
 for(let i=0;i<1400;i++){const x=Math.floor(rand()*WIDTH/4)*4,y=Math.floor(rand()*HEIGHT/4)*4;r(c,x,y,2,2+Math.floor(rand()*3)*2,rand()<.5?light:dark);if(rand()<.06)r(c,x+2,y-2,2,2,high)}
 const road=()=>{c.beginPath();path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.lineJoin='round';c.lineCap='round'};
 for(const [w,color] of [[68,dark],[61,edge],[53,roadColor],[39,roadColor]] as const){road();c.lineWidth=w;c.strokeStyle=color;c.stroke()}
 for(let k=1;k<path.length;k++){const a=path[k-1],b=path[k],n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/6);for(let i=0;i<n;i++){const f=i/n,x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f;for(let j=0;j<3;j++)r(c,x+(rand()-.5)*38,y+(rand()-.5)*38,2+Math.floor(rand()*3)*2,2,rand()<.5?edge:high)}}
 for(const o of obstacles){oval(c,o.x,o.y,o.r,o.r*.75,dark);
 if(id==='forest'){for(let i=0;i<14;i++){const a=rand()*6.28,d=rand()*(o.r-15);pine(c,o.x+Math.cos(a)*d,o.y+Math.sin(a)*d,.75+rand()*.7)}}
 else if(id==='marsh'){oval(c,o.x,o.y,o.r-3,o.r*.72,'#294c4c');oval(c,o.x-5,o.y-3,o.r*.72,o.r*.47,'#3f6a61');for(let j=0;j<18;j++){const a=rand()*6.28,d=rand()*o.r*.8,x=o.x+Math.cos(a)*d,y=o.y+Math.sin(a)*d*.65;r(c,x,y,8,2,'#72968a');if(j%3===0){r(c,x,y-10,2,12,'#586841');r(c,x-3,y-10,7,2,'#899353')}}}
 else if(id==='crypt'){for(let j=0;j<10;j++){const a=rand()*6.28,d=rand()*o.r*.75,x=o.x+Math.cos(a)*d,y=o.y+Math.sin(a)*d*.7;r(c,x-5,y-16,11,18,'#34313e');r(c,x-4,y-15,8,15,'#87818b');r(c,x-2,y-17,5,3,'#a39ba4');r(c,x-1,y-12,2,8,'#4c4654');r(c,x-4,y-9,8,2,'#4c4654')}}
 else{for(let j=0;j<9;j++){const a=rand()*6.28,d=rand()*o.r*.65,x=o.x+Math.cos(a)*d,y=o.y+Math.sin(a)*d*.6,w=15+rand()*17,h=18+rand()*24;poly(c,[[x-w,y],[x-w*.6,y-h*.6],[x,y-h],[x+w*.65,y-h*.45],[x+w,y]],dark);poly(c,[[x-w+4,y-3],[x-w*.5,y-h*.6],[x,y-h+3],[x+3,y-3]],id==='frost'?'#d2dfe1':'#a1745b');poly(c,[[x,y-h+3],[x+w*.65,y-h*.45],[x+w-3,y-3],[x+3,y-3]],id==='frost'?'#829aa8':'#735449');if(id==='ash')r(c,x-3,y-2,7,2,'#e8a05a')}}
 }
 // Small hand-painted clusters, not uniform random noise. Ground decoration is traversable.
 for(let j=0;j<155;j++){const x=12+rand()*(WIDTH-24),y=12+rand()*(HEIGHT-24);if(pathDistance({x,y},id)<40||obstacles.some(o=>Math.hypot(x-o.x,y-o.y)<o.r+7))continue;
  if(id==='forest'){for(let k=0;k<3;k++){const xx=x+k*4,yy=y+(k%2)*3;r(c,xx,yy-4,2,5,dark);r(c,xx+2,yy-6,2,5,light);if(j%7===0)r(c,xx,yy-6,2,2,'#e0c577')}}
  else if(id==='marsh'){r(c,x,y,8,2,'#273d38');r(c,x+2,y-3,2,6,'#89966a');r(c,x+5,y-7,2,9,'#6d8055');if(j%6===0)r(c,x+5,y-8,3,2,'#c5ae81')}
  else if(id==='frost'){r(c,x,y,8,2,'#657f8c');r(c,x+2,y-2,6,2,'#dae5de');if(j%4===0)r(c,x+3,y-4,3,2,'#f3f6e8')}
  else if(id==='ash'){r(c,x,y,7,3,'#473c39');r(c,x+1,y-2,4,2,'#99735d');if(j%5===0)r(c,x+2,y-1,2,2,'#e6a25b')}
  else{r(c,x,y,7,2,'#302d3b');r(c,x+2,y-2,3,3,'#a99ba9');if(j%7===0)r(c,x+5,y-3,2,2,'#8fbeaa')}
 }
 // Fortified gates with masonry, roofs and torches.
 for(const p of [path[0],path.at(-1)!]){const x=Math.max(5,Math.min(WIDTH-30,p.x)),y=p.y;for(const dy of [-38,30]){r(c,x-5,y+dy-26,30,33,dark);r(c,x-3,y+dy-29,26,30,'#6d7773');r(c,x-3,y+dy-29,26,4,'#b2b5a4');for(let j=0;j<3;j++)r(c,x-3+j*9,y+dy-35,7,8,'#a5aa9e');for(let j=0;j<4;j++)r(c,x-2,y+dy-19+j*6,24,1,'#4d5754');r(c,x+7,y+dy-16,6,11,'#303936');r(c,x+2,y+dy-5,3,5,'#b4834e');r(c,x+2,y+dy-10,3,5,'#ffca70')}}
 })}
const hex=(v:number)=>'#'+v.toString(16).padStart(6,'0');
export function towerKey(kind:TowerKind,level:number,branch=-1){return kind+':'+level+':'+branch}
export function towerTexture(kind:TowerKind,level:number,branch=-1){return texture(48,56,c=>{
 const l=level,elite=l>=4,final=l===5;
 const rect=(x:number,y:number,w:number,h:number,col:string)=>r(c,x,y,w,h,col);
 const shape=(pts:number[][],col:string)=>poly(c,pts,col);
 const stone=(x:number,y:number,w:number,h:number)=>{rect(x,y,w,h,'#343c3a');rect(x+1,y+1,w-2,h-2,'#69736d');rect(x+2,y+2,w-5,h-4,'#93988a');for(let j=y+5;j<y+h-2;j+=5){rect(x+2,j,w-4,1,'#59645e');rect(x+((j%2)?5:w-7),j-3,1,3,'#59645e')}};
 const wood=(x:number,y:number,w:number,h:number)=>{rect(x,y,w,h,'#47352b');rect(x+1,y+1,w-2,h-2,'#96653d');rect(x+1,y+1,2,h-2,'#d2a06a');rect(x+w-2,y+2,1,h-4,'#69462e')};
 const crystal=(x:number,y:number,w:number,h:number)=>{shape([[x,y-h],[x+w,y-3],[x+w-2,y+3],[x,y+6],[x-w,y-1]],'#305c76');shape([[x,y-h+2],[x+w-2,y-3],[x,y+4],[x-w+2,y-1]],'#74c9e9');shape([[x,y-h+2],[x,y+4],[x-w+2,y-1]],'#cbf4ff');rect(x-1,y-h+3,2,5,'#efffff')};
 const orb=(x:number,y:number,rad:number,col:string)=>{oval(c,x,y,rad+1,rad+1,'#252a45');oval(c,x,y,rad,rad,col);oval(c,x-2,y-2,Math.max(1,rad/3),Math.max(1,rad/3),'#f4e7ff')};
 const flag=(x:number,y:number,col:string)=>{rect(x,y,1,15,'#c6b28b');shape([[x+1,y],[x+10,y+2],[x+7,y+6],[x+1,y+7]],col)};
 oval(c,24,47,21,6,'#26382c');
 switch(kind){
 case 'archer':{
  const y=32-l*2;
  wood(11,y+7,5,43-y-7);wood(32,y+7,5,43-y-7);
  shape([[13,y+9],[16,y+9],[34,40],[30,40]],'#67462f');shape([[34,y+9],[31,y+9],[14,40],[18,40]],'#b4814c');
  if(l>=2){wood(19,35,10,9);rect(10,42,28,3,'#b58b59')}
  wood(5,y+5,38,6);wood(8,y,3,8);wood(37,y,3,8);
  const arch=(x:number,yy:number)=>{rect(x-3,yy+6,6,7,'#395c42');rect(x-2,yy+1,4,5,'#e1b087');shape([[x-4,yy+2],[x,yy-3],[x+4,yy+2]],'#4a754d');rect(x+4,yy+4,1,8,'#f1d19b');rect(x+3,yy+3,3,1,'#b17b45');rect(x+3,yy+12,3,1,'#b17b45');rect(x+4,yy+7,5,1,'#eddbba')};
  arch(branch===1?13:21,y-8);if(branch===1)arch(29,y-8);if(elite&&branch===1)arch(21,y-17);
  if(branch===0){wood(15,y-4,19,3);rect(23,y-12,2,16,'#d7c8a0');rect(15,y-9,18,2,'#b78248')}
  if(elite){shape([[3,y-9],[24,y-20],[45,y-9],[40,y-7],[8,y-7]],'#382f28');shape([[6,y-10],[24,y-18],[42,y-10]],branch===0?'#805c35':'#526d3a');rect(8,y-8,32,2,'#ce9d5e')}
  if(final)flag(38,2,branch===0?'#c58746':'#a3c06d');
  break}
 case 'ballista':{
  stone(9,35,30,10);wood(12,28,24,8);wood(18,22,12,13);
  const cross=(yy:number,w:number)=>{shape([[24-w,yy+4],[24-w+3,yy-3],[24,yy+2],[24+w-3,yy-3],[24+w,yy+4],[24,yy+7]],'#392c27');shape([[24-w+2,yy+3],[24-w+4,yy-1],[24,yy+4],[24+w-4,yy-1],[24+w-2,yy+3],[24,yy+5]],'#b18048');rect(24-w+2,yy+4,w*2-4,1,'#e3d6ae');wood(21,yy-10,6,22);rect(23,yy-12,2,22,'#c7cdd0');shape([[24,yy-15],[27,yy-10],[21,yy-10]],'#ecf0e5')};
  cross(26-l*2,Math.min(22,14+l*2));if(branch===1){wood(12,29,24,4);rect(16,11,2,21,'#d6dbe0');rect(31,11,2,21,'#d6dbe0');if(elite){rect(15,10,4,4,'#abb4b5');rect(30,10,4,4,'#abb4b5')}}if(branch===0){rect(21,7,6,19,'#626e76');rect(22,5,4,19,'#d4d9d8')}
  if(elite){stone(5,35,8,8);stone(35,35,8,8)}if(final){rect(8,39,32,2,'#e1c18c');flag(39,17,'#9eafb8')}break}
 case 'mage':{
  const top=26-l*3, w=12+l;
  stone(24-w/2-3,top+10,w+6,40-top);stone(13,39,22,6);
  rect(21,34,6,10,'#302c45');rect(22,35,4,2,'#b992ef');rect(22,22,4,5,'#49396b');rect(23,23,2,3,'#d5a8fa');
  shape([[24,top-8],[24+w/2+6,top+10],[24-w/2-6,top+10]],'#30283f');shape([[24,top-6],[24+w/2+3,top+8],[24-w/2-3,top+8]],branch===1?'#6a499c':'#795b99');shape([[24,top-6],[24,top+8],[24-w/2-3,top+8]],'#b28bdb');rect(24-w/2-4,top+9,w+8,2,'#c6a1ef');
  orb(24,Math.max(7,top-9),l>=3?5:4,'#b68ef4');if(branch===1){orb(8,top+8,3,'#a9b5ff');orb(40,top+8,3,'#a9b5ff');if(elite)orb(24,top+19,4,'#c6a4ff')}if(branch===0&&elite){shape([[7,37],[9,16],[14,37]],'#8b62bf');shape([[34,37],[39,16],[41,37]],'#8b62bf')}
  if(final){rect(13,39,22,2,'#e3c9ff');rect(18,29,12,1,'#d5a6ff')}break}
 case 'frost':{
  shape([[4,40],[10,31],[33,32],[44,41],[33,46],[11,46]],'#466c79');shape([[5,40],[12,35],[35,35],[43,40],[32,44],[13,44]],'#a1d4e0');
  crystal(24,36,9+l,15+l*3);crystal(11,39,5,10+l);crystal(37,39,5,9+l);
  if(l>=2){crystal(18,42,5,11);crystal(31,42,5,10)}
  if(branch===0){crystal(8,31,5,15+l);crystal(39,31,5,15+l);if(elite)crystal(24,34,12,Math.min(31,23+l*2))}
  if(branch===1){crystal(6,40,4,13);crystal(42,40,4,13);crystal(15,28,5,14);crystal(34,28,5,15);if(elite){crystal(8,27,4,13);crystal(40,27,4,13)}}
  if(final){rect(9,45,30,2,'#e6fbff');rect(22,8,3,3,'#fff')}break}
 case 'bomb':{
  stone(5,34,38,11);wood(10,28,28,7);oval(c,12,38,7,7,'#3c302b');oval(c,12,38,5,5,'#a28154');oval(c,36,38,7,7,'#3c302b');oval(c,36,38,5,5,'#a28154');
  const w=branch===0?19+l:14+l, y=24-l*2;rect(24-w/2-1,y,w+2,21,'#242b30');rect(24-w/2,y+1,w,18,'#4d5860');rect(24-w/2+2,y+1,3,15,'#929b9b');rect(24-w/2-3,y,w+6,4,'#a3a6a0');rect(24-w/2-2,y+4,w+4,3,'#343b42');oval(c,24,y+1,w/2,4,'#1c252a');oval(c,24,y,w/2-2,2,branch===1?'#dd6c32':'#111b20');rect(24-w/2,y+12,w,2,'#ba975e');
  if(branch===1){for(const x of [5,37]){wood(x,27,6,10);rect(x+1,27,4,3,'#ed814c');rect(x+1,32,4,1,'#f9d789')}}if(branch===0&&elite){stone(3,24,7,13);stone(38,24,7,13)}if(final){rect(7,42,34,2,'#dfb77c');rect(22,y-3,4,3,'#ffb66f')}break}
 case 'lightning':{
  stone(9,36,30,9);stone(17,14,14,25);rect(20,15,8,21,'#4d5558');rect(22,15,4,20,'#c4a36b');
  for(let j=0;j<2+l;j++){const y=12+j*4;rect(13,y,22,3,'#3a4146');rect(14,y,20,1,'#e0be6e')}
  orb(24,8,5,'#f5dc78');if(l>=2){stone(7,28,7,12);stone(34,28,7,12);orb(10,24,3,'#e9d286');orb(38,24,3,'#e9d286')}
  if(branch===1){orb(7,12,4,'#fff0a1');orb(41,12,4,'#fff0a1')}if(branch===0){rect(22,1,4,9,'#f5e7b0');rect(16,5,16,2,'#e3bf68')}if(final)rect(12,40,24,2,'#e7c67a');break}
 case 'barracks':{
  stone(6,20,36,25);shape([[2,20],[24,5+l],[46,20]],'#42352e');shape([[5,19],[24,7+l],[43,19]],branch===1?'#854e42':'#526e80');rect(7,20,34,3,'#c4ab84');wood(19,29,10,16);for(const x of [9,34]){rect(x,25,5,6,'#303b40');rect(x,25,5,1,'#d4c49c')}if(l>=2){flag(6,9,'#a9c2d3');flag(39,9,'#a9c2d3')}if(elite){stone(3,32,8,12);stone(37,32,8,12)}if(branch===0){rect(22,23,4,6,'#efdaa2');rect(20,25,8,2,'#efdaa2')}if(branch===1){rect(21,23,2,7,'#e1b4a0');rect(25,23,2,7,'#e1b4a0')}if(final)rect(8,42,32,2,'#f1d492');break}
 case 'venom':{
  const pot=(x:number,y:number,w:number,h:number,col:string)=>{rect(x+2,y-3,w-4,4,'#c4a66e');rect(x,y,w,h,'#354940');rect(x+1,y+1,w-2,h-2,'#8eac72');rect(x+2,y+Math.floor(h*.33),w-4,Math.ceil(h*.6),col);rect(x+2,y+2,2,h-4,'#cfe8b0');rect(x+w-3,y+2,1,h-4,'#577e53');rect(x-1,y+h-2,w+2,3,'#a48753')};
  stone(7,39,34,6);wood(8,29,32,11);pot(14,20-l*2,20,22+l*2,branch===0?'#aee453':'#83bd4d');rect(23,13-l*2,3,6,'#bf9e62');rect(26,13-l*2,12,3,'#c2a76b');rect(36,13-l*2,3,13,'#a88c59');pot(32,25,11,14,'#b5d75f');
  if(l>=2)pot(4,28,11,12,'#6fa553');if(branch===0){pot(8,12,10,16,'#c0ef56');rect(12,7,3,6,'#bca069');if(elite)pot(33,12,11,15,'#d5f57a')}if(branch===1){rect(19,9-l,10,4,'#77725a');rect(20,5-l,8,5,'#4a5343');if(elite){rect(4,17,7,13,'#66705c');rect(36,16,7,11,'#66705c')}}
  if(final){rect(9,40,30,2,'#d4df8b');rect(21,25,5,3,'#f3ffb7')}break}
 }
 // Permanent rank plate: one mark per tier, no dependence on hue.
 rect(13,48,22,5,'#26332c');for(let i=0;i<l;i++)rect(14+i*4,49,3,3,'#f5d894');
 if(branch>=0){rect(36,46,7,7,'#30372c');if(branch===0)shape([[39,47],[42,51],[37,51]],'#f5e4b2');else{rect(37,48,2,4,'#f5e4b2');rect(40,48,2,4,'#f5e4b2')}}
 })}
function enemyTexture(kind:EnemyKind,frame:number,dir:number){return texture(24,27,c=>{const d=enemies[kind],col=hex(d.color),walk=[0,2,0,-2][frame],bob=frame%2;oval(c,12,23,9,3,'#293c30');c.save();c.translate(0,bob);if(dir===2){c.translate(24,0);c.scale(-1,1)}
 if(kind==='spider'||kind==='spiderling'){for(let j=0;j<4;j++){const y=9+j*3;r(c,3-j%2,y+walk%2,7,2,'#503b39');r(c,15,y-walk%2,7,2,'#503b39');r(c,3-j%2,y+2,2,4,'#79604e');r(c,20,y+2,2,4,'#79604e')}oval(c,12,12,7,6,'#523c39');oval(c,12,12,5,4,col);oval(c,17,16,4,4,'#513b3d');r(c,18,15,2,1,'#ffd28a')}
 else if(kind==='dragon'){poly(c,[[12,10],[2,3+walk],[0,18],[8,15],[12,20]],'#793a34');poly(c,[[12,10],[22,3-walk],[24,18],[16,15],[12,20]],'#793a34');poly(c,[[12,10],[4,5+walk],[4,14]],'#d68057');poly(c,[[12,10],[20,5-walk],[20,14]],'#d68057');r(c,8,9,8,12,col);r(c,10,3,7,8,'#a34b3e');r(c,14,5,2,2,'#ffedaa');r(c,11,19,3,6,'#d28a58')}
 else if(kind==='wolf'){r(c,4,12,14,8,'#4a4c57');r(c,5,11,12,6,col);r(c,17,9,5,7,col);r(c,20,13,4,3,'#5e5d65');r(c,17,7,2,4,'#555863');r(c,18,11,1,1,'#ffb861');r(c,5,18,3,5+walk,'#373c45');r(c,15,18,3,5-walk,'#373c45');r(c,1,9,4,3,'#727584')}
 else if(kind==='wraith'){poly(c,[[4,10],[7,5],[16,4],[20,10],[20,22],[15,19],[11,23],[7,19],[4,22]],'#426f7b');poly(c,[[7,9],[12,3],[17,8],[18,20],[12,17],[8,21]],col);r(c,9,8,7,6,'#263f4b');r(c,10,10,2,2,'#dcffff');r(c,14,10,2,2,'#dcffff')}
 else{const sk=kind==='skeleton',boss=isBoss(kind)||kind==='golem'||kind==='troll';r(c,7,18,4,6+walk,'#343b3b');r(c,13,18,4,6-walk,'#343b3b');r(c,5,10,14,10,'#303b3c');r(c,7,10,10,9,sk?'#b9aa91':boss?'#777f78':'#6e5147');r(c,7,3,10,8,'#333e3d');r(c,8,3,8,7,col);r(c,9,5,6,3,sk?'#4b4a45':'#59633f');r(c,dir===1?8:10,6,2,1,'#ffdb9c');r(c,14,6,2,1,'#ffdb9c');r(c,4,11,4,7,col);r(c,16,11,4,7,col);r(c,8,17,8,2,'#a99a70');if(sk){for(let j=0;j<3;j++)r(c,8,11+j*2,8,1,'#eee0c0')}else{r(c,9,11,6,4,boss?'#b2b4a4':'#96906f');r(c,12,12,2,3,'#484846')}
 if(kind==='goblin'){r(c,5,5,3,3,col);r(c,16,5,3,3,col)}if(kind==='orc'||boss){r(c,4,10,5,4,'#91978d');r(c,15,10,5,4,'#91978d');r(c,19,8,2,13,'#d1c5ac');r(c,17,16,6,2,'#72553e')}if(kind==='lich'||kind==='shaman'){r(c,3,6,2,17,'#b38c5c');r(c,1,3,6,5,'#d6a5ff');r(c,6,2,12,3,'#795a9a')}if(kind==='raider'){r(c,6,2,12,3,'#9f6241');r(c,4,10,5,9,'#bb874e');r(c,16,9,5,10,'#754334')}
 if(kind==='troll'){r(c,4,9,5,10,'#5c8f69');r(c,15,9,6,10,'#83aa7a');r(c,7,2,10,3,'#587e55');r(c,8,11,8,7,'#77835a')}
 if(kind==='golem'){r(c,4,9,6,7,'#9ba9b0');r(c,14,9,6,7,'#c4c5ba');r(c,9,12,6,5,'#8dbfd1')}
 if(kind==='lich'){r(c,7,10,10,11,'#544575');r(c,8,11,2,10,'#a98bce');r(c,8,4,8,5,'#d6cbd2')}
 if(kind==='demon'){r(c,5,0,3,6,'#f0b1a2');r(c,17,0,3,6,'#f0b1a2')}if(boss){r(c,7,1,10,2,'#dfb76e');r(c,7,0,2,3,'#e4c47a');r(c,15,0,2,3,'#e4c47a')}}
 c.restore();
 // One-pixel sprite contour: separate silhouettes against snow, grass and neighboring units.
 const src=c.getImageData(0,0,24,27),out=c.createImageData(24,27);
 for(let y=0;y<27;y++)for(let x=0;x<24;x++){const i=(y*24+x)*4;if(src.data[i+3]){out.data.set(src.data.subarray(i,i+4),i);continue}if(y>23)continue;let edge=false;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<24&&yy>=0&&yy<24&&src.data[(yy*24+xx)*4+3]>140)edge=true}if(edge){out.data[i]=28;out.data[i+1]=30;out.data[i+2]=36;out.data[i+3]=215}}
 c.putImageData(out,0,0);
 })}
function glowTexture(){const t=texture(128,128,c=>{const g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.16,'rgba(255,255,255,.72)');g.addColorStop(.42,'rgba(255,255,255,.30)');g.addColorStop(.75,'rgba(255,255,255,.06)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,128,128)});t.source.scaleMode='linear';return t}
export class View{
 app=new Application(); quality:VisualQuality='full'; presentation=new Presentation(); world=new Container(); glowLayer=new Container(); groundLight=new Container(); overlay=new Graphics(); glowPool:Sprite[]=[];groundPool:Sprite[]=[];glow?:Texture;glowCount=0;groundCount=0;camera={x:0,y:0,scale:1};private previous?:State; bg?:Sprite; map?:MapId; landscapes=new Map<MapId,Texture>(); ambient=new Graphics(); layer=new Container(); objects=new Container(); fx=new Graphics(); marker=new Graphics(); towerArt=new Map<string,Texture>(); enemyArt=new Map<string,Texture>(); sprites=new Map<number,Sprite>();
 async init(host:HTMLElement){await this.app.init({width:WIDTH,height:HEIGHT,background:0x263b2a,antialias:false,preference:'webgl',resolution:1});host.appendChild(this.app.canvas);this.app.canvas.setAttribute('aria-label','Поле сражения');this.bg=new Sprite(terrain('forest'));this.landscapes.set('forest',this.bg.texture);this.bg.width=WIDTH;this.bg.height=HEIGHT;this.map='forest';this.glow=glowTexture();this.world.addChild(this.bg,this.groundLight,this.ambient,this.marker,this.layer,this.fx,this.glowLayer);this.app.stage.addChild(this.world,this.overlay);this.layer.sortableChildren=true;for(const kind of Object.keys(towers) as TowerKind[])for(let l=1;l<=MAX_LEVEL;l++)for(const b of l<3?[-1]:[0,1])this.towerArt.set(towerKey(kind,l,b),towerTexture(kind,l,b));for(const kind of Object.keys(enemies) as EnemyKind[])for(let f=0;f<4;f++)for(let d=0;d<4;d++)this.enemyArt.set(kind+f+d,enemyTexture(kind,f,d))}
 sprite(id:number,tex:Texture,x:number,y:number,scale:number){let sp=this.sprites.get(id);if(!sp){sp=new Sprite(tex);sp.anchor.set(.5,.82);this.layer.addChild(sp);this.sprites.set(id,sp)}sp.texture=tex;sp.position.set(Math.round(x),Math.round(y));sp.scale.set(scale);sp.zIndex=y;sp.alpha=1;return sp}
 private light(x:number,y:number,radius:number,color:number,alpha:number,ground=false){if(this.quality==='reduced'||alpha<=0)return;const pool=ground?this.groundPool:this.glowPool,index=ground?this.groundCount++:this.glowCount++;if(index>=120)return;let sp=pool[index];if(!sp){sp=new Sprite(this.glow!);sp.anchor.set(.5);sp.blendMode='add';(ground?this.groundLight:this.glowLayer).addChild(sp);pool.push(sp)}sp.visible=true;sp.position.set(x,y);sp.width=radius*2;sp.height=radius*2*(ground?.65:1);sp.tint=color;sp.alpha=Math.min(.85,alpha)}
 capture(s:State){if(this.previous!==s){this.presentation.reset();this.previous=s}this.presentation.capture(s.effects,s.shots)}
 toWorld(p:Point){return unproject(p,this.camera)}
 render(s:State,selected:Tower|undefined,kind:TowerKind|undefined,hover:Point|undefined,ability?:Ability,dt=1/60,paused=false){if(this.previous!==s){this.presentation.reset();this.previous=s}this.presentation.update(s.effects,s.shots,dt,paused);const clock=this.presentation.time;this.camera=cameraTransform(clock,paused?0:this.presentation.trauma,this.quality);this.world.position.set(this.camera.x,this.camera.y);this.world.scale.set(this.camera.scale);this.overlay.clear();this.glowCount=0;this.groundCount=0;const alive=new Set<number>();this.fx.clear();this.marker.clear();this.ambient.clear();
 const map=mapById(s.map);if(this.map!==map.id){this.map=map.id;let tex=this.landscapes.get(map.id);if(!tex){tex=terrain(map.id);this.landscapes.set(map.id,tex)}this.bg!.texture=tex;this.bg!.width=WIDTH;this.bg!.height=HEIGHT}
 for(let j=0;j<35;j++){const x=(j*137+s.time*(map.id==='frost'?12:5))%WIDTH,y=(j*71+s.time*(map.id==='frost'?19:3))%HEIGHT,a=.22+Math.sin(s.time*1.6+j)*.15;this.ambient.circle(x,y,map.id==='frost'?1.6:1.1).fill({color:map.id==='frost'?0xffffff:map.id==='ash'?0xffa55e:map.id==='crypt'?0xd0b6fa:0xe7df9a,alpha:a})}

 for(const p of [map.path[0],map.path.at(-1)!]){const x=Math.max(9,Math.min(WIDTH-17,p.x));for(const dy of [-39,32]){const y=p.y+dy-9,a=.24+Math.sin(clock*9+dy)*.045;this.light(x,y,54,0xff9c45,a,true);this.light(x,y,17,0xffc16a,a+.1)}}
 if(map.id==='ash'||map.id==='crypt'||map.id==='marsh')for(const o of map.obstacles){const a=.17+Math.sin(clock*1.7+o.x)*.06;this.light(o.x,o.y,Math.min(42,o.r),map.id==='ash'?0xff8445:map.id==='crypt'?0xb9a1fa:0x81d2b1,a,true)}
 for(const t of s.towers){
  alive.add(t.id);const sp=this.sprite(t.id,this.towerArt.get(towerKey(t.kind,t.level,t.branch))!,t.x,t.y,1.2);sp.anchor.set(.5,.82);sp.tint=(t.stun??0)>0?0xb77b64:0xffffff;
  const st=stats(t),f=Math.max(0,Math.min(1,(t.cool-st.rate+.17)/.17)),cx=t.x,cy=t.y-26,dx=Math.cos(t.angle),dy=Math.sin(t.angle);if(['mage','frost','lightning','venom'].includes(t.kind)){const a=.16+Math.sin(clock*3+t.id)*.04;this.light(cx,cy-7,46,towers[t.kind].color,a,true);this.light(cx,cy-7,21,towers[t.kind].color,a+f*.28)}if(f>0&&(t.kind==='bomb'||t.kind==='ballista'))this.light(cx+dx*17,cy+dy*17,33,0xffb35f,f*.5);
  if(t.kind==='ballista'||t.kind==='bomb'){
   const len=t.kind==='ballista'?20:13,w=t.kind==='ballista'?3:8,back=f*5;
   this.fx.moveTo(cx-dx*back,cy-dy*back).lineTo(cx+dx*(len-back),cy+dy*(len-back)).stroke({color:0x303c43,width:w+3});
   this.fx.moveTo(cx-dx*back,cy-dy*back).lineTo(cx+dx*(len-back),cy+dy*(len-back)).stroke({color:t.kind==='ballista'?0xd3c7a6:0x88979b,width:w});
   if(f>0)this.fx.circle(cx+dx*len,cy+dy*len,3+f*5).fill({color:0xffcd77,alpha:f});
  }else if(t.kind==='archer'&&f>0)this.fx.moveTo(cx,cy).lineTo(cx+dx*14,cy+dy*14).stroke({color:0xf7d699,width:2,alpha:f});
  else if(t.kind==='mage'){const a=s.time*2+t.id;this.fx.circle(cx+Math.cos(a)*12,cy-9+Math.sin(a)*5,2).fill({color:0xe2c2ff,alpha:.85});if(f>0)this.fx.circle(cx,cy-8,8+f*8).stroke({color:0xd5a6ff,width:2,alpha:f})}
  else if(t.kind==='frost'){const a=s.time*1.5+t.id;this.fx.circle(cx+Math.cos(a)*13,cy+Math.sin(a)*8,1.5).fill(0xe0faff);if(f>0)this.fx.circle(cx,cy,8+f*8).stroke({color:0xa1eaff,width:2,alpha:f})}
  else if(t.kind==='lightning'){const a=s.time*7+t.id;for(let j=0;j<3;j++){const q=a+j*2.1;this.fx.moveTo(cx,cy-12).lineTo(cx+Math.cos(q)*10,cy-12+Math.sin(q)*8).lineTo(cx+Math.cos(q+.4)*17,cy-12+Math.sin(q+.4)*12).stroke({color:0xffe9a0,width:1.5,alpha:.8})}}
  else if(t.kind==='barracks'){for(let j=0;j<2;j++){const rp=rallyPoint(t,s.map),reach=Math.hypot(rp.x-t.x,rp.y-t.y)<=st.range,rx=reach?rp.x:cx,ry=reach?rp.y:t.y;const x=rx-9+j*18+Math.cos(s.time*4+j)*3,y=ry+5+Math.sin(s.time*5+j)*1.5;this.fx.rect(x-4,y-9,8,11).fill(0x526c79).rect(x-3,y-13,6,5).fill(0xe2d5b7).rect(x-5,y-8,4,7).fill(0xd2b77d);if(f>0)this.fx.moveTo(x,y-6).lineTo(x+dx*11,y-6+dy*11).stroke({color:0xffe7b5,width:2})}}
  else if(t.kind==='venom'){for(let j=0;j<3;j++){const q=(s.time*.7+j/3+t.id*.17)%1;this.fx.circle(cx+(j-1)*6,cy-18*q,2+q*2).stroke({color:0xc3f17b,width:1,alpha:1-q})}}
 }
 // Status markers on the ground keep the actual sprite palette readable.
 for(const e of s.enemies){alive.add(e.id);const f=Math.floor((e.stride??e.distance)/6)%4,d=Math.abs(Math.cos(e.angle))>.5?(Math.cos(e.angle)>0?0:2):(Math.sin(e.angle)>0?1:3),boss=isBoss(e.kind);
  const sp=this.sprite(e.id,this.enemyArt.get(e.kind+f+d)!,e.x,e.y,boss?2.8:e.kind==='spiderling'?.9:e.kind==='golem'||e.kind==='troll'?1.85:1.25);
  sp.tint=e.hit>0?0xffe1d4:0xffffff;
  if(e.slow>0){const r=boss?22:11;this.marker.ellipse(e.x,e.y+1,r,r*.42).stroke({color:0xa9e5ff,width:1.8,alpha:.9});for(let j=0;j<3;j++){const a=j*2.1+e.id;this.marker.rect(e.x+Math.cos(a)*r-1,e.y+Math.sin(a)*r*.4-2,3,3).fill(0xbbeeff)}}
  if(e.poison>0){this.marker.ellipse(e.x,e.y+3,boss?23:12,5).stroke({color:0xb5dc68,width:1.6,alpha:.8});this.fx.circle(e.x+7,e.y-20,2).fill(0xb5dc68)}
  if((e.burn??0)>0){const a=clock*12+e.id;this.fx.rect(e.x+Math.sin(a)*6,e.y-14-((clock*17+e.id)%10),3,5).fill(0xffb251);this.light(e.x,e.y-10,19,0xff7935,.18)}
  if(e.shield){this.fx.circle(e.x,e.y-17,23).stroke({color:0xd9a9ff,width:2,alpha:.7});this.light(e.x,e.y-17,38,0xb28eea,.2)}
  const w=boss?49:19,yy=e.y-(boss?58:28);if(boss||e.hp<e.maxHp){this.fx.rect(e.x-w/2-1,yy-1,w+2,5).fill(0x25282a).rect(e.x-w/2,yy,w*Math.max(0,Math.min(1,e.hp/e.maxHp)),3).fill(boss?0xe6a449:0x9fce70)}
 }
 for(const [id,sp] of this.sprites)if(!alive.has(id)){sp.destroy();this.sprites.delete(id)}
 if(selected&&s.phase!=='won'&&s.phase!=='lost'){this.marker.circle(selected.x,selected.y,stats(selected).range).fill({color:0xe9d49b,alpha:.09}).stroke({color:0xe6d2a0,width:1,alpha:.8});this.marker.circle(selected.x,selected.y,24).stroke({color:0xffda86,width:2})}
 if(kind&&hover){const ok=canBuild(s,hover,kind),color=ok?0x9bdf87:0xff7171;this.marker.circle(hover.x,hover.y,towers[kind].range).fill({color,alpha:.06}).stroke({color,alpha:.65,width:1}).circle(hover.x,hover.y,22).stroke({color,width:2})}
 if(ability&&hover&&ability!=='freeze'){this.marker.circle(hover.x,hover.y,ability==='meteor'?90:100).fill({color:0xe5a75b,alpha:.14}).stroke({color:0xffd68c,width:2})}
 for(const a of this.presentation.shots){
  const f=1-a.life/a.max,x=a.x+(a.tx-a.x)*f,y=a.y+(a.ty-a.y)*f,col=towers[a.kind].color,angle=Math.atan2(a.ty-a.y,a.tx-a.x),dx=Math.cos(angle),dy=Math.sin(angle);
  if(a.kind==='lightning'||a.kind==='mage'){this.light(a.tx,a.ty,42,col,(1-f)*.35);this.light(a.x,a.y,26,col,(1-f)*.22)}else if(a.kind==='bomb')this.light(x,y-Math.sin(f*Math.PI)*35,22,0xffa34d,.35);else if(a.kind==='frost'||a.kind==='venom')this.light(x,y,20,col,.25);
  switch(a.kind){
   case 'archer':case 'ballista':{const long=a.kind==='ballista'?21:11;this.fx.moveTo(x-dx*long,y-dy*long).lineTo(x,y).stroke({color:0x392f28,width:a.kind==='ballista'?5:3});this.fx.moveTo(x-dx*long,y-dy*long).lineTo(x,y).stroke({color:col,width:a.kind==='ballista'?3:1.5});this.fx.circle(x,y,a.kind==='ballista'?2.5:1.5).fill(0xfff1c9);break}
   case 'lightning':case 'mage':{this.fx.moveTo(a.x,a.y).lineTo(a.tx,a.ty).stroke({color:col,width:12,alpha:(1-f)*.25}).moveTo(a.x,a.y).lineTo(a.tx,a.ty).stroke({color:col,width:6,alpha:(1-f)*.65});this.fx.moveTo(a.x,a.y).lineTo(a.x+(a.tx-a.x)*.35+dy*5,a.y+(a.ty-a.y)*.35-dx*5).lineTo(a.x+(a.tx-a.x)*.7-dy*5,a.y+(a.ty-a.y)*.7+dx*5).lineTo(a.tx,a.ty).stroke({color:0xf2d9ff,width:2,alpha:1-f});break}
   case 'frost':{this.fx.circle(x,y,5).fill({color:0x9de7ff,alpha:.5});for(let j=0;j<3;j++){const q=angle+j*Math.PI/3;this.fx.moveTo(x-Math.cos(q)*6,y-Math.sin(q)*6).lineTo(x+Math.cos(q)*6,y+Math.sin(q)*6).stroke({color:0xe1faff,width:2})}break}
   case 'bomb':{const arc=Math.sin(f*Math.PI)*35;for(let j=1;j<=4;j++)this.fx.circle(x-dx*j*4,y-arc-dy*j*4,2+j*.7).fill({color:0xa29c88,alpha:.5-j*.08});this.fx.circle(x,y-arc,5).fill(0x30383a).circle(x-1,y-arc-2,2).fill(0xffbb72);break}
   case 'barracks':this.fx.moveTo(a.tx-9,a.ty-7).lineTo(a.tx+9,a.ty+7).stroke({color:0xffe3ac,width:3,alpha:1-f});break;
   case 'venom':this.fx.circle(x,y,5).fill({color:0x7eb943,alpha:.8}).circle(x-1,y-2,2).fill(0xd8ff9e);break;
  }
 }
 for(const e of this.presentation.effects){const f=1-e.life/e.max,alpha=1-f;
 if(e.kind==='meteor'){const x=e.x-80*(1-f),y=e.y-180*(1-f);if(f<.45){this.light(x,y,65,0xff903d,.65);this.fx.moveTo(x-45,y-90).lineTo(x,y).stroke({color:0xff8638,width:16,alpha:.65}).circle(x,y,12).fill(0xffdb8e)}else{const q=(f-.45)/.55;this.light(e.x,e.y,130,0xff8b36,(1-q)*.8);this.light(e.x,e.y,54,0xffdc96,(1-q)*.75);this.fx.circle(e.x,e.y,12+q*90).fill({color:0xff702c,alpha:(1-q)*.42}).circle(e.x,e.y,10+q*90).stroke({color:0xffe1a2,width:5*(1-q)+1,alpha:1-q});for(let j=0;j<20;j++){const a=j*6.28/20;this.fx.circle(e.x+Math.cos(a)*q*100,e.y+Math.sin(a)*q*100,4*(1-q)+1).fill({color:0xffbc61,alpha:1-q})}}continue}
 if(e.kind==='freeze'){if(this.quality==='full')this.fx.rect(0,0,WIDTH,HEIGHT).fill({color:0xa7edff,alpha:alpha*.07});for(let j=0;j<65;j++){const x=(j*137)%WIDTH,y=(j*71+f*80)%HEIGHT;this.fx.moveTo(x-4,y).lineTo(x+4,y).moveTo(x,y-4).lineTo(x,y+4).stroke({color:0xe4fbff,width:2,alpha})}continue}
 if(e.kind==='guard'||e.kind==='boss'){const radius=e.radius??90;this.light(e.x,e.y,radius,e.color,alpha*.4);this.fx.circle(e.x,e.y,radius*f).stroke({color:e.color,width:4,alpha}).circle(e.x,e.y,radius*f*.7).stroke({color:e.color,width:2,alpha});if(e.kind==='guard')for(let j=0;j<6;j++){const a=j*Math.PI/3,x=e.x+Math.cos(a)*40,y=e.y+Math.sin(a)*40;this.fx.rect(x-4,y-9,8,12).fill({color:0xc9bc93,alpha}).rect(x-3,y-14,6,5).fill({color:0xffe6aa,alpha})}continue}
 if(e.kind==='death'){for(let j=0;j<12;j++){const a=j*2.4+e.x;this.fx.rect(e.x+Math.cos(a)*f*35,e.y-8+Math.sin(a)*f*24-f*8,3+2*alpha,3+2*alpha).fill({color:j%2?e.color:0xe5d2a5,alpha})}}
 if(e.kind==='hit'&&e.color===towers.bomb.color&&e.max>.4){this.light(e.x,e.y,82,0xff8b3a,alpha*.65);if(f<.24)this.fx.circle(e.x,e.y,18*(1-f)).fill({color:0xfff0bb,alpha:1-f*3});for(let j=0;j<9;j++){const a=j*.698+e.x,rr=10+f*46,x=e.x+Math.cos(a)*rr,y=e.y+Math.sin(a)*rr;this.fx.circle(x,y,5+f*7).fill({color:0x51433a,alpha:alpha*.36});this.fx.moveTo(x,y).lineTo(x-Math.cos(a)*12*alpha,y-Math.sin(a)*12*alpha).stroke({color:0xffd396,width:2,alpha})}this.light(e.x,e.y,30,0xffd8a4,alpha*.7);this.fx.circle(e.x,e.y,8+f*42).fill({color:0xff8b43,alpha:alpha*.23}).circle(e.x,e.y,6+f*42).stroke({color:0xffdc93,width:4*alpha+1,alpha});for(let j=0;j<12;j++){const a=j*.524+e.x;this.fx.circle(e.x+Math.cos(a)*f*45,e.y+Math.sin(a)*f*45,4*alpha+1).fill({color:j%2?0xffc16a:0xe3a083,alpha})}}if(e.kind==='hit'&&e.color===towers.venom.color&&e.max>.4){for(let j=0;j<6;j++){const a=j*Math.PI/3;this.fx.circle(e.x+Math.cos(a)*f*27,e.y+Math.sin(a)*f*27,7+f*6).fill({color:0x8fbd4b,alpha:alpha*.35})}}this.fx.circle(e.x,e.y-5,5+f*(e.kind==='build'?27:e.kind==='hit'?17:24)).stroke({color:e.color,width:2,alpha});for(let i=0;i<6;i++){const a=i*Math.PI/3+e.x;this.fx.rect(e.x+Math.cos(a)*f*23,e.y-6+Math.sin(a)*f*23,3,3).fill({color:e.color,alpha})}}
 for(let j=Math.min(this.glowCount,120);j<this.glowPool.length;j++)this.glowPool[j].visible=false;
 for(let j=Math.min(this.groundCount,120);j<this.groundPool.length;j++)this.groundPool[j].visible=false;
 if(this.quality==='full'&&this.presentation.flash>0)this.overlay.rect(0,0,WIDTH,HEIGHT).fill({color:0xffe4c3,alpha:this.presentation.flash*.45});

 }
}
