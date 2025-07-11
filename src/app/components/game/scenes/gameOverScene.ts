import type { KaboomCtx } from "kaboom";
import type { GameConfig } from "../gameConfig";

export function createGameOverScene(k: KaboomCtx, config: GameConfig, width: number, height: number) {
  return k.scene("gameover", (finalScore: number) => {
    k.add([
      k.sprite("background"),
      k.pos(0, 0),
      k.scale(width / 288, height / 512),
    ]);

    k.add([
      k.sprite("base"),
      k.pos(0, k.height() - 50 * (height / 640)),
      k.scale(config.baseScale, config.baseScale),
    ]);

    k.add([
      k.sprite("gameover"),
      k.pos(k.width() / 2, k.height() / 2 - height * 0.1),
      k.anchor("center"),
      k.scale(Math.min(width, height) / 400),
    ]);

    k.add([
      k.text(`Score: ${Math.floor(finalScore)}`, { size: Math.min(width, height) * 0.06, font: "monospace" }),
      k.pos(k.width() / 2, k.height() / 2),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.outline(2, k.BLACK),
    ]);

    k.add([
      k.text("Press SPACE or Click to Play Again", { size: Math.min(width, height) * 0.03, font: "monospace" }),
      k.pos(k.width() / 2, k.height() / 2 + height * 0.1),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.outline(1, k.BLACK),
    ]);

    k.onKeyPress("space", () => k.go("game"));
    k.onClick(() => k.go("game"));
  });
} 