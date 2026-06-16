// ============================================================
//  src/ui/BattleEffects.js  –  战斗特效系统
//  包含：伤害数字浮动、攻击闪光、粒子爆炸、状态特效、合体光效
// ============================================================

// ── 特效容器（挂载到 body） ──
let _container = null;
function getContainer() {
  if (!_container) {
    _container = document.createElement('div');
    _container.id = 'fx-layer';
    _container.style.cssText = `
      position:fixed;inset:0;pointer-events:none;z-index:8000;overflow:hidden;
    `;
    document.body.appendChild(_container);
  }
  return _container;
}

// ── 工具：获取元素中心坐标 ──
function centerOf(el) {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function cardElByUid(uid) {
  return document.querySelector(`[data-uid="${uid}"]`);
}

// ── 颜色主题 ──
const FX_COLORS = {
  damage:   ['#ff4e4e', '#ff8c4e', '#ffdc4e'],
  heal:     ['#4eff91', '#a0ffc0', '#ffffff'],
  shield:   ['#4ea8ff', '#a0d4ff', '#ffffff'],
  crit:     ['#ffdc4e', '#ffffff', '#ff8c4e'],
  pierce:   ['#ff4e9e', '#ff80c0', '#ffffff'],
  sweep:    ['#ff8c4e', '#ffdc4e', '#ff4e4e'],
  freeze:   ['#9edcff', '#c0f0ff', '#ffffff'],
  poison:   ['#a0ff60', '#60c030', '#ffffff'],
  burn:     ['#ff7730', '#ffaa50', '#ffdc4e'],
  divine:   ['#fff4a0', '#ffe060', '#ffffff'],
  fusion:   ['#3aff6a', '#ffdc4e', '#ff4e9e', '#4ea8ff'],
  death:    ['#6a4a6a', '#4a2a4a', '#2a102a'],
};

// ============================================================
//  1. 浮动伤害 / 数字文字
// ============================================================
export function floatText(x, y, text, color = '#ff4e4e', size = 1) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = `
    position:absolute;
    left:${x}px; top:${y}px;
    transform:translate(-50%,-50%);
    font-family:'Courier New',monospace;
    font-size:${1.1 * size}rem;
    font-weight:bold;
    color:${color};
    text-shadow:0 0 8px ${color},0 2px 4px rgba(0,0,0,0.8);
    pointer-events:none;
    white-space:nowrap;
    animation:fx-float 1.1s ease-out forwards;
    z-index:8100;
  `;
  getContainer().appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// ============================================================
//  2. 粒子爆炸
// ============================================================
export function particles(x, y, colors, count = 14, spread = 60) {
  const container = getContainer();
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const color  = colors[Math.floor(Math.random() * colors.length)];
    const angle  = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
    const dist   = spread * (0.4 + Math.random() * 0.6);
    const size   = 3 + Math.random() * 5;
    const dur    = 500 + Math.random() * 400;
    const tx     = Math.cos(angle) * dist;
    const ty     = Math.sin(angle) * dist;

    p.style.cssText = `
      position:absolute;
      left:${x}px; top:${y}px;
      width:${size}px; height:${size}px;
      border-radius:50%;
      background:${color};
      box-shadow:0 0 ${size * 2}px ${color};
      pointer-events:none;
      animation:none;
      transform:translate(-50%,-50%);
      transition:transform ${dur}ms cubic-bezier(.2,.8,.4,1),
                 opacity   ${dur}ms ease-out;
    `;
    container.appendChild(p);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        p.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
        p.style.opacity   = '0';
      });
    });
    setTimeout(() => p.remove(), dur + 50);
  }
}

// ============================================================
//  3. 卡牌攻击动画（向目标方向冲刺再复位）
// ============================================================
export function attackAnim(attackerEl, targetEl, onImpact) {
  if (!attackerEl || !targetEl) { onImpact?.(); return; }

  const ar = attackerEl.getBoundingClientRect();
  const tr = targetEl.getBoundingClientRect();
  const dx = (tr.left + tr.width / 2) - (ar.left + ar.width / 2);
  const dy = (tr.top  + tr.height/ 2) - (ar.top  + ar.height/ 2);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist * Math.min(dist * 0.55, 80);
  const ny = dy / dist * Math.min(dist * 0.55, 80);

  attackerEl.style.transition = 'transform 0.12s cubic-bezier(.4,0,1,1)';
  attackerEl.style.transform  = `translate(${nx}px,${ny}px) scale(1.08)`;
  attackerEl.style.zIndex     = '500';

  setTimeout(() => {
    onImpact?.();
    attackerEl.style.transition = 'transform 0.22s cubic-bezier(0,1,.4,1)';
    attackerEl.style.transform  = '';
    setTimeout(() => {
      attackerEl.style.transition = '';
      attackerEl.style.zIndex     = '';
    }, 250);
  }, 130);
}

// ============================================================
//  4. 命中闪光（目标卡片红色抖动）
// ============================================================
export function hitFlash(targetEl, color = '#ff4e4e') {
  if (!targetEl) return;
  const prev = targetEl.style.cssText;
  targetEl.style.outline    = `3px solid ${color}`;
  targetEl.style.boxShadow  = `0 0 18px ${color}, inset 0 0 12px ${color}44`;
  targetEl.style.animation  = 'fx-shake 0.28s ease';
  setTimeout(() => {
    targetEl.style.outline   = '';
    targetEl.style.boxShadow = '';
    targetEl.style.animation = '';
  }, 320);
}

// ============================================================
//  5. 护盾波纹
// ============================================================
export function shieldRipple(x, y) {
  const el = document.createElement('div');
  el.style.cssText = `
    position:absolute;
    left:${x}px; top:${y}px;
    transform:translate(-50%,-50%);
    width:20px; height:20px;
    border-radius:50%;
    border:3px solid #4ea8ff;
    box-shadow:0 0 12px #4ea8ff;
    pointer-events:none;
    animation:fx-ripple 0.6s ease-out forwards;
  `;
  getContainer().appendChild(el);
  setTimeout(() => el.remove(), 700);
}

// ============================================================
//  6. 合体特效（大光柱 + 彩色粒子）
// ============================================================
export function fusionEffect(x, y, charText) {
  // 光柱
  const beam = document.createElement('div');
  beam.style.cssText = `
    position:absolute;
    left:${x}px; top:0;
    width:4px; height:100vh;
    transform:translateX(-50%);
    background:linear-gradient(180deg,transparent,#3aff6a,#ffdc4e,#3aff6a,transparent);
    opacity:0;
    animation:fx-beam 0.7s ease-out forwards;
    pointer-events:none;
  `;
  getContainer().appendChild(beam);

  // 大爆炸粒子
  particles(x, y, FX_COLORS.fusion, 30, 100);

  // 大字提示
  const label = document.createElement('div');
  label.textContent = `✨ ${charText} 降临！`;
  label.style.cssText = `
    position:absolute;
    left:${x}px; top:${y - 60}px;
    transform:translate(-50%,-50%) scale(0.5);
    font-family:'Courier New',monospace;
    font-size:1.4rem;
    font-weight:bold;
    color:#ffdc4e;
    text-shadow:0 0 16px #ffdc4e, 0 0 6px #fff;
    pointer-events:none;
    animation:fx-fusion-label 1.4s ease-out forwards;
    white-space:nowrap;
  `;
  getContainer().appendChild(label);

  setTimeout(() => { beam.remove(); label.remove(); }, 1500);
}

// ============================================================
//  7. 死亡特效（暗色粒子 + 卡片淡出）
// ============================================================
export function deathEffect(cardEl) {
  if (!cardEl) return;
  const { x, y } = centerOf(cardEl);
  particles(x, y, FX_COLORS.death, 18, 50);
  cardEl.style.transition = 'transform 0.35s ease,opacity 0.35s ease';
  cardEl.style.transform  = 'scale(0.6) rotate(10deg)';
  cardEl.style.opacity    = '0';
}

// ============================================================
//  8. 冻结特效（冰晶粒子）
// ============================================================
export function freezeEffect(cardEl) {
  if (!cardEl) return;
  const { x, y } = centerOf(cardEl);
  particles(x, y, FX_COLORS.freeze, 16, 45);
  floatText(x, y - 30, '❄️ 冻结！', '#9edcff');
  cardEl.style.filter = 'hue-rotate(150deg) brightness(0.75)';
}

// ============================================================
//  9. 回血特效（绿色上升粒子）
// ============================================================
export function healEffect(x, y, amount) {
  particles(x, y, FX_COLORS.heal, 12, 40);
  floatText(x, y - 20, `+${amount} ❤️`, '#4eff91', 1.1);
}

// ============================================================
//  10. 暴击特效
// ============================================================
export function critEffect(x, y) {
  particles(x, y, FX_COLORS.crit, 20, 70);
  floatText(x, y - 10, '💥 暴击！', '#ffdc4e', 1.3);
}

// ============================================================
//  11. 穿透特效（红色箭头线条）
// ============================================================
export function pierceEffect(x, y) {
  floatText(x, y, '🔱 穿透！', '#ff4e9e', 0.9);
  particles(x, y, FX_COLORS.pierce, 10, 35);
}

// ============================================================
//  12. 横扫特效（橙色扇形粒子）
// ============================================================
export function sweepEffect(x, y) {
  floatText(x, y - 30, '🌀 横扫！', '#ff8c4e', 1.0);
  particles(x, y, FX_COLORS.sweep, 22, 80);
}

// ============================================================
//  13. 枪出如龙（全体攻击）
// ============================================================
export function dragonEffect(x, y) {
  particles(x, y, FX_COLORS.damage, 36, 120);
  floatText(x, y - 50, '🐉 枪出如龙！', '#ff4e4e', 1.4);
}

// ============================================================
//  综合：根据关键词自动触发特效
// ============================================================
export function triggerAttackFX(options) {
  const {
    attackerUid,
    targetUid,
    targetIsHero,
    damage,
    isCrit,
    keywords,   // 攻击方关键词数组
    onImpact,
  } = options;

  const attackerEl = cardElByUid(attackerUid);
  const targetEl   = targetIsHero
    ? document.getElementById('ai-hero-area')
    : cardElByUid(targetUid);

  attackAnim(attackerEl, targetEl, () => {
    const tPos = targetEl ? centerOf(targetEl) : { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // 基础命中
    hitFlash(targetEl, isCrit ? '#ffdc4e' : '#ff4e4e');
    particles(tPos.x, tPos.y, isCrit ? FX_COLORS.crit : FX_COLORS.damage, isCrit ? 20 : 12, isCrit ? 65 : 40);
    floatText(tPos.x, tPos.y - 20, isCrit ? `💥${damage}` : `-${damage}`, isCrit ? '#ffdc4e' : '#ff4e4e', isCrit ? 1.4 : 1.1);

    if (isCrit) critEffect(tPos.x, tPos.y);
    if (keywords?.includes('pierce'))  { setTimeout(() => pierceEffect(tPos.x, tPos.y + 20), 120); }
    if (keywords?.includes('sweep'))   { setTimeout(() => sweepEffect(tPos.x, tPos.y), 80); }
    if (keywords?.includes('dragon'))  { setTimeout(() => dragonEffect(tPos.x, tPos.y), 60); }
    if (keywords?.includes('freeze'))  { setTimeout(() => { if(targetEl) freezeEffect(targetEl); }, 200); }

    onImpact?.();
  });
}

// ============================================================
//  注入全局 CSS 关键帧
// ============================================================
(function injectKeyframes() {
  if (document.getElementById('fx-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'fx-keyframes';
  style.textContent = `
    @keyframes fx-float {
      0%   { opacity:1; transform:translate(-50%,-50%) scale(1); }
      60%  { opacity:1; transform:translate(-50%,-120%) scale(1.15); }
      100% { opacity:0; transform:translate(-50%,-180%) scale(0.8); }
    }
    @keyframes fx-shake {
      0%,100% { transform:translateX(0); }
      20%     { transform:translateX(-5px) rotate(-1deg); }
      40%     { transform:translateX(5px)  rotate(1deg); }
      60%     { transform:translateX(-3px); }
      80%     { transform:translateX(3px); }
    }
    @keyframes fx-ripple {
      0%   { width:20px;height:20px;opacity:1; }
      100% { width:110px;height:110px;opacity:0; }
    }
    @keyframes fx-beam {
      0%   { opacity:0; }
      30%  { opacity:0.85; }
      100% { opacity:0; }
    }
    @keyframes fx-fusion-label {
      0%   { opacity:0; transform:translate(-50%,-50%) scale(0.5); }
      20%  { opacity:1; transform:translate(-50%,-50%) scale(1.2); }
      70%  { opacity:1; transform:translate(-50%,-50%) scale(1.0); }
      100% { opacity:0; transform:translate(-50%,-80%) scale(0.9); }
    }
  `;
  document.head.appendChild(style);
})();
