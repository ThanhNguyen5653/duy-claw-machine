import React, { useState, useEffect, useRef } from 'react';
import ClawMachine from './ClawMachine';
import Sidebar from './Sidebar';
import GameControls from './GameControls';

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
  dots?: any[];
}

interface GameContainerProps {
  gameState: 'playing' | 'paused' | 'gameOver';
  coinsLeft: number;
  onPause: () => void;
  onReset: () => void;
  onUseCoin: () => void;
  onAddCoin: () => void;
  topPlushies: PlushieData[];
  onUpdateTopPlushies: (plushie: PlushieData) => void;
}

const GameContainer: React.FC<GameContainerProps> = ({
  gameState,
  coinsLeft,
  onPause,
  onReset,
  onUseCoin,
  onAddCoin,
  topPlushies,
  onUpdateTopPlushies
}) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isTimerActive && !isTimerPaused && gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, isTimerActive, isTimerPaused, gameState]);

  const startTimer = () => {
    setIsTimerActive(true);
    setIsTimerPaused(false);
    setTimeLeft(30);
  };

  const pauseTimer = () => {
    setIsTimerPaused(true);
  };

  const resetTimer = () => {
    setIsTimerActive(false);
    setIsTimerPaused(false);
    setTimeLeft(30);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleSuccessfulGrab = (plushie: PlushieData) => {
    onUpdateTopPlushies(plushie);
    onAddCoin(); // Refund 1 coin for successful grab
  };

  const handleFailedGrab = () => {
    onUseCoin(); // Lose 1 coin for failed grab
  };

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-6xl font-bold mb-8 retro-text neon-glow" 
              style={{ color: 'hsl(var(--neon-pink))' }}>
            GAME OVER
          </h2>
          <div className="text-3xl retro-text mb-8" style={{ color: 'hsl(var(--neon-yellow))' }}>
            FINAL COLLECTION
          </div>
          
          {/* Display top 3 plushies */}
          <div className="flex justify-center gap-8 mb-8">
            {topPlushies.slice(0, 3).map((plushie, index) => (
              <div key={plushie.id} className="text-center">
                <div className="text-lg retro-text mb-2" style={{ color: 'hsl(var(--neon-cyan))' }}>
                  #{index + 1}
                </div>
                <img 
                  src={plushie.imagePath} 
                  alt="Top Plushie" 
                  className="w-16 h-16 object-contain mx-auto mb-2"
                />
                <div className="text-xl font-bold retro-text" style={{ color: 'hsl(var(--neon-yellow))' }}>
                  ${plushie.value}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-2xl retro-text mb-8" style={{ color: 'hsl(var(--neon-green))' }}>
            Total Value: ${topPlushies.slice(0, 3).reduce((sum, p) => sum + p.value, 0)}
          </div>
          
          <button
            onClick={onReset}
            className="px-8 py-4 text-2xl font-bold retro-text neon-border bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 transition-all duration-300"
            style={{ color: 'hsl(var(--neon-cyan))' }}
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar - Coins */}
      <Sidebar side="left" coinsLeft={coinsLeft} />
      
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-6xl font-bold mb-6 retro-text neon-glow animate-neon-pulse" 
            style={{ color: 'hsl(var(--neon-cyan))' }}>
          RETRO CLAW
        </h1>

        {/* Claw Machine */}
        <ClawMachine
          gameState={gameState}
          onStartTimer={startTimer}
          onPauseTimer={pauseTimer}
          onResetTimer={resetTimer}
          onSuccessfulGrab={handleSuccessfulGrab}
          onFailedGrab={handleFailedGrab}
          timeLeft={timeLeft}
        />

        {/* Game Controls */}
        <GameControls
          gameState={gameState}
          onPause={onPause}
          onReset={onReset}
        />
      </div>

      {/* Right Sidebar - Top Plushies Display */}
      <Sidebar side="right" topPlushies={topPlushies} />
    </div>
  );
};

export default GameContainer;