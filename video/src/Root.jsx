import React from 'react';
import {Composition} from 'remotion';
import {ForgeFlowDemo} from './ForgeFlowDemo.jsx';
import mockRun from '../data/mock-run.json';

export const RemotionRoot = () => (
  <Composition
    id="ForgeFlowDemo"
    component={ForgeFlowDemo}
    durationInFrames={1800}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{mockRun}}
  />
);
