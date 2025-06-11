
import React from 'react';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-bold mb-8 retro-text neon-glow animate-neon-pulse" 
            style={{ color: 'hsl(var(--neon-cyan))' }}>
          RETRO CLAW
        </h1>
        <div className="mb-12">
          <div className="text-2xl retro-text mb-4" style={{ color: 'hsl(var(--neon-yellow))' }}>
            🎮 CLASSIC ARCADE EXPERIENCE 🎮
          </div>
          <div className="text-lg retro-text mb-2" style={{ color: 'hsl(var(--neon-pink))' }}>
            • Move mouse to control claw horizontally
          </div>
          <div className="text-lg retro-text mb-2" style={{ color: 'hsl(var(--neon-pink))' }}>
            • Left click to grab plushies
          </div>
          <div className="text-lg retro-text mb-2" style={{ color: 'hsl(var(--neon-pink))' }}>
            • 3 coins per game • 20 second timer
          </div>
        </div>
        <button
          onClick={onStart}
          className="px-12 py-6 text-3xl font-bold retro-text neon-border bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105"
          style={{ color: 'hsl(var(--neon-cyan))' }}
        >
          INSERT COIN
        </button>
      </div>
    </div>
  );
};

export default StartScreen;
