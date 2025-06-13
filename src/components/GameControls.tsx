import React from 'react';
import { Pause, Play, RefreshCw } from 'lucide-react';

interface GameControlsProps {
  gameState: 'playing' | 'paused' | 'gameOver';
  onPause: () => void;
  onRestart: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({ gameState, onPause, onRestart }) => {
  return (
    <div className="flex gap-4 mt-6">
      <button
        onClick={onPause}
        disabled={gameState === 'gameOver'}
        className={`px-6 py-3 text-lg font-bold retro-text neon-border transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
          gameState === 'paused' 
            ? 'bg-gradient-to-r from-green-600 to-green-700' 
            : 'bg-gradient-to-r from-pink-600 to-pink-700'
        }`}
        style={{ color: 'hsl(var(--neon-cyan))' }}
      >
        {gameState === 'paused' ? (
          <>
            <Play className="inline-block mr-2" size={20} />
            RESUME
          </>
        ) : (
          <>
            <Pause className="inline-block mr-2" size={20} />
            PAUSE
          </>
        )}
      </button>

      <button
        onClick={onRestart}
        className="px-6 py-3 text-lg font-bold retro-text neon-border bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105"
        style={{ color: 'hsl(var(--neon-cyan))' }}
      >
        <RefreshCw className="inline-block mr-2" size={20} />
        NEW GAME
      </button>
    </div>
  );
};

export default GameControls;