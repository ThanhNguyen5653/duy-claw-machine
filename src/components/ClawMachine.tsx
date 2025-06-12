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
  y: number; // relative to plushie center - FIXED TO BE AT CLAW LEVEL
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

  // Generate dots for a plushie - FIXED Y POSITIONING
  const generateDots = (type: 'generic' | 'medium' | 'good'): DotData[] => {
    const dots: DotData[] = [];
    
    // Good category plushies have NO green dots
    if (type !== 'good') {
      // Always exactly 1 green dot (not necessarily center) for non-good plushies
      const greenAngle = Math.random() * 2 * Math.PI;
      const greenRadius = 5 + Math.random() * 10; // 5-15px from center
      
      dots.push({
        id: 'green-1',
        x: Math.cos(greenAngle) * greenRadius,
        y: 0, // FIXED: All dots at same Y level (claw level)
        color: 'green',
        successRate: 1.0 // 100% success
      });
    }

    // Add 2-4 additional dots (orange and yellow)
    const additionalDots = Math.floor(Math.random() * 3) + 2; // 2-4 additional
    
    for (let i = 0; i < additionalDots; i++) {
      const angle = (i / additionalDots) * 2 * Math.PI + Math.random() * 0.5; // Add some randomness
      const radius = 10 + Math.random() * 15; // 10-25px from center
      
      // Updated probabilities: orange 60%, yellow 40%
      const color = Math.random() < 0.5 ? 'orange' : 'yellow';
      const successRate = color === 'orange' ? 0.6 : 0.4; // Orange 60%, Yellow 40%
      
      dots.push({
        id: `${color}-${i}`,
        x: Math.cos(angle) * radius,
        y: 0, // FIXED: All dots at same Y level (claw level)
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

  // Check if position overlaps with existing plushies
  const isPositionOccupied = (x: number, existingPlushies: PlushieData[]): boolean => {
    return existingPlushies.some(plushie => 
      !plushie.isGrabbed && !plushie.isFalling && !plushie.isDropping &&
      Math.abs(plushie.x - x) < 8 // Minimum 8% spacing between plushies
    );
  };

  // Generate plushies to maintain 6+ on screen
  const generatePlushies = (count: number): PlushieData[] => {
    const newPlushies: PlushieData[] = [];
    const currentGoodCount = plushies.filter(p => 
      p.type === 'good' && !p.isGrabbed && !p.isFalling && !p.isDropping
    ).length;
    
    for (let i = 0; i < count; i++) {
      // Determine type with weighted distribution
      let type: 'generic' | 'medium' | 'good';
      const random = Math.random();
      
      // Only allow 1 good plushie at a time
      const hasGoodPlushie = currentGoodCount > 0 || newPlushies.some(p => p.type === 'good');
      
      if (!hasGoodPlushie && random < 0.1) { // 10% chance for good (if none exists)
        type = 'good';
      } else if (random < 0.4) { // 30% chance for medium
        type = 'medium';
      } else { // 60% chance for generic
        type = 'generic';
      }

      const typeImages = availableImages[type];
      if (typeImages.length === 0) continue;

      const randomImage = typeImages[Math.floor(Math.random() * typeImages.length)];
      
      // Find non-overlapping position
      const minX = PRIZE_BOX_WIDTH + 5;
      const maxX = MACHINE_WIDTH - 5;
      let x: number;
      let attempts = 0;
      
      do {
        x = minX + Math.random() * (maxX - minX);
        attempts++;
      } while (isPositionOccupied(x, [...plushies, ...newPlushies]) && attempts < 20);
      
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
        dots: generateDots(type) // Pass type to generate appropriate dots
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

  // Pause/Resume functionality
  useEffect(() => {
    if (gameState === 'paused') {
      // Freeze all animations and interactions
      setIsClawActive(true); // Prevent new actions
    } else if (gameState === 'playing') {
      // Only resume if we were actually in a grab sequence
      if (isClawActive && !hasStartedTimer) {
        setIsClawActive(false);
      }
    }
  }, [gameState]);

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

  // Find dot under claw - UPDATED FOR FIXED Y POSITIONING
  const findDotUnderClaw = (clawX: number): { plushie: PlushieData; dot: DotData } | null => {
    for (const plushie of plushies) {
      if (plushie.isGrabbed || plushie.isFalling || plushie.isDropping) continue;
      
      for (const dot of plushie.dots) {
        // Since all dots are now at Y=0 (same level as claw), we only check X distance
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
    if (isClawActive || gameState !== 'playing') return;
    
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
            
            // Move partway then drop - NEW LOGIC: Drop between prize box and right bound
            setTimeout(() => {
              // Calculate drop position between prize box and right bound
              const minDropX = PRIZE_BOX_WIDTH + 5;
              const maxDropX = MACHINE_WIDTH - 5;
              const dropX = minDropX + Math.random() * (maxDropX - minDropX);
              
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
                      ? { ...p, x: dropX, y: PLUSHIE_BASE_Y, isFalling: false }
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
  }, [clawPosition.x, plushies, isClawActive, gameState, onSuccessfulGrab, onFailedGrab, onPauseTimer]);

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

  // Reset everything when game resets
  useEffect(() => {
    if (gameState === 'gameOver') {
      setPlushies([]);
      setNextPlushieId(1);
      resetClaw();
    }
  }, [gameState]);

  return (
    <div 
      ref={machineRef}
      className="relative w-full max-w-[800px] h-[500px] machine-frame cursor-crosshair mx-auto"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{ 
        pointerEvents: gameState === 'paused' ? 'none' : 'auto',
        filter: gameState === 'paused' ? 'grayscale(50%)' : 'none'
      }}
    >
      {/* Machine Header */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-gray-600 to-gray-800 flex items-center justify-center">
        <div className="text-lg font-bold retro-text" style={{ color: 'hsl(var(--neon-cyan))' }}>
          DUY'S CLAW MACHINE
        </div>
      </div>

      {/* Timer Display with Better Contrast */}
      <div className="absolute top-2 right-4 px-3 py-1 rounded-lg bg-black/80 border-2 border-yellow-400">
        <div className="text-lg font-bold retro-text text-center" 
             style={{ 
               color: timeLeft <= 10 ? '#ff0080' : '#ffff00',
               textShadow: '0 0 10px currentColor'
             }}>
          {hasStartedTimer ? `${timeLeft}s` : 'HOVER'}
        </div>
      </div>

      {/* Pause Overlay */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="text-4xl font-bold retro-text neon-glow" style={{ color: 'hsl(var(--neon-cyan))' }}>
            PAUSED
          </div>
        </div>
      )}

      {/* Game Area */}
      <div className="absolute top-12 left-4 right-4 bottom-16 game-area">
        {/* Prize Box - Much Bigger */}
        <div 
          className="absolute bottom-0 left-0 h-20 prize-slot border-4 border-yellow-400 bg-gradient-to-t from-yellow-200 to-yellow-100"
          style={{ width: `${PRIZE_BOX_WIDTH}%` }}
        >
          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-800">
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
      <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>
      <div className="absolute top-2 left-8 w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
    </div>
  );
};

export default ClawMachine;