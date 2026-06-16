// ============================================================
//  src/engine/GameState.js  –  游戏状态管理
// ============================================================
import { BASE_CARDS, FUSION_CARDS, AI_DECK_PRESET, KEYWORDS, SUITS, RANKS } from '../../data/cards.js';

const BOARD_LIMIT = 6;
const MAX_HP      = 40;
const HAND_LIMIT  = 8;
const MAX_ENERGY  = 10;
let   UID_COUNTER = 0;
const uid = () => `c${++UID_COUNTER}`;

// ── 工具 ──
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function rand(n) { return Math.floor(Math.random() * n); }

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── 生成一张实例卡 ──
function makeCard(base, suit, rank) {
  return {
    uid: uid(),
    id: base.id,
    char: base.char,
    suit: suit || SUITS[rand(SUITS.length)],
    rank: rank || RANKS[rand(RANKS.length)],
    attack: base.attack,
    health: base.health,
    maxHealth: base.health,
    cost: base.cost,
    keywords: [...(base.keywords || [])],
    effect: base.effect,
    onPlay: base.onPlay || null,
    onDeath: base.onDeath || null,
    isToken: !!base.isToken,
    // 状态
    frozen: false,
    burnStacks: 0,
    poisonStacks: 0,
    rageKills: 0,
    divineDone: false,   // 神圣护盾是否已消耗
    hasAttacked: false,
  };
}

// ── 生成并洗牌一副 52 张的牌组 ──
function buildDeck(cardIds) {
  const pool = [];
  cardIds.forEach(id => {
    const base = BASE_CARDS.find(c => c.id === id);
    if (!base || base.isToken) return;
    SUITS.forEach(suit => {
      RANKS.slice(0, Math.ceil(RANKS.length / cardIds.length * 2)).forEach(rank => {
        pool.push(makeCard(base, suit, rank));
      });
    });
  });
  // 确保至少 26 张
  while (pool.length < 26) {
    const base = BASE_CARDS[rand(BASE_CARDS.length)];
    if (!base.isToken) pool.push(makeCard(base));
  }
  return shuffleArray(pool).slice(0, 26);
}

// ── 生成随机玩家牌组 ──
function buildPlayerDeck() {
  const ids = BASE_CARDS.filter(c => !c.isToken).map(c => c.id);
  const picked = shuffleArray(ids).slice(0, 16);
  return buildDeck(picked);
}

// ── 生成 AI 牌组 ──
function buildAIDeck() {
  return buildDeck(AI_DECK_PRESET);
}

// ============================================================
//  GameState  –  核心状态类
// ============================================================
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    UID_COUNTER = 0;
    this.turn    = 1;
    this.phase   = 'player'; // 'player' | 'ai' | 'gameover'
    this.winner  = null;
    this.log     = [];

    this.player = {
      hp:        MAX_HP,
      maxHp:     MAX_HP,
      shield:    0,
      energy:    3,
      maxEnergy: 3,
      deck:      buildPlayerDeck(),
      hand:      [],
      board:     [],
    };

    this.ai = {
      hp:        MAX_HP,
      maxHp:     MAX_HP,
      shield:    0,
      energy:    3,
      maxEnergy: 3,
      deck:      buildAIDeck(),
      hand:      [],
      board:     [],
    };

    // 初始手牌
    for (let i = 0; i < 4; i++) this._draw('player');
    for (let i = 0; i < 4; i++) this._draw('ai');

    this._addLog('游戏开始！你的回合。');
    this._emit('stateChange');
  }

  // ── 内部日志 ──
  _addLog(msg) {
    this.log.unshift(msg);
    if (this.log.length > 60) this.log.pop();
  }

  // ── 事件总线（简易） ──
  _emit(event, data) {
    document.dispatchEvent(new CustomEvent(`game:${event}`, { detail: { state: this, ...data } }));
  }

  // ── 取得一方状态 ──
  side(who) { return who === 'player' ? this.player : this.ai; }
  opp(who)  { return who === 'player' ? this.ai    : this.player; }
  oppName(who) { return who === 'player' ? 'ai' : 'player'; }

  // ── 抽牌 ──
  _draw(who) {
    const s = this.side(who);
    if (s.hand.length >= HAND_LIMIT) return;
    if (s.deck.length === 0) {
      this._damageHero(who, 3);
      this._addLog(`${who === 'player' ? '你' : 'AI'} 牌库耗尽，英雄受到 3 点伤害！`);
      return;
    }
    const card = s.deck.shift();
    s.hand.push(card);
  }

  // ── 英雄受伤 ──
  _damageHero(who, amount) {
    const s = this.side(who);
    let dmg = amount;
    if (s.shield > 0) {
      const absorbed = Math.min(s.shield, dmg);
      s.shield -= absorbed;
      dmg -= absorbed;
    }
    s.hp = clamp(s.hp - dmg, 0, s.maxHp);
    if (s.hp <= 0) this._gameOver(this.oppName(who));
  }

  // ── 英雄回血 ──
  _healHero(who, amount) {
    const s = this.side(who);
    s.hp = clamp(s.hp + amount, 0, s.maxHp);
  }

  _gameOver(winner) {
    this.phase  = 'gameover';
    this.winner = winner;
    this._addLog(winner === 'player' ? '🎉 你赢了！' : '💀 你输了...');
    this._emit('gameover', { winner });
  }

  // ── 卡牌受伤 ──
  _damageCard(who, card, amount) {
    // 神圣护盾
    if (card.keywords.includes(KEYWORDS.DIVINE) && !card.divineDone) {
      card.divineDone = true;
      this._addLog(`${card.char} 的神圣护盾抵挡了伤害！`);
      return 0;
    }
    // 护甲
    let dmg = amount;
    if (card.keywords.includes(KEYWORDS.ARMOR)) dmg = Math.max(0, dmg - 1);
    card.health -= dmg;
    if (card.health <= 0) this._killCard(who, card);
    return dmg;
  }

  _killCard(who, card) {
    const s = this.side(who);
    const idx = s.board.indexOf(card);
    if (idx === -1) return;
    s.board.splice(idx, 1);
    this._addLog(`${card.char} 被消灭了`);
    this._emit('fxDeath', { uid: card.uid });
    // 死亡效果
    if (card.onDeath) {
      const mutation = card.onDeath(this, card, who);
      this._applyMutation(mutation, who);
    }
    // 狂怒：通知己方所有 rage 卡
    const opp = this.oppName(who);
    this.side(opp).board.forEach(c => {
      if (c.keywords.includes(KEYWORDS.RAGE)) {
        c.attack += 1;
        c.rageKills += 1;
      }
    });
    this._emit('stateChange');
  }

  // ── 应用副作用对象 ──
  _applyMutation(mut, who) {
    if (!mut) return;
    const opp = this.oppName(who);
    if (mut.heroShield) {
      const { side, amount } = mut.heroShield;
      this.side(side).shield += amount;
      this._addLog(`${side === 'player' ? '你' : 'AI'} 获得 ${amount} 点护盾`);
      const heroEl = side === 'player' ? 'player-portrait' : 'ai-portrait';
      this._emit('fxShield', { heroElId: heroEl, amount });
    }
    if (mut.heroHeal) {
      const { side, amount } = mut.heroHeal;
      this._healHero(side, amount);
      this._addLog(`${side === 'player' ? '你' : 'AI'} 回复了 ${amount} 点生命`);
      const heroEl = side === 'player' ? 'player-portrait' : 'ai-portrait';
      this._emit('fxHeal', { heroElId: heroEl, amount });
    }
    if (mut.summon) {
      const tokenBase = BASE_CARDS.find(c => c.id === mut.summon.cardId);
      if (tokenBase && this.side(mut.summon.side).board.length < BOARD_LIMIT) {
        const token = makeCard(tokenBase);
        this.side(mut.summon.side).board.push(token);
        this._addLog(`召唤了 ${token.char}`);
      }
    }
    if (mut.echo) {
      const hand = this.side(mut.echo.side).hand;
      if (hand.length > 0 && hand.length < HAND_LIMIT) {
        const src = hand[rand(hand.length)];
        const copy = { ...src, uid: uid() };
        hand.push(copy);
        this._addLog(`回响：复制了一张 ${copy.char}`);
      }
    }
    if (mut.counter) {
      // 移除随机一个敌方卡的神圣护盾/护甲
      const target = this.side(opp).board.find(c =>
        c.keywords.includes(KEYWORDS.DIVINE) || c.keywords.includes(KEYWORDS.ARMOR)
      );
      if (target) {
        target.keywords = target.keywords.filter(
          k => k !== KEYWORDS.DIVINE && k !== KEYWORDS.ARMOR
        );
        this._addLog(`破 击碎了 ${target.char} 的护甲/神圣护盾！`);
      }
    }
  }

  // ── 出牌 ──
  playCard(who, cardUid) {
    if (this.phase !== who) return { ok: false, msg: '不是你的回合' };
    const s = this.side(who);
    if (s.board.length >= BOARD_LIMIT) return { ok: false, msg: '场上已满（最多 6 张）' };
    const idx = s.hand.findIndex(c => c.uid === cardUid);
    if (idx === -1) return { ok: false, msg: '找不到该牌' };
    const card = s.hand[idx];
    if (card.cost > s.energy) return { ok: false, msg: `能量不足（需要 ${card.cost}，当前 ${s.energy}）` };

    s.energy -= card.cost;
    s.hand.splice(idx, 1);
    s.board.push(card);
    this._addLog(`${who === 'player' ? '你' : 'AI'} 打出了【${card.char}】`);

    // onPlay 效果
    if (card.onPlay) {
      const mutation = card.onPlay(this, card, who);
      this._applyMutation(mutation, who);
    }

    this._checkFusion(who);
    this._emit('stateChange');
    return { ok: true };
  }

  // ── 检测合成 ──
  _checkFusion(who) {
    const board = this.side(who).board;
    FUSION_CARDS.forEach(fusion => {
      const reqs = fusion.requires;
      const cards = reqs.map(rid => board.find(c => c.id === rid));
      if (cards.every(Boolean)) {
        // 移除原卡
        reqs.forEach(rid => {
          const i = board.findIndex(c => c.id === rid);
          if (i !== -1) board.splice(i, 1);
        });
        const fused = makeCard({ ...fusion, onPlay: fusion.onPlay || null, onDeath: null });
        board.push(fused);
        this._addLog(`✨ 合体！【${fusion.char}】降临！`);
        this._emit('fxFusion', { char: fusion.char });
        if (fused.onPlay) {
          const mutation = fused.onPlay(this, fused, who);
          this._applyMutation(mutation, who);
        }
      }
    });
    // 花色/数字合并（同 id + suit + rank 的三张合一）
    this._checkSuitMerge(who);
  }

  _checkSuitMerge(who) {
    const board = this.side(who).board;
    const groups = {};
    board.forEach(c => {
      const key = `${c.id}_${c.suit}_${c.rank}`;
      (groups[key] = groups[key] || []).push(c);
    });
    Object.values(groups).forEach(group => {
      if (group.length >= 2) {
        const merged = group[0];
        group.slice(1).forEach(other => {
          merged.attack += other.attack;
          merged.health += other.health;
          merged.maxHealth += other.maxHealth;
          const i = board.indexOf(other);
          if (i !== -1) board.splice(i, 1);
        });
        this._addLog(`🃏 ${group.length} 张相同花色数字的【${merged.char}】合并，数值叠加！`);
      }
    });
  }

  // ── 攻击 ──
  attack(who, attackerUid, targetUid) {
    if (this.phase !== who) return { ok: false, msg: '不是你的回合' };
    const s   = this.side(who);
    const opp = this.opp(who);
    const atk = s.board.find(c => c.uid === attackerUid);
    if (!atk) return { ok: false, msg: '找不到攻击方' };
    if (atk.hasAttacked) return { ok: false, msg: '该牌本回合已攻击' };
    if (atk.frozen) { atk.frozen = false; return { ok: false, msg: `${atk.char} 被冻结，跳过攻击` }; }

    // 嘲讽检查
    const taunters = opp.board.filter(c => c.keywords.includes(KEYWORDS.TAUNT));

    if (targetUid === 'hero') {
      // 攻击英雄
      if (taunters.length > 0) return { ok: false, msg: '敌方有嘲讽卡，必须先攻击嘲讽目标！' };
      const isCrit = atk.keywords.includes(KEYWORDS.CRIT) && Math.random() < 0.25;
      const dmg = isCrit ? atk.attack * 2 : atk.attack;
      if (isCrit) this._addLog(`💥 暴击！`);
      this._addLog(`${atk.char} 攻击敌方英雄，造成 ${dmg} 点伤害`);
      // 发射特效事件
      this._emit('fxAttack', {
        attackerUid, targetUid: 'hero', targetIsHero: true,
        damage: dmg, isCrit, keywords: atk.keywords,
      });
      this._damageHero(this.oppName(who), dmg);
      if (atk.keywords.includes(KEYWORDS.DRAIN)) {
        const heal = Math.floor(dmg * 0.5);
        atk.health = Math.min(atk.health + heal, atk.maxHealth);
      }
    } else {
      // 攻击卡牌
      const def = opp.board.find(c => c.uid === targetUid);
      if (!def) return { ok: false, msg: '找不到目标' };
      if (taunters.length > 0 && !def.keywords.includes(KEYWORDS.TAUNT)) {
        return { ok: false, msg: '必须先攻击嘲讽目标！' };
      }
      this._resolveAttack(who, atk, def);
    }
    atk.hasAttacked = true;
    this._emit('stateChange');
    return { ok: true };
  }

  _calcDamage(card) {
    let dmg = card.attack;
    const isCrit = card.keywords.includes(KEYWORDS.CRIT) && Math.random() < 0.25;
    if (isCrit) {
      dmg *= 2;
      this._addLog(`💥 暴击！`);
    }
    card._lastCrit = isCrit;
    return dmg;
  }

  _resolveAttack(who, atk, def) {
    const oppSide = this.oppName(who);
    const hits = (atk.keywords.includes(KEYWORDS.COMBO) && Math.random() < 0.15) ? 3 : 1;

    for (let h = 0; h < hits; h++) {
      if (!this.side(oppSide).board.includes(def)) break;
      const dmg = this._calcDamage(atk);
      const isCrit = atk._lastCrit;
      this._addLog(`${atk.char} 攻击 ${def.char}，造成 ${dmg} 点伤害${hits > 1 ? `（第 ${h+1} 击）` : ''}`);
      // 特效事件
      this._emit('fxAttack', {
        attackerUid: atk.uid, targetUid: def.uid, targetIsHero: false,
        damage: dmg, isCrit, keywords: atk.keywords,
      });
      const dealt = this._damageCard(oppSide, def, dmg);
      // 穿透
      if (atk.keywords.includes(KEYWORDS.PIERCE) && dealt > 0) {
        const pierce = Math.ceil(dealt * 0.5);
        this._damageHero(oppSide, pierce);
        this._addLog(`穿透！额外对英雄造成 ${pierce} 点伤害`);
      }
      // 吸血
      if (atk.keywords.includes(KEYWORDS.DRAIN)) {
        const heal = Math.floor(dealt * 0.5);
        atk.health = Math.min(atk.health + heal, atk.maxHealth);
      }
      // 灼烧/毒 施加状态
      if (atk.keywords.includes(KEYWORDS.BURN))   def.burnStacks   = 3;
      if (atk.keywords.includes(KEYWORDS.POISON))  def.poisonStacks = 3;
      // 冻结
      if (atk.keywords.includes(KEYWORDS.FREEZE) && !def.frozen) {
        def.frozen = true;
        this._addLog(`${def.char} 被冻结！`);
      }
    }

    // 横扫：额外攻击左右相邻
    if (atk.keywords.includes(KEYWORDS.SWEEP)) {
      const board = this.side(oppSide).board;
      const ci = board.indexOf(def);
      [-1, 1].forEach(offset => {
        const adj = board[ci + offset];
        if (adj) {
          const dmg = Math.max(1, Math.floor(atk.attack * 0.6));
          this._addLog(`横扫！${atk.char} 附带攻击 ${adj.char} ${dmg} 点`);
          this._damageCard(oppSide, adj, dmg);
        }
      });
    }

    // 枪出如龙
    if (atk.keywords.includes(KEYWORDS.DRAGON)) {
      const board = this.side(oppSide).board.slice();
      board.forEach(c => {
        if (c !== def) {
          const dmg = Math.floor(atk.attack * 0.7);
          this._addLog(`枪出如龙！${atk.char} 对 ${c.char} 造成 ${dmg} 点伤害`);
          this._damageCard(oppSide, c, dmg);
        }
      });
    }

    // 反击伤害（目标攻击攻击方）
    if (def.health > 0) {
      const retaliate = Math.floor(def.attack * 0.5);
      if (retaliate > 0) {
        this._damageCard(who, atk, retaliate);
      }
    }
  }

  // ── 回合结束 ──
  endTurn(who) {
    if (this.phase !== who) return;
    this._addLog(`${who === 'player' ? '你' : 'AI'} 结束回合`);

    // 回合结束 DoT
    this.side(who).board.forEach(c => {
      if (c.burnStacks > 0)  { this._damageCard(who, c, 1); c.burnStacks--;  }
      if (c.poisonStacks > 0){ this._damageCard(who, c, 2); c.poisonStacks--;}
    });

    // 切换回合
    const next = this.oppName(who);
    this.phase = next;

    const ns = this.side(next);
    ns.maxEnergy = Math.min(MAX_ENERGY, ns.maxEnergy + 1);
    ns.energy    = ns.maxEnergy;
    this.turn += (next === 'player' ? 1 : 0);

    // 重置攻击标记
    ns.board.forEach(c => { c.hasAttacked = false; });

    // 抽牌
    this._draw(next);

    this._addLog(`=== ${next === 'player' ? '你的' : 'AI 的'}回合（第 ${this.turn} 回合）===`);

    // 回合开始 DoT（另一侧）
    this.side(next).board.forEach(c => {
      if (c.burnStacks > 0)  { this._damageCard(next, c, 1); c.burnStacks--;  }
      if (c.poisonStacks > 0){ this._damageCard(next, c, 2); c.poisonStacks--;}
    });

    this._emit('stateChange');

    // AI 自动行动
    if (next === 'ai') {
      setTimeout(() => this._aiTurn(), 800);
    }
  }

  // ── AI 逻辑 ──
  _aiTurn() {
    if (this.phase !== 'ai' || this.phase === 'gameover') return;

    const ai = this.ai;

    // 1. 出所有能出的牌（按费用升序）
    const sorted = [...ai.hand].sort((a, b) => a.cost - b.cost);
    sorted.forEach(card => {
      if (card.cost <= ai.energy && ai.board.length < BOARD_LIMIT) {
        this.playCard('ai', card.uid);
      }
    });

    // 2. 用每张牌攻击
    setTimeout(() => {
      const snapshot = [...ai.board];
      snapshot.forEach((atk, i) => {
        if (this.phase !== 'ai') return;
        setTimeout(() => {
          if (!ai.board.includes(atk) || atk.hasAttacked) return;
          const playerBoard = this.player.board;
          const taunters = playerBoard.filter(c => c.keywords.includes(KEYWORDS.TAUNT));
          const targets = taunters.length > 0 ? taunters : playerBoard;
          if (targets.length > 0) {
            // 优先攻击生命最低的目标
            const target = targets.reduce((a, b) => a.health < b.health ? a : b);
            this.attack('ai', atk.uid, target.uid);
          } else {
            // 直接攻英雄
            this.attack('ai', atk.uid, 'hero');
          }
        }, i * 600);
      });

      setTimeout(() => {
        if (this.phase === 'ai') this.endTurn('ai');
      }, (snapshot.length + 1) * 600 + 400);
    }, 600);
  }
}
