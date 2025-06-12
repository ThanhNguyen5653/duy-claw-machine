
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
    if (isGrabbed) return 'transition-all duration-6000 ease-in-out';
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
          className="w-12 h-12 object-contain filter drop-shadow-lg animate-wiggle"
          onError={(e) => {
            console.error('Failed to load image:', imagePath);
            e.currentTarget.style.display = 'none';
          }}
        />
        
        {/* Price Tag - Only show when not grabbed */}
        {!isGrabbed && (
          <div className={`absolute -top-2 -right-2 px-1 py-0.5 text-xs font-bold rounded ${getPriceTagColor()} z-10`}>
            ${value}
          </div>
        )}
        
        {/* Grab Points (dots) */}
        {!isGrabbed && !isFalling && !isDropping && (
          <>
            {/* Center dot - 100% success */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            
            {/* Side dots - 40-60% success rate */}
            <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
            <div className="absolute top-1/2 right-1/4 transform translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
            
            {/* Additional side dots for better grab zones - 40-60% success but can drop */}
            <div className="absolute top-1/3 left-1/6 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 right-1/6 transform translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
            <div className="absolute top-2/3 left-1/6 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
            <div className="absolute top-2/3 right-1/6 transform translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default Plushie;
