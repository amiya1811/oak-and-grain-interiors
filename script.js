const $=s=>document.querySelector(s);
const pre=$('#pre');let t0=performance.now();
(function p(n){const k=Math.min((n-t0)/1800,1);$('#pn').textContent=Math.floor(k*100);$('#pf').style.width=k*100+'%';
k<1?requestAnimationFrame(p):(pre.classList.add('done'),document.body.classList.add('ready'))})(t0);
const sv=[['Custom Furniture','Wardrobes, beds, sofas and TV units designed around your room and built in our own workshop.','g1'],
['Repair & Polish','Old furniture restored with fresh polish, new fabric and strong joinery.','g2'],
['Assembly & Installation','Flat-pack to finished, installed neatly and on time.','g3'],
['Interior Consultation','Space planning, materials and colour guidance before you build.','g4']];
$('#svc').innerHTML=sv.map((s,i)=>`<div class="svc fd"><div class="tx"><span class="lab">0${i+1} — Service</span><h3>${s[0]}</h3><p>${s[1]}</p></div><div class="frame"><span class="num">0${i+1}</span><div class="ph ${s[2]}" style="${bg(SPECIAL.svc[i])}"></div></div></div>`).join('');
const works=FEATURED;
const modal=$('#modal');
$('#proj').innerHTML=works.map((w,i)=>`<article class="pj"><div class="pjt slx" data-dir="${i%2?1:-1}"><span class="pnum">0${i+1}</span><h3>${w.t}</h3><p>${w.x}</p><div class="meta"><div><small>Location</small>${w.l}</div><div><small>Terms of execution</small>${w.d}</div></div></div><div class="pjg">${[w.g,'g2','g4'].map((g,j)=>`<button class="pi slx ${g}${j?'':' big'}" data-p="${i}" data-dir="${i%2?-1:1}" data-k="${[1,1.3,1.6][j]}" aria-label="${w.t}" style="${bg(w.p[j])}"></button>`).join('')}</div></article>`).join('');
$('#proj').addEventListener('click',e=>{const b=e.target.closest('.pi');if(!b)return;const w=works[b.dataset.p];
$('#mimg').className='mimg '+w.g;$('#mimg').style.cssText=bg(w.p[0]);$('#mt').textContent=w.t;$('#md').textContent=w.x;
$('#mm').innerHTML='<div><small>Location</small>'+w.l+'</div><div><small>Terms of execution</small>'+w.d+'</div>';modal.classList.add('open')});
const closeM=()=>modal.classList.remove('open');
$('#mx').onclick=closeM;$('#mc').addEventListener('click',closeM);modal.addEventListener('click',e=>{if(e.target===modal)closeM()});
addEventListener('keydown',e=>{if(e.key==='Escape')closeM()});
document.querySelectorAll('.rv').forEach(h=>[...h.children].forEach((x,i)=>{x.classList.add('slx');x.dataset.dir=i?1:-1}));
const sx=[...document.querySelectorAll('.slx')];sx.forEach(e=>e._c=1);
(function tick(){const vh=innerHeight;sx.forEach(e=>{const r=e.getBoundingClientRect();
let p=Math.min(Math.max((vh*.98-r.top)/(vh*.55),0),1);p=1-Math.pow(1-p,3);
e._c+=((1-p)-e._c)*.1;e.style.transform=e._c<.002?'':`translateX(${e.dataset.dir*e._c*(+e.dataset.k||1)*50}vw)`});requestAnimationFrame(tick)})();
function count(el){const to=+el.dataset.n,t=performance.now();(function f(n){const k=Math.min((n-t)/1500,1);el.textContent=Math.floor(to*k)+(el.dataset.s||'');k<1&&requestAnimationFrame(f)})(t)}
const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');x.target.querySelectorAll('[data-n]').forEach(count);io.unobserve(x.target)}}),{threshold:.15});
document.querySelectorAll('.rv,.fd').forEach(e=>io.observe(e));
const root=document.documentElement,tg=$('#tg');
function setTheme(m){root.dataset.theme=m;tg.textContent=m==='dark'?'☀️':'🌙';try{localStorage.setItem('theme',m)}catch(e){}}
let saved=null;try{saved=localStorage.getItem('theme')}catch(e){}
setTheme(saved||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
tg.onclick=()=>setTheme(root.dataset.theme==='dark'?'light':'dark');

$('.hero').style.setProperty('--hero',SPECIAL.hero.map(x=>`url(${IMG_DIR}${x}) center/cover no-repeat`).join(','));
$('#aboutImg').style.cssText=bg(SPECIAL.about);
(async function gallery(){
const gal=$('#gal'),tabs=$('#tabs');
const test=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(u);i.onerror=()=>r(null);i.src=u});
const find=async(c,n)=>{for(const e of EXTENSIONS){const u=`${IMG_DIR}${c}-pic${n}.${e}`;if(await test(u))return u}return null};
const keys=Object.keys(CATEGORIES),found=[];
await Promise.all(keys.map(async c=>{const r=await Promise.all(Array.from({length:CATEGORIES[c].count},(_,i)=>find(c,i+1)));r.forEach((u,i)=>u&&found.push({c,n:i+1,u}))}));
found.sort((a,b)=>keys.indexOf(a.c)-keys.indexOf(b.c)||a.n-b.n);
if(!found.length){tabs.remove();gal.style.columnCount=1;gal.innerHTML='<div class="gmsg">Photos abhi upload nahi hui. <b>images/</b> folder mein <b>kitchen-pic1.jpg</b>, <b>wardrobe-pic1.jpg</b> jaise naam se daalo, yahan apne aap aa jayengi.</div>';return}
const have=keys.filter(c=>found.some(f=>f.c===c));
tabs.innerHTML=['all',...have].map((c,i)=>`<button data-c="${c}" class="${i?'':'on'}">${c==='all'?'All':CATEGORIES[c].label}</button>`).join('');
gal.innerHTML=found.map((f,i)=>`<button class="gi" data-c="${f.c}" data-u="${f.u}" data-t="${CATEGORIES[f.c].label} · ${f.n}" style="animation-delay:${Math.min(i,20)*.04}s"><img src="${f.u}" loading="lazy" alt="${CATEGORIES[f.c].label}"></button>`).join('');
tabs.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tabs.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
gal.querySelectorAll('.gi').forEach(g=>g.hidden=b.dataset.c!=='all'&&g.dataset.c!==b.dataset.c)});
gal.addEventListener('click',e=>{const g=e.target.closest('.gi');if(!g)return;
$('#mimg').className='mimg';$('#mimg').style.cssText=`background:url(${g.dataset.u}) center/contain no-repeat var(--sf)`;
$('#mt').textContent=g.dataset.t;$('#md').textContent='';$('#mm').innerHTML='';modal.classList.add('open')});
})();

/* ============================================================================
   OAK & GRAIN INTERIORS — CONTACT BUTTON TRACKING & ENQUIRY FORM LOGIC
   Seamlessly integrated without altering original animations.
   ============================================================================ */

// 1. Activity Tracking for Direct Contact Actions
// Note: Call clicks track user button interaction, not connected call completion.
function setupContactTracking() {
  const trackBtn = (id, eventType, desc, meta) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', () => {
      if (typeof logActivity === 'function') {
        logActivity(eventType, desc, meta);
      }
    });
  };

  trackBtn('headerCallBtn', 'Phone button clicked', 'Visitor clicked header phone link (+91 93530 19525) - initiates call prompt', { location: 'header' });
  trackBtn('ctaCallBtn', 'Phone button clicked', 'Visitor clicked CTA phone button (+91 93530 19525) - initiates call prompt', { location: 'cta_section' });
  trackBtn('ctaWaBtn', 'WhatsApp button clicked', 'Visitor clicked CTA WhatsApp chat button', { location: 'cta_section' });
  trackBtn('floatingWaBtn', 'WhatsApp button clicked', 'Visitor clicked floating WhatsApp button', { location: 'floating_widget' });
  trackBtn('ctaEmailBtn', 'Email button clicked', 'Visitor clicked studio email link', { email: 'oakandgraininteriors@gmail.com' });
  trackBtn('ctaIgBtn', 'Instagram link clicked', 'Visitor clicked Instagram profile link (@oakandgrain.interiors)', { profile: '@oakandgrain.interiors' });
}
setupContactTracking();

// 2. Indian Mobile Number Validation Helper
// Validates 10-digit Indian numbers starting with 6, 7, 8, or 9
// Handles optional prefix +91, 91, or 0, and stripping of spaces/dashes.
function validateIndianPhoneNumber(raw) {
  if (!raw) return { valid: false, error: 'Mobile number is required.' };
  const cleaned = raw.trim().replace(/[\s\-\(\)]/g, '');
  const match = cleaned.match(/^(?:\+91|91|0)?([6-9]\d{9})$/);
  if (!match) {
    return { valid: false, error: 'Please enter a valid 10-digit Indian mobile number (starting with 6-9).' };
  }
  const tenDigit = match[1];
  return { valid: true, formatted: `+91 ${tenDigit.slice(0, 5)} ${tenDigit.slice(5)}`, raw: tenDigit };
}

// 3. Enquiry Form Handler with Validation, Duplicate Prevention, and Supabase Storage
(function initEnquiryForm() {
  const form = document.getElementById('enquiryForm');
  if (!form) return;

  const formAlert = document.getElementById('formAlert');
  const formSuccess = document.getElementById('formSuccess');
  const formContainer = document.getElementById('formContainer');
  const submitBtn = document.getElementById('submitEnquiryBtn');
  const btnText = document.getElementById('btnText');
  const newEnquiryBtn = document.getElementById('newEnquiryBtn');

  const fields = {
    name: { input: document.getElementById('clientName'), group: document.getElementById('groupName'), error: document.getElementById('errorName') },
    phone: { input: document.getElementById('clientPhone'), group: document.getElementById('groupPhone'), error: document.getElementById('errorPhone') },
    email: { input: document.getElementById('clientEmail'), group: document.getElementById('groupEmail'), error: document.getElementById('errorEmail') },
    service: { input: document.getElementById('clientService'), group: document.getElementById('groupService'), error: document.getElementById('errorService') },
    message: { input: document.getElementById('clientMessage'), group: document.getElementById('groupMessage') }
  };

  // Clear errors dynamically on input
  Object.values(fields).forEach(f => {
    if (f.input) {
      f.input.addEventListener('input', () => {
        if (f.group) f.group.classList.remove('has-error');
        if (formAlert) {
          formAlert.className = 'form-alert';
          formAlert.style.display = 'none';
        }
      });
      if (f.input.tagName === 'SELECT') {
        f.input.addEventListener('change', () => {
          if (f.group) f.group.classList.remove('has-error');
        });
      }
    }
  });

  let isSubmitting = false;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate rapid submission

    // Reset previous error states
    Object.values(fields).forEach(f => { if (f.group) f.group.classList.remove('has-error'); });
    if (formAlert) { formAlert.style.display = 'none'; formAlert.className = 'form-alert'; }

    let hasError = false;

    // Validate Name
    const nameVal = fields.name.input.value.trim();
    if (!nameVal || nameVal.length < 2) {
      fields.name.group.classList.add('has-error');
      fields.name.error.textContent = 'Please enter your full name (at least 2 characters).';
      hasError = true;
    }

    // Validate Indian Phone Number
    const phoneVal = fields.phone.input.value.trim();
    const phoneResult = validateIndianPhoneNumber(phoneVal);
    if (!phoneResult.valid) {
      fields.phone.group.classList.add('has-error');
      fields.phone.error.textContent = phoneResult.error;
      hasError = true;
    }

    // Validate Email (Optional, but if filled must be valid)
    const emailVal = fields.email.input.value.trim();
    if (emailVal) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        fields.email.group.classList.add('has-error');
        fields.email.error.textContent = 'Please enter a valid email address or leave blank.';
        hasError = true;
      }
    }

    // Validate Service
    const serviceVal = fields.service.input.value;
    if (!serviceVal) {
      fields.service.group.classList.add('has-error');
      fields.service.error.textContent = 'Please select a service required.';
      hasError = true;
    }

    if (hasError) {
      if (formAlert) {
        formAlert.className = 'form-alert error';
        formAlert.textContent = 'Please correct the highlighted fields above.';
        formAlert.style.display = 'block';
      }
      return;
    }

    // Lock submission state
    isSubmitting = true;
    submitBtn.disabled = true;
    btnText.textContent = 'Submitting Enquiry...';

    const messageVal = fields.message.input ? fields.message.input.value.trim() : '';
    const refCode = 'OG-' + Math.floor(100000 + Math.random() * 900000);

    try {
      const client = (typeof window.supabaseClient !== 'undefined' && window.supabaseClient)
        ? window.supabaseClient
        : (typeof getSupabase === 'function' ? getSupabase() : null);

      if (!client) {
        throw new Error('Supabase client could not be initialized. Please check credentials in supabase-config.js.');
      }

      // Exact database schema payload mapping
      const payload = {
        name: nameVal,
        phone: phoneResult.formatted,
        email: emailVal || null,
        service: serviceVal,
        message: messageVal || null,
        status: 'New'
      };

      console.info('[Oak & Grain] Submitting enquiry to Supabase table "enquiries":', payload);

      // Perform INSERT into 'enquiries' table.
      // NOTE ON RLS & .select():
      // Public visitors have INSERT-only permission under Row Level Security.
      // Chaining .select() asks PostgREST for "Prefer: return=representation" (RETURNING *),
      // which evaluates SELECT RLS policies and throws an RLS violation because public visitors
      // cannot read enquiries. Calling insert([payload]) without .select() uses "Prefer: return=minimal",
      // successfully writing the row to PostgreSQL without violating SELECT RLS.
      const { error: insertError } = await client
        .from('enquiries')
        .insert([payload]);

      if (insertError) {
        console.error('[Oak & Grain] Supabase insert error details:', insertError.message, insertError.details, insertError.hint, insertError.code, insertError);
        throw insertError;
      }

      console.info('[Oak & Grain] Enquiry successfully saved in Supabase database.');

      // Log event in activity_logs (non-blocking)
      if (typeof logActivity === 'function') {
        logActivity(
          'Enquiry submitted',
          `New enquiry submitted by ${nameVal} for ${serviceVal}`,
          { name: nameVal, phone: phoneResult.formatted, service: serviceVal, ref: refCode }
        );
      }

      // Show confirmation state
      document.getElementById('successName').textContent = nameVal;
      document.getElementById('successRef').textContent = `Reference: #${refCode}`;
      
      const waLink = document.getElementById('successWaLink');
      if (waLink) {
        const waText = encodeURIComponent(
          `Hi Oak & Grain Interiors, I have submitted an enquiry on your website for ${serviceVal} (Ref #${refCode}). My name is ${nameVal}.`
        );
        waLink.href = `https://wa.me/919353019525?text=${waText}`;
      }

      formContainer.style.display = 'none';
      formSuccess.classList.add('active');
      form.reset();

    } catch (err) {
      console.error('[Oak & Grain] Form submission caught error:', err);
      if (formAlert) {
        formAlert.className = 'form-alert error';
        const displayErr = err.message || 'Connection error. Please try again.';
        formAlert.innerHTML = `Submission could not be completed: ${displayErr}<br>You can also reach Amit Singh directly at <a href="tel:+919353019525" style="text-decoration:underline;color:inherit;font-weight:500">+91 93530 19525</a> or WhatsApp.`;
        formAlert.style.display = 'block';
      }
    } finally {
      // Re-enable button if form is still visible (submission failed)
      if (formContainer && formContainer.style.display !== 'none') {
        isSubmitting = false;
        submitBtn.disabled = false;
        btnText.textContent = 'Submit Enquiry ↗';
      }
    }
  });

  // Handle "Submit Another Enquiry" button
  if (newEnquiryBtn) {
    newEnquiryBtn.addEventListener('click', () => {
      formSuccess.classList.remove('active');
      formContainer.style.display = 'block';
      isSubmitting = false;
      submitBtn.disabled = false;
      btnText.textContent = 'Submit Enquiry ↗';
      if (formAlert) formAlert.style.display = 'none';
    });
  }
})();
