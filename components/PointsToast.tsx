import React, { useEffect } from 'react';

interface PointsToastProps {
  points: number;
  onClose: () => void;
}

const PointsToast: React.FC<PointsToastProps> = ({ points, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000); // Disappear after 2 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="points-toast">
      <div className="bg-green-500 text-white font-bold py-2 px-4 rounded-full shadow-lg">
        +{points} XP
      </div>
    </div>
  );
};

export default PointsToast;