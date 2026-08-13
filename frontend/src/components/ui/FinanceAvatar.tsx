"use client";

import React, { useRef, useEffect, useState, useId } from 'react';

export function FinanceAvatar({ 
  className = "",
  faceColor = "#D1FAE5", // Emerald 100
  featureColor = "#064E3B" // Emerald 900
}: { 
  className?: string;
  faceColor?: string;
  featureColor?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [delayStyle, setDelayStyle] = useState<React.CSSProperties>({});
  const clipId = useId().replace(/:/g, ""); // Remove colons from useId to be a valid CSS ID

  useEffect(() => {
    // Generate a random delay offset between 0 and -20s for each component instance
    // so they are all completely out of sync with each other
    const randomDelay = `-${Math.random() * 20}s`;
    setDelayStyle({ 
      '--anim-delay': randomDelay,
      '--face-color': faceColor,
      '--feature-color': featureColor
    } as React.CSSProperties);

    if (!containerRef.current) return;
    
    // Initial scale calculation
    const rect = containerRef.current.getBoundingClientRect();
    setScale(Math.min(rect.width, rect.height) / 240);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const minDim = Math.min(width, height);
        setScale(minDim / 240);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`relative flex items-center justify-center overflow-hidden bg-transparent rounded-full shrink-0 ${className}`}
      style={delayStyle}
    >
      <style>{`
        .face-finance-${clipId} {
          width: 240px;
          height: 240px;
          background-color: var(--face-color, #ffffff);
          position: relative;
          clip-path: url(#${clipId});
          overflow: hidden; 
          perspective: 450px; 
        }

        .head-finance {
          width: 100%;
          height: 100%;
          position: absolute;
          transform-style: preserve-3d;
          animation: head-turn 9s infinite ease-in-out var(--anim-delay, 0s);
        }

        .eye-wrapper-finance {
          position: absolute;
          width: 40px; 
          height: 60px;
          top: 75px; 
        }

        .eye-wrapper-finance.left {
          left: 65px; 
          transform: translateZ(90px) rotateY(-10deg);
        }

        .eye-wrapper-finance.right {
          left: 135px; 
          transform: translateZ(90px) rotateY(10deg);
        }

        .eye-finance {
          width: 100%;
          height: 100%;
          background-color: var(--feature-color, #0c0c0c);
          border-radius: 50%;
          transform-origin: center center;
          animation: eye-blink 9s infinite ease-in-out var(--anim-delay, 0s);
        }

        .mouth-wrapper-finance {
          position: absolute;
          width: 30px;
          height: 18px;
          top: 150px; 
          left: 105px; 
          animation: mouth-idle 3s infinite ease-in-out var(--anim-delay, 0s);
        }

        .mouth-finance {
          width: 100%;
          height: 100%;
          background-color: var(--feature-color, #0c0c0c);
          border-radius: 10px 10px 25px 25px;
          transform-origin: center top;
          animation: mouth-express 7s infinite ease-in-out var(--anim-delay, 0s);
        }

        @keyframes head-turn {
          0%   { transform: rotateX(-10deg) rotateY(-20deg); }
          11%  { transform: rotateX(5deg) rotateY(-35deg); }
          22%  { transform: rotateX(-15deg) rotateY(30deg); }
          33%  { transform: rotateX(35deg) rotateY(45deg) rotateZ(-12deg); }
          55%  { transform: rotateX(35deg) rotateY(45deg) rotateZ(-12deg); }
          66%  { transform: rotateX(10deg) rotateY(55deg); }
          77%  { transform: rotateX(-15deg) rotateY(-30deg) rotateZ(10deg); }
          88%  { transform: rotateX(-20deg) rotateY(10deg); }
          100% { transform: rotateX(-10deg) rotateY(-20deg); }
        }

        @keyframes eye-blink {
          0%, 15%  { transform: scaleY(1); }
          22%      { transform: scaleY(0.25); } 
          33%, 55% { transform: scaleY(1); }    
          65%      { transform: scaleY(1); }
          67%      { transform: scaleY(0.1); }  
          69%      { transform: scaleY(1); }
          77%      { transform: scaleX(1.1) scaleY(1.1); } 
          88%      { transform: scaleY(0.1); }  
          100%     { transform: scaleY(1); }
        }

        @keyframes mouth-idle {
          0%, 100% { transform: translateZ(85px) rotateX(-15deg) translateY(0px); }
          50%      { transform: translateZ(85px) rotateX(-15deg) translateY(4px); }
        }

        @keyframes mouth-express {
          0% { 
            transform: scale(1) translate(0, 0); 
            border-radius: 10px 10px 25px 25px;
          }
          20% { 
            transform: scale(1.1, 1.5) translate(0, 0); 
            border-radius: 10px 10px 30px 30px;
          }
          40% { 
            transform: scale(0.9, 0.15) translate(0, -6px); 
            border-radius: 10px;
          }
          60% { 
            transform: scale(0.4, 0.8) translate(5px, -5px); 
            border-radius: 50%;
          }
          80% { 
            transform: scale(0.8, 0.4) translate(-4px, -2px) skewY(-15deg); 
            border-radius: 0px 15px 25px 15px;
          }
          100% { 
            transform: scale(1) translate(0, 0); 
            border-radius: 10px 10px 25px 25px;
          }
        }
      `}</style>

      {/* SVG ClipPath for the wavy shape */}
      <svg width="0" height="0" className="absolute">
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <path d="
            M 149.3 29.7 
            Q 190.5 23 201 61 
            Q 234 83 225 120 
            Q 234 157 201 179 
            Q 190.5 217 149.3 210.3 
            Q 120 240 90.7 210.3 
            Q 49.5 217 39 179 
            Q 6 157 15 120 
            Q 6 83 39 61 
            Q 49.5 23 90.7 29.7 
            Q 120 0 149.3 29.7 
            Z" 
          />
        </clipPath>
      </svg>
      
      {/* The 240px wrapper is scaled to fit precisely within the outer div */}
      <div 
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'center center',
          width: '240px',
          height: '240px',
          position: 'absolute'
        }}
      >
        <div className={`face-finance-${clipId}`}>
          <div className="head-finance">
            <div className="eye-wrapper-finance left">
              <div className="eye-finance"></div>
            </div>
            
            <div className="eye-wrapper-finance right">
              <div className="eye-finance"></div>
            </div>
            
            <div className="mouth-wrapper-finance">
              <div className="mouth-finance"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
