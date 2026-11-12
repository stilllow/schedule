/* Заметки: список с поиском и фильтрами, редактор с автосохранением, чек-листы, теги, напоминания */
async function fetchAll(table,order){
 let all=[],from=0;
 for(;;){
  const r=await sb.from(table).select('*').order(order,{ascending:false}).range(from,from+999);
  if(r.error)throw r.error;
  all=all.concat(r.data);
  if(r.data.length<1000)break;
  from+=1000;
 }
 return all;
}
const fmtDate=s=>{const d=new Date(s);return isNaN(d)?'':d.toLocaleDateString(LOC(),{day:'numeric',month:'short'})};
const fmtDT=s=>{const d=new Date(s);return isNaN(d)?'':d.toLocaleString(LOC(),{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})};
const toLocalDT=iso=>{if(!iso)return'';const d=new Date(iso);return isNaN(d)?'':d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())};
const fromLocalDT=v=>{if(!v)return'';const d=new Date(v);return isNaN(d)?'':d.toISOString()};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

let NOTES=[],notesLoaded=false,notesLoading=false,nf={q:'',scope:'all',subj:'',tag:'',sort:'upd'},ne=null,nTimer=null,nSaving=false,nAgain=false,REM=[];
const fromNote=r=>({id:r.id,title:r.title||'',body:r.body||'',subject:r.subject||'',tags:r.tags||[],color:r.color||'',pinned:!!r.pinned,archived:!!r.archived,remind:r.remind_at||'',created:r.created_at||'',updated:r.updated_at||''});
const toNoteRow=n=>({title:n.title,body:n.body,subject:n.subject||null,tags:n.tags,color:n.color||null,pinned:n.pinned,archived:n.archived,remind_at:n.remind||null});
const nTitle=n=>n.title.trim()||'Без названия';
const subjectsAll=()=>[...new Set([...NOTES.map(n=>n.subject),...L.map(l=>l.subject)].filter(Boolean))].sort();
const parseTags=s=>[...new Set(String(s).split(/[,;]+/).map(x=>x.trim().replace(/^#/,'').toLowerCase().slice(0,24)).filter(Boolean))].slice(0,10);

/* мини-разметка: заголовки, списки, чек-листы, цитаты, жирный/курсив/код, ссылки (текст сначала экранируется) */
function mdInline(s){
 return s.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>')
  .replace(/(^|[^*])\*([^*\s][^*]*)\*/g,'$1<i>$2</i>')
  .replace(/https?:\/\/[^\s<]+/g,u=>`<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
}
function mdLite(src,interactive){
 let out='',list='',ti=0;
 const close=()=>{if(list){out+='</'+(list==='ol'?'ol':'ul')+'>';list=''}};
 for(const raw of String(src).split('\n')){
  const l=esc(raw);let m;
  if((m=l.match(/^- \[( |x|X)\] (.*)$/))){
   if(list!=='tl'){close();out+='<ul class="tl">';list='tl'}
   const done=m[1]!==' ';
   out+=`<li class="task${done?' done':''}"><button type="button" class="tk" ${interactive?`data-a="nchk" data-i="${ti}"`:'disabled'} aria-label="Отметить">${done?ic('check'):''}</button><span>${mdInline(m[2])}</span></li>`;ti++;continue;
  }
  if((m=l.match(/^[-*] (.*)$/))){if(list!=='ul'){close();out+='<ul>';list='ul'}out+=`<li>${mdInline(m[1])}</li>`;continue}
  if((m=l.match(/^\d+\. (.*)$/))){if(list!=='ol'){close();out+='<ol>';list='ol'}out+=`<li>${mdInline(m[1])}</li>`;continue}
  close();
  if((m=l.match(/^(#{1,3}) (.*)$/))){const h=m[1].length+1;out+=`<h${h}>${mdInline(m[2])}</h${h}>`;continue}
  if((m=l.match(/^&gt; (.*)$/))){out+=`<blockquote>${mdInline(m[1])}</blockquote>`;continue}
  if(/^---+$/.test(l)){out+='<hr>';continue}
  out+=l.trim()?`<p>${mdInline(l)}</p>`:'<div class="sp"></div>';
 }
 close();return out;
}
const taskStats=b=>{const m=String(b).match(/^- \[( |x|X)\] /gm)||[];return{total:m.length,done:m.filter(x=>x[3]!==' ').length}};
function toggleTask(body,i){let k=-1;return String(body).split('\n').map(l=>{const m=l.match(/^- \[( |x|X)\] (.*)$/);if(!m)return l;k++;return k===i?'- ['+(m[1]===' '?'x':' ')+'] '+m[2]:l}).join('\n')}
const plain=b=>String(b).replace(/^(?:#{1,3}|>|-\s\[[ xX]\]|[-*]|\d+\.)\s+/gm,'').replace(/[*`_]/g,'').replace(/\s+/g,' ').trim();
const counts=b=>{const t=String(b).trim();return(t?t.split(/\s+/).length:0)+' слов · '+String(b).length+' симв.'};

function notesFiltered(){
 const q=nf.q.trim().toLowerCase();
 let a=NOTES.filter(n=>nf.scope==='arch'?n.archived:!n.archived);
 if(nf.scope==='pin')a=a.filter(n=>n.pinned);
 if(nf.subj)a=a.filter(n=>n.subject===nf.subj);
 if(nf.tag)a=a.filter(n=>n.tags.includes(nf.tag));
 if(q)a=a.filter(n=>(n.title+' '+n.body+' '+n.subject+' '+n.tags.join(' ')).toLowerCase().includes(q));
 const by={upd:(x,y)=>y.updated.localeCompare(x.updated),new:(x,y)=>y.created.localeCompare(x.created),title:(x,y)=>nTitle(x).localeCompare(nTitle(y))}[nf.sort]||(()=>0);
 return a.sort((x,y)=>(y.pinned-x.pinned)||by(x,y));
}
async function loadNotes(){
 if(notesLoading)return;notesLoading=true;
 try{NOTES=(await fetchAll('notes','updated_at')).map(fromNote)}
 catch(e){toast('Ошибка: '+((e&&e.message)||e)+'. Выполнен ли migration_v6.sql?')}
 notesLoaded=true;notesLoading=false;
 if(view==='notes')render();
}
function noteCard(n){
 const ts=taskStats(n.body),ex=plain(n.body).slice(0,140);
 return`<article class="ncard gl" style="--c:${n.color||'var(--ac)'}" data-a="nopen" data-id="${n.id}"><div class="nh"><b>${esc(nTitle(n))}</b><button class="ib" data-a="npin" data-id="${n.id}" aria-label="${n.pinned?'Открепить':'Закрепить'}">${ic(n.pinned?'pinon':'pin')}</button></div>${ex?`<p>${esc(ex)}</p>`:''}<div class="chips">${n.subject?`<span class="chip">${esc(n.subject)}</span>`:''}${n.tags.slice(0,3).map(t=>`<span class="chip">#${esc(t)}</span>`).join('')}${ts.total?`<span class="chip">${ic('check')}${ts.done}/${ts.total}</span>`:''}${n.remind?`<span class="chip">${ic('bell')}${fmtDT(n.remind)}</span>`:''}</div><small>${fmtDate(n.updated)}</small></article>`;
}
function notesListHTML(){
 const a=notesFiltered();
 if(!a.length)return`<div class="note">${ic('note')}${NOTES.length?'Ничего не найдено':'Заметок пока нет'}</div>`;
 return'<div class="ngrid">'+a.map(noteCard).join('')+'</div>';
}
function notesHTML(){
 if(!notesLoaded){loadNotes();return'<div class="empty">Загрузка…</div>'}
 const subs=subjectsAll(),tags=[...new Set(NOTES.flatMap(n=>n.tags))].sort();
 return`<div class="top"><h1>Заметки</h1><button class="btn" data-a="nnew">${ic('plus')}Заметка</button></div>
 <input id="nq" placeholder="Поиск по заметкам" value="${esc(nf.q)}">
 <div class="chips fl">${[['all','Все'],['pin','Закреплённые'],['arch','Архив']].map(([k,n])=>`<button class="chip btnchip${nf.scope===k?' on':''}" data-a="nscope" data-v="${k}">${n}</button>`).join('')}</div>
 <div class="row" style="margin-top:12px">${fld('Предмет',`<select data-s="nsubj"><option value="">Все предметы</option>${subs.map(s=>`<option value="${esc(s)}" ${nf.subj===s?'selected':''}>${esc(s)}</option>`).join('')}</select>`)}${fld('Сортировка',`<select data-s="nsort">${[['upd','По изменению'],['new','По созданию'],['title','По названию']].map(([k,n])=>`<option value="${k}" ${nf.sort===k?'selected':''}>${n}</option>`).join('')}</select>`)}</div>
 ${tags.length?`<div class="chips fl" style="margin:0 0 12px">${tags.map(t=>`<button class="chip btnchip${nf.tag===t?' on':''}" data-a="ntag" data-v="${esc(t)}">#${esc(t)}</button>`).join('')}</div>`:''}
 <div id="nl">${notesListHTML()}</div>`;
}

/* редактор */
const newNote=()=>({id:'',title:'',body:'',subject:'',tags:[],color:'',pinned:false,archived:false,remind:'',created:'',updated:'',preview:false,dirty:false,st:''});
function openNote(id){const n=id?NOTES.find(x=>x.id===id):null;ne=n?{...n,tags:[...n.tags],preview:false,dirty:false,st:''}:newNote();view='note';render()}
function noteEditHTML(){
 if(!ne)return'<div class="empty">—</div>';
 const subs=subjectsAll(),tool=[['h','H'],['b','B'],['i','I'],['ul','Список'],['chk','Чек-лист'],['q','Цитата'],['d','Дата']];
 return`<div class="top"><button class="btn g" data-a="nback">${ic('left')}Назад</button><span class="n" id="nst">${esc(ne.st)}</span><button class="btn g" data-a="nprev">${ic(ne.preview?'edit':'eye')}${ne.preview?'Править':'Просмотр'}</button></div>
 <input id="nt" class="ntitle" maxlength="200" placeholder="Заголовок" value="${esc(ne.title)}">
 <div class="row">${fld('Предмет',`<input id="ns" list="nsl" maxlength="80" value="${esc(ne.subject)}"><datalist id="nsl">${subs.map(s=>`<option value="${esc(s)}">`).join('')}</datalist>`)}${fld('Теги (через запятую)',`<input id="ng" maxlength="120" value="${esc(ne.tags.join(', '))}">`)}</div>
 <div class="row">${fld('Напомнить',`<input id="nr" type="datetime-local" value="${esc(toLocalDT(ne.remind))}">`)}<div><label>Цвет</label><div class="sw">${PAL.map(c=>`<button type="button" data-a="ncol" data-c="${c}" class="${ne.color===c?'on':''}" style="background:${c}" aria-label="${c}"></button>`).join('')}<button type="button" class="ib" data-a="ncol" data-c="" aria-label="Без цвета">${ic('x')}</button></div></div></div>
 ${ne.preview?`<div class="md card gl">${mdLite(ne.body,true)||'<p class="n">Пусто</p>'}</div>`:`<div class="ntool">${tool.map(([k,n])=>`<button type="button" class="chip btnchip" data-a="nfmt" data-k="${k}">${n}</button>`).join('')}</div><textarea id="nb" class="nbody" rows="14" maxlength="50000" placeholder="Пишите здесь. # заголовок, - список, - [ ] задача">${esc(ne.body)}</textarea>`}
 <p class="n" id="ncnt">${counts(ne.body)}</p>
 <div class="chips nact"><button class="btn g" data-a="npinned">${ic('pin')}${ne.pinned?'Открепить':'Закрепить'}</button><button class="btn g" data-a="ndup">${ic('copy')}Дублировать</button><button class="btn g" data-a="narch">${ne.archived?'Из архива':'В архив'}</button><button class="btn g" data-a="nexp">${ic('download')}Экспорт</button><button class="btn g" data-a="ncopy">Копировать</button><button class="btn d" data-a="ndel">${ic('trash')}Удалить</button></div>`;
}
function noteSync(){
 if(!ne)return;
 const g=id=>{const e=$('#'+id);return e&&typeof e.value==='string'?e.value:null};
 let v;
 if((v=g('nt'))!==null)ne.title=v;
 if((v=g('ns'))!==null)ne.subject=v.trim();
 if((v=g('ng'))!==null)ne.tags=parseTags(v);
 if((v=g('nr'))!==null)ne.remind=fromLocalDT(v);
 if((v=g('nb'))!==null)ne.body=v;
}
const stTxt=()=>{const e=$('#nst');if(e)e.textContent=ne?ne.st:''};
async function saveNote(){
 if(!ne||!ne.dirty)return;
 if(!ne.id&&!ne.title.trim()&&!ne.body.trim())return;
 if(nSaving){nAgain=true;return}
 nSaving=true;clearTimeout(nTimer);noteSync();
 const row=toNoteRow(ne),snap=JSON.stringify(row);
 ne.st='Сохраняю…';stTxt();
 try{
  const r=ne.id?await sb.from('notes').update(row).eq('id',ne.id).select().single():await sb.from('notes').insert(row).select().single();
  if(!ne)return;
  if(r.error){ne.st='Не сохранено';stTxt();toast('Ошибка: '+r.error.message);return}
  const n=fromNote(r.data);ne.id=n.id;ne.created=n.created;ne.updated=n.updated;
  if(JSON.stringify(toNoteRow(ne))===snap){ne.dirty=false;ne.st='Сохранено'}else ne.st='';
  const i=NOTES.findIndex(x=>x.id===n.id);if(i>=0)NOTES[i]=n;else NOTES.unshift(n);
  REM=REM.filter(x=>x.id!==n.id);if(n.remind&&!n.archived)REM.push({id:n.id,title:n.title,remind_at:n.remind});
  stTxt();
 }catch(e){if(ne){ne.st='Не сохранено';stTxt()}}
 finally{nSaving=false;if(nAgain){nAgain=false;saveNote()}}
}
document.addEventListener('input',e=>{
 if(e.target.id==='nq'){nf.q=e.target.value;const l=$('#nl');if(l)l.innerHTML=notesListHTML();return}
 if(!ne||view!=='note'||!['nt','ns','ng','nr','nb'].includes(e.target.id))return;
 noteSync();ne.dirty=true;ne.st='';stTxt();clearTimeout(nTimer);nTimer=setTimeout(saveNote,900);
 if(e.target.id==='nb'){const c=$('#ncnt');if(c)c.textContent=counts(ne.body)}
});
document.addEventListener('change',e=>{
 const s=e.target.dataset&&e.target.dataset.s;
 if(s==='nsubj'){nf.subj=e.target.value;render()}else if(s==='nsort'){nf.sort=e.target.value;render()}
 else if(ne&&view==='note'&&e.target.id==='nr'){noteSync();ne.dirty=true;saveNote()}
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveNote()});

ACTIONS.nnew=()=>openNote('');
ACTIONS.nopen=t=>openNote(t.dataset.id);
ACTIONS.nback=async()=>{await saveNote();ne=null;view='notes';render()};
ACTIONS.nprev=()=>{noteSync();ne.preview=!ne.preview;render()};
ACTIONS.npin=async t=>{const n=NOTES.find(x=>x.id===t.dataset.id);if(!n)return;const r=await sb.from('notes').update({pinned:!n.pinned}).eq('id',n.id);if(r.error)return toast('Ошибка: '+r.error.message);n.pinned=!n.pinned;render()};
ACTIONS.npinned=()=>{noteSync();ne.pinned=!ne.pinned;ne.dirty=true;saveNote();render()};
ACTIONS.ncol=t=>{noteSync();ne.color=t.dataset.c;ne.dirty=true;saveNote();render()};
ACTIONS.nfmt=t=>{
 const ta=$('#nb');if(!ta)return;
 const k=t.dataset.k,v=ta.value,s=ta.selectionStart,e=ta.selectionEnd,sel=v.slice(s,e);
 const wrap=(a,b)=>{ta.setRangeText(a+sel+b,s,e,'end');if(!sel){ta.selectionStart=ta.selectionEnd=s+a.length}};
 const pre=p=>{const ls=v.lastIndexOf('\n',s-1)+1;let le=v.indexOf('\n',e);if(le<0)le=v.length;ta.setRangeText(v.slice(ls,le).split('\n').map(l=>p+l).join('\n'),ls,le,'end')};
 if(k==='b')wrap('**','**');else if(k==='i')wrap('*','*');
 else if(k==='h')pre('# ');else if(k==='ul')pre('- ');else if(k==='chk')pre('- [ ] ');else if(k==='q')pre('> ');
 else if(k==='d')ta.setRangeText(ymd(new Date()),s,e,'end');
 ta.focus();ta.dispatchEvent(new Event('input',{bubbles:true}));
};
ACTIONS.nchk=t=>{noteSync();ne.body=toggleTask(ne.body,+t.dataset.i);ne.dirty=true;saveNote();render()};
ACTIONS.ndup=async()=>{await saveNote();ne={...ne,id:'',title:(ne.title||'')+' (копия)',dirty:true,preview:false,st:''};await saveNote();render()};
ACTIONS.narch=async()=>{noteSync();ne.archived=!ne.archived;ne.dirty=true;await saveNote();ne=null;view='notes';render()};
ACTIONS.ndel=async()=>{
 if(!confirm(T('Удалить заметку?')))return;
 if(ne.id){const r=await sb.from('notes').delete().eq('id',ne.id);if(r.error)return toast('Ошибка: '+r.error.message);NOTES=NOTES.filter(x=>x.id!==ne.id);REM=REM.filter(x=>x.id!==ne.id)}
 ne=null;view='notes';render();
};
ACTIONS.nexp=()=>{
 noteSync();
 const txt=(ne.title?'# '+ne.title+'\n\n':'')+ne.body,b=new Blob([txt],{type:'text/markdown;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');
 a.href=u;a.download=(nTitle(ne).slice(0,40).replace(/[^\wА-Яа-яЁё\- ]+/g,'')||'note')+'.md';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);
};
ACTIONS.ncopy=async()=>{noteSync();try{await navigator.clipboard.writeText((ne.title?ne.title+'\n\n':'')+ne.body);toast('Заметка скопирована')}catch(e){toast('Ошибка: '+((e&&e.message)||e))}};
ACTIONS.nscope=t=>{nf.scope=t.dataset.v;render()};
ACTIONS.ntag=t=>{nf.tag=nf.tag===t.dataset.v?'':t.dataset.v;render()};
EXTRA_VIEWS.notes=notesHTML;EXTRA_VIEWS.note=noteEditHTML;

/* напоминания из заметок */
async function loadReminders(){try{const r=await sb.from('notes').select('id,title,remind_at').not('remind_at','is',null).eq('archived',false);if(!r.error)REM=r.data||[]}catch(e){}}
function noteRemind(n){
 if(!REM.length)return;
 let done=[];try{done=JSON.parse(localStorage.getItem('nrf')||'[]')}catch(e){}
 const now=n.getTime();let ch=false;
 REM.forEach(r=>{const t=new Date(r.remind_at).getTime(),k=r.id+'|'+r.remind_at;if(t<=now&&now-t<36e5&&!done.includes(k)){done.push(k);ch=true;notify('Заметка',r.title||'Без названия')}});
 if(ch)try{localStorage.setItem('nrf',JSON.stringify(done.slice(-200)))}catch(e){}
}
