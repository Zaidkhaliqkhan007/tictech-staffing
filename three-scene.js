// TicTech Staffing V4 Complete — 3D Globe Engine — 2026-08-08
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas = document.getElementById("globeCanvas");
if (!canvas) throw new Error("Globe canvas missing.");

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let renderer;

try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: innerWidth > 800,
    powerPreference: "high-performance"
  });
} catch (error) {
  canvas.style.display = "none";
  console.warn("TicTech V4 WebGL unavailable:", error);
}

if (renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.15 : 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const globe = new THREE.Group();
  scene.add(globe);

  // Deep illuminated core
  globe.add(new THREE.Mesh(
    new THREE.SphereGeometry(2.32, 96, 96),
    new THREE.MeshBasicMaterial({
      color: 0x07122f,
      transparent: true,
      opacity: 0.9
    })
  ));

  // High-density geodesic surface
  globe.add(new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.36, 6),
    new THREE.MeshBasicMaterial({
      color: 0x2f73ff,
      wireframe: true,
      transparent: true,
      opacity: 0.23
    })
  ));

  // Atmosphere
  globe.add(new THREE.Mesh(
    new THREE.SphereGeometry(2.49, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x374dff,
      transparent: true,
      opacity: 0.09,
      side: THREE.BackSide
    })
  ));

  // Glowing surface nodes
  const pointCount = innerWidth < 760 ? 1500 : 3000;
  const positions = new Float32Array(pointCount * 3);
  const colors = new Float32Array(pointCount * 3);

  const cyan = new THREE.Color(0x1bdfff);
  const blue = new THREE.Color(0x4b75ff);
  const purple = new THREE.Color(0xa14dff);

  for (let i = 0; i < pointCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const radius = 2.39 + Math.random() * 0.04;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const mix = Math.random();
    const color = mix < 0.5
      ? cyan.clone().lerp(blue, mix * 2)
      : blue.clone().lerp(purple, (mix - 0.5) * 2);

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pointGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const pointCloud = new THREE.Points(
    pointGeometry,
    new THREE.PointsMaterial({
      size: 0.034,
      vertexColors: true,
      transparent: true,
      opacity: 0.96
    })
  );
  globe.add(pointCloud);

  function randomSpherePoint(radius = 2.44) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  // Animated recruitment/data routes
  const arcs = new THREE.Group();
  const arcCount = innerWidth < 760 ? 18 : 42;

  for (let i = 0; i < arcCount; i++) {
    const start = randomSpherePoint();
    const end = randomSpherePoint();
    const midpoint = start.clone()
      .add(end)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(3 + Math.random() * 0.75);

    const curve = new THREE.QuadraticBezierCurve3(start, midpoint, end);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(72));

    const routeColor =
      i % 3 === 0 ? 0x25ddff :
      i % 3 === 1 ? 0x3f71ff :
      0x934cff;

    arcs.add(new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        color: routeColor,
        transparent: true,
        opacity: 0.44
      })
    ));
  }
  globe.add(arcs);

  // Large orbit rings
  const rings = new THREE.Group();

  for (let i = 0; i < 7; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.96 + i * 0.14, 0.011, 8, 280),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? 0x8d4cff : 0x28dfff,
        transparent: true,
        opacity: 0.19
      })
    );

    ring.rotation.set(
      Math.random() * 2.2,
      Math.random() * 2.2,
      Math.random() * 2.2
    );

    rings.add(ring);
  }

  globe.add(rings);

  // Pulsing data beacons
  const beaconGroup = new THREE.Group();
  const beaconCount = innerWidth < 760 ? 14 : 32;

  for (let i = 0; i < beaconCount; i++) {
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.03 + Math.random() * 0.028, 12, 12),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? 0x2ce6ff : 0xa84fff,
        transparent: true,
        opacity: 0.98
      })
    );

    beacon.position.copy(randomSpherePoint(2.49));
    beaconGroup.add(beacon);
  }

  globe.add(beaconGroup);

  // Star field
  const starsCount = innerWidth < 760 ? 700 : 1450;
  const starPositions = new Float32Array(starsCount * 3);

  for (let i = 0; i < starsCount; i++) {
    const radius = 4.4 + Math.random() * 4.8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.cos(phi);
    starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(starPositions, 3)
  );

  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0x6daeff,
      size: 0.022,
      transparent: true,
      opacity: 0.64
    })
  );

  scene.add(stars);

  // Mouse interaction
  const pointer = { x: 0, y: 0 };

  addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / innerWidth - 0.5) * 0.4;
    pointer.y = (event.clientY / innerHeight - 0.5) * 0.25;
  }, { passive: true });

  function resize() {
    const rect = canvas.getBoundingClientRect();

    renderer.setSize(
      Math.max(1, rect.width),
      Math.max(1, rect.height),
      false
    );

    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }

  resize();
  addEventListener("resize", resize, { passive: true });

  let active = true;

  document.addEventListener("visibilitychange", () => {
    active = !document.hidden;
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    if (!active) return;

    const time = clock.getElapsedTime();

    if (!reduced) {
      globe.rotation.y = time * 0.088 + pointer.x;
      globe.rotation.x += (pointer.y - globe.rotation.x) * 0.024;

      rings.rotation.y = time * 0.052;
      rings.rotation.z = time * 0.029;

      arcs.rotation.y = -time * 0.013;
      stars.rotation.y = -time * 0.006;

      pointCloud.material.size =
        0.031 + Math.sin(time * 2.2) * 0.006;

      beaconGroup.children.forEach((beacon, index) => {
        const pulse = 1 + Math.sin(time * 2.1 + index) * 0.42;
        beacon.scale.setScalar(pulse);
      });
    }

    renderer.render(scene, camera);
  }

  animate();
}
