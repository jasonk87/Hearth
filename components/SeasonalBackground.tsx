import React from 'react';

type Season = 'winter' | 'spring' | 'summer' | 'fall';

const getSeason = (): Season => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring'; // Mar, Apr, May
  if (month >= 5 && month <= 7) return 'summer'; // Jun, Jul, Aug
  if (month >= 8 && month <= 10) return 'fall';  // Sep, Oct, Nov
  return 'winter'; // Dec, Jan, Feb
};

const seasonsConfig = {
  winter: {
    count: 25,
    animationName: 'fall-drift',
    styles: () => ({
      width: `${Math.random() * 3 + 2}px`,
      height: `${Math.random() * 3 + 2}px`,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
    }),
  },
  spring: {
    count: 15,
    animationName: 'fall-drift',
    styles: () => ({
      width: '10px',
      height: '10px',
      backgroundColor: ['#ffb7c5', '#ffc2d1', '#ffe5ec'][Math.floor(Math.random() * 3)],
      borderRadius: '2px 50% 50% 50%',
      transform: `rotate(${Math.random() * 360}deg)`,
    }),
  },
  summer: {
    count: 15,
    animationName: 'rise-drift',
    styles: () => ({
      width: `${Math.random() * 4 + 2}px`,
      height: `${Math.random() * 4 + 2}px`,
      backgroundColor: '#fde68a', // A warm yellow
      boxShadow: '0 0 8px #fde68a',
    }),
  },
  fall: {
    count: 20,
    animationName: 'fall-drift',
    styles: () => ({
        width: `${Math.random() * 5 + 5}px`,
        height: `${Math.random() * 5 + 5}px`,
        backgroundColor: ['#d97706', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 3)],
        borderRadius: '50% 20%',
    }),
  },
};

export const SeasonalBackground: React.FC = () => {
    const season = getSeason();
    const config = seasonsConfig[season];
    const particles = Array.from({ length: config.count });

    return (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
            {particles.map((_, i) => {
                const duration = Math.random() * 10 + 10; // 10-20 seconds
                const delay = Math.random() * duration;
                const drift = (Math.random() - 0.5) * 40; // -20vw to +20vw drift

                return (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            ...config.styles(),
                            left: `${Math.random() * 100}vw`,
                            animationName: config.animationName,
                            animationDuration: `${duration}s`,
                            animationDelay: `-${delay}s`,
                            // @ts-ignore
                            '--drift-x': `${drift}vw`,
                        }}
                    />
                );
            })}
        </div>
    );
};