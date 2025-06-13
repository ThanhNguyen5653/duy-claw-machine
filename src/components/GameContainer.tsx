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
  onRestart: () => void;
  onUseCoin: () => void;
  onAddCoin: () => void;
  topPlushies: PlushieData[];
  onUpdateTopPlushies: (plushie: PlushieData) => void;
}

const GameContainer: React.FC<GameContainerProps> = ({
  gameState,
  coinsLeft,
  onPause,
  onRestart,
  onUseCoin,
  onAddCoin,
  topPlushies,
  onUpdateTopPlushies
}) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [allCollectedPlushies, setAllCollectedPlushies] = useState<PlushieData[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  // Timer logic - FIXED PAUSE FUNCTIONALITY
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
    if (timeLeft === 0) {
      setTimeLeft(30);
    }
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

  // NEW COIN SYSTEM: Use coin at start of turn, get coin back on successful grab
  const handleSuccessfulGrab = (plushie: PlushieData) => {
    // Add to all collected plushies for overall total calculation
    setAllCollectedPlushies(prev => [...prev, plushie]);
    
    // Update top 3 display
    onUpdateTopPlushies(plushie);
    
    // Return 1 coin for successful grab (but never exceed 3 coins)
    onAddCoin();
  };

  const handleFailedGrab = () => {
    // Coin was already used at start of turn, no additional penalty
    onUseCoin();
  };

  // Calculate overall total value
  const overallTotal = allCollectedPlushies.reduce((sum, plushie) => sum + plushie.value, 0);

  // Handle game restart - reset all collected plushies
  const handleRestart = () => {
    setAllCollectedPlushies([]);
    resetTimer();
    onRestart();
  };

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 retro-text neon-glow" 
              style={{ color: 'hsl(var(--neon-pink))' }}>
            GAME OVER
          </h2>
          <div className="text-2xl md:text-3xl retro-text mb-8" style={{ color: 'hsl(var(--neon-yellow))' }}>
            FINAL COLLECTION
          </div>
          
          {/* Display top 3 plushies */}
          <div className="flex justify-center gap-4 md:gap-8 mb-8 flex-wrap">
            {topPlushies.slice(0, 3).map((plushie, index) => (
              <div key={plushie.id} className="text-center">
                <div className="text-lg retro-text mb-2" style={{ color: 'hsl(var(--neon-cyan))' }}>
                  #{index + 1}
                </div>
                <img 
                  src={plushie.imagePath} 
                  alt="Top Plushie" 
                  className="w-12 h-12 md:w-16 md:h-16 object-contain mx-auto mb-2"
                />
                <div className="text-lg md:text-xl font-bold retro-text" style={{ color: 'hsl(var(--neon-yellow))' }}>
                  ${plushie.value}
                </div>
              </div>
            ))}
          </div>
          
          {/* UPDATED: Show overall total instead of just top 3 */}
          <div className="text-xl md:text-2xl retro-text mb-8" style={{ color: 'hsl(var(--neon-green))' }}>
            Overall Total: ${overallTotal}
          </div>
          
          <button
            onClick={handleRestart}
            className="px-6 md:px-8 py-3 md:py-4 text-xl md:text-2xl font-bold retro-text neon-border bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 transition-all duration-300"
            style={{ color: 'hsl(var(--neon-cyan))' }}
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row p-4 gap-4">
      {/* Left Sidebar - Coins */}
      <Sidebar side="left" coinsLeft={coinsLeft} />
      
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-4 retro-text neon-glow animate-neon-pulse" 
            style={{ color: 'hsl(var(--neon-cyan))' }}>
          DUY'S CLAW MACHINE
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
          onRestart={handleRestart}
        />
      </div>

      {/* Right Sidebar - Top Plushies Display with Overall Total */}
      <Sidebar 
        side="right" 
        topPlushies={topPlushies} 
        totalValue={overallTotal} 
      />
    </div>
  );
};

export default GameContainer;