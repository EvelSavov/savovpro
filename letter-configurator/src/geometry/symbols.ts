/**
 * Symbol generators for the 3D name sign configurator.
 *
 * All SVG paths are in a normalised coordinate space (roughly 0-100 viewBox,
 * Y-down as in SVG). `parseSvgPath` flips Y so they end up in CAD Y-up space.
 * `scaleToSize` then centres and scales to the requested mm size.
 *
 * Each generator returns an array of contours.  Positive-area (CCW) contours
 * are filled regions; negative-area (CW) contours are holes.
 *
 * IMPORTANT: generateNameSign.ts builds a separate CrossSection for every
 * SymbolGroup and unions them, so holes in one symbol never bleed into another.
 */
import type { Contour, Vec2 } from '../types/geometry';
import { parseSvgPath, scaleToSize } from './svgParser';

// ── Math helpers ──────────────────────────────────────────────────────────────

function circlePts(cx: number, cy: number, r: number, n: number): Contour {
  const pts: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}


function scaleContours(contours: Contour[], size: number): Contour[] {
  return scaleToSize(contours, size);
}

// ── Symbols ───────────────────────────────────────────────────────────────────

/** 5-pointed star */
export function starContours(size: number, points = 5, innerRatio = 0.42): Contour[] {
  const verts: Vec2[] = [];
  for (let i = 0; i < points * 2; i++) {
    // Start at top (π/2) and go CCW → first outer point faces upward
    const a = Math.PI / 2 - (i * Math.PI / points);
    const r = i % 2 === 0 ? 1 : innerRatio;
    verts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return scaleContours([verts], size);
}

/** Heart (parametric) */
export function heartContours(size: number, segments = 80): Contour[] {
  const verts: Vec2[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * 2 * Math.PI;
    verts.push([
      16 * Math.pow(Math.sin(t), 3),
      13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t),
    ]);
  }
  return scaleContours([verts], size);
}

/**
 * Cloud — single continuous bezier path with 3 bumps.
 * Drawn as one closed shape (no separate circle union needed).
 */
export function cloudContours(size: number): Contour[] {
  // SVG path, Y-down, viewBox ~0-120
  const d = `
    M 22 80
    C 8 80 0 70 0 58
    C 0 48 7 40 17 38
    C 16 34 16 30 18 27
    C 22 18 33 14 43 18
    C 48 10 57 5 68 5
    C 84 5 97 18 97 34
    C 107 35 115 44 115 55
    C 115 68 106 77 95 78
    L 22 80 Z
  `;
  return scaleContours(parseSvgPath(d, 16), size);
}

/** Sun: central disc + 8 triangular rays — rays start from centre so they overlap the disc, no gap. */
export function sunContours(size: number, rays = 8, n = 36): Contour[] {
  const coreR = 0.40, rayEnd = 1.0, rayW = 0.11;
  const contours: Contour[] = [circlePts(0, 0, coreR, n)];
  for (let i = 0; i < rays; i++) {
    const a = Math.PI / 2 - (i / rays) * 2 * Math.PI; // start at top, CCW
    const bx = Math.cos(a) * rayEnd;
    const by = Math.sin(a) * rayEnd;
    const px = Math.cos(a + Math.PI / 2) * rayW;
    const py = Math.sin(a + Math.PI / 2) * rayW;
    // Ray triangle starting from origin → fully overlaps circle → connected when unioned
    contours.push([[px, py], [bx, by], [-px, -py]]);
  }
  return scaleContours(contours, size);
}

/**
 * Crescent moon — drawn as a single closed SVG path (outer arc + inner concave arc).
 * No two-circle subtraction, so there's no "two moons" artifact.
 * Convex (bright) side faces left; concave (shadow) side faces right.
 */
export function moonContours(size: number): Contour[] {
  const d = `
    M 50 5
    C 10 5 5 28 5 55
    C 5 82 10 105 50 105
    C 65 100 78 84 78 55
    C 78 26 65 10 50 5 Z
  `;
  return scaleContours(parseSvgPath(d, 18), size);
}

/**
 * Diamond (♦ gem shape) — classic kite with flat top edge and sharp bottom point.
 * Top crown: two diagonal edges meeting at a flat girdle.
 * Bottom pavilion: two edges tapering to the culet point.
 */
export function diamondContours(size: number): Contour[] {
  const d = `
    M 50 0
    L 100 38
    L 50 100
    L 0 38 Z
  `;
  return scaleContours(parseSvgPath(d), size);
}

/** 6-petal flower */
export function flowerContours(size: number, n = 48): Contour[] {
  const d = 0.55, pr = 0.42, cr = 0.28;
  const c: Contour[] = [circlePts(0,0,cr,n)];
  for (let i = 0; i < 6; i++) {
    const a = (i/6)*2*Math.PI;
    c.push(circlePts(Math.cos(a)*d, Math.sin(a)*d, pr, n));
  }
  return scaleContours(c, size);
}

/**
 * Lightning bolt ⚡ — wide zig-zag with a clear notch at the waist.
 * Upper section goes upper-right → lower-left; lower section mirrors it.
 */
export function boltContours(size: number): Contour[] {
  const d = `
    M 72 3
    L 22 55
    L 54 55
    L 28 97
    L 78 45
    L 46 45 Z
  `;
  return scaleContours(parseSvgPath(d), size);
}

/**
 * Hot air balloon — classic striped silhouette.
 * Envelope: teardrop, CW in SVG Y-down → CCW in Y-up → filled (+1).
 * Stripe holes: CCW in SVG Y-down (Down→Right→Up→Left) → CW in Y-up (−1)
 *   → overlaps envelope's +1 → winding 0 → empty (hole).
 * Ropes + basket: NonZero fill rule fills any nonzero winding, so direction
 *   doesn't matter for parts that don't overlap the envelope.
 */
export function hotAirBalloonContours(size: number): Contour[] {
  // Teardrop envelope
  const envelope = `
    M 60 5
    C 92 5 116 28 116 60
    C 116 90 96 110 72 113
    L 48 113
    C 24 110 4 90 4 60
    C 4 28 28 5 60 5 Z
  `;
  // Three vertical stripe holes (Down→Right→Up→Left = CCW in SVG Y-down = holes)
  const stripe1 = `M 30 18 L 30 106 L 42 106 L 42 18 Z`;
  const stripe2 = `M 54 12 L 54 108 L 66 108 L 66 12 Z`;
  const stripe3 = `M 78 18 L 78 106 L 90 106 L 90 18 Z`;
  // Ropes: trapezoids spreading from balloon neck to basket corners
  const ropeL = `M 40 113 L 26 132 L 40 132 L 50 113 Z`;
  const ropeR = `M 70 113 L 80 132 L 94 132 L 80 113 Z`;
  // Basket
  const basket = `M 22 132 L 98 132 L 98 155 L 22 155 Z`;

  return scaleContours([
    ...parseSvgPath(envelope, 18),
    ...parseSvgPath(stripe1),
    ...parseSvgPath(stripe2),
    ...parseSvgPath(stripe3),
    ...parseSvgPath(ropeL),
    ...parseSvgPath(ropeR),
    ...parseSvgPath(basket),
  ], size);
}

/**
 * Round party balloon — clean circle, small triangular knot,
 * curly S-shaped ribbon string (like classic balloon clip art).
 */
export function balloonContours(size: number): Contour[] {
  // Round balloon body
  const balloon = `
    M 60 8
    C 88 8 108 30 108 57
    C 108 84 88 103 60 103
    C 32 103 12 84 12 57
    C 12 30 32 8 60 8 Z
  `;
  // Knot: small triangle at the tie point
  const knot = `M 60 103 L 48 118 L 72 118 Z`;
  // Curly string: thin S-shaped ribbon (~8 units wide)
  const string = `
    M 56 122
    C 36 136 78 152 56 170
    C 34 188 58 202 56 214
    L 64 214
    C 66 200 42 186 64 168
    C 86 150 44 134 68 120
    L 64 122 Z
  `;
  return scaleContours([
    ...parseSvgPath(balloon, 16),
    ...parseSvgPath(knot),
    ...parseSvgPath(string, 12),
  ], size);
}

/**
 * Teddy bear face — three clearly separate circles (head + two ears) + snout.
 * No inner-ear holes; clean, bold silhouette that reads well at small 3D sizes.
 */
export function bearContours(size: number): Contour[] {
  // Head: large circle, centred lower so ears stick out above
  const head = `
    M 106 68
    C 106 93 86 114 60 114
    C 34 114 14 93 14 68
    C 14 43 34 22 60 22
    C 86 22 106 43 106 68 Z
  `;
  // Left ear: circle clearly above/left of head
  const earL = `
    M 44 26
    C 44 38 34 48 22 48
    C 10 48 0 38 0 26
    C 0 14 10 4 22 4
    C 34 4 44 14 44 26 Z
  `;
  // Right ear: symmetric
  const earR = `
    M 120 26
    C 120 38 110 48 98 48
    C 86 48 76 38 76 26
    C 76 14 86 4 98 4
    C 110 4 120 14 120 26 Z
  `;
  // Snout: wide horizontal oval at bottom of face
  const snout = `
    M 84 90
    C 84 102 74 112 60 112
    C 46 112 36 102 36 90
    C 36 78 46 68 60 68
    C 74 68 84 78 84 90 Z
  `;
  return scaleContours([
    ...parseSvgPath(head, 16),
    ...parseSvgPath(earL, 14),
    ...parseSvgPath(earR, 14),
    ...parseSvgPath(snout, 14),
  ], size);
}

/**
 * Butterfly — two large upper wings, two smaller lower wings, thin body.
 * Wings are proper curved teardrop/fan shapes, not circles.
 * Body centred at (80, 70) in a ~160×140 viewBox.
 */
export function butterflyContours(size: number): Contour[] {
  // Upper left wing: fans up and to the left, meets body at centre-right
  const wUL = `
    M 76 65
    C 65 48 36 18 18 30
    C 6 40 10 68 24 80
    C 38 90 58 84 76 72 Z
  `;
  // Upper right wing: mirror
  const wUR = `
    M 84 65
    C 95 48 124 18 142 30
    C 154 40 150 68 136 80
    C 122 90 102 84 84 72 Z
  `;
  // Lower left wing: smaller, rounder lobe
  const wLL = `
    M 76 72
    C 60 82 32 90 20 108
    C 12 122 26 138 46 132
    C 62 126 74 106 76 88 Z
  `;
  // Lower right wing: mirror
  const wLR = `
    M 84 72
    C 86 106 98 126 114 132
    C 134 138 148 122 140 108
    C 128 90 100 82 84 72 Z
  `;
  // Body: narrow vertical oval
  const body = `
    M 80 38
    C 85 38 88 52 88 70
    C 88 90 85 106 80 106
    C 75 106 72 90 72 70
    C 72 52 75 38 80 38 Z
  `;
  return scaleContours([
    ...parseSvgPath(wUL, 16),
    ...parseSvgPath(wUR, 16),
    ...parseSvgPath(wLL, 14),
    ...parseSvgPath(wLR, 14),
    ...parseSvgPath(body, 14),
  ], size);
}

/**
 * Rainbow — 4 concentric arc bands.
 */
export function rainbowContours(size: number, n = 32): Contour[] {
  const radii = [1.0, 0.78, 0.56, 0.34];
  const thickness = 0.19;
  const arcs: Contour[] = [];
  for (const r of radii) {
    const band: Vec2[] = [];
    for (let i = 0; i <= n; i++) {
      const a = Math.PI - (i/n)*Math.PI;
      band.push([Math.cos(a)*r, Math.sin(a)*r]);
    }
    const ri = r - thickness;
    if (ri > 0.05) {
      for (let i = 0; i <= n; i++) {
        const a = (i/n)*Math.PI;
        band.push([Math.cos(a)*ri, Math.sin(a)*ri]);
      }
    } else {
      band.push([0, 0]);
    }
    arcs.push(band);
  }
  return scaleContours(arcs, size);
}

/**
 * Car — side-profile silhouette: cabin + chassis body, two round wheels.
 */
export function carContours(size: number): Contour[] {
  // Body: sloped windshield, flat roof, sloped rear window, chassis
  const body = `
    M 18 70
    C 18 62 24 56 32 56
    L 52 32
    L 90 28
    L 112 44
    L 134 56
    C 142 56 148 62 148 70
    L 148 80
    L 18 80 Z
  `;
  // Front wheel
  const wheelF = `
    M 68 80
    C 68 91 59 100 48 100
    C 37 100 28 91 28 80
    C 28 69 37 60 48 60
    C 59 60 68 69 68 80 Z
  `;
  // Rear wheel
  const wheelR = `
    M 138 80
    C 138 91 129 100 118 100
    C 107 100 98 91 98 80
    C 98 69 107 60 118 60
    C 129 60 138 69 138 80 Z
  `;
  return scaleContours([
    ...parseSvgPath(body, 14),
    ...parseSvgPath(wheelF, 16),
    ...parseSvgPath(wheelR, 16),
  ], size);
}

// ── Catalogue ─────────────────────────────────────────────────────────────────

export interface SymbolDef {
  id: string;
  emoji: string;
  labelBg: string;
  generate: (size: number) => Contour[];
  /** If set, this symbol uses a real 3D STL model (path relative to BASE_URL). */
  modelPath?: string;
}

export const SYMBOLS: SymbolDef[] = [
  { id: 'star',          emoji: '⭐',  labelBg: 'Звезда',   generate: starContours, modelPath: 'models/star.stl' },
  { id: 'heart',         emoji: '❤️',  labelBg: 'Сърце',    generate: heartContours, modelPath: 'models/heart.stl' },
  { id: 'cloud',         emoji: '☁️',  labelBg: 'Облак',    generate: cloudContours, modelPath: 'models/cloud.stl' },
  { id: 'sun',           emoji: '☀️',  labelBg: 'Слънце',   generate: sunContours, modelPath: 'models/sun.stl' },
  { id: 'moon',          emoji: '🌙',  labelBg: 'Луна',     generate: moonContours, modelPath: 'models/moon.stl' },
  { id: 'diamond',       emoji: '💎',  labelBg: 'Диамант',  generate: diamondContours, modelPath: 'models/diamond_v7.stl' },
  { id: 'flower',        emoji: '🌸',  labelBg: 'Цвете',    generate: flowerContours, modelPath: 'models/flower.stl' },
  { id: 'bolt',          emoji: '⚡',  labelBg: 'Мълния',   generate: boltContours, modelPath: 'models/bolt_v4.stl' },
  { id: 'hotAirBalloon', emoji: '🎈',  labelBg: 'Балон',    generate: hotAirBalloonContours, modelPath: 'models/hot_air_balloon.stl' },
  { id: 'balloon',       emoji: '🫧',  labelBg: 'Балонче',  generate: balloonContours, modelPath: 'models/party_balloon_v2.stl' },
  { id: 'bear',          emoji: '🐻',  labelBg: 'Мечо',     generate: bearContours, modelPath: 'models/bear.stl' },
  { id: 'butterfly',     emoji: '🦋',  labelBg: 'Пеперуда', generate: butterflyContours, modelPath: 'models/butterfly.stl' },
  { id: 'car',           emoji: '🚗',  labelBg: 'Кола',     generate: carContours, modelPath: 'models/car_v3.stl' },
];
