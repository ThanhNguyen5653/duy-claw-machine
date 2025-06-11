
import React from 'react';

interface PlushieProps {
  position: { x: number; y: number };
  type: string;
  color: string;
  isGrabbed: boolean;
}

const Plushie: React.FC<PlushieProps> = ({ position, type, color, isGrabbed }) => {
  return (
    <div
      className={`absolute plushie ${isGrabbed ? '' : 'animate-bounce-slow'}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        transition: isGrabbed ? 'all 1s ease-in-out' : 'none',
        zIndex: isGrabbed ? 15 : 5
      }}
    >
      {/* Plushie Body */}
      <div className="relative">
        <div className="text-4xl mb-2 filter drop-shadow-lg animate-wiggle">
          {type}
        </div>
        
        {/* Grab Points (dots) */}
        {!isGrabbed && (
          <>
            {/* Center dot - 100% success */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            
            {/* Side dots - 40-60% success rate */}
            <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
            <div className="absolute top-1/2 right-1/4 transform translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
            
            {/* Additional side dots for better grab zones */}
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
