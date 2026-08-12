import type { MeshData } from '../types/geometry';

/**
 * Fetch a binary STL, parse it, and return a MeshData scaled to `sizeMm`.
 * The STL is expected to be pre-normalised so its longest axis spans [0, 1].
 * After scaling every vertex is multiplied by sizeMm, then translated so the
 * model sits centred at (offsetX, offsetY) with its base resting on Z = baseZ.
 */
export async function loadStlMesh(
  url: string,
  sizeMm: number,
  offsetX = 0,
  offsetY = 0,
  baseZ = 0,
): Promise<MeshData> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Cannot load 3D model: ${url}`);
  const buf = await resp.arrayBuffer();

  const view    = new DataView(buf);
  const triCount = view.getUint32(80, true);   // binary STL: count at byte 80
  const positions = new Float32Array(triCount * 9);  // 3 verts * 3 coords
  const indices   = new Uint32Array(triCount * 3);

  let off = 84;
  // Raw extents so we can centre the model
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < triCount; i++) {
    off += 12; // skip face normal
    for (let j = 0; j < 3; j++) {
      const x = view.getFloat32(off, true);
      const y = view.getFloat32(off + 4, true);
      const z = view.getFloat32(off + 8, true);
      off += 12;
      const vi = (i * 3 + j) * 3;
      positions[vi] = x; positions[vi + 1] = y; positions[vi + 2] = z;
      if (x < minX) minX = x;  if (x > maxX) maxX = x;
      if (y < minY) minY = y;  if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;  if (z > maxZ) maxZ = z;
    }
    indices[i * 3]     = i * 3;
    indices[i * 3 + 1] = i * 3 + 1;
    indices[i * 3 + 2] = i * 3 + 2;
    off += 2; // attribute byte count
  }

  // The model is pre-normalised to [0,1]; scale to sizeMm
  // and centre X/Y, sit base on Z = baseZ
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  for (let vi = 0; vi < positions.length; vi += 3) {
    positions[vi]     = (positions[vi]     - cx) * sizeMm + offsetX;
    positions[vi + 1] = (positions[vi + 1] - cy) * sizeMm + offsetY;
    positions[vi + 2] = (positions[vi + 2] - minZ) * sizeMm + baseZ;
  }

  return { positions, indices };
}
