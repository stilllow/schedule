/* Задания: приоритет, подзадачи, повтор и привязка к паре. Переопределяет openHW, hwHTML и отметку выполнения */
const PRIO=[['0','Низкий'],['1','Обычный'],['2','Высокий']];
const REPS=[['','Не повторять'],['d','Каждый день'],['w','Каждую неделю'],['w2','Раз в две недели'],['m','Раз в месяц']];
const REPN={d:'каждый день',w:'каждую неделю',w2:'раз в две недели',m:'раз в месяц'};
const hwSubs=h=>Array.isArray(h.subtasks)?h.subtasks:[];
const hwPrio=h=>h.priority===undefined||h.priority===null?1:+h.priority;
function nextDue(s,r){
 const d=pd(s);
 if(r==='d')d.setDate(d.getDate()+1);else if(r==='w')d.setDate(d.getDate()+7);else if(r==='w2')d.setDate(d.getDate()+14);else if(r==='m')d.setMonth(d.getMonth()+1);
 return ymd(d);
}
function openHW(h){
 h=h||{};const subs=hwSubs(h);
 dlg(h.id?'Изменить задание':'Новое задание',
  fld('Что сделать',`<input name="t" required maxlength="120" value="${esc(h.title||'')}">`)+
  fld('Занятие',`<select name="l"><option value="">— не привязано —</option>${L.map(l=>`<option value="${l.id}" ${h.lesson_id===l.id?'selected':''}>${esc(l.subject)} (${DAYS[l.day].slice(0,2)}, ${l.start})</option>`).join('')}</select><p class="n">Привязка к паре: в списке заданий будет цвет и название предмета.</p>`)+
  fld('Срок',`<input name="d" type="date" required value="${h.due_date||ymd(new Date())}">`)+
  `<div class="row">`+fld('Приоритет',`<select name="p">${PRIO.map(([v,t])=>`<option value="${v}" ${String(hwPrio(h))===v?'selected':''}>${t}</option>`).join('')}</select>`)+
  fld('Повтор',`<select name="r">${REPS.map(([v,t])=>`<option value="${v}" ${(h.repeat_rule||'')===v?'selected':''}>${t}</option>`).join('')}</select>`)+`</div><p class="n">Повтор: когда вы отметите задание выполненным, автоматически появится такое же со следующим сроком.</p>`+
  fld('Подзадачи',`<textarea name="s" rows="3" maxlength="600" placeholder="Каждая строка — отдельный шаг">${esc(subs.map(x=>x.t).join('\n'))}</textarea><p class="n">Каждая строка — отдельный шаг. Отмечать шаги можно прямо в списке заданий.</p>`),
  async v=>{
   const old=Object.fromEntries(subs.map(x=>[x.t,x.d]));
   const st=v.get('s').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,20).map(t=>({t:t.slice(0,80),d:!!old[t]}));
   const base={title:v.get('t').trim(),lesson_id:v.get('l')||null,due_date:v.get('d')};
   const pr=+v.get('p'),rp=v.get('r')||null,ex={priority:pr,subtasks:st,repeat_rule:rp};
   const useEx=pr!==1||st.length||rp||(h.id&&'priority' in h);
   const q=(o)=>h.id?sb.from('homework').update(o).eq('id',h.id).select().single():sb.from('homework').insert(o).select().single();
   let r=await q(useEx?{...base,...ex}:base);
   if(r.error&&useEx&&/priority|subtasks|repeat|column|schema/i.test(r.error.message)){r=await q(base);if(!r.error)toast('Выполните migration_v9.sql, чтобы приоритет, подзадачи и повтор сохранялись')}
   if(r.error){toast('Ошибка: '+r.error.message);return false}
   HW=h.id?HW.map(x=>x.id===h.id?r.data:x):[...HW,r.data];render();return true});
}
function hwHTML(){
 const t=ymd(new Date()),op=HW.filter(h=>!h.done).sort((a,b)=>a.due_date.localeCompare(b.due_date)||hwPrio(b)-hwPrio(a)),dn=HW.filter(h=>h.done);
 const row=h=>{
  const ls=L.find(l=>l.id===h.lesson_id),od=!h.done&&h.due_date<t,subs=hwSubs(h),sd=subs.filter(x=>x.d).length,pr=hwPrio(h);
  return`<div class="card gl l hwr" style="--c:${ls?col(ls):'var(--ac)'}"><button class="ck2${h.done?' on':''}" data-a="hwt" data-id="${h.id}" aria-label="Выполнено">${ic('check')}</button><div class="m"><b style="${h.done?'text-decoration:line-through;opacity:.6':''}">${esc(h.title)}</b><span class="${od?'od':''}">${ls?esc(ls.subject)+' · ':''}до ${fmt(h.due_date)}${od?' · просрочено':''}</span>${pr!==1||h.repeat_rule||subs.length?`<span>${pr===2?'<span class="tag x">Важно</span>':pr===0?'<span class="tag">Низкий приоритет</span>':''}${h.repeat_rule?`<span class="tag">${T('Повтор:')} ${T(REPN[h.repeat_rule]||'')}</span>`:''}${subs.length?`<span class="tag">${T('Шаги:')} ${sd}/${subs.length}</span>`:''}</span>`:''}${subs.length?`<div class="sts">${subs.map((x,i)=>`<button class="stk${x.d?' on':''}" data-a="hst" data-id="${h.id}" data-i="${i}" aria-pressed="${!!x.d}">${ic('check')}<span>${esc(x.t)}</span></button>`).join('')}</div>`:''}</div><button class="ib" data-a="hwe" data-id="${h.id}" aria-label="Изменить">${ic('edit')}</button><button class="ib" data-a="hwd" data-id="${h.id}" aria-label="Удалить">${ic('trash')}</button></div>`;
 };
 return`<div class="top"><h1>Задания</h1><button class="btn" data-a="hwa">${ic('plus')}Задание</button></div><p class="n hint">Сроки видны в сводке недели и в напоминаниях. Важные задания и повторы отмечены метками.</p>`+(op.length?op.map(row).join(''):'<div class="empty">Невыполненных заданий нет</div>')+(dn.length?'<h2>Выполнено</h2>'+dn.map(row).join(''):'');
}
ACTIONS.hwt=async t=>{
 const id=t.dataset.id,h=HW.find(x=>x.id===id);if(!h)return;
 const done=!h.done,r=await sb.from('homework').update({done}).eq('id',id).select().single();
 if(r.error)return toast('Ошибка: '+r.error.message);
 HW=HW.map(x=>x.id===id?r.data:x);
 if(done&&h.repeat_rule){
  const nd=nextDue(h.due_date,h.repeat_rule);
  if(!HW.some(x=>x.id!==id&&!x.done&&x.title===h.title&&x.due_date===nd)){
   const o={title:h.title,lesson_id:h.lesson_id,due_date:nd,priority:h.priority,subtasks:hwSubs(h).map(s=>({t:s.t,d:false})),repeat_rule:h.repeat_rule};
   const n=await sb.from('homework').insert(o).select().single();
   if(!n.error){HW=[...HW,n.data];toast('Следующее задание создано: до '+fmt(nd))}
  }
 }
 render();
};
ACTIONS.hst=async t=>{
 const id=t.dataset.id,i=+t.dataset.i,h=HW.find(x=>x.id===id);if(!h)return;
 const s=hwSubs(h).map((x,k)=>k===i?{...x,d:!x.d}:x);
 const r=await sb.from('homework').update({subtasks:s}).eq('id',id).select().single();
 if(r.error)return toast('Ошибка: '+r.error.message);
 HW=HW.map(x=>x.id===id?r.data:x);render();
};
