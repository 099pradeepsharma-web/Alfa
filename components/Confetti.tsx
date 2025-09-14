import React, { useEffect, useState } from 'react';

const ConfettiPiece: React.FC<{ id: number }> = ({ id }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'];
    setStyle({
      left: `${Math.random() * 100}vw`,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      animationDelay: `${Math.random() * 5}s`,
      width: `${Math.floor(Math.random() * 8) + 8}px`,
      height: `${Math.floor(Math.random() * 8) + 8}px`,
      transform: `rotate(${Math.random() * 360}deg)`,
    });
  }, [id]);

  return <div className="confetti" style={style}></div>;
};

const Confetti: React.FC = () => {
  const [pieces, setPieces] = useState<number[]>([]);

  useEffect(() => {
    // Generate 50 confetti pieces
    const newPieces = Array.from({ length: 50 }, (_, i) => i);
    setPieces(newPieces);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50 overflow-hidden">
      {pieces.map(id => <ConfettiPiece key={id} id={id} />)}
    </div>
  );
};

export default React.memo(Confetti);