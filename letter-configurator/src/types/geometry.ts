export type Vec2 = [number, number];

/** Closed polygon contour in mm (XY). */
export type Contour = Vec2[];

export interface MeshData {
  /** Flat xyz positions */
  positions: Float32Array;
  /** Triangle indices */
  indices: Uint32Array;
}

// ─── Symbol group ─────────────────────────────────────────────────────────────

export interface SymbolGroup {
  /** Human-readable label used in warnings (e.g. "⭐ Звезда") */
  label: string;
  /** Pre-generated, already-positioned polygon contours in mm */
  contours: Contour[];
  /**
   * If set, this group is a real 3D model (STL URL, relative to BASE_URL).
   * It is NOT used as a 2D inlay — instead it is loaded, scaled to `modelSizeMm`,
   * positioned at (modelX, modelY) on the letter front face, and returned as a
   * separate mesh piece for printing.
   */
  modelUrl?: string;
  modelSizeMm?: number;
  modelX?: number;
  modelY?: number;
}

// ─── Name Sign (solid) ────────────────────────────────────────────────────────

export interface NameSignParams {
  letter: string;
  name: string;

  letterFontUrl: string;
  nameFontUrl: string;

  /**
   * Zero or more symbol groups, each independently positioned & scaled.
   * Each group's contours are already in letter-space (mm).
   * All groups are combined with the text and checked individually for
   * out-of-bounds against the letter solid.
   */
  symbolGroups?: SymbolGroup[];

  letterHeight: number;
  /** Height of the name text in mm */
  nameHeight: number;
  /** Total extrusion depth of the letter (mm) */
  depth: number;
  /** Depth of the name-shaped cavity from the front face (mm) */
  inlayDepth: number;
  /** Gap between letter cavity and name piece for a snug fit (mm) */
  tolerance: number;

  nameX: number;
  nameY: number;

  /** How much the name piece rises above the letter surface (0 = flush) */
  raisedInlay: number;

  /** Bridge dots (i, j, й) and nearby separate letter islands into one piece */
  autoConnect: boolean;
  bridgeThickness: number;
  /**
   * Contact area (mm²) a glyph must share with the letter body to count as
   * held by its own pocket. Anything at or above this gets no bridge; below it
   * the glyph is treated as floating. 0 = any touch counts.
   */
  minContactArea: number;

  /** Segments per bezier curve — controls smoothness */
  curveSegments: number;
}

export interface NameSignResult {
  /** Letter body with name cavity subtracted */
  letter: MeshData;
  /** Name inlay piece (null if no name/symbols) */
  name: MeshData | null;
  /** Extra 3D model pieces (e.g. bear STL) — printed separately */
  models3d: Array<{ label: string; mesh: MeshData }>;
  dimensions: { x: number; y: number; z: number };
  volumes: { letterCm3: number; nameCm3: number };
  triangles: { letter: number; name: number };
  warnings: string[];
}
