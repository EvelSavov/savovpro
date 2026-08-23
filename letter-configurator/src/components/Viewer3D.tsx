import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import type { MeshData } from '../types/geometry';

export interface ViewerMeshes {
  letter: MeshData;
  name: MeshData | null;
  models3d: Array<{ label: string; mesh: MeshData }>;
  depth: number;
  inlayDepth: number;
}

interface Props {
  meshes: ViewerMeshes | null;
  letterColor?: string;
  nameColor?: string;
}

export type Viewer3DHandle = {
  capturePreview: () => Promise<Blob | null>;
};

function toGeo(data: MeshData, creaseDeg = 40): THREE.BufferGeometry {
  const src = new THREE.BufferGeometry();
  src.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  src.setIndex(new THREE.BufferAttribute(data.indices, 1));

  // toCreasedNormals: smooth shading within flat/gently-curved regions,
  // sharp crease only at actual geometric corners (e.g. top face → side wall).
  const geo = toCreasedNormals(src, THREE.MathUtils.degToRad(creaseDeg));
  src.dispose();
  return geo;
}

/** Smooth shading for imported STL symbols (bear, bolt, …) — hides tessellation seams. */
function toSmoothGeo(data: MeshData): THREE.BufferGeometry {
  const src = new THREE.BufferGeometry();
  src.setAttribute('position', new THREE.BufferAttribute(data.positions.slice(), 3));
  src.setIndex(new THREE.BufferAttribute(data.indices.slice(), 1));
  const merged = mergeVertices(src, 1e-4);
  src.dispose();
  merged.computeVertexNormals();
  return merged;
}

type SceneCtx = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  letterMesh: THREE.Mesh | null;
  nameMesh: THREE.Mesh | null;
  model3dMeshes: THREE.Mesh[];
  depth: number;
  inlayDepth: number;
  frame: number;
  framedOnce: boolean;
  lastCenter: THREE.Vector3;
};

export const Viewer3D = forwardRef<Viewer3DHandle, Props>(function Viewer3D({
  meshes,
  letterColor = '#d4d0cb',
  nameColor = '#f472b6',
}, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<SceneCtx | null>(null);
  const [showLetter, setShowLetter] = useState(true);
  const [showName, setShowName] = useState(true);
  const [separated, setSeparated] = useState(false);

  useImperativeHandle(ref, () => ({
    capturePreview: () => new Promise<Blob | null>((resolve) => {
      const ctx = ctxRef.current;
      const host = hostRef.current;
      if (!ctx?.letterMesh) {
        resolve(null);
        return;
      }

      const liveW = host?.clientWidth ?? 0;
      const liveH = host?.clientHeight ?? 0;
      const hidden = liveW < 2 || liveH < 2;
      const savedCam = ctx.camera.position.clone();
      const savedTarget = ctx.controls.target.clone();
      const savedUp = ctx.camera.up.clone();
      const savedNamePos = ctx.nameMesh?.position.clone();
      const letterVis = ctx.letterMesh.visible;
      const nameVis = ctx.nameMesh?.visible ?? true;

      if (hidden) {
        ctx.camera.aspect = 16 / 10;
        ctx.camera.updateProjectionMatrix();
        ctx.renderer.setSize(1280, 800, false);
      }

      ctx.letterMesh.visible = true;
      if (ctx.nameMesh) {
        ctx.nameMesh.visible = true;
        ctx.nameMesh.position.set(0, 0, 0);
      }

      const box = new THREE.Box3().setFromObject(ctx.letterMesh);
      if (ctx.nameMesh) box.union(new THREE.Box3().setFromObject(ctx.nameMesh));
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const dist = Math.max(size.x, size.y, size.z, 1) * 2.2;
      ctx.controls.target.copy(center);
      ctx.camera.up.set(0, 1, 0);
      ctx.camera.position.set(center.x, center.y, center.z + dist);
      ctx.camera.lookAt(center);
      ctx.controls.update();
      ctx.renderer.render(ctx.scene, ctx.camera);

      ctx.renderer.domElement.toBlob((blob) => {
        ctx.camera.position.copy(savedCam);
        ctx.camera.up.copy(savedUp);
        ctx.controls.target.copy(savedTarget);
        if (ctx.letterMesh) ctx.letterMesh.visible = letterVis;
        if (ctx.nameMesh) {
          ctx.nameMesh.visible = nameVis;
          if (savedNamePos) ctx.nameMesh.position.copy(savedNamePos);
        }
        ctx.controls.update();
        if (hidden && host) {
          const w = host.clientWidth;
          const h = host.clientHeight;
          if (w >= 2 && h >= 2) {
            ctx.camera.aspect = w / h;
            ctx.camera.updateProjectionMatrix();
            ctx.renderer.setSize(w, h, false);
          }
        }
        resolve(blob);
      }, 'image/png');
    }),
  }), []);

  const resetCamera = () => {
    const ctx = ctxRef.current;
    if (!ctx?.letterMesh) return;
    const box = new THREE.Box3().setFromObject(ctx.letterMesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    ctx.controls.target.copy(center);
    ctx.camera.position.set(
      center.x + maxDim * 0.4,
      center.y + maxDim * 0.35,
      center.z + maxDim * 1.8,
    );
    ctx.controls.update();
  };

  // Scene setup (once)
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0e10);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 5000);
    camera.position.set(150, 100, 260);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 4);
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(120, 220, 200);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc9a227, 0.3);
    fill.position.set(-180, 60, -80);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.25);
    rim.position.set(0, -80, -120);
    scene.add(rim);

    const ctx: SceneCtx = {
      renderer,
      scene,
      camera,
      controls,
      letterMesh: null,
      nameMesh: null,
      model3dMeshes: [],
      depth: 8,
      inlayDepth: 1.5,
      frame: 0,
      framedOnce: false,
      lastCenter: new THREE.Vector3(),
    };
    ctxRef.current = ctx;

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w < 2 || h < 2) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const tick = () => {
      ctx.frame = requestAnimationFrame(tick);
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(ctx.frame);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
      ctxRef.current = null;
    };
  }, []);

  // Rebuild meshes when data changes
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const dispose = (m: THREE.Mesh | null) => {
      if (!m) return;
      ctx.scene.remove(m);
      m.geometry.dispose();
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) => mt.dispose());
    };
    dispose(ctx.letterMesh);
    dispose(ctx.nameMesh);
    ctx.model3dMeshes.forEach(m => dispose(m));
    ctx.letterMesh = null;
    ctx.nameMesh = null;
    ctx.model3dMeshes = [];

    if (!meshes) return;

    ctx.depth = meshes.depth;
    ctx.inlayDepth = meshes.inlayDepth;

    const lm = new THREE.Mesh(
      toGeo(meshes.letter),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(letterColor),
        metalness: 0.1,
        roughness: 0.55,
      }),
    );
    ctx.scene.add(lm);
    ctx.letterMesh = lm;

    if (meshes.name) {
      const nm = new THREE.Mesh(
        toGeo(meshes.name, 55),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(nameColor),
          metalness: 0.05,
          roughness: 0.38,
        }),
      );
      ctx.scene.add(nm);
      ctx.nameMesh = nm;
    }

    // 3D model symbols (bear, bolt, …) — smooth shaded like sculpted STLs
    for (const { mesh } of meshes.models3d ?? []) {
      const m3d = new THREE.Mesh(
        toSmoothGeo(mesh),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(nameColor),
          metalness: 0.08,
          roughness: 0.40,
          flatShading: false,
        }),
      );
      ctx.scene.add(m3d);
      ctx.model3dMeshes.push(m3d);
    }

    const box = new THREE.Box3().setFromObject(lm);
    const center = box.getCenter(new THREE.Vector3());

    // Keep the user's orbit. Only frame the first model; later just
    // slide the camera with the letter if its center moves.
    if (!ctx.framedOnce) {
      resetCamera();
      ctx.framedOnce = true;
    } else {
      const delta = center.clone().sub(ctx.lastCenter);
      if (delta.lengthSq() > 1e-6) {
        ctx.camera.position.add(delta);
        ctx.controls.target.add(delta);
        ctx.controls.update();
      }
    }
    ctx.lastCenter.copy(center);
  }, [meshes]);

  // Recolor without rebuilding geometry or resetting the camera
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const setColor = (mesh: THREE.Mesh | null, hex: string) => {
      if (!mesh) return;
      const mat = mesh.material;
      if (!Array.isArray(mat) && 'color' in mat) {
        (mat as THREE.MeshStandardMaterial).color.set(hex);
      }
    };
    setColor(ctx.letterMesh, letterColor);
    setColor(ctx.nameMesh, nameColor);
    ctx.model3dMeshes.forEach((m) => setColor(m, nameColor));
  }, [letterColor, nameColor, meshes]);

  // Toggle visibility / separated mode
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (ctx.letterMesh) ctx.letterMesh.visible = showLetter;
    if (ctx.nameMesh) {
      ctx.nameMesh.visible = showName;
      if (separated && ctx.letterMesh) {
        // Separated Mode: slide name to the right of the letter (PrintPal style)
        const letterBox = new THREE.Box3().setFromObject(ctx.letterMesh);
        const nameBox   = new THREE.Box3().setFromObject(ctx.nameMesh);
        const gap = 15;
        ctx.nameMesh.position.x = letterBox.max.x + gap - nameBox.min.x;
        ctx.nameMesh.position.z = 0; // reset Z so both parts lay flat side-by-side
      } else {
        ctx.nameMesh.position.x = 0;
        ctx.nameMesh.position.z = 0;
      }
    }
  }, [showLetter, showName, separated, meshes]);

  return (
    <div className="viewer">
      <div className="viewer-canvas" ref={hostRef} />
      <div className="viewer-toolbar">
        <label>
          <input type="checkbox" checked={showLetter} onChange={(e) => setShowLetter(e.target.checked)} />
          Letter
        </label>
        <label>
          <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} />
          Name
        </label>
        <label>
          <input type="checkbox" checked={separated} onChange={(e) => setSeparated(e.target.checked)} />
          Separated
        </label>
        <button type="button" onClick={resetCamera}>Reset</button>
      </div>
      {!meshes && <p className="viewer-empty">Генерирай модел за 3D превю</p>}
    </div>
  );
});
