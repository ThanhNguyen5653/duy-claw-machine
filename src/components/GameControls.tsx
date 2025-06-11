
import React from 'react';
import { Pause, RotateCcw } from 'lucide-react';

interface GameControlsProps {
  gameState: 'playing' | 'paused' | 'gameOver';
  onPause: () => void;
  onReset: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({ gameState, onPause, onReset }) => {
  return (
    <div className="flex gap-6 mt-8">
      <button
        onClick={onPause}
        className={`px-8 py-4 text-xl font-bold retro-text neon-border transition-all duration-300 transform hover:scale-105 ${
          gameState === 'paused' 
            ? 'bg-gradient-to-r from-green-600 to-green-700' 
            : 'bg-gradient-to-r from-pink-600 to-pink-700'
        }`}
        style={{ color: 'hsl(var(--neon-cyan))' }}
      >
        <Pause className="inline-block mr-2" size={24} />
        {gameState === 'paused' ? 'RESUME' : 'PAUSE'}
      </button>
      
      <button
        onClick={onReset}
        className="px-8 py-4 text-xl font-bold retro-text neon-border bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 transition-all duration-300 transform hover:scale-105"
        style={{ color: 'hsl(var(--neon-cyan))' }}
      >
        <RotateCcw className="inline-block mr-2" size={24} />
        RESET
      </button>
    </div>
  );
};

export default GameControls;
