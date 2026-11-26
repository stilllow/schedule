/* Инструменты: свой цвет акцента, тема по времени суток, резервная копия, картинки в Supabase Storage */

/* ---- цвет акцента ---- */
const ACCP=['#ff6b6b','#ff9f43','#feca57','#1dd1a1','#48dbfb','#54a0ff','#a29bfe','#f368e0'];
let ACC='';try{ACC=localStorage.getItem('acc')||''}catch(e){}
const accLum=c=>{const n=parseInt(c.slice(1),16);return .2126*(n>>16&255)+.7152*(n>>8&255)+.0722*(n&255)};
function applyAccent(c){
 const r=document.documentElement.style;
 if(/^#[0-9a-f]{6}$/i.test(c||'')&&r.setProperty){r.setProperty('--ac',c);r.setProperty('--on',accLum(c)>150?'#0b0f14':'#ffffff')}
 else if(r.removeProperty){r.removeProperty('--ac');r.removeProperty('--on')}
}
applyAccent(ACC);
async function setAccent(c){
 ACC=/^#[0-9a-f]{6}$/i.test(c||'')?c.toLowerCase():'';
 try{ACC?localStorage.setItem('acc',ACC):localStorage.removeItem('acc')}catch(e){}
 applyAccent(ACC);if(P)P.accent=ACC;
 if(me&&sb){const r=await sb.from('profiles').update({accent:ACC||null}).eq('id',me.id);if(r.error&&/column|schema/i.test(r.error.message))toast('Выполните migration_v9.sql, чтобы цвет сохранялся на всех устройствах')}
}
ACTIONS.accp=t=>{setAccent(t.dataset.c);if(view==='set')render()};
ACTIONS.accreset=()=>{setAccent('');if(view==='set')render()};
document.addEventListener('change',e=>{if(e.target.id==='accin'){setAccent(e.target.value);if(view==='set')render()}});

/* ---- тема по времени суток ---- */
let AUTO={on:false,day:'mint',night:'midnight',from:'07:00',to:'19:00'};
try{Object.assign(AUTO,JSON.parse(localStorage.getItem('auto')||'{}'))}catch(e){}
const isDayNow=(a=AUTO,d=new Date())=>{const n=hm(d);return a.from<a.to?(n>=a.from&&n<a.to):(n>=a.from||n<a.to)};
function autoTick(){
 if(!AUTO.on||!me||!P)return;
 const t=isDayNow()?AUTO.day:AUTO.night;
 if(THEMES.some(x=>x[0]===t)&&P.theme!==t){P.theme=t;applyUI(P.theme,P.font);if(view==='set')render()}
}
async function saveAuto(){
 try{localStorage.setItem('auto',JSON.stringify(AUTO))}catch(e){}
 if(P)P.autoTheme=JSON.stringify(AUTO);
 if(me&&sb){const r=await sb.from('profiles').update({auto_theme:JSON.stringify(AUTO)}).eq('id',me.id);if(r.error&&/column|schema/i.test(r.error.message))toast('Выполните migration_v9.sql, чтобы настройка сохранялась на всех устройствах')}
}
ACTIONS.autot=()=>{AUTO.on=!AUTO.on;saveAuto();autoTick();render()};
document.addEventListener('change',e=>{
 const k=e.target.dataset&&e.target.dataset.s;
 if(k&&k.startsWith('auto')){AUTO[{autoday:'day',autonight:'night',autofrom:'from',autoto:'to'}[k]]=e.target.value;saveAuto();autoTick();render()}
});
/* выбор темы вручную выключает автотему, иначе она тут же перебила бы выбор */
ACTIONS.th=t=>{
 P.theme=t.dataset.v;if(AUTO.on){AUTO.on=false;saveAuto();toast('Тема по времени суток выключена')}
 applyUI(P.theme,P.font);render();saveProfile();
};
setInterval(autoTick,60000);

/* ---- картинки в Supabase Storage (с запасным вариантом: картинка прямо в строке) ---- */
const canvasBlob=c=>new Promise(res=>c.toBlob(b=>res(b),'image/jpeg',.82));
async function uploadMedia(blob,name){
 try{
  if(!blob||!sb.storage)return null;
  const path=me.id+'/'+name+'-'+Date.now().toString(36)+'.jpg';
  const r=await sb.storage.from('media').upload(path,blob,{contentType:'image/jpeg',upsert:true});
  if(r.error)return null;
  const u=sb.storage.from('media').getPublicUrl(path);
  return u&&u.data?u.data.publicUrl:null;
 }catch(e){return null}
}
async function moveImages(){
 let n=0;
 for(const [k,name,col] of [['avatar','avatar','avatar'],['cardBg','bg','card_bg']]){
  const v=P[k];if(!v||!v.startsWith('data:'))continue;
  try{
   const b=await (await fetch(v)).blob(),u=await uploadMedia(b,name);
   if(!u)continue;
   const r=await sb.from('profiles').update({[col]:u}).eq('id',me.id);
   if(!r.error){P[k]=u;n++}
  }catch(e){}
 }
 toast(n?'Перенесено картинок: '+n:'Переносить нечего или хранилище не настроено (migration_v9.sql)');render();
}
ACTIONS.mvimg=moveImages;

/* ---- резервная копия ---- */
const BK_TABLES=['lessons','decks','homework','overrides','notes','cards','attendance'];
const BK_PROFILE=['anchor_week_start','anchor_week_type','remind_minutes','bells','semester_start','semester_end','holidays','notify_text','theme','font','schedule_cyclic','saturday_off','electives_cyclic','widgets','clock_style','tod_merge','accent','auto_theme','absence_limit','card_frame','card_status','card_color'];
async function backupData(){
 const tables={};
 for(const t of BK_TABLES){const r=await sb.from(t).select('*');tables[t]=r.error?[]:(r.data||[])}
 const p=await sb.from('profiles').select('*').eq('id',me.id).maybeSingle(),prof={};
 if(p.data)BK_PROFILE.forEach(k=>{if(k in p.data)prof[k]=p.data[k]});
 return{app:'schedule',version:1,date:new Date().toISOString(),profile:prof,tables};
}
ACTIONS.bkexp=async()=>{
 toast('Собираю данные…');
 try{
  const d=await backupData(),n=Object.values(d.tables).reduce((s,a)=>s+a.length,0);
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'}));
  a.download='raspisanie-'+ymd(new Date())+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  toast('Копия сохранена, записей: '+n);
 }catch(e){toast('Не удалось собрать копию')}
};
ACTIONS.bkimp=()=>{const f=$('#bkf');if(f)f.click()};
let BKD=null;
document.addEventListener('change',async e=>{
 if(e.target.id!=='bkf')return;
 const f=e.target.files[0];e.target.value='';if(!f)return;
 try{
  const d=JSON.parse(await f.text());
  if(d.app!=='schedule'||!d.tables)throw 0;
  BKD=d;
  const rows=BK_TABLES.map(t=>[t,(d.tables[t]||[]).length]).filter(x=>x[1]),n=rows.reduce((s,x)=>s+x[1],0);
  const names={lessons:'занятий',decks:'колод',homework:'заданий',overrides:'отмен и замен',notes:'заметок',cards:'карточек',attendance:'отметок посещаемости'};
  dlg('Восстановить из копии',`<p class="n">Копия от ${esc(String(d.date||'').slice(0,10))}. Ничего из текущих данных не удаляется: записи, которых ещё нет, будут добавлены.</p><p class="bkl">${rows.length?rows.map(([t,c])=>`<span class="tag">${c} ${names[t]}</span>`).join(' '):'В копии нет записей'}</p><label class="chk"><input type="checkbox" name="pr" ${Object.keys(d.profile||{}).length?'checked':''}> Восстановить и настройки (тема, звонки, каникулы, виджеты)</label>`,
   async v=>{await restoreData(BKD,v.get('pr')==='on');return true},'Восстановить');
 }catch(err){toast('Это не файл резервной копии расписания')}
});
async function restoreData(d,withProfile){
 toast('Восстанавливаю…');
 const idmap={},res=[];
 const fk={homework:{lesson_id:'lessons'},overrides:{lesson_id:'lessons'},cards:{deck_id:'decks'}};
 for(const t of BK_TABLES){
  const rows=d.tables[t]||[];if(!rows.length)continue;
  const ex=new Set(((await sb.from(t).select('id')).data||[]).map(x=>x.id));
  let ok=0,bad=0;
  for(const r0 of rows){
   if(t!=='attendance'&&ex.has(r0.id)){ok++;continue}
   const r={...r0};delete r.user_id;delete r.created_at;
   if(t==='attendance')delete r.id;
   for(const [c,tb] of Object.entries(fk[t]||{}))if(r[c]&&idmap[tb+':'+r[c]])r[c]=idmap[tb+':'+r[c]];
   let x=await sb.from(t).insert(r).select('id').single();
   if(x.error&&t!=='attendance'&&/duplicate|unique|violates|policy/i.test(x.error.message)){
    const nid=crypto.randomUUID();x=await sb.from(t).insert({...r,id:nid}).select('id').single();
    if(!x.error)idmap[t+':'+r0.id]=nid;
   }
   if(x.error)bad++;else ok++;
  }
  res.push(t+': '+ok+(bad?' (не вышло: '+bad+')':''));
 }
 if(withProfile&&d.profile&&Object.keys(d.profile).length){
  let r=await sb.from('profiles').update(d.profile).eq('id',me.id);
  if(r.error&&/column|schema/i.test(r.error.message)){const keep=Object.fromEntries(Object.entries(d.profile).filter(([k])=>!['accent','auto_theme','absence_limit','card_frame','card_status','card_color','clock_style','tod_merge'].includes(k)));r=await sb.from('profiles').update(keep).eq('id',me.id)}
 }
 await load();render();
 toast('Готово. '+res.join('; '));
}

/* ---- блоки настроек ---- */
function extraSettingsHTML(){
 const sw=(k,on,lbl)=>`<div class="card sat"><span>${lbl}</span><button class="sw2${on?' on':''}" role="switch" aria-checked="${on}" data-a="${k}" aria-label="${lbl}"><i></i></button></div>`;
 const th=(k,v)=>`<select data-s="${k}">${THEMES.map(([x,n])=>`<option value="${x}" ${v===x?'selected':''}>${n}</option>`).join('')}</select>`;
 return`<div class="card gl"><h2 style="margin-top:0">Цвет акцента</h2><p class="n">Цвет кнопок, выделения и свечения. Подстраивается под любую тему.</p><div class="sw">${ACCP.map(c=>`<button type="button" class="${ACC===c?'on':''}" data-a="accp" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}<input id="accin" type="color" value="${ACC||'#54a0ff'}" aria-label="Свой цвет"></div><div class="row"><button class="btn g" data-a="accreset"${ACC?'':' disabled'}>Вернуть цвет темы</button></div></div>
 <div class="card gl"><h2 style="margin-top:0">Тема по времени суток</h2>${sw('autot',AUTO.on,'Менять тему автоматически')}<p class="n">Днём включается светлая тема, вечером тёмная. Если выбрать тему вручную, автосмена выключится.</p>${AUTO.on?`<div class="row"><div><label>Днём</label>${th('autoday',AUTO.day)}</div><div><label>Ночью</label>${th('autonight',AUTO.night)}</div></div><div class="row"><div><label>Дневная тема с</label><input type="time" data-s="autofrom" value="${AUTO.from}"></div><div><label>Ночная тема с</label><input type="time" data-s="autoto" value="${AUTO.to}"></div></div>`:''}</div>
 <div class="card gl"><h2 style="margin-top:0">Резервная копия</h2><p class="n">Все занятия, задания, заметки, карточки, отметки посещаемости и настройки в одном файле.</p><div class="row"><button class="btn g wide" data-a="bkexp">${ic('download')}Скачать копию</button><button class="btn g wide" data-a="bkimp">${ic('upload')}Восстановить из файла</button></div><input type="file" id="bkf" accept="application/json,.json" hidden><p class="n">При восстановлении ничего не удаляется: добавляется только то, чего ещё нет.</p></div>
 <div class="card gl"><h2 style="margin-top:0">Картинки</h2><p class="n">Фото профиля и фон карточки хранятся в облаке Supabase Storage, поэтому сайт работает быстрее.</p>${(P.avatar&&P.avatar.startsWith('data:'))||(P.cardBg&&P.cardBg.startsWith('data:'))?`<button class="btn g wide" data-a="mvimg">${ic('upload')}Перенести мои картинки в хранилище</button>`:'<p class="n">Все ваши картинки уже в хранилище или их нет.</p>'}</div>`;
}
(function(){const a=typeof afterLoad==='function'?afterLoad:null;afterLoad=function(){
 if(a)a();
 if(P.accent){ACC=P.accent;try{localStorage.setItem('acc',ACC)}catch(e){}}applyAccent(ACC);
 if(P.autoTheme){try{Object.assign(AUTO,JSON.parse(P.autoTheme));localStorage.setItem('auto',JSON.stringify(AUTO))}catch(e){}}
 autoTick();
}})();
