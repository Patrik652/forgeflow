import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import './style.css';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};

const scenes = {
  title: [0, 180],
  problem: [180, 540],
  architecture: [540, 1020],
  run: [1020, 1560],
  close: [1560, 1800],
};

const Scene = ({range, children, className = ''}) => {
  const frame = useCurrentFrame();
  const [start, end] = range;
  const opacity = interpolate(frame, [start, start + 24, end - 24, end], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill className={`scene ${className}`} style={{opacity}}>
      {children}
    </AbsoluteFill>
  );
};

const Kicker = ({children}) => <div className="kicker">{children}</div>;

const TitleScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lift = spring({frame, fps, config: {damping: 18, stiffness: 80}});
  const scan = interpolate(frame, [0, 180], [-24, 112], clamp);

  return (
    <Scene range={scenes.title} className="title-scene">
      <div className="steel-grid" />
      <div className="title-lockup" style={{transform: `translateY(${(1 - lift) * 42}px)`}}>
        <Kicker>synthetic fixture · reference clock 2026-06-11</Kicker>
        <h1>ForgeFlow</h1>
        <p>CNC Production Job Tracker</p>
        <div className="brand-line">by SYNAPTIC FORGE</div>
      </div>
      <div className="scanner" style={{left: `${scan}%`}} />
    </Scene>
  );
};

const ProblemScene = () => {
  const frame = useCurrentFrame();
  const cards = [
    ['Spreadsheet queues', 'Jobs drift across tabs, notes, and inboxes.'],
    ['Missed due dates', 'Late work is noticed after the floor is already blocked.'],
    ['Line stoppage risk', 'High-priority parts need escalation before they stall production.'],
  ];

  return (
    <Scene range={scenes.problem} className="problem-scene">
      <div className="section-head">
        <Kicker>the production gap</Kicker>
        <h2>Small routing misses become expensive shop-floor delays.</h2>
      </div>
      <div className="problem-grid">
        {cards.map(([title, body], index) => {
          const local = frame - scenes.problem[0] - index * 34;
          const y = interpolate(local, [0, 28], [42, 0], clamp);
          const opacity = interpolate(local, [0, 28], [0, 1], clamp);
          return (
            <div className="problem-card" key={title} style={{opacity, transform: `translateY(${y}px)`}}>
              <div className="card-index">0{index + 1}</div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          );
        })}
      </div>
    </Scene>
  );
};

const ArchitectureScene = () => {
  const frame = useCurrentFrame();
  const nodes = [
    ['Manual fixture', '8 synthetic jobs from CSV'],
    ['Shared rules', 'ETA risk, priority, route'],
    ['Route switch', '4 work centers + planner review'],
    ['Local board', 'row preview · no write'],
    ['Alert rule', 'late or high priority?'],
    ['Local alerts', 'message preview · no send'],
  ];
  const local = frame - scenes.architecture[0];
  const progress = interpolate(local, [20, 430], [0, 1], clamp);

  return (
    <Scene range={scenes.architecture} className="architecture-scene">
      <div className="section-head">
        <Kicker>safe n8n demo · no provider calls</Kicker>
        <h2>Shared rules route jobs. Local previews show the outcome.</h2>
      </div>
      <div className="flow-wrap">
        <div className="flow-line">
          <div className="flow-line-fill" style={{width: `${progress * 100}%`}} />
        </div>
        {nodes.map(([title, subtitle], index) => {
          const localNode = local - index * 54;
          const opacity = interpolate(localNode, [0, 32], [0, 1], clamp);
          const scale = interpolate(localNode, [0, 32], [0.92, 1], clamp);
          return (
            <div className={`flow-node flow-node-${index}`} key={title} style={{opacity, transform: `scale(${scale})`}}>
              <div className="node-dot" />
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
          );
        })}
      </div>
      <div className="routing-strip">
        <span>MILL</span>
        <span>LATHE</span>
        <span>LASER</span>
        <span>EDM</span>
        <span>REVIEW</span>
      </div>
    </Scene>
  );
};

const RunScene = ({mockRun}) => {
  const frame = useCurrentFrame();
  const start = scenes.run[0];
  const rows = mockRun.rows;

  return (
    <Scene range={scenes.run} className="run-scene">
      <div className="run-layout">
        <div className="run-copy">
          <Kicker>actual offline output · synthetic data</Kicker>
          <h2>8 jobs. 2 alert previews.</h2>
          <p>
            bash scripts/mock-run.sh --json<br />
            Fixture: {mockRun.input}<br />
            Reference clock: {mockRun.today}
          </p>
          <div className="proof-callout">
            J-1002 and J-1005 are the only ALERT rows. Local previews only; no external delivery.
          </div>
        </div>
        <div className="routing-table">
          <div className="table-head">
            <span>JOB</span>
            <span>ROUTE</span>
            <span>ETA</span>
            <span>PRIORITY</span>
            <span>ACTION</span>
          </div>
          {rows.map((row, index) => {
            const local = frame - start - 94 - index * 22;
            const opacity = interpolate(local, [0, 18], [0, 1], clamp);
            const x = interpolate(local, [0, 18], [28, 0], clamp);
            const isAlert = row.action === 'ALERT';
            const flash = isAlert
              ? interpolate(local, [18, 34, 58], [0, 1, 0.26], clamp)
              : 0;
            return (
              <div
                className={`table-row ${isAlert ? 'alert-row' : 'board-row'}`}
                key={row.job}
                style={{
                  opacity,
                  transform: `translateX(${x}px)`,
                  boxShadow: isAlert ? `0 0 ${26 + flash * 22}px rgba(255, 83, 83, ${0.22 + flash * 0.3})` : undefined,
                }}
              >
                <span className="job-id">{row.job}</span>
                <span>{row.route}</span>
                <span className={row.etaRisk === 'late' ? 'late' : row.etaRisk === 'at_risk' ? 'risk' : ''}>
                  {row.etaRisk}
                </span>
                <span>{row.priority}</span>
                <span className={`action-pill ${isAlert ? 'alert' : 'board'}`}>{row.action}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Scene>
  );
};

const CloseScene = () => {
  const frame = useCurrentFrame();
  const local = frame - scenes.close[0];
  const glow = interpolate(local, [0, 160], [0, 1], clamp);

  return (
    <Scene range={scenes.close} className="close-scene">
      <div className="close-mark" style={{filter: `drop-shadow(0 0 ${24 + glow * 40}px rgba(87, 225, 183, 0.32))`}}>
        SYNAPTIC FORGE
      </div>
      <h2>Rules first. AI optional.</h2>
      <p>Get the code and run the demo.</p>
      <div className="cta-row">
        <span>github.com/Patrik652/forgeflow</span>
        <span>Synthetic demo · no external delivery</span>
        <span>Provider template disabled</span>
      </div>
    </Scene>
  );
};

export const ForgeFlowDemo = ({mockRun}) => (
  <AbsoluteFill className="video-shell">
    <div className="background-noise" />
    <TitleScene />
    <ProblemScene />
    <ArchitectureScene />
    <RunScene mockRun={mockRun} />
    <CloseScene />
  </AbsoluteFill>
);
