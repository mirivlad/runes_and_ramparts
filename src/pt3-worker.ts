type WasmPT3={memory:WebAssembly.Memory;rr_input:()=>number;rr_output:()=>number;rr_init:(length:number,rate:number)=>number;rr_render:(n:number)=>void};
const worker=self as unknown as {onmessage:(e:MessageEvent)=>void;postMessage:(data:unknown,transfer?:Transferable[])=>void};
let wasm:WasmPT3|undefined;
worker.onmessage=async({data})=>{try{
 if(data.type==='init'){
  const file=new Uint8Array(data.file);
  if(file.length<203||file.length>65536||file[98]!==32)throw Error('Поддерживаются обычные однокристальные PT3 до 64 КБ.');
  const end=file.slice(201,Math.min(457,file.length)).indexOf(255);
  if(end<=0||file[100]===0)throw Error('Некорректный заголовок PT3.');
  const response=await fetch(data.wasmUrl);if(!response.ok)throw Error('Модуль проигрывателя не найден.');
  const result=await WebAssembly.instantiate(await response.arrayBuffer());wasm=result.instance.exports as unknown as WasmPT3;
  new Uint8Array(wasm.memory.buffer,wasm.rr_input(),file.length).set(file);
  if(wasm.rr_init(file.length,data.rate)!==1)throw Error('Формат PT3 не поддерживается.');
  worker.postMessage({type:'ready'});return;
 }
 if(data.type==='chunk'&&wasm){const n=16384;wasm.rr_render(n);const samples=new Float32Array(wasm.memory.buffer,wasm.rr_output(),n*2).slice();if(samples.some(x=>!Number.isFinite(x)))throw Error('Ошибка декодирования PT3.');worker.postMessage({type:'chunk',samples},[samples.buffer])}
 }catch(e){worker.postMessage({type:'error',message:e instanceof Error?e.message:'Ошибка PT3.'})}};
