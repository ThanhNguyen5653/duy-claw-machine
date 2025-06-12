import React from 'react';

interface PlushieData {
  id: number;
  x: number;
  y: number;
  type: 'generic' | 'medium' | 'good';
  imagePath: string;
  value: number;
  isGrabbed: boolean;
  isFalling: boolean;
  isDropping: boolean;
}

interface SidebarProps {
  side: 'left' | 'right';
  coinsLeft?: number;
  topPlushies?: PlushieData[];
}

const Sidebar: React.FC<SidebarProps> = ({ side, coinsLeft, topPlushies = [] }) => {
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
          🏆 TOP PRIZES
        </div>
        
        {/* Display shelf with top 3 plushies */}
        <div className="space-y-4">
          {[0, 1, 2].map((index) => {
            const plushie = topPlushies[index];
            return (
              <div 
                key={index}
                className="h-20 bg-gradient-to-r from-amber-600 to-amber-800 rounded-lg border-2 border-amber-400 flex items-center justify-between px-4 shadow-lg"
                style={{ 
                  background: plushie 
                    ? 'linear-gradient(to right, #d97706, #92400e)' 
                    : 'linear-gradient(to right, #374151, #1f2937)'
                }}
              >
                <div className="text-2xl font-bold retro-text" style={{ color: 'hsl(var(--neon-yellow))' }}>
                  #{index + 1}
                </div>
                
                {plushie ? (
                  <div className="flex items-center gap-3">
                    <img 
                      src={plushie.imagePath} 
                      alt="Prize" 
                      className="w-12 h-12 object-contain"
                    />
                    <div className="text-xl font-bold retro-text" style={{ color: 'hsl(var(--neon-yellow))' }}>
                      ${plushie.value}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-lg">Empty</div>
                )}
              </div>
            );
          })}
        </div>
        
        {topPlushies.length > 0 && (
          <div className="mt-6 text-lg retro-text" style={{ color: 'hsl(var(--neon-pink))' }}>
            Total Value: ${topPlushies.slice(0, 3).reduce((sum, p) => sum + p.value, 0)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;