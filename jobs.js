import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore,collection,onSnapshot,query,orderBy,limit } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app=initializeApp(firebaseConfig),db=getFirestore(app),state={jobs:[],role:""};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v="")=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const menu=$("#menuToggle"),nav=$("#navLinks");menu?.addEventListener("click",()=>nav.classList.toggle("open"));

function render(){
 const text=($("#jobsSearch").value||"").toLowerCase(),location=($("#jobsLocation").value||"").toLowerCase(),type=$("#jobsType").value;
 const jobs=state.jobs.filter(j=>{
   const hay=`${j.title} ${j.skills} ${j.summary}`.toLowerCase(),loc=(j.location||"").toLowerCase(),role=hay;
   return(!text||hay.includes(text))&&(!location||loc.includes(location))&&(!type||j.type===type)&&(!state.role||role.includes(state.role));
 });
 $("#jobsResultCount").textContent=`${jobs.length} opportunity${jobs.length===1?"":"ies"} found`;
 $("#jobsList").innerHTML=jobs.length?jobs.map(j=>`<article class="job-row"><div><span class="job-badge">${esc(j.type||"Opportunity")}</span><h3>${esc(j.title)}</h3><p>${esc(j.location||"United States")} ${j.salary?`• <span class="salary">${esc(j.salary)}</span>`:""}</p><p>${esc(j.summary||"View this opportunity and submit your profile.")}</p><p>${esc(j.skills||"Technology role")}</p></div><div class="job-row-actions"><a class="button button-small" href="${esc(j.applyUrl||"candidate.html")}">Apply Now</a></div></article>`).join(""):`<div class="loading-card">No opportunities match your search. Submit your profile to join our talent network.</div>`;
}
["jobsSearch","jobsLocation","jobsType"].forEach(id=>$("#"+id).addEventListener(id==="jobsType"?"change":"input",render));
$("#searchJobsButton").addEventListener("click",render);
$$("[data-role-filter]").forEach(b=>b.addEventListener("click",()=>{$$("[data-role-filter]").forEach(x=>x.classList.remove("filter-active"));b.classList.add("filter-active");state.role=b.dataset.roleFilter;render()}));
onSnapshot(query(collection(db,"jobs"),orderBy("createdAt","desc"),limit(100)),snap=>{state.jobs=snap.docs.map(d=>({id:d.id,...d.data()}));render()},()=>{$("#jobsList").innerHTML=`<div class="loading-card">Live jobs are temporarily unavailable.</div>`});
