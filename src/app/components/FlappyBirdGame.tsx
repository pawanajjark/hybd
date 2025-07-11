"use client";

import { useEffect, useRef } from "react";
import { initializeKaboom } from "./game/gameSetup";

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const cleanup = initializeKaboom(canvasRef.current);

    return cleanup;
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-2">
      <div className="text-center w-full h-full max-w-screen-lg">
        <canvas 
          ref={canvasRef}
          className="border-2 border-gray-600 rounded-lg shadow-lg max-w-full max-h-full"
          style={{ 
            width: '100%', 
            height: 'auto',
            aspectRatio: '3/4'
          }}
        />
        <p className="mt-2 text-white text-xs sm:text-sm">
          Use SPACEBAR or click to jump!
        </p>
      </div>
    </div>
  );
} 