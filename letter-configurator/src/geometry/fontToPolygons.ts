import opentype from 'opentype.js';
import type { Contour, Vec2 } from '../types/geometry';

const fontCache = new Map<string, opentype.Font>();

export async function loadFont(url: string): Promise<opentype.Font> {
  const cached = fontCache.get(url);
  if (cached) return cached;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не мога да заредя шрифта: ${url}`);
  const buffer = await res.arrayBuffer();
  const font = opentype.parse(buffer);
  if (!font?.glyphs) {
    throw new Error('Невалиден font файл.');
  }
  fontCache.set(url, font);
  return font;
}

function lerp2(a: Vec2, b: Vec2, t: number): Vec2 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function distPointToSeg(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Subdivide a quadratic until the control point sits within maxErr of the chord. */
function sampleQuadratic(
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  maxErr: number,
  out: Contour,
  depth = 0,
): void {
  const err = distPointToSeg(p1, p0, p2);
  if (depth >= 8 || err <= maxErr) {
    out.push(p2);
    return;
  }
  const p01 = lerp2(p0, p1, 0.5);
  const p12 = lerp2(p1, p2, 0.5);
  const mid = lerp2(p01, p12, 0.5);
  sampleQuadratic(p0, p01, mid, maxErr, out, depth + 1);
  sampleQuadratic(mid, p12, p2, maxErr, out, depth + 1);
}

/** Subdivide a cubic until both control points sit within maxErr of the chord. */
function sampleCubic(
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  maxErr: number,
  out: Contour,
  depth = 0,
): void {
  const err = Math.max(distPointToSeg(p1, p0, p3), distPointToSeg(p2, p0, p3));
  if (depth >= 8 || err <= maxErr) {
    out.push(p3);
    return;
  }
  const p01 = lerp2(p0, p1, 0.5);
  const p12 = lerp2(p1, p2, 0.5);
  const p23 = lerp2(p2, p3, 0.5);
  const p012 = lerp2(p01, p12, 0.5);
  const p123 = lerp2(p12, p23, 0.5);
  const mid = lerp2(p012, p123, 0.5);
  sampleCubic(p0, p01, p012, mid, maxErr, out, depth + 1);
  sampleCubic(mid, p123, p23, p3, maxErr, out, depth + 1);
}

/** Convert opentype path commands into closed contours (font Y-down → Y-up). */
export function pathToContours(
  path: opentype.Path,
  curveSegments: number,
): Contour[] {
  // Paths are built at tempSize=1000, then scaled to mm. Treat curveSegments
  // as a quality knob: more segments → smaller allowed chord error.
  const maxErr = 80 / Math.max(curveSegments, 4);
  const contours: Contour[] = [];
  let current: Contour = [];
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;

  const pushPoint = (x: number, y: number) => {
    // Flip Y so typographic up becomes +Y in CAD space.
    current.push([x, -y]);
  };

  for (const cmd of path.commands) {
    switch (cmd.type) {
      case 'M': {
        if (current.length > 2) {
          closeContour(current);
          contours.push(current);
        }
        current = [];
        cx = cmd.x;
        cy = cmd.y;
        startX = cx;
        startY = cy;
        pushPoint(cx, cy);
        break;
      }
      case 'L': {
        cx = cmd.x;
        cy = cmd.y;
        pushPoint(cx, cy);
        break;
      }
      case 'Q': {
        const p0: Vec2 = [cx, cy];
        const p1: Vec2 = [cmd.x1, cmd.y1];
        const p2: Vec2 = [cmd.x, cmd.y];
        const tmp: Contour = [];
        sampleQuadratic(p0, p1, p2, maxErr, tmp);
        for (const [x, y] of tmp) pushPoint(x, y);
        cx = cmd.x;
        cy = cmd.y;
        break;
      }
      case 'C': {
        const p0: Vec2 = [cx, cy];
        const p1: Vec2 = [cmd.x1, cmd.y1];
        const p2: Vec2 = [cmd.x2, cmd.y2];
        const p3: Vec2 = [cmd.x, cmd.y];
        const tmp: Contour = [];
        sampleCubic(p0, p1, p2, p3, maxErr, tmp);
        for (const [x, y] of tmp) pushPoint(x, y);
        cx = cmd.x;
        cy = cmd.y;
        break;
      }
      case 'Z': {
        if (current.length > 2) {
          closeContour(current);
          contours.push(current);
        }
        current = [];
        cx = startX;
        cy = startY;
        break;
      }
      default:
        break;
    }
  }
  if (current.length > 2) {
    closeContour(current);
    contours.push(current);
  }
  return contours;
}

function closeContour(contour: Contour): void {
  const first = contour[0];
  const last = contour[contour.length - 1];
  if (Math.hypot(first[0] - last[0], first[1] - last[1]) > 1e-6) {
    contour.push([first[0], first[1]]);
  }
}

/** Signed area via shoelace — positive = CCW, negative = CW. */
function contourSignedArea(contour: Contour): number {
  let area = 0;
  const n = contour.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = contour[i];
    const [x1, y1] = contour[(i + 1) % n];
    area += x0 * y1 - x1 * y0;
  }
  return area / 2;
}

function centroid(contour: Contour): Vec2 {
  let cx = 0;
  let cy = 0;
  for (const [x, y] of contour) {
    cx += x;
    cy += y;
  }
  return [cx / contour.length, cy / contour.length];
}

function makeBridgeRect(a: Vec2, b: Vec2, width: number): Contour {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len < 0.01) return [];
  // Extend slightly past both ends so the union reliably overlaps both bodies
  const ux = dx / len;
  const uy = dy / len;
  const pad = Math.min(width * 0.75, len * 0.35);
  const a2: Vec2 = [a[0] - ux * pad, a[1] - uy * pad];
  const b2: Vec2 = [b[0] + ux * pad, b[1] + uy * pad];
  const nx = (-uy) * (width / 2);
  const ny = ux * (width / 2);
  return [
    [a2[0] + nx, a2[1] + ny],
    [a2[0] - nx, a2[1] - ny],
    [b2[0] - nx, b2[1] - ny],
    [b2[0] + nx, b2[1] + ny],
  ];
}

/** Ray-cast point-in-polygon (even-odd). */
function pointInContour(pt: Vec2, contour: Contour): boolean {
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = contour.length - 1; i < contour.length; j = i++) {
    const [xi, yi] = contour[i];
    const [xj, yj] = contour[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-30) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * A contour is a hole if its centroid lies inside a larger-area contour.
 * This is robust after the font Y-flip, which inverts winding signs so
 * `signedArea > 0` no longer reliably means "outer island".
 */
function isHoleContour(index: number, contours: Contour[], absAreas: number[]): boolean {
  const c = centroid(contours[index]);
  const area = absAreas[index];
  for (let j = 0; j < contours.length; j++) {
    if (j === index || absAreas[j] <= area) continue;
    if (pointInContour(c, contours[j])) return true;
  }
  return false;
}

/** Closest point on segment AB to P. */
function closestOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const len2 = abx * abx + aby * aby;
  if (len2 < 1e-12) return a;
  let t = ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  return [a[0] + abx * t, a[1] + aby * t];
}

/** Distance between two segments; 0 with the crossing point when they intersect. */
function segmentDistance(
  p1: Vec2,
  p2: Vec2,
  q1: Vec2,
  q2: Vec2,
): { dist: number; pa: Vec2; pb: Vec2 } {
  const d1x = p2[0] - p1[0];
  const d1y = p2[1] - p1[1];
  const d2x = q2[0] - q1[0];
  const d2y = q2[1] - q1[1];
  const denom = d1x * d2y - d1y * d2x;

  if (Math.abs(denom) > 1e-12) {
    const sx = q1[0] - p1[0];
    const sy = q1[1] - p1[1];
    const t = (sx * d2y - sy * d2x) / denom;
    const u = (sx * d1y - sy * d1x) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      const hit: Vec2 = [p1[0] + d1x * t, p1[1] + d1y * t];
      return { dist: 0, pa: hit, pb: hit };
    }
  }

  let dist = Infinity;
  let pa: Vec2 = p1;
  let pb: Vec2 = q1;
  const check = (from: Vec2, s1: Vec2, s2: Vec2, fromA: boolean) => {
    const q = closestOnSegment(from, s1, s2);
    const d = Math.hypot(q[0] - from[0], q[1] - from[1]);
    if (d < dist) {
      dist = d;
      if (fromA) { pa = from; pb = q; } else { pa = q; pb = from; }
    }
  };
  check(p1, q1, q2, true);
  check(p2, q1, q2, true);
  check(q1, p1, p2, false);
  check(q2, p1, p2, false);
  return { dist, pa, pb };
}

/**
 * Closest points + distance between two polygon outlines.
 *
 * Two passes: a strided sweep locates the closest segment pair, then a
 * stride-free sweep of that neighbourhood refines it. A single strided pass
 * badly overestimates the gap between overlapping script glyphs, which used to
 * produce long diagonal bars between letters that already touch.
 */
function closestBetweenContours(
  a: Contour,
  b: Contour,
): { dist: number; pa: Vec2; pb: Vec2 } {
  const na = a.length;
  const nb = b.length;
  const stepA = Math.max(1, Math.floor(na / 160));
  const stepB = Math.max(1, Math.floor(nb / 160));

  let best = { dist: Infinity, pa: a[0], pb: b[0] };
  let bestIa = 0;
  let bestIb = 0;

  for (let i = 0; i < na; i += stepA) {
    const a1 = a[i];
    const a2 = a[(i + 1) % na];
    for (let j = 0; j < nb; j += stepB) {
      const r = segmentDistance(a1, a2, b[j], b[(j + 1) % nb]);
      if (r.dist < best.dist) {
        best = r;
        bestIa = i;
        bestIb = j;
      }
      if (best.dist === 0) return best;
    }
  }

  if (stepA === 1 && stepB === 1) return best;

  for (let di = -stepA; di <= stepA; di++) {
    const i = ((bestIa + di) % na + na) % na;
    const a1 = a[i];
    const a2 = a[(i + 1) % na];
    for (let dj = -stepB; dj <= stepB; dj++) {
      const j = ((bestIb + dj) % nb + nb) % nb;
      const r = segmentDistance(a1, a2, b[j], b[(j + 1) % nb]);
      if (r.dist < best.dist) best = r;
      if (best.dist === 0) return best;
    }
  }

  return best;
}

function contourHeight(c: Contour): number {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of c) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return maxY - minY;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Find bridges for disconnected OUTER contours:
 *  - floating dots (i, j, й) → nearest large island
 *  - separate letters only when there is a real gap (e.g. capital D vs "alia")
 *    Script letters that already overlap or nearly touch are left alone.
 * Returns ONLY the bridge rectangles — caller applies them via union.
 *
 * `isAnchored` reports islands that sit on the solid body of the big letter.
 * The letter already holds those, so they count as one component and never get
 * a bar — neither between themselves nor to a dot resting on the letter.
 *
 * Islands vs holes are classified by nesting (centroid inside a larger
 * contour), not by winding sign — font Y-flip inverts shoelace signs.
 */
export function findBridgeContours(
  contours: Contour[],
  bridgeThickness: number,
  isAnchored?: (contour: Contour) => boolean,
): Contour[] {
  if (contours.length <= 1) return [];

  const absAreas = contours.map((c) => Math.abs(contourSignedArea(c)));
  const maxArea = Math.max(...absAreas);
  if (maxArea < 1e-8) return [];
  // Dots are tiny vs a capital / full script run — keep threshold generous
  const threshold = maxArea * 0.12;

  const hole = contours.map((_, i) => isHoleContour(i, contours, absAreas));
  const isSmallOuter = absAreas.map((a, i) => !hole[i] && a < threshold);
  const isLargeOuter = absAreas.map((a, i) => !hole[i] && a >= threshold);

  // If nothing qualifies as "large" (all islands under threshold), use the
  // biggest non-hole contour as the bridge anchor.
  if (!isLargeOuter.some(Boolean)) {
    let best = -1;
    let bestA = -1;
    for (let i = 0; i < contours.length; i++) {
      if (hole[i]) continue;
      if (absAreas[i] > bestA) { bestA = absAreas[i]; best = i; }
    }
    if (best >= 0) isLargeOuter[best] = true;
    if (best >= 0) isSmallOuter[best] = false;
  }

  const width = Math.max(bridgeThickness, 0.5);
  const bridges: Contour[] = [];

  // Islands resting on the big letter are held by it — no bar needed.
  const anchored = contours.map((c, i) =>
    !hole[i] && !!isAnchored && isAnchored(c),
  );

  // ── 1) Small islands (dots) → nearest large island ──────────────────
  for (let i = 0; i < contours.length; i++) {
    if (!isSmallOuter[i] || anchored[i]) continue;
    const sc = contours[i];
    const scCenter = centroid(sc);

    let bestDist = Infinity;
    let bestPt: Vec2 = [0, 0];
    for (let j = 0; j < contours.length; j++) {
      if (!isLargeOuter[j]) continue;
      const lc = contours[j];
      for (let k = 0; k < lc.length; k++) {
        const a = lc[k];
        const b = lc[(k + 1) % lc.length];
        const pt = closestOnSegment(scCenter, a, b);
        const d = Math.hypot(pt[0] - scCenter[0], pt[1] - scCenter[1]);
        if (d < bestDist) { bestDist = d; bestPt = pt; }
      }
    }
    if (bestDist === Infinity || bestDist < width * 0.15) continue;

    let scBest: Vec2 = scCenter;
    let scBestDist = Infinity;
    for (let k = 0; k < sc.length; k++) {
      const a = sc[k];
      const b = sc[(k + 1) % sc.length];
      const pt = closestOnSegment(bestPt, a, b);
      const d = Math.hypot(pt[0] - bestPt[0], pt[1] - bestPt[1]);
      if (d < scBestDist) { scBestDist = d; scBest = pt; }
    }

    const bridge = makeBridgeRect(scBest, bestPt, width);
    if (bridge.length >= 3) bridges.push(bridge);
  }

  // ── 2) Large islands — only a real hole, not script micro-gaps ──────
  // Script "lia" often has 0.3–3 mm gaps at the stems; those already look
  // connected and must not get a visible bar. Capital "D" + "alia" has a
  // genuine hole (several mm) and should still get one MST bar.
  const largeIdx = contours.map((_, i) => i).filter((i) => isLargeOuter[i]);
  if (largeIdx.length >= 2) {
    const letterH = median(largeIdx.map((i) => contourHeight(contours[i])));
    // Glyphs that overlap measure 0 and glyphs that graze measure a few tenths
    // of a mm — both already print as one piece, so they get no bar.
    const touchGap = Math.max(width * 0.5, 0.3);
    const maxGap = Math.max(width * 16, letterH * 0.7);

    // Union-Find — only bridge when components are still separate
    const parent = new Map<number, number>();
    const find = (x: number): number => {
      let p = parent.get(x) ?? x;
      if (p !== x) { p = find(p); parent.set(x, p); }
      return p;
    };
    const unite = (x: number, y: number): boolean => {
      const rx = find(x);
      const ry = find(y);
      if (rx === ry) return false;
      parent.set(rx, ry);
      return true;
    };
    for (const id of largeIdx) parent.set(id, id);

    // Virtual node for the big letter: everything sitting on it is one piece,
    // so two anchored glyphs never need a bar between them.
    const LETTER_NODE = -1;
    parent.set(LETTER_NODE, LETTER_NODE);
    for (const id of largeIdx) {
      if (anchored[id]) unite(id, LETTER_NODE);
    }

    type Edge = { i: number; j: number; dist: number; pa: Vec2; pb: Vec2 };
    const edges: Edge[] = [];
    for (let a = 0; a < largeIdx.length; a++) {
      for (let b = a + 1; b < largeIdx.length; b++) {
        const ia = largeIdx[a];
        const ib = largeIdx[b];
        if (find(ia) === find(ib)) continue;
        const { dist, pa, pb } = closestBetweenContours(contours[ia], contours[ib]);
        if (dist <= touchGap) {
          // Already one solid piece — merging the components here stops a long
          // bar being drawn later across glyphs that only look disconnected.
          unite(ia, ib);
        } else if (dist <= maxGap) {
          edges.push({ i: ia, j: ib, dist, pa, pb });
        }
      }
    }
    edges.sort((e1, e2) => e1.dist - e2.dist);

    for (const e of edges) {
      if (!unite(e.i, e.j)) continue;
      const bridge = makeBridgeRect(e.pa, e.pb, width);
      if (bridge.length >= 3) bridges.push(bridge);
    }
  }

  return bridges;
}

function contourBounds(contours: Contour[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of contours) {
    for (const [x, y] of c) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY };
}

export interface TextContourOptions {
  /** Target height in mm */
  height: number;
  fontUrl: string;
  curveSegments: number;
  /** If set, shrink uniformly so width does not exceed this (mm) */
  maxWidth?: number;
  offsetX?: number;
  offsetY?: number;
}

/**
 * Convert text to polygon contours scaled to `height` mm, centered on XY.
 * Supports multi-character names and disconnected dots (i, j, й).
 */
export async function textToContours(
  text: string,
  options: TextContourOptions,
): Promise<{ contours: Contour[]; width: number; height: number }> {
  const raw = (text || '').trim();
  if (!raw) return { contours: [], width: 0, height: 0 };

  const font = await loadFont(options.fontUrl);
  const tempSize = 1000;
  const path = font.getPath(raw, 0, 0, tempSize);
  let contours = pathToContours(path, options.curveSegments);
  if (!contours.length) {
    throw new Error(`Няма контури за „${raw}“. Опитайте друг шрифт.`);
  }

  const b = contourBounds(contours);
  const h = b.maxY - b.minY;
  const w = b.maxX - b.minX;
  if (h < 1e-6) throw new Error('Невалидна височина на текста.');

  let scale = options.height / h;
  let width = w * scale;
  if (options.maxWidth && width > options.maxWidth) {
    scale *= options.maxWidth / width;
    width = options.maxWidth;
  }

  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  const ox = options.offsetX ?? 0;
  const oy = options.offsetY ?? 0;

  contours = contours
    .map((contour) =>
      contour.map(
        ([x, y]): Vec2 => [(x - cx) * scale + ox, (y - cy) * scale + oy],
      ),
    )
    .filter((c) => c.length >= 3);

  return {
    contours,
    width: +width.toFixed(2),
    height: +(h * scale).toFixed(2),
  };
}

/** Single letter helper. */
export async function letterToContours(
  letter: string,
  letterHeight: number,
  fontUrl: string,
  curveSegments: number,
): Promise<Contour[]> {
  const ch = (letter || 'D').slice(0, 1);
  const { contours } = await textToContours(ch, {
    height: letterHeight,
    fontUrl,
    curveSegments,
  });
  if (!contours.length) {
    throw new Error(`Няма контури за буквата „${ch}“. Опитайте друг шрифт.`);
  }
  return contours;
}
