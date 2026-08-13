"use client";

import React, { useRef, useEffect, useState } from 'react';

export function MarketingAvatar({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
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
      className={`relative flex items-center justify-center overflow-hidden bg-[#0c0c0c] rounded-full shrink-0 ${className}`}
    >
      <style>{`
        .face-25d {
          width: 240px;
          height: 240px;
          background-color: #ffffff;
          border-radius: 50%;
          position: relative;
          overflow: hidden; 
          perspective: 450px; 
        }

        .head-25d {
          width: 100%;
          height: 100%;
          position: absolute;
          transform-style: preserve-3d;
          animation: head-turn 9s infinite ease-in-out;
        }

        .eye-wrapper-25d {
          position: absolute;
          width: 45px;
          height: 65px;
          top: 87px;
        }

        .eye-wrapper-25d.left-25d {
          left: 60px;
          transform: translateZ(105px) rotateY(-12deg);
        }

        .eye-wrapper-25d.right-25d {
          left: 135px;
          transform: translateZ(105px) rotateY(12deg);
        }

        .eye-25d {
          width: 100%;
          height: 100%;
          background-color: #0c0c0c;
          border-radius: 50%;
          transform-origin: center center;
          animation: eye-blink 9s infinite ease-in-out;
        }

        .brow-25d {
          position: absolute;
          width: 50px;
          height: 30px;
          top: -32px; 
          left: -2px; 
          transform-origin: center center;
          animation: brow-move 9s infinite ease-in-out;
        }

        .mouth-wrapper-25d {
          position: absolute;
          width: 32px;
          height: 20px;
          top: 165px;
          left: 104px; 
          animation: mouth-idle 3s infinite ease-in-out;
        }

        .mouth-25d {
          width: 100%;
          height: 100%;
          background-color: #0c0c0c;
          border-radius: 10px 10px 25px 25px;
          transform-origin: center top;
          animation: mouth-express 7s infinite ease-in-out;
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

        @keyframes brow-move {
          0%, 15%  { transform: translateY(0px) scaleY(1); }
          22%      { transform: translateY(10px) scaleY(0.4); } 
          33%, 55% { transform: translateY(0px) scaleY(1); }
          65%      { transform: translateY(0px); }
          67%      { transform: translateY(3px) scaleY(0.8); }  
          69%      { transform: translateY(0px) scaleY(1); }
          77%      { transform: translateY(-8px) scaleY(1.4); } 
          88%      { transform: translateY(3px) scaleY(0.8); }  
          100%     { transform: translateY(0px) scaleY(1); }
        }

        @keyframes mouth-idle {
          0%, 100% { transform: translateZ(100px) rotateX(-15deg) translateY(0px); }
          50%      { transform: translateZ(100px) rotateX(-15deg) translateY(4px); }
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
        <div className="face-25d">
          <div className="head-25d">
            
            <div className="eye-wrapper-25d left-25d">
              <div className="brow-25d">
                <svg viewBox="0 0 50 30" width="100%" height="100%">
                  <path d="M 6 24 Q 25 -4 44 24" fill="none" stroke="#0c0c0c" strokeWidth="12" strokeLinecap="round" />
                </svg>
              </div>
              <div className="eye-25d"></div>
            </div>
            
            <div className="eye-wrapper-25d right-25d">
              <div className="brow-25d">
                <svg viewBox="0 0 50 30" width="100%" height="100%">
                  <path d="M 6 24 Q 25 -4 44 24" fill="none" stroke="#0c0c0c" strokeWidth="12" strokeLinecap="round" />
                </svg>
              </div>
              <div className="eye-25d"></div>
            </div>
            
            <div className="mouth-wrapper-25d">
              <div className="mouth-25d"></div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
