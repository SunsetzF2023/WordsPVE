// ============================================================
//  src/main.js  –  入口 v4
// ============================================================
import { GameState }    from './engine/GameState.js';
import { UIController } from './ui/UIController.js';
import { initProgressPanel, renderProgressPanel, onGameEnd } from './ui/UnlockUI.js';

window.game = new GameState();
window.ui   = new UIController(window.game);

// 初始化进度面板
initProgressPanel();
renderProgressPanel();

// 游戏结束时触发解锁 UI
document.addEventListener('game:gameover', (e) => {
  const { progress, newlyUnlocked } = e.detail;
  if (progress) onGameEnd(progress, newlyUnlocked || []);
});

// 覆盖层重启按钮
document.getElementById('btn-restart-overlay')?.addEventListener('click', () => {
  document.getElementById('game-overlay')?.classList.remove('overlay--visible');
  window.game.reset();
  renderProgressPanel();
});

console.log('%c汉字战场 v4%c  window.game / window.ui', 'color:#3aff6a;font-weight:bold', 'color:#6a8a6a');
