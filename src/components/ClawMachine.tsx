import React, { useState, useRef, useCallback, useEffect } from 'react';
import Claw from './Claw';
import Plushie from './Plushie';

interface ClawMachineProps {
  gameState: 'playing' | 'paused' | 'gameOver';
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  onSuccessfulGrab: (plushie: PlushieData) => void;
  onFailedGrab: () => void;
  timeLeft: number;
}

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
  dots: DotData[];
}

interface DotData {
  id: string;
  x: number; // relative to plushie center
  y: number; // relative to plushie center
  color: 'green' | 'orange' | 'yellow';
  successRate: number;
}

const CLAW_GRAB_Y = 75; // Y level where claw grabs
const PLUSHIE_BASE_Y = 75; // Y level where plushies sit
const PRIZE_BOX_WIDTH = 25; // Bigger prize box
const MACHINE_WIDTH = 90; // Usable machine width percentage

const ClawMachine: React.FC<ClawMachineProps> = ({
  gameState,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onSuccessfulGrab,
  onFailedGrab,
  timeLeft
}) => {
  const machineRef = useRef<HTMLDivElement>(null);
  const [clawPosition, setClawPosition] = useState({ x: 50, y: 15 });
  const [isClawActive, setIsClawActive] = useState(false);
  const [nextPlushieId, setNextPlushieId] = useState(1);
  const [plushies, setPlushies] = useState<PlushieData[]>([]);
  const [hasStartedTimer, setHasStartedTimer] = useState(false);
  const [availableImages, setAvailableImages] = useState<{
    generic: string[];
    medium: string[];
    good: string[];
  }>({ generic: [], medium: [], good: [] });

  // Load available images
  useEffect(() => {
    const loadImages = async () => {
      const genericImages = [
        '/generic/generic.png',
        '/generic/generic2.png'
      ];
      
      const mediumImages = [
        '/medium/blue.png',
        '/medium/green.png',
        '/medium/kirby.png',
        '/medium/pikachu.png',
        '/medium/purple.png',
        '/medium/repo.png',
        '/medium/repoBlue.png',
        '/medium/white.png'
      ];
      
      const goodImages = [
        '/good/appa.png',
        '/good/duck.png',
        '/good/gaara.png'
      ];

      setAvailableImages({
        generic: genericImages,
        medium: mediumImages,
        good: goodImages
      });
    };

    loadImages();
  }, []);

  // Generate dots for a plushie
  const generateDots = (): DotData[] => {
    const dots: DotData[] = [];
    
    // Always at least 1 green dot (center)
    dots.push({
      id: 'green-center',
      x: 0,
      y: 0,
      color: 'green',
      successRate: 1.0
    });

    // Add 2-4 additional dots
    const additionalDots = Math.floor(Math.random() * 3) + 2; // 2-4 additional
    
    for (let i = 0; i < additionalDots; i++) {
      const angle = (i / additionalDots) * 2 * Math.PI;
      const radius = 15 + Math.random() * 10; // 15-25px from center
      
      const color = Math.random() < 0.3 ? 'orange' : 'yellow';
      const successRate = color === 'orange' ? 0.7 : 0.5;
      
      dots.push({
        id: `${color}-${i}`,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        color,
        successRate
      });
    }

    return dots;
  };

  // Generate plushie value
  const generatePlushieValue = (type: 'generic' | 'medium' | 'good'): number => {
    switch (type) {
      case 'generic':
        return 10;
      case 'medium':
        return Math.floor(Math.random() * 21) + 20; // $20-$40
      case 'good':
        return 80;
      default:
        return 10;
    }
  };

  // Generate plushies to maintain 6+ on screen
  const generatePlushies = (count: number): PlushieData[] => {
    const newPlushies: PlushieData[] = [];
    
    for (let i = 0; i < count; i++) {
      // Determine type with weighted distribution
      let type: 'generic' | 'medium' | 'good';
      const random = Math.random();
      
      if (random < 0.1) { // 10% chance for good
        type = 'good';
      } else if (random < 0.4) { // 30% chance for medium
        type = 'medium';
      } else { // 60% chance for generic
        type = 'generic';
      }

      const typeImages = availableImages[type];
      if (typeImages.length === 0) continue;

      const randomImage = typeImages[Math.floor(Math.random() * typeImages.length)];
      
      // Distribute across machine width, avoiding prize box area
      const minX = PRIZE_BOX_WIDTH + 5; // Start after prize box
      const maxX = MACHINE_WIDTH - 5;
      const spacing = (maxX - minX) / count;
      const x = minX + (i * spacing) + (Math.random() * 5 - 2.5); // Add slight randomness
      
      newPlushies.push({
        id: nextPlushieId + i,
        x: Math.max(minX, Math.min(maxX, x)),
        y: PLUSHIE_BASE_Y,
        type,
        imagePath: randomImage,
        value: generatePlushieValue(type),
        isGrabbed: false,
        isFalling: false,
        isDropping: false,
        dots: generateDots()
      });
    }
    
    return newPlushies;
  };

  // Initialize plushies when images are loaded
  useEffect(() => {
    if (availableImages.generic.length > 0 && plushies.length === 0) {
      const initialPlushies = generatePlushies(6);
      setPlushies(initialPlushies);
      setNextPlushieId(7);
    }
  }, [availableImages]);

  // Maintain 6+ plushies
  const maintainPlushieCount = () => {
    const activePlushies = plushies.filter(p => !p.isGrabbed && !p.isFalling && !p.isDropping);
    if (activePlushies.length < 6) {
      const needed = 6 - activePlushies.length;
      const newPlushies = generatePlushies(needed);
      
      setPlushies(prev => [...prev, ...newPlushies]);
      setNextPlushieId(prev => prev + needed);
    }
  };

  // Auto-grab when timer expires
  useEffect(() => {
    if (timeLeft === 0 && hasStartedTimer && !isClawActive && gameState === 'playing') {
      // Only auto-grab if not over prize box
      if (clawPosition.x > PRIZE_BOX_WIDTH) {
        handleClawGrab();
      } else {
        // Reset timer if over prize box
        onResetTimer();
        setHasStartedTimer(false);
      }
    }
  }, [timeLeft, hasStartedTimer, isClawActive, gameState, clawPosition.x]);

  // Mouse movement handler
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (gameState !== 'playing' || isClawActive) return;

    const rect = machineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedX = Math.max(PRIZE_BOX_WIDTH, Math.min(MACHINE_WIDTH, relativeX));
    
    setClawPosition(prev => ({ ...prev, x: clampedX }));
    
    // Start timer on first movement
    if (!hasStartedTimer) {
      setHasStartedTimer(true);
      onStartTimer();
    }
  }, [gameState, isClawActive, hasStartedTimer, onStartTimer]);

  // Find dot under claw
  const findDotUnderClaw = (clawX: number): { plushie: PlushieData; dot: DotData } | null => {
    for (const plushie of plushies) {
      if (plushie.isGrabbed || plushie.isFalling || plushie.isDropping) continue;
      
      for (const dot of plushie.dots) {
        const dotWorldX = plushie.x + (dot.x / 4); // Scale dot position
        const distance = Math.abs(dotWorldX - clawX);
        
        if (distance < 2) { // Hit tolerance
          return { plushie, dot };
        }
      }
    }
    return null;
  };

  // Handle claw grab sequence
  const handleClawGrab = useCallback(() => {
    if (isClawActive) return;
    
    console.log('=== CLAW GRAB SEQUENCE START ===');
    setIsClawActive(true);
    onPauseTimer();
    
    // Step 1: Claw goes down
    setClawPosition(prev => ({ ...prev, y: CLAW_GRAB_Y }));
    
    setTimeout(() => {
      // Step 2: Check for hits
      const hit = findDotUnderClaw(clawPosition.x);
      
      if (hit) {
        const { plushie, dot } = hit;
        const success = Math.random() < dot.successRate;
        
        console.log(`Hit ${dot.color} dot, success: ${success}`);
        
        if (success) {
          // Successful grab - plushie follows claw exactly
          setPlushies(prev => 
            prev.map(p => 
              p.id === plushie.id 
                ? { ...p, isGrabbed: true, x: clawPosition.x, y: CLAW_GRAB_Y }
                : p
            )
          );
          
          // Step 3: Move up together
          setTimeout(() => {
            setClawPosition(prev => ({ ...prev, y: 15 }));
            setPlushies(prev => 
              prev.map(p => 
                p.id === plushie.id 
                  ? { ...p, y: 15 }
                  : p
              )
            );
            
            // Step 4: Move to prize box together
            setTimeout(() => {
              const prizeBoxX = PRIZE_BOX_WIDTH / 2;
              setClawPosition(prev => ({ ...prev, x: prizeBoxX }));
              setPlushies(prev => 
                prev.map(p => 
                  p.id === plushie.id 
                    ? { ...p, x: prizeBoxX }
                    : p
                )
              );
              
              // Step 5: Drop into prize box
              setTimeout(() => {
                setPlushies(prev => 
                  prev.map(p => 
                    p.id === plushie.id 
                      ? { ...p, isGrabbed: false, isDropping: true }
                      : p
                  )
                );
                
                setTimeout(() => {
                  setPlushies(prev => prev.filter(p => p.id !== plushie.id));
                  onSuccessfulGrab(plushie);
                  maintainPlushieCount();
                  resetClaw();
                }, 800);
              }, 500);
            }, 1000);
          }, 1000);
          
          return;
        } else {
          // Failed grab - show pickup then drop
          setPlushies(prev => 
            prev.map(p => 
              p.id === plushie.id 
                ? { ...p, isGrabbed: true, x: clawPosition.x, y: CLAW_GRAB_Y }
                : p
            )
          );
          
          setTimeout(() => {
            setClawPosition(prev => ({ ...prev, y: 15 }));
            setPlushies(prev => 
              prev.map(p => 
                p.id === plushie.id 
                  ? { ...p, y: 15 }
                  : p
              )
            );
            
            // Move partway then drop
            setTimeout(() => {
              const dropX = clawPosition.x - 15 - Math.random() * 10;
              setPlushies(prev => 
                prev.map(p => 
                  p.id === plushie.id 
                    ? { ...p, isGrabbed: false, isFalling: true }
                    : p
                )
              );
              
              setTimeout(() => {
                setPlushies(prev => 
                  prev.map(p => 
                    p.id === plushie.id 
                      ? { ...p, x: Math.max(PRIZE_BOX_WIDTH + 5, dropX), y: PLUSHIE_BASE_Y, isFalling: false }
                      : p
                  )
                );
                
                setTimeout(() => {
                  onFailedGrab();
                  resetClaw();
                }, 500);
              }, 800);
            }, 800);
          }, 1000);
          
          return;
        }
      }
      
      // No hit - just return
      setTimeout(() => {
        setClawPosition(prev => ({ ...prev, y: 15 }));
        setTimeout(() => {
          onFailedGrab();
          resetClaw();
        }, 1000);
      }, 600);
    }, 1500);
  }, [clawPosition.x, plushies, isClawActive, onSuccessfulGrab, onFailedGrab, onPauseTimer]);

  // Click handler
  const handleClick = useCallback(() => {
    if (gameState !== 'playing' || isClawActive) return;
    handleClawGrab();
  }, [gameState, isClawActive, handleClawGrab]);

  // Reset claw to center
  const resetClaw = () => {
    setClawPosition({ x: 50, y: 15 });
    setIsClawActive(false);
    setHasStartedTimer(false);
    onResetTimer();
  };

  return (
    <div 
      ref={machineRef}
      className="relative w-[900px] h-[600px] machine-frame cursor-crosshair"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {/* Machine Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-gray-600 to-gray-800 flex items-center justify-center">
        <div className="text-2xl font-bold retro-text" style={{ color: 'hsl(var(--neon-cyan))' }}>
          RETRO CLAW MACHINE
        </div>
      </div>

      {/* Game Area */}
      <div className="absolute top-16 left-8 right-8 bottom-20 game-area">
        {/* Prize Box - Much Bigger */}
        <div 
          className="absolute bottom-0 left-0 h-24 prize-slot border-4 border-yellow-400 bg-gradient-to-t from-yellow-200 to-yellow-100"
          style={{ width: `${PRIZE_BOX_WIDTH}%` }}
        >
          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-800">
            PRIZE BOX
          </div>
          <div className="absolute -top-2 left-0 right-0 h-2 bg-green-400 animate-pulse"></div>
        </div>

        {/* Claw */}
        <Claw position={clawPosition} isActive={isClawActive} />

        {/* Plushies */}
        {plushies.map(plushie => (
          <Plushie
            key={plushie.id}
            position={{ x: plushie.x, y: plushie.y }}
            imagePath={plushie.imagePath}
            type={plushie.type}
            value={plushie.value}
            isGrabbed={plushie.isGrabbed}
            isFalling={plushie.isFalling}
            isDropping={plushie.isDropping}
            dots={plushie.dots}
          />
        ))}

        {/* Machine boundaries visual guide */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-red-400 opacity-30"
          style={{ left: `${PRIZE_BOX_WIDTH}%` }}
        ></div>
      </div>

      {/* Machine Lighting Effects */}
      <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-red-400 animate-pulse"></div>
      <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-green-400 animate-pulse"></div>
      
      {/* Timer Display */}
      <div className="absolute top-20 right-12 text-xl font-bold retro-text" 
           style={{ color: timeLeft <= 10 ? 'hsl(var(--neon-pink))' : 'hsl(var(--neon-yellow))' }}>
        {hasStartedTimer ? `${timeLeft}s` : 'HOVER TO START'}
      </div>
    </div>
  );
};

export default ClawMachine;