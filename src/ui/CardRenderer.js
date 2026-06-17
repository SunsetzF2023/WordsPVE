// ============================================================
//  src/ui/CardRenderer.js  –  卡牌 DOM 渲染 v2
// ============================================================
import { KEYWORDS } from '../../data/cards.js';

const KW_LABELS = {
  [KEYWORDS.SWEEP]:   '横扫', [KEYWORDS.PIERCE]: '穿透', [KEYWORDS.CRIT]:   '暴击',
  [KEYWORDS.COMBO]:   '连击', [KEYWORDS.SHIELD]: '护盾', [KEYWORDS.TAUNT]:  '嘲讽',
  [KEYWORDS.DRAGON]:  '如龙', [KEYWORDS.HEAL]:   '回血', [KEYWORDS.COUNTER]:'反制',
  [KEYWORDS.POISON]:  '毒',   [KEYWORDS.BURN]:   '灼烧', [KEYWORDS.ARMOR]:  '护甲',
  [KEYWORDS.RAGE]:    '狂怒', [KEYWORDS.DIVINE]: '神盾', [KEYWORDS.FREEZE]: '冻结',
  [KEYWORDS.ECHO]:    '回响', [KEYWORDS.DRAIN]:  '吸血', [KEYWORDS.REBIRTH]:'复生',
  [KEYWORDS.STEALTH]: '潜行', [KEYWORDS.RUSH]:   '急袭',
};

const SUIT_COLOR = { '♠':'#a0ffa0','♣':'#a0ffa0','♥':'#ff8080','♦':'#ff8080' };

export function createCardElement({ card, role, isAI=false, selected=false, canTarget=false, disabled=false }) {
  const el = document.createElement('div');
  const hpRatio = card.health / card.maxHealth;
  const hpColor = hpRatio > 0.6 ? '#4eff91' : hpRatio > 0.3 ? '#ffe04e' : '#ff4e4e';
  const sColor  = SUIT_COLOR[card.suit] || '#a0ffa0';

  el.className = [
    'card',
    `card--${role}`,
    isAI ? 'card--ai' : 'card--player',
    selected   ? 'card--selected'   : '',
    canTarget  ? 'card--targetable' : '',
    disabled   ? 'card--disabled'   : '',
    card.frozen ? 'card--frozen'    : '',
    card.keywords.includes(KEYWORDS.TAUNT)  ? 'card--taunt'  : '',
    card.keywords.includes(KEYWORDS.DIVINE) && !card.divineDone ? 'card--divine' : '',
    card.hasAttacked && !isAI ? 'card--exhausted' : '',
  ].filter(Boolean).join(' ');

  el.dataset.uid = card.uid;

  const kwHtml = card.keywords.map(k =>
    `<span class="kw-tag kw-${k}">${KW_LABELS[k] || k}</span>`
  ).join('');

  let statusHtml = '';
  if (card.frozen)        statusHtml += `<span class="si" title="冻结">❄️</span>`;
  if (card.burnStacks)    statusHtml += `<span class="si" title="灼烧">🔥${card.burnStacks}</span>`;
  if (card.poisonStacks)  statusHtml += `<span class="si" title="毒">☠️${card.poisonStacks}</span>`;
  if (card.keywords.includes(KEYWORDS.RUSH) && !card.hasAttacked && !isAI)
                          statusHtml += `<span class="si" title="急袭">⚡</span>`;

  el.innerHTML = `
    <div class="card__corner card__corner--tl">
      <span style="color:${sColor};font-size:.58rem;font-family:monospace">${card.rank}</span>
      <span style="color:${sColor};font-size:.58rem">${card.suit}</span>
    </div>
    <div class="card__corner card__corner--br" style="transform:rotate(180deg)">
      <span style="color:${sColor};font-size:.58rem;font-family:monospace">${card.rank}</span>
      <span style="color:${sColor};font-size:.58rem">${card.suit}</span>
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
    <div class="card__hp-bar"><div class="card__hp-fill" style="width:${Math.max(0,hpRatio*100)}%;background:${hpColor}"></div></div>
  `;
  return el;
}

export function createCardBack() {
  const el = document.createElement('div');
  el.className = 'card card--back';
  el.innerHTML = `<div class="card__back-text">汉</div>`;
  return el;
}
