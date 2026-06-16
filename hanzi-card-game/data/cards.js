// ============================================================
//  data/cards.js  –  所有卡牌定义
// ============================================================

export const SUITS = ['♠', '♥', '♦', '♣'];

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// 关键词常量
export const KEYWORDS = {
  SWEEP:      'sweep',      // 横扫
  PIERCE:     'pierce',     // 穿透
  CRIT:       'crit',       // 暴击
  COMBO:      'combo',      // 连击
  SHIELD:     'shield',     // 护盾
  TAUNT:      'taunt',      // 嘲讽
  DRAGON:     'dragon',     // 枪出如龙（全体）
  HEAL:       'heal',       // 回血
  COUNTER:    'counter',    // 反制
  POISON:     'poison',     // 毒
  BURN:       'burn',       // 灼烧
  ARMOR:      'armor',      // 护甲（减伤）
  SUMMON:     'summon',     // 召唤
  SACRIFICE:  'sacrifice',  // 献祭
  RAGE:       'rage',       // 狂怒（攻击+1 每杀一个）
  REBIRTH:    'rebirth',    // 复生（死亡一次后以1血复活）
  DIVINE:     'divine',     // 神圣护盾（吸收一次伤害）
  FREEZE:     'freeze',     // 冻结（跳过下次攻击）
  ECHO:       'echo',       // 回响（复制一张手牌）
  DRAIN:      'drain',      // 吸血（造成伤害的50%回复自身）
};

/**
 * 基础卡牌池
 * attack  – 基础攻击力
 * health  – 基础生命值
 * cost    – 出牌费用（能量）
 * keywords – 词条数组
 * effect   – 效果描述（中文）
 * onPlay   – 打出时特殊效果 fn(state, card, side) 返回 mutation 对象
 */
export const BASE_CARDS = [
  // ── 基础战士 ──
  {
    id: 'dao',
    char: '刀',
    attack: 4, health: 9, cost: 3,
    keywords: [KEYWORDS.SWEEP],
    effect: '【横扫】攻击敌方相邻三张卡牌',
  },
  {
    id: 'qiang',
    char: '枪',
    attack: 6, health: 2, cost: 3,
    keywords: [KEYWORDS.PIERCE],
    effect: '【穿透】对卡牌造成伤害时同时直接伤害对方英雄',
  },
  {
    id: 'gun',
    char: '棍',
    attack: 5, health: 1, cost: 2,
    keywords: [KEYWORDS.CRIT],
    effect: '【暴击】25% 概率造成双倍伤害',
  },
  {
    id: 'jian',
    char: '剑',
    attack: 2, health: 7, cost: 2,
    keywords: [KEYWORDS.COMBO],
    effect: '【连击】15% 概率造成三次伤害',
  },
  {
    id: 'gong',
    char: '弓',
    attack: 3, health: 2, cost: 2,
    keywords: [KEYWORDS.CRIT, KEYWORDS.PIERCE],
    effect: '【暴击+穿透】远程攻击，25% 暴击，穿透直伤英雄',
  },
  // ── 防御系 ──
  {
    id: 'fang',
    char: '防',
    attack: 2, health: 8, cost: 2,
    keywords: [KEYWORDS.SHIELD],
    effect: '【护盾】出场时为己方英雄提供 3 点护盾',
    onPlay: (state, card, side) => ({ heroShield: { side, amount: 3 } }),
  },
  {
    id: 'zhen',
    char: '镇',
    attack: 8, health: 14, cost: 6,
    keywords: [KEYWORDS.TAUNT],
    effect: '【嘲讽】强制敌方攻击此卡',
  },
  {
    id: 'shou',
    char: '守',
    attack: 1, health: 10, cost: 2,
    keywords: [KEYWORDS.SHIELD, KEYWORDS.TAUNT],
    effect: '【护盾+嘲讽】出场为己方英雄提供 2 护盾，并嘲讽',
    onPlay: (state, card, side) => ({ heroShield: { side, amount: 2 } }),
  },
  {
    id: 'jia',
    char: '甲',
    attack: 2, health: 6, cost: 2,
    keywords: [KEYWORDS.ARMOR],
    effect: '【护甲】此卡每次受到伤害减少 1 点',
  },
  // ── 士兵系 ──
  {
    id: 'bing',
    char: '兵',
    attack: 3, health: 3, cost: 1,
    keywords: [KEYWORDS.RAGE],
    effect: '【狂怒】每消灭一个敌方卡牌，攻击力 +1',
  },
  {
    id: 'zu',
    char: '卒',
    attack: 2, health: 2, cost: 1,
    keywords: [],
    effect: '死亡时召唤一个 1/1 的"魂"',
    onDeath: (state, card, side) => ({ summon: { side, cardId: 'hun' } }),
  },
  // ── 技法系 ──
  {
    id: 'yun',
    char: '云',
    attack: 5, health: 5, cost: 3,
    keywords: [KEYWORDS.DRAIN],
    effect: '【吸血】造成伤害的 50% 回复自身生命',
  },
  {
    id: 'dou',
    char: '斗',
    attack: 7, health: 3, cost: 4,
    keywords: [KEYWORDS.CRIT, KEYWORDS.COMBO],
    effect: '【暴击+连击】好斗之士，25% 暴击，15% 三连击',
  },
  // ── 英雄系 ──
  {
    id: 'zhao',
    char: '赵',
    attack: 5, health: 6, cost: 4,
    keywords: [],
    effect: '可与"云"合并为赵云',
  },
  {
    id: 'guan',
    char: '关',
    attack: 6, health: 7, cost: 4,
    keywords: [KEYWORDS.TAUNT],
    effect: '【嘲讽】义薄云天，可与"羽"合并为关羽',
  },
  {
    id: 'yu',
    char: '羽',
    attack: 4, health: 5, cost: 3,
    keywords: [KEYWORDS.PIERCE],
    effect: '【穿透】可与"关"合并为关羽',
  },
  {
    id: 'fei',
    char: '飞',
    attack: 6, health: 4, cost: 3,
    keywords: [KEYWORDS.SWEEP],
    effect: '【横扫】可与"张"合并为张飞',
  },
  {
    id: 'zhang',
    char: '张',
    attack: 4, health: 6, cost: 3,
    keywords: [KEYWORDS.TAUNT],
    effect: '【嘲讽】可与"飞"合并为张飞',
  },
  {
    id: 'liu',
    char: '刘',
    attack: 3, health: 8, cost: 4,
    keywords: [KEYWORDS.HEAL],
    effect: '【回血】出场时回复己方英雄 3 点生命，可与"备"合并为刘备',
    onPlay: (state, card, side) => ({ heroHeal: { side, amount: 3 } }),
  },
  {
    id: 'bei',
    char: '备',
    attack: 2, health: 9, cost: 3,
    keywords: [KEYWORDS.SHIELD],
    effect: '【护盾】出场为己方英雄提供 4 点护盾，可与"刘"合并为刘备',
    onPlay: (state, card, side) => ({ heroShield: { side, amount: 4 } }),
  },
  // ── 法术/机制 ──
  {
    id: 'huo',
    char: '火',
    attack: 5, health: 1, cost: 2,
    keywords: [KEYWORDS.BURN],
    effect: '【灼烧】击中目标后每回合持续损失 1 点生命（持续 3 回合）',
  },
  {
    id: 'du',
    char: '毒',
    attack: 2, health: 1, cost: 1,
    keywords: [KEYWORDS.POISON],
    effect: '【毒】令目标每回合损失 2 点生命（持续 3 回合）',
  },
  {
    id: 'bing_f',
    char: '冰',
    attack: 3, health: 2, cost: 2,
    keywords: [KEYWORDS.FREEZE],
    effect: '【冻结】使一个敌方卡牌跳过下次攻击',
  },
  {
    id: 'yin',
    char: '引',
    attack: 1, health: 1, cost: 1,
    keywords: [KEYWORDS.ECHO],
    effect: '【回响】打出时复制一张手牌（随机）',
    onPlay: (state, card, side) => ({ echo: { side } }),
  },
  {
    id: 'sheng',
    char: '生',
    attack: 0, health: 1, cost: 1,
    keywords: [KEYWORDS.HEAL],
    effect: '打出时回复己方英雄 5 点生命',
    onPlay: (state, card, side) => ({ heroHeal: { side, amount: 5 } }),
  },
  {
    id: 'sha',
    char: '杀',
    attack: 8, health: 1, cost: 4,
    keywords: [KEYWORDS.DIVINE],
    effect: '【神圣护盾】此卡能吸收一次任何伤害',
  },
  {
    id: 'po',
    char: '破',
    attack: 6, health: 2, cost: 3,
    keywords: [KEYWORDS.COUNTER],
    effect: '【反制】消灭一张敌方卡牌的神圣护盾或护甲',
    onPlay: (state, card, side) => ({ counter: { side } }),
  },
  {
    id: 'hun',
    char: '魂',
    attack: 1, health: 1, cost: 0,
    keywords: [],
    effect: '由"卒"死亡召唤，无费用',
    isToken: true,
  },
];

// ── 合成卡牌（组合字） ──
export const FUSION_CARDS = [
  {
    id: 'zhao_yun',
    char: '赵云',
    requires: ['zhao', 'yun'],          // 需要哪两张
    attack: 10, health: 10, cost: 0,    // 合成无费用
    keywords: [KEYWORDS.DRAGON, KEYWORDS.DRAIN],
    effect: '【枪出如龙】对敌方全体卡牌各造成伤害；【吸血】50% 伤害回血',
  },
  {
    id: 'guan_yu',
    char: '关羽',
    requires: ['guan', 'yu'],
    attack: 12, health: 11, cost: 0,
    keywords: [KEYWORDS.TAUNT, KEYWORDS.SWEEP, KEYWORDS.PIERCE],
    effect: '【嘲讽+横扫+穿透】威震华夏，横扫并穿透伤害英雄',
  },
  {
    id: 'zhang_fei',
    char: '张飞',
    requires: ['zhang', 'fei'],
    attack: 11, health: 9, cost: 0,
    keywords: [KEYWORDS.TAUNT, KEYWORDS.SWEEP, KEYWORDS.CRIT],
    effect: '【嘲讽+横扫+暴击】长坂坡一声吼，横扫三敌，25% 暴击',
  },
  {
    id: 'liu_bei',
    char: '刘备',
    requires: ['liu', 'bei'],
    attack: 5, health: 16, cost: 0,
    keywords: [KEYWORDS.SHIELD, KEYWORDS.HEAL, KEYWORDS.TAUNT],
    effect: '出场为己方英雄提供 6 护盾并回复 5 点生命；【嘲讽】',
    onPlay: (state, card, side) => ({
      heroShield: { side, amount: 6 },
      heroHeal: { side, amount: 5 },
    }),
  },
];

// ── AI 卡组预设 ──
export const AI_DECK_PRESET = [
  'zhen','guan','zhang','fei','yu',
  'dao','qiang','gun','jian','gong',
  'fang','shou','jia','bing','zu',
  'yun','dou','zhao','huo','du',
  'bing_f','sha','po','sheng','liu',
  'bei',
];
