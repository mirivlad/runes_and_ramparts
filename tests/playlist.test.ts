import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nextTrack,MAX_TRACKS} from '../src/playlist.ts';
import {formatOf} from '../src/ay-format.ts';
test('AY file extension detection',()=>{assert.equal(formatOf('test.PT2'),'pt2');assert.equal(formatOf('test.STP'),'stp');assert.equal(formatOf('test.pt3'),'pt3');assert.equal(formatOf('test.zip'),undefined);assert.equal(MAX_TRACKS,500)});
test('sequential playback wraps; shuffle consumes bag without repeating',()=>{assert.equal(nextTrack(3,4,'sequence',[]).index,0);assert.equal(nextTrack(0,0,'shuffle',[]).index,-1);assert.equal(nextTrack(0,1,'shuffle',[]).index,0);let current=0,bag:number[]=[],seen=new Set([0]);for(let i=0;i<4;i++){const n=nextTrack(current,5,'shuffle',bag,()=>.5);assert(!seen.has(n.index));seen.add(n.index);current=n.index;bag=n.remaining}assert.equal(seen.size,5);assert.notEqual(nextTrack(current,5,'shuffle',bag,()=>.5).index,current)});
test('PT2/STP wasm accepts bounded memory and rejects invalid inputs',async()=>{const {instance}=await WebAssembly.instantiate(readFileSync(new URL('../public/audio/ayfly.wasm',import.meta.url)));const w=instance.exports as any;assert.equal(w.memory.buffer.byteLength,1048576);for(const fmt of [2,4]){assert.equal(w.rr_init(0,44100,fmt),0);assert.equal(w.rr_init(70000,44100,fmt),0);assert.equal(w.rr_init(400,44100,fmt),0)}assert.equal(w.rr_init(400,44100,3),0)});
