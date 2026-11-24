import type {AudioEngine} from './audio.ts';
import {formatOf} from './ay-format.ts';
import {MAX_TRACKS,nextTrack,loadPlaylist,savePlaylist,type PlaylistData,type PlaylistMode} from './playlist.ts';
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const button=(id:string)=>el<HTMLButtonElement>(id);
const time=(s:number)=>Math.floor(s/60).toString().padStart(2,'0')+':'+Math.floor(s%60).toString().padStart(2,'0');
export class PlayerUI{
 data:PlaylistData={files:[],index:0,mode:'sequence',volume:.35};
 private bag:number[]=[];private history:number[]=[];private failed=new Set<number>();private token=0;private writing=Promise.resolve();private loaded=false;private busy=false;private status='Встроенный саундтрек';private lastDraw=0;private selected=0;
 constructor(private audio:AudioEngine){}
 async init(){
  const modal=el<HTMLDialogElement>('playerDialog'),input=el<HTMLInputElement>('trackerFiles');
  button('player').onclick=()=>{if(modal.open)modal.close();else{modal.show();this.draw()}};
  button('playerHide').onclick=()=>modal.close();modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();modal.close()}});
  button('playerAdd').onclick=()=>input.click();
  input.onchange=()=>{this.add(Array.from(input.files??[]));input.value=''};
  modal.ondragover=e=>{e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy'};
  modal.ondrop=e=>{e.preventDefault();this.add(Array.from(e.dataTransfer?.files??[]))};
  button('playerPlay').onclick=()=>{if(this.audio.pt3?.active&&this.audio.pt3.paused&&this.selected===this.data.index){this.audio.pt3.setPaused(false);this.status='Воспроизведение';this.draw()}else if(!this.audio.pt3?.active||this.selected!==this.data.index){this.failed.clear();this.play(this.selected)}};
  button('playerPause').onclick=()=>{if(this.audio.pt3?.active){const p=!this.audio.pt3.paused;this.audio.pt3.setPaused(p);this.status=p?'Пауза':'Воспроизведение';this.draw()}};
  button('playerStop').onclick=()=>{++this.token;this.audio.stopTracker();this.status='Остановлено';this.draw()};
  button('playerNext').onclick=()=>{this.failed.clear();this.advance()};
  button('playerPrev').onclick=()=>{this.failed.clear();if(this.audio.pt3?.seconds&&this.audio.pt3.seconds>3)this.play(this.data.index,false);else this.play(this.history.pop()??(this.data.index-1+this.data.files.length)%this.data.files.length,false)};
  button('playerRemove').onclick=()=>this.remove();
  button('playerClear').onclick=()=>{++this.token;this.audio.original();this.data.files=[];this.data.index=0;this.selected=0;this.bag=[];this.history=[];this.failed.clear();this.status='Встроенный саундтрек';this.draw();this.persist()};
  button('playerOriginal').onclick=()=>{++this.token;this.audio.original();this.status='Встроенный саундтрек';this.draw()};
  const mode=el<HTMLSelectElement>('playerMode');mode.onchange=()=>{this.data.mode=mode.value as PlaylistMode;this.bag=[];this.draw();this.persist()};
  const volume=el<HTMLInputElement>('playerVolume');volume.oninput=()=>{this.data.volume=Number(volume.value)/100;this.audio.trackerVolume=this.data.volume;this.persist()};
  const stored=await loadPlaylist();if(stored&&!this.busy){this.data=stored;this.data.index=Math.max(0,Math.min(stored.files.length-1,stored.index));this.selected=this.data.index;this.status=stored.files.length?'Плейлист восстановлен — нажмите Play':'Встроенный саундтрек'}
  this.loaded=true;this.audio.trackerVolume=this.data.volume;this.draw();if(this.busy)this.persist()
 }
 private persist(){if(!this.loaded){this.busy=true;return}const snapshot={...this.data,files:[...this.data.files]};this.writing=this.writing.then(async()=>{const ok=await savePlaylist(snapshot);el('playerStorage').textContent=ok?'Сохранено в браузере':'Хранилище недоступно — файлы до перезагрузки'})}
 add(files:File[]){this.busy=true;const before=this.data.files.length;const existing=new Set(this.data.files.map(f=>f.name+'|'+f.size+'|'+f.lastModified));let rejected=0;for(const f of files){const key=f.name+'|'+f.size+'|'+f.lastModified;if(!formatOf(f.name)||f.size<16||f.size>65536||this.data.files.length>=MAX_TRACKS){rejected++;continue}if(existing.has(key))continue;existing.add(key);this.data.files.push(f)}
  this.bag=[];this.failed.clear();if(this.data.files.length>before){this.status='Добавлено: '+(this.data.files.length-before)+(rejected?' · пропущено: '+rejected:'');if(!before){this.selected=0;this.play(0)}}else if(rejected)this.status='Нет подходящих файлов (PT2, PT3, STP до 64 КБ)';
  this.draw();this.persist()
 }
 private play(index:number,remember=true){if(!Number.isInteger(index)||index<0||index>=this.data.files.length)return;const old=this.data.index;if(remember&&old!==index)this.history.push(old);if(this.history.length>500)this.history.shift();this.data.index=index;this.selected=index;this.bag=this.bag.filter(i=>i!==index);const token=++this.token;this.status='Загрузка…';this.draw();this.persist();
  if(!this.audio.music){this.audio.music=true;el<HTMLInputElement>('music').checked=true;el<HTMLInputElement>('music').dispatchEvent(new Event('change'))}
  void this.audio.loadPT3(this.data.files[index],s=>{if(token===this.token){this.status=s;this.draw()}},()=>{if(token===this.token){this.failed.clear();this.advance()}},()=>{if(token===this.token){this.failed.add(this.data.index);if(this.failed.size<this.data.files.length)this.advance();else{this.status='Не удалось воспроизвести файлы';this.draw()}}})
 }
 private advance(){if(!this.data.files.length)return;let index=this.data.index;for(let i=0;i<this.data.files.length;i++){const next=nextTrack(index,this.data.files.length,this.data.mode,this.bag);this.bag=next.remaining;index=next.index;if(!this.failed.has(index)){this.play(index);return}}this.status='Нет доступных треков';this.draw()}
 private remove(){if(!this.data.files.length)return;const index=this.selected,active=this.audio.external&&index===this.data.index;this.data.files.splice(index,1);this.bag=[];this.history=[];this.failed.clear();if(!this.data.files.length){++this.token;this.audio.original();this.data.index=0;this.selected=0;this.status='Встроенный саундтрек'}else{if(index<this.data.index)this.data.index--;this.selected=Math.min(index,this.data.files.length-1);if(active)this.play(this.selected,false);else this.data.index=Math.min(this.data.index,this.data.files.length-1)}this.draw();this.persist()}
 draw(){const files=this.data.files;const list=el('playerList'),scroll=list.scrollTop;list.replaceChildren();files.forEach((f,i)=>{const b=document.createElement('button');b.type='button';b.className='tracker-row'+(i===this.selected?' selected':'')+(this.audio.external&&i===this.data.index?' current':'');b.textContent=(i+1).toString().padStart(2,'0')+'  '+f.name;b.title=f.name;b.onclick=()=>{this.selected=i;for(const [j,r] of Array.from(list.children).entries())r.classList.toggle('selected',j===i)};b.ondblclick=()=>{this.failed.clear();this.play(i)};list.append(b)});list.scrollTop=scroll;if(!files.length)list.textContent='Перетащите PT2 / PT3 / STP сюда или нажмите ADD';
  el('playerTitle').textContent=this.audio.external?files[this.data.index]?.name??'—':'R&R / original soundtrack';el('playerStatus').textContent=this.status;el('playerCount').textContent=files.length+' / '+MAX_TRACKS;
  el<HTMLSelectElement>('playerMode').value=this.data.mode;el<HTMLInputElement>('playerVolume').value=String(Math.round(this.data.volume*100));for(const id of ['playerPlay','playerPrev','playerNext','playerRemove','playerClear'])button(id).disabled=!files.length;button('playerPause').disabled=!this.audio.pt3?.active;button('playerStop').disabled=!this.audio.external;button('player').textContent=this.audio.external&&this.audio.pt3?.active?'♫ Плеер':'♫ Музыка';
 }
 tick(now:number){if(now-this.lastDraw<100)return;this.lastDraw=now;const p=this.audio.pt3;el('playerTime').textContent=time(p?.seconds??0);if(!el<HTMLDialogElement>('playerDialog').open)return;const canvas=el<HTMLCanvasElement>('playerSpectrum'),c=canvas.getContext('2d');if(!c)return;c.fillStyle='#101b15';c.fillRect(0,0,canvas.width,canvas.height);const bins=p?.active&&!p.paused?p.levels:undefined;for(let i=0;i<24;i++){const h=bins?Math.max(2,Math.round(bins[i*3]/255*canvas.height)):2;for(let y=0;y<h;y+=4){c.fillStyle=y>canvas.height*.7?'#f2b94e':y>canvas.height*.45?'#b6dd70':'#58b985';c.fillRect(i*5,canvas.height-y-3,4,3)}}}
}
