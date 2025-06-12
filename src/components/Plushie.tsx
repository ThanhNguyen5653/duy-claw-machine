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
        
        {/* Grab Points (dots) - SCATTERED ON THE PLUSHIE ITSELF */}
        {!isGrabbed && !isFalling && !isDropping && (
          <>
            {/* Center dot - 100% success (GREEN) - Dead center of plushie */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white shadow-lg z-20"></div>
            
            {/* Side dots - Variable success rate (YELLOW) - On the plushie body */}
            <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-500 rounded-full animate-pulse border-2 border-white shadow-md z-20"></div>
            <div className="absolute top-1/3 right-1/3 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-500 rounded-full animate-pulse border-2 border-white shadow-md z-20"></div>
            
            {/* Bottom side dots - More yellow dots on plushie */}
            <div className="absolute top-2/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-500 rounded-full animate-pulse border-2 border-white shadow-md z-20"></div>
            <div className="absolute top-2/3 right-1/3 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-500 rounded-full animate-pulse border-2 border-white shadow-md z-20"></div>
            
            {/* Outer edge dots - Low success rate (ORANGE) - On plushie edges */}
            <div className="absolute top-1/4 left-1/6 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full animate-pulse border border-white shadow-sm z-20"></div>
            <div className="absolute top-1/4 right-1/6 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full animate-pulse border border-white shadow-sm z-20"></div>
            <div className="absolute top-3/4 left-1/6 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full animate-pulse border border-white shadow-sm z-20"></div>
            <div className="absolute top-3/4 right-1/6 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full animate-pulse border border-white shadow-sm z-20"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default Plushie;