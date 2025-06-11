
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
  const [plushies, setPlushies] = useState<PlushieData[]>([
    { id: 1, x: 20, y: 70, type: '🧸', color: 'brown', isGrabbed: false },
    { id: 2, x: 35, y: 75, type: '🐱', color: 'orange', isGrabbed: false },
    { id: 3, x: 65, y: 72, type: '🐶', color: 'golden', isGrabbed: false },
    { id: 4, x: 80, y: 68, type: '🐰', color: 'white', isGrabbed: false },
    { id: 5, x: 50, y: 80, type: '🦊', color: 'red', isGrabbed: false },
  ]);
  const [hasMovedClaw, setHasMovedClaw] = useState(false);

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
    
    // Step 1: Animate claw going down slowly
    setClawPosition(prev => ({ ...prev, y: 70 }));
    
    setTimeout(() => {
      // Step 2: Check for collision with plushies
      const grabbedPlushie = plushies.find(plushie => {
        if (plushie.isGrabbed) return false;
        
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
          
          // Step 4: Move claw (with plushie) slowly back up to top
          setTimeout(() => {
            setClawPosition(prev => ({ ...prev, y: 10 }));
            setPlushies(prev => 
              prev.map(p => 
                p.id === grabbedPlushie.id 
                  ? { ...p, y: 10 }
                  : p
              )
            );
            
            // Step 5: Move claw (with plushie) horizontally to prize slot (left edge)
            setTimeout(() => {
              setClawPosition(prev => ({ ...prev, x: 15 }));
              setPlushies(prev => 
                prev.map(p => 
                  p.id === grabbedPlushie.id 
                    ? { ...p, x: 15 }
                    : p
                )
              );
              
              // Check if plushie should drop during horizontal movement (for side dots)
              const shouldDrop = distance >= 3 && Math.random() < 0.5; // 50% chance for side dots
              
              if (shouldDrop) {
                // Plushie drops during horizontal movement
                setTimeout(() => {
                  setPlushies(prev => 
                    prev.map(p => 
                      p.id === grabbedPlushie.id 
                        ? { ...p, y: 75, isGrabbed: false }
                        : p
                    )
                  );
                  
                  // Reset claw and fail
                  setTimeout(() => {
                    resetClawPosition();
                    onFailedGrab();
                  }, 800);
                }, 500);
              } else {
                // Step 6: Drop plushie straight down into prize slot
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
                  }, 1000);
                }, 500);
              }
            }, 1500); // Slower horizontal movement
          }, 1500); // Slower vertical movement up
          
          return;
        }
      }
      
      // Failed grab or no plushie - Step 3: Move claw back up
      setTimeout(() => {
        setClawPosition(prev => ({ ...prev, y: 10 }));
        
        setTimeout(() => {
          resetClawPosition();
          onFailedGrab();
        }, 1500); // Slower movement back up
      }, 800);
    }, 1500); // Slower movement down
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
