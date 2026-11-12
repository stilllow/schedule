/* Тема и шрифт, загрузка и сохранение профиля */
function applyUI(th,f){const r=document.documentElement;r.dataset.th=th||'graphite';r.dataset.f=fontOk(f)?f:'system';const tc=document.querySelector('meta[name=theme-color]');if(tc)tc.content=TC[r.dataset.th]||'#06141B';try{localStorage.setItem('ui',JSON.stringify({th:r.dataset.th,f:r.dataset.f}))}catch(e){}}
try{const u=JSON.parse(localStorage.getItem('ui')||'{}');applyUI(u.th,u.f)}catch(e){}
async function load(){
 const [p,l,h,o]=await Promise.all([sb.from('profiles').select('*').eq('id',me.id).maybeSingle(),sb.from('lessons').select('*'),sb.from('homework').select('*'),sb.from('overrides').select('*')]);
 const e=p.error||l.error||h.error||o.error;if(e)toast('Ошибка загрузки: '+e.message+'. Выполнен ли migration_v2.sql?');
 const r=p.data||{},date=r.anchor_week_start||ymd(monday(new Date()));
 P={name:r.display_name||'',anchor:{wk:wk(pd(date)),type:r.anchor_week_type||'up',date},remind:r.remind_minutes||10,bells:r.bells||BELLS,sem:[r.semester_start||'',r.semester_end||''],hol:r.holidays||[],nt:r.notify_text||PRE[1],theme:r.theme||'graphite',font:fontOk(r.font)?r.font:'system',cyc:r.schedule_cyclic!==false,satOff:!!r.saturday_off,avatar:r.avatar||'',elCyc:!!r.electives_cyclic,share:r.share_token||'',username:r.username||'',bio:r.bio||'',uni:r.university||'',disc:r.is_discoverable!==false,showOnline:r.show_online!==false,fcode:r.friend_code||'',widgets:Array.isArray(r.widgets)?r.widgets:null};
 L=(l.data||[]).map(fromRow);HW=h.data||[];OV={};(o.data||[]).forEach(x=>OV[x.lesson_id+x.on_date]=x);
 wsel=wkType(new Date());applyUI(P.theme,P.font);
 if(typeof afterLoad==='function')afterLoad();
}
async function saveProfile(){
 const base={id:me.id,anchor_week_start:P.anchor.date,anchor_week_type:P.anchor.type,remind_minutes:P.remind,bells:P.bells,semester_start:P.sem[0]||null,semester_end:P.sem[1]||null,holidays:P.hol,notify_text:P.nt,theme:P.theme,font:P.font};
 const v4={schedule_cyclic:P.cyc,saturday_off:P.satOff},v5={electives_cyclic:P.elCyc};
 let r=await sb.from('profiles').upsert({...base,...v4,...v5});
 if(r.error&&/column|schema/i.test(r.error.message)){r=await sb.from('profiles').upsert({...base,...v4});if(r.error&&/column|schema/i.test(r.error.message)){r=await sb.from('profiles').upsert(base);toast('Выполните migration_v4.sql, чтобы новые настройки сохранялись')}else if(!r.error)toast('Выполните migration_v5.sql, чтобы новые настройки сохранялись')}
 if(r.error)toast('Не удалось сохранить: '+r.error.message);
}
