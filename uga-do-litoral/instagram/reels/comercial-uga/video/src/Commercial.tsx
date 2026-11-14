import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Agenda, Label, Sentence, WordSwap} from './components/Cards';
import {DepthPhoto} from './components/DepthPhoto';
import {Grain} from './components/Grain';
import {LightLeak} from './components/LightLeak';
import {Wall} from './components/Wall';
import {beatGrid, onBeat} from './lib/beat';
import {COLOR, FPS} from './lib/brand';
import type {Plan, Shot} from './plans';

const ShotView: React.FC<{shot: Shot; dur: number; g: ReturnType<typeof beatGrid>}> = ({shot, dur, g}) => {
  switch (shot.kind) {
    case 'photo':
      return (
        <>
          <DepthPhoto name={shot.name} move={shot.move} duration={dur} />
          {shot.label ? <Label text={shot.label} dark={shot.labelDark} start={shot.at === 0 ? onBeat(g, 2) : 4} /> : null}
        </>
      );
    case 'text':
      return <Sentence text={shot.text} bg={shot.bg} />;
    case 'swap':
      return (
        <AbsoluteFill style={{backgroundColor: COLOR.black}}>
          {shot.photo ? <DepthPhoto name={shot.photo.name} move={shot.photo.move} duration={dur} dim={shot.photo.dim} /> : null}
          <WordSwap words={shot.words} every={Math.round(dur / shot.words.length)} />
        </AbsoluteFill>
      );
    case 'wall':
      return <Wall duration={dur} />;
    case 'agenda':
      return <Agenda lockAt={onBeat(g, shot.lock) - onBeat(g, shot.at)} handleAt={onBeat(g, shot.handle) - onBeat(g, shot.at)} />;
  }
};

export const Commercial: React.FC<{plan: Plan}> = ({plan}) => {
  const g = beatGrid(plan.bpm, FPS);
  const leaks = plan.shots.filter((s) => s.kind === 'photo' && s.leak).map((s) => onBeat(g, s.at));
  return (
    <AbsoluteFill style={{backgroundColor: COLOR.black}}>
      {plan.shots.map((shot, i) => {
        const from = onBeat(g, shot.at);
        const to = shot.kind === 'agenda' ? plan.frames : onBeat(g, shot.at + shot.len);
        return (
          <Sequence key={i} from={from} durationInFrames={to - from} name={`${i + 1} ${shot.kind}${'name' in shot ? ' ' + shot.name : ''}`}>
            <ShotView shot={shot} dur={to - from} g={g} />
          </Sequence>
        );
      })}
      {leaks.map((cut, i) => (
        <LightLeak key={cut} cut={cut} from={i % 2 ? 'right' : 'left'} />
      ))}
      <Grain />
      <Audio src={staticFile(plan.music)} />
      {leaks.map((cut) => (
        <Sequence key={`s${cut}`} from={Math.max(0, cut - 6)}>
          <Audio src={staticFile(`${plan.sfx}/swish.wav`)} volume={0.4} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
