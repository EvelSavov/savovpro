import type { Contour, Vec2 } from '../types/geometry';

type Pt = [number, number];

/** Tokenise an SVG path `d` attribute into command letters and number strings. */
function tokenize(d: string): string[] {
  return d.match(/[MmLlHhVvCcSsQqTtZz]|[-+]?(?:\d*\.?\d+|\d+)(?:[eE][-+]?\d+)?/g) ?? [];
}

function sampleCubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n: number, out: Pt[]): void {
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const m = 1 - t;
    out.push([
      m*m*m*p0[0] + 3*m*m*t*p1[0] + 3*m*t*t*p2[0] + t*t*t*p3[0],
      m*m*m*p0[1] + 3*m*m*t*p1[1] + 3*m*t*t*p2[1] + t*t*t*p3[1],
    ]);
  }
}

function sampleQuad(p0: Pt, p1: Pt, p2: Pt, n: number, out: Pt[]): void {
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const m = 1 - t;
    out.push([
      m*m*p0[0] + 2*m*t*p1[0] + t*t*p2[0],
      m*m*p0[1] + 2*m*t*p1[1] + t*t*p2[1],
    ]);
  }
}

/**
 * Parse an SVG path `d` string into polygon contours.
 * Supports: M m L l H h V v C c S s Q q T t Z z
 * Y is flipped (SVG Y-down → CAD Y-up) so winding matches the font pipeline.
 *
 * @param curveSegments  Bezier subdivision steps (higher = smoother, default 16)
 */
export function parseSvgPath(d: string, curveSegments = 16): Contour[] {
  const tokens = tokenize(d);
  const contours: Contour[] = [];
  let pts: Pt[] = [];
  let cx = 0, cy = 0, sx = 0, sy = 0;
  let prevCp: Pt | null = null;

  let i = 0;
  let cmd = 'M';

  const num = (): number => (i < tokens.length ? parseFloat(tokens[i++]) : 0);

  const pushPt  = (x: number, y: number) => { pts.push([x, y]); cx = x; cy = y; };
  const close   = () => {
    if (pts.length > 2) { pts.push([sx, sy]); contours.push(pts); }
    pts = []; cx = sx; cy = sy; prevCp = null;
  };

  while (i < tokens.length) {
    const tok = tokens[i];
    if (/[MmLlHhVvCcSsQqTtZz]/.test(tok)) { cmd = tok; i++; }

    if (cmd === 'Z' || cmd === 'z') { close(); continue; }

    switch (cmd) {
      case 'M': { const x = num(), y = num(); if (pts.length > 2) { pts.push([sx,sy]); contours.push(pts); } pts = [[x,y]]; cx=x; cy=y; sx=x; sy=y; cmd='L'; prevCp=null; break; }
      case 'm': { const x = cx+num(), y = cy+num(); if (pts.length > 2) { pts.push([sx,sy]); contours.push(pts); } pts = [[x,y]]; cx=x; cy=y; sx=x; sy=y; cmd='l'; prevCp=null; break; }
      case 'L': { pushPt(num(), num()); prevCp=null; break; }
      case 'l': { pushPt(cx+num(), cy+num()); prevCp=null; break; }
      case 'H': { pushPt(num(), cy); prevCp=null; break; }
      case 'h': { pushPt(cx+num(), cy); prevCp=null; break; }
      case 'V': { pushPt(cx, num()); prevCp=null; break; }
      case 'v': { pushPt(cx, cy+num()); prevCp=null; break; }
      case 'C': {
        const x1=num(),y1=num(),x2=num(),y2=num(),x=num(),y=num();
        sampleCubic([cx,cy],[x1,y1],[x2,y2],[x,y],curveSegments,pts);
        prevCp=[x2,y2]; cx=x; cy=y; break;
      }
      case 'c': {
        const x1=cx+num(),y1=cy+num(),x2=cx+num(),y2=cy+num(),x=cx+num(),y=cy+num();
        sampleCubic([cx,cy],[x1,y1],[x2,y2],[x,y],curveSegments,pts);
        prevCp=[x2,y2]; cx=x; cy=y; break;
      }
      case 'S': {
        const rpx = prevCp ? 2*cx-prevCp[0] : cx;
        const rpy = prevCp ? 2*cy-prevCp[1] : cy;
        const x2=num(),y2=num(),x=num(),y=num();
        sampleCubic([cx,cy],[rpx,rpy],[x2,y2],[x,y],curveSegments,pts);
        prevCp=[x2,y2]; cx=x; cy=y; break;
      }
      case 's': {
        const rpx = prevCp ? 2*cx-prevCp[0] : cx;
        const rpy = prevCp ? 2*cy-prevCp[1] : cy;
        const x2=cx+num(),y2=cy+num(),x=cx+num(),y=cy+num();
        sampleCubic([cx,cy],[rpx,rpy],[x2,y2],[x,y],curveSegments,pts);
        prevCp=[x2,y2]; cx=x; cy=y; break;
      }
      case 'Q': {
        const x1=num(),y1=num(),x=num(),y=num();
        sampleQuad([cx,cy],[x1,y1],[x,y],curveSegments,pts);
        prevCp=[x1,y1]; cx=x; cy=y; break;
      }
      case 'q': {
        const x1=cx+num(),y1=cy+num(),x=cx+num(),y=cy+num();
        sampleQuad([cx,cy],[x1,y1],[x,y],curveSegments,pts);
        prevCp=[x1,y1]; cx=x; cy=y; break;
      }
      case 'T': {
        const tx1: number = prevCp ? 2*cx-prevCp[0] : cx;
        const ty1: number = prevCp ? 2*cy-prevCp[1] : cy;
        const tx=num(),ty=num();
        sampleQuad([cx,cy],[tx1,ty1],[tx,ty],curveSegments,pts);
        prevCp=[tx1,ty1]; cx=tx; cy=ty; break;
      }
      case 't': {
        const tx1: number = prevCp ? 2*cx-prevCp[0] : cx;
        const ty1: number = prevCp ? 2*cy-prevCp[1] : cy;
        const tx=cx+num(),ty=cy+num();
        sampleQuad([cx,cy],[tx1,ty1],[tx,ty],curveSegments,pts);
        prevCp=[tx1,ty1]; cx=tx; cy=ty; break;
      }
      default: i++; break;
    }
  }
  if (pts.length > 2) contours.push(pts);

  // Flip Y: SVG Y-down → CAD Y-up (same convention as fontToPolygons)
  return contours.map(c => c.map(([x, y]): Vec2 => [x, -y]));
}

/** Scale + center contours to fit in `size` mm. */
export function scaleToSize(contours: Contour[], size: number): Contour[] {
  if (!contours.length) return contours;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const c of contours) for (const [x, y] of c) {
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  }
  const sc = size / Math.max(maxX - minX, maxY - minY, 1e-9);
  const ox = (minX + maxX) / 2, oy = (minY + maxY) / 2;
  return contours.map(c => c.map(([x, y]): Vec2 => [(x - ox) * sc, (y - oy) * sc]));
}
