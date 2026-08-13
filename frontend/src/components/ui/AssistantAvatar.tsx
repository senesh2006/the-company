"use client";

import React, { useRef, useEffect, useState } from 'react';

export function AssistantAvatar({ 
  className = "",
  faceColor = "#ffffff",
  featureColor = "#0c0c0c"
}: { 
  className?: string;
  faceColor?: string;
  featureColor?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [delayStyle, setDelayStyle] = useState<React.CSSProperties>({});

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
  }, [faceColor, featureColor]);

  return (
    <div 
      ref={containerRef} 
      className={`relative flex items-center justify-center overflow-hidden bg-transparent rounded-full shrink-0 ${className}`}
      style={delayStyle}
    >
      <style>{`
        .face-assistant {
          width: 240px;
          height: 240px;
          background-color: var(--face-color, #ffffff);
          border-radius: 50%;
          position: relative;
          overflow: hidden; 
          perspective: 450px; 
          box-shadow: 0 0 40px rgba(0, 210, 255, 0.15), inset 0 0 20px rgba(0, 210, 255, 0.1);
          border: 2px solid rgba(0, 210, 255, 0.3);
        }

        .head-assistant {
          width: 100%;
          height: 100%;
          position: absolute;
          transform-style: preserve-3d;
          animation: head-turn-assistant 12s infinite ease-in-out var(--anim-delay, 0s);
        }

        .glasses-wrapper {
          position: absolute;
          width: 140px;
          height: 50px;
          top: 75px;
          left: 50px; 
          transform: translateZ(105px); 
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .glass-lens {
          width: 55px;
          height: 55px;
          border: 3px solid #00d2ff; 
          border-radius: 12px;
          background-color: rgba(0, 210, 255, 0.05); 
        }

        .glass-bridge {
          width: 24px;
          height: 3px;
          background-color: #00d2ff;
          margin-top: -15px; 
        }

        .eye-wrapper-assistant {
          position: absolute;
          width: 30px; 
          height: 55px;
          top: 75px;
        }

        .eye-wrapper-assistant.left {
          left: 65px; 
          transform: translateZ(90px) rotateY(-10deg);
        }

        .eye-wrapper-assistant.right {
          left: 135px; 
          transform: translateZ(90px) rotateY(10deg);
        }

        .eye-assistant {
          width: 100%;
          height: 100%;
          background-color: var(--feature-color, #0c0c0c);
          border-radius: 50px; 
          transform-origin: center center;
          animation: eye-blink-assistant 8s infinite ease-in-out var(--anim-delay, 0s);
        }

        .mouth-wrapper-assistant {
          position: absolute;
          width: 24px; 
          height: 12px;
          top: 155px; 
          left: 108px; 
          animation: mouth-idle-assistant 4s infinite ease-in-out var(--anim-delay, 0s);
        }

        .mouth-assistant {
          width: 100%;
          height: 100%;
          background-color: var(--feature-color, #0c0c0c);
          border-radius: 5px 5px 20px 20px;
          transform-origin: center top;
          animation: mouth-express-assistant 6s infinite ease-in-out var(--anim-delay, 0s);
        }

        @keyframes head-turn-assistant {
          0%   { transform: rotateX(-5deg) rotateY(-15deg); }
          15%  { transform: rotateX(2deg) rotateY(-25deg); }
          30%  { transform: rotateX(-10deg) rotateY(20deg); }
          45%  { transform: rotateX(15deg) rotateY(30deg) rotateZ(-5deg); }
          60%  { transform: rotateX(15deg) rotateY(30deg) rotateZ(-5deg); }
          75%  { transform: rotateX(5deg) rotateY(40deg); }
          85%  { transform: rotateX(-10deg) rotateY(-15deg) rotateZ(5deg); }
          100% { transform: rotateX(-5deg) rotateY(-15deg); }
        }

        @keyframes eye-blink-assistant {
          0%, 45%  { transform: scaleY(1); }
          47%      { transform: scaleY(0.1); } 
          49%, 75% { transform: scaleY(1); }    
          77%      { transform: scaleY(0.1); } 
          79%      { transform: scaleY(1); }
          81%      { transform: scaleY(0.1); } 
          83%, 100%{ transform: scaleY(1); }
        }

        @keyframes mouth-idle-assistant {
          0%, 100% { transform: translateZ(85px) rotateX(-10deg) translateY(0px); }
          50%      { transform: translateZ(85px) rotateX(-10deg) translateY(2px); }
        }

        @keyframes mouth-express-assistant {
          0%, 20% { 
            transform: scale(1) translate(0, 0); 
            border-radius: 5px 5px 20px 20px; 
          }
          35% { 
            transform: scale(1.2, 1.4) translate(0, 2px); 
            border-radius: 10px 10px 25px 25px; 
          }
          50%, 60% { 
            transform: scale(0.8, 1.5) translate(0, 0); 
            border-radius: 20px; 
          }
          80% { 
            transform: scale(1.1, 0.6) translate(0, -2px); 
            border-radius: 5px 5px 10px 10px; 
          }
          100% { 
            transform: scale(1) translate(0, 0); 
            border-radius: 5px 5px 20px 20px;
          }
        }
      `}</style>
      
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
        <div className="face-assistant">
          <div className="head-assistant">
            
            <div className="glasses-wrapper">
              <div className="glass-lens"></div>
              <div className="glass-bridge"></div>
              <div className="glass-lens"></div>
            </div>

            <div className="eye-wrapper-assistant left">
              <div className="eye-assistant"></div>
            </div>
            
            <div className="eye-wrapper-assistant right">
              <div className="eye-assistant"></div>
            </div>
            
            <div className="mouth-wrapper-assistant">
              <div className="mouth-assistant"></div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
