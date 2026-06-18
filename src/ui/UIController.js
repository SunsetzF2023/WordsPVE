// ============================================================
//  src/ui/UIController.js  –  主界面控制器 v2
// ============================================================
import { createCardElement, createCardBack } from './CardRenderer.js';
import {
  triggerAttackFX, deathEffect, fusionEffect,
  healEffect, shieldRipple, floatText, centerOf,
  heroDamageEffect, divineBlockEffect,
} from './BattleEffects.js';

export class UIController {
  constructor(gameState) {
    this.state    = gameState;
    this.selected = null;   // { uid, zone }
    this.mode     = 'idle'; // 'idle' | 'selecting_target'
    this._bindElements();
    this._bindGameEvents();
    this._bindUIEvents();
    this.render();
  }

  _bindElements() {
    this.els = {
      playerHp: document.getElementById('player-hp'),
      playerMaxHp: document.getElementById('player-max-hp'),
      playerHpBar: document.getElementById('player-hp-bar'),
      playerShield: document.getElementById('player-shield'),
      playerEnergy: document.getElementById('player-energy'),
      playerMaxEnergy: document.getElementById('player-max-energy'),
      playerDeckCount: document.getElementById('player-deck-count'),

      aiHp: document.getElementById('ai-hp'),
      aiMaxHp: document.getElementById('ai-max-hp'),
      aiHpBar: document.getElementById('ai-hp-bar'),
      aiShield: document.getElementById('ai-shield'),
      aiEnergy: document.getElementById('ai-energy'),
      aiMaxEnergy: document.getElementById('ai-max-energy'),
      aiDeckCount: document.getElementById('ai-deck-count'),
      aiName: document.getElementById('ai-name'),

      aiBoard: document.getElementById('ai-board'),
      playerBoard: document.getElementById('player-board'),
      playerHand: document.getElementById('player-hand'),
      aiHand: document.getElementById('ai-hand'),

      endTurnBtn: document.getElementById('btn-end-turn'),
      restartBtn: document.getElementById('btn-restart'),
      logList: document.getElementById('log-list'),
      turnNum: document.getElementById('turn-num'),
      phaseLabel: document.getElementById('phase-label'),
      tooltip: document.getElementById('tooltip'),
      toastArea: document.getElementById('toast-area'),
      overlay: document.getElementById('game-overlay'),
      overlayTitle: document.getElementById('overlay-title'),
      overlayMsg: document.getElementById('overlay-msg'),
    };
  }

  _bindGameEvents() {
    document.addEventListener('game:stateChange', () => this.render());
    document.addEventListener('game:gameover',    (e) => this._showOverlay(e.detail.winner));

    document.addEventListener('game:fxAttack', (e) => {
      const { attackerUid, targetUid, targetIsHero, damage, isCrit, keywords, isCounter } = e.detail;
      triggerAttackFX({ attackerUid, targetUid, targetIsHero, damage, isCrit, keywords, isCounter });
    });
    document.addEventListener('game:fxDeath', (e) => {
      const el = document.querySelector(`[data-uid="${e.detail.uid}"]`);
      if (el) deathEffect(el);
    });
    document.addEventListener('game:fxFusion', (e) => {
      fusionEffect(window.innerWidth / 2, window.innerHeight / 2, e.detail.char);
    });
    document.addEventListener('game:fxHeal', (e) => {
      const el = document.getElementById(e.detail.heroElId);
      if (el) { const { x, y } = centerOf(el); healEffect(x, y, e.detail.amount); }
    });
    document.addEventListener('game:fxShield', (e) => {
      const el = document.getElementById(e.detail.heroElId);
      if (el) {
        const { x, y } = centerOf(el);
        shieldRipple(x, y);
        floatText(x, y - 10, `🛡️+${e.detail.amount}`, '#4ea8ff');
      }
    });
    document.addEventListener('game:fxHeroDamage', (e) => {
      const elId = e.detail.who === 'player' ? 'player-portrait' : 'ai-portrait';
      heroDamageEffect(elId, e.detail.damage);
    });
    document.addEventListener('game:fxDivineBlock', (e) => {
      const el = document.querySelector(`[data-uid="${e.detail.uid}"]`);
      if (el) divineBlockEffect(el);
    });
  }

  _bindUIEvents() {
    this.els.endTurnBtn.addEventListener('click', () => {
      if (this.state.phase !== 'player') return;
      this.selected = null; this.mode = 'idle';
      this.state.endTurn('player');
    });
    this.els.restartBtn.addEventListener('click', () => {
      this.selected = null; this.mode = 'idle';
      this._hideOverlay();
      this.state.reset();
    });
    document.getElementById('ai-hero-area')?.addEventListener('click', () => {
      if (this.mode !== 'selecting_target') return;
      this._doAttack('hero');
    });
  }

  // ── 主渲染 ──
  render() {
    const { state } = this;
    this._renderHero('player', state.player);
    this._renderHero('ai',     state.ai);

    // AI 名字
    if (this.els.aiName) this.els.aiName.textContent = state.aiName || 'AI';

    // AI 英雄头像高亮
    const aiPortrait = document.getElementById('ai-portrait');
    if (aiPortrait) aiPortrait.classList.toggle('hero--targetable', this.mode === 'selecting_target');

    this._renderBoard('ai',     state.ai.board);
    this._renderBoard('player', state.player.board);
    this._renderHand(state.player.hand);
    this._renderAiHand(state.ai.hand.length);
    this._renderLog();

    if (this.els.turnNum)    this.els.turnNum.textContent    = state.turn;
    if (this.els.phaseLabel) this.els.phaseLabel.textContent = state.phase === 'player' ? '你的回合' : `${state.aiName} 的回合`;

    const isPlayer = state.phase === 'player';
    this.els.endTurnBtn.disabled = !isPlayer;
    this.els.endTurnBtn.classList.toggle('btn--disabled', !isPlayer);
  }

  _renderHero(who, s) {
    const p = who;
    const hp    = this.els[`${p}Hp`];
    const maxHp = this.els[`${p}MaxHp`];
    const bar   = this.els[`${p}HpBar`];
    const shld  = this.els[`${p}Shield`];
    const en    = this.els[`${p}Energy`];
    const maxEn = this.els[`${p}MaxEnergy`];
    const deck  = this.els[`${p}DeckCount`];

    if (hp)    hp.textContent    = s.hp;
    if (maxHp) maxHp.textContent = s.maxHp;
    if (bar) {
      const pct = Math.max(0, s.hp / s.maxHp * 100);
      bar.style.width      = `${pct}%`;
      bar.style.background = pct > 50 ? 'var(--green)' : pct > 25 ? '#ffe04e' : '#ff4e4e';
    }
    if (shld) {
      shld.textContent   = s.shield > 0 ? `🛡️${s.shield}` : '';
      shld.style.display = s.shield > 0 ? 'inline' : 'none';
    }
    if (en)    en.textContent    = s.energy;
    if (maxEn) maxEn.textContent = s.maxEnergy;
    if (deck)  deck.textContent  = s.deck.length;

    // 英雄 DoT 状态图标
    const dotElId = `${who}-hero-dot`;
    let dotEl = document.getElementById(dotElId);
    if (!dotEl) {
      dotEl = document.createElement('div');
      dotEl.id = dotElId;
      dotEl.style.cssText = 'font-size:0.65rem;display:flex;gap:4px;margin-top:2px;';
      const infoEl = document.querySelector(`#${who === 'player' ? 'player' : 'ai'}-area .hero-info`);
      if (infoEl) infoEl.appendChild(dotEl);
    }
    let dotHtml = '';
    if (s.burnStacks   > 0) dotHtml += `<span title="灼烧">🔥×${s.burnStacks}</span>`;
    if (s.poisonStacks > 0) dotHtml += `<span title="中毒">☠️×${s.poisonStacks}</span>`;
    if (s.invincibleTurns > 0) dotHtml += `<span title="无敌">✨无敌</span>`;
    dotEl.innerHTML = dotHtml;
  }

  _renderBoard(who, board) {
    const container = this.els[`${who}Board`];
    if (!container) return;
    container.innerHTML = '';
    if (board.length === 0) {
      container.innerHTML = `<div class="board-empty">${who === 'ai' ? '敌方战场' : '我方战场（点击手牌出牌）'}</div>`;
      return;
    }
    const isAI     = who === 'ai';
    const canTarget= this.mode === 'selecting_target' && isAI;

    board.forEach(card => {
      const sel      = this.selected?.uid === card.uid;
      const attacked = card.hasAttacked;
      const canAct   = !isAI && this.state.phase === 'player' && !attacked;
      const el = createCardElement({
        card, role: 'board', isAI,
        selected: sel,
        canTarget,
        disabled: !isAI && (!canAct),
      });

      if (!isAI && canAct) el.addEventListener('click', () => this._selectBoardCard(card));
      if (canTarget)        el.addEventListener('click', () => this._doAttack(card.uid));
      this._bindTooltip(el, card);
      container.appendChild(el);
    });
  }

  _renderHand(hand) {
    const container = this.els.playerHand;
    if (!container) return;
    container.innerHTML = '';
    hand.forEach(card => {
      const canPlay = card.cost <= this.state.player.energy
                   && this.state.phase === 'player'
                   && this.state.player.board.length < 6;
      const el = createCardElement({
        card, role: 'hand', isAI: false,
        selected: this.selected?.uid === card.uid && this.selected?.zone === 'hand',
        disabled: !canPlay,
      });
      if (canPlay) el.addEventListener('click', () => this._selectHandCard(card));
      this._bindTooltip(el, card);
      container.appendChild(el);
    });
  }

  _renderAiHand(count) {
    const container = this.els.aiHand;
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < Math.min(count, 8); i++) {
      container.appendChild(createCardBack());
    }
  }

  _renderLog() {
    const el = this.els.logList;
    if (!el) return;
    el.innerHTML = this.state.log.slice(0, 25).map(msg =>
      `<li>${msg}</li>`
    ).join('');
  }

  // ── 交互 ──
  _selectHandCard(card) {
    if (this.state.phase !== 'player') return;
    if (this.mode === 'selecting_target') {
      this.mode = 'idle'; this.selected = null; this.render(); return;
    }
    const result = this.state.playCard('player', card.uid);
    if (!result.ok) this._toast(result.msg, 'warn');
    this.selected = null; this.mode = 'idle';
  }

  _selectBoardCard(card) {
    if (this.state.phase !== 'player') return;
    if (card.hasAttacked) { this._toast('该牌本回合已攻击', 'warn'); return; }
    if (card.frozen)      { this._toast(`${card.char} 被冻结，无法攻击`, 'warn'); return; }
    if (this.selected?.uid === card.uid) {
      this.selected = null; this.mode = 'idle'; this.render(); return;
    }
    this.selected = { uid: card.uid, zone: 'board' };
    this.mode = 'selecting_target';
    this._toast(`选中【${card.char}】— 点击敌方目标或英雄发起攻击`, 'info');
    this.render();
  }

  _doAttack(targetUid) {
    if (!this.selected || this.mode !== 'selecting_target') return;
    const result = this.state.attack('player', this.selected.uid, targetUid);
    if (!result.ok) this._toast(result.msg, 'warn');
    this.selected = null; this.mode = 'idle'; this.render();
  }

  _bindTooltip(el, card) {
    el.addEventListener('mouseenter', () => {
      const tt = this.els.tooltip;
      if (!tt) return;
      tt.innerHTML = `<strong>${card.char}</strong> ${card.rank}${card.suit}<br>
        ⚔️${card.attack} &nbsp; ❤️${card.health}/${card.maxHealth} &nbsp; 费:${card.cost}<br>
        <span style="color:#6a9a6a">${card.effect}</span>`;
      tt.style.display = 'block';
    });
    el.addEventListener('mousemove', (e) => {
      const tt = this.els.tooltip;
      if (!tt) return;
      tt.style.left = `${e.clientX + 14}px`;
      tt.style.top  = `${e.clientY + 14}px`;
    });
    el.addEventListener('mouseleave', () => {
      if (this.els.tooltip) this.els.tooltip.style.display = 'none';
    });
  }

  _toast(msg, type = 'info') {
    const area = this.els.toastArea;
    if (!area) return;
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.textContent = msg;
    area.appendChild(t);
    setTimeout(() => t.classList.add('toast--visible'), 10);
    setTimeout(() => { t.classList.remove('toast--visible'); setTimeout(() => t.remove(), 400); }, 2800);
  }

  _showOverlay(winner) {
    const { overlay, overlayTitle, overlayMsg } = this.els;
    if (!overlay) return;
    overlayTitle.textContent = winner === 'player' ? '🎉 胜利！' : '💀 失败';
    overlayMsg.textContent   = winner === 'player'
      ? `你击败了 ${this.state.aiName}，汉字之力与你同在！`
      : `${this.state.aiName} 击败了你，再接再厉！`;
    overlay.classList.add('overlay--visible');
  }
  _hideOverlay() { this.els.overlay?.classList.remove('overlay--visible'); }
}
