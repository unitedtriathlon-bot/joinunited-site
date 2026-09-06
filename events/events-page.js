const data=window.UNITED_EVENTS||[];
const filters=['All','Triathlon','Cycling','Running','Swimming','Camp','Community'];
const filtersEl=document.querySelector('#filters');
const eventsEl=document.querySelector('#events');
const dialog=document.querySelector('#eventDialog');
const dialogContent=document.querySelector('#dialogContent');
let active='All';

const media={
  'Season Opening Ride':['../assets/media/cycling-new-year-group.webp','UNITED archive'],
  'Jebel Hafeet Weekend':['../assets/media/cycling-mountains-group.webp','UNITED archive'],
  'Movie Night in the Desert':['../assets/media/liwa-stars.webp','UNITED archive'],
  'Running Technique Session':['../assets/media/running-kite-beach-group.webp','UNITED archive'],
  'Coffee Ride — New City Routes':['../assets/media/cycling-friends.webp','UNITED archive'],
  'Open Water Training':['../assets/IMG_3852.jpg','UNITED archive'],
  'Club Dinner':['../assets/media/community-dinner.webp','UNITED archive'],
  'Karting Night':['../assets/media/cycling-friends.webp','UNITED archive'],
  'Musandam Weekend':['../assets/media/cycling-mountains-two-riders.webp','UNITED archive'],
  'OCEANMAN Prep — Open Water Training':['../assets/IMG_3852.jpg','UNITED archive'],
  'T100 Transition Clinic':['../assets/media/t100-team.webp','UNITED archive'],
  'T100 Pasta Party':['../assets/media/community-dinner.webp','UNITED archive'],
  'Dubai T100':['../assets/media/t100-team.webp','UNITED at T100'],
  'UNITED Yacht Party':['../assets/media/community-dinner.webp','UNITED archive'],
  'Desert Quad Bikes':['../assets/media/liwa-landscape-02.webp','UNITED archive'],
  'Fujairah Family Camp':['../assets/media/liwa-landscape-01.webp','UNITED archive'],
  'Jebel Jais Weekend':['../assets/media/cycling-mountains-rear.webp','UNITED archive'],
  'UNITED End of Year Dinner':['../assets/media/community-dinner.webp','UNITED archive'],
  'Christmas Ride + Dinner':['../assets/media/cycling-new-year-group.webp','UNITED archive'],
  'Challenge Sir Bani Yas':['../assets/IMG_8744.jpg','UNITED athlete archive'],
  'Spinneys Dubai 92 Cycle Challenge':['../assets/media/cycling-friends.webp','UNITED archive'],
  'UNITED South Africa Cycling Camp':['../assets/media/cycling-mountains-group.webp','UNITED archive'],
  'Cape Town Cycle Tour':['../assets/media/cycling-mountains-two-riders.webp','UNITED archive'],
  'UNITED Maldives Swim Camp + OCEANMAN':['../assets/IMG_3852.jpg','UNITED archive']
};
const categoryMedia={Triathlon:['../assets/IMG_8744.jpg','UNITED archive'],Cycling:['../assets/media/cycling-friends.webp','UNITED archive'],Running:['../assets/media/running-kite-beach-group.webp','UNITED archive'],Swimming:['../assets/IMG_3852.jpg','UNITED archive'],Camp:['../assets/media/liwa-landscape-02.webp','UNITED archive'],Community:['../assets/media/community-dinner.webp','UNITED archive']};
const imageFor=e=>media[e.title]||categoryMedia[e.cats[0]]||['../assets/media/t100-team.webp','UNITED archive'];
const fmt=d=>new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'}).toUpperCase();
const monthKey=e=>e.date?e.date.slice(0,7):e.month;
const monthLabel=k=>new Date(k+'-01T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'}).toUpperCase();
const dateLabel=e=>e.tbc&&!e.date?monthLabel(e.month)+' · TBC':e.end?fmt(e.date)+' — '+fmt(e.end):fmt(e.date);

function renderFilters(){
  filtersEl.innerHTML=filters.map(f=>`<button class="filter ${f===active?'active':''}" data-filter="${f}">${f}</button>`).join('');
  filtersEl.querySelectorAll('button').forEach(b=>b.onclick=()=>{active=b.dataset.filter;renderFilters();renderEvents()});
}

function renderEvents(){
  const visible=data.filter(e=>active==='All'||e.cats.includes(active));
  let current='';
  eventsEl.innerHTML=visible.map(e=>{
    const m=monthKey(e),head=m!==current?`<h3 class="month-title">${monthLabel(m)}</h3>`:'';
    current=m;
    const [img]=imageFor(e);
    return `${head}<article class="event-card ${e.past?'past-event':''} ${e.tbc?'tbc-event':''}" data-index="${data.indexOf(e)}">
      <div class="event-thumb"><img src="${img}" alt="${e.title}" loading="lazy"></div>
      <div class="event-date">${dateLabel(e)}</div>
      <div class="event-main"><div class="event-title">${e.title}</div><div class="event-meta">${e.major?'<span class="tag major">UNITED KEY EVENT</span>':''}${e.type==='united'?'<span class="tag">UNITED EVENT</span>':'<span class="tag">RACE</span>'}${e.cats.map(c=>`<span class="tag">${c}</span>`).join('')}${e.location?`<span class="tag">${e.location}</span>`:''}</div></div>
      <div class="event-arrow">→</div>
    </article>`;
  }).join('');
  eventsEl.querySelectorAll('.event-card').forEach(c=>c.onclick=()=>openEvent(data[+c.dataset.index]));
}

function joinForm(e){
  return `<form class="lead-form" data-event="${e.title}">
    <h3>${e.type==='united'?'Join this event':'Join the UNITED team'}</h3>
    <p>Leave your contact and the UNITED team will follow up.</p>
    <label>Name<input name="name" autocomplete="name" required></label>
    <label>Telegram / WhatsApp<input name="contact" autocomplete="tel" required placeholder="@username or +971..."></label>
    <label>Comment <span>optional</span><textarea name="comment" rows="3"></textarea></label>
    <input type="hidden" name="event" value="${e.title}">
    <button class="btn btn-pink" type="submit">Send request →</button>
    <p class="form-status" aria-live="polite"></p>
  </form>`;
}

function openEvent(e){
  const join=e.type==='united'||e.team;
  const [img,source]=imageFor(e);
  let primary='';
  if(e.url) primary=`<a class="btn btn-dark" href="${e.url}" target="_blank" rel="noreferrer">${e.offer?'Register — 25% offer':'Official / Registration'} ↗</a>`;
  dialogContent.innerHTML=`<div class="dialog-cover"><img src="${img}" alt="${e.title}"><span>${source}</span></div><div class="dialog-body">
    <p class="eyebrow ${e.type==='united'?'pink':'orange'}">${dateLabel(e)}</p>
    <h2>${e.title}</h2>
    ${e.location?`<p><strong>${e.location}</strong></p>`:''}
    ${e.description?`<p>${e.description}</p>`:''}
    ${e.distance?`<p><strong>Distance:</strong> ${e.distance}</p>`:''}
    ${e.offer?`<p class="offer">${e.offer}</p>`:''}
    <div class="event-meta">${e.cats.map(c=>`<span class="tag">${c}</span>`).join('')}</div>
    <div class="dialog-actions">${primary}</div>
    ${join?joinForm(e):''}
    ${!e.url&&e.type==='race'?'<p class="small-note">Official registration link will be added after verification.</p>':''}
  </div>`;
  dialog.showModal();
  const form=dialogContent.querySelector('.lead-form');
  if(form) form.addEventListener('submit',submitLead);
}

async function submitLead(ev){
  ev.preventDefault();
  const form=ev.currentTarget;
  const status=form.querySelector('.form-status');
  const payload=Object.fromEntries(new FormData(form).entries());
  payload.source='joinunited.ae/events';
  payload.submittedAt=new Date().toISOString();
  const endpoint=window.UNITED_EVENT_LEADS_ENDPOINT||'';
  if(!endpoint){
    status.innerHTML='Online requests are being connected. For now, please <a href="https://t.me/+VObS05rlhsA2YzU6" target="_blank" rel="noreferrer">message UNITED in Telegram ↗</a>';
    return;
  }
  status.textContent='Sending…';
  try{
    const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!res.ok) throw new Error('Request failed');
    form.reset();
    status.textContent='Request sent. We’ll be in touch.';
  }catch(err){
    status.innerHTML='Could not send the request. Please <a href="https://t.me/+VObS05rlhsA2YzU6" target="_blank" rel="noreferrer">message UNITED in Telegram ↗</a>';
  }
}

document.querySelector('.dialog-close').onclick=()=>dialog.close();
dialog.onclick=e=>{if(e.target===dialog)dialog.close()};
renderFilters();renderEvents();