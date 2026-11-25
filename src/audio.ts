import {SoundtrackPlayer} from './soundtrack-player.ts';
import type {TrackId} from './soundtrack.ts';
import type {Signal} from './game.ts';
export class AudioEngine{
 ctx?:AudioContext;private soundtrack=new SoundtrackPlayer();effectsVolume=.35;private last=0;
 get musicVolume(){return this.soundtrack.volume}
 set musicVolume(v:number){this.soundtrack.volume=v}
 async activate(){this.soundtrack.activate();try{this.ctx??=new AudioContext();if(this.ctx.state==='suspended')await this.ctx.resume()}catch{/* audio unavailable */}}
 tick(id:TrackId,dt:number){this.soundtrack.tick(id,dt)}
 noise(duration:number,volume:number,cutoff:number){const c=this.ctx;if(!c||c.state!=='running')return;const b=c.createBuffer(1,Math.floor(c.sampleRate*duration),c.sampleRate),data=b.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const source=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain();source.buffer=b;filter.type='lowpass';filter.frequency.value=cutoff;g.gain.value=volume*this.effectsVolume;source.connect(filter);filter.connect(g);g.connect(c.destination);source.start()}
 tone(freq:number,duration:number,volume:number,type:OscillatorType='square',when?:number,end?:number){const c=this.ctx;if(!c||c.state!=='running')return;const at=when??c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,at);if(end)o.frequency.exponentialRampToValueAtTime(end,at+duration);g.gain.setValueAtTime(Math.max(.0001,volume*this.effectsVolume),at);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);g.connect(c.destination);o.start(at);o.stop(at+duration+.01)}
 play(s:Signal){if(this.effectsVolume<=0||!this.ctx)return;const now=this.ctx.currentTime;if(now-this.last<.045&&['shoot','magic','death','boom'].includes(s))return;this.last=now;const f:Record<Signal,[number,number,number]>={shoot:[720,180,.07],magic:[400,1050,.13],boom:[130,42,.22],death:[280,70,.13],build:[440,880,.15],upgrade:[550,1300,.2],wave:[220,440,.25],leak:[180,80,.3],win:[440,880,.45],lose:[220,55,.5]};const [a,b,d]=f[s];this.tone(a,d,.16,s==='boom'?'sawtooth':'square',undefined,b);if(s==='boom')this.noise(.3,.27,1000);if(s==='shoot')this.noise(.05,.075,2600);if(s==='win'||s==='lose'){const notes=s==='win'?[0,4,7,12]:[0,-3,-7,-12];notes.forEach((n,i)=>this.tone(440*2**(n/12),.38,.11,'triangle',now+i*.13))}}
}
