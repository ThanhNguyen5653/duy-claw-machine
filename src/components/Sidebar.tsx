
import React from 'react';

interface SidebarProps {
  side: 'left' | 'right';
  coinsLeft?: number;
  score?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ side, coinsLeft, score }) => {
  if (side === 'left') {
    return (
      <div className="w-80 p-6 neon-border machine-frame">
        <div className="text-center">
          <div className="text-3xl font-bold retro-text neon-glow mb-6" 
               style={{ color: 'hsl(var(--neon-yellow))' }}>
            🪙 COINS
          </div>
          <div className="flex justify-center items-center gap-4 mb-6">
            {[1, 2, 3].map((coin) => (
              <div
                key={coin}
                className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-bold ${
                  coin <= (coinsLeft || 0)
                    ? 'bg-yellow-400 border-yellow-600 text-yellow-900'
                    : 'bg-gray-600 border-gray-800 text-gray-400'
                }`}
              >
                🪙
              </div>
            ))}
          </div>
          <div className="text-xl retro-text" style={{ color: 'hsl(var(--neon-cyan))' }}>
            Turns Left: {coinsLeft || 0}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 p-6 neon-border machine-frame">
      <div className="text-center">
        <div className="text-3xl font-bold retro-text neon-glow mb-6" 
             style={{ color: 'hsl(var(--neon-green))' }}>
          💰 MONEY
        </div>
        <div className="text-6xl font-bold retro-text neon-glow mb-6" 
             style={{ color: 'hsl(var(--neon-yellow))' }}>
          ${score || 0}
        </div>
        <div className="text-lg retro-text mb-4" style={{ color: 'hsl(var(--neon-pink))' }}>
          Rank
        </div>
        <div className="px-4 py-2 neon-border bg-gradient-to-r from-orange-600 to-yellow-600 text-xl font-bold retro-text">
          {(score || 0) < 50 ? 'Rookie' : (score || 0) < 100 ? 'Pro' : 'Master'}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
