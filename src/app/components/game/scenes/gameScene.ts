import type { KaboomCtx } from "kaboom";
import type { GameConfig } from "../gameConfig";

export function createGameScene(k: KaboomCtx, config: GameConfig, width: number, height: number) {
  return k.scene("game", () => {
    // Add background
    k.add([
      k.sprite("background"),
      k.pos(0, 0),
      k.scale(width / 288, height / 512), // Scale background to fit
      "background"
    ]);

    // Add moving base
    const base1 = k.add([
      k.sprite("base"),
      k.pos(0, k.height() - 50 * (height / 640)),
      k.scale(config.baseScale, config.baseScale),
      "base"
    ]);

    const base2 = k.add([
      k.sprite("base"),
      k.pos(base1.width * config.baseScale, k.height() - 50 * (height / 640)),
      k.scale(config.baseScale, config.baseScale),
      "base"
    ]);

    // Bird
    const bird = k.add([
      k.sprite("bird"),
      k.pos(width * 0.15, k.height() / 2),
      k.area(),
      k.body(),
      k.scale(config.birdScale),
      "bird"
    ]);

    // Bird animation
    let birdFrame = 0;
    const birdSprites = ["bird", "bird-up", "bird-down"];
    
    k.onUpdate(() => {
      birdFrame += k.dt() * 8;
      if (birdFrame >= birdSprites.length) birdFrame = 0;
      bird.use(k.sprite(birdSprites[Math.floor(birdFrame)]));
    });

    // Score
    let score = 0;
    const scoreText = k.add([
      k.text(score.toString(), { size: Math.min(width, height) * 0.08, font: "monospace" }),
      k.pos(k.width() / 2, height * 0.1),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.outline(3, k.BLACK),
    ]);

    // Pipes
    function spawnPipe() {
      const pipeY = k.rand(height * 0.2, k.height() - height * 0.3);
      const pipeScale = Math.min(width / 480, height / 640) * 1.2;
      
      // Top pipe
      k.add([
        k.sprite("pipe"),
        k.pos(k.width(), pipeY - config.PIPE_GAP),
        k.area(),
        k.move(k.LEFT, config.PIPE_SPEED),
        k.scale(pipeScale, -pipeScale),
        k.anchor("botleft"),
        "pipe",
        { passed: false }
      ]);

      // Bottom pipe
      k.add([
        k.sprite("pipe"),
        k.pos(k.width(), pipeY),
        k.area(),
        k.move(k.LEFT, config.PIPE_SPEED),
        k.scale(pipeScale, pipeScale),
        k.anchor("topleft"),
        "pipe",
        { passed: false }
      ]);
    }

    // Spawn initial pipes
    spawnPipe();

    // Spawn pipes every 2.5 seconds
    k.onUpdate(() => {
      if (k.time() % 2.5 < k.dt()) {
        spawnPipe();
      }
    });

    // Move base
    k.onUpdate(() => {
      base1.pos.x -= config.PIPE_SPEED * k.dt();
      base2.pos.x -= config.PIPE_SPEED * k.dt();

      if (base1.pos.x <= -base1.width * config.baseScale) {
        base1.pos.x = base2.pos.x + base2.width * config.baseScale;
      }
      if (base2.pos.x <= -base2.width * config.baseScale) {
        base2.pos.x = base1.pos.x + base1.width * config.baseScale;
      }
    });

    // Bird controls
    k.onKeyPress("space", () => {
      bird.jump(config.BIRD_JUMP_FORCE);
      k.play("jump");
    });

    k.onClick(() => {
      bird.jump(config.BIRD_JUMP_FORCE);
      k.play("jump");
    });

    // Apply gravity
    k.onUpdate(() => {
      bird.vel.y += config.GRAVITY * k.dt();
    });

    // Remove pipes that go off screen
    k.onUpdate("pipe", (pipe) => {
      if (pipe.pos.x < -pipe.width) {
        k.destroy(pipe);
      }
    });

    // Score when passing pipes
    k.onUpdate("pipe", (pipe) => {
      if (pipe.pos.x + pipe.width < bird.pos.x && !pipe.passed) {
        pipe.passed = true;
        score += 0.5; // Each pipe pair gives 1 point
        if (score % 1 === 0) { // Only update text for whole numbers
          scoreText.text = Math.floor(score).toString();
          k.play("score");
        }
      }
    });

    // Collision with pipes
    bird.onCollide("pipe", () => {
      k.play("hit");
      k.wait(0.1, () => {
        k.play("die");
        k.go("gameover", score);
      });
    });

    // Collision with ground
    bird.onUpdate(() => {
      if (bird.pos.y > k.height() - 50 * (height / 640)) {
        k.play("hit");
        k.wait(0.1, () => {
          k.play("die");
          k.go("gameover", score);
        });
      }

      // Collision with ceiling
      if (bird.pos.y < 0) {
        bird.pos.y = 0;
        bird.vel.y = 0;
      }
    });
  });
} 