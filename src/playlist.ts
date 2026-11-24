import {formatOf} from './ay-format.ts';
export type PlaylistMode='sequence'|'shuffle';
export const MAX_TRACKS=500;
export function nextTrack(current:number,length:number,mode:PlaylistMode,remaining:number[],random=Math.random):{index:number,remaining:number[]}{
 if(length<=0)return{index:-1,remaining:[]};
 if(mode==='sequence')return{index:(current+1+length)%length,remaining:[]};
 let bag=remaining.filter(i=>i>=0&&i<length&&i!==current);
 if(!bag.length)bag=Array.from({length},(_,i)=>i).filter(i=>i!==current);
 if(!bag.length)return{index:0,remaining:[]};
 const i=Math.min(bag.length-1,Math.floor(random()*bag.length));return{index:bag[i],remaining:bag.filter((_,j)=>j!==i)}
}
export type PlaylistData={files:File[],mode:PlaylistMode,volume:number,index:number};
function db(){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('rr-music-library',1);r.onupgradeneeded=()=>r.result.createObjectStore('playlist');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function loadPlaylist():Promise<PlaylistData|undefined>{let d:IDBDatabase|undefined;try{d=await db();const v=await new Promise<PlaylistData>((resolve,reject)=>{const r=d!.transaction('playlist').objectStore('playlist').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});if(v&&Array.isArray(v.files)){return {files:v.files.filter(f=>f instanceof File&&!!formatOf(f.name)&&f.size>=16&&f.size<=65536).slice(0,MAX_TRACKS),mode:v.mode==='shuffle'?'shuffle':'sequence',volume:Number.isFinite(v.volume)?Math.max(0,Math.min(1,v.volume)):.35,index:Number.isInteger(v.index)?v.index:0}}}catch{}finally{d?.close()}}
export async function savePlaylist(v:PlaylistData){let d:IDBDatabase|undefined;try{d=await db();await new Promise<void>((resolve,reject)=>{const t=d!.transaction('playlist','readwrite');t.objectStore('playlist').put(v,'current');t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error)});return true}catch{return false}finally{d?.close()}}
