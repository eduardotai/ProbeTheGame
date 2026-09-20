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

interface Window {
  __bootPhase?: 'drift' | 'debris-field' | 'gravity-well' | 'swarm';
  __probeTransitSeed?: number;
  __drift?: {
    snapshot: () => DriftDebugSnapshot;
  };
  __debris?: {
    snapshot: () => DebrisDebugSnapshot;
    placeProbe: (x: number, y: number) => void;
    hitProbe: (amount?: number) => number;
    restart: () => void;
  };
  __gravity?: {
    snapshot: () => GravityDebugSnapshot;
    placeProbe: (x: number, y: number) => void;
    hitProbe: (amount?: number) => number;
    restart: () => void;
  };
  __swarm?: {
    snapshot: () => SwarmDebugSnapshot;
    placeProbe: (x: number, y: number) => void;
    hitProbe: (amount?: number) => number;
    restart: () => void;
  };
}
