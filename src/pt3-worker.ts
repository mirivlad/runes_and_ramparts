type WasmAY={memory:WebAssembly.Memory;rr_input:()=>number;rr_output:()=>number;rr_init:(length:number,rate:number,format:number)=>number;rr_render:(n:number)=>number;rr_ended:()=>number};
const worker=self as unknown as {onmessage:(e:MessageEvent)=>void;postMessage:(data:unknown,transfer?:Transferable[])=>void};
let wasm:WasmAY|undefined;
worker.onmessage=async({data})=>{try{
 if(data.type==='init'){
  const file=new Uint8Array(data.file),format=data.format;
  if(![2,3,4].includes(format)||file.length<16||file.length>65536)throw Error('Неподдерживаемый размер или формат модуля.');
  if(format===3&&(file.length<203||file[98]!==32||file[100]===0||file.slice(201,Math.min(457,file.length)).indexOf(255)<=0))throw Error('Неподдерживаемый однокристальный PT3.');
  const response=await fetch(data.wasmUrl);if(!response.ok)throw Error('Модуль проигрывателя не найден.');
  const result=await WebAssembly.instantiate(await response.arrayBuffer());wasm=result.instance.exports as unknown as WasmAY;
  new Uint8Array(wasm.memory.buffer,wasm.rr_input(),file.length).set(file);
  if(wasm.rr_init(file.length,data.rate,format)!==1)throw Error('Не удалось распознать музыкальный модуль.');
  worker.postMessage({type:'ready'});return;
 }
 if(data.type==='chunk'&&wasm){const n=wasm.rr_render(16384);if(n<0||n>16384)throw Error('Ошибка декодера.');const samples=new Float32Array(wasm.memory.buffer,wasm.rr_output(),n*2).slice();if(samples.some(x=>!Number.isFinite(x)))throw Error('Ошибка декодирования.');worker.postMessage({type:'chunk',samples,ended:!!wasm.rr_ended()},[samples.buffer])}
 }catch(e){worker.postMessage({type:'error',message:e instanceof Error?e.message:'Ошибка AY.'})}};
