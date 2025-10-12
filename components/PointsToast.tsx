import React, { useEffect, useState } from 'react';

interface PointsToastProps {
  points: number;
  onClose: () => void;
}

const PointsToast: React.FC<PointsToastProps> = ({ points, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // The animation itself is 1.5s. We'll start fading out a bit before it ends.
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 1200);

    const closeTimer = setTimeout(() => {
      onClose();
    }, 1500); // Fully close after animation duration

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  return (
    <div className="points-toast">
      <div className={`points-burst-toast ${isExiting ? 'opacity-0' : ''}`}>
        +{points} XP
      </div>
    </div>
  );
};

export default PointsToast;