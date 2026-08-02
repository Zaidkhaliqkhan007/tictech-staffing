import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore,collection,addDoc,onSnapshot,query,orderBy,limit,serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { firebaseConfig, FORM_ENDPOINT } from "./firebase-config.js";

const app=initializeApp(firebaseConfig), db=getFirestore(app);
const state={jobs:[]};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v="")=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

const header=$(".header");
addEventListener("scroll",()=>header?.classList.toggle("scrolled",scrollY>16),{passive:true});
const menu=$("#menuToggle"), nav=$("#navLinks");
menu?.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open))});
$$(".nav-links a").forEach(a=>a.addEventListener("click",()=>nav?.classList.remove("open")));

const glow=$("#cursorGlow");
addEventListener("pointermove",e=>{if(glow){glow.style.left=`${e.clientX}px`;glow.style.top=`${e.clientY}px`}},{passive:true});

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}),{threshold:.12});
$$(".reveal").forEach(el=>observer.observe(el));

function dateLabel(ts){return ts?.toDate?ts.toDate().toLocaleDateString("en-US",{month:"short",day:"numeric"}):"Recently posted"}
function jobCards(jobs){
  return jobs.map(job=>`<article class="job-card">
    <div class="job-card-top"><span class="job-badge">${esc(job.type||"Opportunity")}</span><small>${dateLabel(job.createdAt)}</small></div>
    <h3>${esc(job.title)}</h3>
    <p>${esc(job.location||"United States")} ${job.salary?`• <span class="salary">${esc(job.salary)}</span>`:""}</p>
    <p>${esc(job.summary||"View this technology opportunity and submit your profile.")}</p>
    <a href="${esc(job.applyUrl||"candidate.html")}">View Opportunity →</a>
  </article>`).join("");
}
try{
  onSnapshot(query(collection(db,"jobs"),orderBy("createdAt","desc"),limit(6)),snap=>{
    state.jobs=snap.docs.map(d=>({id:d.id,...d.data()}));
    const wrap=$("#homeJobs");
    if(!wrap)return;
    wrap.innerHTML=state.jobs.length?jobCards(state.jobs):`<div class="loading-card">No live roles are posted right now. Submit your profile to join our talent network.</div>`;
  },()=>{$("#homeJobs").innerHTML=`<div class="loading-card">Live jobs are temporarily unavailable.</div>`});
}catch(error){console.error(error)}

async function notify(payload){
  if(!FORM_ENDPOINT||FORM_ENDPOINT.includes("YOUR_FORM_ID"))return;
  const fd=new FormData();Object.entries(payload).forEach(([k,v])=>fd.append(k,v??""));
  await fetch(FORM_ENDPOINT,{method:"POST",body:fd,headers:{Accept:"application/json"}});
}
$("#employerForm")?.addEventListener("submit",async e=>{
  e.preventDefault();const form=e.currentTarget,msg=$("#employerMessage"),data=Object.fromEntries(new FormData(form).entries());
  if(data.website)return; msg.textContent="Submitting your request…";
  try{
    await addDoc(collection(db,"employerRequests"),{company:data.company.trim(),name:data.name.trim(),email:data.email.trim(),phone:data.phone.trim(),role:data.role.trim(),details:data.details.trim(),status:"new",createdAt:serverTimestamp()});
    await notify({subject:"New employer request",...data});
    form.reset();msg.textContent="Your request was received. Our team will follow up during business hours.";
  }catch(error){console.error(error);msg.textContent="Submission failed. Please email info@tictechstaffing.com."}
});

const panel=$("#assistantPanel"), messages=$("#assistantMessages"), input=$("#assistantInput");
function openAssistant(mode){panel.hidden=false;if(mode){const prompt=mode==="jobs"?"Show current jobs":mode==="profile"?"How do I submit my profile?":"I want to talk with a representative";addMessage(prompt,"user");setTimeout(()=>addMessage(answer(prompt)),220)}setTimeout(()=>input?.focus(),50)}
function closeAssistant(){panel.hidden=true}
$("#assistantButton")?.addEventListener("click",()=>openAssistant());
$("#assistantClose")?.addEventListener("click",closeAssistant);
$$("[data-open-assistant]").forEach(b=>b.addEventListener("click",()=>openAssistant(b.dataset.openAssistant)));
function addMessage(text,type="bot"){const p=document.createElement("p");p.className=type;p.textContent=text;messages.appendChild(p);messages.scrollTop=messages.scrollHeight}
function answer(text){
  const t=text.toLowerCase();
  if(t.includes("job")||t.includes("role"))return state.jobs.length?`There are ${state.jobs.length} live opportunities. The newest is ${state.jobs[0].title}. Open the Jobs page for details.`:"No live roles are posted right now. Submit your profile to join our talent network.";
  if(t.includes("profile")||t.includes("resume"))return"Open Submit Profile, complete the form, and upload a PDF or Word resume.";
  if(t.includes("representative")||t.includes("human"))return"Call (516) 667-0017 or email info@tictechstaffing.com. Business hours are Monday–Friday, 9:30 AM–5:00 PM EST.";
  return"I can help with current jobs, profile submission, business hours, or connecting you to a representative.";
}
$("#assistantForm")?.addEventListener("submit",e=>{e.preventDefault();const text=input.value.trim();if(!text)return;addMessage(text,"user");input.value="";setTimeout(()=>addMessage(answer(text)),250)});
$$("[data-chat]").forEach(b=>b.addEventListener("click",()=>openAssistant(b.dataset.chat)));

const now=new Date(), day=now.getDay(), hour=now.getHours()+now.getMinutes()/60;
$("#assistantStatus").textContent=day>=1&&day<=5&&hour>=9.5&&hour<17?"Online during business hours":"After-hours support";
