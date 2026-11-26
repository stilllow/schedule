/* Посещаемость: отметки «был / не был / уважительная» на парах, счётчик пропусков и лимит по предмету */
let ATD=[],ATTOK=true;
const attOf=(l,d)=>ATD.find(a=>a.subject===l.subject&&a.on_date===d&&a.start_time===l.start);
const attStat=s=>{const a=ATD.filter(x=>x.subject===s);return{was:a.filter(x=>x.status==='was').length,missed:a.filter(x=>x.status==='missed').length,exc:a.filter(x=>x.status==='excused').length}};
const attLimit=()=>+(P&&P.absLimit)||0;
async function loadAttendance(){
 if(!sb||!me)return;
 const r=await sb.from('attendance').select('*');
 if(r.error){ATTOK=!/relation|does not exist|schema|attendance/i.test(r.error.message);ATD=[];return}
 ATTOK=true;ATD=r.data||[];if(view==='today'||view==='att')render();
}
/* значок-предупреждение на карточке пары в «Сегодня» */
function attWarn(l,m){
 const lim=attLimit();if((m&&m!=='day')||l.cancel||l.el||!lim)return'';
 const x=attStat(l.subject).missed;
 return x>=lim?'<span class="tag x">Лимит пропусков исчерпан</span>':x===lim-1?'<span class="tag x">Остался 1 пропуск</span>':'';
}
/* кнопки отметки на карточке пары: только для дней, которые уже начались */
function attCtl(l,m){
 if((m&&m!=='day')||l.cancel||l.el||!ATTOK||typeof cur==='undefined')return'';
 const d=ymd(cur),now=new Date(),td=ymd(now);
 if(d>td||(d===td&&hm(now)<l.start))return'';
 const a=attOf(l,d),b=(s,txt,tip)=>`<button class="ab ${s}${a&&a.status===s?' on':''}" data-a="att" data-id="${l.id}" data-s="${s}" title="${tip}" aria-pressed="${!!(a&&a.status===s)}">${txt}</button>`;
 return`<div class="att" role="group" aria-label="Посещаемость">${b('was','Был','Был на паре')}${b('missed','Не был','Пропуск: считается в лимит')}${b('excused','Уважительная','Пропуск по уважительной причине: в лимит не считается')}</div>`;
}
ACTIONS.att=async t=>{
 const base=lessonsOn(cur).find(x=>x.id===t.dataset.id);if(!base)return;
 const d=ymd(cur),s=t.dataset.s,ex=attOf(base,d);
 if(ex&&ex.status===s){
  const r=await sb.from('attendance').delete().eq('id',ex.id);
  if(r.error)return toast(/relation|schema/i.test(r.error.message)?'Выполните migration_v9.sql, чтобы отметки сохранялись':'Ошибка: '+r.error.message);
  ATD=ATD.filter(x=>x.id!==ex.id);render();return;
 }
 const r=await sb.from('attendance').upsert({subject:base.subject,on_date:d,start_time:base.start,status:s},{onConflict:'user_id,subject,on_date,start_time'}).select().single();
 if(r.error)return toast(/relation|schema/i.test(r.error.message)?'Выполните migration_v9.sql, чтобы отметки сохранялись':'Ошибка: '+r.error.message);
 ATD=[...ATD.filter(x=>!(x.subject===base.subject&&x.on_date===d&&x.start_time===base.start)),r.data];
 const lim=attLimit();
 if(s==='missed'&&lim){const x=attStat(base.subject).missed;if(x>=lim)toast('Лимит пропусков по предмету исчерпан');else if(x===lim-1)toast('Остался 1 пропуск до лимита')}
 render();
};
async function setAbsLimit(n){
 P.absLimit=n;
 const r=await sb.from('profiles').update({absence_limit:n||null}).eq('id',me.id);
 if(r.error&&/column|schema/i.test(r.error.message))toast('Выполните migration_v9.sql, чтобы лимит сохранялся');
 render();
}
document.addEventListener('change',e=>{if(e.target.dataset&&e.target.dataset.s==='abslim')setAbsLimit(+e.target.value||0)});
function attHTML(){
 const subs=[...new Set([...L.filter(l=>!l.el).map(l=>l.subject),...ATD.map(a=>a.subject)])].sort((a,b)=>a.localeCompare(b));
 const lim=attLimit(),tot=subs.reduce((o,s)=>{const x=attStat(s);o.was+=x.was;o.missed+=x.missed;return o},{was:0,missed:0}),all=tot.was+tot.missed;
 const row=s=>{
  const x=attStat(s),l=L.find(q=>q.subject===s),pct=x.was+x.missed?Math.round(x.was/(x.was+x.missed)*100):null;
  const ratio=lim?Math.min(1,x.missed/lim):0,cls=!lim?'':x.missed>=lim?'bad':x.missed>=lim-1?'warn':'ok';
  return`<div class="card gl l atr" style="--c:${l?col(l):'var(--ac)'}"><div class="m"><b>${esc(s)}</b><span>${T('Был')}: ${x.was} · ${T('Не был')}: ${x.missed} · ${T('Уважительных')}: ${x.exc}${pct===null?'':' · '+T('Посещаемость')+' '+pct+'%'}</span>${lim?`<div class="abar ${cls}" role="img" aria-label="${T('Пропусков')} ${x.missed} ${T('из')} ${lim}"><i style="width:${ratio*100}%"></i></div><span class="${cls==='bad'?'od':''}">${T('Пропусков')} ${x.missed} ${T('из')} ${lim}${x.missed>=lim?' · '+T('лимит исчерпан'):x.missed===lim-1?' · '+T('остался 1'):''}</span>`:''}</div></div>`;
 };
 return`<div class="top"><h1>Посещаемость</h1></div>
 <p class="n hint">Отмечайте «Был», «Не был» или «Уважительная» прямо на карточке пары во вкладке «Сегодня». Здесь видно итоги по каждому предмету.</p>
 ${ATTOK?'':`<div class="note">${ic('alert')}Таблица посещаемости не найдена. Выполните migration_v9.sql в Supabase.</div>`}
 <div class="card gl"><label>Допустимо пропусков на предмет</label><select data-s="abslim">${[[0,'Не ограничивать'],...[2,3,4,5,6,8,10,12,15,20].map(n=>[n,n+''])].map(([v,t])=>`<option value="${v}" ${lim===v?'selected':''}>${t}</option>`).join('')}</select><p class="n">Когда останется один пропуск, на карточке пары появится предупреждение. Пропуски по уважительной причине не считаются.</p>
 <div class="atsum"><div><b>${all?Math.round(tot.was/all*100)+'%':'—'}</b><span>общая посещаемость</span></div><div><b>${tot.was}</b><span>было</span></div><div><b>${tot.missed}</b><span>пропущено</span></div></div></div>`+
 (subs.length?subs.map(row).join(''):'<div class="empty">Добавьте занятия, чтобы вести посещаемость</div>');
}
EXTRA_VIEWS.att=attHTML;
(function(){const a=typeof afterLoad==='function'?afterLoad:null;afterLoad=function(){if(a)a();loadAttendance()}})();
