import React from 'react';
import {Composition} from 'remotion';
import {Commercial} from './Commercial';
import {FPS, H, W} from './lib/brand';
import {PLAN_15, PLAN_30} from './plans';

export const Root: React.FC = () => (
  <>
    {[PLAN_30, PLAN_15].map((plan) => (
      <Composition key={plan.id} id={plan.id} component={Commercial} defaultProps={{plan}} durationInFrames={plan.frames} fps={FPS} width={W} height={H} />
    ))}
  </>
);
