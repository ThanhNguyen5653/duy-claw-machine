import React from 'react';

interface ClawProps {
  position: { x: number; y: number };
  isActive: boolean;
}

const Claw: React.FC<ClawProps> = ({ position, isActive }) => {
  return (
    <div
      className={`absolute claw ${isActive ? 'animate-claw-grab' : ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        transition: isActive 
          ? 'top 3s ease-in-out, left 3s ease-in-out' 
          : 'left 0.5s ease-out'
      }}
    >
      {/* Claw Cable */}
      <div 
        className="w-1 bg-gray-400 absolute left-1/2 transform -translate-x-1/2"
        style={{ 
          height: `${position.y * 4}px`,
          top: `-${position.y * 4}px`
        }}
      ></div>
      
      {/* Claw Body */}
      <div className="relative w-8 h-8">
        {/* Claw Center */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-300 to-gray-600 rounded-full border-2 border-gray-700 shadow-lg">
          {/* Claw tip indicator - RED DOT for alignment */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full border border-white shadow-md animate-pulse"></div>
        </div>
        
        {/* Left Claw Arm */}
        <div 
          className={`absolute top-4 -left-2 w-4 h-6 bg-gradient-to-b from-gray-300 to-gray-600 transform origin-top transition-transform duration-700 ${
            isActive ? 'rotate-12' : 'rotate-45'
          }`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }}
        ></div>
        
        {/* Right Claw Arm */}
        <div 
          className={`absolute top-4 -right-2 w-4 h-6 bg-gradient-to-b from-gray-300 to-gray-600 transform origin-top transition-transform duration-700 ${
            isActive ? '-rotate-12' : '-rotate-45'
          }`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }}
        ></div>
      </div>
    </div>
  );
};

export default Claw;