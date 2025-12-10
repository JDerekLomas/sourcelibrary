import React from 'react';

const CRYSTAL_SIZE = 240;
const BALL_RADIUS = 110;
const BALL_CENTER = CRYSTAL_SIZE / 2;

const CrystalBall: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: CRYSTAL_SIZE + 40,
      position: 'relative',
      margin: '0 auto',
      background: 'none',
      boxShadow: 'none',
      border: 'none',
    }}
  >
    <div
      style={{
        position: 'relative',
        marginBottom: 16,
        background: 'none',
        boxShadow: 'none',
        border: 'none',
        display: 'inline-block',
        animation: 'pulse-glow 3s ease-in-out infinite',
      }}
    >
      <svg
        width={CRYSTAL_SIZE}
        height={CRYSTAL_SIZE}
        style={{
          display: 'block',
          background: 'none',
        }}
      >
        {/* Stand */}
        <g>
          <rect
            x={BALL_CENTER - 50}
            y={CRYSTAL_SIZE - 0}
            width={100}
            height={28}
            rx={14}
            fill="#3a2c1a"
          />
          <ellipse
            cx={BALL_CENTER}
            cy={CRYSTAL_SIZE - 28}
            rx={36}
            ry={8}
            fill="rgba(212,175,55,0.18)"
          />
          <ellipse
            cx={BALL_CENTER}
            cy={CRYSTAL_SIZE - 16}
            rx={32}
            ry={6}
            fill="rgba(44,34,70,0.32)"
          />
        </g>
        {/* Crystal ball */}
        <ellipse
          cx={BALL_CENTER}
          cy={BALL_CENTER}
          rx={BALL_RADIUS - 4}
          ry={BALL_RADIUS - 4}
          fill="url(#crystalGradient)"
        />
        {/* Swirling animation group */}
        <g>
          <circle
            cx={BALL_CENTER}
            cy={BALL_CENTER}
            r={BALL_RADIUS - 22}
            fill="url(#swirlGradient)"
            style={{
              opacity: 1,
            //   mixBlendMode: 'lighten',
              animation: 'swirl 2.5s linear infinite',
              transformOrigin: `${BALL_CENTER}px ${BALL_CENTER}px`,
            } as React.CSSProperties}
          />
          <circle
            cx={BALL_CENTER}
            cy={BALL_CENTER}
            r={BALL_RADIUS - 32}
            fill="url(#swirlGradient2)"
            style={{
              opacity: 1,
            //   mixBlendMode: 'lighten',
              animation: 'swirl2 3.2s linear infinite',
              transformOrigin: `${BALL_CENTER}px ${BALL_CENTER}px`,
            } as React.CSSProperties}
          />
          <ellipse
            cx={BALL_CENTER + 18}
            cy={BALL_CENTER - 18}
            rx={18}
            ry={8}
            fill="url(#swirlHighlight)"
            style={{
              opacity: 1,
            //   mixBlendMode: 'screen',
              animation: 'swirl3 4.2s linear infinite',
              transformOrigin: `${BALL_CENTER}px ${BALL_CENTER}px`,
            } as React.CSSProperties}
          />
        </g>
        <defs>
          <radialGradient id="crystalGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a093c4" />
            <stop offset="55%" stopColor="#b6b6e6" />
            <stop offset="80%" stopColor="#7f6edc" />
            <stop offset="100%" stopColor="#2a2a3e" stopOpacity="0.5"/>
          </radialGradient>
          <radialGradient id="swirlGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.15" />
            <stop offset="60%" stopColor="#7f6edc" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#2a2a3e" stopOpacity="0.01" />
          </radialGradient>
          <radialGradient id="swirlGradient2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d7c6f0ff" stopOpacity="0.1" />
            <stop offset="60%" stopColor="#d4af37" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#2a2a3e" stopOpacity="0.01" />
          </radialGradient>
          <radialGradient id="swirlHighlight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#b6b6e6" stopOpacity="0.01" />
          </radialGradient>
        </defs>
        <style>
          {`
            @keyframes swirl {
              0% { transform: rotate(0deg);}
              100% { transform: rotate(360deg);}
            }
            @keyframes swirl2 {
              0% { transform: rotate(0deg);}
              100% { transform: rotate(-360deg);}
            }
            @keyframes swirl3 {
              0% { transform: rotate(0deg);}
              100% { transform: rotate(720deg);}
            }
            @keyframes pulse-glow {
              0% {
                filter: drop-shadow(0 0 12px rgba(180, 160, 220, 0.4)) drop-shadow(0 0 25px rgba(120, 80, 200, 0.4));
              }
              50% {
                filter: drop-shadow(0 0 25px rgba(200, 180, 255, 0.7)) drop-shadow(0 0 50px rgba(120, 80, 200, 0.6));
              }
              100% {
                filter: drop-shadow(0 0 12px rgba(180, 160, 220, 0.4)) drop-shadow(0 0 25px rgba(120, 80, 200, 0.4));
              }
            }
          `}
        </style>
      </svg>
      {/* Loader text overlay */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: CRYSTAL_SIZE,
          height: CRYSTAL_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          background: 'none',
          border: 'none',
        }}
      >
        <span
          style={{
            color: '#0d0733ff',
            fontWeight: 700,
            fontSize: '1.18em',
            textShadow: '0 0 14px #fff, 0 0 6px #b6b6e6',
            textAlign: 'center',
            padding: '0 22px',
            lineHeight: 1.3,
            fontFamily: "'Cinzel', serif",
            filter: 'drop-shadow(0 0 6px #b6b6e6)',
            userSelect: 'none',
            background: 'none',
            border: 'none',
          }}
        >
          {message}
        </span>
      </div>
    </div>
  </div>
);

export default CrystalBall;