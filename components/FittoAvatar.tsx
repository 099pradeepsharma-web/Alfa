import React from 'react';

export type FittoState = 'idle' | 'thinking' | 'speaking' | 'celebrating' | 'encouraging';

interface FittoAvatarProps {
    state?: FittoState;
    size?: number;
}

// Generate more elaborate confetti particles
const generateConfetti = (count: number) => {
    const particles = [];
    const shapes = ['circle', 'square'];
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'];
    
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * 360 + (Math.random() - 0.5) * 20;
        const distance = Math.random() * 40 + 40; // Increased distance
        
        particles.push({
            id: i,
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            style: {
                '--x': `${Math.cos(angle * Math.PI / 180) * distance}px`,
                '--y': `${Math.sin(angle * Math.PI / 180) * distance - 10}px`,
                '--r': `${Math.random() * 360}deg`,
                backgroundColor: colors[i % colors.length],
                animationDelay: `${Math.random() * 0.2}s`,
                width: `${Math.floor(Math.random() * 5) + 5}px`,
                height: `${Math.floor(Math.random() * 5) + 5}px`,
            } as React.CSSProperties
        });
    }
    return particles;
};

const confettiParticles = generateConfetti(30);


const FittoAvatar: React.FC<FittoAvatarProps> = ({ state = 'idle', size = 64 }) => {
    const eyeSize = size * 0.4;
    return (
        <div 
            className={`fitto-avatar ${state}`} 
            style={{ width: size, height: size }}
            aria-label={`Fitto AI assistant in ${state} state`}
            role="img"
        >
            {/* Thinking state: Orbiting dots */}
            {state === 'thinking' && (
                <div className="fitto-thinking-container">
                    <div className="fitto-thinking-dot"></div>
                    <div className="fitto-thinking-dot"></div>
                    <div className="fitto-thinking-dot"></div>
                </div>
            )}

            <div className={`fitto-eye ${state === 'idle' ? 'idle' : ''}`} style={{ width: eyeSize, height: eyeSize }}>
              {/* Speaking state: Animated mouth */}
              {state === 'speaking' && (
                <div className="fitto-mouth"></div>
              )}
            </div>
            
            {/* Celebrating state: More elaborate confetti */}
            {state === 'celebrating' && (
                <div className="fitto-confetti-container">
                    {confettiParticles.map(p => (
                        <div key={p.id} className={`fitto-confetti-particle ${p.shape}`} style={p.style} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FittoAvatar;