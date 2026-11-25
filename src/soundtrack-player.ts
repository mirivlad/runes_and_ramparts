import {soundtrack,type TrackId} from './soundtrack.ts';
type Channel={id:TrackId,element:HTMLAudioElement,weight:number,ready:boolean,starting:boolean};
export class SoundtrackPlayer{
 private channels:Channel[]=[];private target:TrackId='menu';private unlocked=false;private failed=new Set<TrackId>();
 volume=.35;
 private make(id:TrackId):Channel{
  const element=new Audio();element.preload='auto';element.loop=true;element.src=import.meta.env.BASE_URL+'music/'+id+'.mp3';element.volume=0;
  const c:Channel={id,element,weight:0,ready:false,starting:false};this.channels.push(c);return c
 }
 private dispose(c:Channel){c.element.pause();c.element.removeAttribute('src');c.element.load();this.channels=this.channels.filter(a=>a!==c)}
 private start(c:Channel){if(c.starting||c.ready&&!c.element.paused)return;c.starting=true;
  void c.element.play().then(()=>{c.ready=true;c.starting=false}).catch((e:unknown)=>{c.starting=false;c.ready=false;if(!this.channels.includes(c))return;if(e instanceof DOMException&&e.name==='AbortError')return;if(e instanceof DOMException&&e.name==='NotAllowedError'){this.unlocked=false;return}if(this.channels.includes(c)){this.failed.add(c.id);this.dispose(c);console.warn('Soundtrack unavailable:',c.id,e)}})
 }
 activate(){this.unlocked=true;if(this.volume>0){const c=this.channels.find(c=>c.id===this.target)??(!this.failed.has(this.target)?this.make(this.target):undefined);if(c)this.start(c)}}
 tick(id:TrackId,dt:number){
  if(id!==this.target){this.target=id;this.failed.delete(id)}
  if(!this.unlocked)return;
  if(this.volume<=0){for(const c of this.channels){c.element.volume=0;c.element.pause()}return}
  let incoming=this.channels.find(c=>c.id===id);
  if(!incoming&&!this.failed.has(id)){
   for(const c of [...this.channels])if(!c.ready)this.dispose(c);
   if(this.channels.length>=2){const oldest=[...this.channels].sort((a,b)=>a.weight-b.weight)[0];this.dispose(oldest)}
   incoming=this.make(id);
  }
  if(incoming)this.start(incoming);
  const fade=Math.min(.1,Math.max(0,dt))/1.25;
  for(const c of [...this.channels]){
   if(c===incoming&&c.ready)c.weight=Math.min(1,c.weight+fade);
   else if(c!==incoming&&incoming?.ready)c.weight=Math.max(0,c.weight-fade);
   else if(c!==incoming&&!incoming)c.weight=Math.max(0,c.weight-fade);
   if(c!==incoming&&c.weight===0&&incoming?.ready){this.dispose(c);continue}
   if(c.ready&&c.element.paused)this.start(c);
   c.element.volume=Math.max(0,Math.min(1,this.volume*c.weight*soundtrack[c.id].gain));
  }
 }
}
