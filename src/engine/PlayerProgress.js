// ============================================================
//  src/engine/PlayerProgress.js  –  玩家进度存储（localStorage）
//  所有数据存在浏览器本地，永久免费，无需后端
// ============================================================

const STORAGE_KEY = 'hanzi_card_progress';

const DEFAULT_PROGRESS = {
  totalGames:   0,   // 总场数
  wins:         0,   // 胜场
  losses:       0,   // 败场
  unlockedCards: [], // 已解锁的特殊卡 id 数组
  firstPlay:    null,// 首次游玩时间
  lastPlay:     null,// 最近游玩时间
};

// ── 读取进度 ──
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

// ── 保存进度 ──
function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('进度保存失败（localStorage 不可用）', e);
  }
}

// ── 记录一局结果 ──
export function recordGame(didWin) {
  const p = loadProgress();
  p.totalGames += 1;
  if (didWin) p.wins += 1; else p.losses += 1;
  if (!p.firstPlay) p.firstPlay = new Date().toISOString();
  p.lastPlay = new Date().toISOString();

  // 检查是否解锁新卡
  const newlyUnlocked = checkUnlocks(p);
  saveProgress(p);
  return { progress: p, newlyUnlocked };
}

// ── 重置进度（调试用） ──
export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULT_PROGRESS };
}

// ── 解锁条件检查 ──
//  每次调用时遍历 UNLOCK_MILESTONES，把满足条件且未解锁的加进去
function checkUnlocks(p) {
  const newCards = [];
  for (const milestone of UNLOCK_MILESTONES) {
    if (p.unlockedCards.includes(milestone.cardId)) continue;  // 已解锁
    if (milestone.condition(p)) {
      p.unlockedCards.push(milestone.cardId);
      newCards.push(milestone);
    }
  }
  return newCards;
}

// ============================================================
//  解锁里程碑定义
//  condition(progress) → boolean
// ============================================================
export const UNLOCK_MILESTONES = [
  {
    cardId:    'tianming',
    cardChar:  '天',
    gamesNeeded: 1,
    condition: p => p.totalGames >= 1,
    desc:      '完成第1场对局',
    flavor:    '天命所归，初心者的礼物',
  },
  {
    cardId:    'zibao',
    cardChar:  '爆',
    gamesNeeded: 3,
    condition: p => p.totalGames >= 3,
    desc:      '完成第3场对局',
    flavor:    '以身殉道，敌方全体生命-4',
  },
  {
    cardId:    'junling',
    cardChar:  '令',
    gamesNeeded: 5,
    condition: p => p.totalGames >= 5,
    desc:      '完成第5场对局',
    flavor:    '军令如山，入场时友方全体+2/+2',
  },
  {
    cardId:    'fuling',
    cardChar:  '伏',
    gamesNeeded: 8,
    condition: p => p.totalGames >= 8,
    desc:      '完成第8场对局',
    flavor:    '伏兵四起，入场时随机召唤2个1/1魂',
  },
  {
    cardId:    'shengzhan',
    cardChar:  '圣',
    gamesNeeded: 10,
    condition: p => p.totalGames >= 10,
    desc:      '完成第10场对局',
    flavor:    '圣战降临，入场时回复英雄8血+4护盾',
  },
  {
    cardId:    'wudi',
    cardChar:  '无',
    gamesNeeded: 15,
    condition: p => p.totalGames >= 15,
    desc:      '完成第15场对局',
    flavor:    '【无敌】此回合内免疫所有伤害（持续1回合）',
  },
  {
    cardId:    'shengui',
    cardChar:  '神',
    gamesNeeded: 5,
    condition: p => p.wins >= 5,
    desc:      '赢得5场对局',
    flavor:    '【神威】入场时对敌方所有单位造成3点伤害',
  },
  {
    cardId:    'bawang',
    cardChar:  '霸',
    gamesNeeded: 10,
    condition: p => p.wins >= 10,
    desc:      '赢得10场对局',
    flavor:    '【霸主】横扫+穿透+暴击+嘲讽，集大成者',
  },
];
