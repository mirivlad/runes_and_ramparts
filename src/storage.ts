import {validSave,type State} from './game.ts';
export type RecordEntry={score:number,wave:number,lives:number,won:boolean,date:string};
export type Profile={battle:State;records:RecordEntry[];recorded:boolean};
const KEY='rr-profile-v1';
let db:Promise<IDBDatabase>|undefined;
function database(){return db??=new Promise((resolve,reject)=>{const r=indexedDB.open('runes-and-ramparts',1);r.onupgradeneeded=()=>r.result.createObjectStore('profiles');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export function validProfile(p:unknown):p is Profile{if(!p||typeof p!=='object')return false;const v=p as Profile;return validSave(v.battle)&&typeof v.recorded==='boolean'&&Array.isArray(v.records)&&v.records.length<=20&&v.records.every(r=>r&&Number.isFinite(r.score)&&Number.isFinite(r.wave)&&Number.isFinite(r.lives)&&typeof r.won==='boolean'&&typeof r.date==='string')}
export async function load(){try{const d=await database();const p=await new Promise<unknown>((resolve,reject)=>{const r=d.transaction('profiles').objectStore('profiles').get(KEY);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});if(validProfile(p))return p}catch{/* fallback */}try{const p=JSON.parse(localStorage.getItem(KEY)??'null');if(validProfile(p))return p}catch{/* invalid or disabled */}return undefined}
export async function save(p:Profile){const snapshot=structuredClone(p);let local=false;try{localStorage.setItem(KEY,JSON.stringify(snapshot));local=true}catch{/* fallback */}try{const d=await database();await new Promise<void>((resolve,reject)=>{const t=d.transaction('profiles','readwrite');t.objectStore('profiles').put(snapshot,KEY);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error)});return true}catch{return local}}
