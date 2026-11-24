import {PT3Music} from './pt3.ts';
import {score,row,type TrackId} from './music.ts';
import type {Signal} from './game.ts';
export class AudioEngine{
 ctx?:AudioContext; pt3?:PT3Music; music=true; effects=true; volume=.35; private next=0;private beat=0;private last=0; track:TrackId='menu'; private musicBus?:GainNode;private musicNodes=new Set<OscillatorNode|AudioBufferSourceNode>();private drumBuffer?:AudioBuffer;private pulse?:PeriodicWave;
 async activate(){try{this.ctx??=new AudioContext();if(!this.musicBus){this.musicBus=this.ctx.createGain();this.musicBus.connect(this.ctx.destination);this.pulse=this.ctx.createPeriodicWave(new Float32Array(17),Float32Array.from({length:17},(_,i)=>i?2*Math.sin(i*Math.PI*.25)/(i*Math.PI):0));this.drumBuffer=this.ctx.createBuffer(1,Math.floor(this.ctx.sampleRate*.18),this.ctx.sampleRate);const d=this.drumBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length)**2}if(this.ctx.state==='suspended')await this.ctx.resume()}catch{/* audio unavailable */}}
 async loadPT3(file:File,status:(s:string)=>void){await this.activate();if(!this.ctx){status('Web Audio недоступен.');return}this.pt3?.stop();this.pt3=new PT3Music(this.ctx,status);await this.pt3.load(file)}
 original(){this.pt3?.stop();this.pt3=undefined}
 noise(duration:number,volume:number,cutoff:number){const c=this.ctx;if(!c||c.state!=='running')return;const b=c.createBuffer(1,Math.floor(c.sampleRate*duration),c.sampleRate),data=b.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const source=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain();source.buffer=b;filter.type='lowpass';filter.frequency.value=cutoff;g.gain.value=volume*this.volume;source.connect(filter);filter.connect(g);g.connect(c.destination);source.start()}
 tone(freq:number,duration:number,volume:number,type:OscillatorType='square',when?:number,end?:number){const c=this.ctx;if(!c||c.state!=='running')return;const at=when??c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,at);if(end)o.frequency.exponentialRampToValueAtTime(end,at+duration);g.gain.setValueAtTime(Math.max(.0001,volume*this.volume),at);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);g.connect(c.destination);o.start(at);o.stop(at+duration+.01)}
 play(s:Signal){if(!this.effects||!this.ctx)return;const now=this.ctx.currentTime;if(now-this.last<.045&&['shoot','magic','death','boom'].includes(s))return;this.last=now;const f:Record<Signal,[number,number,number]>={shoot:[720,180,.07],magic:[400,1050,.13],boom:[130,42,.22],death:[280,70,.13],build:[440,880,.15],upgrade:[550,1300,.2],wave:[220,440,.25],leak:[180,80,.3],win:[440,880,.45],lose:[220,55,.5]};const [a,b,d]=f[s];this.tone(a,d,.16,s==='boom'?'sawtooth':'square',undefined,b);if(s==='boom')this.noise(.3,.27,1000);if(s==='shoot')this.noise(.05,.075,2600);if(s==='win'||s==='lose'){const notes=s==='win'?[0,4,7,12]:[0,-3,-7,-12];notes.forEach((n,i)=>this.tone(440*2**(n/12),.38,.11,'triangle',now+i*.13))}}
 private clearMusic(){for(const n of this.musicNodes){try{n.stop()}catch{}n.disconnect()}this.musicNodes.clear();this.next=0}
 private musicNote(midi:number,duration:number,volume:number,voice:'lead'|'bass'|'arp'|'drum',at:number){
  const c=this.ctx,bus=this.musicBus;if(!c||!bus)return;const g=c.createGain();g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(volume,at+.006);g.gain.exponentialRampToValueAtTime(.0001,at+Math.max(.025,duration));g.connect(bus);
  const frequency=440*2**((midi-69)/12);
  let node:OscillatorNode|AudioBufferSourceNode;
  if(voice==='drum'&&midi!==35&&this.drumBuffer){const n=c.createBufferSource();n.buffer=this.drumBuffer;n.playbackRate.value=midi===65?2.7:1.1;const f=c.createBiquadFilter();f.type='highpass';f.frequency.value=midi===65?4500:1100;n.connect(f);f.connect(g);node=n;n.onended=()=>{this.musicNodes.delete(n);n.disconnect();f.disconnect();g.disconnect()}}
  else{const o=c.createOscillator();if(voice==='lead'&&this.pulse)o.setPeriodicWave(this.pulse);else o.type=voice==='bass'||voice==='drum'?'triangle':'square';o.frequency.setValueAtTime(voice==='drum'?115:frequency,at);if(voice==='drum')o.frequency.exponentialRampToValueAtTime(42,at+duration);o.connect(g);node=o;o.onended=()=>{this.musicNodes.delete(o);o.disconnect();g.disconnect()}}
  node.start(at);node.stop(at+duration+.02);this.musicNodes.add(node)
 }
 tick(id:TrackId){this.pt3?.tick(this.music,this.volume);const c=this.ctx;if(!c||!this.musicBus||c.state!=='running')return;
  this.musicBus.gain.value=this.music&&!this.pt3?.active?this.volume:0;
  if(!this.music||this.pt3?.active){if(this.next)this.clearMusic();return}
  if(id!==this.track){this.clearMusic();this.beat=0;this.track=id}
  if(this.next<c.currentTime)this.next=c.currentTime+.04;
  const interval=60/score[id].bpm/4;
  while(this.next<c.currentTime+.14){for(const n of row(id,this.beat++ /* incremented once per row */))this.musicNote(n.midi,interval*n.beats,n.volume,n.voice,this.next);this.next+=interval}
 }
}
