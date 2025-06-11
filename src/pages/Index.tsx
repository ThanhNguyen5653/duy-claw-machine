
import { useState, useEffect } from 'react';
import GameContainer from '../components/GameContainer';
import StartScreen from '../components/StartScreen';

type GameState = 'start' | 'playing' | 'paused' | 'gameOver';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [coinsLeft, setCoinsLeft] = useState(3);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setCoinsLeft(3);
  };

  const pauseGame = () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused');
  };

  const endGame = () => {
    setGameState('gameOver');
  };

  const resetGame = () => {
    setGameState('start');
  };

  const addScore = (points: number) => {
    setScore(prev => prev + points);
  };

  const useArcade = () => {
    setCoinsLeft(prev => {
      const newCoins = prev - 1;
      if (newCoins <= 0) {
        setTimeout(() => endGame(), 1000);
      }
      return newCoins;
    });
  };

  if (gameState === 'start') {
    return <StartScreen onStart={startGame} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      <GameContainer
        gameState={gameState}
        score={score}
        coinsLeft={coinsLeft}
        onPause={pauseGame}
        onReset={resetGame}
        onAddScore={addScore}
        onUseCoin={useArcade}
      />
    </div>
  );
};

export default Index;
