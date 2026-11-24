import {validSave,type State} from './game.ts';
import {maps,emptyTalents,type MapId,type Talents,type Talent} from './content.ts';
export type RecordEntry={map?:MapId,score:number,wave:number,lives:number,won:boolean,date:string};
export type Profile={battle:State;records:RecordEntry[];recorded:boolean;campaign?:Campaign};
export type Campaign={stars:Partial<Record<MapId,number>>,talents:Talents};
export function campaign(p:Profile):Campaign{
 if(!p.campaign){const stars:Campaign['stars']={};for(const r of p.records)if(r.won){const id=r.map??'forest';stars[id]=Math.max(stars[id]??0,r.lives>=16?3:r.lives>=8?2:1)}if(p.battle.phase==='won'){const id=p.battle.map??'forest';stars[id]=Math.max(stars[id]??0,p.battle.lives>=16?3:p.battle.lives>=8?2:1)}p.campaign={stars,talents:emptyTalents()}}return p.campaign
}
export function available(c:Campaign,id:MapId){const i=maps.findIndex(m=>m.id===id);return i===0||(i>0&&(c.stars[maps[i-1].id]??0)>0)}
export function points(c:Campaign){return Object.values(c.stars).reduce((a,b)=>a+(b??0),0)-Object.values(c.talents).reduce((a,b)=>a+b,0)}
export function purchase(c:Campaign,k:Talent){if(!Object.hasOwn(c.talents,k)||points(c)<1||c.talents[k]>=3)return false;c.talents[k]++;return true}
export function award(c:Campaign,s:State){if(s.phase!=='won')return;const id=s.map??'forest';c.stars[id]=Math.max(c.stars[id]??0,s.lives>=16?3:s.lives>=8?2:1)}
function validCampaign(c:Campaign|undefined){return c===undefined||!!c&&!!c.stars&&!!c.talents&&Object.entries(c.stars).every(([k,v])=>maps.some(m=>m.id===k)&&Number.isInteger(v)&&v!>=0&&v!<=3)&&Object.keys(emptyTalents()).every(k=>Number.isInteger(c.talents[k as Talent])&&c.talents[k as Talent]>=0&&c.talents[k as Talent]<=3)&&points(c)>=0}
const KEY='rr-profile-v1';
let db:Promise<IDBDatabase>|undefined;
function database(){return db??=new Promise((resolve,reject)=>{const r=indexedDB.open('runes-and-ramparts',1);r.onupgradeneeded=()=>r.result.createObjectStore('profiles');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export function validProfile(p:unknown):p is Profile{if(!p||typeof p!=='object')return false;const v=p as Profile;return validSave(v.battle)&&typeof v.recorded==='boolean'&&validCampaign(v.campaign)&&Array.isArray(v.records)&&v.records.length<=20&&v.records.every(r=>r&&Number.isFinite(r.score)&&Number.isFinite(r.wave)&&Number.isFinite(r.lives)&&typeof r.won==='boolean'&&typeof r.date==='string'&&(r.map===undefined||maps.some(m=>m.id===r.map)))}
export async function load(){try{const d=await database();const p=await new Promise<unknown>((resolve,reject)=>{const r=d.transaction('profiles').objectStore('profiles').get(KEY);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});if(validProfile(p))return p}catch{/* fallback */}try{const p=JSON.parse(localStorage.getItem(KEY)??'null');if(validProfile(p))return p}catch{/* invalid or disabled */}return undefined}
export async function save(p:Profile){const snapshot=structuredClone(p);let local=false;try{localStorage.setItem(KEY,JSON.stringify(snapshot));local=true}catch{/* fallback */}try{const d=await database();await new Promise<void>((resolve,reject)=>{const t=d.transaction('profiles','readwrite');t.objectStore('profiles').put(snapshot,KEY);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error)});return true}catch{return local}}
