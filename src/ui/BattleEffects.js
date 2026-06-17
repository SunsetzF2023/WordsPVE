// ============================================================
//  src/ui/BattleEffects.js  –  战斗特效系统 v2
// ============================================================

let _container = null;
function getContainer() {
  if (!_container) {
    _container = document.createElement('div');
    _container.id = 'fx-layer';
    _container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:8000;overflow:hidden;';
    document.body.appendChild(_container);
  }
  return _container;
}

export function centerOf(el) {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function cardElByUid(uid) {
  return document.querySelector(`[data-uid="${uid}"]`);
}

const FX = {
  damage:  ['#ff4e4e','#ff8c4e','#ffdc4e'],
  heal:    ['#4eff91','#a0ffc0','#ffffff'],
  shield:  ['#4ea8ff','#a0d4ff','#ffffff'],
  crit:    ['#ffdc4e','#ffffff','#ff8c4e'],
  pierce:  ['#ff4e9e','#ff80c0','#ffffff'],
  sweep:   ['#ff8c4e','#ffdc4e','#ff4e4e'],
  freeze:  ['#9edcff','#c0f0ff','#ffffff'],
  counter: ['#a0ffa0','#60ff80','#ffffff'],
  fusion:  ['#3aff6a','#ffdc4e','#ff4e9e','#4ea8ff'],
  death:   ['#6a4a6a','#4a2a4a','#2a102a'],
  divine:  ['#fff4a0','#ffe060','#ffffff'],
};

// ── 浮动文字 ──
export function floatText(x, y, text, color = '#ff4e4e', size = 1) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = `
    position:absolute;left:${x}px;top:${y}px;
    transform:translate(-50%,-50%);
    font-family:'Courier New',monospace;font-size:${1.1*size}rem;font-weight:bold;
    color:${color};text-shadow:0 0 8px ${color},0 2px 4px rgba(0,0,0,0.8);
    pointer-events:none;white-space:nowrap;
    animation:fx-float 1.1s ease-out forwards;z-index:8100;
  `;
  getContainer().appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// ── 粒子 ──
export function particles(x, y, colors, count = 14, spread = 60) {
  const container = getContainer();
  for (let i = 0; i < count; i++) {
    const p     = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
    const dist  = spread * (0.4 + Math.random() * 0.6);
    const size  = 3 + Math.random() * 5;
    const dur   = 500 + Math.random() * 400;
    p.style.cssText = `
      position:absolute;left:${x}px;top:${y}px;
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};box-shadow:0 0 ${size*2}px ${color};
      pointer-events:none;transform:translate(-50%,-50%);
      transition:transform ${dur}ms cubic-bezier(.2,.8,.4,1),opacity ${dur}ms ease-out;
    `;
    container.appendChild(p);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      p.style.transform = `translate(calc(-50% + ${Math.cos(angle)*dist}px),calc(-50% + ${Math.sin(angle)*dist}px))`;
      p.style.opacity   = '0';
    }));
    setTimeout(() => p.remove(), dur + 50);
  }
}

// ── 攻击冲刺动画 ──
export function attackAnim(attackerEl, targetEl, onImpact) {
  if (!attackerEl || !targetEl) { onImpact?.(); return; }
  const ar = attackerEl.getBoundingClientRect();
  const tr = targetEl.getBoundingClientRect();
  const dx = (tr.left + tr.width/2) - (ar.left + ar.width/2);
  const dy = (tr.top  + tr.height/2)- (ar.top  + ar.height/2);
  const d  = Math.sqrt(dx*dx + dy*dy);
  const nx = dx/d * Math.min(d*0.55, 90);
  const ny = dy/d * Math.min(d*0.55, 90);

  attackerEl.style.transition = 'transform 0.11s cubic-bezier(.4,0,1,1)';
  attackerEl.style.transform  = `translate(${nx}px,${ny}px) scale(1.1)`;
  attackerEl.style.zIndex     = '500';

  setTimeout(() => {
    onImpact?.();
    attackerEl.style.transition = 'transform 0.2s cubic-bezier(0,1,.4,1)';
    attackerEl.style.transform  = '';
    setTimeout(() => { attackerEl.style.transition=''; attackerEl.style.zIndex=''; }, 230);
  }, 115);
}

// ── 命中闪烁 ──
export function hitFlash(el, color = '#ff4e4e') {
  if (!el) return;
  el.style.outline   = `3px solid ${color}`;
  el.style.boxShadow = `0 0 20px ${color},inset 0 0 14px ${color}44`;
  el.style.animation = 'fx-shake 0.28s ease';
  setTimeout(() => { el.style.outline=''; el.style.boxShadow=''; el.style.animation=''; }, 340);
}

// ── 护盾波纹 ──
export function shieldRipple(x, y) {
  const el = document.createElement('div');
  el.style.cssText = `
    position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);
    width:20px;height:20px;border-radius:50%;border:3px solid #4ea8ff;
    box-shadow:0 0 12px #4ea8ff;pointer-events:none;animation:fx-ripple 0.6s ease-out forwards;
  `;
  getContainer().appendChild(el);
  setTimeout(() => el.remove(), 700);
}

// ── 合体光效 ──
export function fusionEffect(x, y, charText) {
  const beam = document.createElement('div');
  beam.style.cssText = `
    position:absolute;left:${x}px;top:0;width:4px;height:100vh;transform:translateX(-50%);
    background:linear-gradient(180deg,transparent,#3aff6a,#ffdc4e,#ff4e9e,transparent);
    opacity:0;animation:fx-beam 0.7s ease-out forwards;pointer-events:none;
  `;
  getContainer().appendChild(beam);
  particles(x, y, FX.fusion, 36, 110);
  const label = document.createElement('div');
  label.textContent = `✨ ${charText} 降临！`;
  label.style.cssText = `
    position:absolute;left:${x}px;top:${y-60}px;
    transform:translate(-50%,-50%) scale(0.5);
    font-family:'Courier New',monospace;font-size:1.5rem;font-weight:bold;
    color:#ffdc4e;text-shadow:0 0 20px #ffdc4e,0 0 8px #fff;
    pointer-events:none;animation:fx-fusion-label 1.4s ease-out forwards;white-space:nowrap;
  `;
  getContainer().appendChild(label);
  setTimeout(() => { beam.remove(); label.remove(); }, 1500);
}

// ── 死亡 ──
export function deathEffect(cardEl) {
  if (!cardEl) return;
  const { x, y } = centerOf(cardEl);
  particles(x, y, FX.death, 16, 50);
  cardEl.style.transition = 'transform 0.35s ease,opacity 0.35s ease';
  cardEl.style.transform  = 'scale(0.5) rotate(15deg)';
  cardEl.style.opacity    = '0';
}

// ── 冻结 ──
export function freezeEffect(cardEl) {
  if (!cardEl) return;
  const { x, y } = centerOf(cardEl);
  particles(x, y, FX.freeze, 16, 45);
  floatText(x, y - 30, '❄️ 冻结！', '#9edcff');
}

// ── 回血 ──
export function healEffect(x, y, amount) {
  particles(x, y, FX.heal, 12, 40);
  floatText(x, y - 20, `+${amount} ❤️`, '#4eff91', 1.1);
}

// ── 神圣护盾格挡 ──
export function divineBlockEffect(cardEl) {
  if (!cardEl) return;
  const { x, y } = centerOf(cardEl);
  particles(x, y, FX.divine, 14, 45);
  floatText(x, y - 20, '✨ 神圣护盾！', '#fff4a0', 1.0);
}

// ── 英雄受伤 ──
export function heroDamageEffect(heroElId, damage) {
  const el = document.getElementById(heroElId);
  if (!el) return;
  const { x, y } = centerOf(el);
  hitFlash(el, '#ff4e4e');
  floatText(x, y - 20, `-${damage}`, '#ff4e4e', 1.3);
  particles(x, y, FX.damage, 10, 35);
}

// ── 综合攻击特效 ──
export function triggerAttackFX({ attackerUid, targetUid, targetIsHero, damage, isCrit, keywords, isCounter }) {
  const attackerEl = cardElByUid(attackerUid);
  const targetEl   = targetIsHero
    ? document.getElementById(attackerUid === 'hero' ? 'player-portrait' : 'ai-hero-area')
    : cardElByUid(targetUid);

  attackAnim(attackerEl, targetEl, () => {
    const tPos = targetEl ? centerOf(targetEl) : { x: window.innerWidth/2, y: window.innerHeight/2 };

    // 反击用绿色
    const mainColor = isCounter ? '#a0ffa0' : (isCrit ? '#ffdc4e' : '#ff4e4e');
    hitFlash(targetEl, mainColor);
    particles(tPos.x, tPos.y, isCrit ? FX.crit : (isCounter ? FX.counter : FX.damage), isCrit ? 22 : 12, isCrit ? 70 : 40);
    floatText(tPos.x, tPos.y - 20,
      isCounter ? `↩️${damage}` : (isCrit ? `💥${damage}` : `-${damage}`),
      mainColor, isCrit ? 1.4 : (isCounter ? 1.1 : 1.1)
    );

    if (keywords?.includes('pierce'))  setTimeout(() => { floatText(tPos.x, tPos.y+20,'🔱穿透','#ff4e9e',0.85); particles(tPos.x,tPos.y,FX.pierce,8,30); }, 120);
    if (keywords?.includes('sweep'))   setTimeout(() => { floatText(tPos.x, tPos.y-40,'🌀横扫','#ff8c4e',0.9); particles(tPos.x,tPos.y,FX.sweep,18,75); }, 80);
    if (keywords?.includes('freeze'))  setTimeout(() => { const el=cardElByUid(targetUid); if(el) freezeEffect(el); }, 200);
    if (keywords?.includes('dragon'))  setTimeout(() => { floatText(tPos.x, tPos.y-60,'🐉枪出如龙','#ff4e4e',1.3); particles(tPos.x,tPos.y,FX.damage,32,110); }, 60);
  });
}

// ── 注入 CSS 关键帧 ──
(function injectKeyframes() {
  if (document.getElementById('fx-keyframes')) return;
  const s = document.createElement('style');
  s.id = 'fx-keyframes';
  s.textContent = `
    @keyframes fx-float {
      0%   { opacity:1; transform:translate(-50%,-50%) scale(1); }
      60%  { opacity:1; transform:translate(-50%,-130%) scale(1.15); }
      100% { opacity:0; transform:translate(-50%,-190%) scale(0.8); }
    }
    @keyframes fx-shake {
      0%,100% { transform:translateX(0); }
      20% { transform:translateX(-6px) rotate(-1.5deg); }
      40% { transform:translateX(6px)  rotate(1.5deg); }
      60% { transform:translateX(-4px); }
      80% { transform:translateX(4px); }
    }
    @keyframes fx-ripple {
      0%   { width:20px;height:20px;opacity:1; }
      100% { width:120px;height:120px;opacity:0; }
    }
    @keyframes fx-beam {
      0%   { opacity:0; }
      30%  { opacity:0.9; }
      100% { opacity:0; }
    }
    @keyframes fx-fusion-label {
      0%   { opacity:0;  transform:translate(-50%,-50%) scale(0.4); }
      20%  { opacity:1;  transform:translate(-50%,-50%) scale(1.25); }
      70%  { opacity:1;  transform:translate(-50%,-50%) scale(1.0); }
      100% { opacity:0;  transform:translate(-50%,-80%) scale(0.9); }
    }
  `;
  document.head.appendChild(s);
})();
