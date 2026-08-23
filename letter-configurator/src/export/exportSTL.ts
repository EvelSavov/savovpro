import JSZip from 'jszip';
import type { MeshData } from '../types/geometry';

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace('#', ''), 16);
  if (Number.isNaN(n)) return { r: 200, g: 200, b: 200 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Magics/VisCAM 15-bit color in the STL triangle attribute word. */
function stlColorAttr(hex?: string): number {
  if (!hex) return 0;
  const { r, g, b } = parseHexColor(hex);
  return 0x8000 | ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
}

function writeStlHeader(view: DataView, name: string, colorHex?: string): void {
  const bytes = new Uint8Array(80);
  bytes.fill(0x20);
  if (colorHex) {
    const { r, g, b } = parseHexColor(colorHex);
    const tag = new TextEncoder().encode('COLOR=');
    bytes.set(tag, 0);
    bytes[6] = r;
    bytes[7] = g;
    bytes[8] = b;
    bytes[9] = 255;
    const label = new TextEncoder().encode(`SAVOV PRO ${name}`.slice(0, 68));
    bytes.set(label, 10);
  } else {
    const label = new TextEncoder().encode(`SAVOV PRO ${name}`.slice(0, 80));
    bytes.set(label, 0);
  }
  for (let i = 0; i < 80; i++) view.setUint8(i, bytes[i]);
}

function writeMeshTris(
  view: DataView,
  mesh: MeshData,
  startOffset: number,
  colorHex?: string,
): number {
  const p = mesh.positions;
  const idx = mesh.indices;
  const count = idx.length / 3;
  const attr = stlColorAttr(colorHex);
  let offset = startOffset;
  for (let t = 0; t < count; t++) {
    const i0 = idx[t * 3] * 3;
    const i1 = idx[t * 3 + 1] * 3;
    const i2 = idx[t * 3 + 2] * 3;

    const ax = p[i0], ay = p[i0 + 1], az = p[i0 + 2];
    const bx = p[i1], by = p[i1 + 1], bz = p[i1 + 2];
    const cx = p[i2], cy = p[i2 + 1], cz = p[i2 + 2];

    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;

    view.setFloat32(offset, nx, true); view.setFloat32(offset + 4, ny, true); view.setFloat32(offset + 8, nz, true); offset += 12;
    view.setFloat32(offset, ax, true); view.setFloat32(offset + 4, ay, true); view.setFloat32(offset + 8, az, true); offset += 12;
    view.setFloat32(offset, bx, true); view.setFloat32(offset + 4, by, true); view.setFloat32(offset + 8, bz, true); offset += 12;
    view.setFloat32(offset, cx, true); view.setFloat32(offset + 4, cy, true); view.setFloat32(offset + 8, cz, true); offset += 12;
    view.setUint16(offset, attr, true); offset += 2;
  }
  return offset;
}

/** Build a binary STL buffer from a single mesh. Optional hex color (Magics). */
export function meshToBinarySTL(mesh: MeshData, name = 'mesh', colorHex?: string): ArrayBuffer {
  const triCount = mesh.indices.length / 3;
  const buffer = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buffer);
  writeStlHeader(view, name, colorHex);
  view.setUint32(80, triCount, true);
  writeMeshTris(view, mesh, 84, colorHex);
  return buffer;
}

/**
 * Combine two meshes into one binary STL (both at their original positions).
 * Used for multi-color slicers that split by geometry region.
 */
export function mergeMeshesToSTL(
  meshA: MeshData,
  meshB: MeshData,
  name = 'combined',
  colorA?: string,
  colorB?: string,
): ArrayBuffer {
  const totalTris = meshA.indices.length / 3 + meshB.indices.length / 3;
  const buffer = new ArrayBuffer(84 + totalTris * 50);
  const view = new DataView(buffer);
  writeStlHeader(view, name, colorA);
  view.setUint32(80, totalTris, true);
  const next = writeMeshTris(view, meshA, 84, colorA);
  writeMeshTris(view, meshB, next, colorB);
  return buffer;
}

export function downloadSTL(mesh: MeshData, filename: string, colorHex?: string): void {
  triggerDownload(meshToBinarySTL(mesh, filename, colorHex), filename.endsWith('.stl') ? filename : `${filename}.stl`, 'model/stl');
}

export function downloadCombinedSTL(
  letter: MeshData,
  name: MeshData,
  stem: string,
  letterColor?: string,
  nameColor?: string,
): void {
  const buf = mergeMeshesToSTL(letter, name, stem, letterColor, nameColor);
  triggerDownload(buf, `${stem}.stl`, 'model/stl');
}

export async function downloadSeparateZIP(
  letter: MeshData,
  name: MeshData | null,
  stem: string,
  models3d?: Array<{ label: string; mesh: MeshData }>,
  previewPng?: Blob | null,
  letterColor?: string,
  nameColor?: string,
): Promise<void> {
  const zip = new JSZip();
  zip.file(`${stem}_LETTER.stl`, meshToBinarySTL(letter, 'LETTER', letterColor));
  if (name) {
    zip.file(`${stem}_NAME.stl`, meshToBinarySTL(name, 'NAME', nameColor));
  }
  if (models3d) {
    models3d.forEach(({ label, mesh }, i) => {
      const safeName = label.replace(/[^a-zA-Z0-9А-Яа-я]/g, '_').slice(0, 20);
      zip.file(`${stem}_3D_${safeName}_${i + 1}.stl`, meshToBinarySTL(mesh, safeName, nameColor));
    });
  }
  if (previewPng) {
    zip.file(`${stem}_preview.png`, previewPng);
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  triggerDownload(blob, `${stem}_parts.zip`, 'application/zip');
}

function triggerDownload(data: ArrayBuffer | Blob, filename: string, mime: string): void {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
