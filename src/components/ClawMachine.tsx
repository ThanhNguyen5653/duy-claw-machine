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
  onPauseTimer,
  onResetTimer,
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
      const initialPlushies = generatePlushies(6);
      setPlushies(initialPlushies);
      setNextPlushieId(7);
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
      const randomX = Math.random() * 60 + 20; // Between 20-80%
      const fixedY = 70; // Fixed Y position for all plushies - same level, higher up
      
      newPlushies.push({
        id: nextPlushieId + i,
        x: randomX,
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
    if (availablePlushies.length < 6) {
      const needed = 6 - availablePlushies.length;
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
    if (distance < 2) {
      return { success: true, canDrop: false };
    }
    
    // Side dots alignment - variable success with potential drop
    if (distance < 5) {
      const successRate = 0.8 - (distance * 0.1); // 80% at distance 2, decreasing
      return { 
        success: Math.random() < successRate, 
        canDrop: Math.random() < 0.3 // 30% chance to drop during transport
      };
    }
    
    // Outer area - low success rate
    if (distance < 8) {
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
    onPauseTimer(); // Pause timer during grab sequence
    
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
          // Successful grab - Step 3: Move plushie to claw position and follow claw up
          setPlushies(prev => 
            prev.map(p => 
              p.id === grabbedPlushie.id 
                ? { ...p, isGrabbed: true, x: clawPosition.x, y: 70 }
                : p
            )
          );
          
          // Step 4: Move claw (with plushie) slowly back up to top (1.5 seconds)
          setTimeout(() => {
            setClawPosition(prev => ({ ...prev, y: 15 }));
            setPlushies(prev => 
              prev.map(p => 
                p.id === grabbedPlushie.id 
                  ? { ...p, y: 15 }
                  : p
              )
            );
            
            // Step 5: Move claw (with plushie) horizontally to prize slot (1.5 seconds)
            setTimeout(() => {
              setClawPosition(prev => ({ ...prev, x: 15 }));
              setPlushies(prev => 
                prev.map(p => 
                  p.id === grabbedPlushie.id 
                    ? { ...p, x: 15 }
                    : p
                )
              );
              
              // Check if plushie should drop during horizontal movement
              if (grabResult.canDrop) {
                // Plushie drops during horizontal movement with smooth animation
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
                  
                  // Reset claw and fail (1 second)
                  setTimeout(() => {
                    resetClawPosition();
                    onFailedGrab();
                    onResetTimer(); // Reset timer for next turn
                  }, 1000);
                }, 800);
              } else {
                // Step 6: Drop plushie when claw is over prize slot
                setTimeout(() => {
                  // Start falling animation into prize box
                  setPlushies(prev => 
                    prev.map(p => 
                      p.id === grabbedPlushie.id 
                        ? { ...p, isGrabbed: false, isDropping: true }
                        : p
                    )
                  );
                  
                  // Animate falling into prize box with bounce effect
                  setTimeout(() => {
                    setPlushies(prev => 
                      prev.map(p => 
                        p.id === grabbedPlushie.id 
                          ? { ...p, y: 85 }
                          : p
                      )
                    );
                    
                    // Step 7: Remove plushie and reset claw (successful grab)
                    setTimeout(() => {
                      setPlushies(prev => prev.filter(p => p.id !== grabbedPlushie.id));
                      resetClawPosition();
                      onSuccessfulGrab(grabbedPlushie);
                      onResetTimer(); // Reset timer for next turn
                      addNewPlushies(); // Add new plushies if needed
                    }, 600);
                  }, 200);
                }, 600);
              }
            }, 1500); // Horizontal movement (1.5 seconds)
          }, 1500); // Vertical movement up (1.5 seconds)
          
          return;
        }
      }
      
      // Failed grab or no plushie - Step 3: Move claw back up (1 second)
      setTimeout(() => {
        setClawPosition(prev => ({ ...prev, y: 15 }));
        
        setTimeout(() => {
          resetClawPosition();
          onFailedGrab();
          onResetTimer(); // Reset timer for next turn
        }, 1000); // Movement back up
      }, 600);
    }, 1500); // Movement down (1.5 seconds)
  }, [gameState, isClawActive, clawPosition.x, plushies, onSuccessfulGrab, onFailedGrab, onPauseTimer, onResetTimer]);

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
        {/* Prize Drop Slot */}
        <div className="absolute bottom-0 left-0 w-20 h-20 prize-slot">
          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-600">
            PRIZE
          </div>
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