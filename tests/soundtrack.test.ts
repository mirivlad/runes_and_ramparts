import test from 'node:test';
import assert from 'node:assert/strict';
import {soundtrack,selectTrack,audioPreferences} from '../src/soundtrack.ts';
import {maps} from '../src/content.ts';
test('soundtrack follows map during preparation and battle, boss takes priority',()=>{assert.equal(Object.keys(soundtrack).length,7);for(const m of maps){assert.equal(selectTrack(false,'ready',m.id,false),m.id);assert.equal(selectTrack(false,'battle',m.id,false),m.id);assert.equal(selectTrack(false,'battle',m.id,true),'boss');assert.equal(selectTrack(true,'battle',m.id,true),'menu');assert.equal(selectTrack(false,'won',m.id,false),'menu');assert.equal(selectTrack(false,'lost',m.id,false),'menu')}});
test('old audio preferences migrate independently and mute is preserved',()=>{assert.deepEqual(audioPreferences({volume:.6,music:false,effects:true}),{musicVolume:0,effectsVolume:.6});assert.deepEqual(audioPreferences({musicVolume:2,effectsVolume:-1}),{musicVolume:1,effectsVolume:0});assert.deepEqual(audioPreferences(null),{musicVolume:.35,effectsVolume:.35});assert.deepEqual(audioPreferences({musicVolume:0,effectsVolume:.7}),{musicVolume:0,effectsVolume:.7})});
