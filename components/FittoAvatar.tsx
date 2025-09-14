import React from 'react';

export type FittoState = 'idle' | 'thinking' | 'speaking' | 'celebrating' | 'encouraging';

interface FittoAvatarProps {
    state?: FittoState;
    size?: number;
}

const confettiParticles = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * 360 + (Math.random() - 0.5) * 10;
    const distance = Math.random() * 20 + 25;
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'];
    return {
        id: i,
        // Using CSS variables for the transform destination, which are defined in index.html
        style: {
            '--x': `${Math.cos(angle * Math.PI / 180) * distance}px`,
            '--y': `${Math.sin(angle * Math.PI / 180) * distance - 10}px`,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${Math.random() * 0.1}s`
        } as React.CSSProperties
    };
});


const FittoAvatar: React.FC<FittoAvatarProps> = ({ state = 'idle', size = 64 }) => {
    const eyeSize = size * 0.4;
    return (
        <div 
            className={`fitto-avatar ${state}`} 
            style={{ width: size, height: size }}
            aria-label={`Fitto AI assistant in ${state} state`}
            role="img"
        >
            <div className="fitto-eye" style={{ width: eyeSize, height: eyeSize }}>
              {state === 'speaking' && (
                <>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                </>
              )}
            </div>
            {state === 'celebrating' && (
                <div className="fitto-confetti-container">
                    {confettiParticles.map(p => (
                        <div key={p.id} className="fitto-confetti-particle" style={p.style} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FittoAvatar;