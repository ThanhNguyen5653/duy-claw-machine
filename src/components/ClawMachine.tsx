import React, { useState, useRef, useCallback, useEffect } from 'react';
import Claw from './Claw';
import Plushie from './Plushie';

interface ClawMachineProps {
  gameState: 'playing' | 'paused' | 'gameOver';
  onStartTimer: () => void;
  onSuccessfulGrab: (plushie: PlushieData) => void;
  onFailedGrab: () => void;
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
}

const ClawMachine: React.FC<ClawMachineProps> = ({
  gameState,
  onStartTimer,
  onSuccessfulGrab,
  onFailedGrab
}) => {
  const machineRef = useRef<HTMLDivElement>(null);
  const [clawPosition, setClawPosition] = useState({ x: 50, y: 15 });
  const [isClawActive, setIsClawActive] = useState(false);
  const [nextPlushieId, setNextPlushieId] = useState(1);
  const [plushies, setPlushies] = useState<PlushieData[]>([]);
  const [hasMovedClaw, setHasMovedClaw] = useState(false);
  const [availableImages, setAvailableImages] = useState<{
    generic: string[];
    medium: string[];
    good: string[];
  }>({ generic: [], medium: [], good: [] });

  // Load available images from the public folders
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

  // Initialize plushies when images are loaded
  useEffect(() => {
    if (availableImages.generic.length > 0 && plushies.length === 0) {
      const initialPlushies = generatePlushies(4); // Reduced from 6 to 4 for better spacing
      setPlushies(initialPlushies);
      setNextPlushieId(5);
    }
  }, [availableImages]);

  const generatePlushieValue = (type: 'generic' | 'medium' | 'good'): number => {
    switch (type) {
      case 'generic':
        return 10;
      case 'medium':
        return Math.floor(Math.random() * 31) + 20; // $20-$50
      case 'good':
        return 80;
      default:
        return 10;
    }
  };

  const generatePlushies = (count: number): PlushieData[] => {
    const newPlushies: PlushieData[] = [];
    const currentGoodCount = plushies.filter(p => p.type === 'good' && !p.isGrabbed && !p.isFalling).length;
    
    // Create evenly spaced positions to avoid overlap
    const spacing = 60 / (count + 1); // Distribute across 60% of the width
    
    for (let i = 0; i < count; i++) {
      let type: 'generic' | 'medium' | 'good';
      const hasGoodPlushie = currentGoodCount > 0 || newPlushies.some(p => p.type === 'good');
      
      // Weighted selection: 50% generic, 40% medium, 10% good (but max 1 good)
      const random = Math.random();
      if (!hasGoodPlushie && random < 0.1) {
        type = 'good';
      } else if (random < 0.5) {
        type = 'generic';
      } else {
        type = 'medium';
      }

      const typeImages = availableImages[type];
      if (typeImages.length === 0) continue;

      const randomImage = typeImages[Math.floor(Math.random() * typeImages.length)];
      // Evenly spaced X positions with better distribution
      const spacedX = 25 + (i * spacing); // Start at 25% and space evenly
      const fixedY = 70; // Fixed Y position - matches claw reach exactly
      
      newPlushies.push({
        id: nextPlushieId + i,
        x: spacedX,
        y: fixedY,
        type,
        imagePath: randomImage,
        value: generatePlushieValue(type),
        isGrabbed: false,
        isFalling: false,
        isDropping: false
      });
    }
    
    return newPlushies;
  };

  const addNewPlushies = () => {
    const availablePlushies = plushies.filter(p => !p.isGrabbed && !p.isFalling && !p.isDropping);
    if (availablePlushies.length < 4) { // Changed from 6 to 4
      const needed = 4 - availablePlushies.length;
      const newPlushies = generatePlushies(needed);
      
      setPlushies(prev => [...prev, ...newPlushies]);
      setNextPlushieId(prev => prev + needed);
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (gameState !== 'playing' || isClawActive) return;

    const rect = machineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedX = Math.max(5, Math.min(95, relativeX));
    
    setClawPosition(prev => ({ ...prev, x: clampedX }));
    
    if (!hasMovedClaw) {
      setHasMovedClaw(true);
      onStartTimer();
    }
  }, [gameState, isClawActive, hasMovedClaw, onStartTimer]);

  const calculateGrabSuccess = (plushie: PlushieData, clawX: number): { success: boolean; canDrop: boolean } => {
    const distance = Math.abs(plushie.x - clawX);
    
    // Perfect center alignment (green dot) - 100% success, no drop
    if (distance < 3) {
      return { success: true, canDrop: false };
    }
    
    // Side dots alignment - variable success with potential drop
    if (distance < 6) {
      const successRate = 0.8 - (distance * 0.1); // 80% at distance 3, decreasing
      return { 
        success: Math.random() < successRate, 
        canDrop: Math.random() < 0.3 // 30% chance to drop during transport
      };
    }
    
    // Outer area - low success rate
    if (distance < 10) {
      return { 
        success: Math.random() < 0.3, 
        canDrop: Math.random() < 0.6 // 60% chance to drop
      };
    }
    
    // Too far - no grab
    return { success: false, canDrop: false };
  };

  const handleClick = useCallback(() => {
    if (gameState !== 'playing' || isClawActive) return;

    setIsClawActive(true);
    
    // Step 1: Animate claw going down to plushie level (1.5 seconds)
    setClawPosition(prev => ({ ...prev, y: 70 })); // Match plushie level exactly
    
    setTimeout(() => {
      // Step 2: Check for collision with plushies
      const grabbedPlushie = plushies.find(plushie => {
        if (plushie.isGrabbed || plushie.isFalling || plushie.isDropping) return false;
        
        const distance = Math.abs(plushie.x - clawPosition.x);
        return distance < 10; // Collision threshold
      });

      if (grabbedPlushie) {
        const grabResult = calculateGrabSuccess(grabbedPlushie, clawPosition.x);
        
        if (grabResult.success) {
          // Step 3: Move claw up FIRST, then grab plushie
          setClawPosition(prev => ({ ...prev, y: 15 }));
          
          // Wait 800ms for claw to move up, THEN grab plushie
          setTimeout(() => {
            setPlushies(prev => 
              prev.map(p => 
                p.id === grabbedPlushie.id 
                  ? { ...p, isGrabbed: true, x: clawPosition.x, y: 15 }
                  : p
              )
            );
            
            // Step 4: Move BOTH claw and plushie horizontally to prize slot together
            setTimeout(() => {
              const prizeBoxCenterX = 10; // Center of the prize box
              setClawPosition(prev => ({ ...prev, x: prizeBoxCenterX }));
              setPlushies(prev => 
                prev.map(p => 
                  p.id === grabbedPlushie.id 
                    ? { ...p, x: prizeBoxCenterX }
                    : p
                )
              );
              
              // Check if plushie should drop during horizontal movement
              if (grabResult.canDrop) {
                // Plushie drops during horizontal movement
                setTimeout(() => {
                  setPlushies(prev => 
                    prev.map(p => 
                      p.id === grabbedPlushie.id 
                        ? { ...p, isGrabbed: false, isFalling: true }
                        : p
                    )
                  );
                  
                  // Animate plushie falling back to bottom
                  setTimeout(() => {
                    const randomX = Math.random() * 60 + 20; // Random position in main area
                    setPlushies(prev => 
                      prev.map(p => 
                        p.id === grabbedPlushie.id 
                          ? { ...p, y: 70, x: randomX, isFalling: false }
                          : p
                      )
                    );
                  }, 1000);
                  
                  // Reset claw and fail
                  setTimeout(() => {
                    resetClawPosition();
                    onFailedGrab();
                  }, 1500);
                }, 1000);
              } else {
                // Step 5: Drop plushie into prize box
                setTimeout(() => {
                  // Start falling animation into prize box
                  setPlushies(prev => 
                    prev.map(p => 
                      p.id === grabbedPlushie.id 
                        ? { ...p, isGrabbed: false, isDropping: true }
                        : p
                    )
                  );
                  
                  // Animate falling into prize box
                  setTimeout(() => {
                    setPlushies(prev => 
                      prev.map(p => 
                        p.id === grabbedPlushie.id 
                          ? { ...p, y: 85, x: prizeBoxCenterX } // Drop into center of prize box
                          : p
                      )
                    );
                    
                    // Step 6: Check scoring and remove plushie
                    setTimeout(() => {
                      // Prize box bounds: X from 0 to 20 (20 units wide)
                      const prizeBoxLeft = 0;
                      const prizeBoxRight = 20;
                      
                      // Get final position after drop
                      const finalX = prizeBoxCenterX; // Should be 10, which is in the box
                      const isInPrizeBox = finalX >= prizeBoxLeft && finalX <= prizeBoxRight;
                      
                      console.log(`Plushie final position X: ${finalX}, Prize box: ${prizeBoxLeft}-${prizeBoxRight}, Scored: ${isInPrizeBox}`);
                      
                      // Remove plushie and handle scoring
                      setPlushies(prev => prev.filter(p => p.id !== grabbedPlushie.id));
                      
                      if (isInPrizeBox) {
                        onSuccessfulGrab(grabbedPlushie);
                        addNewPlushies();
                      } else {
                        onFailedGrab();
                      }
                      
                      resetClawPosition();
                    }, 800);
                  }, 200);
                }, 800);
              }
            }, 1500); // Horizontal movement
          }, 800); // Wait for claw to move up before grabbing plushie
          
          return;
        }
      }
      
      // Failed grab or no plushie - Move claw back up
      setTimeout(() => {
        setClawPosition(prev => ({ ...prev, y: 15 }));
        
        setTimeout(() => {
          resetClawPosition();
          onFailedGrab();
        }, 1000);
      }, 600);
    }, 1500); // Movement down
  }, [gameState, isClawActive, clawPosition.x, plushies, onSuccessfulGrab, onFailedGrab]);

  const resetClawPosition = () => {
    setClawPosition({ x: 50, y: 15 });
    setIsClawActive(false);
    setHasMovedClaw(false);
  };

  return (
    <div 
      ref={machineRef}
      className="relative w-[800px] h-[600px] machine-frame cursor-none"
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
        {/* Prize Drop Slot - Properly sized and positioned */}
        <div className="absolute bottom-0 left-0 w-20 h-20 prize-slot border-2 border-yellow-400">
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600">
            PRIZE
          </div>
          {/* Visual scoring indicator */}
          <div className="absolute -top-1 left-0 right-0 h-1 bg-green-400"></div>
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
          />
        ))}
      </div>

      {/* Machine Lighting Effects */}
      <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-red-400 animate-pulse"></div>
      <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-green-400 animate-pulse"></div>
    </div>
  );
};

export default ClawMachine;