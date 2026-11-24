export const WIDTH=960, HEIGHT=544, TILE=32;
export type Point={x:number,y:number};
export const path:Point[]=[{x:-24,y:112},{x:176,y:112},{x:176,y:272},{x:400,y:272},{x:400,y:80},{x:624,y:80},{x:624,y:400},{x:848,y:400},{x:848,y:272},{x:984,y:272}];
export const obstacles=[{x:80,y:432,r:55},{x:288,y:80,r:42},{x:512,y:448,r:58},{x:784,y:112,r:58},{x:912,y:496,r:35},{x:288,y:464,r:42}];
export const towers={
 archer:{name:'Лучники',cost:65,damage:15,range:132,rate:.65,color:0xe9b96d,desc:'Быстрые стрелы. Одиночные цели.',branches:['Снайпер','Залповый огонь']},
 ballista:{name:'Баллиста',cost:105,damage:42,range:166,rate:1.65,color:0xdbc7a5,desc:'Пробивает броню.',branches:['Осадная','Скорострельная']},
 mage:{name:'Маг',cost:100,damage:34,range:126,rate:1.05,color:0xc78bf7,desc:'Магия обходит броню.',branches:['Архимаг','Чародей']},
 frost:{name:'Лёд',cost:90,damage:8,range:122,rate:.9,color:0x8de5ff,desc:'Замедляет врагов.',branches:['Мерзлота','Осколки']},
 bomb:{name:'Бомбарда',cost:125,damage:34,range:146,rate:1.9,color:0xffa15a,desc:'Урон по площади.',branches:['Мортира','Огненная']},
 venom:{name:'Алхимик',cost:95,damage:12,range:116,rate:.85,color:0xc6dc70,desc:'Яд и разрушение брони.',branches:['Кислота','Чума']},
 lightning:{name:'Молнии',cost:135,damage:26,range:138,rate:1.25,color:0xf0d779,desc:'Цепной разряд по нескольким врагам.',branches:['Грозовой шпиль','Буря']},
 barracks:{name:'Казармы',cost:85,damage:17,range:93,rate:.8,color:0xd6c6a0,desc:'Отряд задерживает врагов в ближнем бою.',branches:['Паладины','Берсерки']}
} as const;
export type TowerKind=keyof typeof towers;
export const MAX_LEVEL=5;
export const specializations:Record<TowerKind,readonly [string,string]>={
 archer:['Дальнобойные мощные стрелы, повышенный урон по одной цели.','Одновременная стрельба по нескольким целям.'],
 ballista:['Тяжёлый болт пробивает несколько врагов и почти всю броню.','Ускоренная перезарядка и более сильный пробой брони.'],
 mage:['Мощная руническая магия против одиночных целей.','Магическая дуга перескакивает на соседних врагов.'],
 frost:['Долгое глубокое замедление по площади.','Усиленные осколки поражают несколько целей.'],
 bomb:['Большой радиус взрыва и высокий урон по толпе.','Зажигательные снаряды оставляют горение.'],
 venom:['Кислота сильнее разрушает броню и наносит урон.','Чумное облако заражает соседних противников.'],
 lightning:['Мощные разряды по бронированным целям.','Больше скачков цепной молнии.'],
 barracks:['Щитоносцы надолго сдерживают врагов.','Быстрые атаки отряда по нескольким целям.']
};
export const towerColors:Record<TowerKind,number>={archer:0xe8b56e,ballista:0xc4cbd2,mage:0xbf91ee,frost:0x9ee9ff,bomb:0xff9b58,venom:0xb5dc68,lightning:0xf0d779,barracks:0xd6c6a0};
export const enemies={
 goblin:{name:'Гоблин',hp:45,speed:62,armor:0,gold:9,color:0x83a74b,size:12},
 orc:{name:'Орк',hp:135,speed:37,armor:.35,gold:16,color:0x74894b,size:16},
 skeleton:{name:'Скелет',hp:75,speed:50,armor:.15,gold:12,color:0xe1d4af,size:13},
 wolf:{name:'Варг',hp:52,speed:100,armor:0,gold:11,color:0x9698ac,size:14},
 wraith:{name:'Призрак',hp:100,speed:55,armor:.7,gold:15,color:0x8cd7d5,size:14},
 shaman:{name:'Шаман',hp:150,speed:35,armor:.12,gold:24,color:0x9e78b9,size:16},
 boss:{name:'Каменный король',hp:1500,speed:27,armor:.32,gold:170,color:0xa5a094,size:27},
 spider:{name:'Паук',hp:85,speed:76,armor:.08,gold:12,color:0xb88469,size:14},
 spiderling:{name:'Паучок',hp:22,speed:112,armor:0,gold:2,color:0xbd9b69,size:8},
 troll:{name:'Тролль',hp:290,speed:29,armor:.22,gold:27,color:0x78a482,size:21},
 raider:{name:'Налётчик',hp:110,speed:85,armor:.24,gold:14,color:0xc9a066,size:15},
 golem:{name:'Голем',hp:420,speed:23,armor:.65,gold:35,color:0xaaa9b0,size:22},
 lich:{name:'Владыка нежити',hp:1600,speed:30,armor:.44,gold:185,color:0xc3a0fa,size:27},
 dragon:{name:'Пепельный дракон',hp:1850,speed:36,armor:.36,gold:210,color:0xe67b50,size:31},
 demon:{name:'Страж Бездны',hp:2600,speed:29,armor:.45,gold:235,color:0xdf666d,size:30}
} as const;
export type EnemyKind=keyof typeof enemies;
type Group=[EnemyKind,number];
export const waves:Group[][]=[
 [['goblin',10]], [['goblin',12],['wolf',5]], [['orc',7],['goblin',9]],
 [['skeleton',14],['wolf',8]], [['wraith',9],['orc',8]], [['goblin',12],['boss',1]],
 [['shaman',4],['orc',12]], [['wolf',20],['wraith',10]], [['skeleton',18],['shaman',5]],
 [['orc',18],['wraith',15]], [['wolf',22],['shaman',8],['orc',12]],
 [['boss',1],['orc',12],['wraith',15],['shaman',5]]
];

export const isBoss=(k:EnemyKind)=>['boss','lich','dragon','demon'].includes(k);
export type MapId='forest'|'marsh'|'frost'|'ash'|'crypt';
export type MapDef={id:MapId,name:string,subtitle:string,path:Point[],obstacles:typeof obstacles,waves:Group[][],gold:number,palette:string[],description:string};
const points=(p:number[][])=>p.map(([x,y])=>({x,y}));
const rocks=(p:number[][])=>p.map(([x,y,r])=>({x,y,r}));
function campaignWaves(roster:EnemyKind[],boss:EnemyKind,n:number):Group[][]{
 return Array.from({length:n},(_,i)=>{
 const w=i+1,a=roster[i%roster.length],b=roster[(i+2)%roster.length],c=roster[(i+3)%roster.length];
 const groups:Group[]=[[a,Math.min(32,8+Math.floor(w*1.3))]];
 if(w>=3)groups.push([b,Math.min(20,3+Math.floor(w*.8))]);
 if(w>=8)groups.push([c,Math.min(15,3+Math.floor(w*.5))]);
 if(w===Math.floor(n/2)||w===n)groups.push([boss,1]);
 return groups.map(([k,count])=>[k,Math.min(count,k==='shaman'?5+Math.floor(w/6):k==='troll'||k==='golem'?12+Math.floor(w/4):32)]);
 })
}
export const maps:MapDef[]=[
 {id:'forest',name:'Лесной рубеж',subtitle:'I · Зелёные земли',path,obstacles,waves,gold:310,palette:['#48623b','#526d43','#384d32','#ae986e','#756144','#d0b383'],description:'Первый рубеж королевства. Леса и извилистая дорога.'},
 {id:'marsh',name:'Топи шепчущих',subtitle:'II · Мёртвые болота',path:points([[-24,192],[208,192],[208,432],[432,432],[432,112],[720,112],[720,336],[984,336]]),obstacles:rocks([[100,390,65],[350,250,64],[580,280,76],[830,75,58],[850,480,45]]),waves:campaignWaves(['goblin','spider','troll','wolf','shaman','wraith'],'lich',15),gold:390,palette:['#394d42','#465e4c','#293e35','#8e8663','#4f5140','#b2a279'],description:'Пауки распадаются на выводок, тролли восстанавливают здоровье.'},
 {id:'frost',name:'Северный перевал',subtitle:'III · Морозные горы',path:points([[-24,400],[144,400],[144,96],[352,96],[352,336],[560,336],[560,160],[800,160],[800,400],[984,400]]),obstacles:rocks([[64,80,41],[272,230,48],[442,480,52],[690,470,56],[895,65,48]]),waves:campaignWaves(['raider','wolf','golem','orc','troll','skeleton'],'boss',16),gold:400,palette:['#849ca0','#a5b7b6','#667d87','#b9c3bc','#6f8790','#d5ddd7'],description:'Тяжёлая броня големов и быстрые налётчики.'},
 {id:'ash',name:'Пепельная пустошь',subtitle:'IV · Огненные земли',path:points([[-24,96],[336,96],[336,240],[112,240],[112,432],[560,432],[560,208],[768,208],[768,384],[984,384]]),obstacles:rocks([[215,365,42],[465,145,55],[688,60,49],[890,110,60],[650,490,38]]),waves:campaignWaves(['orc','raider','golem','shaman','troll','spider'],'dragon',18),gold:480,palette:['#645046','#78594b','#483d39','#ad8665','#6d493c','#cda17b'],description:'Дракон периодически оглушает ближайшие башни.'},
 {id:'crypt',name:'Врата Бездны',subtitle:'V · Земли нежити',path:points([[-24,272],[144,272],[144,80],[400,80],[400,448],[656,448],[656,96],[832,96],[832,272],[984,272]]),obstacles:rocks([[55,450,38],[270,250,65],[530,230,62],[765,370,47],[900,460,45]]),waves:campaignWaves(['skeleton','wraith','golem','raider','troll','shaman'],'demon',20),gold:480,palette:['#454252','#575166','#35333f','#91818b','#554b60','#b1a1ad'],description:'Последний рубеж: страж Бездны меняет защиту от магии.'}
];
export const mapById=(id?:MapId)=>maps.find(m=>m.id===id)??maps[0];
export type Talent='economy'|'power'|'spells';
export type Talents=Record<Talent,number>;
export const emptyTalents=():Talents=>({economy:0,power:0,spells:0});
export const talentsInfo:Record<Talent,{name:string,description:string}>={economy:{name:'Казначейство',description:'+35 стартового золота за уровень'},power:{name:'Арсенал',description:'+6% урона всех башен за уровень'},spells:{name:'Рунное искусство',description:'−12% перезарядки заклинаний за уровень'}};
export type Ability='meteor'|'freeze'|'guard';
export const abilities:Record<Ability,{name:string,description:string,cooldown:number}>={meteor:{name:'Метеорит',description:'Урон 240 в радиусе 90',cooldown:65},freeze:{name:'Мороз',description:'Замедляет всех врагов на 5 секунд',cooldown:55},guard:{name:'Подкрепление',description:'Отряд задерживает и ранит врагов вокруг точки',cooldown:45}};
