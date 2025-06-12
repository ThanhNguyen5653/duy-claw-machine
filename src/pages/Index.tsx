import { useState, useEffect } from 'react';
import GameContainer from '../components/GameContainer';
import StartScreen from '../components/StartScreen';

type GameState = 'start' | 'playing' | 'paused' | 'gameOver';

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

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [coinsLeft, setCoinsLeft] = useState(3);
  const [topPlushies, setTopPlushies] = useState<PlushieData[]>([]);

  const startGame = () => {
    setGameState('playing');
    setCoinsLeft(3);
    setTopPlushies([]);
  };

  const pauseGame = () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused');
  };

  const endGame = () => {
    setGameState('gameOver');
  };

  const resetGame = () => {
    // Reset to current game state but clear progress
    setCoinsLeft(3);
    setTopPlushies([]);
    setGameState('playing');
  };

  const restartGame = () => {
    // Go back to start screen
    setGameState('start');
    setCoinsLeft(3);
    setTopPlushies([]);
  };

  const updateTopPlushies = (newPlushie: PlushieData) => {
    setTopPlushies(prev => {
      const updated = [...prev, newPlushie];
      // Sort by value (highest first) and keep only top 3
      return updated.sort((a, b) => b.value - a.value).slice(0, 3);
    });
  };

  const useCoin = () => {
    setCoinsLeft(prev => {
      const newCoins = prev - 1;
      if (newCoins <= 0) {
        setTimeout(() => endGame(), 1000);
      }
      return newCoins;
    });
  };

  // CAPPED COIN SYSTEM - Maximum 6 coins
  const addCoin = () => {
    setCoinsLeft(prev => Math.min(prev + 1, 6)); // Cap at 6 coins maximum
  };

  if (gameState === 'start') {
    return <StartScreen onStart={startGame} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      <GameContainer
        gameState={gameState}
        coinsLeft={coinsLeft}
        onPause={pauseGame}
        onReset={resetGame}
        onRestart={restartGame}
        onUseCoin={useCoin}
        onAddCoin={addCoin}
        topPlushies={topPlushies}
        onUpdateTopPlushies={updateTopPlushies}
      />
    </div>
  );
};

export default Index;