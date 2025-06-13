import React from 'react';

interface DotData {
  id: string;
  x: number;
  y: number; // Now always 0 (same level as claw)
  color: 'green' | 'orange' | 'yellow' | 'blue';
  successRate: number;
}

interface PlushieProps {
  position: { x: number; y: number };
  imagePath: string;
  type: 'generic' | 'medium' | 'good';
  value: number;
  isGrabbed: boolean;
  isFalling: boolean;
  isDropping: boolean;
  dots: DotData[];
  showDots?: boolean; // PROP TO CONTROL DOT VISIBILITY
}

const Plushie: React.FC<PlushieProps> = ({ 
  position, 
  imagePath, 
  type, 
  value, 
  isGrabbed, 
  isFalling, 
  isDropping,
  dots,
  showDots = false // DEFAULT TO INVISIBLE
}) => {
  const getAnimationClass = () => {
    if (isDropping) return 'animate-drop-to-prize';
    if (isFalling) return 'animate-fall-down';
    if (isGrabbed) return 'transition-all duration-1000 ease-in-out';
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

  const getDotColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-500 border-white';
      case 'orange':
        return 'bg-orange-500 border-white';
      case 'yellow':
        return 'bg-yellow-500 border-white';
      case 'blue':
        return 'bg-blue-500 border-white';
      default:
        return 'bg-gray-500 border-white';
    }
  };

  const getDotSize = (color: string) => {
    switch (color) {
      case 'blue':
        return 'w-4 h-4'; // Largest for 30% success
      case 'orange':
        return 'w-3 h-3'; // Medium for 60% success
      case 'yellow':
        return 'w-2.5 h-2.5'; // Smaller for 40% success
      case 'green':
        return 'w-2 h-2'; // Smallest for 90% success
      default:
        return 'w-2 h-2';
    }
  };

  // Special sizing for gaara.png to make it bigger
  const getPlushieSize = () => {
    if (imagePath.includes('gaara.png')) {
      return 'w-28 h-28'; // Bigger size for gaara
    }
    return 'w-20 h-20'; // Default size
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
          className={`${getPlushieSize()} object-contain filter drop-shadow-lg animate-wiggle`}
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
        
        {/* Dynamic Grab Point Dots - CONTROLLED BY showDots PROP */}
        {showDots && !isGrabbed && !isFalling && !isDropping && dots.map((dot) => (
          <div
            key={dot.id}
            className={`absolute ${getDotSize(dot.color)} ${getDotColor(dot.color)} rounded-full animate-pulse border-2 shadow-lg z-20`}
            style={{
              left: `calc(50% + ${dot.x}px)`,
              top: `calc(50% + ${dot.y}px)`, // Since dot.y is always 0, this centers vertically
              transform: 'translate(-50%, -50%)'
            }}
            title={`${dot.color.toUpperCase()} - ${Math.round(dot.successRate * 100)}% success`}
          />
        ))}
      </div>
    </div>
  );
};

export default Plushie;