import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas = document.getElementById("networkCanvas");
const fallback = document.getElementById("webglFallback");
if (!canvas) throw new Error("Network canvas missing.");

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let renderer;

try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: innerWidth > 900,
    powerPreference: "high-performance"
  });
} catch (error) {
  fallback.style.display = "block";
  canvas.style.display = "none";
  console.warn("WebGL unavailable.", error);
}

if (renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
  camera.position.set(0, 0, 6.8);

  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.15 : 1.55));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const group = new THREE.Group();
  scene.add(group);

  const globeGeometry = new THREE.IcosahedronGeometry(2.05, 3);
  const globeMaterial = new THREE.MeshBasicMaterial({
    color: 0x218aff,
    wireframe: true,
    transparent: true,
    opacity: .23
  });
  const globe = new THREE.Mesh(globeGeometry, globeMaterial);
  group.add(globe);

  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.95, 4),
    new THREE.MeshBasicMaterial({
      color: 0x06255b,
      transparent: true,
      opacity: .34,
      side: THREE.DoubleSide
    })
  );
  group.add(inner);

  const nodePositions = globeGeometry.attributes.position.array;
  const nodes = new THREE.Points(
    globeGeometry,
    new THREE.PointsMaterial({
      color: 0x72e2ff,
      size: .035,
      transparent: true,
      opacity: .9,
      sizeAttenuation: true
    })
  );
  group.add(nodes);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(2.62, .012, 8, 220),
    new THREE.MeshBasicMaterial({ color: 0x4cdbff, transparent: true, opacity: .35 })
  );
  halo.rotation.set(1.12, .18, .38);
  group.add(halo);

  const haloTwo = new THREE.Mesh(
    new THREE.TorusGeometry(2.38, .01, 8, 220),
    new THREE.MeshBasicMaterial({ color: 0xffd400, transparent: true, opacity: .22 })
  );
  haloTwo.rotation.set(-.62, .74, -.15);
  group.add(haloTwo);

  const starCount = innerWidth < 700 ? 420 : 780;
  const starGeometry = new THREE.BufferGeometry();
  const stars = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 3.2 + Math.random() * 3.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    stars[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    stars[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    stars[i * 3 + 2] = r * Math.cos(phi);
  }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(stars, 3));
  const starField = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0x7edfff, size: .022, transparent: true, opacity: .45 })
  );
  scene.add(starField);

  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / innerWidth - .5) * .42;
    pointer.y = (event.clientY / innerHeight - .5) * .28;
  }, { passive: true });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener("resize", resize, { passive: true });

  let active = true;
  document.addEventListener("visibilitychange", () => active = !document.hidden);

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    if (!active) return;
    const t = clock.getElapsedTime();
    if (!reducedMotion) {
      group.rotation.y = t * .11 + pointer.x;
      group.rotation.x += (pointer.y - group.rotation.x) * .025;
      halo.rotation.z = t * .08;
      haloTwo.rotation.z = -t * .065;
      starField.rotation.y = -t * .007;
      nodes.material.size = .032 + Math.sin(t * 1.8) * .006;
    }
    renderer.render(scene, camera);
  }
  animate();
}
