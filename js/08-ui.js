/* Аватар, ползунок масштаба, экран аккаунта, выпадающие списки */
const avHTML=c=>P&&P.avatar?`<img class="av ${c}" src="${esc(P.avatar)}" alt="">`:`<span class="av ${c}">${esc(((P&&P.name)||(me&&me.email)||'?')[0].toUpperCase())}</span>`;
function paintUser(){const u=$('#uc');if(!u||!P||!me)return;u.innerHTML='<span class="avw2">'+avHTML('s')+(P.showOnline!==false?'<i class="od"></i>':'')+'</span><span>'+esc(P.name||(me.email||'').split('@')[0])+'</span>'}
async function setAvatar(file){
 if(!file)return;
 try{
  const bmp=await createImageBitmap(file),n=Math.min(bmp.width,bmp.height),c=document.createElement('canvas');c.width=c.height=192;
  c.getContext('2d').drawImage(bmp,(bmp.width-n)/2,(bmp.height-n)/2,n,n,0,0,192,192);
  const url=c.toDataURL('image/jpeg',.85),c2=document.createElement('canvas');c2.width=c2.height=64;c2.getContext('2d').drawImage(c,0,0,64,64);
  let r=await sb.from('profiles').upsert({id:me.id,avatar:url,avatar_thumb:c2.toDataURL('image/jpeg',.8)});
  if(r.error&&/column|schema/i.test(r.error.message))r=await sb.from('profiles').upsert({id:me.id,avatar:url});
  if(r.error)return toast('Ошибка: '+r.error.message);
  P.avatar=url;toast('Фото обновлено');render();
 }catch(e){toast('Не удалось загрузить фото')}
}
document.addEventListener('change',e=>{if(e.target.id==='avf'){setAvatar(e.target.files[0]);e.target.value=''}});
const SV=[75,80,85,90,95,100,105,110,115,120,125],spct=v=>(v-75)/50*100;
const sliderHTML=()=>`<div class="sl" role="slider" tabindex="0" aria-valuemin="75" aria-valuemax="125" aria-valuenow="${SC}" aria-label="Масштаб интерфейса"><div class="sa"><div class="st"><div class="sf" style="width:${spct(SC)}%"></div></div>${SV.map(v=>`<i class="${v===100?'m':''}" style="left:${spct(v)}%"${v%25===0?` data-l="${v}"`:''}></i>`).join('')}<div class="sh" style="left:${spct(SC)}%"></div></div></div>`;
let sd=null;
const slVal=(e,sl)=>{const a=sl.querySelector('.sa').getBoundingClientRect();return Math.round((75+Math.min(1,Math.max(0,(e.clientX-a.left)/a.width))*50)/5)*5};
function slPaint(sl,v){sl.querySelector('.sh').style.left=spct(v)+'%';sl.querySelector('.sf').style.width=spct(v)+'%';sl.setAttribute('aria-valuenow',v);const o=$('#scv');if(o)o.textContent=v+'%'}
function slApply(v,key){SC=v;try{localStorage.setItem('scale',v)}catch(e){}applyScale();render();if(key)setTimeout(()=>{const n=$('.sl');if(n)n.focus()},0)}
document.addEventListener('pointerdown',e=>{const sl=e.target.closest&&e.target.closest('.sl');if(!sl)return;sd={sl,v:slVal(e,sl)};try{sl.setPointerCapture(e.pointerId)}catch(_){}slPaint(sl,sd.v);e.preventDefault()});
document.addEventListener('pointermove',e=>{if(!sd)return;sd.v=slVal(e,sd.sl);slPaint(sd.sl,sd.v)});
document.addEventListener('pointerup',()=>{if(!sd)return;const v=sd.v;sd=null;if(v!==SC)slApply(v)});
document.addEventListener('pointercancel',()=>{sd=null;render()});
document.addEventListener('keydown',e=>{const sl=e.target.closest&&e.target.closest('.sl');if(!sl)return;const d={ArrowLeft:-5,ArrowDown:-5,ArrowRight:5,ArrowUp:5}[e.key];if(e.key==='Home'||e.key==='End'){slApply(e.key==='Home'?75:125,1);e.preventDefault()}else if(d){slApply(Math.min(125,Math.max(75,SC+d)),1);e.preventDefault()}});
let lastY=0;window.addEventListener('scroll',()=>{const y=window.scrollY||0,b=$('#burger');if(b)b.classList.toggle('hide',y>lastY&&y>60);lastY=y},{passive:true});
function accHTML(){
 const nm=P.name||'',mail=me.email||'';
 return`<h1>Аккаунт</h1><div class="card gl acc" style="margin-top:12px"><div class="avw">${avHTML('l')}<button class="ib avb" data-a="avpick" aria-label="Изменить фото">${ic('camera')}</button></div><div class="m"><b>${esc(nm||mail.split('@')[0])}</b><span>${esc(mail)}</span></div><input type="file" id="avf" accept="image/*" hidden></div>
 <div class="row"><button class="btn g wide" data-a="avpick">${ic('camera')}Изменить фото</button>${P.avatar?`<button class="btn d wide" data-a="avdel">Удалить фото</button>`:''}</div>
 ${profileEditHTML()}
 <div class="card gl"><h2 style="margin-top:0">Почта</h2><label>Новая почта</label><input id="ae" type="email" placeholder="${esc(mail)}"><button class="btn wide" data-a="accmail">Сменить почту</button><p class="n">Подтверждение придёт на новую почту.</p></div>
 <div class="card gl"><h2 style="margin-top:0">Пароль</h2><label>Новый пароль</label><input id="ap" type="password" autocomplete="new-password"><label>Повторите пароль</label><input id="ap2" type="password" autocomplete="new-password"><button class="btn wide" data-a="accpass">Сменить пароль</button></div>
 <div class="card gl"><h2 style="margin-top:0">Данные</h2><button class="btn g wide" data-a="out">${ic('logout')}Выйти</button><button class="btn d wide" data-a="accwipe" style="margin-top:8px">Очистить расписание</button><button class="btn d wide" data-a="accdel" style="margin-top:8px">Удалить аккаунт</button><p class="n">Очистка удаляет занятия, задания и отмены. Удаление аккаунта необратимо.</p></div>`}
const closeDD=()=>$$('.dl').forEach(l=>l.hidden=true);
function enhance(){
 $$('select:not([data-e])').forEach(sel=>{
  sel.dataset.e=1;sel.style.display='none';
  const d=document.createElement('div');d.className='dd';
  d.innerHTML='<button type="button" class="dv" aria-haspopup="listbox"><span></span>'+ic('chev')+'</button><div class="dl" hidden></div>';
  sel.after(d);
  const b=d.querySelector('.dv'),l=d.querySelector('.dl'),sp=b.firstChild;
  l.innerHTML=[...sel.options].map((o,i)=>`<button type="button" data-i="${i}" ${o.disabled?'disabled':''}>${esc(o.text)}</button>`).join('');
  const sync=()=>{sp.textContent=sel.selectedIndex>=0?sel.options[sel.selectedIndex].text:'';[...l.children].forEach((o,i)=>o.classList.toggle('on',i===sel.selectedIndex))};
  sync();
  b.onclick=e=>{e.stopPropagation();const was=!l.hidden;closeDD();if(!was){l.hidden=false;const r=b.getBoundingClientRect();d.classList.toggle('up',innerHeight-r.bottom<260&&r.top>innerHeight-r.bottom)}};
  l.onclick=e=>{const x=e.target.closest('button');if(!x)return;e.stopPropagation();sel.selectedIndex=+x.dataset.i;sel.dispatchEvent(new Event('change',{bubbles:true}));sync();closeDD()};
 });
}
document.addEventListener('click',closeDD);
$$('.grp').forEach(g=>g.addEventListener('mouseleave',()=>g.classList.remove('open')));
document.addEventListener('click',e=>{$$('.grp').forEach(g=>{if(!g.contains(e.target)||e.target.closest('.sub button'))g.classList.remove('open')})});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDD()});
new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});
