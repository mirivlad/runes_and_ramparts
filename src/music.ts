// Original score for R&R, written as tracker-style rows. -1 means rest.
export type TrackId='menu'|'forest'|'marsh'|'frost'|'ash'|'crypt'|'boss';
type Track={name:string,bpm:number,root:number,minor:boolean,melody:number[][],chords:number[],bass:number[],drums:number[]};
export const score:Record<TrackId,Track>={
 menu:{name:'Banner in the wind',bpm:104,root:57,minor:false,melody:[[12,-1,16,-1,19,16,14,-1,12,-1,9,-1,7,-1,9,-1],[14,-1,17,16,14,-1,12,-1,9,12,14,-1,16,-1,-1,-1],[19,-1,21,19,16,-1,14,12,9,-1,12,14,16,-1,19,-1],[17,16,14,-1,12,-1,9,-1,7,9,12,-1,14,12,-1,-1]],chords:[0,5,9,7,0,5,2,7],bass:[0,-1,7,-1,12,-1,7,-1],drums:[0,8]},
 forest:{name:'March of the green guard',bpm:142,root:55,minor:false,melody:[[12,12,19,-1,16,14,12,-1,9,12,14,16,14,-1,7,-1],[14,17,21,17,14,-1,12,14,16,12,9,7,9,-1,12,-1],[19,19,21,23,24,-1,21,19,16,19,21,19,16,14,12,-1],[17,16,14,12,14,-1,16,17,19,16,12,9,7,9,12,-1]],chords:[0,5,0,7,9,5,2,7],bass:[0,0,7,12,0,7,12,7],drums:[0,4,8,12,15]},
 marsh:{name:'The reeds awaken',bpm:122,root:50,minor:true,melody:[[12,-1,15,12,19,-1,18,15,12,10,12,-1,7,10,12,-1],[10,12,13,-1,15,13,10,-1,8,10,12,13,10,-1,8,-1],[19,18,15,12,15,18,19,-1,22,19,18,15,12,-1,10,-1],[15,-1,13,10,12,15,17,-1,18,15,12,10,7,-1,12,-1]],chords:[0,0,8,10,0,5,8,7],bass:[0,-1,0,7,0,-1,10,7],drums:[0,3,6,8,11,14]},
 frost:{name:'Silver pass',bpm:132,root:52,minor:false,melody:[[19,-1,16,14,12,14,16,-1,19,21,19,16,14,-1,12,-1],[16,17,19,21,24,-1,21,19,17,16,14,12,14,-1,16,-1],[24,23,21,19,21,19,16,-1,14,16,19,21,19,16,14,-1],[17,19,21,-1,19,17,16,14,12,-1,14,16,19,16,12,-1]],chords:[0,7,9,5,0,2,5,7],bass:[0,7,-1,12,0,7,12,-1],drums:[0,4,8,12]},
 ash:{name:'Hammer of embers',bpm:154,root:48,minor:true,melody:[[12,12,15,12,19,18,15,12,10,12,15,18,19,-1,15,12],[13,13,17,13,20,17,13,10,12,12,15,19,18,15,12,-1],[24,22,19,18,19,22,24,-1,22,19,18,15,18,15,12,-1],[20,19,17,15,13,15,17,19,18,15,12,10,12,15,12,-1]],chords:[0,1,0,3,8,1,10,0],bass:[0,0,12,0,7,0,12,7],drums:[0,2,4,6,8,10,12,14,15]},
 crypt:{name:'Beyond the black gate',bpm:146,root:49,minor:true,melody:[[12,-1,13,15,18,15,13,12,7,10,12,13,15,-1,12,-1],[15,18,19,22,19,18,15,13,12,13,15,18,15,13,10,-1],[24,22,19,18,15,18,19,22,24,-1,22,19,18,15,13,-1],[13,15,18,19,18,15,13,12,10,13,15,18,19,15,12,-1]],chords:[0,3,6,1,0,10,6,7],bass:[0,0,6,12,0,7,6,0],drums:[0,3,4,8,10,12,14]},
 boss:{name:'The siege breaker',bpm:168,root:45,minor:true,melody:[[12,12,19,12,18,15,12,10,12,15,18,19,22,19,15,12],[13,13,20,13,19,17,13,10,12,12,19,18,15,12,10,-1],[24,24,22,19,18,19,22,24,25,24,22,19,18,15,12,-1],[22,19,18,15,19,18,15,12,13,15,18,19,18,15,12,7]],chords:[0,1,0,6,3,1,10,7],bass:[0,0,12,7,0,0,6,7],drums:[0,2,4,6,8,10,12,14,15]}
};
export type Note={midi:number,beats:number,volume:number,voice:'lead'|'bass'|'arp'|'drum'};
export function row(id:TrackId,tick:number):Note[]{
 const t=score[id],bar=Math.floor(tick/16)%16,i=tick%16,chord=t.chords[bar%8],phrase=t.melody[bar%4],section=bar>=8;
 const melody=phrase[i],notes:Note[]=[];const root=t.root+chord;
 if(melody>=0)notes.push({midi:t.root+melody+(section&&bar%4===2?12:0),beats:id==='menu'?1.7:.87,volume:section?.10:.085,voice:'lead'});
 if(i%2===0){const b=t.bass[i/2];if(b>=0)notes.push({midi:root-12+b,beats:1.7,volume:.10,voice:'bass'})}
 const arp=[0,t.minor?3:4,7,12,7,t.minor?3:4,7,12];
 if(i%2===1||section)notes.push({midi:root+12+arp[(i+bar)%8],beats:.55,volume:.038,voice:'arp'});
 if(t.drums.includes(i))notes.push({midi:i===0||i===8?35:i===4||i===12?48:65,beats:.65,volume:i===0||i===8?.13:.065,voice:'drum'});
 return notes
}
