import * as THREE from "../vendor/three.module.js";
/* Fondo 3D con cámara en perspectiva + capa 2D de sprites originales. */
const palettes = {
  crypt: [0x101123, 0x25273f, 0x33304b, 0x75f9dd],
  water: [0x09192b, 0x17334e, 0x264c66, 0x78bdff],
  garden: [0x0b2026, 0x173c3d, 0x2e5a4b, 0xa9f1b0],
  forge: [0x251422, 0x472936, 0x693b3c, 0xffaa75],
  sky: [0x161b35, 0x303659, 0x444268, 0xc6aeff],
  ice: [0x0d1d32, 0x263f58, 0x496a82, 0xbcecff],
  core: [0x1d102b, 0x3a284b, 0x563759, 0xee85ac],
};
try {
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(1);
  renderer.setSize(320, 192, false);
  renderer.domElement.id = "threeCanvas";
  renderer.domElement.setAttribute(
    "aria-label",
    "Pixel Vania: escenario con profundidad",
  );
  document.getElementById("viewport-wrapper").prepend(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101123);
  scene.fog = new THREE.Fog(0x101123, 430, 1200);
  const camera = new THREE.PerspectiveCamera(42, 320 / 192, 1, 1600);
  camera.position.set(0, 10, 250);
  camera.lookAt(0, 0, -150);
  const box = new THREE.BoxGeometry(1, 1, 1),
    plane = new THREE.PlaneGeometry(1, 1);
  const farMat = new THREE.MeshBasicMaterial({ color: 0x25273f }),
    nearMat = new THREE.MeshBasicMaterial({ color: 0x33304b }),
    lightMat = new THREE.MeshBasicMaterial({ color: 0x75f9dd });
  // Cada altura ocupa una posición estable en el mundo. Al volver se ve el mismo edificio.
  const layers = [];
  const dummy = new THREE.Object3D();
  for (let layer = 0; layer < 3; layer++) {
    const group = new THREE.Group(),
      z = -250 - layer * 210;
    const towers = new THREE.InstancedMesh(
      box,
      layer === 2 ? farMat : nearMat,
      42,
    );
    const windows = new THREE.InstancedMesh(plane, lightMat, 126);
    for (let n = 0; n < 42; n++) {
      const h = 52 + ((n * 37 + layer * 29) % 120),
        w = 21 + ((n * 23 + layer * 13) % 34);
      const x = n * 82 - 510;
      dummy.position.set(x, -92 + h / 2, z + (n % 3) * 18);
      dummy.scale.set(w, h, 28);
      dummy.updateMatrix();
      towers.setMatrixAt(n, dummy.matrix);
      for (let j = 0; j < 3; j++) {
        dummy.position.set(
          x - w / 4 + (j * w) / 4,
          -75 + h * 0.57,
          z + 16 + (n % 3) * 18,
        );
        dummy.scale.set(2.5, 3 + (n % 2) * 2, 1);
        dummy.updateMatrix();
        windows.setMatrixAt(n * 3 + j, dummy.matrix);
      }
    }
    towers.instanceMatrix.needsUpdate = true;
    windows.instanceMatrix.needsUpdate = true;
    group.add(towers, windows);
    scene.add(group);
    layers.push({ group, layer });
  }
  // Siluetas, puentes y señales que aparecen en posiciones únicas al explorar.
  const city = new THREE.Group(),
    cityObjects = [];
  scene.add(city);
  for (let n = 0; n < 29; n++) {
    const x = n * 106 - 400,
      z = -132 - (n % 3) * 34;
    const pillar = new THREE.Mesh(box, nearMat);
    pillar.position.set(x, -28, z);
    pillar.scale.set(n % 4 === 0 ? 8 : 13, 140 + (n % 3) * 19, 12);
    city.add(pillar);
    if (n % 4 === 0) {
      const bridge = new THREE.Mesh(box, farMat);
      bridge.position.set(x + 47, 20, z - 12);
      bridge.scale.set(100, 5, 15);
      city.add(bridge);
      const lamp = new THREE.Mesh(plane, lightMat);
      lamp.position.set(x + 47, 23, z - 3);
      lamp.scale.set(15, 2, 1);
      city.add(lamp);
    }
    if (n % 5 === 1) {
      const sign = new THREE.Mesh(plane, lightMat);
      sign.position.set(x + 15, 39, z + 9);
      sign.scale.set(21, 7, 1);
      city.add(sign);
      const antenna = new THREE.Mesh(box, nearMat);
      antenna.position.set(x, -92 + 180, z);
      antenna.scale.set(2, 30, 2);
      city.add(antenna);
    }
    if (n % 4 === 2) {
      const shuttle = new THREE.Mesh(box, lightMat);
      shuttle.position.set(x + 19, 75 + (n % 3) * 12, z + 15);
      shuttle.scale.set(14, 3, 5);
      shuttle.userData.baseX = shuttle.position.x;
      city.add(shuttle);
      cityObjects.push(shuttle);
    }
  }
  const floor = new THREE.GridHelper(1500, 50, 0x36526b, 0x1e3147);
  floor.position.set(0, -92, -430);
  scene.add(floor);
  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(24, 24),
    new THREE.MeshBasicMaterial({ color: 0xa7b8cf }),
  );
  moon.position.set(156, 104, -370);
  scene.add(moon);
  const starPositions = [];
  for (let n = 0; n < 95; n++)
    starPositions.push(
      ((n * 127) % 1600) - 800,
      ((n * 67) % 300) - 30,
      -350 - ((n * 41) % 650),
    );
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPositions, 3),
  );
  const starMat = new THREE.PointsMaterial({
    color: 0xbfcfef,
    size: 1.8,
    sizeAttenuation: true,
  });
  scene.add(new THREE.Points(starGeo, starMat));
  const motifs = {};
  function mesh(group, geometry, material, x, y, z, sx, sy, sz) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.userData.baseX = x;
    group.add(m);
    return m;
  }
  for (const theme of ["garden", "forge", "water", "sky", "core", "ice"]) {
    const g = new THREE.Group();
    motifs[theme] = g;
    scene.add(g);
    g.visible = false;
    for (let n = 0; n < 28; n++) {
      const x = n * 98 - 390,
        z = -160 - (n % 3) * 60;
      if (theme === "garden") {
        mesh(g, box, nearMat, x, -18, z, 6, 155, 7);
        const m = mesh(
          g,
          new THREE.ConeGeometry(32, 65, 5),
          lightMat,
          x,
          40,
          z,
          1,
          1,
          1,
        );
        m.rotation.z = 0.1;
        mesh(
          g,
          new THREE.SphereGeometry(18, 8, 4),
          farMat,
          x + 27,
          -38,
          z + 15,
          1.7,
          0.4,
          1,
        );
        mesh(g, box, lightMat, x + 27, -58, z + 15, 3, 30, 3);
      }
      if (theme === "forge") {
        mesh(g, box, nearMat, x, -45, z, 56, 90, 45);
        mesh(g, box, lightMat, x, -38, z + 25, 20, 5, 1);
        mesh(g, box, farMat, x + 15, 35, z, 12, 150, 12);
      }
      if (theme === "water") {
        mesh(g, box, farMat, x, -5, z, 12, 175, 20);
        mesh(g, box, nearMat, x + 45, 60, z, 100, 8, 20);
        mesh(g, plane, lightMat, x + 25, -50, z + 15, 2, 60, 1);
      }
      if (theme === "ice") {
        const m = mesh(
          g,
          new THREE.ConeGeometry(22, 100, 4),
          lightMat,
          x,
          -32,
          z,
          1,
          1,
          1,
        );
        m.rotation.z = ((n % 3) - 1) * 0.2;
        mesh(g, box, nearMat, x + 28, -75, z + 12, 58, 24, 32);
      }
      if (theme === "sky") {
        const m = mesh(
          g,
          new THREE.OctahedronGeometry(14, 0),
          nearMat,
          x,
          35 + (n % 3) * 18,
          z,
          1.5,
          1,
          1,
        );
        m.rotation.z = n;
      }
      if (theme === "core") {
        const m = mesh(
          g,
          new THREE.TorusGeometry(45, 2, 4, 32),
          lightMat,
          x,
          8,
          z,
          1,
          1,
          1,
        );
        m.rotation.y = 0.6;
      }
    }
  }
  const pixelScene = new THREE.Scene(),
    pixelCamera = new THREE.OrthographicCamera(-160, 160, 96, -96, 0.1, 10);
  pixelCamera.position.z = 2;
  const source = document.getElementById("gameCanvas"),
    texture = new THREE.CanvasTexture(source);
  texture.minFilter = texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  pixelScene.add(new THREE.Mesh(new THREE.PlaneGeometry(320, 192), material));
  renderer.autoClear = false;
  let theme = null;
  window.pixelRenderer = {
    active: true,
    render(state) {
      if (theme !== state.theme) {
        theme = state.theme;
        const p = palettes[theme];
        scene.background.setHex(p[0]);
        scene.fog.color.setHex(p[0]);
        farMat.color.setHex(p[1]);
        nearMat.color.setHex(p[2]);
        lightMat.color.setHex(p[3]);
        for (const [name, g] of Object.entries(motifs))
          g.visible = name === theme;
      }
      const drift = state.cameraX;
      for (const { group, layer } of layers)
        group.position.x = -drift * (0.16 + layer * 0.095);
      city.position.x = -drift * 0.46;
      for (const shuttle of cityObjects)
        shuttle.position.x =
          shuttle.userData.baseX +
          Math.sin(state.time * 0.014 + shuttle.userData.baseX) * 17;
      for (const g of Object.values(motifs)) {
        g.position.x = -drift * 0.39;
        g.position.y = theme === "sky" ? Math.sin(state.time * 0.012) * 7 : 0;
      }
      moon.position.x = 156 - drift * 0.035;
      floor.position.x = -(drift * 0.17) % 50;
      camera.position.x = Math.sin(state.time * 0.002) * 2;
      camera.lookAt(0, 0, -150);
      texture.needsUpdate = true;
      renderer.clear();
      renderer.render(scene, camera);
      renderer.clearDepth();
      renderer.render(pixelScene, pixelCamera);
    },
  };
  source.style.visibility = "hidden";
  document.getElementById("engine-label").textContent =
    "THREE.JS · PIXEL SYSTEM";
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    window.pixelRenderer.active = false;
    source.style.visibility = "visible";
    renderer.domElement.style.display = "none";
    document.getElementById("engine-label").textContent = "PIXEL SYSTEM · 2D";
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    window.pixelRenderer.active = true;
    source.style.visibility = "hidden";
    renderer.domElement.style.display = "block";
    document.getElementById("engine-label").textContent =
      "THREE.JS · PIXEL SYSTEM";
  });
} catch (error) {
  console.warn(
    "Fondo WebGL no disponible; se mantiene el juego con parallax 2D.",
    error.message,
  );
  document.getElementById("engine-label").textContent = "PIXEL SYSTEM · 2D";
}
