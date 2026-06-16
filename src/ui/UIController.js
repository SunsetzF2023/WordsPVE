// ============================================================
//  src/ui/UIController.js  –  主界面控制器
// ============================================================
import { createCardElement, createCardBack } from './CardRenderer.js';
import {
  triggerAttackFX,
  deathEffect,
  fusionEffect,
  healEffect,
  shieldRipple,
  floatText,
  centerOf,
} from './BattleEffects.js';

export class UIController {
  constructor(gameState) {
    this.state    = gameState;
    this.selected = null;   // { uid, zone: 'hand'|'board' }
    this.mode     = 'idle'; // 'idle' | 'selecting_target'

    this._bindElements();
    this._bindGameEvents();
    this._bindUIEvents();
    this.render();
  }

  // ── 绑定 DOM 元素 ──
  _bindElements() {
    this.els = {
      // 英雄区
      playerHp:      document.getElementById('player-hp'),
      playerMaxHp:   document.getElementById('player-max-hp'),
      playerHpBar:   document.getElementById('player-hp-bar'),
      playerShield:  document.getElementById('player-shield'),
      playerEnergy:  document.getElementById('player-energy'),
      playerMaxEnergy:document.getElementById('player-max-energy'),
      playerDeckCount:document.getElementById('player-deck-count'),

      aiHp:          document.getElementById('ai-hp'),
      aiMaxHp:       document.getElementById('ai-max-hp'),
      aiHpBar:       document.getElementById('ai-hp-bar'),
      aiShield:      document.getElementById('ai-shield'),
      aiEnergy:      document.getElementById('ai-energy'),
      aiMaxEnergy:   document.getElementById('ai-max-energy'),
      aiDeckCount:   document.getElementById('ai-deck-count'),

      // 场地
      aiBoard:       document.getElementById('ai-board'),
      playerBoard:   document.getElementById('player-board'),
      playerHand:    document.getElementById('player-hand'),
      aiHandCount:   document.getElementById('ai-hand-count'),

      // 按钮
      endTurnBtn:    document.getElementById('btn-end-turn'),
      restartBtn:    document.getElementById('btn-restart'),

      // 日志
      logList:       document.getElementById('log-list'),

      // 回合
      turnNum:       document.getElementById('turn-num'),
      phaseLabel:    document.getElementById('phase-label'),

      // 提示
      tooltip:       document.getElementById('tooltip'),
      toastArea:     document.getElementById('toast-area'),

      // 覆盖层
      overlay:       document.getElementById('game-overlay'),
      overlayTitle:  document.getElementById('overlay-title'),
      overlayMsg:    document.getElementById('overlay-msg'),
    };
  }

  _bindGameEvents() {
    document.addEventListener('game:stateChange', () => this.render());
    document.addEventListener('game:gameover',    (e) => this._showOverlay(e.detail.winner));

    // ── 特效事件 ──
    document.addEventListener('game:fxAttack', (e) => {
      const { attackerUid, targetUid, targetIsHero, damage, isCrit, keywords } = e.detail;
      triggerAttackFX({ attackerUid, targetUid, targetIsHero, damage, isCrit, keywords });
    });

    document.addEventListener('game:fxDeath', (e) => {
      const el = document.querySelector(`[data-uid="${e.detail.uid}"]`);
      if (el) deathEffect(el);
    });

    document.addEventListener('game:fxFusion', (e) => {
      const x = window.innerWidth / 2;
      const y = window.innerHeight / 2;
      fusionEffect(x, y, e.detail.char);
    });

    document.addEventListener('game:fxHeal', (e) => {
      const el = document.getElementById(e.detail.heroElId);
      if (el) {
        const r = el.getBoundingClientRect();
        healEffect(r.left + r.width / 2, r.top + r.height / 2, e.detail.amount);
      }
    });

    document.addEventListener('game:fxShield', (e) => {
      const el = document.getElementById(e.detail.heroElId);
      if (el) {
        const r = el.getBoundingClientRect();
        shieldRipple(r.left + r.width / 2, r.top + r.height / 2);
        floatText(r.left + r.width / 2, r.top - 10, `🛡️+${e.detail.amount}`, '#4ea8ff');
      }
    });
  }

  _bindUIEvents() {
    this.els.endTurnBtn.addEventListener('click', () => {
      if (this.state.phase !== 'player') return;
      this.selected = null;
      this.mode = 'idle';
      this.state.endTurn('player');
    });

    this.els.restartBtn.addEventListener('click', () => {
      this.selected = null;
      this.mode = 'idle';
      this._hideOverlay();
      this.state.reset();
    });

    // 攻击英雄按钮
    document.getElementById('ai-hero-area')?.addEventListener('click', () => {
      if (this.mode !== 'selecting_target') return;
      this._doAttack('hero');
    });
  }

  // ── 主渲染 ──
  render() {
    const { state } = this;
    const p = state.player;
    const a = state.ai;

    // 英雄信息
    this._renderHero('player', p);
    this._renderHero('ai', a);

    // AI 英雄头像高亮（选中攻击者时）
    const aiPortrait = document.getElementById('ai-portrait');
    if (aiPortrait) {
      aiPortrait.classList.toggle('hero--targetable', this.mode === 'selecting_target');
    }

    // 场牌
    this._renderBoard('ai',     a.board);
    this._renderBoard('player', p.board);

    // 手牌
    this._renderHand(p.hand);
    if (this.els.aiHandCount) this.els.aiHandCount.textContent = a.hand.length;

    // AI 手牌背面
    this._renderAiHandBacks(a.hand.length);

    // 日志
    this._renderLog();

    // 回合信息
    if (this.els.turnNum)   this.els.turnNum.textContent   = state.turn;
    if (this.els.phaseLabel) this.els.phaseLabel.textContent = state.phase === 'player' ? '你的回合' : 'AI 回合';

    // 按钮状态
    const isPlayer = state.phase === 'player';
    this.els.endTurnBtn.disabled = !isPlayer;
    this.els.endTurnBtn.classList.toggle('btn--disabled', !isPlayer);
  }

  _renderHero(who, s) {
    const prefix = who;
    const hpEl     = this.els[`${prefix}Hp`];
    const maxHpEl  = this.els[`${prefix}MaxHp`];
    const barEl    = this.els[`${prefix}HpBar`];
    const shieldEl = this.els[`${prefix}Shield`];
    const energyEl = this.els[`${prefix}Energy`];
    const maxEnEl  = this.els[`${prefix}MaxEnergy`];
    const deckEl   = this.els[`${prefix}DeckCount`];

    if (hpEl)     hpEl.textContent    = s.hp;
    if (maxHpEl)  maxHpEl.textContent = s.maxHp;
    if (barEl)    barEl.style.width   = `${Math.max(0, s.hp / s.maxHp * 100)}%`;
    if (shieldEl) {
      shieldEl.textContent = s.shield > 0 ? `🛡️${s.shield}` : '';
      shieldEl.style.display = s.shield > 0 ? 'inline' : 'none';
    }
    if (energyEl) energyEl.textContent = s.energy;
    if (maxEnEl)  maxEnEl.textContent  = s.maxEnergy;
    if (deckEl)   deckEl.textContent   = s.deck.length;
  }

  _renderBoard(who, board) {
    const container = this.els[`${who}Board`];
    if (!container) return;
    container.innerHTML = '';
    const isAI      = who === 'ai';
    const isPlayer  = !isAI;
    const canSelect = this.state.phase === 'player' && isPlayer;
    const canTarget = this.mode === 'selecting_target' && isAI;

    board.forEach(card => {
      const sel = this.selected?.uid === card.uid;
      const attacked = card.hasAttacked;
      const el = createCardElement({
        card,
        role: 'board',
        isAI,
        selected: sel,
        canTarget,
        disabled: isPlayer && (!canSelect || attacked),
      });

      if (isPlayer && canSelect && !attacked) {
        el.addEventListener('click', () => this._selectBoardCard(card));
      }
      if (canTarget) {
        el.addEventListener('click', () => this._doAttack(card.uid));
      }
      this._bindTooltip(el, card);
      container.appendChild(el);
    });
  }

  _renderHand(hand) {
    const container = this.els.playerHand;
    if (!container) return;
    container.innerHTML = '';
    hand.forEach(card => {
      const canPlay = card.cost <= this.state.player.energy &&
                      this.state.phase === 'player' &&
                      this.state.player.board.length < 6;
      const el = createCardElement({
        card,
        role: 'hand',
        isAI: false,
        selected: this.selected?.uid === card.uid && this.selected?.zone === 'hand',
        disabled: !canPlay,
      });
      if (canPlay) {
        el.addEventListener('click', () => this._selectHandCard(card));
      }
      this._bindTooltip(el, card);
      container.appendChild(el);
    });
  }

  _renderAiHandBacks(count) {
    const container = document.getElementById('ai-hand');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const { createCardBack } = this._getRendererModule();
      if (createCardBack) container.appendChild(createCardBack());
    }
  }

  _getRendererModule() {
    // 动态访问已导入的模块函数
    return { createCardBack };
  }

  _renderLog() {
    const el = this.els.logList;
    if (!el) return;
    el.innerHTML = '';
    this.state.log.slice(0, 20).forEach(msg => {
      const li = document.createElement('li');
      li.textContent = msg;
      el.appendChild(li);
    });
  }

  // ── 卡牌选择逻辑 ──
  _selectHandCard(card) {
    if (this.state.phase !== 'player') return;
    if (this.mode === 'selecting_target') {
      // 取消目标选择
      this.mode = 'idle';
      this.selected = null;
      this.render();
      return;
    }
    // 点击手牌 → 出牌
    const result = this.state.playCard('player', card.uid);
    if (!result.ok) {
      this._toast(result.msg, 'warn');
    }
    this.selected = null;
    this.mode = 'idle';
  }

  _selectBoardCard(card) {
    if (this.state.phase !== 'player') return;
    if (card.hasAttacked) { this._toast('该牌本回合已攻击', 'warn'); return; }
    if (card.frozen)      { this._toast(`${card.char} 被冻结，无法攻击`, 'warn'); return; }

    if (this.selected?.uid === card.uid) {
      // 取消选择
      this.selected = null;
      this.mode = 'idle';
      this.render();
      return;
    }

    this.selected = { uid: card.uid, zone: 'board' };
    this.mode = 'selecting_target';
    this._toast(`选中 ${card.char}，点击目标攻击（或点击敌方英雄区域）`, 'info');
    this.render();
  }

  _doAttack(targetUid) {
    if (!this.selected || this.mode !== 'selecting_target') return;
    const result = this.state.attack('player', this.selected.uid, targetUid);
    if (!result.ok) {
      this._toast(result.msg, 'warn');
    }
    this.selected = null;
    this.mode = 'idle';
    this.render();
  }

  // ── Tooltip ──
  _bindTooltip(el, card) {
    el.addEventListener('mouseenter', (e) => {
      const tt = this.els.tooltip;
      if (!tt) return;
      tt.innerHTML = `<strong>${card.char}</strong> ${card.rank}${card.suit}<br>
        ⚔️${card.attack} ❤️${card.health}/${card.maxHealth}  费用:${card.cost}<br>
        ${card.effect}`;
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

  // ── Toast 通知 ──
  _toast(msg, type = 'info') {
    const area = this.els.toastArea;
    if (!area) return;
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.textContent = msg;
    area.appendChild(t);
    setTimeout(() => t.classList.add('toast--visible'), 10);
    setTimeout(() => {
      t.classList.remove('toast--visible');
      setTimeout(() => t.remove(), 400);
    }, 2600);
  }

  // ── 游戏结束覆盖层 ──
  _showOverlay(winner) {
    const { overlay, overlayTitle, overlayMsg } = this.els;
    if (!overlay) return;
    overlayTitle.textContent = winner === 'player' ? '🎉 胜利！' : '💀 失败';
    overlayMsg.textContent   = winner === 'player'
      ? '你击败了 AI，汉字之力与你同在！'
      : 'AI 击败了你，再接再厉！';
    overlay.classList.add('overlay--visible');
  }

  _hideOverlay() {
    this.els.overlay?.classList.remove('overlay--visible');
  }
}
