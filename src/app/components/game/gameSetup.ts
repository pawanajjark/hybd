import kaboom from "kaboom";
import { getGameDimensions, createGameConfig, GAME_ASSETS } from "./gameConfig";
import { createGameScene } from "./scenes/gameScene";
import { createStartScene } from "./scenes/startScene";
import { createGameOverScene } from "./scenes/gameOverScene";

export function initializeKaboom(canvas: HTMLCanvasElement) {
  const { width, height } = getGameDimensions();

  // Initialize Kaboom with responsive dimensions
  const k = kaboom({
    canvas: canvas,
    width: width,
    height: height,
    scale: 1,
    debug: false,
    stretch: true,
    letterbox: true,
  });

  // Load all sprites
  k.loadSprite("background", GAME_ASSETS.sprites.background);
  k.loadSprite("bird", GAME_ASSETS.sprites.bird);
  k.loadSprite("bird-up", GAME_ASSETS.sprites.birdUp);
  k.loadSprite("bird-down", GAME_ASSETS.sprites.birdDown);
  k.loadSprite("pipe", GAME_ASSETS.sprites.pipe);
  k.loadSprite("base", GAME_ASSETS.sprites.base);
  k.loadSprite("gameover", GAME_ASSETS.sprites.gameover);

  // Load sounds
  k.loadSound("jump", GAME_ASSETS.sounds.jump);
  k.loadSound("score", GAME_ASSETS.sounds.score);
  k.loadSound("hit", GAME_ASSETS.sounds.hit);
  k.loadSound("die", GAME_ASSETS.sounds.die);

  // Create game configuration
  const config = createGameConfig(width, height);

  // Create all scenes
  createGameScene(k, config, width, height);
  createStartScene(k, config, width, height);
  createGameOverScene(k, config, width, height);

  // Handle window resize
  const handleResize = () => {
    const newDimensions = getGameDimensions();
    if (canvas) {
      canvas.style.width = `${newDimensions.width}px`;
      canvas.style.height = `${newDimensions.height}px`;
    }
  };

  window.addEventListener('resize', handleResize);

  // Start the game
  k.go("start");

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
    if (k && typeof k.quit === 'function') {
      k.quit();
    }
  };
} 