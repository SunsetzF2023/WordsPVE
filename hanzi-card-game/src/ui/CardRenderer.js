// ============================================================
//  src/ui/CardRenderer.js  –  单张卡牌 DOM 渲染
// ============================================================
import { KEYWORDS } from '../../data/cards.js';

const KEYWORD_LABELS = {
  [KEYWORDS.SWEEP]:     '横扫',
  [KEYWORDS.PIERCE]:    '穿透',
  [KEYWORDS.CRIT]:      '暴击',
  [KEYWORDS.COMBO]:     '连击',
  [KEYWORDS.SHIELD]:    '护盾',
  [KEYWORDS.TAUNT]:     '嘲讽',
  [KEYWORDS.DRAGON]:    '枪出如龙',
  [KEYWORDS.HEAL]:      '回血',
  [KEYWORDS.COUNTER]:   '反制',
  [KEYWORDS.POISON]:    '毒',
  [KEYWORDS.BURN]:      '灼烧',
  [KEYWORDS.ARMOR]:     '护甲',
  [KEYWORDS.SUMMON]:    '召唤',
  [KEYWORDS.SACRIFICE]: '献祭',
  [KEYWORDS.RAGE]:      '狂怒',
  [KEYWORDS.REBIRTH]:   '复生',
  [KEYWORDS.DIVINE]:    '神圣护盾',
  [KEYWORDS.FREEZE]:    '冻结',
  [KEYWORDS.ECHO]:      '回响',
  [KEYWORDS.DRAIN]:     '吸血',
};

const SUIT_COLOR = { '♠': '#a0ffa0', '♣': '#a0ffa0', '♥': '#ff8080', '♦': '#ff8080' };

/**
 * 创建一张卡牌 DOM 元素
 * @param {object} card    – 卡牌实例
 * @param {string} role    – 'hand' | 'board'
 * @param {bool}   isAI    – 是否 AI 方
 * @param {bool}   selected – 是否被选中
 * @param {bool}   canTarget – 是否可作为攻击目标（高亮）
 * @param {bool}   disabled  – 灰显（费用不足 / 已攻击）
 */
export function createCardElement({ card, role, isAI = false, selected = false, canTarget = false, disabled = false }) {
  const el = document.createElement('div');
  el.className = [
    'card',
    role === 'hand' ? 'card--hand' : 'card--board',
    isAI ? 'card--ai' : 'card--player',
    selected    ? 'card--selected'  : '',
    canTarget   ? 'card--targetable': '',
    disabled    ? 'card--disabled'  : '',
    card.frozen ? 'card--frozen'    : '',
    card.keywords.includes(KEYWORDS.TAUNT) ? 'card--taunt' : '',
    card.keywords.includes(KEYWORDS.DIVINE) && !card.divineDone ? 'card--divine' : '',
  ].filter(Boolean).join(' ');

  el.dataset.uid = card.uid;

  // HP 百分比 → 颜色
  const hpRatio = card.health / card.maxHealth;
  const hpColor = hpRatio > 0.6 ? '#4eff91' : hpRatio > 0.3 ? '#ffe04e' : '#ff4e4e';

  const suitColor = SUIT_COLOR[card.suit] || '#a0ffa0';

  // 词条标签
  const kwHtml = card.keywords.map(k =>
    `<span class="kw-tag kw-${k}">${KEYWORD_LABELS[k] || k}</span>`
  ).join('');

  // 状态图标
  let statusHtml = '';
  if (card.frozen)       statusHtml += `<span class="status-icon" title="冻结">❄️</span>`;
  if (card.burnStacks)   statusHtml += `<span class="status-icon" title="灼烧${card.burnStacks}">🔥${card.burnStacks}</span>`;
  if (card.poisonStacks) statusHtml += `<span class="status-icon" title="毒${card.poisonStacks}">☠️${card.poisonStacks}</span>`;

  el.innerHTML = `
    <div class="card__corner card__corner--tl">
      <span class="card__rank" style="color:${suitColor}">${card.rank}</span>
      <span class="card__suit"  style="color:${suitColor}">${card.suit}</span>
    </div>
    <div class="card__corner card__corner--br">
      <span class="card__rank" style="color:${suitColor}">${card.rank}</span>
      <span class="card__suit"  style="color:${suitColor}">${card.suit}</span>
    </div>

    <div class="card__cost">${card.cost}</div>
    <div class="card__char">${card.char}</div>
    <div class="card__stats">
      <span class="card__atk">⚔️${card.attack}</span>
      <span class="card__hp" style="color:${hpColor}">❤️${card.health}</span>
    </div>
    <div class="card__keywords">${kwHtml}</div>
    <div class="card__status">${statusHtml}</div>
    <div class="card__effect">${card.effect}</div>
  `;

  // HP 条
  const hpBar = document.createElement('div');
  hpBar.className = 'card__hp-bar';
  const hpFill = document.createElement('div');
  hpFill.className = 'card__hp-fill';
  hpFill.style.width  = `${Math.max(0, hpRatio * 100)}%`;
  hpFill.style.background = hpColor;
  hpBar.appendChild(hpFill);
  el.appendChild(hpBar);

  return el;
}

/** 创建 AI 手牌背面（隐藏内容） */
export function createCardBack() {
  const el = document.createElement('div');
  el.className = 'card card--back';
  el.innerHTML = `<div class="card__back-text">汉</div>`;
  return el;
}
