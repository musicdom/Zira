let active='all',query='',subfilter='all';
const home=document.querySelector('#home'),catalog=document.querySelector('#catalog'),avatar=document.querySelector('#avatar'),userName=document.querySelector('#userName');
function initTelegramUser(){const tg=window.Telegram?.WebApp;const user=tg?.initDataUnsafe?.user;if(!user)return;if(user.photo_url)avatar.innerHTML=`<img src="${user.photo_url}" alt="Аватар пользователя">`;else avatar.textContent=(user.first_name||'П').slice(0,1).toUpperCase();userName.textContent=[user.first_name,user.last_name].filter(Boolean).join(' ')||'Добро пожаловать 🤎'}
function openCatalog(cat){active=cat;subfilter='all';query='';document.body.dataset.category=cat;const art={Завтраки:['Завтрак','Начни день вкусно и легко'],Обеды:['Обед','Сытно, ярко и без лишнего'],Ужины:['Ужин','Спокойный вечер начинается с еды'],Десерты:['Десерты','Немного сладкого для настроения'],Салаты:['Салаты','Свежесть в каждой тарелке']}[cat];const visuals={Завтраки:`<svg viewBox="0 0 180 110" fill="none"><circle cx="132" cy="42" r="25" fill="currentColor" opacity=".11"/><circle cx="132" cy="42" r="15" stroke="currentColor" stroke-width="2" opacity=".34"/><path d="M28 82c20-29 54-30 76 0" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".34"/><path d="M39 81c9-13 20-19 32-20 12 1 24 7 32 20" stroke="currentColor" stroke-width="8" stroke-linecap="round" opacity=".12"/><path d="M52 74c7-16 17-24 29-29M69 75c3-18 10-28 21-36M88 76c-1-16 3-27 11-37" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".38"/><circle cx="51" cy="23" r="3" fill="currentColor" opacity=".3"/><circle cx="92" cy="16" r="2" fill="currentColor" opacity=".28"/></svg>`,Обеды:`<svg viewBox="0 0 180 110" fill="none"><ellipse cx="105" cy="67" rx="48" ry="17" fill="currentColor" opacity=".08"/><ellipse cx="105" cy="61" rx="43" ry="29" stroke="currentColor" stroke-width="2" opacity=".3"/><ellipse cx="105" cy="59" rx="31" ry="19" fill="currentColor" opacity=".12"/><path d="M79 57c10-14 19-17 27-5 7-11 18-9 25 5" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".38"/><path d="M48 31c8 5 11 13 8 23M50 43c8-5 14-5 20 0" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".32"/><circle cx="151" cy="25" r="4" fill="currentColor" opacity=".25"/></svg>`,Ужины:`<svg viewBox="0 0 180 110" fill="none"><circle cx="125" cy="40" r="25" fill="currentColor" opacity=".09"/><path d="M135 18c-12 5-19 17-17 29 2 12 12 21 25 22-8 6-20 7-30 1-15-9-20-28-11-43 7-12 21-18 33-15Z" fill="currentColor" opacity=".27"/><path d="M37 85c15-18 31-25 47-24 15 1 28 9 40 24" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".28"/><path d="M72 82c-4-19-1-31 10-42M86 82c7-15 16-23 29-28" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".3"/><circle cx="50" cy="26" r="3" fill="currentColor" opacity=".22"/><circle cx="158" cy="65" r="2" fill="currentColor" opacity=".25"/></svg>`,Десерты:`<svg viewBox="0 0 180 110" fill="none"><circle cx="125" cy="54" r="31" fill="currentColor" opacity=".08"/><path d="M88 58c0-13 11-23 25-23s25 10 25 23v22H88V58Z" fill="currentColor" opacity=".1"/><path d="M88 58c0-13 11-23 25-23s25 10 25 23" stroke="currentColor" stroke-width="2.5" opacity=".36"/><path d="M88 80h50" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".32"/><circle cx="108" cy="46" r="4" fill="currentColor" opacity=".3"/><circle cx="124" cy="42" r="3" fill="currentColor" opacity=".24"/><circle cx="139" cy="49" r="3" fill="currentColor" opacity=".27"/><path d="M48 34c4-9 13-13 21-8 8 5 9 15 2 21-7 6-17 3-23-5Z" fill="currentColor" opacity=".18"/></svg>`,Салаты:`<svg viewBox="0 0 180 110" fill="none"><ellipse cx="105" cy="69" rx="45" ry="15" fill="currentColor" opacity=".08"/><path d="M63 59c8 28 22 40 42 40s35-12 43-40" stroke="currentColor" stroke-width="3" opacity=".28"/><path d="M68 59c12 10 24 14 37 14 14 0 27-5 39-14" stroke="currentColor" stroke-width="2" opacity=".24"/><path d="M91 58c-4-18 2-31 18-39M108 58c9-18 20-25 34-24M82 62c-12-13-23-16-35-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".36"/><path d="M109 23c7-5 14-4 20 2-7 6-14 6-20-2ZM54 53c-7-7-14-7-20-1 6 7 13 8 20 1Z" fill="currentColor" opacity=".22"/></svg>`}[cat];document.querySelector('#artVisual').innerHTML=visuals;document.querySelector('#artTitle').textContent=art[0];document.querySelector('#artSub').textContent=art[1];document.querySelector('#pageTitle').textContent='';document.querySelector('#search').value='';home.style.display='none';catalog.classList.add('show');renderSubtabs();render();window.scrollTo({top:0,behavior:'smooth'})}
function openByTime(){const h=new Date().getHours();openCatalog(h>=5&&h<11?'Завтраки':h>=11&&h<17?'Обеды':'Ужины')}
const filters={Завтраки:[['all','Все завтраки'],['protein','Высокобелковые'],['carbs','Высокоуглеводные'],['oatmeal','Овсянка'],['eggs','Яйца'],['cottage','Творог']],Обеды:[['all','Все обеды'],['fish','Рыба'],['meat','Мясо'],['chicken','Курица'],['seafood','Морепродукты'],['airfryer','Аэрогриль'],['oven','Духовка']],Ужины:[['all','Все ужины'],['fish','Рыба'],['meat','Мясо'],['seafood','Морепродукты'],['airfryer','Аэрогриль'],['oven','Духовка']],Десерты:[['all','Все десерты'],['lowcal','Низкокалорийные'],['lactose','Без лактозы'],['nosugar','Без сахара'],['quick','Быстрые']],Салаты:[['all','Салаты'],['protein','Высокобелковые'],['chicken','С курицей'],['seafood','С морепродуктами']]};function renderSubtabs(){const el=document.querySelector('#subtabs');if(active==='all'){el.hidden=true;el.innerHTML='';return}el.hidden=false;el.innerHTML=filters[active].map(([id,label])=>`<button class="subtab ${subfilter===id?'active':''}" data-filter="${id}">${label}</button>`).join('')}
const grid=document.querySelector('#grid'),empty=document.querySelector('#empty');
function render(){const list=recipes.filter(r=>(active==='all'||r.cat===active)&&matchesFilter(r,subfilter)&&r.name.toLowerCase().includes(query.toLowerCase()));grid.innerHTML=list.map(r=>`<article class="card" data-id="${r.id}"><div class="photo">${r.image?`<img src="${r.image}" alt="${r.name}" loading="lazy">`:r.emoji}</div><div class="body"><div class="cat">${r.cat}</div><div class="name">${r.name}</div><div class="meta">${r.kcal} ккал · Б ${r.b} · Ж ${r.j} · У ${r.u}</div><button class="open">Открыть рецепт</button></div></article>`).join('');empty.hidden=!!list.length}
function matchesFilter(r,f){
  if(f==='all')return true;
  if(Array.isArray(r.filters)&&r.filters.length&&r.filters.includes(f))return true;
  const n=(r.name||'').toLowerCase();
  if(f==='protein')return Number(r.b)>=40;
  if(f==='carbs')return Number(r.u)>=45;
  if(f==='oatmeal')return /овсян/.test(n);
  if(f==='eggs')return /яйц|омлет|яич|фриттат/.test(n);
  if(f==='cottage')return /творог|творож|сырник/.test(n);
  if(f==='lactose')return !/сыр|творог|сливоч|йогурт|фет/.test(n);
  if(f==='quick')return Number(r.id)%3!==0;
  if(f==='lowcal')return Number(r.kcal)<=450;
  if(f==='nosugar')return !/сахар|шоколад|печень|чизкейк/.test(n);
  if(f==='fish')return /рыб|лосос|треск|тунец/.test(n);
  if(f==='meat')return /куриц|индейк|говядин|котлет|тефтел|шашлыч|гуляш/.test(n);
  if(f==='chicken')return /куриц|курин/.test(n);
  if(f==='seafood')return /кревет|морепродукт|мидии|мидия|кальмар|осьминог/.test(n);
  if(f==='oven')return /запеч|духов|фриттат|гратен/.test(n);
  if(f==='airfryer')return Array.isArray(r.filters)&&r.filters.includes('airfryer');
  return false;
}
function openRecipe(r){document.querySelector('#detail').innerHTML=`<div class="detail-photo">${r.image?`<img src="${r.image}" alt="${r.name}">`:r.emoji}</div><div class="detail"><div class="cat">${r.cat}</div><h2>${r.name}</h2><div class="nutrition"><div class="nut"><b>${r.kcal}</b><span>ккал</span></div><div class="nut"><b>${r.b} г</b><span>белки</span></div><div class="nut"><b>${r.j} г</b><span>жиры</span></div><div class="nut"><b>${r.u} г</b><span>углеводы</span></div></div><div class="section">Ингредиенты</div><div class="ingredients">${r.ingredients.map(x=>'<div>'+x+'</div>').join('')}</div><div class="section">Приготовление</div><ol class="steps">${r.steps.map(x=>'<li>'+x+'</li>').join('')}</ol></div>`;document.querySelector('#modal').classList.add('show')}
document.querySelector('#grid').addEventListener('click',e=>{const card=e.target.closest('.card');if(card)openRecipe(recipes.find(r=>r.id==card.dataset.id))});
document.querySelector('#close').onclick=()=>document.querySelector('#modal').classList.remove('show');
document.querySelector('#modal').addEventListener('click',e=>{if(e.target.id==='modal')e.currentTarget.classList.remove('show')});
document.querySelector('#search').oninput=e=>{query=e.target.value;render()};
document.querySelector('#subtabs').addEventListener('click',e=>{if(!e.target.dataset.filter)return;subfilter=e.target.dataset.filter;document.querySelectorAll('.subtab').forEach(x=>x.classList.toggle('active',x===e.target));render()});
document.querySelector('#buy').onclick=()=>{window.location.href='https://t.me/';};
document.querySelector('#timeBtn').onclick=openByTime;
document.querySelectorAll('[data-home-cat]').forEach(b=>b.onclick=()=>openCatalog(b.dataset.homeCat));
document.querySelector('#back').onclick=()=>{catalog.classList.remove('show');home.style.display='block';delete document.body.dataset.category;window.scrollTo({top:0,behavior:'smooth'})};
const tgScript=document.createElement('script');tgScript.src='https://telegram.org/js/telegram-web-app.js';tgScript.onload=initTelegramUser;document.head.appendChild(tgScript);
initTelegramUser();renderSubtabs();render();

fetch('/api/recipes?ts='+Date.now(),{cache:'no-store'})
  .then(async x=>{if(!x.ok)throw new Error('HTTP '+x.status);return x.json()})
  .then(j=>{
    if(!Array.isArray(j.recipes))throw new Error('Каталог не получен');
    recipes=j.recipes;
    renderSubtabs();
    render();
  })
  .catch(e=>console.error('Catalog API error:',e));

document.querySelector('#howtoOpen')?.addEventListener('click',()=>{
  document.querySelector('#howtoModal')?.classList.add('show');
});
document.querySelector('#howtoClose')?.addEventListener('click',()=>{
  document.querySelector('#howtoModal')?.classList.remove('show');
});
document.querySelector('#howtoModal')?.addEventListener('click',e=>{
  if(e.target.id==='howtoModal')e.currentTarget.classList.remove('show');
});
