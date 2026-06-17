// ============================================================
//  src/ui/UnlockUI.js  –  解锁界面 & 进度展示
// ============================================================
import { loadProgress, resetProgress, UNLOCK_MILESTONES } from '../engine/PlayerProgress.js';
import { UNLOCK_CARDS } from '../../data/cards.js';

// ── 初始化进度面板（侧边栏底部） ──
export function initProgressPanel() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const panel = document.createElement('div');
  panel.id = 'progress-panel';
  panel.innerHTML = `
    <div class="sidebar-title" style="margin-top:8px;cursor:pointer" id="progress-toggle">
      📊 成就进度 <span id="progress-arrow">▼</span>
    </div>
    <div id="progress-body" style="display:none">
      <div id="progress-stats" class="progress-stats"></div>
      <div id="unlock-list" class="unlock-list"></div>
    </div>
  `;
  sidebar.appendChild(panel);

  document.getElementById('progress-toggle').addEventListener('click', () => {
    const body  = document.getElementById('progress-body');
    const arrow = document.getElementById('progress-arrow');
    const open  = body.style.display !== 'none';
    body.style.display  = open ? 'none' : 'block';
    arrow.textContent   = open ? '▼' : '▲';
    if (!open) renderProgressPanel(); // 展开时刷新数据
  });
}

// ── 渲染进度内容 ──
export function renderProgressPanel() {
  const p        = loadProgress();
  const statsEl  = document.getElementById('progress-stats');
  const listEl   = document.getElementById('unlock-list');
  if (!statsEl || !listEl) return;

  const winRate = p.totalGames > 0 ? Math.round(p.wins / p.totalGames * 100) : 0;
  statsEl.innerHTML = `
    <div class="ps-row"><span>总场数</span><span class="ps-val">${p.totalGames}</span></div>
    <div class="ps-row"><span>胜场</span><span class="ps-val" style="color:var(--green)">${p.wins}</span></div>
    <div class="ps-row"><span>胜率</span><span class="ps-val" style="color:var(--gold)">${winRate}%</span></div>
  `;

  listEl.innerHTML = UNLOCK_MILESTONES.map(m => {
    const unlocked = p.unlockedCards.includes(m.cardId);
    const card     = UNLOCK_CARDS.find(c => c.id === m.cardId);
    return `
      <div class="unlock-item ${unlocked ? 'unlock-item--done' : ''}">
        <div class="unlock-char ${unlocked ? '' : 'unlock-char--locked'}">${unlocked ? m.cardChar : '？'}</div>
        <div class="unlock-info">
          <div class="unlock-name">${unlocked ? `【${m.cardChar}】` : '???'}</div>
          <div class="unlock-cond">${m.desc}</div>
          ${unlocked && card ? `<div class="unlock-effect">${card.effect}</div>` : ''}
        </div>
        <div class="unlock-badge">${unlocked ? '✅' : '🔒'}</div>
      </div>
    `;
  }).join('');
}

// ── 解锁弹窗（游戏结束时有新解锁则显示） ──
export function showUnlockPopup(newlyUnlocked) {
  if (!newlyUnlocked || newlyUnlocked.length === 0) return;

  // 移除旧弹窗
  document.getElementById('unlock-popup')?.remove();

  const popup = document.createElement('div');
  popup.id = 'unlock-popup';
  popup.innerHTML = `
    <div class="unlock-popup__box">
      <div class="unlock-popup__title">🎉 解锁新卡牌！</div>
      ${newlyUnlocked.map(m => {
        const card = UNLOCK_CARDS.find(c => c.id === m.cardId);
        return `
          <div class="unlock-popup__card">
            <div class="unlock-popup__char">${m.cardChar}</div>
            <div class="unlock-popup__desc">
              <strong>【${m.cardChar}】</strong>已加入你的牌库！<br>
              <span style="color:var(--text-dim);font-size:.75rem">${card?.effect || ''}</span>
            </div>
          </div>
        `;
      }).join('')}
      <div class="unlock-popup__sub">下一局起生效</div>
      <button class="btn" id="unlock-popup-close" style="width:auto;padding:6px 20px;margin-top:8px">知道了</button>
    </div>
  `;
  document.body.appendChild(popup);
  document.getElementById('unlock-popup-close').addEventListener('click', () => popup.remove());
  setTimeout(() => popup.remove(), 8000);
}

// ── 游戏结束时更新进度面板（外部调用） ──
export function onGameEnd(progress, newlyUnlocked) {
  renderProgressPanel();
  showUnlockPopup(newlyUnlocked);
}
