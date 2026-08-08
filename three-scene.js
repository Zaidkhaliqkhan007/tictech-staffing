// TicTech Staffing V5.1 — High-performance live 3D talent network
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas=document.getElementById('globeCanvas');
if(!canvas)throw new Error('Globe canvas missing.');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const lowPower=(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4);
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!coarse&&!lowPower,powerPreference:'high-performance'});}catch(error){canvas.style.display='none';console.warn('TicTech WebGL unavailable:',error)}

if(renderer){
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(39,1,.1,100);camera.position.set(0,0,7.25);
  renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.1:lowPower?1.3:1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;
  const globe=new THREE.Group();scene.add(globe);

  // Layered core
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(2.3,72,72),new THREE.MeshBasicMaterial({color:0x03091f,transparent:true,opacity:.96})));
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(2.34,72,72),new THREE.MeshBasicMaterial({color:0x163bff,wireframe:true,transparent:true,opacity:.045})));
  globe.add(new THREE.Mesh(new THREE.IcosahedronGeometry(2.36,6),new THREE.MeshBasicMaterial({color:0x2c72ff,wireframe:true,transparent:true,opacity:.21,blending:THREE.AdditiveBlending})));
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(2.5,56,56),new THREE.MeshBasicMaterial({color:0x4b45ff,transparent:true,opacity:.06,side:THREE.BackSide,blending:THREE.AdditiveBlending})));

  // Latitude / longitude energy mesh.
  const gridGroup=new THREE.Group();
  const gridMat=new THREE.LineBasicMaterial({color:0x28cfff,transparent:true,opacity:.11,blending:THREE.AdditiveBlending});
  for(let lat=-60;lat<=60;lat+=20){const r=2.405*Math.cos(THREE.MathUtils.degToRad(lat)),y=2.405*Math.sin(THREE.MathUtils.degToRad(lat)),pts=[];for(let i=0;i<=120;i++){const a=i/120*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r))}gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),gridMat))}
  for(let lon=0;lon<180;lon+=20){const pts=[];for(let i=0;i<=120;i++){const a=i/120*Math.PI*2,phi=THREE.MathUtils.degToRad(lon);pts.push(new THREE.Vector3(2.405*Math.sin(a)*Math.cos(phi),2.405*Math.cos(a),2.405*Math.sin(a)*Math.sin(phi)))}gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),gridMat))}
  globe.add(gridGroup);

  // Surface particles.
  const pointCount=coarse?1200:lowPower?1800:3400,positions=new Float32Array(pointCount*3),colors=new Float32Array(pointCount*3);
  const c1=new THREE.Color(0x21ddff),c2=new THREE.Color(0x4075ff),c3=new THREE.Color(0xa84cff);
  for(let i=0;i<pointCount;i++){const u=Math.random(),v=Math.random(),theta=2*Math.PI*u,phi=Math.acos(2*v-1),r=2.395+Math.random()*.035;positions[i*3]=r*Math.sin(phi)*Math.cos(theta);positions[i*3+1]=r*Math.cos(phi);positions[i*3+2]=r*Math.sin(phi)*Math.sin(theta);const m=Math.random(),col=m<.48?c1.clone().lerp(c2,m/.48):c2.clone().lerp(c3,(m-.48)/.52);colors[i*3]=col.r;colors[i*3+1]=col.g;colors[i*3+2]=col.b}
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(positions,3));pg.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const pointCloud=new THREE.Points(pg,new THREE.PointsMaterial({size:coarse?.03:.036,vertexColors:true,transparent:true,opacity:.98,blending:THREE.AdditiveBlending,depthWrite:false}));globe.add(pointCloud);

  function spherePoint(radius=2.44){const t=Math.random()*Math.PI*2,p=Math.acos(2*Math.random()-1);return new THREE.Vector3(radius*Math.sin(p)*Math.cos(t),radius*Math.cos(p),radius*Math.sin(p)*Math.sin(t))}

  // Recruitment/data arcs.
  const arcs=new THREE.Group(),routeCurves=[];const arcCount=coarse?16:lowPower?26:50;
  for(let i=0;i<arcCount;i++){const a=spherePoint(),b=spherePoint(),mid=a.clone().add(b).multiplyScalar(.5).normalize().multiplyScalar(2.88+Math.random()*.9),curve=new THREE.QuadraticBezierCurve3(a,mid,b),geo=new THREE.BufferGeometry().setFromPoints(curve.getPoints(74)),color=i%3===0?0x26e1ff:i%3===1?0x3f6fff:0x9a4dff;arcs.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity:.28+Math.random()*.2,blending:THREE.AdditiveBlending})));routeCurves.push(curve)}globe.add(arcs);

  // Moving pulse packets along routes.
  const pulses=new THREE.Group(),pulseCount=coarse?5:lowPower?8:14,pulseData=[];
  for(let i=0;i<pulseCount;i++){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.035,10,10),new THREE.MeshBasicMaterial({color:i%2?0x39e4ff:0xb05cff,transparent:true,opacity:.92,blending:THREE.AdditiveBlending,depthWrite:false}));pulses.add(mesh);pulseData.push({mesh,curve:routeCurves[i%routeCurves.length],offset:Math.random(),speed:.025+Math.random()*.035})}globe.add(pulses);

  // Orbit rings.
  const rings=new THREE.Group();
  for(let i=0;i<8;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(2.88+i*.13,.008+(i%3)*.002,8,280),new THREE.MeshBasicMaterial({color:i%2?0x9c4dff:0x22dfff,transparent:true,opacity:.12+i*.012,blending:THREE.AdditiveBlending,depthWrite:false}));ring.rotation.set(Math.random()*2.4,Math.random()*2.4,Math.random()*2.4);rings.add(ring)}globe.add(rings);

  // Beacon glow texture.
  const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;const gctx=glowCanvas.getContext('2d'),grad=gctx.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.15,'rgba(53,224,255,.95)');grad.addColorStop(.48,'rgba(93,84,255,.3)');grad.addColorStop(1,'rgba(0,0,0,0)');gctx.fillStyle=grad;gctx.fillRect(0,0,64,64);const glowTexture=new THREE.CanvasTexture(glowCanvas);
  const beaconGroup=new THREE.Group(),beaconData=[];const beaconCount=coarse?12:lowPower?20:36;
  for(let i=0;i<beaconCount;i++){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:i%4===0?0xb34fff:0x3ce8ff,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));sprite.position.copy(spherePoint(2.47));const scale=.12+Math.random()*.14;sprite.scale.setScalar(scale);beaconGroup.add(sprite);beaconData.push({sprite,base:scale,phase:Math.random()*6.28})}globe.add(beaconGroup);

  // Background star volume.
  const starsCount=coarse?450:lowPower?750:1450,starPos=new Float32Array(starsCount*3);
  for(let i=0;i<starsCount;i++){const r=4+Math.random()*5,t=Math.random()*Math.PI*2,p=Math.acos(2*Math.random()-1);starPos[i*3]=r*Math.sin(p)*Math.cos(t);starPos[i*3+1]=r*Math.cos(p);starPos[i*3+2]=r*Math.sin(p)*Math.sin(t)}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(starPos,3));const stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0x6aa9ff,size:.02,transparent:true,opacity:.62,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(stars);

  // Hero lens glows.
  const halo1=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0x303dff,transparent:true,opacity:.14,blending:THREE.AdditiveBlending,depthWrite:false}));halo1.scale.set(6,6,1);scene.add(halo1);
  const halo2=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0x9b39ff,transparent:true,opacity:.09,blending:THREE.AdditiveBlending,depthWrite:false}));halo2.scale.set(4.5,4.5,1);halo2.position.set(1.2,-.7,-.3);scene.add(halo2);

  const pointer={x:0,y:0},target={x:0,y:0};
  addEventListener('pointermove',e=>{target.x=(e.clientX/innerWidth-.5)*.42;target.y=(e.clientY/innerHeight-.5)*.26},{passive:true});
  function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix()}
  resize();addEventListener('resize',resize,{passive:true});

  let active=true,heroVisible=true;document.addEventListener('visibilitychange',()=>active=!document.hidden);
  const hero=canvas.closest('.hero');if(hero&&'IntersectionObserver'in window){new IntersectionObserver(entries=>heroVisible=entries[0]?.isIntersecting??true,{rootMargin:'200px'}).observe(hero)}
  const clock=new THREE.Clock();let lastFrame=0;
  function animate(ms){requestAnimationFrame(animate);if(!active||!heroVisible)return;if((coarse||lowPower)&&ms-lastFrame<30)return;lastFrame=ms;const t=clock.getElapsedTime(),scrollRatio=Math.min(1,scrollY/Math.max(1,innerHeight));
    if(!reduced){pointer.x+=(target.x-pointer.x)*.04;pointer.y+=(target.y-pointer.y)*.04;globe.rotation.y=t*.075+pointer.x+scrollRatio*.16;globe.rotation.x+=(pointer.y-scrollRatio*.08-globe.rotation.x)*.025;globe.rotation.z=Math.sin(t*.16)*.025;rings.rotation.y=t*.045;rings.rotation.z=t*.021;arcs.rotation.y=-t*.009;gridGroup.rotation.y=t*.012;stars.rotation.y=-t*.004;pointCloud.material.size=(coarse?.028:.031)+Math.sin(t*2.1)*.004;routeCurves.length&&pulseData.forEach((d,i)=>{const p=(d.offset+t*d.speed)%1;d.mesh.position.copy(d.curve.getPoint(p));d.mesh.scale.setScalar(.75+Math.sin(t*4+i)*.24)});beaconData.forEach((d,i)=>{const s=d.base*(1+Math.sin(t*2.2+d.phase)*.32);d.sprite.scale.setScalar(s);d.sprite.material.opacity=.58+(Math.sin(t*1.9+d.phase)+1)*.17});halo1.material.opacity=.1+Math.sin(t*.7)*.025;halo2.material.opacity=.07+Math.sin(t*.53+1)*.02;camera.position.z=7.25-scrollRatio*.16}
    renderer.render(scene,camera)}
  requestAnimationFrame(animate);
}
