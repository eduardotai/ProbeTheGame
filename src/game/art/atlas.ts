import Phaser from 'phaser';
import { Palette, TextureKey } from '../constants';
import { bakePixelSprite, type PixelPalette } from './bake';

const INK = 0x070b10;

/**
 * Shared pixel atlas. Canvas-drawn, nearest-neighbor, 2× art pixels.
 * Silhouettes sized to match existing arcade setSize hitboxes.
 */
export function generatePixelAtlas(scene: Phaser.Scene): void {
  bake(scene, TextureKey.Probe, PROBE, PROBE_PAL);
  bake(scene, TextureKey.Hunter, HUNTER, HUNTER_PAL);
  bake(scene, TextureKey.Ambusher, AMBUSHER, AMBUSHER_PAL);
  bake(scene, TextureKey.Bulwark, BULWARK, BULWARK_PAL);
  bake(scene, TextureKey.GateBulwark, GATE_BULWARK, GATE_BULWARK_PAL);
  bake(scene, TextureKey.Swarmling, SWARMLING, SWARMLING_PAL);
  bake(scene, TextureKey.Splitter, SPLITTER, SPLITTER_PAL);
  bake(scene, TextureKey.Bolt, BOLT, BOLT_PAL);
  bake(scene, TextureKey.Echo, ECHO, ECHO_PAL);
  bake(scene, TextureKey.EchoPrime, ECHO_PRIME, ECHO_PRIME_PAL);
  bake(scene, TextureKey.WardBolt, WARD_BOLT, WARD_PAL);
  bake(scene, TextureKey.PointA, POINT_A, POINT_A_PAL);
  bake(scene, TextureKey.PointB, POINT_B, POINT_B_PAL);
  bake(scene, TextureKey.WellCore, WELL_CORE, WELL_PAL);
  bake(scene, TextureKey.Cover, COVER_STEEL, COVER_STEEL_PAL);
  bake(scene, TextureKey.CoverDebris, COVER_DEBRIS, COVER_DEBRIS_PAL);
  bake(scene, TextureKey.CoverAnomaly, COVER_ANOMALY, COVER_ANOMALY_PAL);
  bake(scene, TextureKey.CoverGate, COVER_GATE, COVER_GATE_PAL);
  bake(scene, TextureKey.PocketFloor, POCKET_FLOOR, POCKET_PAL);
  bake(scene, TextureKey.ZoneFloor, ZONE_FLOOR, ZONE_PAL);
  bake(scene, TextureKey.ZoneFloorWarm, ZONE_FLOOR_WARM, ZONE_WARM_PAL);
  bake(scene, TextureKey.ZoneFloorAnomaly, ZONE_FLOOR_ANOMALY, ZONE_ANOMALY_PAL);
  bake(scene, TextureKey.ZoneFloorGate, ZONE_FLOOR_GATE, ZONE_GATE_PAL);
  bake(scene, TextureKey.Lane, LANE, LANE_PAL);
  bake(scene, TextureKey.LaneAnomaly, LANE, LANE_ANOMALY_PAL);
  bake(scene, TextureKey.LaneGate, LANE, LANE_GATE_PAL);
  bake(scene, TextureKey.GateWall, GATE_WALL, GATE_WALL_PAL);
  bake(scene, TextureKey.GateWallOpen, GATE_WALL_OPEN, GATE_OPEN_PAL);
}

function bake(scene: Phaser.Scene, key: string, rows: readonly string[], palette: PixelPalette): void {
  bakePixelSprite(scene, key, rows, palette, 2);
}

/** 11×14 art px → 22×28. Unmanned wedge, one sensor eye, thruster. */
const PROBE = [
  '....kkk....',
  '...kwwwk...',
  '..kwwcwwk..',
  '.kwwcecwwk.',
  '.kwwcecwwk.',
  'kwwcccccwwk',
  'kwwcccccwwk',
  'kkcwwwwwckk',
  '.kkccccckk.',
  '..kkccckk..',
  '...ktttk...',
  '...ktftk...',
  '....kfk....',
  '.....k.....',
];

const PROBE_PAL: PixelPalette = {
  k: INK,
  w: Palette.probeBody,
  c: 0x6aa0c4,
  e: Palette.sensorEye,
  t: Palette.thruster,
  f: 0xa8c8ff,
};

/** 11×13 → 22×26. Chase chevron, nose-up, hot visor. */
const HUNTER = [
  '....kkk....',
  '...krrrk...',
  '..krrhrrk..',
  '.krrhehrrk.',
  '.krrhhhrrk.',
  'krrrrrrrrrk',
  'krrdddddrrk',
  '.krrdddrrk.',
  '..krrdrrk..',
  '...krrrk...',
  '...kdkdk...',
  '....k.k....',
  '...........',
];

const HUNTER_PAL: PixelPalette = {
  k: INK,
  r: Palette.hunter,
  h: 0xffb0a4,
  e: 0xfff4e8,
  d: 0x8a1818,
};

/** 11×13 → 22×26. Diamond + pincers. */
const AMBUSHER = [
  '.....k.....',
  '....kok....',
  '...kohok...',
  '..kohhhok..',
  '.kkohahokk.',
  'kookakakook',
  '.kookakook.',
  '..kohhhok..',
  '...kohok...',
  '....kok....',
  '.....k.....',
  '...k...k...',
  '..k.....k..',
];

const AMBUSHER_PAL: PixelPalette = {
  k: INK,
  o: Palette.ambusher,
  h: 0xffd08a,
  a: 0xfff0c8,
};

/** 13×15 → 26×30. Slow armored slab, visor slit. */
const BULWARK = [
  '.....kkk.....',
  '....kmmmk....',
  '...kmmhmmk...',
  '..kmmhhhmmk..',
  '.kmmhvvvhmmk.',
  'kmmhhhhhhhmmk',
  'kmmdddddddmmk',
  'kmmddvvvddmmk',
  'kmmdddddddmmk',
  '.kmmdddddmmk.',
  '..kmmdddmmk..',
  '...kmmmmmk...',
  '....kmmmk....',
  '.....kkk.....',
  '.............',
];

const BULWARK_PAL: PixelPalette = {
  k: INK,
  m: Palette.bulwark,
  h: 0xe08a9a,
  d: 0x6a2838,
  v: 0xffc14a,
};

/** 14×16 → 28×32. Heavier Gate Bulwark — crest, warning chevrons, plate. */
const GATE_BULWARK = [
  '......kk......',
  '.....kmmk.....',
  '....kmgmgk....',
  '...kmmhhmmk...',
  '..kmmhhhhmmk..',
  '.kmmhvvvvhmmk.',
  'kmmhhhhhhhhmmk',
  'kwwddddddddwwk',
  'kmmddvvvvddmmk',
  'kmmddddddddmmk',
  'kmmddgddgddmmk',
  '.kmmddddddmmk.',
  '..kmmddddmmk..',
  '...kmmmmmmk...',
  '....kkkkkk....',
  '..............',
];

const GATE_BULWARK_PAL: PixelPalette = {
  k: INK,
  m: Palette.bulwark,
  h: 0xe08a9a,
  d: 0x5a1828,
  v: 0xffc14a,
  g: Palette.gate,
  w: 0xd07080,
};

/** 7×7 → 14×14. Tiny dart. */
const SWARMLING = [
  '...k...',
  '..kyk..',
  '.kyyyk.',
  'kyyhhyk',
  '.kytyk.',
  '..ktk..',
  '...k...',
];

const SWARMLING_PAL: PixelPalette = {
  k: INK,
  y: Palette.swarmling,
  h: 0xffe08a,
  t: 0xc87818,
};

/** 9×10 → 18×20. Crack through the core — dies into two. */
const SPLITTER = [
  '....k....',
  '...kok...',
  '..kohok..',
  '.kohyhok.',
  'kohykyhok',
  '.kohyhok.',
  '..kohok..',
  '...kok...',
  '....k....',
  '.........',
];

const SPLITTER_PAL: PixelPalette = {
  k: INK,
  o: Palette.splitter,
  h: 0xffc08a,
  y: Palette.swarmling,
};

/** 4×9 → 8×18. Cyan bolt, matches 8×14 hitbox with a little trail. */
const BOLT = [
  '.kk.',
  'kwwk',
  'keek',
  'kcek',
  'kcek',
  '.kk.',
  '.cc.',
  '..c.',
  '....',
];

const BOLT_PAL: PixelPalette = {
  k: INK,
  w: 0xffffff,
  e: Palette.sensorEye,
  c: Palette.bolt,
};

/** 8×8 → 16×16. Hollow diamond; inverted Swarm tell. */
const ECHO = [
  '...kk...',
  '..kppk..',
  '.kphhpk.',
  'kph..hpk',
  'kph..hpk',
  '.kphhpk.',
  '..kppk..',
  '...kk...',
];

const ECHO_PAL: PixelPalette = {
  k: INK,
  p: Palette.echo,
  h: 0xe8c8ff,
};

/** 11×12 → 22×24. Echo Prime — inner square core. */
const ECHO_PRIME = [
  '....kkk....',
  '...kpppk...',
  '..kphhhpk..',
  '.kphaaahpk.',
  'kphaaaaahpk',
  'kphaiaaahpk',
  'kphaaaaahpk',
  '.kphaaahpk.',
  '..kphhhpk..',
  '...kpppk...',
  '....kkk....',
  '...........',
];

const ECHO_PRIME_PAL: PixelPalette = {
  k: INK,
  p: Palette.echoPrime,
  h: 0xf0d8ff,
  a: Palette.anomaly,
  i: Palette.invert,
};

/** 4×9 → 8×18. Orange ward bolt. */
const WARD_BOLT = [
  '.kk.',
  'kwwk',
  'koak',
  'koak',
  'kook',
  '.kk.',
  '.oo.',
  '..o.',
  '....',
];

const WARD_PAL: PixelPalette = {
  k: INK,
  w: 0xfff4d0,
  a: 0xffc14a,
  o: Palette.ward,
};

/** 12×12 → 24×24. Dim launch pad. */
const POINT_A = [
  '............',
  '.....kk.....',
  '....kddk....',
  '...kdwwdk...',
  '..kdwccwdk..',
  '.kdwccccwdk.',
  '.kdwccccwdk.',
  '..kdwccwdk..',
  '...kdwwdk...',
  '....kddk....',
  '.....kk.....',
  '............',
];

const POINT_A_PAL: PixelPalette = {
  k: INK,
  d: 0x1a2838,
  w: 0x4a6078,
  c: Palette.hud,
};

/** 16×16 → 32×32. Bright B beacon. */
const POINT_B = [
  '......kkkk......',
  '.....kcccck.....',
  '....kcwwwwck....',
  '...kcwwyywwck...',
  '..kcwwyEEywwck..',
  '.kcwwyEEEEywwck.',
  'kcwwyEEEEEEEywwk',
  'kcwwyEEEEEEEywwk',
  '.kcwwyEEEEywwck.',
  '..kcwwyEEywwck..',
  '...kcwwyywwck...',
  '....kcwwwwck....',
  '.....kcccck.....',
  '......kkkk......',
  '................',
  '................',
];

const POINT_B_PAL: PixelPalette = {
  k: INK,
  c: 0x2a6880,
  w: Palette.pointB,
  y: 0xb8f4ff,
  E: 0xffffff,
};

/** 16×16 → 32×32. Gravity well mass. */
const WELL_CORE = [
  '......kkkk......',
  '....kkmmmkkk....',
  '...kmmrrrrrmk...',
  '..kmmrddddrmmk..',
  '.kmmrddkkddrmmk.',
  '.kmrddkkkkddrmk.',
  'kmmrdkkkkkkdrmmk',
  'kmrddkkkkkkddrmk',
  'kmrddkkkkkkddrmk',
  'kmmrdkkkkkkdrmmk',
  '.kmrddkkkkddrmk.',
  '.kmmrddkkddrmmk.',
  '..kmmrddddrmmk..',
  '...kmmrrrrrmk...',
  '....kkmmmkkk....',
  '......kkkk......',
];

const WELL_PAL: PixelPalette = {
  k: INK,
  m: Palette.wellRim,
  r: 0x8a3040,
  d: 0x1a0810,
};

/** 8×8 → 16×16 repeating steel. Horizontal bands read as pillars. */
const COVER_STEEL = [
  'hhhhhhhh',
  'hdbbbbDh',
  'hbccccbh',
  'hbcRRcbh',
  'hbccccbh',
  'hdbRbbdh',
  'hbbbbbbh',
  'hhhhhhhh',
];

const COVER_STEEL_PAL: PixelPalette = {
  h: Palette.coverEdge,
  d: 0x101820,
  D: 0x2a3848,
  b: Palette.cover,
  c: 0x243044,
  R: 0x6a849c,
};

/** Chipped debris — opaque rock with cracks and rivets (no see-through corners). */
const COVER_DEBRIS = [
  'hhhhhhhh',
  'hdbccbdh',
  'hbcccRbh',
  'hbcXccbh',
  'hbccRcbh',
  'hdbccbdh',
  'hbRbbbDh',
  'hhhhhhhh',
];

const COVER_DEBRIS_PAL: PixelPalette = {
  h: Palette.coverEdge,
  d: 0x0c1218,
  D: 0x2a3848,
  b: Palette.cover,
  c: 0x1e2a38,
  R: 0x5a7088,
  X: 0x0a0e14,
};

/** Anomaly rock — purple edge. */
const COVER_ANOMALY = [
  'hhhhhhhh',
  'hdbbbbDh',
  'hbccccbh',
  'hbcAAcbh',
  'hbccccbh',
  'hdbAbbdh',
  'hbbbbbbh',
  'hhhhhhhh',
];

const COVER_ANOMALY_PAL: PixelPalette = {
  h: Palette.anomaly,
  d: 0x12081c,
  D: 0x2a1840,
  b: 0x1a1028,
  c: 0x241838,
  A: 0x9a7cff,
};

/** Gate pillars — maroon warning stripe. */
const COVER_GATE = [
  'hhhhhhhh',
  'hdbGGbdh',
  'hbccccbh',
  'hbcGGcbh',
  'hbccccbh',
  'hdbGGbdh',
  'hbbbbbbh',
  'hhhhhhhh',
];

const COVER_GATE_PAL: PixelPalette = {
  h: Palette.gate,
  d: 0x14080c,
  b: 0x1c1014,
  c: 0x28141c,
  G: 0xc45a6a,
};

const POCKET_FLOOR = [
  'd.d.d.d.',
  '.p.d.p.d',
  'd.d.d.d.',
  '.d.p.d.p',
  'd.d.d.d.',
  '.p.d.p.d',
  'd.d.d.d.',
  '.d.p.d.p',
];

const POCKET_PAL: PixelPalette = {
  d: 0x080c12,
  p: 0x1a2430,
};

const ZONE_FLOOR = [
  '........',
  '...a....',
  '........',
  '........',
  '....a...',
  '........',
  '..a.....',
  '........',
];

const ZONE_PAL: PixelPalette = {
  a: Palette.longWay,
};

const ZONE_FLOOR_WARM = [
  '........',
  '...a....',
  '........',
  '........',
  '....a...',
  '........',
  '..a.....',
  '........',
];

const ZONE_WARM_PAL: PixelPalette = {
  a: Palette.shortcut,
};

const ZONE_FLOOR_ANOMALY = [
  '........',
  '...a....',
  '........',
  '........',
  '....a...',
  '........',
  '..a.....',
  '........',
];

const ZONE_ANOMALY_PAL: PixelPalette = {
  a: Palette.anomaly,
};

const ZONE_FLOOR_GATE = [
  '........',
  '...a....',
  '........',
  '........',
  '....a...',
  '........',
  '..a.....',
  '........',
];

const ZONE_GATE_PAL: PixelPalette = {
  a: Palette.gate,
};

const LANE = [
  'cc..cc..',
  '..cc..cc',
];

const LANE_PAL: PixelPalette = {
  c: Palette.pointB,
};

const LANE_ANOMALY_PAL: PixelPalette = {
  c: Palette.anomaly,
};

const LANE_GATE_PAL: PixelPalette = {
  c: Palette.gate,
};

/** 8×8 repeating sealed bulkhead. */
const GATE_WALL = [
  'hGmmGGmh',
  'hGmmGGmh',
  'hGrrGGrh',
  'hGmmGGmh',
  'hGmmGGmh',
  'hGrrGGrh',
  'hGmmGGmh',
  'hGmmGGmh',
];

const GATE_WALL_PAL: PixelPalette = {
  h: Palette.coverEdge,
  G: Palette.gate,
  m: 0x2a1418,
  r: 0xff8a5a,
};

/** Ghost frame after the wall opens. */
const GATE_WALL_OPEN = [
  'c......c',
  '........',
  '..c..c..',
  '........',
  'c......c',
  '........',
  '..c..c..',
  '........',
];

const GATE_OPEN_PAL: PixelPalette = {
  c: Palette.pointB,
};
