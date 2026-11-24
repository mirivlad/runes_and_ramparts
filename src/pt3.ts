import {formatOf} from './ay-format.ts';
export class PT3Music{
 private worker?:Worker;private gain:GainNode;private next=0;private started=0;private pending=false;private ready=false;private ended=false;private timer?:number;private nodes=new Set<AudioBufferSourceNode>();active=false;paused=false;loading=false;
 readonly analyser:AnalyserNode;private spectrum=new Uint8Array(128);private muted=false;
 constructor(private ctx:AudioContext,private status:(s:string)=>void,private complete:()=>void=()=>{},private failure:()=>void=()=>{}){this.gain=ctx.createGain();this.analyser=ctx.createAnalyser();this.analyser.fftSize=256;this.analyser.smoothingTimeConstant=.65;this.gain.connect(this.analyser);this.analyser.connect(ctx.destination);this.gain.gain.value=0}
 async load(file:File){this.stop();const format=formatOf(file.name);if(!format||file.size<16||file.size>65536){this.status('Неподдерживаемый музыкальный файл.');this.failure();return}
  const w=new Worker(new URL('./pt3-worker.ts',import.meta.url),{type:'module'});this.worker=w;this.active=true;this.loading=true;this.status('Загрузка '+file.name+'…');
  w.onerror=()=>this.fail('Ошибка проигрывателя AY.');w.onmessage=({data})=>{if(this.worker!==w)return;this.clearTimer();this.pending=false;if(data.type==='error'){this.fail(data.message);return}if(data.type==='ready'){this.ready=true;this.loading=false;this.status(format.toUpperCase()+': '+file.name);return}
   if(data.type==='chunk'){const samples:Float32Array=data.samples,n=samples.length/2;if(n){const buffer=this.ctx.createBuffer(2,n,this.ctx.sampleRate);for(let c=0;c<2;c++){const channel=buffer.getChannelData(c);for(let i=0;i<n;i++)channel[i]=Math.max(-1,Math.min(1,samples[i*2+c]))}const source=this.ctx.createBufferSource();source.buffer=buffer;source.connect(this.gain);this.next=Math.max(this.next,this.ctx.currentTime+.045);if(!this.started)this.started=this.next;source.start(this.next);this.next+=buffer.duration;this.nodes.add(source);source.onended=()=>{this.nodes.delete(source);source.disconnect()}}this.ended=!!data.ended}
  };
  try{const bytes=await file.arrayBuffer();if(this.worker!==w)return;this.watch();w.postMessage({type:'init',file:bytes,format:format==='pt2'?2:format==='pt3'?3:4,rate:this.ctx.sampleRate,wasmUrl:new URL(import.meta.env.BASE_URL+'audio/'+(format==='pt3'?'pt3':'ayfly')+'.wasm',document.baseURI).href},[bytes])}catch{if(this.worker===w)this.fail('Не удалось открыть музыкальный файл.')}
 }
 private watch(){this.clearTimer();this.timer=window.setTimeout(()=>this.fail('Декодер не ответил: возможно, файл повреждён.'),5000)}
 private clearTimer(){if(this.timer!==undefined)window.clearTimeout(this.timer);this.timer=undefined}
 private fail(s:string){this.stop();this.status(s);this.failure()}
 get seconds(){return this.started?Math.max(0,Math.min(this.next,this.ctx.currentTime)-this.started):0}
 get levels(){this.analyser.getByteFrequencyData(this.spectrum);return this.spectrum}
 setPaused(value:boolean){this.paused=value;this.syncContext()}
 private syncContext(){const suspended=this.paused||this.muted;if(suspended&&this.ctx.state==='running')void this.ctx.suspend().catch(()=>{});else if(!suspended&&this.ctx.state==='suspended')void this.ctx.resume().catch(()=>{})}
 tick(enabled:boolean,volume:number){if(this.muted===enabled){this.muted=!enabled;this.syncContext()}this.gain.gain.value=enabled?volume:0;if(!this.active||!enabled||this.paused||this.ctx.state!=='running')return;
  if(this.ended&&this.ctx.currentTime>=this.next){this.stop();this.complete();return}
  if(this.ready&&!this.ended&&!this.pending&&this.worker&&this.next-this.ctx.currentTime<.65){this.pending=true;this.watch();this.worker.postMessage({type:'chunk'})}
 }
 stop(){this.worker?.terminate();this.worker=undefined;this.clearTimer();this.ready=false;this.pending=false;this.active=false;this.paused=false;this.muted=false;this.loading=false;this.ended=false;this.next=0;this.started=0;for(const n of this.nodes){try{n.stop()}catch{}n.disconnect()}this.nodes.clear()}
 dispose(){this.stop();this.gain.disconnect();this.analyser.disconnect()}
}
