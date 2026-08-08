import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore,collection,addDoc,serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getStorage,ref,uploadBytes } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";
import { firebaseConfig,FORM_ENDPOINT } from "./firebase-config.js";

const app=initializeApp(firebaseConfig),db=getFirestore(app),storage=getStorage(app);
const form=document.getElementById('candidateForm'),msg=document.getElementById('candidateMessage'),submit=document.getElementById('candidateSubmit'),success=document.getElementById('candidateSuccess');
const safe=n=>String(n||'resume').replace(/[^a-zA-Z0-9._-]/g,'_').slice(-120);
const extType={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
const uuid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function notify(data){
  if(!FORM_ENDPOINT||FORM_ENDPOINT.includes('YOUR_FORM_ID'))return true;
  const fd=new FormData();Object.entries(data).forEach(([k,v])=>fd.append(k,v??''));
  const response=await fetch(FORM_ENDPOINT,{method:'POST',body:fd,headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('Notification service returned an error.');
  return true;
}

form?.addEventListener('submit',async e=>{
  e.preventDefault();
  const fd=new FormData(form);if(fd.get('website'))return;
  const file=fd.get('resume');
  if(!(file instanceof File)||!file.size){msg.textContent='Please select your resume.';return}
  if(file.size>10*1024*1024){msg.textContent='Resume must be 10 MB or smaller.';return}
  const ext=(file.name.split('.').pop()||'').toLowerCase(),contentType=extType[ext];
  if(!contentType){msg.textContent='Resume must be PDF, DOC, or DOCX.';return}
  submit.disabled=true;submit.textContent='Uploading securely…';msg.textContent='';
  try{
    const path=`resumes/${new Date().getFullYear()}/${uuid()}-${safe(file.name)}`;
    await uploadBytes(ref(storage,path),file,{contentType});
    const record={firstName:String(fd.get('firstName')||'').trim(),middleName:String(fd.get('middleName')||'').trim(),lastName:String(fd.get('lastName')||'').trim(),phone:String(fd.get('phone')||'').trim(),location:String(fd.get('location')||'').trim(),email:String(fd.get('email')||'').trim(),role:String(fd.get('role')||'').trim(),linkedin:String(fd.get('linkedin')||'').trim(),notes:String(fd.get('notes')||'').trim(),resumePath:path,resumeFileName:file.name,status:'new',createdAt:serverTimestamp()};
    await addDoc(collection(db,'candidates'),record);
    try{await notify({subject:'New candidate profile',candidate:`${record.firstName} ${record.lastName}`,email:record.email,phone:record.phone,location:record.location,role:record.role})}catch(error){console.warn(error)}
    form.hidden=true;success.hidden=false;success.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
  }catch(error){console.error(error);msg.textContent='Submission failed. Please email your resume to info@tictechstaffing.com.'}
  finally{submit.disabled=false;submit.textContent='Submit Profile'}
});
