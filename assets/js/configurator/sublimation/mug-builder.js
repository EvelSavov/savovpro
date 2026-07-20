import * as THREE from 'three';
import { state } from './state.js';
import { texture } from './texture.js';
import { scene, envMap } from './scene.js';

let mugGroup = null;
const SEGS = 96;

/** Closed ceramic shell: outer wall + rounded rim + inner cavity + bottom. */
function mugShellProfile(H, R) {
  const wall = 0.040;
  const Ri   = R - wall;
  const foot = R - 0.032;

  return [
    new THREE.Vector2(0.001, 0.000),
    new THREE.Vector2(foot,  0.000),
    new THREE.Vector2(foot + 0.014, 0.014),
    new THREE.Vector2(R - 0.006, 0.042),
    new THREE.Vector2(R,     0.075),
    new THREE.Vector2(R,     H * 0.55),
    new THREE.Vector2(R,     H * 0.93),
    new THREE.Vector2(R + 0.008, H * 0.98),
    new THREE.Vector2(R + 0.016, H),
    // Rounded lip
    new THREE.Vector2(R + 0.012, H + 0.020),
    new THREE.Vector2(R - 0.002, H + 0.030),
    new THREE.Vector2(Ri + 0.006, H + 0.024),
    new THREE.Vector2(Ri,    H + 0.006),
    // Inner down
    new THREE.Vector2(Ri,    H * 0.93),
    new THREE.Vector2(Ri,    0.075),
    new THREE.Vector2(Ri - 0.008, 0.048),
    new THREE.Vector2(0.001, 0.042),
  ];
}

function bottleProfile() {
  return [
    new THREE.Vector2(0.001, 0.000),
    new THREE.Vector2(0.185, 0.000),
    new THREE.Vector2(0.210, 0.030),
    new THREE.Vector2(0.225, 0.080),
    new THREE.Vector2(0.230, 0.200),
    new THREE.Vector2(0.230, 1.100),
    new THREE.Vector2(0.225, 1.280),
    new THREE.Vector2(0.210, 1.400),
    new THREE.Vector2(0.195, 1.480),
    new THREE.Vector2(0.190, 1.520),
    new THREE.Vector2(0.160, 1.520),
    new THREE.Vector2(0.155, 1.100),
    new THREE.Vector2(0.155, 0.200),
    new THREE.Vector2(0.001, 0.040),
  ];
}

function ceramicMat(opts = {}) {
  const mat = new THREE.MeshPhysicalMaterial({
    color:              opts.color ?? '#ffffff',
    map:                opts.map ?? null,
    roughness:          opts.roughness ?? 0.14,
    metalness:          0.0,
    clearcoat:          1.0,
    clearcoatRoughness: 0.06,
    reflectivity:       0.6,
    envMapIntensity:    1.2,
    transparent:        !!opts.transparent,
    opacity:            opts.opacity ?? 1,
    depthWrite:         opts.depthWrite !== false,
    side:               opts.side ?? THREE.FrontSide,
  });
  if (envMap) mat.envMap = envMap;
  mat.userData.role = opts.role || 'body';
  return mat;
}

function disposeGroup(group) {
  group.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
      else o.material.dispose();
    }
  });
}

function addHandle(group, R, H, mat) {
  const topY  = H * 0.70;
  const botY  = H * 0.24;
  const midY  = (topY + botY) / 2;
  const halfH = (topY - botY) / 2;
  const reach = halfH * 0.92;
  const tubeR = 0.050;

  const pts = [];
  pts.push(new THREE.Vector3(R - 0.025, topY, 0));
  pts.push(new THREE.Vector3(R + 0.015, topY - 0.008, 0));

  const N = 48;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI - Math.PI / 2;
    pts.push(new THREE.Vector3(
      R + 0.02 + reach * Math.cos(t),
      midY + halfH * Math.sin(t),
      0
    ));
  }

  pts.push(new THREE.Vector3(R + 0.015, botY + 0.008, 0));
  pts.push(new THREE.Vector3(R - 0.025, botY, 0));

  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.18);
  const geo   = new THREE.TubeGeometry(curve, 90, tubeR, 22, false);
  geo.computeVertexNormals();

  const handle = new THREE.Mesh(geo, mat);
  handle.castShadow = true;
  handle.receiveShadow = true;
  handle.userData.role = 'handle';
  group.add(handle);

  for (const y of [topY, botY]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(tubeR * 1.2, 24, 18), mat);
    cap.position.set(R - 0.008, y, 0);
    cap.scale.set(1.15, 1.05, 1.15);
    cap.castShadow = true;
    cap.userData.role = 'handle';
    group.add(cap);
  }
}

/**
 * Print sleeve — open cylinder hugging the outer wall.
 * Slightly proud of the shell so the wrap reads cleanly without z-fighting.
 */
function addPrintSleeve(group, R, H) {
  const printH   = H * 0.78;
  const printBot = H * 0.10;
  const printR   = R + 0.0015;

  const geo = new THREE.CylinderGeometry(printR, printR, printH, SEGS, 1, true);
  const uv  = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
  uv.needsUpdate = true;
  geo.computeVertexNormals();

  const mat = ceramicMat({
    map: texture,
    role: 'print',
    roughness: 0.16,
    // Multiply with white so canvas colors stay true
    color: '#ffffff',
  });
  // Soften sleeve edge a little — still opaque print
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = -1;
  mat.polygonOffsetUnits  = -1;

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = printBot + printH / 2;
  mesh.castShadow = true;
  mesh.userData.role = 'print';
  group.add(mesh);
}

function buildCeramicMug(type) {
  const H = type === 'mug420' ? 1.10 : 0.95;
  const R = type === 'mug420' ? 0.450 : 0.415;

  const shellMat  = ceramicMat({ color: state.bodyColor, role: 'body' });
  const handleMat = ceramicMat({ color: state.handleColor, role: 'handle' });
  const innerMat  = ceramicMat({
    color: state.innerColor,
    role: 'inner',
    roughness: 0.28,
    clearcoat: 0.6,
  });

  // Main ceramic shell
  const shellGeo = new THREE.LatheGeometry(mugShellProfile(H, R), SEGS);
  shellGeo.computeVertexNormals();
  const shell = new THREE.Mesh(shellGeo, shellMat);
  shell.castShadow = true;
  shell.receiveShadow = true;
  shell.userData.role = 'body';
  mugGroup.add(shell);

  // Inner tint as a slightly smaller open cylinder (BackSide reads as cavity color)
  const innerR = R - 0.042;
  const innerH = H - 0.08;
  const innerGeo = new THREE.CylinderGeometry(innerR, innerR, innerH, SEGS, 1, true);
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  innerMesh.material.side = THREE.BackSide;
  innerMesh.position.y = innerH / 2 + 0.045;
  innerMesh.userData.role = 'inner';
  mugGroup.add(innerMesh);

  const innerBot = new THREE.Mesh(
    new THREE.CircleGeometry(innerR - 0.002, SEGS),
    ceramicMat({ color: state.innerColor, role: 'inner', roughness: 0.35, clearcoat: 0.4 })
  );
  innerBot.rotation.x = -Math.PI / 2;
  innerBot.position.y = 0.046;
  innerBot.userData.role = 'inner';
  mugGroup.add(innerBot);

  addPrintSleeve(mugGroup, R, H);
  addHandle(mugGroup, R, H, handleMat);

  mugGroup.position.y = -H / 2;
}

function buildBottle() {
  const profile = bottleProfile();
  const H = profile.reduce((m, p) => Math.max(m, p.y), 0);
  const mat = ceramicMat({ map: texture, role: 'print', color: '#ffffff' });

  const geo = new THREE.LatheGeometry(profile, SEGS);
  const uv  = geo.attributes.uv;
  const pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - pos.getY(i) / H);
  uv.needsUpdate = true;
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.role = 'print';
  mugGroup.add(mesh);
  mugGroup.position.y = -H / 2;
}

export function buildMug(product) {
  if (mugGroup) {
    scene.remove(mugGroup);
    disposeGroup(mugGroup);
  }

  mugGroup = new THREE.Group();

  if (product === 'bottle') buildBottle();
  else buildCeramicMug(product);

  scene.add(mugGroup);
  updateColors();
}

export function updateColors() {
  if (!mugGroup) return;
  mugGroup.traverse(child => {
    if (!child.isMesh || !child.material) return;
    const mat  = child.material;
    const role = mat.userData.role || child.userData.role;
    if (role === 'handle') mat.color.set(state.handleColor);
    else if (role === 'inner') mat.color.set(state.innerColor);
    else if (role === 'body') mat.color.set(state.bodyColor);
    else if (role === 'print') mat.color.set('#ffffff');
  });
}
