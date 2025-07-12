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
    crisp: true,
    pixelDensity: 1,
  });

  // Load sprites
  k.loadSprite("background", "/sprites/background-day.png");
  k.loadSprite("bird", "/sprites/yellowbird-midflap.png");
  k.loadSprite("bird-up", "/sprites/yellowbird-upflap.png");
  k.loadSprite("bird-down", "/sprites/yellowbird-downflap.png");
  k.loadSprite("pipe", "/sprites/pipe-green.png");
  k.loadSprite("base", "/sprites/base.png");
  k.loadSprite("gameover", "/sprites/gameover.png");
  // Load power-up sprites
  k.loadSprite("coin", "/sprites/Monad Logo - Default - Logo Mark.png");
  k.loadSprite("mushroom", "/sprites/Mushroom from KAPLAY Wiki.png");
  k.loadSprite("ghostiny", "/sprites/Ghostiny from KAPLAY Crew Wiki.png");

  // Load sounds
  k.loadSound("jump", "/audio/wing.wav");
  k.loadSound("score", "/audio/point.wav");
  k.loadSound("hit", "/audio/hit.wav");
  k.loadSound("die", "/audio/die.wav");

  // Set gravity
  k.setGravity(800);

  // Game constants
  const PIPE_OPEN = 150;
  const PIPE_MIN = 80;
  const JUMP_FORCE = 220;
  const BASE_SPEED = 240;
  const SPEED_INCREASE_THRESHOLD = 2; // Increase speed after this many pipes
  const SPEED_INCREASE_AMOUNT = 100;   // How much to increase speed by
  const STRAIGHT_LINE_STAGE_START = 4; // Start straight line stage after this many pipes
  const STRAIGHT_LINE_STAGE_DURATION = 5; // How many pipes in straight line stage
  const CEILING = -100;

  // Game scene
  k.scene("game", () => {
    // Game state variables
    let score = 0;
    let coins = 0;
    let doublePointsActive = false;
    let doublePointsTimer = 0;
    let ghostModeActive = false;
    let ghostModeTimer = 0;
    let currentSpeed = BASE_SPEED;
    let inStraightLineStage = false;
    let straightLineStageCounter = 0;
    let straightLineGapPosition = 0; // Store the gap position for straight line stage
    let pipeSpawnTimer = 0;
    const basePipeSpawnInterval = 1.5; // Base interval for pipe spawning

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

    // Move base with current speed
    k.onUpdate("base", (base) => {
      base.move(-currentSpeed, 0);
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
      k.opacity(1),
      "bird",
    ]);

    // Bird animation
    let birdFrame = 0;
    const birdSprites = ["bird", "bird-up", "bird-down"];
    
    k.onUpdate(() => {
      birdFrame += k.dt() * 10;
      if (birdFrame >= birdSprites.length) birdFrame = 0;
      bird.use(k.sprite(birdSprites[Math.floor(birdFrame)]));
      
      // Dynamic pipe spawning based on speed
      pipeSpawnTimer += k.dt();
      const dynamicSpawnInterval = basePipeSpawnInterval * (BASE_SPEED / currentSpeed);
      
      if (pipeSpawnTimer >= dynamicSpawnInterval) {
        spawnPipe();
        pipeSpawnTimer = 0;
      }
    });

    // Check for death
    bird.onUpdate(() => {
      if (bird.pos.y >= k.height() - 100 || bird.pos.y <= CEILING) {
        k.go("lose", { score, coins });
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

    // UI Elements
    const scoreLabel = k.add([
      k.text(`Score: ${score}`, { size: 24, font: "monospace" }),
      k.anchor("topright"),
      k.pos(k.width() - 20, 20),
      k.fixed(),
      k.z(100),
      k.color(255, 255, 255),
      k.outline(2, k.BLACK),
    ]);

    const coinLabel = k.add([
      k.text(`Coins: ${coins}`, { size: 24, font: "monospace" }),
      k.anchor("topleft"),
      k.pos(20, 20),
      k.fixed(),
      k.z(100),
      k.color(255, 215, 0),
      k.outline(2, k.BLACK),
    ]);

    const doublePointsLabel = k.add([
      k.text("", { size: 20, font: "monospace" }),
      k.anchor("topleft"),
      k.pos(20, 50),
      k.fixed(),
      k.z(100),
      k.color(255, 100, 255),
      k.outline(2, k.BLACK),
    ]);

    const ghostModeLabel = k.add([
      k.text("", { size: 20, font: "monospace" }),
      k.anchor("topleft"),
      k.pos(20, 80),
      k.fixed(),
      k.z(100),
      k.color(150, 255, 150),
      k.outline(2, k.BLACK),
    ]);

    // Speed indicator
    const speedLabel = k.add([
      k.text(`Speed: ${Math.round(currentSpeed)}`, { size: 18, font: "monospace" }),
      k.anchor("topleft"),
      k.pos(20, 110),
      k.fixed(),
      k.z(100),
      k.color(255, 255, 100),
      k.outline(2, k.BLACK),
    ]);

    // Straight line stage indicator
    const stageLabel = k.add([
      k.text("", { size: 16, font: "monospace" }),
      k.anchor("topleft"),
      k.pos(20, 140),
      k.fixed(),
      k.z(100),
      k.color(255, 100, 100),
      k.outline(2, k.BLACK),
    ]);

    // Power-up timers update
    k.onUpdate(() => {
      // Double points timer
      if (doublePointsActive) {
        doublePointsTimer -= k.dt();
        doublePointsLabel.text = `Double Points: ${Math.ceil(doublePointsTimer)}s`;
        if (doublePointsTimer <= 0) {
          doublePointsActive = false;
          doublePointsLabel.text = "";
        }
      }

      // Ghost mode timer
      if (ghostModeActive) {
        ghostModeTimer -= k.dt();
        ghostModeLabel.text = `Ghost Mode: ${Math.ceil(ghostModeTimer)}s`;
        // Make bird semi-transparent during ghost mode
        bird.opacity = 0.6;
        if (ghostModeTimer <= 0) {
          ghostModeActive = false;
          ghostModeLabel.text = "";
          bird.opacity = 1;
        }
      }

      // Update speed display
      speedLabel.text = `Speed: ${Math.round(currentSpeed)}`;
      
      // Update stage display
      if (inStraightLineStage) {
        stageLabel.text = `STRAIGHT LINE: ${STRAIGHT_LINE_STAGE_DURATION - straightLineStageCounter} left`;
      } else {
        stageLabel.text = "";
      }
    });

    // Track current pipe gap for safe spawning
    let currentPipeGap = { top: 0, bottom: 0 };

    // Coin spawning function - spawn in safe areas only
    function spawnCoin() {
      // Wait a bit to ensure pipe gap is set correctly
      k.wait(0.1, () => {
        // Only spawn if we have a safe gap defined
        if (currentPipeGap.top > 0 && currentPipeGap.bottom > 0) {
          const safeZoneStart = currentPipeGap.top + 40; // 40px margin from top pipe
          const safeZoneEnd = currentPipeGap.bottom - 40; // 40px margin from bottom pipe
          
          if (safeZoneEnd > safeZoneStart) {
            const y = k.rand(safeZoneStart, safeZoneEnd);
            k.add([
              k.sprite("coin"),
              k.pos(k.width() + 100, y),
              k.area(),
              k.offscreen({ destroy: true }),
              k.scale(0.15),
              k.anchor("center"),
              "coin",
            ]);
          }
        } else {
          // Fallback: spawn in middle area if no pipe gap data
          const y = k.rand(200, k.height() - 200);
          k.add([
            k.sprite("coin"),
            k.pos(k.width() + 100, y),
            k.area(),
            k.offscreen({ destroy: true }),
            k.scale(0.15),
            k.anchor("center"),
            "coin",
          ]);
        }
      });
    }

    // Power-up spawning functions - spawn in safe areas only
    function spawnMushroom() {
      // Wait a bit to ensure pipe gap is set correctly
      k.wait(0.1, () => {
        // Only spawn if we have a safe gap defined
        if (currentPipeGap.top > 0 && currentPipeGap.bottom > 0) {
          const safeZoneStart = currentPipeGap.top + 50; // 50px margin from top pipe
          const safeZoneEnd = currentPipeGap.bottom - 50; // 50px margin from bottom pipe
          
          if (safeZoneEnd > safeZoneStart) {
            const y = k.rand(safeZoneStart, safeZoneEnd);
            k.add([
              k.sprite("mushroom"),
              k.pos(k.width() + 150, y),
              k.area(),
              k.offscreen({ destroy: true }),
              k.scale(0.4),
              k.anchor("center"),
              "mushroom",
            ]);
          }
        } else {
          // Fallback: spawn in middle area if no pipe gap data
          const y = k.rand(200, k.height() - 200);
          k.add([
            k.sprite("mushroom"),
            k.pos(k.width() + 150, y),
            k.area(),
            k.offscreen({ destroy: true }),
            k.scale(0.4),
            k.anchor("center"),
            "mushroom",
          ]);
        }
      });
    }

    function spawnGhostiny() {
      // Wait a bit to ensure pipe gap is set correctly
      k.wait(0.1, () => {
        // Only spawn if we have a safe gap defined
        if (currentPipeGap.top > 0 && currentPipeGap.bottom > 0) {
          const safeZoneStart = currentPipeGap.top + 50; // 50px margin from top pipe
          const safeZoneEnd = currentPipeGap.bottom - 50; // 50px margin from bottom pipe
          
          if (safeZoneEnd > safeZoneStart) {
            const y = k.rand(safeZoneStart, safeZoneEnd);
            k.add([
              k.sprite("ghostiny"),
              k.pos(k.width() + 150, y),
              k.area(),
              k.offscreen({ destroy: true }),
              k.scale(0.7), // Increased size from 0.4 to 0.7
              k.anchor("center"),
              "ghostiny",
            ]);
          }
        } else {
          // Fallback: spawn in middle area if no pipe gap data
          const y = k.rand(200, k.height() - 200);
          k.add([
            k.sprite("ghostiny"),
            k.pos(k.width() + 150, y),
            k.area(),
            k.offscreen({ destroy: true }),
            k.scale(0.7), // Increased size from 0.4 to 0.7
            k.anchor("center"),
            "ghostiny",
          ]);
        }
      });
    }

    // Pipe spawning function
    function spawnPipe() {
      let h1, h2;
      
      // Check if we should start straight line stage
      if (score >= STRAIGHT_LINE_STAGE_START && score % 10 === 0 && !inStraightLineStage) {
        inStraightLineStage = true;
        straightLineStageCounter = 0;
        // Set a consistent gap position for the straight line stage
        straightLineGapPosition = k.rand(PIPE_MIN + 50, k.height() - PIPE_MIN - PIPE_OPEN - 150);
      }
      
      // Check if we're in straight line stage
      if (inStraightLineStage) {
        // Create straight line pipes with consistent gap position
        h1 = straightLineGapPosition;
        h2 = k.height() - h1 - PIPE_OPEN - 100;
        straightLineStageCounter++;
        
        if (straightLineStageCounter >= STRAIGHT_LINE_STAGE_DURATION) {
          inStraightLineStage = false;
          straightLineStageCounter = 0;
        }
      } else {
        // Normal random pipe generation
        h1 = k.rand(PIPE_MIN, k.height() - PIPE_MIN - PIPE_OPEN - 100);
        h2 = k.height() - h1 - PIPE_OPEN - 100;
      }

      // Update current pipe gap for safe spawning (fixed calculation)
      currentPipeGap = {
        top: h1,
        bottom: h1 + PIPE_OPEN + 100 // Fixed: account for base height
      };

      // Top pipe
      k.add([
        k.pos(k.width(), 0),
        k.sprite("pipe"),
        k.area(),
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
        k.offscreen({ destroy: true }),
        k.scale(2, h2 / 320),
        k.anchor("topleft"),
        "pipe",
        { passed: false },
      ]);
    }

    // Update all moving objects with current speed
    k.onUpdate("coin", (coin) => {
      coin.pos.x -= currentSpeed * k.dt();
    });

    k.onUpdate("mushroom", (mushroom) => {
      mushroom.pos.x -= currentSpeed * k.dt();
    });

    k.onUpdate("ghostiny", (ghostiny) => {
      ghostiny.pos.x -= currentSpeed * k.dt();
    });

    k.onUpdate("pipe", (pipe) => {
      pipe.pos.x -= currentSpeed * k.dt();
    });

    // Collision handlers
    
    // Coin collision
    bird.onCollide("coin", (coin) => {
      coin.destroy();
      const coinValue = doublePointsActive ? 2 : 1;
      coins += coinValue;
      coinLabel.text = `Coins: ${coins}`;
      k.play("score");
    });

    // Mushroom collision
    bird.onCollide("mushroom", (mushroom) => {
      mushroom.destroy();
      doublePointsActive = true;
      doublePointsTimer = 5;
      k.play("score");
    });

    // Ghostiny collision
    bird.onCollide("ghostiny", (ghostiny) => {
      ghostiny.destroy();
      ghostModeActive = true;
      ghostModeTimer = 5;
      k.play("score");
    });

    // Pipe collision (only if not in ghost mode)
    bird.onCollide("pipe", () => {
      if (!ghostModeActive) {
        k.go("lose", { score, coins });
        k.play("hit");
      }
    });

    // Check for scoring
    k.onUpdate("pipe", (pipe) => {
      if (pipe.pos.x + pipe.width <= bird.pos.x && pipe.passed === false) {
        addScore();
        pipe.passed = true;
      }
    });

    function addScore() {
      score++;
      scoreLabel.text = `Score: ${score}`;
      k.play("score");
      
      // Increase speed after every SPEED_INCREASE_THRESHOLD pipes
      if (score > 0 && score % SPEED_INCREASE_THRESHOLD === 0) {
        currentSpeed += SPEED_INCREASE_AMOUNT;
      }
    }

    // Remove the old static spawning loops - pipes now spawn dynamically
    // Spawn coins - single loop to prevent overlapping
    k.loop(2.2, () => {
      spawnCoin();
    });

    k.loop(5, () => {
      if (k.rand() < 0.5) {
        spawnMushroom();
      }
    });

    k.loop(6, () => {
      if (k.rand() < 0.4) {
        spawnGhostiny();
      }
    });
  });

  // Lose scene
  k.scene("lose", (gameData: { score: number; coins: number }) => {
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
      k.text(`Score: ${gameData.score}`, { size: 32, font: "monospace" }),
      k.pos(k.width() / 2, k.height() / 2),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.outline(2, k.BLACK),
    ]);

    k.add([
      k.text(`Coins: ${gameData.coins}`, { size: 24, font: "monospace" }),
      k.pos(k.width() / 2, k.height() / 2 + 40),
      k.anchor("center"),
      k.color(255, 215, 0),
      k.outline(2, k.BLACK),
    ]);

    k.add([
      k.text("Press SPACE or Click to Play Again", { size: 20, font: "monospace" }),
      k.pos(k.width() / 2, k.height() / 2 + 80),
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