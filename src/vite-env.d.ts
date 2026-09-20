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

interface Window {
  __bootPhase?: 'drift' | 'debris-field';
  __drift?: {
    snapshot: () => DriftDebugSnapshot;
  };
  __debris?: {
    snapshot: () => DebrisDebugSnapshot;
    placeProbe: (x: number, y: number) => void;
    hitProbe: (amount?: number) => number;
    restart: () => void;
  };
}
