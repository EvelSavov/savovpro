import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('three-canvas');

/* ── Renderer ─────────────────────────────────────────────── */
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled   = true;
renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace    = THREE.SRGBColorSpace;

/* ── Scene — soft studio grey like Pacdora ────────────────── */
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe8e8ea);

/* Environment map for glossy ceramic reflections */
const pmrem = new THREE.PMREMGenerator(renderer);
export const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envMap;

/* ── Camera ───────────────────────────────────────────────── */
export const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(1.6, 0.55, 3.4);

/* ── Controls ─────────────────────────────────────────────── */
export const controls = new OrbitControls(camera, canvas);
controls.enableDamping   = true;
controls.dampingFactor   = 0.08;
controls.minDistance     = 2;
controls.maxDistance     = 7;
controls.maxPolarAngle   = Math.PI * 0.72;
controls.target.set(0, 0.05, 0);
controls.autoRotate      = true;
controls.autoRotateSpeed = 0.6;
controls.addEventListener('start', () => { controls.autoRotate = false; });

/* ── Soft studio lights ───────────────────────────────────── */
scene.add(new THREE.AmbientLight(0xffffff, 0.45));

const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(2.5, 4.5, 3.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 0.5;
key.shadow.camera.far  = 20;
key.shadow.camera.left = key.shadow.camera.bottom = -3;
key.shadow.camera.right = key.shadow.camera.top = 3;
key.shadow.bias = -0.0002;
scene.add(key);

const fill = new THREE.DirectionalLight(0xf0f4ff, 0.55);
fill.position.set(-3.5, 2, -1.5);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.35);
rim.position.set(0, 1.5, -4);
scene.add(rim);

/* Soft ground shadow disc */
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(2.2, 64),
  new THREE.ShadowMaterial({ opacity: 0.18 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.52;
floor.receiveShadow = true;
scene.add(floor);

/* ── Resize ───────────────────────────────────────────────── */
export function resize() {
  const vp = canvas.parentElement;
  const w  = vp.clientWidth;
  const h  = vp.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

export function startRenderLoop() {
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}
