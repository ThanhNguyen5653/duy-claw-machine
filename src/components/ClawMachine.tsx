import React, { useState, useRef, useCallback } from 'react';
import Claw from './Claw';
import Plushie from './Plushie';

interface ClawMachineProps {
  gameState: 'playing' | 'paused' | 'gameOver';
  onStartTimer: () => void;
  onSuccessfulGrab: () => void;
  onFailedGrab: () => void;
}

interface PlushieData {
  id: number;
  x: number;
  y: number;
  type: string;
  color: string;
  isGrabbed: boolean;
  isFalling: boolean;
}

const ClawMachine: React.FC<ClawMachineProps> = ({
  gameState,
  onStartTimer,
  onSuccessfulGrab,
  onFailedGrab
}) => {
  const machineRef = useRef<HTMLDivElement>(null);
  const [clawPosition, setClawPosition] = useState({ x: 50, y: 10 });
  const [isClawActive, setIsClawActive] = useState(false);
  const [nextPlushieId, setNextPlushieId] = useState(6);
  const [plushies, setPlushies] = useState<PlushieData[]>([
    { id: 1, x: 20, y: 70, type: '🧸', color: 'brown', isGrabbed: false, isFalling: false },
    { id: 2, x: 35, y: 75, type: '🐱', color: 'orange', isGrabbed: false, isFalling: false },
    { id: 3, x: 65, y: 72, type: '🐶', color: 'golden', isGrabbed: false, isFalling: false },
    { id: 4, x: 80, y: 68, type: '🐰', color: 'white', isGrabbed: false, isFalling: false },
    { id: 5, x: 50, y: 80, type: '🦊', color: 'red', isGrabbed: false, isFalling: false },
  ]);
  const [hasMovedClaw, setHasMovedClaw] = useState(false);

  const plushieTypes = ['🧸', '🐱', '🐶', '🐰', '🦊', '🐼', '🐻', '🐸', '🐷', '🐵'];

  const addNewPlushies = () => {
    const availablePlushies = plushies.filter(p => !p.isGrabbed && !p.isFalling);
    if (availablePlushies.length <= 2) {
      const newPlushies: PlushieData[] = [];
      for (let i = 0; i < 3; i++) {
        const randomType = plushieTypes[Math.floor(Math.random() * plushieTypes.length)];
        const randomX = Math.random() * 60 + 20; // Between 20-80%
        const randomY = Math.random() * 15 + 70; // Between 70-85%
        
        newPlushies.push({
          id: nextPlushieId + i,
          x: randomX,
          y: randomY,
          type: randomType,
          color: 'mixed',
          isGrabbed: false,
          isFalling: false
        });
      }
      
      setPlushies(prev => [...prev, ...newPlushies]);
      setNextPlushieId(prev => prev + 3);
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

  const handleClick = useCallback(() => {
    if (gameState !== 'playing' || isClawActive) return;

    setIsClawActive(true);
    
    // Step 1: Animate claw going down slowly (4 seconds)
    setClawPosition(prev => ({ ...prev, y: 70 }));
    
    setTimeout(() => {
      // Step 2: Check for collision with plushies
      const grabbedPlushie = plushies.find(plushie => {
        if (plushie.isGrabbed || plushie.isFalling) return false;
        
        const distance = Math.abs(plushie.x - clawPosition.x);
        return distance < 10; // Collision threshold
      });

      if (grabbedPlushie) {
        // Determine success chance based on accuracy
        const distance = Math.abs(grabbedPlushie.x - clawPosition.x);
        let successChance: number;
        
        if (distance < 3) {
          successChance = 1.0; // Center dot - 100% success
        } else if (distance < 6) {
          successChance = Math.random() > 0.4 ? 0.6 : 0.4; // Side dots - 40-60% success
        } else {
          successChance = Math.random() > 0.6 ? 0.4 : 0.2; // Outer dots - 20-40% success
        }
        
        if (Math.random() < successChance) {
          // Successful grab - Step 3: Move plushie to claw position and follow claw up
          setPlushies(prev => 
            prev.map(p => 
              p.id === grabbedPlushie.id 
                ? { ...p, isGrabbed: true, x: clawPosition.x, y: 70 }
                : p
            )
          );
          
          // Step 4: Move claw (with plushie) slowly back up to top (4 seconds)
          setTimeout(() => {
            setClawPosition(prev => ({ ...prev, y: 10 }));
            setPlushies(prev => 
              prev.map(p => 
                p.id === grabbedPlushie.id 
                  ? { ...p, y: 10 }
                  : p
              )
            );
            
            // Step 5: Move claw (with plushie) horizontally to prize slot (4 seconds)
            setTimeout(() => {
              setClawPosition(prev => ({ ...prev, x: 15 }));
              setPlushies(prev => 
                prev.map(p => 
                  p.id === grabbedPlushie.id 
                    ? { ...p, x: 15 }
                    : p
                )
              );
              
              // Check if plushie should drop during horizontal movement (for side/outer dots)
              const shouldDrop = distance >= 3 && Math.random() < 0.5; // 50% chance for non-center dots
              
              if (shouldDrop) {
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
                          ? { ...p, y: 75, x: randomX, isFalling: false }
                          : p
                      )
                    );
                  }, 100);
                  
                  // Reset claw and fail (2 seconds)
                  setTimeout(() => {
                    resetClawPosition();
                    onFailedGrab();
                  }, 2000);
                }, 1500);
              } else {
                // Step 6: Drop plushie when claw is over prize slot
                setTimeout(() => {
                  if (clawPosition.x <= 20) {
                    // Start falling animation into prize box
                    setPlushies(prev => 
                      prev.map(p => 
                        p.id === grabbedPlushie.id 
                          ? { ...p, isGrabbed: false, isFalling: true }
                          : p
                      )
                    );
                    
                    // Animate falling into prize box
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
                        onSuccessfulGrab();
                        addNewPlushies(); // Add new plushies if needed
                      }, 2000);
                    }, 100);
                  } else {
                    // If not over prize area, drop back to main area with animation
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
                            ? { ...p, y: 75, x: randomX, isFalling: false }
                            : p
                        )
                      );
                      
                      setTimeout(() => {
                        resetClawPosition();
                        onFailedGrab();
                      }, 2000);
                    }, 100);
                  }
                }, 1500);
              }
            }, 4000); // Slower horizontal movement (4 seconds)
          }, 4000); // Slower vertical movement up (4 seconds)
          
          return;
        }
      }
      
      // Failed grab or no plushie - Step 3: Move claw back up (3 seconds)
      setTimeout(() => {
        setClawPosition(prev => ({ ...prev, y: 10 }));
        
        setTimeout(() => {
          resetClawPosition();
          onFailedGrab();
        }, 3000); // Slower movement back up
      }, 1500);
    }, 4000); // Slower movement down (4 seconds)
  }, [gameState, isClawActive, clawPosition.x, plushies, onSuccessfulGrab, onFailedGrab]);

  const resetClawPosition = () => {
    setClawPosition({ x: 50, y: 10 });
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
            type={plushie.type}
            color={plushie.color}
            isGrabbed={plushie.isGrabbed}
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
