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
  totalValue?: number; // NEW PROP FOR OVERALL TOTAL
}

const Sidebar: React.FC<SidebarProps> = ({ side, coinsLeft, topPlushies = [], totalValue = 0 }) => {
  if (side === 'left') {
    return (
      <div className="w-64 p-4 neon-border machine-frame">
        <div className="text-center">
          <div className="text-2xl font-bold retro-text neon-glow mb-4" 
               style={{ color: 'hsl(var(--neon-yellow))' }}>
            🪙 COINS
          </div>
          
          {/* Base 3 coins */}
          <div className="flex justify-center items-center gap-2 mb-4">
            {[1, 2, 3].map((coin) => (
              <div
                key={coin}
                className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-lg font-bold ${
                  coin <= (coinsLeft || 0)
                    ? 'bg-yellow-400 border-yellow-600 text-yellow-900'
                    : 'bg-gray-600 border-gray-800 text-gray-400'
                }`}
              >
                🪙
              </div>
            ))}
          </div>
          
          {/* Extra coins if more than 3 - CAPPED AT 3 BONUS COINS */}
          {(coinsLeft || 0) > 3 && (
            <div className="mb-4">
              <div className="text-sm retro-text mb-2" style={{ color: 'hsl(var(--neon-green))' }}>
                BONUS COINS
              </div>
              <div className="flex justify-center flex-wrap gap-1">
                {Array.from({ length: Math.min((coinsLeft || 0) - 3, 3) }, (_, i) => (
                  <div
                    key={`extra-${i}`}
                    className="w-8 h-8 rounded-full bg-gold-400 border-2 border-gold-600 flex items-center justify-center text-xs"
                    style={{ backgroundColor: '#ffd700', borderColor: '#b8860b' }}
                  >
                    🪙
                  </div>
                ))}
              </div>
              {/* Show overflow indicator if more than 6 total coins */}
              {(coinsLeft || 0) > 6 && (
                <div className="text-xs retro-text mt-1" style={{ color: 'hsl(var(--neon-pink))' }}>
                  +{(coinsLeft || 0) - 6} more
                </div>
              )}
            </div>
          )}
          
          <div className="text-lg retro-text" style={{ color: 'hsl(var(--neon-cyan))' }}>
            Total: {coinsLeft || 0}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 p-4 neon-border machine-frame">
      <div className="text-center">
        <div className="text-2xl font-bold retro-text neon-glow mb-4" 
             style={{ color: 'hsl(var(--neon-green))' }}>
          🏆 TOP PRIZES
        </div>
        
        {/* Display shelf with top 3 plushies */}
        <div className="space-y-3">
          {[0, 1, 2].map((index) => {
            const plushie = topPlushies[index];
            return (
              <div 
                key={index}
                className="h-16 bg-gradient-to-r from-amber-600 to-amber-800 rounded-lg border-2 border-amber-400 flex items-center justify-between px-3 shadow-lg"
                style={{ 
                  background: plushie 
                    ? 'linear-gradient(to right, #d97706, #92400e)' 
                    : 'linear-gradient(to right, #374151, #1f2937)'
                }}
              >
                <div className="text-lg font-bold retro-text" style={{ color: 'hsl(var(--neon-yellow))' }}>
                  #{index + 1}
                </div>
                
                {plushie ? (
                  <div className="flex items-center gap-2">
                    <img 
                      src={plushie.imagePath} 
                      alt="Prize" 
                      className="w-10 h-10 object-contain"
                    />
                    <div className="text-lg font-bold retro-text" style={{ color: 'hsl(var(--neon-yellow))' }}>
                      ${plushie.value}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Empty</div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* UPDATED: Show overall total instead of just top 3 */}
        {totalValue > 0 && (
          <div className="mt-4 text-lg retro-text" style={{ color: 'hsl(var(--neon-pink))' }}>
            Overall Total: ${totalValue}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;