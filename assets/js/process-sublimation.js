import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { DecalGeometry } from "three/addons/geometries/DecalGeometry.js";

(function () {
  var root = document.querySelector("#process-sublimation");
  if (!root) return;

  var frame = root.querySelector("[data-sub-frame]");
  var canvas = root.querySelector("[data-sub-canvas]");
  var track = root.querySelector(".process-track");
  var pin = root.querySelector(".process-sticky");
  var layout = root.querySelector(".process-layout");
  var fallbackMug = root.querySelector('[data-sub-fallback="mug"]');
  var fallbackBottle = root.querySelector('[data-sub-fallback="bottle"]');
  if (!frame || !canvas || !track || !pin) return;

  var PRODUCT_ORDER = [Math.random() < 0.5 ? "mug" : "bottle"];
  var chosenId = PRODUCT_ORDER[0];

  /** Mug print tuned to native STL units (height ≈ 47.5). Bottle print is computed after normalize. */
  var MUG_PRINT = { bodyR: 19.2, yaw: -0.14, printW: 24, depth: 12, yFactor: 0.5 };

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var startY = 0;
  var state = { fade: 0, turn: 0 };
  var activeId = chosenId;
  var products = {};
  var renderer = null;
  var camera = null;
  var scene = null;
  var mugHeight = 47.5;

  function showFallback() {
    frame.classList.add("is-fallback");
    if (layout) layout.classList.add("is-shown");
    setActiveProduct(chosenId, true);
  }

  function setFallbackVisible(id) {
    if (fallbackMug) {
      if (id === "mug") fallbackMug.removeAttribute("hidden");
      else fallbackMug.setAttribute("hidden", "");
    }
    if (fallbackBottle) {
      if (id === "bottle") fallbackBottle.removeAttribute("hidden");
      else fallbackBottle.setAttribute("hidden", "");
    }
  }

  /** Fit camera from a precomputed local AABB (ignores print decal / rotation). */
  function frameCamera(id) {
    if (!camera) return;
    var entry = products[id];
    if (!entry || !entry.bounds) return;

    var box = entry.frameBounds || entry.bounds;
    var h = box.max.y - box.min.y;
    if (h <= 0) return;

    var lookY = box.min.y + h * 0.48;
    var fov = 26;
    var padW = id === "bottle" ? 1.55 : 1.45;
    var padH = id === "bottle" ? 0.82 : 0.78;
    var zoom = id === "bottle" ? 1.42 : 1.35;
    var halfW = Math.max(Math.abs(box.min.x), Math.abs(box.max.x)) * padW;
    var halfH = h * padH;
    var dist = (Math.max(halfW, halfH) / Math.tan((fov * Math.PI) / 360)) * zoom;

    camera.fov = fov;
    camera.near = 0.1;
    camera.far = Math.max(800, dist * 4);
    camera.position.set(0, lookY + h * 0.02, dist);
    // Mug keeps a slight left bias; bottle is centered for a cleaner front print.
    camera.lookAt(id === "bottle" ? 0 : -2, lookY, 0);
    camera.updateProjectionMatrix();
  }

  function setActiveProduct(id, instant) {
    activeId = id;
    frame.setAttribute("data-active", id);
    setFallbackVisible(id);
    Object.keys(products).forEach(function (key) {
      var entry = products[key];
      if (!entry || !entry.group) return;
      entry.group.visible = key === id;
      // Reset print so each product replays fade-in like the mug.
      if (entry.printMesh) {
        entry.printMesh.material.opacity = 0;
        entry.printMesh.visible = false;
      }
    });
    frameCamera(id);
  }

  function applyState() {
    var entry = products[activeId];
    if (entry && entry.printMesh) {
      entry.printMesh.material.opacity = state.fade;
      entry.printMesh.visible = state.fade > 0.02;
    }
    if (entry && entry.group) {
      var base = typeof entry.startY === "number" ? entry.startY : startY;
      var amount =
        typeof entry.turnAmount === "number" ? entry.turnAmount : Math.PI * 0.26;
      entry.group.rotation.y = base - state.turn * amount;
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

  function makePrintTexture() {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement("canvas");
        // Keep the logo's native aspect — no uneven padding that squashes it on wraps.
        c.width = 2048;
        c.height = Math.max(1, Math.round(2048 * (img.height / img.width)));
        var ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        var tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        resolve({ tex: tex, aspect: c.width / c.height });
      };
      img.onerror = reject;
      img.src = "assets/logo/logo-full.svg";
    });
  }

  function ceramicMaterial() {
    return new THREE.MeshPhysicalMaterial({
      color: 0xf3efe8,
      roughness: 0.22,
      metalness: 0,
      clearcoat: 0.45,
      clearcoatRoughness: 0.24
    });
  }

  function metalMaterial(color) {
    return new THREE.MeshPhysicalMaterial({
      color: color || 0xe8ecf1,
      roughness: 0.36,
      metalness: 0.42,
      clearcoat: 0.28,
      clearcoatRoughness: 0.35
    });
  }

  /** Match the original mug pipeline: rotate, sit on y=0, keep native units (no X recenter). */
  function prepareMugGeometry(geometry) {
    var g = geometry;
    g.rotateX(-Math.PI / 2);
    g.computeBoundingBox();
    g.translate(0, -g.boundingBox.min.y, 0);
    g.computeBoundingBox();
    g.computeVertexNormals();
    return g;
  }

  /**
   * Scale/center OBJ so height matches mugHeight and the group sits on y=0.
   * Three.js applies scale before position, so translation must include scale.
   */
  function normalizeBottleGroup(object, targetH) {
    var group = new THREE.Group();
    group.add(object);

    object.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(object);
    var center = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3());
    if (size.y <= 0) {
      return { group: group, bounds: box };
    }

    var s = targetH / size.y;
    object.scale.setScalar(s);
    object.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    object.updateMatrixWorld(true);

    var worldBox = new THREE.Box3().setFromObject(group);
    return { group: group, bounds: worldBox };
  }

  function findBottleBodyMesh(root) {
    var body = null;
    var fallback = null;
    var maxVerts = 0;
    root.traverse(function (child) {
      if (!child.isMesh || !child.geometry) return;
      var matName = (child.material && child.material.name) || child.name || "";
      var lower = String(matName).toLowerCase();
      if (
        lower.indexOf("borraccia_main") !== -1 ||
        (lower.indexOf("main") !== -1 &&
          lower.indexOf("gancio") === -1 &&
          lower.indexOf("tappo") === -1)
      ) {
        body = child;
      }
      var pos = child.geometry.getAttribute("position");
      var count = pos ? pos.count : 0;
      // Prefer the actual bottle shell over the denser carabiner mesh.
      if (lower.indexOf("gancio") === -1 && lower.indexOf("tappo") === -1 && count > maxVerts) {
        maxVerts = count;
        fallback = child;
      }
    });
    return body || fallback;
  }

  function makePrintMaterial(print) {
    return new THREE.MeshBasicMaterial({
      map: print.tex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      alphaTest: 0.015,
      polygonOffset: true,
      polygonOffsetFactor: -12,
      polygonOffsetUnits: -12,
      toneMapped: false,
      side: THREE.FrontSide
    });
  }

  /**
   * Project logo onto a mesh surface (mug).
   * DecalGeometry writes in the mesh local space — keep print as a child.
   */
  function addSurfaceDecal(targetMesh, cfg, print) {
    if (!targetMesh) return null;
    targetMesh.updateMatrixWorld(true);

    var printH = cfg.printW / print.aspect;
    var depth = cfg.depth || 12;
    var yaw = cfg.yaw || 0;

    if (!targetMesh.geometry.boundingBox) targetMesh.geometry.computeBoundingBox();
    var box = targetMesh.geometry.boundingBox;
    var localH = Math.max(0.001, box.max.y - box.min.y);
    var worldPos = new THREE.Vector3(
      Math.sin(yaw) * cfg.bodyR,
      box.min.y + localH * cfg.yFactor,
      Math.cos(yaw) * cfg.bodyR
    );
    targetMesh.localToWorld(worldPos);

    var decalGeo = new DecalGeometry(
      targetMesh,
      worldPos,
      new THREE.Euler(0, yaw, 0),
      new THREE.Vector3(cfg.printW, printH, depth)
    );
    var printMesh = new THREE.Mesh(decalGeo, makePrintMaterial(print));
    printMesh.renderOrder = 2;
    targetMesh.add(printMesh);
    return printMesh;
  }

  /**
   * Logo on a front arc with the logo's true aspect (no UV squash).
   */
  function addBottleWrapPrint(bodyMesh, group, print) {
    if (!bodyMesh) return null;
    group.updateMatrixWorld(true);
    bodyMesh.updateMatrixWorld(true);

    var box = new THREE.Box3().setFromObject(bodyMesh);
    var size = box.getSize(new THREE.Vector3());
    var radius = Math.min(size.x, size.z) * 0.5 * 1.006;
    if (radius < 0.5) radius = mugHeight * 0.18;

    var aspect = print.aspect > 0.01 ? print.aspect : 2.27;
    // Start from a comfortable height, then shrink to fit a front-facing arc
    // while ALWAYS keeping width/height = logo aspect (never clamp theta alone).
    var printH = Math.min(size.y * 0.26, mugHeight * 0.3);
    var printW = printH * aspect;
    var maxTheta = 1.15;
    var theta = printW / radius;
    if (theta > maxTheta) {
      theta = maxTheta;
      printW = radius * theta;
      printH = printW / aspect;
    }

    // Build from a plane with exact aspect, then bend onto the cylinder.
    // Plane UVs stay correct; CylinderGeometry + clamped theta was squashing them.
    var geo = new THREE.PlaneGeometry(printW, printH, 48, 1);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i);
      var y = pos.getY(i);
      var angle = x / radius;
      pos.setXYZ(i, Math.sin(angle) * radius, y, Math.cos(angle) * radius);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    var printMesh = new THREE.Mesh(geo, makePrintMaterial(print));
    printMesh.renderOrder = 2;

    var localMin = box.min.clone();
    var localMax = box.max.clone();
    group.worldToLocal(localMin);
    group.worldToLocal(localMax);
    var localCenter = box.getCenter(new THREE.Vector3());
    group.worldToLocal(localCenter);

    printMesh.position.set(
      localCenter.x,
      localMin.y + (localMax.y - localMin.y) * 0.42,
      localCenter.z
    );
    group.add(printMesh);
    return printMesh;
  }

  function buildMug(geometry, print) {
    var g = prepareMugGeometry(geometry);
    var box = g.boundingBox.clone();
    mugHeight = box.max.y - box.min.y;

    var group = new THREE.Group();
    var mesh = new THREE.Mesh(g, ceramicMaterial());
    group.add(mesh);
    group.visible = false;

    var printMesh = addSurfaceDecal(mesh, MUG_PRINT, print);
    return {
      group: group,
      printMesh: printMesh,
      mesh: mesh,
      bounds: box,
      startY: 0
    };
  }

  function buildBottle(objRoot, print) {
    var normalized = normalizeBottleGroup(objRoot, mugHeight);
    var group = normalized.group;
    group.visible = false;

    // Keep original OBJ normals (smooth). Only fill missing normals — never rebuild.
    objRoot.traverse(function (child) {
      if (!child.isMesh) return;
      var name = (child.material && child.material.name) || child.name || "";
      var lower = String(name).toLowerCase();
      if (lower.indexOf("tappo") !== -1) {
        child.material = metalMaterial(0x2a2e33);
      } else if (lower.indexOf("gancio") !== -1) {
        child.material = metalMaterial(0x6b737c);
      } else {
        child.material = metalMaterial(0xf2f4f7);
      }
      child.material.name = name;
      child.material.flatShading = false;
      if (!child.geometry.getAttribute("normal")) {
        child.geometry.computeVertexNormals();
      }
    });

    group.updateMatrixWorld(true);
    var body = findBottleBodyMesh(group);
    var printMesh = addBottleWrapPrint(body, group, print);

    // Frame on the bottle body (ignore carabiner swing) for cleaner composition.
    var frameBounds = body
      ? new THREE.Box3().setFromObject(body)
      : normalized.bounds.clone();
    // Convert world body box into group-local for framing while group is identity.
    group.updateMatrixWorld(true);
    var inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
    frameBounds = frameBounds.clone().applyMatrix4(inv);

    return {
      group: group,
      printMesh: printMesh,
      mesh: body,
      bounds: normalized.bounds.clone(),
      frameBounds: frameBounds,
      startY: 0,
      turnAmount: Math.PI * 0.26
    };
  }

  function productIndexAt(progress) {
    var count = PRODUCT_ORDER.length;
    return Math.min(count - 1, Math.floor(progress * count));
  }

  function localProgress(progress, index) {
    var count = PRODUCT_ORDER.length;
    var start = index / count;
    var end = (index + 1) / count;
    return (progress - start) / (end - start);
  }

  function mapProgress(p) {
    var idx = productIndexAt(p);
    var id = PRODUCT_ORDER[idx];
    if (id !== activeId) setActiveProduct(id);

    var local = localProgress(p, idx);
    local = Math.min(1, Math.max(0, local));

    var fade = reduced ? 1 : Math.min(1, Math.max(0, (local - 0.08) / 0.32));
    var turn = reduced ? 0.35 : Math.min(1, Math.max(0, (local - 0.44) / 0.5));
    state.fade = fade;
    state.turn = turn;
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

    function scrubRange() {
      var viewH = Math.max(1, window.innerHeight - headerH);
      var pinH = Math.min(pin.offsetHeight || 0, viewH);
      var travel = (track.offsetHeight || 0) - pinH;
      if (travel < 96) {
        return { start: "top 70%", end: "bottom 32%" };
      }
      return { start: "top top+=" + headerH, end: "+=" + Math.max(1, travel) };
    }

    gsap.to({ p: 0 }, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: track,
        start: function () {
          return scrubRange().start;
        },
        end: function () {
          return scrubRange().end;
        },
        scrub: 0.45,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          mapProgress(self.progress);
          render();
        }
      }
    });
  }

  function initScene(model, print) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(26, 1, 0.1, 2000);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    pmrem.dispose();

    if (chosenId === "bottle") {
      products.bottle = buildBottle(model, print);
      scene.add(products.bottle.group);
    } else {
      products.mug = buildMug(model, print);
      scene.add(products.mug.group);
    }

    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2a2a, 0.7));
    var key = new THREE.DirectionalLight(0xfff6e8, 1.8);
    key.position.set(16, 32, 28);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xd8e4ff, 0.35);
    fill.position.set(-20, 8, 10);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0xc9a227, 0.28);
    rim.position.set(-12, 18, -22);
    scene.add(rim);

    frame.classList.add("is-3d");
    setActiveProduct(chosenId, true);
    resize();
    mapProgress(reduced ? 1 : 0);
    render();
    setupScroll();

    window.addEventListener("resize", resize);
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(frame);
    }
  }

  function start() {
    if (layout) layout.classList.add("is-shown");
    setFallbackVisible(chosenId);

    var model =
      chosenId === "bottle"
        ? new OBJLoader().loadAsync("assets/process/borraccia.obj")
        : new STLLoader().loadAsync("assets/process/mug.stl");

    Promise.all([model, makePrintTexture()])
      .then(function (parts) {
        if (!parts[0] || !parts[1]) throw new Error("missing assets");
        initScene(parts[0], parts[1]);
      })
      .catch(function () {
        showFallback();
      });
  }

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start);
  }
})();
