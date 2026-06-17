// ============================================================
//  src/engine/GameState.js  –  游戏核心引擎 v2
//  改动：双方反击伤害、每回合抽2张牌、AI随机命名、急袭词条
// ============================================================
import { BASE_CARDS, FUSION_CARDS, AI_DECK_PRESET, KEYWORDS, SUITS, RANKS, AI_HERO_NAMES } from '../../data/cards.js';

const BOARD_LIMIT  = 6;
const MAX_HP       = 40;
const HAND_LIMIT   = 8;
const MAX_ENERGY   = 10;
const DRAW_PER_TURN = 2;   // 每回合抽牌数

let UID_COUNTER = 0;
const uid = () => `c${++UID_COUNTER}`;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rand(n) { return Math.floor(Math.random() * n); }
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
    onPlay:  base.onPlay  || null,
    onDeath: base.onDeath || null,
    isToken: !!base.isToken,
    // 状态
    frozen: false,
    burnStacks: 0,
    poisonStacks: 0,
    divineDone: false,
    hasAttacked: false,
    rushUsed: false,       // 急袭是否已使用
    _lastCrit: false,
  };
}

function buildDeck(cardIds) {
  const pool = [];
  const allIds = shuffleArray([...cardIds, ...cardIds]); // 双份保证数量
  allIds.forEach(id => {
    const base = BASE_CARDS.find(c => c.id === id);
    if (!base || base.isToken) return;
    const suit = SUITS[rand(SUITS.length)];
    const rank = RANKS[rand(RANKS.length)];
    pool.push(makeCard(base, suit, rank));
  });
  return shuffleArray(pool).slice(0, 30);
}

function buildPlayerDeck() {
  const ids = BASE_CARDS.filter(c => !c.isToken).map(c => c.id);
  return buildDeck(shuffleArray(ids).slice(0, 18));
}

function buildAIDeck() {
  return buildDeck(AI_DECK_PRESET);
}

// ============================================================
export class GameState {
  constructor() { this.reset(); }

  reset() {
    UID_COUNTER = 0;
    this.turn   = 1;
    this.phase  = 'player';
    this.winner = null;
    this.log    = [];

    // AI 随机命名
    this.aiName = AI_HERO_NAMES[rand(AI_HERO_NAMES.length)];

    this.player = {
      hp: MAX_HP, maxHp: MAX_HP, shield: 0,
      energy: 3, maxEnergy: 3,
      deck: buildPlayerDeck(), hand: [], board: [],
    };
    this.ai = {
      hp: MAX_HP, maxHp: MAX_HP, shield: 0,
      energy: 3, maxEnergy: 3,
      deck: buildAIDeck(), hand: [], board: [],
    };

    // 初始手牌各4张
    for (let i = 0; i < 4; i++) this._draw('player');
    for (let i = 0; i < 4; i++) this._draw('ai');

    this._addLog(`游戏开始！对手是 ${this.aiName}`);
    this._addLog('你的回合，加油！');
    this._emit('stateChange');
  }

  // ── 日志 / 事件 ──
  _addLog(msg) {
    this.log.unshift(msg);
    if (this.log.length > 80) this.log.pop();
  }
  _emit(event, data = {}) {
    document.dispatchEvent(new CustomEvent(`game:${event}`, { detail: { state: this, ...data } }));
  }

  side(who)    { return who === 'player' ? this.player : this.ai; }
  opp(who)     { return who === 'player' ? this.ai     : this.player; }
  oppName(who) { return who === 'player' ? 'ai'        : 'player'; }
  displayName(who) { return who === 'player' ? '你' : this.aiName; }

  // ── 抽牌 ──
  _draw(who, count = 1) {
    for (let i = 0; i < count; i++) {
      const s = this.side(who);
      if (s.hand.length >= HAND_LIMIT) {
        this._addLog(`${this.displayName(who)} 手牌已满，无法抽牌`);
        return;
      }
      if (s.deck.length === 0) {
        this._damageHero(who, 3);
        this._addLog(`${this.displayName(who)} 牌库耗尽！受到3点疲劳伤害`);
        return;
      }
      const card = s.deck.shift();
      s.hand.push(card);
    }
  }

  // ── 英雄伤害 / 回血 ──
  _damageHero(who, amount) {
    const s = this.side(who);
    let dmg = amount;
    if (s.shield > 0) {
      const ab = Math.min(s.shield, dmg);
      s.shield -= ab; dmg -= ab;
    }
    s.hp = clamp(s.hp - dmg, 0, s.maxHp);
    if (dmg > 0) {
      this._emit('fxHeroDamage', { who, damage: dmg });
    }
    if (s.hp <= 0) this._gameOver(this.oppName(who));
  }
  _healHero(who, amount) {
    const s = this.side(who);
    s.hp = clamp(s.hp + amount, 0, s.maxHp);
  }
  _gameOver(winner) {
    this.phase  = 'gameover';
    this.winner = winner;
    this._addLog(winner === 'player' ? '🎉 你赢了！' : `💀 ${this.aiName} 获胜！`);
    this._emit('gameover', { winner });
  }

  // ── 卡牌伤害 ──
  _damageCard(who, card, amount, skipDivine = false) {
    if (!this.side(who).board.includes(card)) return 0;
    // 神圣护盾
    if (!skipDivine && card.keywords.includes(KEYWORDS.DIVINE) && !card.divineDone) {
      card.divineDone = true;
      this._addLog(`${card.char} 的神圣护盾抵挡了伤害！`);
      this._emit('fxDivineBlock', { uid: card.uid });
      return 0;
    }
    let dmg = Math.max(0, amount);
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
    this._addLog(`${card.char} 被消灭了！`);
    this._emit('fxDeath', { uid: card.uid });
    if (card.onDeath) {
      const mut = card.onDeath(this, card, who);
      this._applyMutation(mut, who);
    }
    // 狂怒：敌方所有 rage 卡攻击+1
    this.side(this.oppName(who)).board.forEach(c => {
      if (c.keywords.includes(KEYWORDS.RAGE)) {
        c.attack += 1;
        this._addLog(`${c.char} 狂怒！攻击力提升至 ${c.attack}`);
      }
    });
    this._emit('stateChange');
  }

  // ── 副作用应用 ──
  _applyMutation(mut, who) {
    if (!mut) return;
    const oppSide = this.oppName(who);
    if (mut.heroShield) {
      const { side, amount } = mut.heroShield;
      this.side(side).shield += amount;
      this._addLog(`${this.displayName(side)} 获得 ${amount} 点护盾`);
      this._emit('fxShield', { heroElId: side === 'player' ? 'player-portrait' : 'ai-portrait', amount });
    }
    if (mut.heroHeal) {
      const { side, amount } = mut.heroHeal;
      this._healHero(side, amount);
      this._addLog(`${this.displayName(side)} 回复了 ${amount} 点生命`);
      this._emit('fxHeal', { heroElId: side === 'player' ? 'player-portrait' : 'ai-portrait', amount });
    }
    if (mut.summon) {
      const base = BASE_CARDS.find(c => c.id === mut.summon.cardId);
      if (base && this.side(mut.summon.side).board.length < BOARD_LIMIT) {
        const token = makeCard(base);
        this.side(mut.summon.side).board.push(token);
        this._addLog(`召唤了 ${token.char}！`);
      }
    }
    if (mut.echo) {
      const hand = this.side(mut.echo.side).hand;
      if (hand.length > 0 && hand.length < HAND_LIMIT) {
        const src  = hand[rand(hand.length)];
        const copy = { ...src, uid: uid() };
        hand.push(copy);
        this._addLog(`回响：复制了一张【${copy.char}】`);
      }
    }
    if (mut.counter) {
      const target = this.side(oppSide).board.find(c =>
        c.keywords.includes(KEYWORDS.DIVINE) || c.keywords.includes(KEYWORDS.ARMOR)
      );
      if (target) {
        target.keywords = target.keywords.filter(k => k !== KEYWORDS.DIVINE && k !== KEYWORDS.ARMOR);
        this._addLog(`反制！击碎了 ${target.char} 的护甲/神圣护盾`);
      }
    }
  }

  // ── 出牌 ──
  playCard(who, cardUid) {
    if (this.phase !== who) return { ok: false, msg: '不是你的回合' };
    const s = this.side(who);
    if (s.board.length >= BOARD_LIMIT) return { ok: false, msg: '场上已满（最多6张）' };
    const idx = s.hand.findIndex(c => c.uid === cardUid);
    if (idx === -1) return { ok: false, msg: '找不到该牌' };
    const card = s.hand[idx];
    if (card.cost > s.energy) return { ok: false, msg: `能量不足（需要${card.cost}，当前${s.energy}）` };

    s.energy -= card.cost;
    s.hand.splice(idx, 1);
    s.board.push(card);
    this._addLog(`${this.displayName(who)} 打出了【${card.char}】`);

    // 急袭卡出场即可攻击（但本回合只能攻击卡牌，不能攻英雄）
    if (card.keywords.includes(KEYWORDS.RUSH)) {
      card.hasAttacked = false; // 允许攻击
      card.rushUsed    = true;  // 标记本回合是急袭出场
    }

    if (card.onPlay) {
      const mut = card.onPlay(this, card, who);
      this._applyMutation(mut, who);
    }
    this._checkFusion(who);
    this._emit('stateChange');
    return { ok: true };
  }

  // ── 合体检测 ──
  _checkFusion(who) {
    const board = this.side(who).board;
    FUSION_CARDS.forEach(fusion => {
      const reqs  = [...fusion.requires];
      const found = [];
      for (const rid of reqs) {
        const ci = board.findIndex(c => c.id === rid && !found.includes(c));
        if (ci === -1) return;
        found.push(board[ci]);
      }
      // 移除原卡
      found.forEach(c => {
        const i = board.indexOf(c); if (i !== -1) board.splice(i, 1);
      });
      const fused = makeCard({ ...fusion, onPlay: fusion.onPlay || null, onDeath: null });
      board.push(fused);
      this._addLog(`✨ 合体！【${fusion.char}】降临！`);
      this._emit('fxFusion', { char: fusion.char });
      if (fused.onPlay) this._applyMutation(fused.onPlay(this, fused, who), who);
    });
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
      if (group.length < 2) return;
      const merged = group[0];
      group.slice(1).forEach(other => {
        merged.attack    += other.attack;
        merged.health    += other.health;
        merged.maxHealth += other.maxHealth;
        const i = board.indexOf(other); if (i !== -1) board.splice(i, 1);
      });
      this._addLog(`🃏 ${merged.char} 同花色合并！数值叠加`);
    });
  }

  // ── 攻击 ──
  attack(who, attackerUid, targetUid) {
    if (this.phase !== who) return { ok: false, msg: '不是你的回合' };
    const s   = this.side(who);
    const opp = this.opp(who);
    const atk = s.board.find(c => c.uid === attackerUid);
    if (!atk)            return { ok: false, msg: '找不到攻击方' };
    if (atk.hasAttacked) return { ok: false, msg: '该牌本回合已攻击' };
    if (atk.frozen) {
      atk.frozen = false;
      return { ok: false, msg: `${atk.char} 被冻结，本回合无法攻击` };
    }

    const taunters = opp.board.filter(c => c.keywords.includes(KEYWORDS.TAUNT));

    if (targetUid === 'hero') {
      if (taunters.length > 0) return { ok: false, msg: '敌方有嘲讽单位，必须先攻击嘲讽目标！' };
      // 急袭出场当回合不能攻英雄
      if (atk.rushUsed) return { ok: false, msg: '急袭出场当回合只能攻击敌方单位，不能攻击英雄！' };

      const { dmg, isCrit } = this._calcDamage(atk);
      if (isCrit) this._addLog(`💥 暴击！`);
      this._addLog(`${atk.char} 攻击 ${this.displayName(this.oppName(who))} 英雄，造成 ${dmg} 点伤害`);
      this._emit('fxAttack', { attackerUid, targetUid: 'hero', targetIsHero: true, damage: dmg, isCrit, keywords: atk.keywords });
      this._damageHero(this.oppName(who), dmg);
      if (atk.keywords.includes(KEYWORDS.DRAIN)) {
        const heal = Math.floor(dmg * 0.5);
        atk.health = Math.min(atk.health + heal, atk.maxHealth);
        this._addLog(`${atk.char} 吸血回复 ${heal} 点生命`);
      }
    } else {
      const def = opp.board.find(c => c.uid === targetUid);
      if (!def) return { ok: false, msg: '找不到目标' };
      if (taunters.length > 0 && !def.keywords.includes(KEYWORDS.TAUNT))
        return { ok: false, msg: '必须先攻击嘲讽目标！' };
      this._resolveAttack(who, atk, def);
    }

    atk.hasAttacked = true;
    atk.rushUsed    = false;
    this._emit('stateChange');
    return { ok: true };
  }

  _calcDamage(card) {
    const isCrit = card.keywords.includes(KEYWORDS.CRIT) && Math.random() < 0.25;
    const dmg    = isCrit ? card.attack * 2 : card.attack;
    card._lastCrit = isCrit;
    return { dmg, isCrit };
  }

  // ── 战斗结算（炉石风格双方互相造成伤害）──
  _resolveAttack(who, atk, def) {
    const oppSide = this.oppName(who);
    const hits    = (atk.keywords.includes(KEYWORDS.COMBO) && Math.random() < 0.15) ? 3 : 1;

    for (let h = 0; h < hits; h++) {
      if (!this.side(oppSide).board.includes(def)) break;

      const { dmg, isCrit } = this._calcDamage(atk);
      this._addLog(`${atk.char} ⚔️ ${def.char}，造成 ${dmg} 点伤害${hits > 1 ? `（第${h+1}击）` : ''}`);

      // 攻击特效
      this._emit('fxAttack', {
        attackerUid: atk.uid, targetUid: def.uid, targetIsHero: false,
        damage: dmg, isCrit, keywords: atk.keywords,
      });

      const dealt = this._damageCard(oppSide, def, dmg);

      // 穿透
      if (atk.keywords.includes(KEYWORDS.PIERCE) && dealt > 0) {
        const pierce = Math.ceil(dealt * 0.5);
        this._damageHero(oppSide, pierce);
        this._addLog(`🔱 穿透！额外对敌方英雄造成 ${pierce} 点伤害`);
      }
      // 吸血
      if (atk.keywords.includes(KEYWORDS.DRAIN) && dealt > 0) {
        const heal = Math.floor(dealt * 0.5);
        if (this.side(who).board.includes(atk)) {
          atk.health = Math.min(atk.health + heal, atk.maxHealth);
          this._addLog(`${atk.char} 吸血回复 ${heal} 点生命`);
        }
      }
      // 灼烧 / 毒 / 冻结 状态施加
      if (dealt > 0) {
        if (atk.keywords.includes(KEYWORDS.BURN)   && this.side(oppSide).board.includes(def)) def.burnStacks   = 3;
        if (atk.keywords.includes(KEYWORDS.POISON)  && this.side(oppSide).board.includes(def)) def.poisonStacks = 3;
        if (atk.keywords.includes(KEYWORDS.FREEZE)  && this.side(oppSide).board.includes(def) && !def.frozen) {
          def.frozen = true;
          this._addLog(`❄️ ${def.char} 被冻结！`);
        }
      }
    }

    // ── 横扫：相邻卡牌 ──
    if (atk.keywords.includes(KEYWORDS.SWEEP)) {
      const board = this.side(oppSide).board;
      const ci    = board.indexOf(def);
      [-1, 1].forEach(off => {
        const adj = board[ci + off];
        if (adj) {
          const sweepDmg = Math.max(1, Math.floor(atk.attack * 0.6));
          this._addLog(`🌀 横扫！${atk.char} 附带攻击 ${adj.char} ${sweepDmg} 点`);
          this._damageCard(oppSide, adj, sweepDmg);
        }
      });
    }

    // ── 枪出如龙：对所有其他敌方单位 ──
    if (atk.keywords.includes(KEYWORDS.DRAGON)) {
      const board = this.side(oppSide).board.slice();
      board.forEach(c => {
        if (c !== def) {
          const dragonDmg = Math.floor(atk.attack * 0.7);
          this._addLog(`🐉 枪出如龙！${atk.char} 对 ${c.char} 造成 ${dragonDmg} 点伤害`);
          this._damageCard(oppSide, c, dragonDmg);
        }
      });
    }

    // ────────────────────────────────────────────────
    //  ★ 炉石风格反击：目标对攻击方造成等额伤害 ★
    //  修复：用 def.health > 0 判断，而非 board.includes
    //  因为 _damageCard 会把死亡单位从 board 移除
    //  但反击应与攻击"同时"结算，只要目标当时还活着
    // ────────────────────────────────────────────────
    const defStillAlive = def.health > 0;
    const atkStillAlive = this.side(who).board.includes(atk);
    if (defStillAlive && atkStillAlive) {
      const retDmg = def.attack;
      if (retDmg > 0) {
        this._addLog(`↩️ ${def.char} 反击 ${atk.char}，造成 ${retDmg} 点伤害`);
        this._emit('fxAttack', {
          attackerUid: def.uid, targetUid: atk.uid, targetIsHero: false,
          damage: retDmg, isCrit: false, keywords: def.keywords, isCounter: true,
        });
        const retDealt = this._damageCard(who, atk, retDmg);
        if (def.keywords.includes(KEYWORDS.PIERCE) && retDealt > 0) {
          const rp = Math.ceil(retDealt * 0.5);
          this._damageHero(who, rp);
          this._addLog(`🔱 ${def.char} 反击穿透！对 ${this.displayName(who)} 英雄造成 ${rp} 点伤害`);
        }
        if (def.keywords.includes(KEYWORDS.DRAIN) && retDealt > 0) {
          const rh = Math.floor(retDealt * 0.5);
          def.health = Math.min(def.health + rh, def.maxHealth);
        }
      }
    }
  }

  // ── 回合结束 ──
  endTurn(who) {
    if (this.phase !== who) return;
    this._addLog(`${this.displayName(who)} 结束回合`);

    // DoT 结算（当前方）
    [...this.side(who).board].forEach(c => {
      if (c.burnStacks  > 0) { this._damageCard(who, c, 1); c.burnStacks--;  }
      if (c.poisonStacks> 0) { this._damageCard(who, c, 2); c.poisonStacks--;}
    });

    // 切换回合
    const next = this.oppName(who);
    this.phase = next;
    const ns   = this.side(next);
    ns.maxEnergy = Math.min(MAX_ENERGY, ns.maxEnergy + 1);
    ns.energy    = ns.maxEnergy;
    if (next === 'player') this.turn++;

    // 重置攻击标记（含急袭标记）
    ns.board.forEach(c => { c.hasAttacked = false; c.rushUsed = false; });

    // 每回合抽 DRAW_PER_TURN 张
    this._draw(next, DRAW_PER_TURN);

    this._addLog(`══ ${next === 'player' ? '你的' : this.aiName + ' 的'}回合（第${this.turn}回合）══`);

    // DoT 结算（下一方回合开始）
    [...this.side(next).board].forEach(c => {
      if (c.burnStacks  > 0) { this._damageCard(next, c, 1); c.burnStacks--;  }
      if (c.poisonStacks> 0) { this._damageCard(next, c, 2); c.poisonStacks--;}
    });

    this._emit('stateChange');
    if (next === 'ai') setTimeout(() => this._aiTurn(), 900);
  }

  // ── AI 行动 ──
  _aiTurn() {
    if (this.phase !== 'ai' || this.phase === 'gameover') return;
    const ai = this.ai;

    // 1. 出牌：优先出高费用但能量够的牌，再出低费
    const playable = [...ai.hand]
      .filter(c => c.cost <= ai.energy && ai.board.length < BOARD_LIMIT)
      .sort((a, b) => b.cost - a.cost);
    playable.forEach(card => {
      if (card.cost <= ai.energy && ai.board.length < BOARD_LIMIT)
        this.playCard('ai', card.uid);
    });

    // 2. 攻击
    let delay = 400;
    const snapshot = [...ai.board];
    snapshot.forEach((atk) => {
      setTimeout(() => {
        if (this.phase !== 'ai' || !ai.board.includes(atk) || atk.hasAttacked) return;
        const playerBoard = this.player.board;
        const taunters    = playerBoard.filter(c => c.keywords.includes(KEYWORDS.TAUNT));
        const targets     = taunters.length > 0 ? taunters : playerBoard;

        if (targets.length > 0) {
          // AI 策略：优先攻击最低血量目标；急袭卡只攻击卡牌
          const target = targets.reduce((a, b) => a.health < b.health ? a : b);
          this.attack('ai', atk.uid, target.uid);
        } else if (!atk.rushUsed) {
          this.attack('ai', atk.uid, 'hero');
        }
      }, delay);
      delay += 650;
    });

    setTimeout(() => {
      if (this.phase === 'ai') this.endTurn('ai');
    }, delay + 400);
  }
}
