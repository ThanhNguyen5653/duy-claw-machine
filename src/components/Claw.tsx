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
          ? 'top 1.5s ease-in-out, left 1.5s ease-in-out' 
          : 'left 0.3s ease-out'
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
      
      {/* Claw Body - Made bigger for better alignment */}
      <div className="relative w-12 h-12">
        {/* Claw Center */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-300 to-gray-600 rounded-full border-2 border-gray-700 shadow-lg">
          {/* Claw tip indicator - RED DOT for alignment - Made bigger and more prominent */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse z-30"></div>
        </div>
        
        {/* Left Claw Arm */}
        <div 
          className={`absolute top-6 -left-2 w-6 h-8 bg-gradient-to-b from-gray-300 to-gray-600 transform origin-top transition-transform duration-700 ${
            isActive ? 'rotate-12' : 'rotate-45'
          }`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }}
        ></div>
        
        {/* Right Claw Arm */}
        <div 
          className={`absolute top-6 -right-2 w-6 h-8 bg-gradient-to-b from-gray-300 to-gray-600 transform origin-top transition-transform duration-700 ${
            isActive ? '-rotate-12' : '-rotate-45'
          }`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }}
        ></div>
      </div>
    </div>
  );
};

export default Claw;