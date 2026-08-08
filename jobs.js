import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore,collection,onSnapshot,query,orderBy,limit } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app=initializeApp(firebaseConfig),db=getFirestore(app),state={jobs:[],role:''};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#039;'}[c]));
const menu=$('#menuToggle'),nav=$('#navLinks'),header=$('.header');
if(menu)menu.dataset.navBound='1';
menu?.addEventListener('click',()=>{const open=nav?.classList.toggle('open');menu.setAttribute('aria-expanded',String(Boolean(open)))});
$$('.nav-links a').forEach(a=>a.addEventListener('click',()=>{nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false')}));
addEventListener('scroll',()=>header?.classList.toggle('scrolled',scrollY>12),{passive:true});

const params=new URLSearchParams(location.search);if(params.get('q'))$('#jobsSearch').value=params.get('q');if(params.get('location'))$('#jobsLocation').value=params.get('location');
function render(){
  const text=($('#jobsSearch')?.value||'').toLowerCase(),locationText=($('#jobsLocation')?.value||'').toLowerCase(),type=$('#jobsType')?.value||'';
  const jobs=state.jobs.filter(j=>{const hay=`${j.title||''} ${j.skills||''} ${j.summary||''}`.toLowerCase(),loc=String(j.location||'').toLowerCase();return(!text||hay.includes(text))&&(!locationText||loc.includes(locationText))&&(!type||j.type===type)&&(!state.role||hay.includes(state.role))});
  $('#jobsResultCount').textContent=`${jobs.length} live opportunit${jobs.length===1?'y':'ies'} found`;
  $('#jobsList').innerHTML=jobs.length?jobs.map(j=>`<article class="job-row" data-tilt><div><span class="job-badge">${esc(j.type||'Opportunity')}</span><h3>${esc(j.title||'Technology Opportunity')}</h3><p>${esc(j.location||'United States')} ${j.salary?`• <span class="salary">${esc(j.salary)}</span>`:''}</p><p>${esc(j.summary||'View this opportunity and submit your profile.')}</p><p>${esc(j.skills||'Technology role')}</p></div><div class="job-row-actions"><a class="button button-small" href="${esc(j.applyUrl||'candidate.html')}">Apply Now</a></div></article>`).join(''):`<div class="loading-card premium-empty"><span class="empty-pulse"></span><div><b>No opportunities match your search.</b><p>Try a broader search or submit your profile to join the talent network.</p><a href="candidate.html">Submit Profile →</a></div></div>`;
  window.dispatchEvent(new CustomEvent('tictech:cards-updated'));
}
['jobsSearch','jobsLocation','jobsType'].forEach(id=>{const el=$('#'+id);el?.addEventListener(id==='jobsType'?'change':'input',render)});
$('#searchJobsButton')?.addEventListener('click',render);
$$('[data-role-filter]').forEach(b=>b.addEventListener('click',()=>{$$('[data-role-filter]').forEach(x=>x.classList.remove('filter-active'));b.classList.add('filter-active');state.role=b.dataset.roleFilter;render()}));
onSnapshot(query(collection(db,'jobs'),orderBy('createdAt','desc'),limit(100)),snap=>{state.jobs=snap.docs.map(d=>({id:d.id,...d.data()}));render()},error=>{console.warn(error);$('#jobsResultCount').textContent='Live jobs temporarily unavailable';$('#jobsList').innerHTML=`<div class="loading-card premium-empty"><span class="empty-pulse"></span><div><b>Live jobs are temporarily unavailable.</b><p>Please try again later or submit your profile for future opportunities.</p><a href="candidate.html">Submit Profile →</a></div></div>`});
