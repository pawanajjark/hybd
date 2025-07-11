import type { KaboomCtx } from "kaboom";
import type { GameConfig } from "../gameConfig";

export function createStartScene(k: KaboomCtx, config: GameConfig, width: number, height: number) {
  return k.scene("start", () => {
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
      k.text("FLAPPY BIRD", { size: Math.min(width, height) * 0.08, font: "monospace" }),
      k.pos(k.width() / 2, k.height() / 2 - height * 0.15),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.outline(3, k.BLACK),
    ]);

    k.add([
      k.text("Press SPACE or Click to Start", { size: Math.min(width, height) * 0.04, font: "monospace" }),
      k.pos(k.width() / 2, k.height() / 2 - height * 0.05),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.outline(2, k.BLACK),
    ]);

    k.add([
      k.sprite("bird"),
      k.pos(k.width() / 2, k.height() / 2 + height * 0.05),
      k.anchor("center"),
      k.scale(config.birdScale * 1.5),
    ]);

    k.onKeyPress("space", () => k.go("game"));
    k.onClick(() => k.go("game"));
  });
} 