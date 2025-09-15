import React from 'react';

interface LogoProps {
    size?: number;
}

const Logo: React.FC<LogoProps> = ({ size = 48 }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Alfanumrik Logo"
            className="alfanumrik-logo"
            style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                animation: 'logo-float 4s ease-in-out infinite',
            }}
        >
            <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'rgb(var(--c-primary-dark))' }} />
                    <stop offset="100%" style={{ stopColor: 'rgb(var(--c-text-accent))' }} />
                </linearGradient>
                <style>
                    {`
                        .alfanumrik-logo .logo-swoosh {
                            stroke-dasharray: 200;
                            stroke-dashoffset: 200;
                            animation: logo-draw 2s ease-out forwards 0.5s;
                        }
                        @keyframes logo-draw {
                            to {
                                stroke-dashoffset: 0;
                            }
                        }
                    `}
                </style>
            </defs>
            <circle
                cx="50"
                cy="50"
                r="45"
                fill="url(#logo-gradient)"
                opacity="0.1"
            />
            <path
                d="M25 80 L50 20 L75 80"
                stroke="url(#logo-gradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                style={{ animation: 'logo-glow 4s ease-in-out infinite' }}
            />
            <path
                d="M35 60 H65"
                stroke="rgb(var(--c-surface))"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
            />
            <path
                className="logo-swoosh"
                d="M70 25 C 85 40, 85 60, 70 75"
                stroke="rgb(var(--c-success))"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
            />
        </svg>
    );
};

export default Logo;
