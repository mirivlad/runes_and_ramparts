import type {MapId} from './content.ts';
export type TrackId='menu'|MapId|'boss';
// Measured integrated loudness, gain relative to -16 LUFS; original MP3 bytes unchanged.
export const soundtrack:Record<TrackId,{title:string,gain:number}>={
 menu:{title:'Realm of Legend',gain:.799},forest:{title:'Forest Defense',gain:.814},
 marsh:{title:'Swamp Skirmish',gain:.784},frost:{title:'Frostpeak Fortress',gain:.816},
 ash:{title:'Volcanic Surge',gain:.834},crypt:{title:'Gothic Citadel',gain:.807},
 boss:{title:'Final Showdown',gain:.852}
};
export function selectTrack(menu:boolean,phase:'ready'|'battle'|'won'|'lost',map:MapId,boss:boolean):TrackId{
 return menu||phase==='won'||phase==='lost'?'menu':phase==='battle'&&boss?'boss':map;
}
const clamp=(v:unknown,fallback:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(1,v)):fallback;
export function audioPreferences(value:unknown){const p=value&&typeof value==='object'?value as Record<string,unknown>:{};const old=clamp(p.volume,.35);return {musicVolume:clamp(p.musicVolume,p.music===false?0:old),effectsVolume:clamp(p.effectsVolume,p.effects===false?0:old)}}
