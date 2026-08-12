import JSZip from 'jszip';
import type { MeshData } from '../types/geometry';

/** Build a binary STL buffer from a single mesh. */
export function meshToBinarySTL(mesh: MeshData, name = 'mesh'): ArrayBuffer {
  const triCount = mesh.indices.length / 3;
  const buffer = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buffer);
  const encoder = new TextEncoder();
  const header = encoder.encode(`SAVOV PRO ${name}`.padEnd(80, ' ').slice(0, 80));
  for (let i = 0; i < 80; i++) view.setUint8(i, header[i] ?? 32);
  view.setUint32(80, triCount, true);

  const p = mesh.positions;
  const idx = mesh.indices;
  let offset = 84;

  for (let t = 0; t < triCount; t++) {
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

    view.setFloat32(offset,      nx, true); view.setFloat32(offset + 4,  ny, true); view.setFloat32(offset + 8,  nz, true); offset += 12;
    view.setFloat32(offset,      ax, true); view.setFloat32(offset + 4,  ay, true); view.setFloat32(offset + 8,  az, true); offset += 12;
    view.setFloat32(offset,      bx, true); view.setFloat32(offset + 4,  by, true); view.setFloat32(offset + 8,  bz, true); offset += 12;
    view.setFloat32(offset,      cx, true); view.setFloat32(offset + 4,  cy, true); view.setFloat32(offset + 8,  cz, true); offset += 12;
    view.setUint16(offset, 0, true); offset += 2;
  }

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
): ArrayBuffer {
  const totalTris = meshA.indices.length / 3 + meshB.indices.length / 3;
  const buffer = new ArrayBuffer(84 + totalTris * 50);
  const view = new DataView(buffer);
  const encoder = new TextEncoder();
  const header = encoder.encode(`SAVOV PRO ${name}`.padEnd(80, ' ').slice(0, 80));
  for (let i = 0; i < 80; i++) view.setUint8(i, header[i] ?? 32);
  view.setUint32(80, totalTris, true);

  let offset = 84;
  const writeTris = (mesh: MeshData) => {
    const p = mesh.positions;
    const idx = mesh.indices;
    const count = idx.length / 3;
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

      view.setFloat32(offset,     nx, true); view.setFloat32(offset + 4,  ny, true); view.setFloat32(offset + 8,  nz, true); offset += 12;
      view.setFloat32(offset,     ax, true); view.setFloat32(offset + 4,  ay, true); view.setFloat32(offset + 8,  az, true); offset += 12;
      view.setFloat32(offset,     bx, true); view.setFloat32(offset + 4,  by, true); view.setFloat32(offset + 8,  bz, true); offset += 12;
      view.setFloat32(offset,     cx, true); view.setFloat32(offset + 4,  cy, true); view.setFloat32(offset + 8,  cz, true); offset += 12;
      view.setUint16(offset, 0, true); offset += 2;
    }
  };

  writeTris(meshA);
  writeTris(meshB);
  return buffer;
}

export function downloadSTL(mesh: MeshData, filename: string): void {
  triggerDownload(meshToBinarySTL(mesh, filename), filename.endsWith('.stl') ? filename : `${filename}.stl`, 'model/stl');
}

export function downloadCombinedSTL(letter: MeshData, name: MeshData, stem: string): void {
  const buf = mergeMeshesToSTL(letter, name, stem);
  triggerDownload(buf, `${stem}.stl`, 'model/stl');
}

export async function downloadSeparateZIP(
  letter: MeshData,
  name: MeshData | null,
  stem: string,
  models3d?: Array<{ label: string; mesh: MeshData }>,
): Promise<void> {
  const zip = new JSZip();
  zip.file(`${stem}_LETTER.stl`, meshToBinarySTL(letter, 'LETTER'));
  if (name) {
    zip.file(`${stem}_NAME.stl`, meshToBinarySTL(name, 'NAME'));
  }
  if (models3d) {
    models3d.forEach(({ label, mesh }, i) => {
      const safeName = label.replace(/[^a-zA-Z0-9А-Яа-я]/g, '_').slice(0, 20);
      zip.file(`${stem}_3D_${safeName}_${i + 1}.stl`, meshToBinarySTL(mesh, safeName));
    });
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
