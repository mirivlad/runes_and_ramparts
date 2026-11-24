import {WIDTH,HEIGHT,towers} from './content.ts';
import type {Effect,Shot} from './game.ts';
export type VisualQuality='full'|'reduced';
export const effectDuration=(e:Effect)=>e.kind==='meteor'?1.35:e.kind==='death'?.66:e.kind==='boss'?.95:e.kind==='freeze'?.7:e.kind==='guard'?1.45:e.kind==='hit'&&e.color===towers.bomb.color&&e.max>.4?.72:Math.max(.16,e.max*.8);
export const impactPower=(e:Effect)=>e.kind==='meteor'?8:e.kind==='boss'?4:e.kind==='hit'&&e.color===towers.bomb.color&&e.max>.4?2.7:e.kind==='leak'?2.5:0;
export function cameraTransform(time:number,trauma:number,quality:VisualQuality){const strength=quality==='full'?Math.min(8,Math.max(0,trauma)):0;const scale=strength>0?1+strength*.004:1;return {scale,x:(WIDTH-WIDTH*scale)/2+Math.sin(time*71)*strength,y:(HEIGHT-HEIGHT*scale)/2+Math.cos(time*83)*strength}}
export function unproject(p:{x:number,y:number},c:{x:number,y:number,scale:number}){return{x:(p.x-c.x)/c.scale,y:(p.y-c.y)/c.scale}}
export class Presentation{
 effects:Effect[]=[];shots:Shot[]=[];private seenEffects=new WeakSet<Effect>();private seenShots=new WeakSet<Shot>();time=0;trauma=0;flash=0;
 reset(){this.effects=[];this.shots=[];this.seenEffects=new WeakSet();this.seenShots=new WeakSet();this.time=0;this.trauma=0;this.flash=0}
 update(effects:Effect[],shots:Shot[],dt:number,paused=false){
  if(paused)return;dt=Math.min(.1,Math.max(0,dt));this.time+=dt;this.trauma=Math.max(0,this.trauma-dt*16);this.flash=Math.max(0,this.flash-dt*2.8);
  this.effects=this.effects.filter(e=>(e.life-=dt)>0);this.shots=this.shots.filter(e=>(e.life-=dt)>0);
  this.capture(effects,shots);
  for(const e of this.effects)if(e.kind==='meteor'&&e.life/e.max<=.55&&(e.life+dt)/e.max>.55){this.trauma=8;this.flash=.22}
 }
 capture(effects:Effect[],shots:Shot[]){
  for(const e of effects)if(!this.seenEffects.has(e)){this.seenEffects.add(e);const life=effectDuration(e);this.effects.push({...e,life,max:life});const p=impactPower(e);if(e.kind!=='meteor'){this.trauma=Math.min(8,Math.max(this.trauma,p));if(p>=4)this.flash=Math.max(this.flash,.1)}}
  for(const a of shots)if(!this.seenShots.has(a)){this.seenShots.add(a);const life=a.kind==='bomb'?.22:a.kind==='lightning'||a.kind==='mage'?.23:Math.max(.10,a.max*.75);this.shots.push({...a,life,max:life})}
  if(this.effects.length>420)this.effects=this.effects.slice(-420);if(this.shots.length>180)this.shots=this.shots.slice(-180);
 }
}
