import kaboom from "kaboom";

export function initializeKaboom(canvas: HTMLCanvasElement) {
  // Initialize Kaboom
  const k = kaboom({
    canvas: canvas,
    width: 800,
    height: 600,
    scale: 1,
    debug: false,
    stretch: true,
    letterbox: true,
  });

  // Load sprites
  k.loadSprite("background", "/sprites/background-day.png");
  k.loadSprite("bird", "/sprites/yellowbird-midflap.png");
  k.loadSprite("bird-up", "/sprites/yellowbird-upflap.png");
  k.loadSprite("bird-down", "/sprites/yellowbird-downflap.png");
  k.loadSprite("pipe", "/sprites/pipe-green.png");
  k.loadSprite("base", "/sprites/base.png");
  k.loadSprite("gameover", "/sprites/gameover.png");

  // Load sounds
  k.loadSound("jump", "/audio/wing.wav");
  k.loadSound("score", "/audio/point.wav");
  k.loadSound("hit", "/audio/hit.wav");
  k.loadSound("die", "/audio/die.wav");

  // Set gravity
  k.setGravity(1600);

  // Game constants
  const PIPE_OPEN = 150;
  const PIPE_MIN = 80;
  const JUMP_FORCE = 600;
  const SPEED = 320;
  const CEILING = -100;

  // Game scene
  k.scene("game", () => {
    // Add scrolling background
    k.add([
      k.sprite("background"),
      k.pos(0, 0),
      k.scale(2.8, 1.2),
      k.fixed(),
    ]);

    // Add scrolling base/ground
    const base1 = k.add([
      k.sprite("base"),
      k.pos(0, k.height() - 100),
      k.scale(2.5, 1),
      "base",
    ]);

    const base2 = k.add([
      k.sprite("base"),
      k.pos(base1.width * 2.5, k.height() - 100),
      k.scale(2.5, 1),
      "base",
    ]);

    // Move base
    k.onUpdate("base", (base) => {
      base.move(-SPEED, 0);
      if (base.pos.x <= -base.width * 2.5) {
        base.pos.x = base.width * 2.5;
      }
    });

    // Create bird
    const bird = k.add([
      k.sprite("bird"),
      k.pos(k.width() / 4, k.height() / 2),
      k.area(),
      k.body(),
      k.scale(2),
      "bird",
    ]);

    // Bird animation
    let birdFrame = 0;
    const birdSprites = ["bird", "bird-up", "bird-down"];
    
    k.onUpdate(() => {
      birdFrame += k.dt() * 8;
      if (birdFrame >= birdSprites.length) birdFrame = 0;
      bird.use(k.sprite(birdSprites[Math.floor(birdFrame)]));
    });

    // Check for death
    bird.onUpdate(() => {
      if (bird.pos.y >= k.height() - 100 || bird.pos.y <= CEILING) {
        k.go("lose", score);
        k.play("hit");
      }
    });

    // Jump controls
    k.onKeyPress("space", () => {
      bird.jump(JUMP_FORCE);
      k.play("jump");
    });

    k.onClick(() => {
      bird.jump(JUMP_FORCE);
      k.play("jump");
    });

    // Pipe spawning function
    function spawnPipe() {
      const h1 = k.rand(PIPE_MIN, k.height() - PIPE_MIN - PIPE_OPEN - 100);
      const h2 = k.height() - h1 - PIPE_OPEN - 100;

      // Top pipe
      k.add([
        k.pos(k.width(), 0),
        k.sprite("pipe"),
        k.area(),
        k.move(k.LEFT, SPEED),
        k.offscreen({ destroy: true }),
        k.scale(2, h1 / 320),
        k.anchor("topleft"),
        "pipe",
      ]);

      // Bottom pipe
      k.add([
        k.pos(k.width(), h1 + PIPE_OPEN),
        k.sprite("pipe"),
        k.area(),
        k.move(k.LEFT, SPEED),
        k.offscreen({ destroy: true }),
        k.scale(2, h2 / 320),
        k.anchor("topleft"),
        "pipe",
        { passed: false },
      ]);
    }

    // Pipe collision
    bird.onCollide("pipe", () => {
      k.go("lose", score);
      k.play("hit");
    });

    // Score system
    let score = 0;
    const scoreLabel = k.add([
      k.text(score.toString(), { size: 48, font: "monospace" }),
      k.anchor("center"),
      k.pos(k.width() / 2, 80),
      k.fixed(),
      k.z(100),
      k.color(255, 255, 255),
      k.outline(3, k.BLACK),
    ]);

    // Check for scoring
    k.onUpdate("pipe", (pipe) => {
      if (pipe.pos.x + pipe.width <= bird.pos.x && pipe.passed === false) {
        addScore();
        pipe.passed = true;
      }
    });

    function addScore() {
      score++;
      scoreLabel.text = score.toString();
      k.play("score");
    }

    // Spawn pipes every 1.5 seconds
    k.loop(1.5, () => {
      spawnPipe();
    });
  });

  // Lose scene
  k.scene("lose", (finalScore: number) => {
    k.add([
      k.sprite("background"),
      k.pos(0, 0),
      k.scale(2.8, 1.2),
      k.fixed(),
    ]);

    k.add([
      k.sprite("base"),
      k.pos(0, k.height() - 100),
      k.scale(2.5, 1),
    ]);

    k.add([
      k.sprite("gameover"),
      k.pos(k.width() / 2, k.height() / 2 - 100),
      k.scale(2),
      k.anchor("center"),
    ]);

    k.add([
      k.text(`Score: ${finalScore}`, { size: 32, font: "monospace" }),
      k.pos(k.width() / 2, k.height() / 2),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.outline(2, k.BLACK),
    ]);

    k.add([
      k.text("Press SPACE or Click to Play Again", { size: 20, font: "monospace" }),
      k.pos(k.width() / 2, k.height() / 2 + 60),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.outline(1, k.BLACK),
    ]);

    k.onKeyPress("space", () => k.go("game"));
    k.onClick(() => k.go("game"));
  });

  // Start scene
  k.scene("start", () => {
    k.add([
      k.sprite("background"),
      k.pos(0, 0),
      k.scale(2.8, 1.2),
      k.fixed(),
    ]);

    k.add([
      k.sprite("base"),
      k.pos(0, k.height() - 100),
      k.scale(2.5, 1),
    ]);

    k.add([
      k.text("FLAPPY BIRD", { size: 48, font: "monospace" }),
      k.pos(k.width() / 2, k.height() / 2 - 100),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.outline(3, k.BLACK),
    ]);

    k.add([
      k.text("Press SPACE or Click to Start", { size: 24, font: "monospace" }),
      k.pos(k.width() / 2, k.height() / 2),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.outline(2, k.BLACK),
    ]);

    // Animated bird
    const menuBird = k.add([
      k.sprite("bird"),
      k.pos(k.width() / 2, k.height() / 2 + 50),
      k.anchor("center"),
      k.scale(3),
    ]);

    // Make bird bounce up and down
    let bounceDir = -1;
    k.onUpdate(() => {
      menuBird.pos.y += bounceDir * 30 * k.dt();
      if (menuBird.pos.y <= k.height() / 2 + 30) bounceDir = 1;
      if (menuBird.pos.y >= k.height() / 2 + 70) bounceDir = -1;
    });

    k.onKeyPress("space", () => k.go("game"));
    k.onClick(() => k.go("game"));
  });

  // Start the game
  k.go("start");

  // Return cleanup function
  return () => {
    if (k && typeof k.quit === 'function') {
      k.quit();
    }
  };
} 