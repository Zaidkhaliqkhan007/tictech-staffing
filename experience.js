(()=>{
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse=matchMedia('(pointer: coarse)').matches;
  const lowPower=(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4);
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const store={get:k=>{try{return localStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
  document.documentElement.classList.add('motion-ready');
  // Core UI remains functional even if an external Firebase module is unavailable.
  const fallbackMenu=$('#menuToggle'),fallbackNav=$('#navLinks'),fallbackHeader=$('.header');
  if(fallbackMenu&&!fallbackMenu.dataset.navBound){fallbackMenu.dataset.navBound='1';fallbackMenu.addEventListener('click',()=>{const open=fallbackNav?.classList.toggle('open');fallbackMenu.setAttribute('aria-expanded',String(Boolean(open)))})}
  addEventListener('scroll',()=>fallbackHeader?.classList.toggle('scrolled',scrollY>18),{passive:true});
  if('IntersectionObserver' in window&&!reduced){const ro=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');ro.unobserve(entry.target)}}),{threshold:.08,rootMargin:'0px 0px -4%'});$$('.reveal').forEach(el=>ro.observe(el))}else{$$('.reveal').forEach(el=>el.classList.add('visible'))}


  // Scroll progress
  const progress=$('#scrollProgress');
  let lastY=scrollY,lastT=performance.now(),velocity=0;
  function updateScroll(){
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    const p=Math.min(1,Math.max(0,scrollY/max));
    if(progress)progress.style.transform=`scaleY(${p})`;
    const now=performance.now(),dt=Math.max(16,now-lastT);
    velocity=(scrollY-lastY)/dt;lastY=scrollY;lastT=now;
    window.__tictechScrollVelocity=velocity;
  }
  updateScroll();addEventListener('scroll',updateScroll,{passive:true});

  // Lightweight neural field across the site.
  const canvas=$('#neuralField');
  if(canvas&&!reduced){
    const ctx=canvas.getContext('2d',{alpha:true});
    let w=0,h=0,dpr=1,visible=true,raf=0;
    let pointer={x:-9999,y:-9999};
    const count=coarse||lowPower?28:58;
    const nodes=Array.from({length:count},()=>({x:Math.random(),y:Math.random(),vx:(Math.random()-.5)*.00008,vy:(Math.random()-.5)*.00008,r:Math.random()*1.5+.5}));
    function resize(){dpr=Math.min(devicePixelRatio||1,1.5);w=innerWidth;h=innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
    function draw(){
      if(!visible)return;
      ctx.clearRect(0,0,w,h);
      const speed=Math.min(.0012,.00022+Math.abs(window.__tictechScrollVelocity||0)*.00018);
      for(const n of nodes){n.x+=n.vx+Math.sign(n.vx||1)*speed*.03;n.y+=n.vy;if(n.x<-.03)n.x=1.03;if(n.x>1.03)n.x=-.03;if(n.y<-.03)n.y=1.03;if(n.y>1.03)n.y=-.03}
      for(let i=0;i<nodes.length;i++){
        const a=nodes[i],ax=a.x*w,ay=a.y*h;
        for(let j=i+1;j<nodes.length;j++){
          const b=nodes[j],bx=b.x*w,by=b.y*h,dx=ax-bx,dy=ay-by,d=Math.hypot(dx,dy);
          if(d<150){ctx.strokeStyle=`rgba(82,100,255,${(1-d/150)*.075})`;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke()}
        }
        const pd=Math.hypot(ax-pointer.x,ay-pointer.y);
        if(pd<190){ctx.strokeStyle=`rgba(40,220,255,${(1-pd/190)*.12})`;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(pointer.x,pointer.y);ctx.stroke()}
        const g=ctx.createRadialGradient(ax,ay,0,ax,ay,10);g.addColorStop(0,'rgba(86,211,255,.32)');g.addColorStop(1,'rgba(86,90,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(ax,ay,10,0,Math.PI*2);ctx.fill();
      }
      raf=requestAnimationFrame(draw);
    }
    addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY},{passive:true});
    document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(visible&&!raf)draw();if(!visible){cancelAnimationFrame(raf);raf=0}});
    resize();addEventListener('resize',resize,{passive:true});draw();
  }

  // 3D card tilt with a strict desktop-only performance gate.
  function bindTilt(root=document){
    if(reduced||coarse)return;
    $$('[data-tilt]',root).forEach(card=>{
      if(card.dataset.tiltReady)return;card.dataset.tiltReady='1';
      card.addEventListener('pointermove',e=>{
        const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        card.style.setProperty('--tiltX',`${(-y*6).toFixed(2)}deg`);card.style.setProperty('--tiltY',`${(x*7).toFixed(2)}deg`);card.style.setProperty('--shineX',`${((x+.5)*100).toFixed(1)}%`);card.style.setProperty('--shineY',`${((y+.5)*100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave',()=>{card.style.setProperty('--tiltX','0deg');card.style.setProperty('--tiltY','0deg')});
    });
  }
  bindTilt();addEventListener('tictech:cards-updated',()=>bindTilt());

  // Scroll-reactive generative soundscape. No copyrighted audio files are used.
  class ScrollScore{
    constructor(button){this.button=button;this.ctx=null;this.master=null;this.filter=null;this.osc=[];this.noise=null;this.enabled=false;this.zone=-1;this.lastChime=0;this.scrollRaf=0;this.zones=$$('[data-sound-zone]');this.chords=[[110,164.81,220],[123.47,185,246.94],[130.81,196,261.63],[146.83,220,293.66],[98,146.83,196],[110,165,246.94],[123.47,196,293.66],[130.81,207.65,311.13],[98,155.56,233.08],[110,174.61,261.63]]}
    async create(){
      if(this.ctx)return;
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('Web Audio is not supported by this browser.');
      this.ctx=new AC();
      const compressor=this.ctx.createDynamicsCompressor();compressor.threshold.value=-26;compressor.knee.value=18;compressor.ratio.value=5;compressor.attack.value=.02;compressor.release.value=.45;
      this.master=this.ctx.createGain();this.master.gain.value=0;this.master.connect(compressor);compressor.connect(this.ctx.destination);
      this.filter=this.ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=900;this.filter.Q.value=.45;this.filter.connect(this.master);
      const wave=['sine','triangle','sine'];
      for(let i=0;i<3;i++){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=wave[i];o.frequency.value=this.chords[0][i];g.gain.value=i===0?.018:i===1?.012:.008;o.connect(g);g.connect(this.filter);o.start();this.osc.push({o,g})}
      // Very soft filtered noise provides air/space without a downloaded music file.
      const length=this.ctx.sampleRate*2,buf=this.ctx.createBuffer(1,length,this.ctx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*.16;
      const src=this.ctx.createBufferSource(),ng=this.ctx.createGain(),nf=this.ctx.createBiquadFilter();src.buffer=buf;src.loop=true;nf.type='bandpass';nf.frequency.value=310;nf.Q.value=.65;ng.gain.value=.018;src.connect(nf);nf.connect(ng);ng.connect(this.master);src.start();this.noise={src,ng,nf};
    }
    setLabel(){if(!this.button)return;this.button.setAttribute('aria-pressed',String(this.enabled));const label=this.button.querySelector('.sound-label');if(label)label.textContent=this.enabled?'Sound On':'Sound Off';this.button.classList.toggle('active',this.enabled)}
    async enable(){
      try{await this.create();if(this.ctx.state==='suspended')await this.ctx.resume();this.enabled=true;this.master.gain.cancelScheduledValues(this.ctx.currentTime);this.master.gain.linearRampToValueAtTime(.11,this.ctx.currentTime+.65);store.set('tictechImmersiveSound','on');this.setLabel();this.update(true)}catch(error){console.warn(error);this.enabled=false;this.setLabel()}
    }
    disable(){if(!this.ctx)return;this.enabled=false;this.master.gain.cancelScheduledValues(this.ctx.currentTime);this.master.gain.linearRampToValueAtTime(0,this.ctx.currentTime+.25);store.set('tictechImmersiveSound','off');this.setLabel();setTimeout(()=>{if(!this.enabled&&this.ctx?.state==='running')this.ctx.suspend().catch(()=>{})},420)}
    toggle(){this.enabled?this.disable():this.enable()}
    currentZone(){let best=0,bestDist=Infinity;const center=innerHeight*.48;this.zones.forEach((z,i)=>{const r=z.getBoundingClientRect(),d=Math.abs((r.top+r.bottom)/2-center);if(d<bestDist){bestDist=d;best=i}});return Number(this.zones[best]?.dataset.soundZone||best)%this.chords.length}
    chime(zone){
      if(!this.ctx||!this.enabled)return;const now=performance.now();if(now-this.lastChime<1100)return;this.lastChime=now;
      const base=this.chords[zone][1]*2,o=this.ctx.createOscillator(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();o.type='sine';o.frequency.setValueAtTime(base,this.ctx.currentTime);o.frequency.exponentialRampToValueAtTime(base*1.007,this.ctx.currentTime+.7);f.type='lowpass';f.frequency.value=1800;g.gain.setValueAtTime(.0001,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.022,this.ctx.currentTime+.018);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+.9);o.connect(f);f.connect(g);g.connect(this.master);o.start();o.stop(this.ctx.currentTime+1);
    }
    update(force=false){
      if(!this.enabled||!this.ctx)return;const zone=this.currentZone();
      if(force||zone!==this.zone){this.zone=zone;const chord=this.chords[zone];this.osc.forEach(({o},i)=>{o.frequency.cancelScheduledValues(this.ctx.currentTime);o.frequency.exponentialRampToValueAtTime(chord[i],this.ctx.currentTime+.8)});this.chime(zone)}
      const vel=Math.min(1,Math.abs(window.__tictechScrollVelocity||0)*1.8);this.filter.frequency.setTargetAtTime(760+vel*800,this.ctx.currentTime,.14);if(this.noise)this.noise.ng.gain.setTargetAtTime(.012+vel*.014,this.ctx.currentTime,.2);
    }
  }
  const soundButton=$('#soundToggle');
  if(soundButton){
    const score=new ScrollScore(soundButton);score.setLabel();soundButton.addEventListener('click',()=>score.toggle());
    addEventListener('scroll',()=>{if(score.scrollRaf)return;score.scrollRaf=requestAnimationFrame(()=>{score.scrollRaf=0;score.update()})},{passive:true});
    // Honor a previous user choice, but still wait for a fresh user gesture because browsers block autoplay.
    if(store.get('tictechImmersiveSound')==='on'){
      const resume=()=>{score.enable();removeEventListener('pointerdown',resume,true);removeEventListener('keydown',resume,true)};
      addEventListener('pointerdown',resume,true);addEventListener('keydown',resume,true);
    }
  }

  // Magnetic CTA micro-motion.
  if(!reduced&&!coarse){
    $$('.magnetic').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)*.09,y=(e.clientY-r.top-r.height/2)*.11;el.style.transform=`translate3d(${x}px,${y}px,0)`});el.addEventListener('pointerleave',()=>el.style.transform='')});
  }
})();
