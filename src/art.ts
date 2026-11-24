import {Application,Container,Graphics,Sprite,Texture} from 'pixi.js';
import {WIDTH,HEIGHT,path,obstacles,towers,enemies,type Point,type TowerKind,type EnemyKind} from './content.ts';
import {canBuild,stats,type State,type Tower} from './game.ts';
type Paint=(c:CanvasRenderingContext2D)=>void;
function texture(w:number,h:number,paint:Paint){const a=document.createElement('canvas');a.width=w;a.height=h;const c=a.getContext('2d')!;c.imageSmoothingEnabled=false;paint(c);const t=Texture.from(a);t.source.scaleMode='nearest';return t}
function r(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)}
function oval(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,color:string){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
function poly(c:CanvasRenderingContext2D,p:number[][],color:string){c.fillStyle=color;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
let seed=3;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
function pine(c:CanvasRenderingContext2D,x:number,y:number,s:number){c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);oval(c,3,3,13,6,'#24372b');r(c,-2,-7,5,11,'#74513b');for(let i=0;i<3;i++){const h=-9-i*9,w=14-i*3;poly(c,[[-w,h+5],[0,h-17],[w,h+5],[0,h+8]],'#203f31');poly(c,[[-w+2,h+3],[0,h-15],[0,h+5]],'#46724a');poly(c,[[0,h-15],[w-2,h+3],[0,h+5]],'#31583d')}c.restore()}
function terrain(){return texture(WIDTH/2,HEIGHT/2,c=>{c.scale(.5,.5);seed=17;r(c,0,0,WIDTH,HEIGHT,'#48623b');
 for(let y=0;y<HEIGHT;y+=8)for(let x=0;x<WIDTH;x+=8){const n=rand();if(n<.24)r(c,x,y,8,8,['#4e6940','#425d39','#526b40','#405937'][Math.floor(rand()*4)])}
 for(let i=0;i<1200;i++){const x=Math.floor(rand()*WIDTH/4)*4,y=Math.floor(rand()*HEIGHT/4)*4;r(c,x,y,2,4,rand()<.5?'#60804a':'#354f32');if(rand()<.1)r(c,x+2,y-2,2,2,'#c4b06b')}
 const road=()=>{c.beginPath();path.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.lineJoin='round';c.lineCap='round'};
 for(const [w,color] of [[68,'#324831'],[62,'#716347'],[54,'#a18b62'],[42,'#b39c70']] as const){road();c.lineWidth=w;c.strokeStyle=color;c.stroke()}
 for(let i=0;i<900;i++){const x=rand()*WIDTH,y=rand()*HEIGHT;const a=c.getImageData(Math.floor(x/2),Math.floor(y/2),1,1).data;if(a[0]>135&&a[0]<190&&a[1]>120&&a[1]<165)r(c,x,y,2+Math.floor(rand()*4)*2,2,rand()<.5?'#9d875f':'#c2a97a')}
 for(const o of obstacles){oval(c,o.x,o.y,o.r,o.r*.65,'#344b34');for(let i=0;i<12;i++){const a=rand()*6.28,d=rand()*(o.r-15);pine(c,o.x+Math.cos(a)*d,o.y+Math.sin(a)*d,.85+rand()*.65)}}
 for(let i=0;i<16;i++){const x=i*64+12; if(x>220&&x<550||x>700)pine(c,x,18,.75)}
 // Castle gate and entry ruins.
 for(const x of [4,WIDTH-26]){const y=x===4?112:272;for(const dy of [-38,27]){r(c,x-4,y+dy-24,28,30,'#39433c');r(c,x-2,y+dy-26,24,26,'#777d71');r(c,x-2,y+dy-26,24,4,'#a3a99a');for(let j=0;j<3;j++)r(c,x-2+j*9,y+dy-32,6,7,'#909589');r(c,x+7,y+dy-16,6,11,'#424840')}}
 })}
const hex=(v:number)=>'#'+v.toString(16).padStart(6,'0');
export function towerTexture(kind:TowerKind,level:number){return texture(32,40,c=>{const col=hex(towers[kind].color);oval(c,16,34,15,5,'#293b2d');r(c,3,29,26,5,'#4b5049');r(c,5,27,22,4,'#92968a');r(c,8,13,16,16,'#565d58');r(c,8,13,11,15,'#848b7b');r(c,9,17,8,2,'#a0a28c');r(c,16,23,8,2,'#424d47');r(c,13,24,6,6,'#343c37');
 if(kind==='archer'||kind==='ballista'){r(c,5,9,22,8,'#684630');r(c,5,9,22,3,'#b08351');r(c,7,6,3,8,'#d3a669');r(c,22,6,3,8,'#d3a669');r(c,12,5,8,9,'#6b5140');r(c,14,5,4,9,col);if(kind==='ballista')r(c,6,6,20,3,col)}
 else if(kind==='bomb'){r(c,5,11,22,7,'#787b6d');r(c,8,5,16,10,'#41494b');r(c,10,5,12,3,'#9ba2a0');r(c,13,3,6,8,'#292c30');r(c,12,3,8,3,'#727b7d')}
 else{r(c,6,12,20,4,'#b1a69b');poly(c,[[5,13],[16,2],[27,13],[16,18]],'#424e59');poly(c,[[8,12],[16,0],[23,12],[16,18]],col);poly(c,[[16,0],[16,16],[11,11]],'#e4e7d7');r(c,14,19,4,5,col);if(kind==='venom'){r(c,5,10,6,8,'#607c3a');r(c,6,11,4,5,col)}}
 if(level>1){r(c,4,20,4,7,col);r(c,24,20,4,7,col)}if(level===3){r(c,3,8,2,14,col);r(c,27,8,2,14,col);r(c,14,0,4,3,'#f7e4a2')}
 })}
function enemyTexture(kind:EnemyKind,frame:number,dir:number){return texture(24,27,c=>{const d=enemies[kind],col=hex(d.color),walk=[0,2,0,-2][frame],bob=frame%2;oval(c,12,23,9,3,'#293c30');c.save();c.translate(0,bob);if(dir===2){c.translate(24,0);c.scale(-1,1)}
 if(kind==='wolf'){r(c,4,12,14,8,'#4a4c57');r(c,5,11,12,6,col);r(c,17,9,5,7,col);r(c,20,13,4,3,'#5e5d65');r(c,17,7,2,4,'#555863');r(c,18,11,1,1,'#ffb861');r(c,5,18,3,5+walk,'#373c45');r(c,15,18,3,5-walk,'#373c45');r(c,1,9,4,3,'#727584')}
 else if(kind==='wraith'){poly(c,[[4,10],[7,5],[16,4],[20,10],[20,22],[15,19],[11,23],[7,19],[4,22]],'#426f7b');poly(c,[[7,9],[12,3],[17,8],[18,20],[12,17],[8,21]],col);r(c,9,8,7,6,'#263f4b');r(c,10,10,2,2,'#dcffff');r(c,14,10,2,2,'#dcffff')}
 else{const sk=kind==='skeleton',boss=kind==='boss';r(c,7,18,4,6+walk,'#343b3b');r(c,13,18,4,6-walk,'#343b3b');r(c,5,10,14,10,'#303b3c');r(c,7,10,10,9,sk?'#b9aa91':boss?'#777f78':'#6e5147');r(c,7,3,10,8,'#333e3d');r(c,8,3,8,7,col);r(c,9,5,6,3,sk?'#4b4a45':'#59633f');r(c,dir===1?8:10,6,2,1,'#ffdb9c');r(c,14,6,2,1,'#ffdb9c');r(c,4,11,4,7,col);r(c,16,11,4,7,col);r(c,8,17,8,2,'#a99a70');if(sk){for(let j=0;j<3;j++)r(c,8,11+j*2,8,1,'#eee0c0')}else{r(c,9,11,6,4,boss?'#b2b4a4':'#96906f');r(c,12,12,2,3,'#484846')}
 if(kind==='goblin'){r(c,5,5,3,3,col);r(c,16,5,3,3,col)}if(kind==='orc'||boss){r(c,4,10,5,4,'#91978d');r(c,15,10,5,4,'#91978d');r(c,19,8,2,13,'#d1c5ac');r(c,17,16,6,2,'#72553e')}if(kind==='shaman'){r(c,3,6,2,17,'#b38c5c');r(c,1,3,6,5,'#d6a5ff');r(c,6,2,12,3,'#795a9a')}if(boss){r(c,7,1,10,2,'#dfb76e');r(c,7,0,2,3,'#e4c47a');r(c,15,0,2,3,'#e4c47a')}}
 c.restore()})}
export class View{
 app=new Application(); layer=new Container(); objects=new Container(); fx=new Graphics(); marker=new Graphics(); towerArt=new Map<string,Texture>(); enemyArt=new Map<string,Texture>(); sprites=new Map<number,Sprite>();
 async init(host:HTMLElement){await this.app.init({width:WIDTH,height:HEIGHT,background:0x263b2a,antialias:false,preference:'webgl',resolution:1});host.appendChild(this.app.canvas);this.app.canvas.setAttribute('aria-label','Поле сражения');const bg=new Sprite(terrain());bg.width=WIDTH;bg.height=HEIGHT;this.app.stage.addChild(bg,this.marker,this.layer,this.fx);this.layer.sortableChildren=true;for(const kind of Object.keys(towers) as TowerKind[])for(let l=1;l<=3;l++)this.towerArt.set(kind+l,towerTexture(kind,l));for(const kind of Object.keys(enemies) as EnemyKind[])for(let f=0;f<4;f++)for(let d=0;d<4;d++)this.enemyArt.set(kind+f+d,enemyTexture(kind,f,d))}
 sprite(id:number,tex:Texture,x:number,y:number,scale:number){let sp=this.sprites.get(id);if(!sp){sp=new Sprite(tex);sp.anchor.set(.5,.82);this.layer.addChild(sp);this.sprites.set(id,sp)}sp.texture=tex;sp.position.set(Math.round(x),Math.round(y));sp.scale.set(scale);sp.zIndex=y;sp.alpha=1;return sp}
 render(s:State,selected:Tower|undefined,kind:TowerKind|undefined,hover:Point|undefined){const alive=new Set<number>();this.fx.clear();this.marker.clear();
 for(const t of s.towers){alive.add(t.id);this.sprite(t.id,this.towerArt.get(t.kind+t.level)!,t.x,t.y,1.8);const a=t.angle,x=t.x+Math.cos(a)*13,y=t.y-17+Math.sin(a)*9;this.fx.moveTo(t.x,t.y-17).lineTo(x,y).stroke({color:towers[t.kind].color,width:3});for(let j=0;j<t.level;j++)this.fx.rect(t.x-8+j*6,t.y+9,4,3).fill(0xe6c77d)}
 for(const e of s.enemies){alive.add(e.id);const f=Math.floor(s.time*9+e.id)%4,d=Math.abs(Math.cos(e.angle))>.5?(Math.cos(e.angle)>0?0:2):(Math.sin(e.angle)>0?1:3);const sp=this.sprite(e.id,this.enemyArt.get(e.kind+f+d)!,e.x,e.y,e.kind==='boss'?3.2:1.45);sp.tint=e.hit>0?0xffc7b8:e.slow>0?0x9bdcff:e.poison>0?0xb2e78b:0xffffff;const w=e.kind==='boss'?55:29,yy=e.y-(e.kind==='boss'?65:33);this.fx.rect(e.x-w/2,yy,w,4).fill(0x302d2d).rect(e.x-w/2,yy,w*Math.max(0,e.hp/e.maxHp),3).fill(e.kind==='boss'?0xe6a449:0x9fce70)}
 for(const [id,sp] of this.sprites)if(!alive.has(id)){sp.destroy();this.sprites.delete(id)}
 if(selected){this.marker.circle(selected.x,selected.y,stats(selected).range).fill({color:0xe9d49b,alpha:.09}).stroke({color:0xe6d2a0,width:1,alpha:.8});this.marker.circle(selected.x,selected.y,24).stroke({color:0xffda86,width:2})}
 if(kind&&hover){const ok=canBuild(s,hover,kind),color=ok?0x9bdf87:0xff7171;this.marker.circle(hover.x,hover.y,towers[kind].range).fill({color,alpha:.06}).stroke({color,alpha:.65,width:1}).circle(hover.x,hover.y,22).stroke({color,width:2})}
 for(const a of s.shots){const f=1-a.life/a.max,x=a.x+(a.tx-a.x)*f,y=a.y+(a.ty-a.y)*f,col=towers[a.kind].color;if(a.kind==='mage'||a.kind==='frost'){this.fx.moveTo(a.x,a.y).lineTo(a.tx,a.ty).stroke({color:col,width:3,alpha:a.life/a.max}).circle(a.tx,a.ty,7*f).stroke({color:col,width:2,alpha:a.life/a.max})}else{this.fx.circle(x,y,a.kind==='bomb'?5:2).fill(col);this.fx.moveTo(x,y).lineTo(x-(a.tx-a.x)*.1,y-(a.ty-a.y)*.1).stroke({color:col,width:2,alpha:.65})}}
 for(const e of s.effects){const f=1-e.life/e.max,alpha=1-f;this.fx.circle(e.x,e.y-5,5+f*(e.kind==='build'?27:e.kind==='hit'?17:24)).stroke({color:e.color,width:2,alpha});for(let i=0;i<6;i++){const a=i*Math.PI/3+e.x;this.fx.rect(e.x+Math.cos(a)*f*23,e.y-6+Math.sin(a)*f*23,3,3).fill({color:e.color,alpha})}}
 }
}
