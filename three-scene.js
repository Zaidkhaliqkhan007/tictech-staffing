import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas = document.getElementById("globeCanvas");
if (!canvas) throw new Error("Globe canvas missing.");

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:innerWidth > 800, powerPreference:"high-performance" });
} catch (error) {
  canvas.style.display = "none";
  console.warn(error);
}

if (renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42,1,.1,100);
  camera.position.set(0,0,7);

  renderer.setClearColor(0x000000,0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 720 ? 1.15 : 1.55));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const globe = new THREE.Group();
  scene.add(globe);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.15,64,64),
    new THREE.MeshBasicMaterial({color:0x080f3a,transparent:true,opacity:.72})
  );
  globe.add(sphere);

  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.18,5),
    new THREE.MeshBasicMaterial({color:0x2e72ff,wireframe:true,transparent:true,opacity:.18})
  );
  globe.add(wire);

  const pointCount = innerWidth < 720 ? 900 : 1750;
  const points = new Float32Array(pointCount * 3);
  const colors = new Float32Array(pointCount * 3);
  const colorA = new THREE.Color(0x20d9ff);
  const colorB = new THREE.Color(0x8f4bff);

  for (let i=0;i<pointCount;i++) {
    const u = Math.random(), v = Math.random();
    const theta = 2*Math.PI*u, phi = Math.acos(2*v-1);
    const r = 2.19 + Math.random()*.035;
    points[i*3] = r*Math.sin(phi)*Math.cos(theta);
    points[i*3+1] = r*Math.cos(phi);
    points[i*3+2] = r*Math.sin(phi)*Math.sin(theta);
    const c = colorA.clone().lerp(colorB,Math.random());
    colors[i*3]=c.r; colors[i*3+1]=c.g; colors[i*3+2]=c.b;
  }
  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute("position",new THREE.BufferAttribute(points,3));
  pointGeometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
  const pointCloud = new THREE.Points(pointGeometry,new THREE.PointsMaterial({size:.032,vertexColors:true,transparent:true,opacity:.95}));
  globe.add(pointCloud);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.27,48,48),
    new THREE.MeshBasicMaterial({color:0x244dff,transparent:true,opacity:.07,side:THREE.BackSide})
  );
  globe.add(atmosphere);

  function randomSpherePoint(radius=2.25) {
    const t = Math.random()*Math.PI*2, p = Math.acos(2*Math.random()-1);
    return new THREE.Vector3(radius*Math.sin(p)*Math.cos(t),radius*Math.cos(p),radius*Math.sin(p)*Math.sin(t));
  }

  const arcs = new THREE.Group();
  for (let i=0;i<(innerWidth<720?10:22);i++) {
    const a = randomSpherePoint(), b = randomSpherePoint();
    const mid = a.clone().add(b).multiplyScalar(.5).normalize().multiplyScalar(2.7+Math.random()*.5);
    const curve = new THREE.QuadraticBezierCurve3(a,mid,b);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(60));
    const line = new THREE.Line(geometry,new THREE.LineBasicMaterial({color:i%2?0x2bdcff:0x8d4bff,transparent:true,opacity:.34}));
    arcs.add(line);
  }
  globe.add(arcs);

  const rings = new THREE.Group();
  for (let i=0;i<4;i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.75+i*.13,.009,8,220),
      new THREE.MeshBasicMaterial({color:i%2?0x8c4cff:0x2bdcff,transparent:true,opacity:.2})
    );
    ring.rotation.set(Math.random()*2,Math.random()*2,Math.random()*2);
    rings.add(ring);
  }
  globe.add(rings);

  const starsCount = innerWidth<720?450:900;
  const starPos = new Float32Array(starsCount*3);
  for(let i=0;i<starsCount;i++){
    const r=4+Math.random()*4, t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1);
    starPos[i*3]=r*Math.sin(p)*Math.cos(t); starPos[i*3+1]=r*Math.cos(p); starPos[i*3+2]=r*Math.sin(p)*Math.sin(t);
  }
  const starGeo=new THREE.BufferGeometry(); starGeo.setAttribute("position",new THREE.BufferAttribute(starPos,3));
  const starField=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x579bff,size:.018,transparent:true,opacity:.55}));
  scene.add(starField);

  const pointer={x:0,y:0};
  addEventListener("pointermove",e=>{pointer.x=(e.clientX/innerWidth-.5)*.35;pointer.y=(e.clientY/innerHeight-.5)*.22},{passive:true});

  function resize(){
    const rect=canvas.getBoundingClientRect();
    renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);
    camera.aspect=rect.width/rect.height; camera.updateProjectionMatrix();
  }
  resize(); addEventListener("resize",resize,{passive:true});

  let active=true; document.addEventListener("visibilitychange",()=>active=!document.hidden);
  const clock=new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    if(!active)return;
    const t=clock.getElapsedTime();
    if(!reduced){
      globe.rotation.y=t*.09+pointer.x;
      globe.rotation.x+=(pointer.y-globe.rotation.x)*.025;
      rings.rotation.y=t*.055;
      rings.rotation.z=t*.025;
      starField.rotation.y=-t*.008;
      pointCloud.material.size=.029+Math.sin(t*2)*.005;
    }
    renderer.render(scene,camera);
  }
  animate();
}
