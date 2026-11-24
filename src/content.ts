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
 venom:{name:'Алхимик',cost:95,damage:12,range:116,rate:.85,color:0xc6dc70,desc:'Яд и разрушение брони.',branches:['Кислота','Чума']}
} as const;
export type TowerKind=keyof typeof towers;
export const MAX_LEVEL=5;
export const specializations:Record<TowerKind,readonly [string,string]>={
 archer:['Дальнобойные мощные стрелы, повышенный урон по одной цели.','Одновременная стрельба по нескольким целям.'],
 ballista:['Тяжёлый болт пробивает несколько врагов и почти всю броню.','Ускоренная перезарядка и более сильный пробой брони.'],
 mage:['Мощная руническая магия против одиночных целей.','Магическая дуга перескакивает на соседних врагов.'],
 frost:['Долгое глубокое замедление по площади.','Усиленные осколки поражают несколько целей.'],
 bomb:['Большой радиус взрыва и высокий урон по толпе.','Зажигательные снаряды оставляют горение.'],
 venom:['Кислота сильнее разрушает броню и наносит урон.','Чумное облако заражает соседних противников.']
};
export const towerColors:Record<TowerKind,number>={archer:0xe8b56e,ballista:0xc4cbd2,mage:0xbf91ee,frost:0x9ee9ff,bomb:0xff9b58,venom:0xb5dc68};
export const enemies={
 goblin:{name:'Гоблин',hp:45,speed:62,armor:0,gold:9,color:0x83a74b,size:12},
 orc:{name:'Орк',hp:135,speed:37,armor:.35,gold:16,color:0x74894b,size:16},
 skeleton:{name:'Скелет',hp:75,speed:50,armor:.15,gold:12,color:0xe1d4af,size:13},
 wolf:{name:'Варг',hp:52,speed:100,armor:0,gold:11,color:0x9698ac,size:14},
 wraith:{name:'Призрак',hp:100,speed:55,armor:.7,gold:15,color:0x8cd7d5,size:14},
 shaman:{name:'Шаман',hp:150,speed:35,armor:.12,gold:24,color:0x9e78b9,size:16},
 boss:{name:'Каменный король',hp:1500,speed:27,armor:.32,gold:170,color:0xa5a094,size:27}
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
