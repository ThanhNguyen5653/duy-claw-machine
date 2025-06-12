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
      const initialPlushies = generatePlushies(4);
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
    
    // Create evenly spaced positions with more spacing
    const spacing = 70 / (count + 1); // Distribute across 70% of the width with more space
    
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
      // Better spacing - start at 20% and distribute evenly with more gaps
      const spacedX = 20 + (i * spacing);
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
    if (availablePlushies.length < 4) {
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
    
    console.log(`Claw at X: ${clawX}, Plushie at X: ${plushie.x}, Distance: ${distance}`);
    
    // Perfect center alignment (green dot) - 100% success, no drop
    if (distance < 2) {
      console.log('Perfect hit - green dot!');
      return { success: true, canDrop: false };
    }
    
    // Side dots alignment - variable success with potential drop
    if (distance < 4) {
      console.log('Good hit - yellow dot!');
      const successRate = 0.8 - (distance * 0.1);
      return { 
        success: Math.random() < successRate, 
        canDrop: Math.random() < 0.3
      };
    }
    
    // Outer area - low success rate
    if (distance < 6) {
      console.log('Edge hit - orange dot!');
      return { 
        success: Math.random() < 0.3, 
        canDrop: Math.random() < 0.6
      };
    }
    
    console.log('Miss - too far!');
    return { success: false, canDrop: false };
  };

  const handleClick = useCallback(() => {
    if (gameState !== 'playing' || isClawActive) return;

    console.log('=== CLAW GRAB SEQUENCE START ===');
    console.log(`Initial claw position: X=${clawPosition.x}, Y=${clawPosition.y}`);
    
    setIsClawActive(true);
    onPauseTimer(); // Pause timer during grab sequence
    
    // Step 1: Animate claw going down to plushie level (1.5 seconds)
    console.log('Step 1: Claw moving down...');
    setClawPosition(prev => ({ ...prev, y: 70 }));
    
    setTimeout(() => {
      console.log('Step 2: Checking for collision...');
      // Step 2: Check for collision with plushies at the EXACT claw position
      const grabbedPlushie = plushies.find(plushie => {
        if (plushie.isGrabbed || plushie.isFalling || plushie.isDropping) return false;
        
        const distance = Math.abs(plushie.x - clawPosition.x);
        console.log(`Checking plushie ${plushie.id}: distance=${distance}`);
        return distance < 8; // Collision threshold
      });

      if (grabbedPlushie) {
        console.log(`Found plushie ${grabbedPlushie.id} to grab!`);
        const grabResult = calculateGrabSuccess(grabbedPlushie, clawPosition.x);
        
        if (grabResult.success) {
          console.log('Grab successful! Starting lift sequence...');
          
          // Step 3: Move claw up FIRST (no plushie attached yet)
          console.log('Step 3: Claw moving up alone...');
          setClawPosition(prev => ({ ...prev, y: 15 }));
          
          // Step 4: After claw reaches top, THEN attach plushie
          setTimeout(() => {
            console.log('Step 4: Attaching plushie to claw...');
            setPlushies(prev => 
              prev.map(p => 
                p.id === grabbedPlushie.id 
                  ? { ...p, isGrabbed: true, x: clawPosition.x, y: 15 }
                  : p
              )
            );
            
            // Step 5: Move BOTH claw and plushie horizontally together
            setTimeout(() => {
              console.log('Step 5: Moving to prize box...');
              const prizeBoxCenterX = 10;
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
                console.log('Plushie will drop during transport...');
                setTimeout(() => {
                  setPlushies(prev => 
                    prev.map(p => 
                      p.id === grabbedPlushie.id 
                        ? { ...p, isGrabbed: false, isFalling: true }
                        : p
                    )
                  );
                  
                  setTimeout(() => {
                    const randomX = Math.random() * 60 + 20;
                    setPlushies(prev => 
                      prev.map(p => 
                        p.id === grabbedPlushie.id 
                          ? { ...p, y: 70, x: randomX, isFalling: false }
                          : p
                      )
                    );
                  }, 1000);
                  
                  setTimeout(() => {
                    resetClawPosition();
                    onResetTimer();
                    onFailedGrab();
                  }, 1500);
                }, 1000);
              } else {
                // Step 6: Drop plushie into prize box
                setTimeout(() => {
                  console.log('Step 6: Dropping into prize box...');
                  setPlushies(prev => 
                    prev.map(p => 
                      p.id === grabbedPlushie.id 
                        ? { ...p, isGrabbed: false, isDropping: true }
                        : p
                    )
                  );
                  
                  setTimeout(() => {
                    setPlushies(prev => 
                      prev.map(p => 
                        p.id === grabbedPlushie.id 
                          ? { ...p, y: 85, x: prizeBoxCenterX }
                          : p
                      )
                    );
                    
                    setTimeout(() => {
                      const prizeBoxLeft = 0;
                      const prizeBoxRight = 20;
                      const finalX = prizeBoxCenterX;
                      const isInPrizeBox = finalX >= prizeBoxLeft && finalX <= prizeBoxRight;
                      
                      console.log(`Final position X: ${finalX}, In prize box: ${isInPrizeBox}`);
                      
                      setPlushies(prev => prev.filter(p => p.id !== grabbedPlushie.id));
                      
                      if (isInPrizeBox) {
                        onSuccessfulGrab(grabbedPlushie);
                        addNewPlushies();
                      } else {
                        onFailedGrab();
                      }
                      
                      resetClawPosition();
                      onResetTimer();
                    }, 800);
                  }, 200);
                }, 800);
              }
            }, 1500);
          }, 1200); // Wait for claw to fully reach top before attaching plushie
          
          return;
        }
      }
      
      console.log('No grab - moving claw back up...');
      setTimeout(() => {
        setClawPosition(prev => ({ ...prev, y: 15 }));
        
        setTimeout(() => {
          resetClawPosition();
          onResetTimer();
          onFailedGrab();
        }, 1000);
      }, 600);
    }, 1500);
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
        {/* Prize Drop Slot - Wider for better scoring */}
        <div className="absolute bottom-0 left-0 w-24 h-20 prize-slot border-2 border-yellow-400">
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