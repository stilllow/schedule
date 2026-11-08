/* Факультативы: свои экраны (карточки, «ближайшее», фильтр по дням, редактор с несколькими днями) */
let elDay=null;
const elGroups=()=>{
 const m=new Map();
 L.filter(l=>l.el).forEach(l=>{const k=l.subject.trim().toLowerCase();if(!m.has(k))m.set(k,{key:k,subject:l.subject,teacher:l.teacher,color:col(l),notes:l.notes,rows:[]});m.get(k).rows.push(l)});
 m.forEach(g=>g.rows.sort((a,b)=>a.day-b.day||a.start.localeCompare(b.start)));
 return[...m.values()].sort((a,b)=>a.subject.localeCompare(b.subject));
};
const elOk=(l,d)=>!P.elCyc||l.week==='both'||l.week===wkType(d);
function elNext(g,from){
 const nowM=from.getHours()*60+from.getMinutes();
 for(let k=0;k<15;k++){
  const d=new Date(from.getFullYear(),from.getMonth(),from.getDate()+k),di=(d.getDay()+6)%7;
  const rs=g.rows.filter(r=>r.day===di&&elOk(r,d)&&(k>0||toMin(r.end)>nowM)).sort((a,b)=>a.start.localeCompare(b.start));
  if(rs.length){const r=rs[0],live=k===0&&toMin(r.start)<=nowM;return{d,r,k,live,score:k*1440+(live?-1:toMin(r.start))}}
 }
 return null;
}
function elWhen(n){
 if(n.live)return'Идёт сейчас';
 const base=n.k===0?'Сегодня':n.k===1?'Завтра':n.d.toLocaleDateString(LOC(),{weekday:'short',day:'numeric',month:'short'});
 return base+', '+n.r.start;
}
function elCount(n){
 if(n.k!==0||n.live)return'';
 const now=new Date(),m=toMin(n.r.start)-(now.getHours()*60+now.getMinutes());
 return'через '+(m>=60?Math.floor(m/60)+' ч'+(m%60?' '+m%60+' мин':''):m+' мин');
}
function elCard(g,ed){
 const now=new Date(),n=elNext(g,now),today=(now.getDay()+6)%7;
 const chips=g.rows.map(r=>`<span class="chip${r.day===today&&elOk(r,now)?' on':''}"><b>${WD[r.day]}</b> ${r.start}–${r.end}${r.room?' · ауд. '+esc(r.room):''}${P.elCyc&&r.week!=='both'?' · '+WN[r.week]:''}</span>`).join('');
 const acts=ed?`<button class="ib" data-a="eledit" data-k="${esc(g.key)}" aria-label="Изменить">${ic('edit')}</button><button class="ib" data-a="eldel" data-k="${esc(g.key)}" aria-label="Удалить">${ic('trash')}</button>`:'';
 return`<div class="ecard gl" style="--c:${g.color}"><div class="eh"><div class="m"><b>${esc(g.subject)}</b><span>${[g.teacher,g.notes].filter(Boolean).map(esc).join(' · ')}</span></div>${acts}</div><div class="chips">${chips}</div>${n&&!ed?`<div class="nx">${ic('clock')}${elWhen(n)}</div>`:''}</div>`;
}
function elvHTML(ro){
 const gs=elGroups(),now=new Date();
 let best=null;gs.forEach(g=>{const n=elNext(g,now);if(n&&(!best||n.score<best.n.score))best={g,n}});
 let h='<div class="top"><h1>Расписание факультативов</h1></div>';
 if(!gs.length)return h+`<div class="ecard gl emp">${ic('book')}<b>Пока нет факультативов</b>${ro?'':`<button class="btn" data-a="eladd">${ic('plus')}Добавить факультатив</button>`}</div>`;
 h+=`<div class="hero gl" style="--c:${best?best.g.color:'var(--ac)'}"><span class="eyebrow">Ближайший факультатив</span><b class="hl">${best?esc(best.g.subject):'—'}</b>${best?`<span>${elWhen(best.n)}${best.n.r.room?' · ауд. '+esc(best.n.r.room):''}</span>${elCount(best.n)?`<span class="cd">${elCount(best.n)}</span>`:''}`:''}</div>`;
 h+=`<div class="wds gl elst"><button class="wd${elDay===null?' on':''}" data-a="eld" data-d="">Все</button>${WD.slice(0,6).map((n,i)=>`<button class="wd${elDay===i?' on':''}" data-a="eld" data-d="${i}">${n}${gs.some(g=>g.rows.some(r=>r.day===i))?'<i class="dtd"></i>':''}</button>`).join('')}</div>`;
 const list=gs.filter(g=>elDay===null||g.rows.some(r=>r.day===elDay));
 return h+(list.length?list.map(g=>elCard(g,false)).join(''):'<div class="note">В этот день факультативов нет</div>');
}
function eleHTML(){
 const gs=elGroups();
 return`<div class="top"><h1>Редактирование факультативов</h1><button class="btn g" data-a="imp" data-g="el">${ic('upload')}Импорт</button></div><p class="n hint">Добавьте кружки и секции: у одного факультатива может быть несколько дней и разное время.</p><button class="addtile" data-a="eladd">${ic('plus')}Добавить факультатив</button>`+gs.map(g=>elCard(g,true)).join('');
}
const sessRow=r=>`<div class="sess"><input type="hidden" name="sid" value="${r.id||''}"><button type="button" class="ib" data-a="elrm" aria-label="Удалить день">${ic('trash')}</button>${fld('День',`<select name="sd">${DAYS.map((n,i)=>`<option value="${i}" ${r.day===i?'selected':''}>${n}</option>`).join('')}</select>`)}<div class="row t2">${fld('Начало',`<input name="sa" type="time" required value="${r.start}">`)}${fld('Конец',`<input name="sb" type="time" required value="${r.end}">`)}</div>${fld('Аудитория',`<input name="sr" maxlength="30" value="${esc(r.room||'')}">`)}${P.elCyc?fld('Неделя',`<select name="sw">${['both','up','down'].map(k=>`<option value="${k}" ${r.week===k?'selected':''}>${WN[k]}</option>`).join('')}</select>`):''}</div>`;
function openElective(g){
 g=g||{subject:'',teacher:'',color:'',notes:'',rows:[]};
 const rows=g.rows.length?g.rows:[{id:'',day:1,start:'16:00',end:'17:30',room:'',week:'both'}];
 dlg(g.subject?'Изменить факультатив':'Новый факультатив',
  fld('Название',`<input name="s" required maxlength="80" value="${esc(g.subject)}">`)+
  fld('Преподаватель',`<input name="t" maxlength="80" value="${esc(g.teacher)}">`)+
  fld('Цвет',`<div class="sw">${PAL.map(c=>`<button type="button" data-a="pc" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div><input name="c" type="color" value="${g.color||PAL[3]}">`)+
  fld('Заметка',`<input name="n" maxlength="200" value="${esc(g.notes||'')}">`)+
  `<h2 class="shd">Когда проходит</h2><div id="sess">${rows.map(sessRow).join('')}</div><button type="button" class="btn g wide" data-a="elsess">${ic('plus')}Добавить день</button>`,
  async v=>{
   const subject=v.get('s').trim(),teacher=v.get('t').trim(),color=v.get('c'),notes=v.get('n').trim();
   const ids=v.getAll('sid'),days=v.getAll('sd'),ss=v.getAll('sa'),es=v.getAll('sb'),rooms=v.getAll('sr'),ws=v.getAll('sw');
   if(!ids.length){toast('Добавьте хотя бы один день');return false}
   for(let i=0;i<ids.length;i++)if(!ss[i]||!es[i]||es[i]<=ss[i]){toast('Конец занятия должен быть позже начала');return false}
   const news=ids.map((id,i)=>({id,day:+days[i],start:ss[i],end:es[i],room:(rooms[i]||'').trim(),week:P.elCyc?(ws[i]||'both'):'both',subject,teacher,color,notes,el:true}));
   const cf=[...new Set(news.flatMap(o=>conflictsFor(o).filter(x=>!ids.includes(x.id)).map(x=>'«'+x.subject+'»')))];
   if(cf.length&&!confirm(T('Пересекается с '+cf.join(', ')+'. Сохранить всё равно?')))return false;
   const keep=new Set(ids.filter(Boolean)),del=g.rows.filter(r=>!keep.has(r.id)).map(r=>r.id);
   if(del.length){const r=await sb.from('lessons').delete().in('id',del);if(r.error){toast('Ошибка: '+r.error.message);return false}L=L.filter(x=>!del.includes(x.id))}
   for(const o of news){
    const r=o.id?await sb.from('lessons').update(toRow(o)).eq('id',o.id).select().single():await sb.from('lessons').insert(toRow(o)).select().single();
    if(r.error){toast('Ошибка: '+r.error.message);return false}
    const n=fromRow(r.data);L=o.id?L.map(x=>x.id===o.id?n:x):[...L,n];
   }
   render();return true;
  });
}
async function delElective(k){
 const g=elGroups().find(x=>x.key===k);if(!g)return;
 if(!confirm(T('Удалить факультатив «'+g.subject+'» со всеми днями?')))return;
 const ids=g.rows.map(r=>r.id),r=await sb.from('lessons').delete().in('id',ids);
 if(r.error)return toast('Ошибка: '+r.error.message);
 L=L.filter(x=>!ids.includes(x.id));render();
}
