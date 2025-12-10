import React, { useRef, useEffect, useState } from 'react';

interface TapToRevealProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

const TapToReveal: React.FC<TapToRevealProps> = ({
  children,
  width = 400,
  height = 120,
  style = {},
}) => {
  const [revealed, setRevealed] = useState(false);
  const [fading, setFading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw the gold overlay with texture
  useEffect(() => {
    if (!revealed && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Fill overlay with gold color
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#b8a96d';
      ctx.fillRect(0, 0, width, height);

      // Add some texture for a richer look
      for (let i = 0; i < 1000; i++) {
        ctx.fillStyle = `rgba(212,175,55,${Math.random() * 0.2 + 0.1})`;
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 8, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }, [revealed, width, height]);

  // Handle fade-out animation
  const handleReveal = () => {
    if (!revealed) {
      setFading(true);
      setTimeout(() => {
        setRevealed(true);
      }, 1200); // fade duration increased to 1.2s
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width,
        minHeight: height,
        ...style,
        cursor: revealed ? 'auto' : 'pointer',
        userSelect: 'none',
      }}
      onClick={revealed ? undefined : handleReveal}
      tabIndex={revealed ? -1 : 0}
      aria-label={revealed ? undefined : 'Tap to reveal'}
    >
      {/* Always render children, just let overlay fade out */}
      <div style={{ opacity: 1, transition: 'none' }}>
        {children}
      </div>
      {!revealed && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 1.2s',
            opacity: fading ? 0 : 1,
            pointerEvents: 'auto',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              borderRadius: 8,
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
            }}
            aria-hidden="true"
          />
          <span
            style={{
              position: 'relative',
              zIndex: 2,
              color: '#4d3a00',
              fontWeight: 600,
              fontSize: '1.1em',
              letterSpacing: '0.05em',
              textShadow: 'none',
              opacity: 1,
              pointerEvents: 'none',
              fontFamily: "'Cinzel', serif",
            }}
          >
            Tap to Reveal
          </span>
        </div>
      )}
    </div>
  );
};

export default TapToReveal;
