// ============================================================
//  src/main.js  –  入口：初始化游戏
// ============================================================
import { GameState }    from './engine/GameState.js';
import { UIController } from './ui/UIController.js';

// 全局实例（方便调试：window.game / window.ui）
window.game = new GameState();
window.ui   = new UIController(window.game);

// 游戏结束重启按钮（覆盖层）
document.getElementById('btn-restart-overlay')?.addEventListener('click', () => {
  window.ui.els.overlay?.classList.remove('overlay--visible');
  window.game.reset();
});

console.log(
  '%c汉字战场 HanziCard%c\n已加载 — window.game / window.ui 可用于调试',
  'color:#3aff6a;font-size:1.2em;font-weight:bold',
  'color:#6a8a6a'
);
