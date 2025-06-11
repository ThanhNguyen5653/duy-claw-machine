
import React, { useState, useEffect, useRef } from 'react';
import ClawMachine from './ClawMachine';
import Sidebar from './Sidebar';
import GameControls from './GameControls';

interface GameContainerProps {
  gameState: 'playing' | 'paused' | 'gameOver';
  score: number;
  coinsLeft: number;
  onPause: () => void;
  onReset: () => void;
  onAddScore: (points: number) => void;
  onUseCoin: () => void;
}

const GameContainer: React.FC<GameContainerProps> = ({
  gameState,
  score,
  coinsLeft,
  onPause,
  onReset,
  onAddScore,
  onUseCoin
}) => {
  const [timeLeft, setTimeLeft] = useState(20);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isTimerActive && gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      // Timer expired - lose a turn
      onUseCoin();
      resetTimer();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, isTimerActive, gameState, onUseCoin]);

  const startTimer = () => {
    setIsTimerActive(true);
    setTimeLeft(20);
  };

  const resetTimer = () => {
    setIsTimerActive(false);
    setTimeLeft(20);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleSuccessfulGrab = () => {
    onAddScore(1);
    resetTimer();
  };

  const handleFailedGrab = () => {
    onUseCoin();
    resetTimer();
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
            FINAL SCORE: {score}
          </div>
          <button
            onClick={onReset}
            className="px-8 py-4 text-2xl font-bold retro-text neon-border bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 transition-all duration-300"
            style={{ color: 'hsl(var(--neon-cyan))' }}
          >
            TRY AGAIN
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
        
        {/* Timer */}
        <div className="mb-4 text-2xl retro-text" 
             style={{ color: isTimerActive ? 'hsl(var(--neon-yellow))' : 'hsl(var(--muted-foreground))' }}>
          TIME: {timeLeft}
        </div>

        {/* Claw Machine */}
        <ClawMachine
          gameState={gameState}
          onStartTimer={startTimer}
          onSuccessfulGrab={handleSuccessfulGrab}
          onFailedGrab={handleFailedGrab}
        />

        {/* Game Controls */}
        <GameControls
          gameState={gameState}
          onPause={onPause}
          onReset={onReset}
        />
      </div>

      {/* Right Sidebar - Score */}
      <Sidebar side="right" score={score} />
    </div>
  );
};

export default GameContainer;
