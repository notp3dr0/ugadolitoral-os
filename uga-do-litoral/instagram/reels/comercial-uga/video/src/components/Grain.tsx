import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, random} from 'remotion';

// Grão fino de filme: uma textura de ruído que pula de posição a cada frame (determinístico).
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.09}) => {
  const frame = useCurrentFrame();
  const x = Math.floor(random(`gx${frame}`) * 512);
  const y = Math.floor(random(`gy${frame}`) * 512);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile('grain.png')})`,
        backgroundPosition: `${x}px ${y}px`,
        backgroundSize: '512px 512px',
        mixBlendMode: 'overlay',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};
