export type AYFormat='pt2'|'pt3'|'stp';
export function formatOf(name:string):AYFormat|undefined{const ext=name.split('.').at(-1)?.toLowerCase();return ext==='pt2'||ext==='pt3'||ext==='stp'?ext:undefined}
