export interface GameConfig {
  PIPE_SPEED: number;
  PIPE_GAP: number;
  BIRD_JUMP_FORCE: number;
  GRAVITY: number;
  baseScale: number;
  birdScale: number;
}

export function createGameConfig(width: number, height: number): GameConfig {
  return {
    PIPE_SPEED: width * 0.33, // Speed relative to screen width
    PIPE_GAP: height * 0.15, // Gap relative to screen height
    BIRD_JUMP_FORCE: height * 0.5, // Jump force relative to screen height
    GRAVITY: height * 1.3, // Gravity relative to screen height
    baseScale: width / 336,
    birdScale: Math.min(width / 480, height / 640) * 1.5,
  };
}

export const GAME_ASSETS = {
  sprites: {
    background: "/sprites/background-day.png",
    bird: "/sprites/yellowbird-midflap.png",
    birdUp: "/sprites/yellowbird-upflap.png",
    birdDown: "/sprites/yellowbird-downflap.png",
    pipe: "/sprites/pipe-green.png",
    base: "/sprites/base.png",
    gameover: "/sprites/gameover.png",
  },
  sounds: {
    jump: "/audio/wing.wav",
    score: "/audio/point.wav",
    hit: "/audio/hit.wav",
    die: "/audio/die.wav",
  },
};

export function getGameDimensions() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Maintain aspect ratio similar to classic Flappy Bird (3:4)
  const aspectRatio = 3 / 4;
  let gameWidth = Math.min(viewportWidth * 0.9, 600);
  let gameHeight = gameWidth / aspectRatio;
  
  // If height is too tall for viewport, scale down
  if (gameHeight > viewportHeight * 0.9) {
    gameHeight = viewportHeight * 0.9;
    gameWidth = gameHeight * aspectRatio;
  }
  
  return { width: gameWidth, height: gameHeight };
} 