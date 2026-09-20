/// <reference types="vite/client" />

type DriftDebugSnapshot = {
  runState: 'playing' | 'recovered' | 'lost';
  hull: number;
  hullMax: number;
  fuel: number;
  fuelCapacity: number;
  probe: { x: number; y: number };
  hunters: Array<{
    x: number;
    y: number;
    seesTarget: boolean;
    lastSeen: { x: number; y: number } | null;
  }>;
  pointBReached: boolean;
};

type DebrisDebugSnapshot = DriftDebugSnapshot & {
  elapsedMs: number;
  inPocket: boolean;
  hunters: Array<{
    x: number;
    y: number;
    seesTarget: boolean;
    lastSeen: { x: number; y: number } | null;
    visibleToProbe: boolean;
    kind: 'funnel' | 'ambusher';
  }>;
};

type GravityDebugSnapshot = {
  runState: 'playing' | 'recovered' | 'lost';
  hull: number;
  hullMax: number;
  fuel: number;
  fuelCapacity: number;
  elapsedMs: number;
  pullAccel: number;
  distToWell: number;
  routeBand: 'horizon' | 'shortcut' | 'long';
  probe: { x: number; y: number };
  hunters: Array<{
    x: number;
    y: number;
    seesTarget: boolean;
    lastSeen: { x: number; y: number } | null;
    kind: 'hunter';
  }>;
  bulwark: {
    x: number;
    y: number;
    seesTarget: boolean;
    lastSeen: { x: number; y: number } | null;
    kind: 'bulwark';
  };
  pointBReached: boolean;
};

type BossDebugSnapshot = {
  runState: 'playing' | 'recovered' | 'lost';
  seed: number;
  seedHex: string;
  world: { width: number; height: number };
  hull: number;
  hullMax: number;
  fuel: number;
  fuelCapacity: number;
  ammo: number;
  ammoCapacity: number;
  heat: number;
  overheated: boolean;
  elapsedMs: number;
  toB: number;
  zone: 'approach' | 'arena' | null;
  gateOpen: boolean;
  gateSealed: boolean;
  pointBReached: boolean;
  winRule: 'destroy-guard';
  bulwark: {
    alive: boolean;
    hp: number;
    hpMax: number;
    phase: 'idle' | 'tell' | 'commit' | 'recover' | 'dead';
    move: 'charge' | 'sweep' | 'slam' | null;
    plateActive: boolean;
    enraged: boolean;
    x: number;
    y: number;
  };
  probe: { x: number; y: number };
  facing: number;
  pointB: { x: number; y: number };
  arena: { x0: number; x1: number };
};

type AnomalyDebugSnapshot = {
  runState: 'playing' | 'recovered' | 'lost';
  invertRule: 'controls-mirrored';
  invertLabel: string;
  invertHint: string;
  seed: number;
  seedHex: string;
  world: { width: number; height: number };
  hull: number;
  hullMax: number;
  fuel: number;
  fuelCapacity: number;
  ammo: number;
  ammoCapacity: number;
  heat: number;
  overheated: boolean;
  elapsedMs: number;
  toB: number;
  zone: 'weave' | 'pack' | 'breathe' | null;
  echoAlive: number;
  echoTotal: number;
  echoTelling: number;
  nearestEchoX: number | null;
  probe: { x: number; y: number };
  facing: number;
  pointBReached: boolean;
  pointB: { x: number; y: number };
  zones: Array<{ kind: 'weave' | 'pack' | 'breathe'; x: number; y: number; w: number; h: number }>;
};

type SwarmDebugSnapshot = {
  runState: 'playing' | 'recovered' | 'lost';
  seed: number;
  seedHex: string;
  world: { width: number; height: number };
  hull: number;
  hullMax: number;
  fuel: number;
  fuelCapacity: number;
  ammo: number;
  ammoCapacity: number;
  heat: number;
  overheated: boolean;
  elapsedMs: number;
  toB: number;
  zone: 'clear' | 'push' | null;
  swarmlingAlive: number;
  swarmlingTotal: number;
  nearestSwarmlingX: number | null;
  probe: { x: number; y: number };
  facing: number;
  pointBReached: boolean;
  pointB: { x: number; y: number };
  zones: Array<{ kind: 'clear' | 'push'; x: number; y: number; w: number; h: number }>;
};

type Map1DebugSnapshot = {
  mode: 'chain' | 'standalone';
  phase: 'drift' | 'debris-field' | 'gravity-well' | 'swarm' | 'anomaly' | 'boss-gate';
  status: 'idle' | 'playing' | 'advancing' | 'lost' | 'cleared';
  loadout: {
    hull: number;
    hullMax: number;
    fuel: number;
    fuelCapacity: number;
    ammo: number;
    ammoCapacity: number;
  };
  carry: 'partial-refill';
};

interface Window {
  __bootPhase?: 'drift' | 'debris-field' | 'gravity-well' | 'swarm' | 'anomaly' | 'boss-gate';
  __probeTransitSeed?: number;
  __map1?: {
    mode: 'chain' | 'standalone';
    phase: 'drift' | 'debris-field' | 'gravity-well' | 'swarm' | 'anomaly' | 'boss-gate';
    carry: 'partial-refill';
    snapshot: () => Map1DebugSnapshot;
  };
  __drift?: {
    snapshot: () => DriftDebugSnapshot;
    placeProbe: (x: number, y: number) => void;
    hitProbe: (amount?: number) => number;
    completePhase: () => void;
    restart: () => void;
  };
  __debris?: {
    snapshot: () => DebrisDebugSnapshot;
    placeProbe: (x: number, y: number) => void;
    hitProbe: (amount?: number) => number;
    completePhase: () => void;
    restart: () => void;
  };
  __gravity?: {
    snapshot: () => GravityDebugSnapshot;
    placeProbe: (x: number, y: number) => void;
    hitProbe: (amount?: number) => number;
    completePhase: () => void;
    restart: () => void;
  };
  __swarm?: {
    snapshot: () => SwarmDebugSnapshot;
    placeProbe: (x: number, y: number) => void;
    hitProbe: (amount?: number) => number;
    completePhase: () => void;
    restart: () => void;
  };
  __anomaly?: {
    snapshot: () => AnomalyDebugSnapshot;
    placeProbe: (x: number, y: number) => void;
    hitProbe: (amount?: number) => number;
    completePhase: () => void;
    restart: () => void;
    pause: () => void;
    resume: () => void;
  };
  __boss?: {
    snapshot: () => BossDebugSnapshot;
    placeProbe: (x: number, y: number) => void;
    hitProbe: (amount?: number) => number;
    hitBulwark: (amount?: number) => number;
    killBulwark: () => void;
    completePhase: () => void;
    forceTell: (move?: 'charge' | 'sweep' | 'slam') => void;
    restart: () => void;
    pause: () => void;
    resume: () => void;
  };
}
