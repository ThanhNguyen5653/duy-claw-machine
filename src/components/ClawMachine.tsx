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
  color: 'green' | 'orange' | 'yellow' | 'blue';
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
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [availableImages, setAvailableImages] = useState<{
    generic: string[];
    medium: string[];
    good: string[];
  }>({ generic: [], medium: [], good: [] });

  // DYNAMIC IMAGE LOADING - Automatically discover images in public folders
  useEffect(() => {
    const loadImagesFromFolder = async (folderPath: string): Promise<string[]> => {
      const images: string[] = [];
      
      // Common image extensions to check
      const extensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
      
      // We'll try to load images by attempting to fetch them
      // This is a workaround since we can't directly list directory contents in the browser
      const commonNames = [
        'generic', 'generic2', 'generic3', 'generic4', 'generic5',
        'blue', 'green', 'kirby', 'pikachu', 'purple', 'repo', 'repoBlue', 'white',
        'red', 'yellow', 'orange', 'pink', 'black', 'gray', 'brown',
        'appa', 'duck', 'gaara', 'naruto', 'sasuke', 'sakura', 'kakashi',
        'mario','bowser', 'yoshi', 'toad', 'toph',
        'stitch', 'sitt', 'sailorMoon', 'luna', 'hamtaro2',
        'hamtaro1', 'avatar', 'avatar2', 'cars', 'hamtaro'
      ];

      for (const name of commonNames) {
        for (const ext of extensions) {
          const imagePath = `/${folderPath}/${name}.${ext}`;
          try {
            // Try to load the image to see if it exists
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = imagePath;
            });
            images.push(imagePath);
          } catch {
            // Image doesn't exist, continue
          }
        }
      }
      
      return images;
    };

    const loadAllImages = async () => {
      try {
        const [genericImages, mediumImages, goodImages] = await Promise.all([
          loadImagesFromFolder('generic'),
          loadImagesFromFolder('medium'),
          loadImagesFromFolder('good')
        ]);

        // Fallback to known images if dynamic loading fails
        const fallbackGeneric = ['/generic/generic.png', '/generic/generic2.png'];
        const fallbackMedium = [
          '/medium/blue.png', '/medium/green.png', '/medium/kirby.png',
          '/medium/pikachu.png', '/medium/purple.png', '/medium/repo.png',
          '/medium/repoBlue.png', '/medium/white.png'
        ];
        const fallbackGood = ['/good/appa.png', '/good/duck.png', '/good/gaara.png'];

        setAvailableImages({
          generic: genericImages.length > 0 ? genericImages : fallbackGeneric,
          medium: mediumImages.length > 0 ? mediumImages : fallbackMedium,
          good: goodImages.length > 0 ? goodImages : fallbackGood
        });
      } catch (error) {
        console.error('Error loading images dynamically, using fallback:', error);
        // Use fallback images
        setAvailableImages({
          generic: ['/generic/generic.png', '/generic/generic2.png'],
          medium: [
            '/medium/blue.png', '/medium/green.png', '/medium/kirby.png',
            '/medium/pikachu.png', '/medium/purple.png', '/medium/repo.png',
            '/medium/repoBlue.png', '/medium/white.png'
          ],
          good: ['/good/appa.png', '/good/duck.png', '/good/gaara.png']
        });
      } finally {
        // Clear loading state regardless of success or failure
        setIsLoadingImages(false);
      }
    };

    loadAllImages();
  }, []);

  // Generate dots for a plushie - UPDATED DOT MECHANICS WITH NEW RULES
  const generateDots = (type: 'generic' | 'medium' | 'good'): DotData[] => {
    const dots: DotData[] = [];
    
    // UPDATED RULES:
    // - Generic: Can have multiple green dots, NO BLUE DOTS, increased orange/yellow/green chances
    // - Medium & Good: Exactly 1 green dot each (at least and at most 1)
    
    if (type === 'generic') {
      // Generic plushies: NO BLUE DOTS, only green, orange, yellow
      const totalDots = Math.floor(Math.random() * 3) + 3; // 3-5 dots total
      
      for (let i = 0; i < totalDots; i++) {
        const angle = (i / totalDots) * 2 * Math.PI + Math.random() * 0.5;
        const radius = 5 + Math.random() * 20; // 5-25px from center
        
        // NO BLUE DOTS - Only green, orange, yellow with increased probabilities
        const random = Math.random();
        let color: 'green' | 'orange' | 'yellow';
        let successRate: number;
        
        if (random < 0.33) { // 33% chance for green
          color = 'green';
          successRate = 0.9; // 90% success
        } else if (random < 0.66) { // 33% chance for orange
          color = 'orange';
          successRate = 0.6; // 60% success
        } else { // 34% chance for yellow
          color = 'yellow';
          successRate = 0.4; // 40% success
        }
        
        dots.push({
          id: `${color}-${i}`,
          x: Math.cos(angle) * radius,
          y: 0, // All dots at same Y level (claw level)
          color,
          successRate
        });
      }
    } else {
      // Medium and Good plushies: Exactly 1 green dot + 2-4 other dots
      
      // Always add exactly 1 green dot
      const greenAngle = Math.random() * 2 * Math.PI;
      const greenRadius = 5 + Math.random() * 15; // 5-20px from center
      
      dots.push({
        id: 'green-1',
        x: Math.cos(greenAngle) * greenRadius,
        y: 0, // All dots at same Y level (claw level)
        color: 'green',
        successRate: 0.9 // 90% success
      });
      
      // Add 2-4 additional non-green dots
      const additionalDots = Math.floor(Math.random() * 3) + 2; // 2-4 additional
      
      for (let i = 0; i < additionalDots; i++) {
        const angle = (i / additionalDots) * 2 * Math.PI + Math.random() * 0.5;
        const radius = 10 + Math.random() * 15; // 10-25px from center
        
        // Only orange, yellow, and blue for additional dots
        const random = Math.random();
        let color: 'orange' | 'yellow' | 'blue';
        let successRate: number;
        
        if (random < 0.4) {
          color = 'orange';
          successRate = 0.6; // 60% success
        } else if (random < 0.7) {
          color = 'yellow';
          successRate = 0.4; // 40% success
        } else {
          color = 'blue';
          successRate = 0.3; // 30% success
        }
        
        dots.push({
          id: `${color}-${i}`,
          x: Math.cos(angle) * radius,
          y: 0, // All dots at same Y level (claw level)
          color,
          successRate
        });
      }
    }

    return dots;
  };

  // Generate plushie value - UPDATED GOOD CATEGORY PRICING
  const generatePlushieValue = (type: 'generic' | 'medium' | 'good'): number => {
    switch (type) {
      case 'generic':
        return 10;
      case 'medium':
        return Math.floor(Math.random() * 21) + 20; // $20-$40
      case 'good':
        return Math.floor(Math.random() * 21) + 80; // $80-$100 (UPDATED)
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

  // Generate plushies to maintain 6+ on screen - UPDATED SPAWN RATES
  const generatePlushies = (count: number): PlushieData[] => {
    const newPlushies: PlushieData[] = [];
    const currentGoodCount = plushies.filter(p => 
      p.type === 'good' && !p.isGrabbed && !p.isFalling && !p.isDropping
    ).length;
    
    for (let i = 0; i < count; i++) {
      // Determine type with weighted distribution - UPDATED SPAWN RATES
      let type: 'generic' | 'medium' | 'good';
      const random = Math.random();
      
      // Only allow 1 good plushie at a time, but 25% spawn chance
      const hasGoodPlushie = currentGoodCount > 0 || newPlushies.some(p => p.type === 'good');
      
      if (!hasGoodPlushie && random < 0.25) { // 25% chance for good
        type = 'good';
      } else if (random < 0.6) { // 35% chance for medium (0.25 + 0.35 = 0.6)
        type = 'medium';
      } else { // 40% chance for generic (remaining)
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
    if (availableImages.generic.length > 0 && plushies.length === 0 && !isLoadingImages) {
      const initialPlushies = generatePlushies(6);
      setPlushies(initialPlushies);
      setNextPlushieId(7);
    }
  }, [availableImages, isLoadingImages]);

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

  // Pause/Resume functionality - FIXED
  useEffect(() => {
    if (gameState === 'paused') {
      // Pause timer and prevent new actions
      onPauseTimer();
    } else if (gameState === 'playing' && hasStartedTimer) {
      // Resume timer if it was active
      onStartTimer();
    }
  }, [gameState, hasStartedTimer]);

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

  // Show loading indicator while images are loading
  if (isLoadingImages) {
    return (
      <div className="relative w-full max-w-[800px] h-[500px] machine-frame mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold retro-text neon-glow animate-neon-pulse mb-4" 
               style={{ color: 'hsl(var(--neon-cyan))' }}>
            LOADING ASSETS...
          </div>
          <div className="text-lg retro-text" style={{ color: 'hsl(var(--neon-yellow))' }}>
            Please wait while we prepare your plushies
          </div>
        </div>
      </div>
    );
  }

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
            showDots={true} // MAKE DOTS VISIBLE FOR TESTING
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