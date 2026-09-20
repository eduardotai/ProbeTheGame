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

interface Window {
  __drift?: {
    snapshot: () => DriftDebugSnapshot;
  };
}
