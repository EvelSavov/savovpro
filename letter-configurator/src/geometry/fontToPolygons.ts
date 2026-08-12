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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sampleQuadratic(
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  segments: number,
  out: Contour,
): void {
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
    const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
    out.push([x, y]);
  }
}

function sampleCubic(
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  p3: Vec2,
  segments: number,
  out: Contour,
): void {
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;
    const x =
      mt * mt * mt * p0[0] +
      3 * mt * mt * t * p1[0] +
      3 * mt * t * t * p2[0] +
      t * t * t * p3[0];
    const y =
      mt * mt * mt * p0[1] +
      3 * mt * mt * t * p1[1] +
      3 * mt * t * t * p2[1] +
      t * t * t * p3[1];
    out.push([x, y]);
  }
}

/** Convert opentype path commands into closed contours (font Y-down → Y-up). */
export function pathToContours(
  path: opentype.Path,
  curveSegments: number,
): Contour[] {
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
        sampleQuadratic(p0, p1, p2, curveSegments, tmp);
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
        sampleCubic(p0, p1, p2, p3, curveSegments, tmp);
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

/** Closest points + distance between two polygon outlines. */
function closestBetweenContours(
  a: Contour,
  b: Contour,
): { dist: number; pa: Vec2; pb: Vec2 } {
  let dist = Infinity;
  let pa: Vec2 = a[0];
  let pb: Vec2 = b[0];
  // Sample: for each vertex of A, closest on B edges; then swap
  const consider = (p: Vec2, c: Contour, fromA: boolean) => {
    for (let k = 0; k < c.length; k++) {
      const q = closestOnSegment(p, c[k], c[(k + 1) % c.length]);
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (d < dist) {
        dist = d;
        if (fromA) { pa = p; pb = q; } else { pa = q; pb = p; }
      }
    }
  };
  // Stride for long contours to keep this cheap
  const stepA = Math.max(1, Math.floor(a.length / 80));
  const stepB = Math.max(1, Math.floor(b.length / 80));
  for (let i = 0; i < a.length; i += stepA) consider(a[i], b, true);
  for (let i = 0; i < b.length; i += stepB) consider(b[i], a, false);
  return { dist, pa, pb };
}

/**
 * Find bridges for disconnected OUTER contours:
 *  - floating dots (i, j, й) → nearest large island
 *  - separate letters (e.g. capital D vs "alia") → nearest neighbor MST
 * Returns ONLY the bridge rectangles — caller applies them via union.
 *
 * Islands vs holes are classified by nesting (centroid inside a larger
 * contour), not by winding sign — font Y-flip inverts shoelace signs.
 */
export function findBridgeContours(
  contours: Contour[],
  bridgeThickness: number,
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

  // ── 1) Small islands (dots) → nearest large island ──────────────────
  for (let i = 0; i < contours.length; i++) {
    if (!isSmallOuter[i]) continue;
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

  // ── 2) Large islands (separate letters) → MST of near neighbors ─────
  // Connects e.g. capital "D" to script "alia" when the gap is modest.
  const largeIdx = contours.map((_, i) => i).filter((i) => isLargeOuter[i]);
  if (largeIdx.length >= 2) {
    // Max gap scales with letter size; thicker bridge → allow slightly larger gap
    const charScale = Math.sqrt(maxArea);
    const maxGap = Math.max(width * 14, charScale * 0.45);

    type Edge = { i: number; j: number; dist: number; pa: Vec2; pb: Vec2 };
    const edges: Edge[] = [];
    for (let a = 0; a < largeIdx.length; a++) {
      for (let b = a + 1; b < largeIdx.length; b++) {
        const ia = largeIdx[a];
        const ib = largeIdx[b];
        const { dist, pa, pb } = closestBetweenContours(contours[ia], contours[ib]);
        if (dist > width * 0.15 && dist <= maxGap) {
          edges.push({ i: ia, j: ib, dist, pa, pb });
        }
      }
    }
    edges.sort((e1, e2) => e1.dist - e2.dist);

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

void lerp;
