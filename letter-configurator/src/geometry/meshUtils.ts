import type { Mesh } from 'manifold-3d';
import type { MeshData } from '../types/geometry';

/** Convert Manifold Mesh → plain MeshData (xyz only). */
export function manifoldMeshToData(mesh: Mesh): MeshData {
  const numProp = mesh.numProp;
  const vertCount = mesh.numVert;
  const positions = new Float32Array(vertCount * 3);
  for (let i = 0; i < vertCount; i++) {
    const base = i * numProp;
    positions[i * 3] = mesh.vertProperties[base];
    positions[i * 3 + 1] = mesh.vertProperties[base + 1];
    positions[i * 3 + 2] = mesh.vertProperties[base + 2];
  }
  return {
    positions,
    indices: new Uint32Array(mesh.triVerts),
  };
}

export function meshBounds(mesh: MeshData): {
  min: [number, number, number];
  max: [number, number, number];
} {
  const p = mesh.positions;
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < p.length; i += 3) {
    const x = p[i];
    const y = p[i + 1];
    const z = p[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
  };
}

/** Approximate volume in mm³ via signed tetrahedron sum (closed mesh). */
export function meshVolumeMm3(mesh: MeshData): number {
  const p = mesh.positions;
  const idx = mesh.indices;
  let vol = 0;
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3;
    const b = idx[i + 1] * 3;
    const c = idx[i + 2] * 3;
    const ax = p[a];
    const ay = p[a + 1];
    const az = p[a + 2];
    const bx = p[b];
    const by = p[b + 1];
    const bz = p[b + 2];
    const cx = p[c];
    const cy = p[c + 1];
    const cz = p[c + 2];
    vol +=
      ax * (by * cz - bz * cy) -
      ay * (bx * cz - bz * cx) +
      az * (bx * cy - by * cx);
  }
  return Math.abs(vol) / 6;
}
