import Module from 'manifold-3d';
import wasmUrl from 'manifold-3d/manifold.wasm?url';
import type { ManifoldToplevel } from 'manifold-3d';

let ready: Promise<ManifoldToplevel> | null = null;

export function loadManifold(): Promise<ManifoldToplevel> {
  if (!ready) {
    ready = (async () => {
      // Vite needs an explicit WASM URL via locateFile.
      const wasm = await (Module as (opts?: { locateFile?: () => string }) => Promise<ManifoldToplevel>)({
        locateFile: () => wasmUrl,
      });
      wasm.setup();
      return wasm;
    })();
  }
  return ready;
}
