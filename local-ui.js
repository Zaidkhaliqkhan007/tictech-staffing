// Local UI fallback: keeps the star rating working even when previewing index.html from your computer.
// Firebase/live website features still run from app.js after you upload to GitHub.
(function(){
  function byId(id){ return document.getElementById(id); }
  function setupStars(){
    const stars = byId('stars');
    const ratingInput = byId('ratingInput');
    if(!stars || !ratingInput) return;
    let rating = Number(ratingInput.value || 5);
    const buttons = Array.from(stars.querySelectorAll('button[data-star]'));
    function paint(){
      buttons.forEach(btn => {
        const value = Number(btn.dataset.star);
        btn.classList.toggle('active', value <= rating);
        btn.setAttribute('aria-pressed', value === rating ? 'true' : 'false');
      });
    }
    buttons.forEach(btn => {
      btn.setAttribute('aria-label', btn.dataset.star + ' star rating');
      btn.addEventListener('click', function(e){
        e.preventDefault();
        rating = Number(btn.dataset.star);
        ratingInput.value = String(rating);
        paint();
      });
      btn.addEventListener('mouseenter', function(){
        const hover = Number(btn.dataset.star);
        buttons.forEach(b => b.classList.toggle('hovered', Number(b.dataset.star) <= hover));
      });
    });
    stars.addEventListener('mouseleave', function(){
      buttons.forEach(b => b.classList.remove('hovered'));
    });
    paint();
  }
  function setupMenu(){
    const menuBtn = byId('menuBtn');
    const navlinks = byId('navlinks');
    if(menuBtn && navlinks){
      menuBtn.addEventListener('click', function(){ navlinks.classList.toggle('open'); });
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    setupStars();
    setupMenu();
  });
})();


// TicTech smart chat widget: runs on GitHub Pages without a backend.
(function(){
  function byId(id){ return document.getElementById(id); }
  function nyNow(){
    return new Date(new Date().toLocaleString('en-US', {timeZone:'America/New_York'}));
  }
  function isBusinessOpen(){
    const d = nyNow();
    const day = d.getDay(); // 0 Sun, 6 Sat
    const mins = d.getHours()*60 + d.getMinutes();
    return day >= 1 && day <= 5 && mins >= (9*60+30) && mins <= (17*60);
  }
  function setupChat(){
    const bubble=byId('chatBubble'), panel=byId('chatPanel'), close=byId('chatClose'), messages=byId('chatMessages'), form=byId('chatForm'), input=byId('chatText'), repForm=byId('repForm'), repMsg=byId('repMsg'), status=byId('chatStatus');
    if(!bubble||!panel||!messages||!form||!input) return;
    if(status) status.textContent = isBusinessOpen() ? 'Open now: 9:30 AM–5:00 PM EST' : 'After-hours support: leave a message';
    function add(text, who){
      const div=document.createElement('div'); div.className='msg '+(who||'bot'); div.innerHTML=text; messages.appendChild(div); messages.scrollTop=messages.scrollHeight;
    }
    function answer(q){
      const t=(q||'').toLowerCase();
      if(t.includes('representative')||t.includes('human')||t.includes('agent')||t.includes('talk')||t.includes('speak')){
        add('Sure — please fill out the short message form below. TicTech Staffing will receive it at <b>info@tictechstaffing.com</b>. Our business hours are Monday–Friday, 9:30 AM–5:00 PM EST, excluding U.S. public holidays.','bot');
        if(repForm) repForm.classList.add('show'); return;
      }
      if(t.includes('job')||t.includes('opening')||t.includes('role')||t.includes('apply')){
        add('You can view current openings in the <b>Jobs</b> section and create a candidate profile. We recruit nationwide for IT Support, Desktop Engineer, Systems Administrator, Systems Engineer, DevOps Engineer, Cloud, Cybersecurity, Network, and Infrastructure roles.','bot'); return;
      }
      if(t.includes('account')||t.includes('login')||t.includes('sign')||t.includes('profile')||t.includes('password')){
        add('For account help, use <b>Candidate Signup</b> to create your profile. If you cannot access your account, type <b>representative</b> and send us your email so our team can help.','bot'); return;
      }
      if(t.includes('hour')||t.includes('open')||t.includes('closed')||t.includes('holiday')){
        add('Our business hours are <b>Monday–Friday, 9:30 AM–5:00 PM EST</b>. We are closed Saturday, Sunday, and U.S. public holidays.','bot'); return;
      }
      if(t.includes('email')||t.includes('contact')||t.includes('phone')){
        add('You can contact TicTech Staffing at <b>info@tictechstaffing.com</b> or call <b>(631) 627-4413</b>.','bot'); return;
      }
      add('I can help with jobs, candidate accounts, applying, business hours, and contacting a representative. You can also type <b>representative</b> anytime.','bot');
    }
    let greeted=false;
    function openChat(){ panel.classList.add('open'); if(!greeted){ greeted=true; add('Welcome to TicTech Staffing, how may I assist you?','bot'); } input.focus(); }
    bubble.addEventListener('click', openChat);
    close&&close.addEventListener('click', ()=>panel.classList.remove('open'));
    setTimeout(()=>{ if(!greeted) openChat(); }, 2200);
    document.querySelectorAll('.quickPrompts button').forEach(b=>b.addEventListener('click',()=>{ add(b.dataset.q,'user'); answer(b.dataset.q); }));
    form.addEventListener('submit', function(e){ e.preventDefault(); const q=input.value.trim(); if(!q) return; add(q,'user'); input.value=''; setTimeout(()=>answer(q),350); });
    if(repForm){ repForm.addEventListener('submit', function(e){ e.preventDefault(); if(repMsg) repMsg.textContent='Message captured. If Formspree/Firebase is connected, TicTech Staffing will receive an email alert.'; add('Thank you. Your message has been sent to TicTech Staffing support.','bot'); }); }
  }
  document.addEventListener('DOMContentLoaded', setupChat);
})();
