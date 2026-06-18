// ============================================================
//  data/cards.js  v5  —  五列战场版
// ============================================================

export const SUITS = ['♠','♥','♦','♣'];
export const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

export const KEYWORDS = {
  SWEEP:   'sweep',    // 横扫：波及同列左右相邻列
  PIERCE:  'pierce',   // 穿透：伤害同时直伤英雄
  CRIT:    'crit',     // 暴击：25%双倍
  COMBO:   'combo',    // 连击：15%三连
  SHIELD:  'shield',   // 护盾：出场给英雄护盾
  TAUNT:   'taunt',    // 嘲讽：同列必须先打此卡
  DRAGON:  'dragon',   // 枪出如龙：攻击敌方全列
  HEAL:    'heal',     // 回血
  COUNTER: 'counter',  // 反制：移除护甲/神盾
  POISON:  'poison',   // 毒：每回合-2血
  BURN:    'burn',     // 灼烧：每回合-1血
  ARMOR:   'armor',    // 护甲：减伤1
  RAGE:    'rage',     // 狂怒：击杀后攻击+1
  DIVINE:  'divine',   // 神圣护盾
  FREEZE:  'freeze',   // 冻结
  ECHO:    'echo',     // 回响：复制手牌
  DRAIN:   'drain',    // 吸血：50%回血
  RUSH:    'rush',     // 急袭：出场即攻击（不能打英雄）
  AIRDROP: 'airdrop',  // 空降：可放置任意列
  SIEGE:   'siege',    // 攻城：攻击时额外直伤英雄2点
};

export const ENERGY_CONFIG = {
  startEnergy:  1,
  startMax:     1,
  gainPerTurn:  1,
  hardCap:      8,
};

// ── 地形定义 ──
export const TERRAIN_TYPES = {
  HIGHLAND: {
    id: 'highland', name: '高地', emoji: '⛰️',
    desc: '攻击+1，防御-1',
    apply: (card, side) => {
      if (side === 'player') { card._terrainAtk = 1; card._terrainDef = -1; }
    },
  },
  PLAIN: {
    id: 'plain', name: '平原', emoji: '🌾',
    desc: '无额外效果',
    apply: () => {},
  },
  VALLEY: {
    id: 'valley', name: '山谷', emoji: '🏔️',
    desc: '每回合结束回复2点生命',
    onTurnEnd: (state, col, side) => { state._healHero(side, 2); },
  },
  JUNGLE: {
    id: 'jungle', name: '丛林', emoji: '🌿',
    desc: '此列卡牌获得潜行（首次攻击免疫反击）',
    apply: (card) => { card._jungleStealth = true; },
  },
  CITY: {
    id: 'city', name: '城内', emoji: '🏯',
    desc: '此列所有卡牌获得+2护盾护甲效果',
    apply: (card) => { card._cityArmor = 2; },
  },
};

export const COLUMN_TERRAINS = [
  TERRAIN_TYPES.HIGHLAND,  // 列0：固定高地
  TERRAIN_TYPES.PLAIN,     // 列1：固定平原
  TERRAIN_TYPES.PLAIN,     // 列2：固定平原
  TERRAIN_TYPES.PLAIN,     // 列3：固定平原
  null,                     // 列4：随机（游戏开始时决定）
];

export const RANDOM_TERRAINS = [
  TERRAIN_TYPES.VALLEY,
  TERRAIN_TYPES.PLAIN,
  TERRAIN_TYPES.JUNGLE,
  TERRAIN_TYPES.CITY,
];

// ── 英雄定义 ──
export const HEROES = [
  {
    id: 'zhuge',
    name: '诸葛亮', emoji: '🧙',
    desc: '运筹帷幄，决胜千里',
    passive: '手牌上限+2（最多10张）',
    passiveId: 'hand_plus2',
    skill: {
      id: 'bazhen',
      char: '阵',
      name: '八阵图',
      cost: 3,
      effect: '将己方一列所有卡牌的攻击力和生命值各+2',
      onPlay: (state, card, side) => ({ heroSkill: { id: 'bazhen', side, col: card._col } }),
    },
  },
  {
    id: 'guan',
    name: '关羽', emoji: '⚔️',
    desc: '义薄云天，忠肝义胆',
    passive: '己方所有卡牌攻击力+1',
    passiveId: 'atk_plus1',
    skill: {
      id: 'qinglong',
      char: '斩',
      name: '青龙偃月',
      cost: 4,
      effect: '对敌方一列所有卡牌各造成5点伤害，穿透直伤英雄',
      onPlay: (state, card, side) => ({ heroSkill: { id: 'qinglong', side, col: card._col } }),
    },
  },
  {
    id: 'zhao',
    name: '赵云', emoji: '🌊',
    desc: '常山赵子龙，七进七出',
    passive: '己方急袭卡出场后也可攻击英雄',
    passiveId: 'rush_hero',
    skill: {
      id: 'qijin',
      char: '突',
      name: '七进七出',
      cost: 3,
      effect: '选一列，己方该列卡牌本回合可额外攻击一次',
      onPlay: (state, card, side) => ({ heroSkill: { id: 'qijin', side, col: card._col } }),
    },
  },
  {
    id: 'caocao',
    name: '曹操', emoji: '👑',
    desc: '挟天子以令诸侯',
    passive: '每击杀一张敌方卡，抽1张牌',
    passiveId: 'kill_draw',
    skill: {
      id: 'lingzhan',
      char: '令',
      name: '令战',
      cost: 4,
      effect: '己方全场所有卡牌本回合攻击力翻倍',
      onPlay: (state, card, side) => ({ heroSkill: { id: 'lingzhan', side } }),
    },
  },
];

// ── 基础卡牌（含列偏好字段 preferCol 可选） ──
export const BASE_CARDS = [
  // 1费
  { id:'zu',    char:'卒', attack:1, health:2, cost:1, keywords:[], effect:'死亡时召唤一个1/1"魂"', onDeath:(s,c,side)=>({summon:{side,cardId:'hun'}}) },
  { id:'fu2',   char:'符', attack:1, health:3, cost:1, keywords:[KEYWORDS.SHIELD], effect:'出场为己方英雄+1护盾；死亡时再+1护盾', onPlay:(s,c,side)=>({heroShield:{side,amount:1}}), onDeath:(s,c,side)=>({heroShield:{side,amount:1}}) },
  { id:'nu',    char:'弩', attack:2, health:1, cost:1, keywords:[KEYWORDS.PIERCE], effect:'【穿透】伤害时同步穿透对方英雄（50%）' },

  // 2费
  { id:'bing',  char:'兵', attack:2, health:3, cost:2, keywords:[KEYWORDS.RAGE],   effect:'【狂怒】每消灭一个敌方单位，攻击力+1' },
  { id:'gun',   char:'棍', attack:3, health:3, cost:2, keywords:[KEYWORDS.CRIT],   effect:'【暴击】25%概率造成双倍伤害' },
  { id:'jian',  char:'剑', attack:2, health:5, cost:2, keywords:[KEYWORDS.COMBO],  effect:'【连击】15%概率连续攻击三次' },
  { id:'du',    char:'毒', attack:2, health:3, cost:2, keywords:[KEYWORDS.POISON], effect:'【毒】攻击后目标每回合-2血（持续3回合）' },
  { id:'bing_f',char:'冰', attack:2, health:3, cost:2, keywords:[KEYWORDS.FREEZE], effect:'【冻结】攻击时使目标跳过下次攻击' },
  { id:'sheng', char:'生', attack:1, health:4, cost:2, keywords:[KEYWORDS.HEAL],   effect:'出场时回复己方英雄5点生命', onPlay:(s,c,side)=>({heroHeal:{side,amount:5}}) },
  { id:'qi',    char:'骑', attack:3, health:2, cost:2, keywords:[KEYWORDS.RUSH],   effect:'【急袭】出场当回合即可攻击（默认不能打英雄）' },

  // 3费
  { id:'dao',   char:'刀', attack:4, health:6, cost:3, keywords:[KEYWORDS.SWEEP],  effect:'【横扫】攻击时波及左右相邻列各一张卡（60%伤害）' },
  { id:'qiang', char:'枪', attack:4, health:4, cost:3, keywords:[KEYWORDS.PIERCE], effect:'【穿透】对卡牌造成伤害时，50%同步直伤对方英雄' },
  { id:'gong',  char:'弓', attack:3, health:3, cost:3, keywords:[KEYWORDS.CRIT, KEYWORDS.PIERCE], effect:'【暴击+穿透】25%暴击，穿透直伤英雄' },
  { id:'huo',   char:'火', attack:3, health:3, cost:3, keywords:[KEYWORDS.BURN, KEYWORDS.PIERCE], effect:'【灼烧+穿透】击中后目标每回合-1血（3回合）并穿透' },
  { id:'fang',  char:'防', attack:2, health:7, cost:3, keywords:[KEYWORDS.SHIELD, KEYWORDS.TAUNT], effect:'【护盾+嘲讽】出场为己方英雄+3护盾，嘲讽同列', onPlay:(s,c,side)=>({heroShield:{side,amount:3}}) },
  { id:'yun',   char:'云', attack:4, health:4, cost:3, keywords:[KEYWORDS.DRAIN],  effect:'【吸血】造成伤害的50%回复自身生命；可与"赵"合并' },
  { id:'yu',    char:'羽', attack:3, health:5, cost:3, keywords:[KEYWORDS.PIERCE, KEYWORDS.COMBO], effect:'【穿透+连击】可与"关"合并为关羽' },
  { id:'fei',   char:'飞', attack:5, health:4, cost:3, keywords:[KEYWORDS.SWEEP],  effect:'【横扫】可与"张"合并为张飞' },
  { id:'bei',   char:'备', attack:2, health:7, cost:3, keywords:[KEYWORDS.SHIELD], effect:'出场为己方英雄+4护盾；可与"刘"合并', onPlay:(s,c,side)=>({heroShield:{side,amount:4}}) },
  { id:'sun',   char:'孙', attack:4, health:5, cost:3, keywords:[KEYWORDS.CRIT, KEYWORDS.DRAIN], effect:'【暴击+吸血】25%暴击，50%伤害回血' },
  { id:'po',    char:'破', attack:4, health:4, cost:3, keywords:[KEYWORDS.COUNTER], effect:'【反制】打出时移除一张敌方卡的神圣护盾/护甲', onPlay:(s,c,side)=>({counter:{side}}) },
  { id:'yin',   char:'引', attack:2, health:4, cost:3, keywords:[KEYWORDS.ECHO],   effect:'【回响】出场时随机复制一张手牌', onPlay:(s,c,side)=>({echo:{side}}) },

  // 4费
  { id:'fu',    char:'斧', attack:5, health:4, cost:4, keywords:[KEYWORDS.SWEEP, KEYWORDS.CRIT], effect:'【横扫+暴击】横扫相邻列，25%暴击' },
  { id:'dou',   char:'斗', attack:5, health:4, cost:4, keywords:[KEYWORDS.CRIT, KEYWORDS.COMBO], effect:'【暴击+连击】25%暴击，15%三连击' },
  { id:'sha',   char:'杀', attack:6, health:3, cost:4, keywords:[KEYWORDS.DIVINE, KEYWORDS.CRIT], effect:'【神圣护盾+暴击】吸收一次伤害，25%暴击' },
  { id:'jia',   char:'甲', attack:3, health:8, cost:4, keywords:[KEYWORDS.ARMOR, KEYWORDS.TAUNT], effect:'【护甲+嘲讽】每次受伤减少1点，嘲讽同列' },
  { id:'dun',   char:'盾', attack:2, health:9, cost:4, keywords:[KEYWORDS.DIVINE, KEYWORDS.TAUNT], effect:'【神圣护盾+嘲讽】吸收一次伤害，嘲讽同列' },
  { id:'zhao',  char:'赵', attack:5, health:5, cost:4, keywords:[KEYWORDS.RUSH],   effect:'【急袭】出场即可攻击；可与"云"合并为赵云' },
  { id:'zhang', char:'张', attack:4, health:7, cost:4, keywords:[KEYWORDS.TAUNT, KEYWORDS.ARMOR], effect:'【嘲讽+护甲】可与"飞"合并为张飞' },
  { id:'liu',   char:'刘', attack:3, health:8, cost:4, keywords:[KEYWORDS.HEAL],   effect:'出场回复己方英雄5血；可与"备"合并为刘备', onPlay:(s,c,side)=>({heroHeal:{side,amount:5}}) },
  { id:'cao',   char:'曹', attack:5, health:6, cost:4, keywords:[KEYWORDS.RAGE, KEYWORDS.SWEEP], effect:'【狂怒+横扫】每消灭敌方单位攻击+1，并横扫' },
  { id:'ling',  char:'灵', attack:2, health:5, cost:4, keywords:[KEYWORDS.HEAL, KEYWORDS.SHIELD], effect:'出场回复4血并+3护盾', onPlay:(s,c,side)=>({heroHeal:{side,amount:4},heroShield:{side,amount:3}}) },

  // 5费
  { id:'ji',    char:'戟', attack:6, health:6, cost:5, keywords:[KEYWORDS.PIERCE, KEYWORDS.SWEEP], effect:'【穿透+横扫】方天画戟，穿透并横扫相邻列' },
  { id:'guan',  char:'关', attack:6, health:7, cost:5, keywords:[KEYWORDS.TAUNT, KEYWORDS.SWEEP], effect:'【嘲讽+横扫】义薄云天；可与"羽"合并为关羽' },
  { id:'shou',  char:'守', attack:3, health:10,cost:5, keywords:[KEYWORDS.SHIELD, KEYWORDS.TAUNT, KEYWORDS.ARMOR], effect:'【护盾+嘲讽+护甲】三重防御，出场+3护盾', onPlay:(s,c,side)=>({heroShield:{side,amount:3}}) },
  { id:'siege', char:'炮', attack:4, health:5, cost:5, keywords:[KEYWORDS.SIEGE],  effect:'【攻城】每次攻击额外直伤英雄2点' },

  // 6费
  { id:'lu',    char:'吕', attack:8, health:7, cost:6, keywords:[KEYWORDS.SWEEP, KEYWORDS.PIERCE, KEYWORDS.CRIT], effect:'【横扫+穿透+暴击】天下无双' },
  { id:'zhen',  char:'镇', attack:5, health:14,cost:6, keywords:[KEYWORDS.TAUNT, KEYWORDS.DIVINE], effect:'【嘲讽+神圣护盾】镇守同列' },

  // Token
  { id:'hun',   char:'魂', attack:1, health:1, cost:0, keywords:[], effect:'由"卒"死亡召唤', isToken:true },
];

// ── 合体卡 ──
export const FUSION_CARDS = [
  { id:'zhao_yun', char:'赵云', requires:['zhao','yun'], attack:9,  health:9,  cost:0, keywords:[KEYWORDS.DRAGON,KEYWORDS.DRAIN,KEYWORDS.RUSH], effect:'【枪出如龙+吸血+急袭】对同列敌方全体造成伤害；50%回血' },
  { id:'guan_yu',  char:'关羽', requires:['guan','yu'],  attack:10, health:12, cost:0, keywords:[KEYWORDS.TAUNT,KEYWORDS.SWEEP,KEYWORDS.PIERCE], effect:'【嘲讽+横扫+穿透】威震华夏' },
  { id:'zhang_fei',char:'张飞', requires:['zhang','fei'],attack:10, health:11, cost:0, keywords:[KEYWORDS.TAUNT,KEYWORDS.SWEEP,KEYWORDS.CRIT], effect:'【嘲讽+横扫+暴击】长坂桥一声吼' },
  { id:'liu_bei',  char:'刘备', requires:['liu','bei'],  attack:5,  health:15, cost:0, keywords:[KEYWORDS.SHIELD,KEYWORDS.HEAL,KEYWORDS.TAUNT], effect:'出场+6护盾+6血；【嘲讽】', onPlay:(s,c,side)=>({heroShield:{side,amount:6},heroHeal:{side,amount:6}}) },
];

// ── 解锁卡（玩家专属） ──
export const UNLOCK_CARDS = [
  { id:'tianming', char:'天', attack:3, health:5, cost:2, keywords:[KEYWORDS.HEAL], effect:'【天命】入场时回复己方英雄3血', onPlay:(s,c,side)=>({heroHeal:{side,amount:3}}) },
  { id:'zibao',    char:'爆', attack:3, health:1, cost:3, keywords:[], effect:'【自爆】被摧毁时，对敌方同列所有单位造成4点伤害', onDeath:(s,c,side)=>({aoeCol:{side,col:c._col,damage:4,enemy:true}}) },
  { id:'junling',  char:'令', attack:2, health:4, cost:4, keywords:[], effect:'【军令】入场时己方同列所有其他单位+2/+2', onPlay:(s,c,side)=>({buffCol:{side,col:c._col,atk:2,hp:2}}) },
  { id:'fuling',   char:'伏', attack:2, health:3, cost:3, keywords:[], effect:'【伏兵】入场时在随机列召唤2个1/1"魂"', onPlay:(s,c,side)=>({summonMulti:{side,cardId:'hun',count:2}}) },
  { id:'shengzhan',char:'圣', attack:3, health:6, cost:5, keywords:[KEYWORDS.HEAL,KEYWORDS.SHIELD], effect:'【圣战】入场回复8血+4护盾', onPlay:(s,c,side)=>({heroHeal:{side,amount:8},heroShield:{side,amount:4}}) },
  { id:'wudi',     char:'无', attack:4, health:6, cost:5, keywords:[KEYWORDS.DIVINE,KEYWORDS.TAUNT], effect:'【无敌】神圣护盾+嘲讽；入场英雄本回合免疫伤害', onPlay:(s,c,side)=>({heroInvincible:{side,turns:1}}) },
  { id:'shengui',  char:'神', attack:5, health:6, cost:4, keywords:[KEYWORDS.SWEEP], effect:'【神威】入场对敌方全列所有单位造成3点伤害', onPlay:(s,c,side)=>({aoeCol:{side:s.oppName(side),col:c._col,damage:3,enemy:false}}) },
  { id:'bawang',   char:'霸', attack:8, health:8, cost:6, keywords:[KEYWORDS.SWEEP,KEYWORDS.PIERCE,KEYWORDS.CRIT,KEYWORDS.TAUNT], effect:'【霸主】横扫+穿透+暴击+嘲讽' },
];

export const AI_DECK_PRESET = [
  'zu','fu2','nu',
  'bing','gun','jian','du','bing_f','sheng','qi',
  'dao','qiang','gong','huo','fang','yun','yu','fei','bei','sun',
  'fu','dou','sha','jia','dun','zhao','zhang','liu','cao',
  'ji','guan','shou','siege','lu','zhen',
];

export const AI_HERO_NAMES = [
  '🗡️ 曹操','⚔️ 吕布','🔥 孙权','🌊 周瑜',
  '🐉 袁绍','🌙 司马懿','⚡ 典韦','🌀 张辽',
  '💀 董卓','🏹 黄忠','🔱 马超','🌸 貂蝉',
];
