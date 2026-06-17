// ============================================================
//  data/cards.js  –  卡牌定义 v4
//  费用体系重做：
//  - 初始能量从3改为2，上限从10改为8
//  - 费用重新定价：数值+词条数量决定费用
//  - 1费：弱小单位（2/2以下，无词条或单一弱词条）
//  - 2费：普通单位（3-4攻或4-6血，最多一个词条）
//  - 3费：中等单位（4-5攻/5-7血，或双词条）
//  - 4费：强力单位（6攻以上，或三词条）
//  - 5费：史诗单位（顶级数值+多词条）
//  - 6费：传说单位（镇场级）
// ============================================================

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const KEYWORDS = {
  SWEEP:    'sweep',
  PIERCE:   'pierce',
  CRIT:     'crit',
  COMBO:    'combo',
  SHIELD:   'shield',
  TAUNT:    'taunt',
  DRAGON:   'dragon',
  HEAL:     'heal',
  COUNTER:  'counter',
  POISON:   'poison',
  BURN:     'burn',
  ARMOR:    'armor',
  RAGE:     'rage',
  DIVINE:   'divine',
  FREEZE:   'freeze',
  ECHO:     'echo',
  DRAIN:    'drain',
  REBIRTH:  'rebirth',
  STEALTH:  'stealth',
  RUSH:     'rush',
};

export const AI_HERO_NAMES = [
  '🗡️ 曹操', '⚔️ 吕布', '🔥 孙权', '🌊 周瑜',
  '🐉 袁绍', '🌙 司马懿', '⚡ 典韦', '🌀 张辽',
  '💀 董卓', '🏹 黄忠', '🔱 马超', '🌸 貂蝉',
];

// 能量配置（集中管理，GameState 读取）
export const ENERGY_CONFIG = {
  startEnergy:  2,   // 初始能量（双方开局）
  startMax:     2,   // 初始上限
  gainPerTurn:  1,   // 每回合增加上限
  hardCap:      8,   // 能量硬上限
};

export const BASE_CARDS = [
  // ════════════════════════════════
  //  1 费 — 弱小单位，适合铺场填充
  // ════════════════════════════════
  {
    id: 'zu',
    char: '卒',
    attack: 1, health: 2, cost: 1,
    keywords: [],
    effect: '死亡时召唤一个1/1的"魂"',
    onDeath: (state, card, side) => ({ summon: { side, cardId: 'hun' } }),
  },
  {
    id: 'fu2',
    char: '符',
    attack: 1, health: 3, cost: 1,
    keywords: [KEYWORDS.SHIELD],
    effect: '出场为己方英雄提供1护盾；死亡时再提供1护盾',
    onPlay:  (state, card, side) => ({ heroShield: { side, amount: 1 } }),
    onDeath: (state, card, side) => ({ heroShield: { side, amount: 1 } }),
  },
  {
    id: 'nu',
    char: '弩',
    attack: 2, health: 1, cost: 1,
    keywords: [KEYWORDS.PIERCE],
    effect: '【穿透】伤害时同步穿透对方英雄（50%）',
  },

  // ════════════════════════════════
  //  2 费 — 基础单位
  // ════════════════════════════════
  {
    id: 'bing',
    char: '兵',
    attack: 2, health: 3, cost: 2,
    keywords: [KEYWORDS.RAGE],
    effect: '【狂怒】每消灭一个敌方单位，攻击力+1',
  },
  {
    id: 'gun',
    char: '棍',
    attack: 3, health: 3, cost: 2,
    keywords: [KEYWORDS.CRIT],
    effect: '【暴击】25%概率造成双倍伤害',
  },
  {
    id: 'jian',
    char: '剑',
    attack: 2, health: 5, cost: 2,
    keywords: [KEYWORDS.COMBO],
    effect: '【连击】15%概率连续攻击三次',
  },
  {
    id: 'du',
    char: '毒',
    attack: 2, health: 3, cost: 2,
    keywords: [KEYWORDS.POISON],
    effect: '【毒】攻击后令目标每回合-2血（持续3回合）',
  },
  {
    id: 'bing_f',
    char: '冰',
    attack: 2, health: 3, cost: 2,
    keywords: [KEYWORDS.FREEZE],
    effect: '【冻结】攻击时使目标跳过下次攻击',
  },
  {
    id: 'sheng',
    char: '生',
    attack: 1, health: 4, cost: 2,
    keywords: [KEYWORDS.HEAL],
    effect: '出场时回复己方英雄5点生命',
    onPlay: (state, card, side) => ({ heroHeal: { side, amount: 5 } }),
  },
  {
    id: 'qi',
    char: '骑',
    attack: 3, health: 2, cost: 2,
    keywords: [KEYWORDS.RUSH],
    effect: '【急袭】出场当回合即可攻击（不能攻击英雄）',
  },

  // ════════════════════════════════
  //  3 费 — 中坚单位
  // ════════════════════════════════
  {
    id: 'dao',
    char: '刀',
    attack: 4, health: 6, cost: 3,
    keywords: [KEYWORDS.SWEEP],
    effect: '【横扫】攻击时附带伤害左右相邻目标（60%伤害）',
  },
  {
    id: 'qiang',
    char: '枪',
    attack: 4, health: 4, cost: 3,
    keywords: [KEYWORDS.PIERCE],
    effect: '【穿透】对卡牌造成伤害时，50%同步直伤对方英雄',
  },
  {
    id: 'gong',
    char: '弓',
    attack: 3, health: 3, cost: 3,
    keywords: [KEYWORDS.CRIT, KEYWORDS.PIERCE],
    effect: '【暴击+穿透】25%暴击，穿透直伤英雄',
  },
  {
    id: 'huo',
    char: '火',
    attack: 3, health: 3, cost: 3,
    keywords: [KEYWORDS.BURN, KEYWORDS.PIERCE],
    effect: '【灼烧+穿透】击中后目标每回合-1血（3回合）并穿透',
  },
  {
    id: 'fang',
    char: '防',
    attack: 2, health: 7, cost: 3,
    keywords: [KEYWORDS.SHIELD, KEYWORDS.TAUNT],
    effect: '【护盾+嘲讽】出场为己方英雄提供3点护盾，并嘲讽',
    onPlay: (state, card, side) => ({ heroShield: { side, amount: 3 } }),
  },
  {
    id: 'yun',
    char: '云',
    attack: 4, health: 4, cost: 3,
    keywords: [KEYWORDS.DRAIN],
    effect: '【吸血】造成伤害的50%回复自身生命；可与"赵"合并为赵云',
  },
  {
    id: 'yu',
    char: '羽',
    attack: 3, health: 5, cost: 3,
    keywords: [KEYWORDS.PIERCE, KEYWORDS.COMBO],
    effect: '【穿透+连击】可与"关"合并为关羽',
  },
  {
    id: 'fei',
    char: '飞',
    attack: 5, health: 4, cost: 3,
    keywords: [KEYWORDS.SWEEP],
    effect: '【横扫】可与"张"合并为张飞',
  },
  {
    id: 'bei',
    char: '备',
    attack: 2, health: 7, cost: 3,
    keywords: [KEYWORDS.SHIELD],
    effect: '出场为己方英雄提供4护盾；可与"刘"合并为刘备',
    onPlay: (state, card, side) => ({ heroShield: { side, amount: 4 } }),
  },
  {
    id: 'sun',
    char: '孙',
    attack: 4, health: 5, cost: 3,
    keywords: [KEYWORDS.CRIT, KEYWORDS.DRAIN],
    effect: '【暴击+吸血】25%暴击，50%伤害回血',
  },
  {
    id: 'po',
    char: '破',
    attack: 4, health: 4, cost: 3,
    keywords: [KEYWORDS.COUNTER],
    effect: '【反制】打出时移除一张敌方卡的神圣护盾/护甲',
    onPlay: (state, card, side) => ({ counter: { side } }),
  },
  {
    id: 'yin',
    char: '引',
    attack: 2, health: 4, cost: 3,
    keywords: [KEYWORDS.ECHO],
    effect: '【回响】出场时随机复制一张手牌到手中',
    onPlay: (state, card, side) => ({ echo: { side } }),
  },

  // ════════════════════════════════
  //  4 费 — 强力单位
  // ════════════════════════════════
  {
    id: 'fu',
    char: '斧',
    attack: 5, health: 4, cost: 4,
    keywords: [KEYWORDS.SWEEP, KEYWORDS.CRIT],
    effect: '【横扫+暴击】横扫相邻单位，25%暴击',
  },
  {
    id: 'dou',
    char: '斗',
    attack: 5, health: 4, cost: 4,
    keywords: [KEYWORDS.CRIT, KEYWORDS.COMBO],
    effect: '【暴击+连击】25%暴击，15%三连击',
  },
  {
    id: 'sha',
    char: '杀',
    attack: 6, health: 3, cost: 4,
    keywords: [KEYWORDS.DIVINE, KEYWORDS.CRIT],
    effect: '【神圣护盾+暴击】吸收一次伤害，25%暴击',
  },
  {
    id: 'jia',
    char: '甲',
    attack: 3, health: 8, cost: 4,
    keywords: [KEYWORDS.ARMOR, KEYWORDS.TAUNT],
    effect: '【护甲+嘲讽】每次受伤减少1点，强制嘲讽',
  },
  {
    id: 'dun',
    char: '盾',
    attack: 2, health: 9, cost: 4,
    keywords: [KEYWORDS.DIVINE, KEYWORDS.TAUNT],
    effect: '【神圣护盾+嘲讽】吸收一次伤害，强制嘲讽',
  },
  {
    id: 'zhao',
    char: '赵',
    attack: 5, health: 5, cost: 4,
    keywords: [KEYWORDS.RUSH],
    effect: '【急袭】出场即可攻击；可与"云"合并为赵云',
  },
  {
    id: 'zhang',
    char: '张',
    attack: 4, health: 7, cost: 4,
    keywords: [KEYWORDS.TAUNT, KEYWORDS.ARMOR],
    effect: '【嘲讽+护甲】可与"飞"合并为张飞',
  },
  {
    id: 'liu',
    char: '刘',
    attack: 3, health: 8, cost: 4,
    keywords: [KEYWORDS.HEAL],
    effect: '出场回复己方英雄5血；可与"备"合并为刘备',
    onPlay: (state, card, side) => ({ heroHeal: { side, amount: 5 } }),
  },
  {
    id: 'cao',
    char: '曹',
    attack: 5, health: 6, cost: 4,
    keywords: [KEYWORDS.RAGE, KEYWORDS.SWEEP],
    effect: '【狂怒+横扫】每消灭一个敌方单位攻击+1，并横扫',
  },
  {
    id: 'ling',
    char: '灵',
    attack: 2, health: 5, cost: 4,
    keywords: [KEYWORDS.HEAL, KEYWORDS.SHIELD],
    effect: '出场为己方英雄回复4血并提供3护盾',
    onPlay: (state, card, side) => ({
      heroHeal: { side, amount: 4 },
      heroShield: { side, amount: 3 },
    }),
  },

  // ════════════════════════════════
  //  5 费 — 史诗单位
  // ════════════════════════════════
  {
    id: 'ji',
    char: '戟',
    attack: 6, health: 6, cost: 5,
    keywords: [KEYWORDS.PIERCE, KEYWORDS.SWEEP],
    effect: '【穿透+横扫】方天画戟，兼具穿透与横扫',
  },
  {
    id: 'guan',
    char: '关',
    attack: 6, health: 7, cost: 5,
    keywords: [KEYWORDS.TAUNT, KEYWORDS.SWEEP],
    effect: '【嘲讽+横扫】义薄云天；可与"羽"合并为关羽',
  },
  {
    id: 'shou',
    char: '守',
    attack: 3, health: 10, cost: 5,
    keywords: [KEYWORDS.SHIELD, KEYWORDS.TAUNT, KEYWORDS.ARMOR],
    effect: '【护盾+嘲讽+护甲】出场提供3护盾，三重防御',
    onPlay: (state, card, side) => ({ heroShield: { side, amount: 3 } }),
  },

  // ════════════════════════════════
  //  6 费 — 传说单位（镇场）
  // ════════════════════════════════
  {
    id: 'lu',
    char: '吕',
    attack: 8, health: 7, cost: 6,
    keywords: [KEYWORDS.SWEEP, KEYWORDS.PIERCE, KEYWORDS.CRIT],
    effect: '【横扫+穿透+暴击】天下无双，三词条同时生效',
  },
  {
    id: 'zhen',
    char: '镇',
    attack: 5, health: 14, cost: 6,
    keywords: [KEYWORDS.TAUNT, KEYWORDS.DIVINE],
    effect: '【嘲讽+神圣护盾】强制嘲讽，并吸收一次伤害',
  },

  // ── Token（无费用，仅由效果召唤）──
  {
    id: 'hun',
    char: '魂',
    attack: 1, health: 1, cost: 0,
    keywords: [],
    effect: '由"卒"死亡召唤',
    isToken: true,
  },
];

// ── 合成卡牌 ──
export const FUSION_CARDS = [
  {
    id: 'zhao_yun',
    char: '赵云',
    requires: ['zhao', 'yun'],
    attack: 9, health: 9, cost: 0,
    keywords: [KEYWORDS.DRAGON, KEYWORDS.DRAIN, KEYWORDS.RUSH],
    effect: '【枪出如龙+吸血+急袭】对敌方全体造成伤害；50%伤害回血',
  },
  {
    id: 'guan_yu',
    char: '关羽',
    requires: ['guan', 'yu'],
    attack: 10, health: 12, cost: 0,
    keywords: [KEYWORDS.TAUNT, KEYWORDS.SWEEP, KEYWORDS.PIERCE],
    effect: '【嘲讽+横扫+穿透】威震华夏，横扫并穿透伤害英雄',
  },
  {
    id: 'zhang_fei',
    char: '张飞',
    requires: ['zhang', 'fei'],
    attack: 10, health: 11, cost: 0,
    keywords: [KEYWORDS.TAUNT, KEYWORDS.SWEEP, KEYWORDS.CRIT],
    effect: '【嘲讽+横扫+暴击】长坂桥一声吼，横扫三敌25%暴击',
  },
  {
    id: 'liu_bei',
    char: '刘备',
    requires: ['liu', 'bei'],
    attack: 5, health: 15, cost: 0,
    keywords: [KEYWORDS.SHIELD, KEYWORDS.HEAL, KEYWORDS.TAUNT],
    effect: '出场为己方英雄提供6护盾并回复6血；【嘲讽】',
    onPlay: (state, card, side) => ({
      heroShield: { side, amount: 6 },
      heroHeal:   { side, amount: 6 },
    }),
  },
  {
    id: 'cao_cao',
    char: '曹操',
    requires: ['cao', 'cao'],
    attack: 10, health: 12, cost: 0,
    keywords: [KEYWORDS.RAGE, KEYWORDS.SWEEP, KEYWORDS.TAUNT],
    effect: '【狂怒+横扫+嘲讽】挟天子以令诸侯，越战越强',
  },
];

// AI 卡组（同样受新费用约束，AI和玩家用同一套规则）
export const AI_DECK_PRESET = [
  // 1费
  'zu','fu2','nu',
  // 2费
  'bing','gun','jian','du','bing_f','sheng','qi',
  // 3费
  'dao','qiang','gong','huo','fang','yun','yu','fei','bei','sun','po',
  // 4费
  'fu','dou','sha','jia','dun','zhao','zhang','liu','cao',
  // 5费
  'ji','guan','shou',
  // 6费
  'lu','zhen',
];

// ============================================================
//  解锁卡牌（玩家专属，AI 不会拥有）
//  通过 PlayerProgress 的解锁系统获得
// ============================================================
export const UNLOCK_CARDS = [
  {
    id: 'tianming',
    char: '天',
    attack: 3, health: 5, cost: 2,
    keywords: [KEYWORDS.HEAL],
    effect: '【天命】入场时回复己方英雄3血。新手礼物，第1场后解锁',
    onPlay: (state, card, side) => ({ heroHeal: { side, amount: 3 } }),
  },
  {
    id: 'zibao',
    char: '爆',
    attack: 3, health: 1, cost: 3,
    keywords: [],
    effect: '【自爆】被摧毁时，对敌方所有单位造成4点伤害',
    onDeath: (state, card, side) => ({ aoeEnemy: { side, damage: 4 } }),
  },
  {
    id: 'junling',
    char: '令',
    attack: 2, health: 4, cost: 4,
    keywords: [],
    effect: '【军令】入场时为己方场上所有其他单位+2攻击/+2生命',
    onPlay: (state, card, side) => ({ buffAllies: { side, atk: 2, hp: 2 } }),
  },
  {
    id: 'fuling',
    char: '伏',
    attack: 2, health: 3, cost: 3,
    keywords: [KEYWORDS.STEALTH],
    effect: '【伏兵】入场时随机召唤2个1/1"魂"',
    onPlay: (state, card, side) => ({ summonMulti: { side, cardId: 'hun', count: 2 } }),
  },
  {
    id: 'shengzhan',
    char: '圣',
    attack: 3, health: 6, cost: 5,
    keywords: [KEYWORDS.HEAL, KEYWORDS.SHIELD],
    effect: '【圣战】入场时回复己方英雄8血并提供4护盾',
    onPlay: (state, card, side) => ({
      heroHeal:   { side, amount: 8 },
      heroShield: { side, amount: 4 },
    }),
  },
  {
    id: 'wudi',
    char: '无',
    attack: 4, health: 6, cost: 5,
    keywords: [KEYWORDS.DIVINE, KEYWORDS.TAUNT],
    effect: '【无敌】神圣护盾+嘲讽；入场时为己方英雄提供"无敌"状态（本回合免疫伤害）',
    onPlay: (state, card, side) => ({ heroInvincible: { side, turns: 1 } }),
  },
  {
    id: 'shengui',
    char: '神',
    attack: 5, health: 6, cost: 4,
    keywords: [KEYWORDS.SWEEP],
    effect: '【神威】入场时对敌方所有单位各造成3点伤害；横扫',
    onPlay: (state, card, side) => ({ aoeEnemy: { side: state.oppName(side), damage: 3 } }),
  },
  {
    id: 'bawang',
    char: '霸',
    attack: 8, health: 8, cost: 6,
    keywords: [KEYWORDS.SWEEP, KEYWORDS.PIERCE, KEYWORDS.CRIT, KEYWORDS.TAUNT],
    effect: '【霸主】横扫+穿透+暴击+嘲讽，集大成者',
  },
];
