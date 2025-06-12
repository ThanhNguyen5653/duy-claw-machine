import React from 'react';

interface PlushieProps {
  position: { x: number; y: number };
  imagePath: string;
  type: 'generic' | 'medium' | 'good';
  value: number;
  isGrabbed: boolean;
  isFalling: boolean;
  isDropping: boolean;
}

const Plushie: React.FC<PlushieProps> = ({ 
  position, 
  imagePath, 
  type, 
  value, 
  isGrabbed, 
  isFalling, 
  isDropping 
}) => {
  const getAnimationClass = () => {
    if (isDropping) return 'animate-drop-to-prize';
    if (isFalling) return 'animate-fall-down';
    if (isGrabbed) return 'transition-all duration-1500 ease-in-out';
    return 'animate-bounce-slow';
  };

  const getPriceTagColor = () => {
    switch (type) {
      case 'generic':
        return 'bg-blue-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'good':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div
      className={`absolute plushie ${getAnimationClass()}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isGrabbed ? 15 : 5
      }}
    >
      {/* Plushie Body */}
      <div className="relative">
        <img 
          src={imagePath}
          alt="Plushie"
          className="w-20 h-20 object-contain filter drop-shadow-lg animate-wiggle"
          onError={(e) => {
            console.error('Failed to load image:', imagePath);
            e.currentTarget.style.display = 'none';
          }}
        />
        
        {/* Price Tag - Only show when not grabbed */}
        {!isGrabbed && (
          <div className={`absolute -top-3 -right-3 px-2 py-1 text-sm font-bold rounded ${getPriceTagColor()} z-10 shadow-lg`}>
            ${value}
          </div>
        )}
        
        {/* Grab Points (dots) - ALL positioned at the same level to align with claw red dot */}
        {!isGrabbed && !isFalling && !isDropping && (
          <>
            {/* Center dot - 100% success (GREEN) - Positioned to align perfectly with claw red dot */}
            <div className="absolute top-[-6px] left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white shadow-lg z-20"></div>
            
            {/* Side dots - Variable success rate (YELLOW) - Same level as center dot */}
            <div className="absolute top-[-6px] left-1/4 transform -translate-x-1/2 w-4 h-4 bg-yellow-500 rounded-full animate-pulse border-2 border-white shadow-md z-20"></div>
            <div className="absolute top-[-6px] right-1/4 transform translate-x-1/2 w-4 h-4 bg-yellow-500 rounded-full animate-pulse border-2 border-white shadow-md z-20"></div>
            
            {/* Outer dots - Low success rate (ORANGE) - Same level as other dots */}
            <div className="absolute top-[-6px] left-1/6 transform -translate-x-1/2 w-3 h-3 bg-orange-500 rounded-full animate-pulse border border-white shadow-sm z-20"></div>
            <div className="absolute top-[-6px] right-1/6 transform translate-x-1/2 w-3 h-3 bg-orange-500 rounded-full animate-pulse border border-white shadow-sm z-20"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default Plushie;