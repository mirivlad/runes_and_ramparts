import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('packaged AY/PT3 wasm exposes bounded memory and rejects invalid modules',async()=>{const {instance}=await WebAssembly.instantiate(readFileSync(new URL('../public/audio/pt3.wasm',import.meta.url)));const w=instance.exports as any;assert.equal(w.memory.buffer.byteLength,1048576);assert.equal(w.rr_init(1,44100),0);assert.equal(w.rr_init(65537,44100),0);assert.equal(w.rr_init(300,44100),0)});
