import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore,collection,addDoc,onSnapshot,query,orderBy,limit,serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { firebaseConfig, FORM_ENDPOINT } from "./firebase-config.js";

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v="")=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const state={jobs:[],reviews:[],firebaseReady:false};
const store={get:k=>{try{return localStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
let db=null;

try{
  const firebaseApp=initializeApp(firebaseConfig);
  db=getFirestore(firebaseApp);
  state.firebaseReady=true;
}catch(error){
  console.error("TicTech Firebase initialization failed:",error);
}

// Navigation
const header=$(".header"), menu=$("#menuToggle"), nav=$("#navLinks");
if(menu)menu.dataset.navBound='1';
const syncHeader=()=>header?.classList.toggle("scrolled",scrollY>18);
syncHeader(); addEventListener("scroll",syncHeader,{passive:true});
menu?.addEventListener("click",()=>{const open=nav?.classList.toggle("open");menu.setAttribute("aria-expanded",String(Boolean(open)))});
$$('.nav-links a').forEach(a=>a.addEventListener('click',()=>{nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false')}));

// Cursor light
const glow=$("#cursorGlow");
addEventListener("pointermove",e=>{if(glow){glow.style.left=`${e.clientX}px`;glow.style.top=`${e.clientY}px`}},{passive:true});

// Reveal animations
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
if('IntersectionObserver' in window && !reduced){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.1,rootMargin:'0px 0px -5%'});
  $$('.reveal').forEach(el=>observer.observe(el));
}else{$$('.reveal').forEach(el=>el.classList.add('visible'))}

// Count-up, using only already-published site values.
if('IntersectionObserver' in window && !reduced){
  const counterObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    const el=entry.target,target=Number(el.dataset.count||0),suffix=el.dataset.suffix||'';
    const start=performance.now(),duration=850;
    const tick=now=>{const p=Math.min(1,(now-start)/duration);const eased=1-Math.pow(1-p,3);el.textContent=`${Math.round(target*eased)}${suffix}`;if(p<1)requestAnimationFrame(tick)};
    requestAnimationFrame(tick);counterObserver.unobserve(el);
  }),{threshold:.6});
  $$('[data-count]').forEach(el=>counterObserver.observe(el));
}

function dateLabel(ts){
  try{return ts?.toDate?ts.toDate().toLocaleDateString('en-US',{month:'short',day:'numeric'}):'Recently posted'}catch{return 'Recently posted'}
}
function jobCards(jobs){
  return jobs.map(job=>`<article class="job-card" data-tilt>
    <div class="job-card-top"><span class="job-badge">${esc(job.type||'Opportunity')}</span><small>${dateLabel(job.createdAt)}</small></div>
    <h3>${esc(job.title||'Technology Opportunity')}</h3>
    <p>${esc(job.location||'United States')} ${job.salary?`• <span class="salary">${esc(job.salary)}</span>`:''}</p>
    <p>${esc(job.summary||'View this technology opportunity and submit your profile.')}</p>
    <a href="${esc(job.applyUrl||'candidate.html')}">View Opportunity <span>→</span></a>
  </article>`).join('');
}

function renderHomeJobs(){
  const wrap=$("#homeJobs"); if(!wrap)return;
  const queryText=($("#homeJobSearch")?.value||'').trim().toLowerCase();
  const queryLocation=($("#homeLocationSearch")?.value||'').trim().toLowerCase();
  const filtered=state.jobs.filter(job=>{
    const hay=`${job.title||''} ${job.skills||''} ${job.summary||''}`.toLowerCase();
    const loc=String(job.location||'').toLowerCase();
    return(!queryText||hay.includes(queryText))&&(!queryLocation||loc.includes(queryLocation));
  }).slice(0,6);
  wrap.innerHTML=filtered.length?jobCards(filtered):`<div class="loading-card premium-empty"><span class="empty-pulse"></span><div><b>${state.jobs.length?'No matching live roles':'No live roles posted right now'}</b><p>${state.jobs.length?'Try a broader search or open the full Job Center.':'Submit your profile to join the talent network for future aligned opportunities.'}</p><a href="candidate.html">Join Talent Network →</a></div></div>`;
  window.dispatchEvent(new CustomEvent('tictech:cards-updated'));
}

$("#homeJobSearch")?.addEventListener('input',renderHomeJobs);
$("#homeLocationSearch")?.addEventListener('input',renderHomeJobs);

if(db){
  try{
    onSnapshot(query(collection(db,'jobs'),orderBy('createdAt','desc'),limit(12)),snap=>{
      state.jobs=snap.docs.map(d=>({id:d.id,...d.data()}));renderHomeJobs();updateAssistantContext();
    },error=>{console.warn('Live jobs unavailable:',error);const wrap=$("#homeJobs");if(wrap)wrap.innerHTML=`<div class="loading-card premium-empty"><span class="empty-pulse"></span><div><b>Live jobs are temporarily unavailable</b><p>Please open the Job Center later or submit your profile for future consideration.</p><a href="candidate.html">Submit Profile →</a></div></div>`});
  }catch(error){console.warn(error)}
}else renderHomeJobs();

async function notify(payload){
  if(!FORM_ENDPOINT||FORM_ENDPOINT.includes('YOUR_FORM_ID'))return true;
  const fd=new FormData();Object.entries(payload).forEach(([k,v])=>fd.append(k,v??''));
  const response=await fetch(FORM_ENDPOINT,{method:'POST',body:fd,headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('Notification service returned an error.');
  return true;
}

// Employer request form
$("#employerForm")?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget,msg=$("#employerMessage"),button=form.querySelector('button[type="submit"]'),data=Object.fromEntries(new FormData(form).entries());
  if(data.website)return;
  if(!db){msg.textContent='Online submission is temporarily unavailable. Please email info@tictechstaffing.com.';return}
  button.disabled=true;const old=button.textContent;button.textContent='Sending Securely…';msg.textContent='';
  try{
    const record={company:String(data.company||'').trim(),name:String(data.name||'').trim(),email:String(data.email||'').trim(),phone:String(data.phone||'').trim(),role:String(data.role||'').trim(),details:String(data.details||'').trim(),status:'new',createdAt:serverTimestamp()};
    await addDoc(collection(db,'employerRequests'),record);
    try{await notify({subject:'New employer request',...record})}catch(error){console.warn(error)}
    form.reset();msg.textContent='Request received. TicTech Staffing will follow up during business hours.';
  }catch(error){console.error(error);msg.textContent='Submission failed. Please email info@tictechstaffing.com or call (516) 667-0017.'}
  finally{button.disabled=false;button.textContent=old}
});

// Reviews
const reviewStream=$("#reviewStream"),reviewForm=$("#reviewForm"),ratingInput=$("#reviewRating");
function renderReviews(){
  if(!reviewStream)return;
  const visible=state.reviews.slice(0,6);
  reviewStream.innerHTML=visible.length?visible.map(r=>`<article class="review-card" data-tilt><div class="review-stars">${'★'.repeat(Math.max(1,Math.min(5,Number(r.rating)||5)))}</div><p>“${esc(r.comment||'')}”</p><strong>${esc(r.firstName||'Client')} ${esc(r.lastInitial?`${r.lastInitial}.`:'')}</strong></article>`).join(''):`<div class="review-empty"><span>✦</span><b>Approved feedback will appear here.</b><small>Reviews are moderated before publication.</small></div>`;
  window.dispatchEvent(new CustomEvent('tictech:cards-updated'));
}
if(db){
  try{onSnapshot(query(collection(db,'reviews'),orderBy('createdAt','desc'),limit(12)),snap=>{state.reviews=snap.docs.map(d=>({id:d.id,...d.data()}));renderReviews()},()=>renderReviews())}catch{renderReviews()}
}else renderReviews();

$$('#reviewStars button').forEach(button=>button.addEventListener('click',()=>{
  const value=Number(button.dataset.rating||0);ratingInput.value=String(value);
  $$('#reviewStars button').forEach(star=>star.classList.toggle('selected',Number(star.dataset.rating)<=value));
}));

reviewForm?.addEventListener('submit',async e=>{
  e.preventDefault();const form=e.currentTarget,msg=$("#reviewMessage"),button=form.querySelector('button[type="submit"]'),data=Object.fromEntries(new FormData(form).entries());
  if(data.website)return;
  const rating=Number(data.rating||0);
  if(rating<1||rating>5){msg.textContent='Please select a star rating.';return}
  if(!db){msg.textContent='Online review submission is temporarily unavailable.';return}
  button.disabled=true;const old=button.textContent;button.textContent='Submitting…';msg.textContent='';
  try{
    await addDoc(collection(db,'reviewSubmissions'),{firstName:String(data.firstName||'').trim(),lastName:String(data.lastName||'').trim(),email:String(data.email||'').trim(),rating,comment:String(data.comment||'').trim(),status:'pending',createdAt:serverTimestamp()});
    form.reset();ratingInput.value='';$$('#reviewStars button').forEach(star=>star.classList.remove('selected'));msg.textContent='Thank you. Your review was received and is pending moderation.';
  }catch(error){console.error(error);msg.textContent='Review submission failed. Please try again later.'}
  finally{button.disabled=false;button.textContent=old}
});

// Assistant is always available as a website guide; published business hours are provided on request.
// Context-aware website assistant. It only references data available on the site.
const panel=$("#assistantPanel"),messages=$("#assistantMessages"),input=$("#assistantInput"),status=$("#assistantStatus");
if(status)status.textContent='Online • Site Assistant';
function updateAssistantContext(){const el=$("#assistantContext");if(el)el.textContent=`${state.jobs.length} Live Job${state.jobs.length===1?'':'s'} • Profiles • Employer Support`}
updateAssistantContext();
function scrollToId(id){document.getElementById(id)?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'})}
function addMessage(text,type='bot',delay=0){
  return new Promise(resolve=>setTimeout(()=>{if(!messages){resolve();return}const p=document.createElement('p');p.className=type;p.textContent=text;messages.appendChild(p);messages.scrollTop=messages.scrollHeight;resolve()},delay));
}
function typing(on=true){let el=$("#assistantTyping");if(on&&!el){el=document.createElement('p');el.id='assistantTyping';el.className='bot typing';el.innerHTML='<i></i><i></i><i></i>';messages?.appendChild(el);messages.scrollTop=messages.scrollHeight}else if(!on)el?.remove()}
function answer(text){
  const t=text.toLowerCase();
  if(t.includes('job')||t.includes('role')||t.includes('opening')||t.includes('position')){
    if(state.jobs.length){const newest=state.jobs[0];return{message:`There ${state.jobs.length===1?'is':'are'} ${state.jobs.length} live ${state.jobs.length===1?'opportunity':'opportunities'} currently loaded. The newest is ${newest.title}${newest.location?` in ${newest.location}`:''}. Open the Job Center to search all live roles.`,action:'jobs'}}
    return{message:'No live roles are posted right now. You can submit one profile to join the talent network for future aligned opportunities.',action:'profile'};
  }
  if(t.includes('resume')||t.includes('profile')||t.includes('candidate')||t.includes('apply'))return{message:'Use Submit Profile to enter your contact information, primary role, and upload a PDF or Word resume up to 10 MB.',action:'profile'};
  if(t.includes('hire')||t.includes('employer')||t.includes('talent')||t.includes('staffing'))return{message:'TicTech Staffing supports contract, contract-to-hire, and direct-hire technology recruiting nationwide. Use Request Talent to send the role, location, skills, timeline, and hiring details.',action:'employers'};
  if(t.includes('hour')||t.includes('open')||t.includes('time'))return{message:'Business hours are Monday–Friday, 9:30 AM–5:00 PM EST. The site can still accept profile and employer submissions outside business hours.'};
  if(t.includes('phone')||t.includes('call'))return{message:'The TicTech Staffing business phone number is (516) 667-0017.'};
  if(t.includes('email'))return{message:'You can email TicTech Staffing at info@tictechstaffing.com.'};
  if(t.includes('address')||t.includes('location'))return{message:'TicTech Staffing is listed at 2468 N Jerusalem Rd, Ste #14, North Bellmore, NY 11710, with nationwide recruiting support across the U.S.'};
  if(t.includes('representative')||t.includes('human')||t.includes('person'))return{message:'You can call (516) 667-0017 or email info@tictechstaffing.com. Business hours are Monday–Friday, 9:30 AM–5:00 PM EST.'};
  if(t.includes('contract-to-hire'))return{message:'Contract-to-hire provides a flexible path to evaluate alignment before a permanent hiring decision.'};
  if(t.includes('contract'))return{message:'Contract staffing is available for project delivery, coverage, and time-sensitive technical assignments.'};
  return{message:'I can help with live jobs, candidate profile submission, employer hiring requests, business hours, phone/email contact, and TicTech Staffing services.'};
}
async function processAssistant(text){typing(true);const result=answer(text);await new Promise(r=>setTimeout(r,Math.min(750,280+text.length*8)));typing(false);await addMessage(result.message,'bot');if(result.action==='jobs')setTimeout(()=>location.href='jobs.html',650);if(result.action==='profile')setTimeout(()=>location.href='candidate.html',750);if(result.action==='employers'){setTimeout(()=>{closeAssistant();scrollToId('employers')},650)}}
function openAssistant(mode){if(!panel)return;panel.hidden=false;requestAnimationFrame(()=>panel.classList.add('open'));if(mode){const prompts={jobs:'Show me live jobs.',profile:'How do I submit my profile?',employer:'I need help hiring technology talent.',representative:'I want to talk with a representative.'};const prompt=prompts[mode]||mode;addMessage(prompt,'user').then(()=>processAssistant(prompt))}setTimeout(()=>input?.focus(),80)}
function closeAssistant(){panel?.classList.remove('open');setTimeout(()=>{if(panel)panel.hidden=true},180)}
$("#assistantButton")?.addEventListener('click',()=>panel?.hidden?openAssistant():closeAssistant());
$("#assistantClose")?.addEventListener('click',closeAssistant);
$$('[data-open-assistant]').forEach(b=>b.addEventListener('click',()=>openAssistant(b.dataset.openAssistant)));
$$('[data-chat]').forEach(b=>b.addEventListener('click',()=>openAssistant(b.dataset.chat)));
$("#assistantForm")?.addEventListener('submit',e=>{e.preventDefault();const text=input?.value.trim();if(!text)return;addMessage(text,'user');input.value='';processAssistant(text)});

// Scroll-spy keeps the desktop navigation visually synchronized with the section in view.
if('IntersectionObserver' in window){
  const sectionLinks=new Map([['employers','#employers'],['services','#services'],['reviews','#reviews'],['contact','#contact']]);
  const spy=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;const href=sectionLinks.get(entry.target.id);if(!href)return;$$('.nav-links a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===href))})},{rootMargin:'-35% 0px -55%',threshold:.01});
  sectionLinks.forEach((_,id)=>{const el=document.getElementById(id);if(el)spy.observe(el)});
}

// Sound helper toast is informative only. Audio starts only after the user explicitly enables it.
const toast=$("#soundToast");
if(toast&&!store.get('tictechSoundNoticeSeen'))setTimeout(()=>{toast.hidden=false;requestAnimationFrame(()=>toast.classList.add('show'))},1800);
$("#soundToastClose")?.addEventListener('click',()=>{toast?.classList.remove('show');setTimeout(()=>{if(toast)toast.hidden=true},220);store.set('tictechSoundNoticeSeen','1')});

// Avoid broken scroll anchoring when a hash points to a fixed-header section.
if(location.hash&&document.querySelector(location.hash))setTimeout(()=>document.querySelector(location.hash)?.scrollIntoView({block:'start'}),80);
