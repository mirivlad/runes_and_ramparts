import './style.css';
import {WIDTH,HEIGHT,MAX_LEVEL,specializations,towers,enemies,waves,type TowerKind,type Point} from './content.ts';
import {fresh,build,upgrade,sell,start,step,stats,upgradeCost,type Tower,type State} from './game.ts';
import {View,towerKey} from './art.ts';
import {AudioEngine} from './audio.ts';
import {load,save,validProfile,type Profile} from './storage.ts';
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const btn=(id:string)=>el<HTMLButtonElement>(id);
const audio=new AudioEngine(),view=new View();
let profile:Profile={battle:fresh(),records:[],recorded:false};
let state:State=profile.battle,kind:TowerKind|undefined,selection:number|undefined,hover:Point|undefined,paused=false,speed=1;
let uiKey='',intelKey='',lastSave=0;
function message(s:string){el('message').textContent=s}
function selected(){return state.towers.find(t=>t.id===selection)}
function setState(p:Profile){profile=p;state=p.battle;selection=undefined;kind=undefined;paused=state.phase==='battle';uiKey='';intelKey='';update()}
async function persist(show=false){const ok=await save(profile);if(show)message(ok?'Сражение и рейтинг сохранены.':'Не удалось сохранить. Используйте экспорт.')}
function record(){if(!profile.recorded&&(state.phase==='won'||state.phase==='lost')){profile.recorded=true;profile.records.push({score:state.score,wave:state.wave,lives:state.lives,won:state.phase==='won',date:new Date().toISOString()});profile.records.sort((a,b)=>b.score-a.score);profile.records=profile.records.slice(0,10);void persist();uiKey=''}}
function selectKind(k:TowerKind){if(state.phase==='won'||state.phase==='lost')return;kind=kind===k?undefined:k;selection=undefined;message(kind?'Выберите место: зелёный круг — можно строить, красный — нельзя.':'Строительство отменено.');update()}
function chooseWave(){if(start(state)){paused=false;audio.play('wave');message('Волна '+state.wave+' началась.');void persist();update()}}
function stat(name:string,value:string){const row=document.createElement('div');row.className='stat';const a=document.createElement('span'),b=document.createElement('b');a.textContent=name;b.textContent=value;row.append(a,b);return row}
function paragraph(s:string,cls=''){const p=document.createElement('p');p.textContent=s;p.className=cls;return p}
function action(s:string,fn:()=>void,disabled=false){const b=document.createElement('button');b.textContent=s;b.disabled=disabled;b.onclick=fn;return b}
function update(){el('gold').textContent=String(state.gold);el('lives').textContent=state.lives+' / 20';el('wave').textContent=state.wave+' / '+waves.length;el('score').textContent=String(state.score);btn('next').disabled=state.phase!=='ready';btn('next').textContent=state.phase==='won'?'Победа!':state.phase==='lost'?'Поражение':state.phase==='ready'?'Начать волну '+(state.wave+1):'Волна идёт';btn('pause').textContent=paused?'Продолжить':'Пауза';btn('speed').textContent='×'+speed;
 for(const b of Array.from(el('towerbar').children) as HTMLButtonElement[]){const k=b.dataset.kind as TowerKind;b.classList.toggle('active',kind===k);b.classList.toggle('unaffordable',state.gold<towers[k].cost);b.disabled=state.phase==='won'||state.phase==='lost'}
 const t=selected(),key=[state.phase,state.wave,state.gold,kind,selection,t?.level,t?.priority,profile.records.length].join('|');if(key!==uiKey){uiKey=key;
 const d=el('details');d.replaceChildren();const title=el('panelTitle');
 if(state.phase==='won'||state.phase==='lost'){title.textContent='Итоги сражения';d.append(paragraph(state.phase==='won'?'Рубеж удержан!':'Крепость пала.','outcome'),stat('Очки',String(state.score)),stat('Волна',String(state.wave)),action('Начать заново',reset))}
 else if(t){const data=towers[t.kind],st=stats(t);title.textContent=data.name+' · '+t.level+'/'+MAX_LEVEL;
 const portrait=document.createElement('div');portrait.className='tower-portrait';const img=document.createElement('img');const tex=view.towerArt.get(towerKey(t.kind,t.level,t.branch))?.source.resource;if(tex instanceof HTMLCanvasElement)img.src=tex.toDataURL();img.alt='';const label=document.createElement('div');label.append(paragraph(t.branch>=0?data.branches[t.branch]:'Базовая башня'),paragraph('Уровень '+t.level+' из '+MAX_LEVEL,'tip'));portrait.append(img,label);d.append(portrait);
 const ranks=document.createElement('div');ranks.className='rank-progress';for(let i=1;i<=MAX_LEVEL;i++){const n=document.createElement('span');n.textContent=String(i);if(i<=t.level)n.className='unlocked';ranks.append(n)}d.append(ranks);
 d.append(paragraph(t.branch>=0?specializations[t.kind][t.branch]:data.desc),stat('Урон',st.damage.toFixed(0)),stat('Радиус',String(st.range)),stat('Атака/сек',(1/st.rate).toFixed(1)));
 const select=document.createElement('select');for(const [v,n] of [['first','Первый на пути'],['strong','Самый крепкий'],['near','Ближайший']]){const o=document.createElement('option');o.value=v;o.textContent=n;select.append(o)}select.value=t.priority;select.onchange=()=>{t.priority=select.value as Tower['priority'];void persist()};d.append(select);
 if(t.level<MAX_LEVEL){
 const options=t.level===2?[0,1]:[-1];
 for(const b of options){
 const future=stats({...t,level:t.level+1,branch:b<0?t.branch:b}),wrap=document.createElement('div');wrap.className='upgrade-card';
 const name=b<0?'Улучшить до '+(t.level+1)+' ур.':data.branches[b];
 wrap.append(action(name+' · '+upgradeCost(t)+' G',()=>{if(upgrade(state,t,b)){audio.play('upgrade');void persist();update()}},state.gold<upgradeCost(t)));
 if(b>=0)wrap.append(paragraph(specializations[t.kind][b],'tip'));
 const diff='Урон '+st.damage.toFixed(0)+' → '+future.damage.toFixed(0)+' · радиус '+st.range+' → '+future.range+' · атака/с '+(1/st.rate).toFixed(1)+' → '+(1/future.rate).toFixed(1);
 wrap.append(paragraph(diff,'upgrade-diff'));d.append(wrap);
 }
 }else d.append(paragraph('Максимальный уровень','outcome'));
 d.append(action('Продать · '+Math.floor(t.spent*.65)+' G',()=>{if(sell(state,t)){selection=undefined;audio.play('build');void persist();update()}}))}
 else if(kind){const data=towers[kind];title.textContent=data.name;d.append(paragraph(data.desc),stat('Стоимость',data.cost+' G'),stat('Урон',String(data.damage)),stat('Радиус',String(data.range)),paragraph('Кликните по свободной земле. ESC — отмена.','tip'))}
 else{title.textContent='Военный совет';d.append(paragraph('Защитите крепость от двенадцати волн. Стройте башни в любом свободном месте, комбинируйте магию и обычное оружие.'),paragraph('Выберите построенную башню для улучшения или продажи. Клавиши 1–6 — строительство, пробел — пауза.','tip'))}
 } const ik=[state.phase,state.wave,state.queue.length,state.enemies.length,profile.records.map(r=>r.score).join(',')].join('|');if(ik===intelKey)return;intelKey=ik;const f=el('forecast');f.replaceChildren();const i=state.phase==='battle'?state.wave-1:state.wave;if(i<waves.length&&state.phase!=='lost'){f.append(paragraph(state.phase==='battle'?'В бою: '+state.enemies.length+' · в резерве: '+state.queue.length:'Волна '+(i+1)));for(const [k,n] of waves[i]){const a=stat(enemies[k].name,'×'+n);if(k==='boss')a.classList.add('boss');f.append(a)}}else f.append(paragraph('Сражение завершено.'));
 const r=el('records');r.replaceChildren();if(!profile.records.length)r.append(paragraph('Пока нет завершённых сражений.'));else profile.records.slice(0,5).forEach((a,i)=>r.append(stat((i+1)+'. '+(a.won?'Победа':'Волна '+a.wave),String(a.score))))}
 function reset(){if(!confirm('Начать новое сражение? Незавершённый бой будет потерян.'))return;setState({...profile,battle:fresh(),recorded:false});message('Новая игра. Выберите башню.');void persist()}
 function point(e:PointerEvent){const r=view.app.canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*WIDTH/r.width,y:(e.clientY-r.top)*HEIGHT/r.height}}
 async function init(){const previous=await load();await view.init(el('field'));if(previous)setState(previous);
 for(const [k,v] of Object.entries(towers)){const b=document.createElement('button');b.className='tower-btn';b.dataset.kind=k;b.title=v.desc;const img=document.createElement('img');const source=view.towerArt.get(towerKey(k as TowerKind,1))?.source.resource;if(source instanceof HTMLCanvasElement)img.src=source.toDataURL();img.alt='';const name=document.createElement('strong');name.textContent=v.name;const cost=document.createElement('span');cost.textContent=v.cost+' G';b.append(img,name,cost);b.onclick=()=>selectKind(k as TowerKind);el('towerbar').append(b)}
 const c=view.app.canvas,tip=document.createElement('div');tip.className='tower-hover';tip.hidden=true;el('field').append(tip);
 c.addEventListener('pointermove',e=>{hover=point(e);const t=!kind&&state.towers.find(t=>Math.hypot(t.x-hover!.x,t.y-hover!.y)<25);tip.hidden=!t;if(t){tip.textContent=towers[t.kind].name+' · '+t.level+'/'+MAX_LEVEL+(t.branch>=0?' · '+towers[t.kind].branches[t.branch]:'');const bounds=c.getBoundingClientRect();tip.style.left=Math.max(5,Math.min(bounds.width-155,t.x/WIDTH*bounds.width))+'px';tip.style.top=Math.max(6,t.y/HEIGHT*bounds.height-80)+'px'}});
 c.addEventListener('pointerleave',()=>{hover=undefined;tip.hidden=true});c.addEventListener('contextmenu',e=>{e.preventDefault();kind=undefined;selection=undefined;update()});c.addEventListener('pointerdown',e=>{if(e.button!==0)return;const p=point(e);hover=p;tip.hidden=true;if(kind){if(build(state,p,kind)){audio.play('build');message(towers[kind].name+' построена.');selection=state.towers.at(-1)?.id;kind=undefined;void persist()}else message('Здесь нельзя построить башню или недостаточно золота.')}else{selection=state.towers.find(t=>Math.hypot(t.x-p.x,t.y-p.y)<25)?.id}update()});
 document.addEventListener('pointerdown',()=>void audio.activate(),{capture:true});document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.target instanceof HTMLButtonElement||el<HTMLDialogElement>('soundDialog').open)return;const keys=Object.keys(towers) as TowerKind[];if(Number(e.key)>=1&&Number(e.key)<=6)selectKind(keys[Number(e.key)-1]);if(e.key==='Escape'){kind=undefined;selection=undefined;update()}if(e.code==='Space'){e.preventDefault();paused=!paused;update()}});
 btn('next').onclick=chooseWave;btn('pause').onclick=()=>{paused=!paused;update()};btn('speed').onclick=()=>{speed=speed===1?2:speed===2?4:1;update()};btn('reset').onclick=reset;btn('save').onclick=()=>void persist(true);
 btn('fullscreen').onclick=()=>{if(document.fullscreenElement)void document.exitFullscreen();else void el('app').requestFullscreen().catch(()=>message('Полноэкранный режим недоступен.'))};
 const dialog=el<HTMLDialogElement>('soundDialog');btn('settings').onclick=()=>dialog.showModal();btn('closeSettings').onclick=()=>dialog.close();const music=el<HTMLInputElement>('music'),sfx=el<HTMLInputElement>('sfx'),volume=el<HTMLInputElement>('volume');
 try{const a=JSON.parse(localStorage.getItem('rr-audio')??'null');if(a){audio.music=!!a.music;audio.effects=!!a.effects;audio.volume=Math.max(0,Math.min(1,Number(a.volume)||0));music.checked=audio.music;sfx.checked=audio.effects;volume.value=String(audio.volume*100)}}catch{}
 const sound=()=>{audio.music=music.checked;audio.effects=sfx.checked;audio.volume=Number(volume.value)/100;try{localStorage.setItem('rr-audio',JSON.stringify({music:audio.music,effects:audio.effects,volume:audio.volume}))}catch{}};
 music.onchange=sound;sfx.onchange=sound;volume.oninput=sound;
 btn('export').onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(profile,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='rr-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
 btn('import').onclick=()=>el<HTMLInputElement>('file').click();el<HTMLInputElement>('file').onchange=async e=>{const input=e.target as HTMLInputElement;const f=input.files?.[0];try{if(!f||f.size>2_000_000)throw Error();const p=JSON.parse(await f.text());if(!validProfile(p))throw Error();if(confirm('Заменить текущий прогресс сохранением из файла?')){setState(p);await persist();message('Сохранение загружено.')}}catch{message('Неподдерживаемый файл сохранения.')}finally{input.value=''}};
 document.addEventListener('visibilitychange',()=>{if(document.hidden){paused=true;void persist();update()}});window.addEventListener('pagehide',()=>void persist());
 let accumulator=0,lastUI=0;view.app.ticker.add(t=>{const dt=Math.min(.1,t.deltaMS/1000);if(!paused){accumulator+=dt*speed;const phase=state.phase;while(accumulator>=1/60){step(state,1/60,a=>audio.play(a));accumulator-=1/60}if(phase!==state.phase){if(state.phase==='won'||state.phase==='lost'){selection=undefined;kind=undefined}message(state.phase==='ready'?'Волна отражена. Подготовьтесь к следующей.':state.phase==='won'?'Победа! Лесной рубеж спасён.':'Крепость потеряна.');record();void persist();update()}}view.render(state,selected(),kind,hover);audio.tick(state.phase==='battle'&&!paused,state.enemies.some(e=>e.kind==='boss'));const now=performance.now();if(now-lastUI>200){lastUI=now;update()}if(now-lastSave>5000){lastSave=now;void persist()}});
 if(previous)message(paused?'Сражение восстановлено. Нажмите «Продолжить».':'Прогресс восстановлен.');record();uiKey='';update()
 }
 init().catch(e=>{console.error(e);message('Не удалось запустить графику. Проверьте поддержку WebGL и обновите страницу.')});
