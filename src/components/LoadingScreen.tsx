import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <img 
        src="src/assets/images/loadin.gif" 
        alt="Loading..." 
        className="w-3/4 h-3/4 object-contain"
      />
    </div>
  );
};

export default LoadingScreen;