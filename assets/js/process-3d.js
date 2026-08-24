import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

(function () {
  var root = document.querySelector("#process-3d");
  if (!root) return;

  var frame = root.querySelector("[data-print3d-frame]");
  var canvas = root.querySelector("[data-print3d-canvas]");
  var track = root.querySelector(".process-track");
  var pin = root.querySelector(".process-sticky");
  var layout = root.querySelector(".process-layout");
  if (!frame || !track || !pin) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = { draw: 0, turn: 0, sweep: 0.5 };
  var renderer = null;
  var camera = null;
  var scene = null;
  var gear = null;
  var cap = null;
  var nozzle = null;
  var clipPlane = null;
  var gearHeight = 1;
  var lookTarget = null;

  function showFallback() {
    frame.classList.remove("is-3d");
    frame.style.setProperty("--print3d-reveal", reduced ? "1" : "0");
    frame.style.setProperty("--print3d-x", "50%");
    if (layout) layout.classList.add("is-shown");
    setupFallbackScroll();
  }

  function setupFallbackScroll() {
    if (!canvas) {
      /* keep old 2D path */
    }
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    if (frame.classList.contains("is-3d")) return;

    gsap.registerPlugin(ScrollTrigger);
    var headerH =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--header-inner-h")
      ) || 72;

    gsap.to({ p: 0 }, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: track,
        start: "top top+=" + headerH,
        end: function () {
          return "+=" + Math.max(1, track.offsetHeight - pin.offsetHeight);
        },
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var p = self.progress;
          var draw = Math.min(1, p / 0.86);
          frame.style.setProperty("--print3d-reveal", String(draw));
          var sweeps = 14;
          var phase = (draw * sweeps) % 1;
          var x = phase < 0.5 ? phase * 2 : 2 - phase * 2;
          frame.style.setProperty("--print3d-x", 28 + x * 44 + "%");
          if (draw > 0.04 && p < 0.9) {
            frame.classList.add("is-printing");
          } else {
            frame.classList.remove("is-printing");
          }
        }
      }
    });
  }

  function mapProgress(p) {
    if (reduced) {
      state.draw = 1;
      state.turn = 0.42;
      state.sweep = 0.5;
      return;
    }
    state.draw = Math.min(1, Math.max(0, p / 0.76));
    state.turn = p * Math.PI * 2.15;
    var sweeps = 10;
    var phase = (state.draw * sweeps) % 1;
    state.sweep = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  }

  function applyState() {
    var height = (state.draw <= 0 ? 0 : Math.max(state.draw, 0.14)) * gearHeight;
    var finish = Math.max(0, Math.min(1, (state.draw - 0.86) / 0.14));
    if (clipPlane) {
      clipPlane.constant = state.draw >= 0.995 ? gearHeight + 1 : height + 0.03;
    }
    if (gear) {
      gear.rotation.y = state.turn;
      gear.visible = state.draw > 0.018;
    }
    if (cap) {
      cap.visible = state.draw > 0.018;
      cap.position.y = Math.min(height, gearHeight);
      cap.material.emissiveIntensity = 0.12 * (1 - finish);
    }
    if (nozzle) {
      var active = state.draw > 0.018 && finish < 1;
      nozzle.visible = active;
      if (active) {
        var rim = 1.12;
        var a = (state.sweep - 0.5) * 0.7;
        nozzle.position.set(
          Math.sin(a) * rim * (1 - finish * 0.25),
          height + 0.02 + finish * 1.15,
          Math.cos(a) * rim * 0.72
        );
      }
    }
    if (camera && lookTarget) {
      lookTarget.set(0, 0.1 + state.draw * gearHeight * 0.45, 0);
      camera.lookAt(lookTarget);
    }
    if (state.draw > 0.03 && finish < 1) {
      frame.classList.add("is-printing");
    } else {
      frame.classList.remove("is-printing");
    }
  }

  function render() {
    if (!renderer || !scene || !camera) return;
    applyState();
    renderer.render(scene, camera);
  }

  function resize() {
    if (!renderer || !camera) return;
    var w = canvas.clientWidth || frame.clientWidth;
    var h = canvas.clientHeight || frame.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  }

  function addPoint(shape, radius, angle, first) {
    var x = Math.cos(angle) * radius;
    var y = Math.sin(angle) * radius;
    if (first) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  function createGearShape(teeth, outerR, pitchR, rootR, holeR) {
    var shape = new THREE.Shape();
    var pitch = (Math.PI * 2) / teeth;
    var i;
    for (i = 0; i < teeth; i++) {
      var a = i * pitch;
      addPoint(shape, rootR, a, i === 0);
      addPoint(shape, pitchR, a + pitch * 0.12);
      addPoint(shape, outerR, a + pitch * 0.22);
      addPoint(shape, outerR, a + pitch * 0.34);
      addPoint(shape, pitchR, a + pitch * 0.44);
      addPoint(shape, rootR, a + pitch * 0.56);
    }
    shape.closePath();
    var hole = new THREE.Path();
    hole.absarc(0, 0, holeR, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return shape;
  }

  function createGearGeometry(shape, outerR, depth) {
    var geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: depth * 0.045,
      bevelSize: outerR * 0.014,
      bevelSegments: 1,
      curveSegments: 24
    });
    geo.rotateX(-Math.PI / 2);
    geo.computeBoundingBox();
    geo.translate(0, -geo.boundingBox.min.y, 0);
    geo.computeBoundingBox();
    geo.computeVertexNormals();
    return geo;
  }

  function createNozzle() {
    var group = new THREE.Group();
    var dark = new THREE.MeshPhysicalMaterial({
      color: 0x1c1c1c,
      roughness: 0.42,
      metalness: 0.35
    });
    var steel = new THREE.MeshPhysicalMaterial({
      color: 0x9a9a9a,
      roughness: 0.24,
      metalness: 0.78
    });
    var brass = new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      roughness: 0.2,
      metalness: 0.7,
      emissive: 0xa07018,
      emissiveIntensity: 0.4
    });
    var tubeMat = new THREE.MeshPhysicalMaterial({
      color: 0xf2eee4,
      roughness: 0.5,
      metalness: 0.02
    });

    var carriage = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.28), dark);
    carriage.position.set(0, 0.86, 0);
    group.add(carriage);

    var shroud = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.3), dark);
    shroud.position.set(-0.02, 0.56, 0);
    group.add(shroud);

    var fanBox = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.26, 0.26), dark);
    fanBox.position.set(0.2, 0.54, 0);
    group.add(fanBox);
    var fanRing = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.035, 18), steel);
    fanRing.rotation.z = Math.PI / 2;
    fanRing.position.set(0.26, 0.54, 0);
    group.add(fanRing);
    var fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 10), steel);
    fanHub.rotation.z = Math.PI / 2;
    fanHub.position.set(0.27, 0.54, 0);
    group.add(fanHub);

    var i;
    for (i = 0; i < 4; i++) {
      var fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.022, 0.2), steel);
      fin.position.set(0, 0.36 + i * 0.038, 0);
      group.add(fin);
    }

    var breakCol = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.07, 10), steel);
    breakCol.position.set(0, 0.29, 0);
    group.add(breakCol);

    var heater = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.11, 0.15), brass);
    heater.position.set(0, 0.19, 0);
    group.add(heater);

    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.11, 8), brass);
    tip.position.set(0, 0.055, 0);
    tip.rotation.x = Math.PI;
    group.add(tip);

    var coupler = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.08, 10), steel);
    coupler.position.set(0, 1.0, 0);
    group.add(coupler);
    var bowden = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.48, 10), tubeMat);
    bowden.position.set(0, 1.26, 0);
    group.add(bowden);

    var glow = new THREE.PointLight(0xffc14d, 0.9, 1.8);
    glow.position.set(0, 0.02, 0);
    group.add(glow);

    return group;
  }

  function initScene() {
    var outerR = 1.22;
    var pitchR = 1.04;
    var rootR = 0.92;
    var holeR = 0.3;
    var depth = 0.92;
    var teeth = 14;
    var shape = createGearShape(teeth, outerR, pitchR, rootR, holeR);
    var geometry = createGearGeometry(shape, outerR, depth);
    gearHeight = geometry.boundingBox.max.y - geometry.boundingBox.min.y;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 800);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.localClippingEnabled = true;

    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);

    var layerCanvas = document.createElement("canvas");
    layerCanvas.width = 4;
    layerCanvas.height = 64;
    var lctx = layerCanvas.getContext("2d");
    var li;
    for (li = 0; li < 64; li++) {
      var lv = li % 2 ? 150 : 210;
      lctx.fillStyle = "rgb(" + lv + "," + lv + "," + lv + ")";
      lctx.fillRect(0, li, 4, 1);
    }
    var layerTex = new THREE.CanvasTexture(layerCanvas);
    layerTex.wrapS = THREE.RepeatWrapping;
    layerTex.wrapT = THREE.RepeatWrapping;
    layerTex.repeat.set(1, 10);

    var filament = new THREE.MeshPhysicalMaterial({
      color: 0xb7aea0,
      roughness: 0.46,
      metalness: 0.12,
      clearcoat: 0.12,
      clearcoatRoughness: 0.55,
      bumpMap: layerTex,
      bumpScale: 0.018,
      clippingPlanes: [clipPlane],
      clipShadows: true
    });

    var capMat = new THREE.MeshPhysicalMaterial({
      color: 0xc4b89a,
      roughness: 0.28,
      metalness: 0.22,
      clearcoat: 0.2,
      emissive: 0x6a5420,
      emissiveIntensity: 0.12,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    var capGeo = new THREE.ShapeGeometry(shape, 24);
    capGeo.rotateX(-Math.PI / 2);
    cap = new THREE.Mesh(capGeo, capMat);

    gear = new THREE.Group();
    gear.add(new THREE.Mesh(geometry, filament));
    gear.add(cap);
    scene.add(gear);

    var bedMat = new THREE.MeshPhysicalMaterial({
      color: 0x161616,
      roughness: 0.55,
      metalness: 0.25
    });
    var bed = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.66, 0.055, 48), bedMat);
    bed.position.y = -0.03;
    scene.add(bed);
    var plate = new THREE.Mesh(
      new THREE.CylinderGeometry(1.46, 1.46, 0.014, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0x2a2824,
        roughness: 0.48,
        metalness: 0.22
      })
    );
    plate.position.y = 0.006;
    scene.add(plate);
    var rimRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.455, 0.012, 8, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0xc9a227,
        roughness: 0.3,
        metalness: 0.7
      })
    );
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = 0.014;
    scene.add(rimRing);

    nozzle = createNozzle();
    scene.add(nozzle);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.7));
    var key = new THREE.DirectionalLight(0xfff6e8, 1.7);
    key.position.set(3.2, 5.4, 4.2);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xd8e4ff, 0.32);
    fill.position.set(-3.4, 1.8, 1.6);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0xc9a227, 0.55);
    rim.position.set(-2.2, 2.4, -3.2);
    scene.add(rim);
    var heat = new THREE.PointLight(0xffd27a, 0.28, 3.4);
    heat.position.set(0, 0.2, 0.2);
    scene.add(heat);

    lookTarget = new THREE.Vector3(0, gearHeight * 0.32, 0);
    camera.position.set(3.55, 1.95, 4.7);
    camera.lookAt(lookTarget);

    frame.classList.add("is-3d");
    resize();
    mapProgress(reduced ? 1 : 0);
    render();
    setupScroll();

    window.addEventListener("resize", resize);
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(frame);
    }
  }

  function setupScroll() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      mapProgress(reduced ? 1 : 0);
      render();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var headerH =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--header-inner-h")
      ) || 72;

    gsap.to({ p: 0 }, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: track,
        start: "top top+=" + headerH,
        end: function () {
          return "+=" + Math.max(1, track.offsetHeight - pin.offsetHeight);
        },
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          mapProgress(self.progress);
          render();
        }
      }
    });
  }

  function start() {
    if (layout) layout.classList.add("is-shown");
    if (!canvas) {
      showFallback();
      return;
    }
    try {
      initScene();
    } catch (err) {
      showFallback();
    }
  }

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start);
  }
})();
