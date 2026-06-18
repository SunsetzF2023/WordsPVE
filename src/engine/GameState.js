// ============================================================
//  src/engine/GameState.js  –  游戏核心引擎 v3
// ============================================================
import { BASE_CARDS, FUSION_CARDS, AI_DECK_PRESET, KEYWORDS, SUITS, RANKS, AI_HERO_NAMES, ENERGY_CONFIG, UNLOCK_CARDS } from '../../data/cards.js';
import { loadProgress, recordGame } from './PlayerProgress.js';

const BOARD_LIMIT   = 6;
const MAX_HP        = 40;
const HAND_LIMIT    = 8;
const DRAW_PER_TURN = 2;
// 能量从 cards.js 的 ENERGY_CONFIG 读取

let UID_COUNTER = 0;
const uid = () => `c${++UID_COUNTER}`;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rand(n)  { return Math.floor(Math.random() * n); }
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeCard(base, suit, rank) {
  return {
    uid:       uid(),
    id:        base.id,
    char:      base.char,
    suit:      suit || SUITS[rand(SUITS.length)],
    rank:      rank || RANKS[rand(RANKS.length)],
    attack:    base.attack,
    health:    base.health,
    maxHealth: base.health,
    cost:      base.cost,
    keywords:  [...(base.keywords || [])],
    effect:    base.effect,
    onPlay:    base.onPlay  || null,
    onDeath:   base.onDeath || null,
    isToken:   !!base.isToken,
    // 状态
    frozen:       false,
    burnStacks:   0,
    poisonStacks: 0,
    divineDone:   false,
    hasAttacked:  false,
    rushUsed:     false,
  };
}

function buildDeck(cardIds) {
  const pool   = [];
  const allIds = shuffleArray([...cardIds, ...cardIds]);
  allIds.forEach(id => {
    const base = [...BASE_CARDS, ...UNLOCK_CARDS].find(c => c.id === id);
    if (!base || base.isToken) return;
    pool.push(makeCard(base, SUITS[rand(SUITS.length)], RANKS[rand(RANKS.length)]));
  });
  return shuffleArray(pool).slice(0, 30);
}

function buildPlayerDeck() {
  const progress   = loadProgress();
  const unlockIds  = progress.unlockedCards || [];
  // 普通卡随机抽取
  const normalIds  = BASE_CARDS.filter(c => !c.isToken).map(c => c.id);
  const pickedNormal = shuffleArray(normalIds).slice(0, 18);
  // 解锁卡全部保留（不参与 slice），确保一定能抽到
  const allIds = [...pickedNormal, ...unlockIds];
  return buildDeck(allIds);
}

function buildAIDeck() { return buildDeck(AI_DECK_PRESET); }

// ============================================================
export class GameState {
  constructor() { this.reset(); }

  reset() {
    UID_COUNTER    = 0;
    this.turn      = 1;
    this.phase     = 'player';
    this.winner    = null;
    this.log       = [];
    this.aiName    = AI_HERO_NAMES[rand(AI_HERO_NAMES.length)];

    const SE = ENERGY_CONFIG.startEnergy;
    const SM = ENERGY_CONFIG.startMax;
    this.player = { hp: MAX_HP, maxHp: MAX_HP, shield: 0, energy: SE, maxEnergy: SM, invincibleTurns: 0, burnStacks: 0, poisonStacks: 0, deck: buildPlayerDeck(), hand: [], board: [] };
    this.ai     = { hp: MAX_HP, maxHp: MAX_HP, shield: 0, energy: SE, maxEnergy: SM, invincibleTurns: 0, burnStacks: 0, poisonStacks: 0, deck: buildAIDeck(),    hand: [], board: [] };

    for (let i = 0; i < 4; i++) this._draw('player');
    for (let i = 0; i < 4; i++) this._draw('ai');

    this._addLog(`游戏开始！对手是 ${this.aiName}`);
    this._addLog('你的回合，加油！');
    this._emit('stateChange');
  }

  _addLog(msg) { this.log.unshift(msg); if (this.log.length > 100) this.log.pop(); }
  _emit(event, data = {}) {
    document.dispatchEvent(new CustomEvent(`game:${event}`, { detail: { state: this, ...data } }));
  }

  side(who)        { return who === 'player' ? this.player : this.ai; }
  opp(who)         { return who === 'player' ? this.ai     : this.player; }
  oppName(who)     { return who === 'player' ? 'ai'        : 'player'; }
  displayName(who) { return who === 'player' ? '你'        : this.aiName; }

  // ── 抽牌 ──
  _draw(who, count = 1) {
    for (let i = 0; i < count; i++) {
      const s = this.side(who);
      if (s.hand.length >= HAND_LIMIT) { this._addLog(`${this.displayName(who)} 手牌已满`); continue; }
      if (s.deck.length === 0) {
        this._damageHero(who, 3);
        this._addLog(`${this.displayName(who)} 牌库耗尽！受到3点疲劳伤害`);
        continue;
      }
      s.hand.push(s.deck.shift());
    }
  }

  // ── 英雄伤害 / 回血 ──
  _damageHero(who, amount) {
    const s   = this.side(who);
    // 无敌状态：免疫所有伤害
    if (s.invincibleTurns > 0) {
      this._addLog(`✨ ${this.displayName(who)} 处于无敌状态，伤害免疫！`);
      return;
    }
    let   dmg = Math.max(0, amount);
    if (s.shield > 0) { const ab = Math.min(s.shield, dmg); s.shield -= ab; dmg -= ab; }
    s.hp = clamp(s.hp - dmg, 0, s.maxHp);
    if (dmg > 0) this._emit('fxHeroDamage', { who, damage: dmg });
    if (s.hp <= 0) this._gameOver(this.oppName(who));
  }
  _healHero(who, amount) {
    const s = this.side(who);
    s.hp = clamp(s.hp + amount, 0, s.maxHp);
  }
  _gameOver(winner) {
    if (this.phase === 'gameover') return;
    this.phase  = 'gameover';
    this.winner = winner;
    this._addLog(winner === 'player' ? '🎉 你赢了！' : `💀 ${this.aiName} 获胜！`);
    // 记录战绩并检查解锁
    const { progress, newlyUnlocked } = recordGame(winner === 'player');
    this.progress       = progress;
    this.newlyUnlocked  = newlyUnlocked;
    this._emit('gameover', { winner, progress, newlyUnlocked });
  }

  // ══════════════════════════════════════════════════════════
  //  卡牌伤害
  //  返回 { dealt, blocked }
  //  dealt  = 实际造成的伤害（扣血后）
  //  blocked= 是否被神圣护盾格挡
  // ══════════════════════════════════════════════════════════
  _damageCard(who, card, amount) {
    // 目标已不在场（被上一次攻击消灭等）
    if (!this.side(who).board.includes(card)) return { dealt: 0, blocked: false };

    // 神圣护盾
    if (card.keywords.includes(KEYWORDS.DIVINE) && !card.divineDone) {
      card.divineDone = true;
      this._addLog(`${card.char} 的神圣护盾抵挡了伤害！`);
      this._emit('fxDivineBlock', { uid: card.uid });
      return { dealt: 0, blocked: true };
    }

    let dmg = Math.max(0, amount);
    if (card.keywords.includes(KEYWORDS.ARMOR)) dmg = Math.max(0, dmg - 1);

    card.health -= dmg;

    // ★ 记录"死亡前是否在场"，用于反击判断
    const wasAlive = dmg > 0; // 只要真正受到了伤害就算"交战过"
    if (card.health <= 0) this._killCard(who, card);

    return { dealt: dmg, blocked: false };
  }

  _killCard(who, card) {
    const s   = this.side(who);
    const idx = s.board.indexOf(card);
    if (idx === -1) return;
    s.board.splice(idx, 1);
    this._addLog(`${card.char} 被消灭了！`);
    this._emit('fxDeath', { uid: card.uid });
    if (card.onDeath) this._applyMutation(card.onDeath(this, card, who), who);
    // 狂怒
    this.side(this.oppName(who)).board.forEach(c => {
      if (c.keywords.includes(KEYWORDS.RAGE)) {
        c.attack++;
        this._addLog(`${c.char} 狂怒！攻击力 → ${c.attack}`);
      }
    });
    this._emit('stateChange');
  }

  _applyMutation(mut, who) {
    if (!mut) return;
    const opp = this.oppName(who);
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
        this.side(mut.summon.side).board.push(makeCard(base));
        this._addLog(`召唤了 ${base.char}！`);
      }
    }
    if (mut.echo) {
      const hand = this.side(mut.echo.side).hand;
      if (hand.length > 0 && hand.length < HAND_LIMIT) {
        const src = hand[rand(hand.length)];
        hand.push({ ...src, uid: uid() });
        this._addLog(`回响：复制了一张【${src.char}】`);
      }
    }
    if (mut.counter) {
      const target = this.side(opp).board.find(c =>
        c.keywords.includes(KEYWORDS.DIVINE) || c.keywords.includes(KEYWORDS.ARMOR)
      );
      if (target) {
        target.keywords = target.keywords.filter(k => k !== KEYWORDS.DIVINE && k !== KEYWORDS.ARMOR);
        this._addLog(`反制！击碎了 ${target.char} 的护甲/神圣护盾`);
      }
    }

    // ── 解锁卡专属 mutation ──

    // 全场 AOE（自爆 / 神威）
    if (mut.aoeEnemy) {
      const { side: targetSide, damage } = mut.aoeEnemy;
      const board = this.side(targetSide).board.slice();
      board.forEach(c => {
        this._damageCard(targetSide, c, damage);
      });
      this._addLog(`💥 AOE！对敌方全体造成 ${damage} 点伤害`);
    }

    // 友方全体 buff（军令）
    if (mut.buffAllies) {
      const { side: buffSide, atk, hp } = mut.buffAllies;
      // 不包括刚出场的这张牌（最后一个），对其余所有友方buff
      const board = this.side(buffSide).board;
      board.slice(0, -1).forEach(c => {
        c.attack    += atk;
        c.health    += hp;
        c.maxHealth += hp;
      });
      this._addLog(`📯 军令！友方所有单位 +${atk}/+${hp}`);
    }

    // 召唤多个 token（伏兵）
    if (mut.summonMulti) {
      const { side: sumSide, cardId, count } = mut.summonMulti;
      const base = [...BASE_CARDS, ...UNLOCK_CARDS].find(c => c.id === cardId);
      if (base) {
        for (let i = 0; i < count; i++) {
          if (this.side(sumSide).board.length < BOARD_LIMIT) {
            this.side(sumSide).board.push(makeCard(base));
          }
        }
        this._addLog(`🪖 伏兵！召唤了 ${count} 个 ${base.char}`);
      }
    }

    // 英雄无敌（无敌卡）
    if (mut.heroInvincible) {
      const { side: invSide, turns } = mut.heroInvincible;
      this.side(invSide).invincibleTurns = (this.side(invSide).invincibleTurns || 0) + turns;
      this._addLog(`🛡️ ${this.displayName(invSide)} 本回合免疫所有伤害！`);
      this._emit('fxShield', { heroElId: invSide === 'player' ? 'player-portrait' : 'ai-portrait', amount: '∞' });
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
    card.hasAttacked = !card.keywords.includes(KEYWORDS.RUSH); // 急袭出场可立即攻击
    card.rushUsed    =  card.keywords.includes(KEYWORDS.RUSH);
    this._addLog(`${this.displayName(who)} 打出了【${card.char}】`);
    if (card.onPlay) this._applyMutation(card.onPlay(this, card, who), who);
    this._checkFusion(who);
    this._emit('stateChange');
    return { ok: true };
  }

  // ── 合体检测 ──
  _checkFusion(who) {
    const board = this.side(who).board;
    let merged  = true;
    // 循环检测直到没有新合体
    while (merged) {
      merged = false;
      for (const fusion of FUSION_CARDS) {
        const found = [];
        let ok = true;
        for (const rid of fusion.requires) {
          const ci = board.findIndex(c => c.id === rid && !found.includes(c));
          if (ci === -1) { ok = false; break; }
          found.push(board[ci]);
        }
        if (!ok) continue;
        // 移除原卡
        found.forEach(c => { const i = board.indexOf(c); if (i !== -1) board.splice(i, 1); });
        const fused = makeCard({ ...fusion, onPlay: fusion.onPlay || null, onDeath: null });
        board.push(fused);
        this._addLog(`✨ 合体！【${fusion.char}】降临！`);
        this._emit('fxFusion', { char: fusion.char });
        if (fused.onPlay) this._applyMutation(fused.onPlay(this, fused, who), who);
        merged = true;
        break; // 重新扫描
      }
    }
    this._checkSuitMerge(who);
  }

  // ══════════════════════════════════════════════════════════
  //  同花色合并
  //  条件：同一 id + 同一 suit + 同一 rank，2张及以上
  //  效果：数值叠加 + keywords 取并集 + effect 拼接
  // ══════════════════════════════════════════════════════════
  _checkSuitMerge(who) {
    const board = this.side(who).board;
    let changed = true;
    while (changed) {
      changed = false;
      const groups = {};
      board.forEach(c => {
        const key = `${c.id}|${c.suit}|${c.rank}`;
        (groups[key] = groups[key] || []).push(c);
      });
      for (const group of Object.values(groups)) {
        if (group.length < 2) continue;
        const base = group[0];
        group.slice(1).forEach(other => {
          // 数值叠加
          base.attack    += other.attack;
          base.health    += other.health;
          base.maxHealth += other.maxHealth;
          // keywords 取并集
          other.keywords.forEach(k => {
            if (!base.keywords.includes(k)) base.keywords.push(k);
          });
          // effect 拼接（去重）
          const extraEffect = other.effect.replace(base.effect, '').trim();
          if (extraEffect && !base.effect.includes(extraEffect)) {
            base.effect += '；' + extraEffect;
          }
          // 从 board 移除
          const i = board.indexOf(other);
          if (i !== -1) board.splice(i, 1);
        });
        this._addLog(`🃏【${base.char}】${base.suit}${base.rank} 同花色合并！攻${base.attack}/血${base.health}，词条叠加`);
        changed = true;
        break; // 重新扫描
      }
    }
  }

  // ── 攻击入口 ──
  attack(who, attackerUid, targetUid) {
    if (this.phase !== who) return { ok: false, msg: '不是你的回合' };
    const s   = this.side(who);
    const opp = this.opp(who);
    const atk = s.board.find(c => c.uid === attackerUid);
    if (!atk)            return { ok: false, msg: '找不到攻击方' };
    if (atk.hasAttacked) return { ok: false, msg: '该牌本回合已攻击' };
    if (atk.frozen) { atk.frozen = false; return { ok: false, msg: `${atk.char} 被冻结，跳过本次攻击` }; }

    const taunters = opp.board.filter(c => c.keywords.includes(KEYWORDS.TAUNT));

    if (targetUid === 'hero') {
      if (taunters.length > 0) return { ok: false, msg: '敌方有嘲讽单位！必须先攻击嘲讽目标' };
      if (atk.rushUsed)        return { ok: false, msg: '急袭出场当回合只能攻击敌方单位' };
      this._attackHero(who, atk);
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

  _attackHero(who, atk) {
    const { dmg, isCrit } = this._calcDamage(atk);
    if (isCrit) this._addLog(`💥 暴击！`);
    this._addLog(`${atk.char} 攻击 ${this.displayName(this.oppName(who))} 英雄，造成 ${dmg} 点伤害`);
    this._emit('fxAttack', { attackerUid: atk.uid, targetUid: 'hero', targetIsHero: true, damage: dmg, isCrit, keywords: atk.keywords });
    this._damageHero(this.oppName(who), dmg);
    // 攻击英雄也可以施加灼烧/毒
    const oppHero = this.opp(who);
    if (atk.keywords.includes(KEYWORDS.BURN) && oppHero.burnStacks < 3) {
      oppHero.burnStacks = 3;
      this._addLog(`🔥 ${this.displayName(this.oppName(who))} 英雄被灼烧！`);
    }
    if (atk.keywords.includes(KEYWORDS.POISON) && oppHero.poisonStacks < 3) {
      oppHero.poisonStacks = 3;
      this._addLog(`☠️ ${this.displayName(this.oppName(who))} 英雄被中毒！`);
    }
    if (atk.keywords.includes(KEYWORDS.DRAIN) && this.side(who).board.includes(atk)) {
      const heal = Math.floor(dmg * 0.5);
      atk.health = Math.min(atk.health + heal, atk.maxHealth);
      this._addLog(`${atk.char} 吸血回复 ${heal} 点生命`);
    }
  }

  _calcDamage(card) {
    const isCrit = card.keywords.includes(KEYWORDS.CRIT) && Math.random() < 0.25;
    return { dmg: isCrit ? card.attack * 2 : card.attack, isCrit };
  }

  // ══════════════════════════════════════════════════════════
  //  战斗结算 ── 炉石风格：双方同时受到伤害
  //
  //  关键设计：
  //  1. 先快照攻防双方攻击力（避免死亡后数值变化影响反击）
  //  2. 双方同时扣血（先算攻击方→目标，再算反击，但都基于快照值）
  //  3. 反击不依赖 board.includes 或 health > 0 ——
  //     只要双方都"参与了本次交战"，反击就必然发生
  // ══════════════════════════════════════════════════════════
  _resolveAttack(who, atk, def) {
    const oppSide = this.oppName(who);
    const isCombo = atk.keywords.includes(KEYWORDS.COMBO) && Math.random() < 0.15;
    const hits    = isCombo ? 3 : 1;

    // ★ 快照攻击力（防止死亡/狂怒触发后数值错乱）
    const atkPower = atk.attack;
    const defPower = def.attack;
    const atkChar  = atk.char;
    const defChar  = def.char;

    for (let h = 0; h < hits; h++) {
      // 连击时目标可能已死，跳出
      if (h > 0 && !this.side(oppSide).board.includes(def)) break;

      const { dmg, isCrit } = this._calcDamage(atk);
      this._addLog(`${atkChar} ⚔️ ${defChar}，造成 ${dmg} 点伤害${isCombo ? `（第${h+1}击）` : ''}`);
      this._emit('fxAttack', { attackerUid: atk.uid, targetUid: def.uid, targetIsHero: false, damage: dmg, isCrit, keywords: atk.keywords });

      const { dealt } = this._damageCard(oppSide, def, dmg);

      // 穿透
      if (atk.keywords.includes(KEYWORDS.PIERCE) && dealt > 0) {
        const pierce = Math.ceil(dealt * 0.5);
        this._damageHero(oppSide, pierce);
        this._addLog(`🔱 穿透！额外对英雄造成 ${pierce} 点伤害`);
      }
      // 吸血
      if (atk.keywords.includes(KEYWORDS.DRAIN) && dealt > 0 && this.side(who).board.includes(atk)) {
        const heal = Math.floor(dealt * 0.5);
        atk.health = Math.min(atk.health + heal, atk.maxHealth);
        this._addLog(`${atkChar} 吸血回复 ${heal} 点生命`);
      }
      // 状态施加
      if (dealt > 0 && this.side(oppSide).board.includes(def)) {
        if (atk.keywords.includes(KEYWORDS.BURN))   { def.burnStacks   = 3; }
        if (atk.keywords.includes(KEYWORDS.POISON))  { def.poisonStacks = 3; }
        if (atk.keywords.includes(KEYWORDS.FREEZE) && !def.frozen) {
          def.frozen = true;
          this._addLog(`❄️ ${defChar} 被冻结！`);
        }
      }
    }

    // 横扫
    if (atk.keywords.includes(KEYWORDS.SWEEP)) {
      const board = this.side(oppSide).board;
      const ci    = board.indexOf(def);
      // def 可能已死出队，改用位置快照前的相邻
      // 安全方式：扫 board 中 def 当前位置（如已死则 ci=-1，直接跳过）
      if (ci !== -1) {
        [-1, 1].forEach(off => {
          const adj = board[ci + off];
          if (adj) {
            const sd = Math.max(1, Math.floor(atkPower * 0.6));
            this._addLog(`🌀 横扫！${atkChar} 附带攻击 ${adj.char} ${sd} 点`);
            this._damageCard(oppSide, adj, sd);
          }
        });
      }
    }

    // 枪出如龙
    if (atk.keywords.includes(KEYWORDS.DRAGON)) {
      const board = this.side(oppSide).board.slice();
      board.forEach(c => {
        if (c !== def) {
          const dd = Math.floor(atkPower * 0.7);
          this._addLog(`🐉 枪出如龙！${atkChar} 对 ${c.char} 造成 ${dd} 点伤害`);
          this._damageCard(oppSide, c, dd);
        }
      });
    }

    // ══════════════════════════════════════════════════════
    //  ★★★ 反击（炉石风格同时结算）★★★
    //
    //  反击条件：
    //  - defPower > 0（目标有攻击力）
    //  - 攻击方 atk 仍在场（没被之前的 DoT / 其他效果消灭）
    //  - 反击基于快照攻击力 defPower，不受死亡后的状态影响
    //
    //  !! 注意：不检查 def 是否还在场 ——
    //     即使 def 被一击毙命，它仍然会反击（炉石标准规则）
    // ══════════════════════════════════════════════════════
    if (defPower > 0 && this.side(who).board.includes(atk)) {
      this._addLog(`↩️ ${defChar} 反击 ${atkChar}，造成 ${defPower} 点伤害`);
      this._emit('fxAttack', {
        attackerUid: def.uid, targetUid: atk.uid, targetIsHero: false,
        damage: defPower, isCrit: false, keywords: def.keywords, isCounter: true,
      });
      const { dealt: retDealt } = this._damageCard(who, atk, defPower);
      // 反击穿透
      if (def.keywords.includes(KEYWORDS.PIERCE) && retDealt > 0) {
        const rp = Math.ceil(retDealt * 0.5);
        this._damageHero(who, rp);
        this._addLog(`🔱 ${defChar} 反击穿透！对 ${this.displayName(who)} 英雄造成 ${rp} 点`);
      }
      // 反击吸血（def 可能已死出队，不做修改血量，意义不大；但若还在场则处理）
      if (def.keywords.includes(KEYWORDS.DRAIN) && retDealt > 0 && this.side(oppSide).board.includes(def)) {
        const rh = Math.floor(retDealt * 0.5);
        def.health = Math.min(def.health + rh, def.maxHealth);
      }
    }
  }

  // ── 回合结束 ──
  endTurn(who) {
    if (this.phase !== who) return;
    this._addLog(`${this.displayName(who)} 结束回合`);

    // 无敌回合递减（在本回合结束时减）
    const ws = this.side(who);
    if (ws.invincibleTurns > 0) { ws.invincibleTurns--; }

    // ── 切换到下一回合 ──
    const next = this.oppName(who);
    this.phase = next;
    const ns   = this.side(next);
    ns.maxEnergy = Math.min(ENERGY_CONFIG.hardCap, ns.maxEnergy + ENERGY_CONFIG.gainPerTurn);
    ns.energy    = ns.maxEnergy;
    if (next === 'player') this.turn++;

    ns.board.forEach(c => { c.hasAttacked = false; c.rushUsed = false; });
    this._draw(next, DRAW_PER_TURN);
    this._addLog(`══ ${next === 'player' ? '你的' : this.aiName + ' 的'}回合（第${this.turn}回合）══`);

    // ── 回合开始：DoT 结算（每回合只触发一次，在这里）──
    // Bug 修复：原来回合结束+回合开始各结算一次，导致每回合扣两次血/掉两层
    // 正确：只在新回合开始时统一结算，层数-1
    this._applyDoT(next);

    // ── 英雄 DoT（毒/灼烧也可以施加在英雄身上）──
    this._applyHeroDoT(next);

    this._emit('stateChange');
    if (next === 'ai') setTimeout(() => this._aiTurn(), 900);
  }

  // ── 卡牌 DoT 结算（每回合开始调用一次）──
  _applyDoT(who) {
    [...this.side(who).board].forEach(c => {
      if (c.burnStacks > 0) {
        this._damageCard(who, c, 1);
        c.burnStacks--;
        this._addLog(`🔥 ${c.char} 灼烧伤害 1 点（剩余${c.burnStacks}层）`);
      }
      if (c.poisonStacks > 0) {
        this._damageCard(who, c, 2);
        c.poisonStacks--;
        this._addLog(`☠️ ${c.char} 中毒伤害 2 点（剩余${c.poisonStacks}层）`);
      }
    });
  }

  // ── 英雄 DoT 结算（英雄也可以中毒/灼烧）──
  _applyHeroDoT(who) {
    const s = this.side(who);
    if (s.burnStacks > 0) {
      this._addLog(`🔥 ${this.displayName(who)} 英雄灼烧伤害 1 点（剩余${s.burnStacks - 1}层）`);
      this._damageHero(who, 1);
      s.burnStacks--;
    }
    if (s.poisonStacks > 0) {
      this._addLog(`☠️ ${this.displayName(who)} 英雄中毒伤害 2 点（剩余${s.poisonStacks - 1}层）`);
      this._damageHero(who, 2);
      s.poisonStacks--;
    }
  }

  // ── AI ──
  _aiTurn() {
    if (this.phase !== 'ai') return;
    const ai = this.ai;

    // 出牌：按费用从高到低
    const playable = [...ai.hand]
      .filter(c => c.cost <= ai.energy && ai.board.length < BOARD_LIMIT)
      .sort((a, b) => b.cost - a.cost);
    playable.forEach(card => {
      if (card.cost <= ai.energy && ai.board.length < BOARD_LIMIT)
        this.playCard('ai', card.uid);
    });

    // 攻击
    let delay = 400;
    const snapshot = [...ai.board];
    snapshot.forEach(atk => {
      setTimeout(() => {
        if (this.phase !== 'ai' || !ai.board.includes(atk) || atk.hasAttacked) return;
        const pb       = this.player.board;
        const taunters = pb.filter(c => c.keywords.includes(KEYWORDS.TAUNT));
        const targets  = taunters.length > 0 ? taunters : pb;
        if (targets.length > 0) {
          const target = targets.reduce((a, b) => a.health < b.health ? a : b);
          this.attack('ai', atk.uid, target.uid);
        } else if (!atk.rushUsed) {
          this.attack('ai', atk.uid, 'hero');
        }
      }, delay);
      delay += 650;
    });

    setTimeout(() => { if (this.phase === 'ai') this.endTurn('ai'); }, delay + 400);
  }
}
