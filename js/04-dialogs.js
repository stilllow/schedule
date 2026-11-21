/* Окна: занятие, отмена/замена на дату, задание */
function openLesson(l){
 l=l||{};const subs=[...new Set(L.map(x=>x.subject))];
 dlg(l.id?'Изменить занятие':'Новое занятие',
  fld('Предмет',`<input name="s" required maxlength="80" list="sl" value="${esc(l.subject||'')}"><datalist id="sl">${subs.map(s=>`<option value="${esc(s)}">`).join('')}</datalist>`)+
  `<div class="row">`+fld('День',`<select name="d">${DAYS.map((n,i)=>`<option value="${i}" ${(l.day??0)===i?'selected':''} ${i===5&&P.satOff?'disabled':''}>${n}</option>`).join('')}</select>`)+(P.cyc?fld('Неделя',`<select name="w">${['both','up','down'].map(k=>`<option value="${k}" ${(l.week||wsel)===k?'selected':''}>${WN[k]}</option>`).join('')}</select>`):'')+`</div>`+
  fld('Пара из сетки',`<select name="pair"><option value="">— вручную —</option>${P.bells.map((b,i)=>`<option value="${i}">${i+1} пара · ${b[0]}–${b[1]}</option>`).join('')}</select>`)+
  `<div class="row t2">`+fld('Начало',`<input name="a" type="time" required value="${l.start||P.bells[0][0]}">`)+fld('Конец',`<input name="b" type="time" required value="${l.end||P.bells[0][1]}">`)+`</div>`+
  `<div class="row">`+fld('Аудитория',`<input name="r" maxlength="30" value="${esc(l.room||'')}">`)+fld('Тип',`<select name="k"><option value="">—</option>${KINDS.map(k=>`<option value="${k}" ${l.kind===k?'selected':''}>${k}</option>`).join('')}</select>`)+`</div>`+
  fld('Преподаватель',`<input name="t" maxlength="80" value="${esc(l.teacher||'')}">`)+fld('Цвет предмета',`<div class="sw">${PAL.map(c=>`<button type="button" data-a="pc" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}<input name="c" type="color" value="${l.id||l.subject?col(l):PAL[5]}"></div>`)+fld('Заметка',`<textarea name="n" rows="2" maxlength="200">${esc(l.notes||'')}</textarea>`),
  async v=>{
   const o={subject:v.get('s').trim(),day:+v.get('d'),week:v.get('w')||'both',el:!!l.el,start:v.get('a'),end:v.get('b'),room:v.get('r').trim(),kind:v.get('k'),teacher:v.get('t').trim(),color:v.get('c'),notes:v.get('n').trim()};
   if(o.end<=o.start){toast('Конец занятия должен быть позже начала');return false}
   {const cf=conflictsFor({...o,id:l.id||''});if(cf.length&&!confirm(T('Пересекается с '+cf.map(x=>'«'+x.subject+'»').join(', ')+'. Сохранить всё равно?')))return false}
   const r=l.id?await sb.from('lessons').update(toRow(o)).eq('id',l.id).select().single():await sb.from('lessons').insert(toRow(o)).select().single();
   if(r.error){toast('Ошибка: '+r.error.message);return false}
   const n=fromRow(r.data);L=l.id?L.map(x=>x.id===l.id?n:x):[...L,n];
   if(L.some(x=>x.subject===o.subject&&x.color!==o.color)){const u=await sb.from('lessons').update({color:o.color}).eq('subject',o.subject);if(!u.error)L=L.map(x=>x.subject===o.subject?{...x,color:o.color}:x)}
   render();return true});
}
function openOv(l){
 const s=ymd(cur),b=L.find(x=>x.id===l.id),o=OV[b.id+s]||{};
 dlg(fmt(s)+': '+b.subject,
  fld('Что сделать',`<select name="k"><option value="cancel" ${o.kind==='cancel'?'selected':''}>Отменить занятие</option><option value="replace" ${o.kind==='replace'?'selected':''}>Заменить время или аудиторию</option></select>`)+
  `<div class="row t2">`+fld('Начало',`<input name="a" type="time" value="${(o.start_time||b.start).slice(0,5)}">`)+fld('Конец',`<input name="b" type="time" value="${(o.end_time||b.end).slice(0,5)}">`)+`</div>`+
  fld('Аудитория',`<input name="r" maxlength="30" value="${esc(o.room??b.room)}">`)+fld('Заметка',`<input name="n" maxlength="100" value="${esc(o.note||'')}">`)+(o.id?'<button type="button" class="btn d" id="rm">Вернуть как было</button>':''),
  async v=>{
   if(v.get('k')==='replace'&&v.get('b')<=v.get('a')){toast('Конец занятия должен быть позже начала');return false}
   const r=await sb.from('overrides').upsert({lesson_id:b.id,on_date:s,kind:v.get('k'),start_time:v.get('a')||null,end_time:v.get('b')||null,room:v.get('r')||null,note:v.get('n')||null},{onConflict:'lesson_id,on_date'}).select().single();
   if(r.error){toast('Ошибка: '+r.error.message);return false}OV[b.id+s]=r.data;render();return true});
 if(o.id)$('#rm').onclick=async()=>{await sb.from('overrides').delete().eq('id',o.id);delete OV[b.id+s];$('#dlg').close();render()};
}
function openHW(h){
 h=h||{};
 dlg(h.id?'Изменить задание':'Новое задание',
  fld('Что сделать',`<input name="t" required maxlength="120" value="${esc(h.title||'')}">`)+
  fld('Занятие',`<select name="l"><option value="">— не привязано —</option>${L.map(l=>`<option value="${l.id}" ${h.lesson_id===l.id?'selected':''}>${esc(l.subject)} (${DAYS[l.day].slice(0,2)}, ${l.start})</option>`).join('')}</select>`)+
  fld('Срок',`<input name="d" type="date" required value="${h.due_date||ymd(new Date())}">`),
  async v=>{
   const o={title:v.get('t').trim(),lesson_id:v.get('l')||null,due_date:v.get('d')};
   const r=h.id?await sb.from('homework').update(o).eq('id',h.id).select().single():await sb.from('homework').insert(o).select().single();
   if(r.error){toast('Ошибка: '+r.error.message);return false}HW=h.id?HW.map(x=>x.id===h.id?r.data:x):[...HW,r.data];render();return true});
}
