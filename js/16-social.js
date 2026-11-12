/* Аккаунты: ник, профиль, друзья, поиск пользователей, индикатор «в сети» */
let FR=[],frLoaded=false,FRRES=[],PROF=null,profUid='',profPrev='friends',frTimer=null,fqT=null,pnT=null,peT=null;
const safeImg=u=>/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(u||'')?u:'';
const NICK=/^[a-z0-9_]{3,20}$/;
const normNick=s=>String(s).toLowerCase().replace(/^@/,'').replace(/[^a-z0-9_]/g,'').slice(0,20);
const nickPatch=(P_)=>P_&&P_.username?'@'+P_.username:'';
function agoTxt(seen){
 if(!seen)return'был(а) давно';
 const m=Math.max(0,Math.round((Date.now()-new Date(seen).getTime())/60000));
 if(m<60)return'был(а) '+Math.max(1,m)+' мин назад';
 if(m<1440)return'был(а) '+Math.floor(m/60)+' ч назад';
 if(m<10080)return'был(а) '+Math.floor(m/1440)+' дн назад';
 return'был(а) давно';
}
const fromFr=r=>({fid:r.fid,status:r.status,dir:r.direction,uid:r.uid,username:r.username||'',name:r.display_name||'',thumb:r.avatar_thumb||'',uni:r.university||'',online:!!r.online,seen:r.last_seen||''});
const initialOf=o=>((o.name||o.username||'?')[0]||'?').toUpperCase();
const avOther=(o,c)=>{const im=safeImg(o.avatar||o.thumb);return`<span class="avw2">${im?`<img class="av ${c||'s'}" src="${im}" alt="">`:`<span class="av ${c||'s'}">${esc(initialOf(o))}</span>`}${o.online?'<i class="od"></i>':''}</span>`};
const inviteUrl=()=>location.origin+location.pathname+'?f='+P.fcode;
const MIG6='Выполните migration_v6.sql, чтобы включить заметки, карточки и друзей';
const colErr=m=>/column|schema|function|relation|does not exist/i.test(m||'');

function paintBadge(){const b=$('#fbdg');if(!b)return;const n=FR.filter(f=>f.dir==='in').length;b.textContent=n||'';b.hidden=!n}
async function loadFriends(){
 if(!me||!sb||!sb.rpc)return;
 try{const r=await sb.rpc('list_friends');if(!r.error)FR=(r.data||[]).map(fromFr)}catch(e){}
 frLoaded=true;paintBadge();
 const c=$('#frl');if(view==='friends'&&c)c.innerHTML=friendsListHTML();
}
async function heartbeat(){if(!me||!sb||!sb.rpc||document.visibilityState==='hidden')return;try{await sb.rpc('touch_presence')}catch(e){}}
async function processPendingFriend(){
 let c=null;try{c=localStorage.getItem('pf')}catch(e){}
 if(!c)return;
 try{localStorage.removeItem('pf')}catch(e){}
 const r=await sb.rpc('peek_friend_code',{code:c});
 if(r.error||!r.data)return toast('Ссылка недействительна');
 const p=r.data;
 if(p.id===me.id)return toast('Это ваша ссылка');
 const nm=p.username?'@'+p.username:(p.display_name||'');
 if(!confirm(T('Добавить '+nm+' в друзья?')))return;
 const a=await sb.rpc('add_friend_by_code',{code:c});
 if(a.error)return toast('Ошибка: '+a.error.message);
 toast(a.data==='friends'?'Вы уже друзья':'Вы теперь друзья');
 await loadFriends();view='friends';render();
}
function afterLoad(){
 heartbeat();loadFriends();loadReminders();processPendingFriend();
 if(!frTimer)frTimer=setInterval(()=>{heartbeat();loadFriends()},60000);
}

/* ---- друзья ---- */
function frRow(f){
 const sub=[f.username?'@'+esc(f.username):'',f.uni?esc(f.uni):''].filter(Boolean).join(' · ');
 const st=f.dir==='friend'?`<span class="st${f.online?' on':''}">${f.online?'в сети':agoTxt(f.seen)}</span>`:'';
 const btns=f.dir==='in'?`<button class="btn" data-a="facc" data-f="${f.fid}">Принять</button><button class="btn g" data-a="fdec" data-f="${f.fid}">Отклонить</button>`:f.dir==='out'?`<button class="btn g" data-a="fcancel" data-f="${f.fid}">Отменить запрос</button>`:`<button class="ib" data-a="frem" data-f="${f.fid}" aria-label="Убрать из друзей">${ic('trash')}</button>`;
 return`<div class="card gl frow"><button class="avb2" data-a="fopen" data-u="${f.uid}" aria-label="Карточка профиля">${avOther(f)}</button><div class="m"><b>${esc(f.name||('@'+f.username))}</b><span>${sub}</span>${st}</div><div class="fbt">${btns}</div></div>`;
}
function srRow(u){
 const rel=FR.find(f=>f.uid===u.uid);
 const sub=[u.username?'@'+esc(u.username):'',u.uni?esc(u.uni):''].filter(Boolean).join(' · ');
 const act=!rel?`<button class="btn" data-a="fadd" data-u="${u.uid}">${ic('plus')}Добавить в друзья</button>`:rel.dir==='friend'?'<span class="chip">в друзьях</span>':rel.dir==='out'?'<span class="chip">Запрос отправлен</span>':`<button class="btn" data-a="facc" data-f="${rel.fid}">Принять</button>`;
 return`<div class="card gl frow"><button class="avb2" data-a="fopen" data-u="${u.uid}" aria-label="Карточка профиля">${avOther(u)}</button><div class="m"><b>${esc(u.name||('@'+u.username))}</b><span>${sub}</span></div><div class="fbt">${act}</div></div>`;
}
function friendsListHTML(){
 const inc=FR.filter(f=>f.dir==='in'),out=FR.filter(f=>f.dir==='out'),fr=FR.filter(f=>f.dir==='friend');
 return(inc.length?'<h2>Запросы</h2>'+inc.map(frRow).join(''):'')+(out.length?'<h2>Отправлено</h2>'+out.map(frRow).join(''):'')+
  `<h2>Друзья · ${fr.length}</h2>`+(fr.length?fr.map(frRow).join(''):`<div class="note">${ic('users')}Пока нет друзей</div>`);
}
function friendsHTML(){
 return`<div class="top"><h1>Друзья</h1></div>
 ${P.username?'':`<div class="note">${ic('alert')}<span>Задайте ник в профиле, чтобы вас могли найти.</span><button class="btn g" data-a="gopro">Открыть профиль</button></div>`}
 <div class="card gl"><h2 style="margin-top:0">Пригласить</h2><div class="row"><button class="btn g" data-a="fcopy">${ic('link')}Копировать ссылку</button><button class="btn g" data-a="fnew">Новая ссылка</button></div><p class="n">Тот, кто откроет ссылку, станет вашим другом.</p></div>
 <div class="card gl"><h2 style="margin-top:0">Найти друга</h2><input id="fq" placeholder="@ник или имя" autocomplete="off" autocapitalize="none"><div id="fres"></div></div>
 <div id="frl">${friendsListHTML()}</div>`;
}
async function doSearch(v){
 const box=$('#fres');if(!box)return;
 if(v.length<2){box.innerHTML=v?'<p class="n">Введите минимум 2 символа</p>':'';return}
 const r=await sb.rpc('search_users',{q:v});
 if(r.error){box.innerHTML='';return toast(colErr(r.error.message)?MIG6:'Ошибка: '+r.error.message)}
 FRRES=(r.data||[]).map(x=>({uid:x.id,username:x.username||'',name:x.display_name||'',thumb:x.avatar_thumb||'',uni:x.university||''}));
 box.innerHTML=FRRES.length?FRRES.map(srRow).join(''):`<div class="note">${ic('search')}Ничего не найдено</div>`;
}
async function afterFr(){
 await loadFriends();
 const q=$('#fq');if(q&&q.value&&q.value.trim().length>=2)doSearch(q.value.trim());
 if(view==='profile')loadProfile(profUid);
}

/* ---- карточка профиля ---- */
async function loadProfile(uid){
 if(uid===me.id){PROF={id:me.id,username:P.username,display_name:P.name,avatar:P.avatar,bio:P.bio,university:P.uni,relation:'self',online:P.showOnline!==false};if(view==='profile')render();return}
 const r=await sb.rpc('get_profile_card',{target:uid});
 PROF=r.error||!r.data?{missing:true}:r.data;
 if(view==='profile')render();
}
function openProfile(uid){profUid=uid;if(view!=='profile')profPrev=view;PROF=null;view='profile';render();loadProfile(uid)}
function profileHTML(){
 const p=PROF,back=`<div class="top"><button class="btn g" data-a="pback">${ic('left')}Назад</button></div>`;
 if(!p)return back+'<div class="empty">Загрузка…</div>';
 if(p.missing)return back+`<div class="note">${ic('alert')}Профиль недоступен</div>`;
 const o={name:p.display_name,username:p.username,avatar:p.avatar,online:p.online};
 const act=p.relation==='self'?`<button class="btn" data-a="gopro">${ic('edit')}Редактировать профиль</button>`:
  p.relation==='friend'?`<button class="btn d" data-a="frem" data-f="${p.fid}">Убрать из друзей</button>`:
  p.relation==='in'?`<button class="btn" data-a="facc" data-f="${p.fid}">Принять</button><button class="btn g" data-a="fdec" data-f="${p.fid}">Отклонить</button>`:
  p.relation==='out'?'<button class="btn g" disabled>Запрос отправлен</button>':
  `<button class="btn" data-a="fadd" data-u="${p.id}">${ic('plus')}Добавить в друзья</button>`;
 const seen=p.relation==='self'||p.relation==='friend'?`<span class="chip st${p.online?' on':''}">${p.online?'в сети':(p.last_seen?agoTxt(p.last_seen):'не в сети')}</span>`:'';
 return back+`<div class="card gl pcard">${avOther(o,'l')}<h1>${esc(p.display_name||('@'+(p.username||'')))}</h1>${p.username?`<p class="n">@${esc(p.username)}</p>`:''}<div class="chips">${p.university?`<span class="chip">${ic('grad')}${esc(p.university)}</span>`:''}${seen}</div>${p.bio?`<p class="bio">${esc(p.bio).replace(/\n/g,'<br>')}</p>`:''}<div class="chips pact">${act}</div></div>`;
}
EXTRA_VIEWS.friends=friendsHTML;EXTRA_VIEWS.profile=profileHTML;

/* ---- редактирование профиля (экран «Аккаунт») ---- */
function profileEditHTML(){
 return`<div class="card gl" style="margin-top:12px"><h2 style="margin-top:0">Профиль</h2>
 <label>Ник</label><div class="nick"><span>@</span><input id="pu" maxlength="20" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(P.username||'')}" placeholder="nickname"></div><p class="n" id="pun">3–20 символов: латиница, цифры, _</p>
 <label>Имя</label><input id="an" maxlength="40" value="${esc(P.name||'')}" placeholder="Как к вам обращаться">
 <label>О себе</label><textarea id="pb" rows="3" maxlength="300" placeholder="Пара слов о себе">${esc(P.bio||'')}</textarea>
 <label>Место учёбы</label><input id="pe" list="pel" maxlength="120" value="${esc(P.uni||'')}" placeholder="Например: МГУ, факультет ВМК"><datalist id="pel"></datalist>
 <div class="card sat"><span>Показывать меня в поиске</span><button class="sw2${P.disc!==false?' on':''}" role="switch" aria-checked="${P.disc!==false}" data-a="pdisc" aria-label="Показывать меня в поиске"><i></i></button></div>
 <div class="card sat"><span>Показывать, что я в сети</span><button class="sw2${P.showOnline!==false?' on':''}" role="switch" aria-checked="${P.showOnline!==false}" data-a="ponl" aria-label="Показывать, что я в сети"><i></i></button></div>
 <button class="btn wide" data-a="profsave">Сохранить профиль</button>
 <button class="btn g wide" data-a="fopen" data-u="${me.id}" style="margin-top:8px">Карточка профиля</button></div>`;
}
document.addEventListener('input',e=>{
 const id=e.target.id;
 if(id==='fq'){const v=e.target.value.trim();clearTimeout(fqT);fqT=setTimeout(()=>doSearch(v),400)}
 else if(id==='pu'){
  const v=normNick(e.target.value);if(e.target.value!==v)e.target.value=v;
  clearTimeout(pnT);const o=$('#pun');if(!o)return;
  if(!v){o.textContent='3–20 символов: латиница, цифры, _';return}
  if(!NICK.test(v)){o.textContent='Неверный формат ника';return}
  if(v===P.username){o.textContent='Ник свободен';return}
  pnT=setTimeout(async()=>{const r=await sb.rpc('is_username_free',{u:v});o.textContent=r.error?'':(r.data?'Ник свободен':'Ник занят')},500);
 }else if(id==='pe'){
  const v=e.target.value.trim();clearTimeout(peT);
  if(v.length<2)return;
  peT=setTimeout(async()=>{const r=await sb.rpc('search_institutions',{q:v}),dl=$('#pel');if(!r.error&&dl)dl.innerHTML=(r.data||[]).map(x=>`<option value="${esc(x)}">`).join('')},400);
 }
});
async function setFlag(key,col,btn){
 const v=P[key]===false;
 const r=await sb.from('profiles').update({[col]:v}).eq('id',me.id);
 if(r.error)return toast(colErr(r.error.message)?MIG6:'Ошибка: '+r.error.message);
 P[key]=v;btn.classList.toggle('on',v);btn.setAttribute('aria-checked',String(v));paintUser();
}
ACTIONS.pdisc=t=>setFlag('disc','is_discoverable',t);
ACTIONS.ponl=t=>setFlag('showOnline','show_online',t);
ACTIONS.profsave=async()=>{
 const u=normNick($('#pu').value),name=$('#an').value.trim(),bio=$('#pb').value.trim(),uni=$('#pe').value.trim();
 if(u&&!NICK.test(u))return toast('Неверный формат ника');
 const r=await sb.from('profiles').update({display_name:name||null,bio:bio||null,university:uni||null,username:u||null}).eq('id',me.id);
 if(r.error)return toast(r.error.code==='23505'?'Этот ник занят':colErr(r.error.message)?MIG6:'Ошибка: '+r.error.message);
 Object.assign(P,{name,bio,uni,username:u});toast('Профиль сохранён');render();
};
ACTIONS.gopro=()=>{view='acc';render()};
ACTIONS.fopen=t=>openProfile(t.dataset.u);
ACTIONS.pback=()=>{view=profPrev&&profPrev!=='profile'?profPrev:'friends';render()};
ACTIONS.fadd=async t=>{
 const r=await sb.rpc('send_friend_request',{target:t.dataset.u});
 if(r.error)return toast(colErr(r.error.message)?MIG6:'Ошибка: '+r.error.message);
 toast(r.data==='accepted'||r.data==='friends'?'Вы теперь друзья':r.data==='none'?'Профиль недоступен':'Запрос отправлен');afterFr();
};
ACTIONS.facc=async t=>{const r=await sb.rpc('respond_friend',{fid:t.dataset.f,accept:true});if(r.error)return toast('Ошибка: '+r.error.message);afterFr()};
ACTIONS.fdec=async t=>{const r=await sb.rpc('respond_friend',{fid:t.dataset.f,accept:false});if(r.error)return toast('Ошибка: '+r.error.message);afterFr()};
ACTIONS.fcancel=async t=>{const r=await sb.from('friendships').delete().eq('id',t.dataset.f);if(r.error)return toast('Ошибка: '+r.error.message);afterFr()};
ACTIONS.frem=async t=>{if(!confirm(T('Удалить из друзей?')))return;const r=await sb.from('friendships').delete().eq('id',t.dataset.f);if(r.error)return toast('Ошибка: '+r.error.message);afterFr()};
ACTIONS.fcopy=async()=>{
 if(!P.fcode)return toast(MIG6);
 try{await navigator.clipboard.writeText(inviteUrl());toast('Ссылка-приглашение скопирована')}catch(e){toast('Ошибка: '+((e&&e.message)||e))}
};
ACTIONS.fnew=async()=>{
 const tk=newToken().replace(/[-_]/g,'').toLowerCase(),r=await sb.from('profiles').update({friend_code:tk}).eq('id',me.id);
 if(r.error)return toast(colErr(r.error.message)?MIG6:'Ошибка: '+r.error.message);
 P.fcode=tk;toast('Ссылка-приглашение обновлена');
};
