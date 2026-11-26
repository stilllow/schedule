/* Быстрый поиск и команды: Ctrl+K (или / вне поля ввода) */
let SR={items:[],sel:0};
function srBox(){
 let e=$('#srch');if(e)return e;
 e=document.createElement('div');e.id='srch';e.hidden=true;
 e.innerHTML=`<div class="srbox gl" role="dialog" aria-modal="true" aria-label="Поиск"><div class="srin">${ic('search')}<input id="srq" autocomplete="off" spellcheck="false" placeholder="Поиск по занятиям, заданиям, заметкам, карточкам" aria-label="Поиск"><kbd>Esc</kbd></div><div id="srl" role="listbox"></div><p class="n srh">Стрелки: выбрать · Enter: открыть · Esc: закрыть</p></div>`;
 document.body.appendChild(e);
 e.addEventListener('mousedown',ev=>{if(ev.target===e)srClose()});
 $('#srq').addEventListener('input',()=>srRun());
 $('#srq').addEventListener('keydown',ev=>{
  if(ev.key==='ArrowDown'){ev.preventDefault();srMove(1)}
  else if(ev.key==='ArrowUp'){ev.preventDefault();srMove(-1)}
  else if(ev.key==='Enter'){ev.preventDefault();srPick(SR.sel)}
  else if(ev.key==='Escape'){ev.preventDefault();srClose()}
 });
 $('#srl').addEventListener('click',ev=>{const b=ev.target.closest('[data-sr]');if(b)srPick(+b.dataset.sr)});
 $('#srl').addEventListener('mousemove',ev=>{const b=ev.target.closest('[data-sr]');if(b&&+b.dataset.sr!==SR.sel){SR.sel=+b.dataset.sr;srPaint()}});
 return e;
}
function srOpen(){
 if(!me||!sb)return;
 const e=srBox();e.hidden=false;document.body.classList.add('sropen');
 if(!notesLoaded&&typeof loadNotes==='function')try{loadNotes()}catch(x){}
 if(!cardsLoaded&&typeof loadCards==='function')try{loadCards()}catch(x){}
 const i=$('#srq');i.value='';srRun();setTimeout(()=>i.focus(),20);
}
function srClose(){const e=$('#srch');if(e)e.hidden=true;document.body.classList.remove('sropen')}
const setWeekQ=s=>{q=s};
const srGo=(v,fn)=>()=>{srClose();view=v;if(fn)fn();render();window.scrollTo(0,0)};
function srFind(raw){
 const q=raw.trim().toLowerCase(),out=[],has=s=>String(s||'').toLowerCase().includes(q);
 const add=(g,title,sub,fn,color)=>out.push({g,title,sub,fn,color});
 const cmds=[
  ['Добавить занятие','Открыть форму нового занятия',()=>{srClose();openLesson()}],
  ['Добавить задание','Открыть форму нового задания',()=>{srClose();openHW()}],
  ['Сегодня','Расписание на сегодня',srGo('today',()=>{cur=new Date()})],
  ['Расписание','Вся неделя',srGo('week')],
  ['Задания','Список заданий',srGo('hw')],
  ['Посещаемость','Отметки и пропуски',srGo('att')],
  ['Заметки','Ваши заметки',srGo('notes')],
  ['Карточки','Колоды и повторение',srGo('cards')],
  ['Друзья','Друзья и запросы',srGo('friends')],
  ['Аккаунт','Профиль и карточка',srGo('acc')],
  ['Настройки','Тема, часы, копия данных',srGo('set')]
 ];
 if(!q){cmds.forEach(c=>add('Команды',c[0],c[1],c[2]));return out}
 L.filter(l=>[l.subject,l.teacher,l.room,l.kind,l.notes].some(has)).slice(0,6).forEach(l=>add('Занятия',l.subject,`${T(DAYS[l.day])} ${l.start}–${l.end}${l.room?' · ауд. '+l.room:''}${l.teacher?' · '+l.teacher:''}`,srGo('week',()=>setWeekQ(l.subject.toLowerCase())),col(l)));
 HW.filter(h=>has(h.title)||has((L.find(l=>l.id===h.lesson_id)||{}).subject)).slice(0,6).forEach(h=>add('Задания',h.title,(h.done?'выполнено · ':'')+'до '+fmt(h.due_date),srGo('hw')));
 if(notesLoaded)NOTES.filter(n=>[n.title,n.body,n.subject,(n.tags||[]).join(' ')].some(has)).slice(0,6).forEach(n=>add('Заметки',nTitle(n),(n.subject?n.subject+' · ':'')+String(n.body||'').replace(/\s+/g,' ').slice(0,70),srGo('notes',()=>{nf.q=raw.trim()})));
 if(cardsLoaded){
  DECKS.filter(d=>has(d.title)||has(d.desc)).slice(0,4).forEach(d=>add('Карточки',d.title,'колода',srGo('cards')));
  CARDS.filter(c=>has(c.front)||has(c.back)).slice(0,5).forEach(c=>add('Карточки',String(c.front).slice(0,70),String(c.back).slice(0,70),srGo('cards')));
 }
 cmds.filter(c=>has(c[0])).forEach(c=>add('Команды',c[0],c[1],c[2]));
 return out;
}
function srRun(){
 const e=$('#srq');SR.items=srFind(e?e.value:'');SR.sel=0;srPaint();
}
function srPaint(){
 const l=$('#srl');if(!l)return;
 if(!SR.items.length){l.innerHTML='<p class="n srnone">Ничего не найдено</p>';return}
 let g='';
 l.innerHTML=SR.items.map((it,i)=>{
  const h=it.g!==g?`<div class="srg">${it.g}</div>`:'';g=it.g;
  return h+`<button type="button" class="sri${i===SR.sel?' on':''}" role="option" aria-selected="${i===SR.sel}" data-sr="${i}"${it.color?` style="--c:${it.color}"`:''}><b>${esc(it.title)}</b><span>${esc(it.sub||'')}</span></button>`;
 }).join('');
 const on=l.querySelector('.sri.on');if(on&&on.scrollIntoView)on.scrollIntoView({block:'nearest'});
}
function srMove(d){if(!SR.items.length)return;SR.sel=(SR.sel+d+SR.items.length)%SR.items.length;srPaint()}
function srPick(i){const it=SR.items[i];if(it)it.fn()}
ACTIONS.srch=()=>{$('#nav').classList.remove('open');srOpen()};
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&!e.altKey&&e.key.toLowerCase()==='k'){e.preventDefault();$('#srch')&&!$('#srch').hidden?srClose():srOpen();return}
 if(e.key==='/'&&!e.ctrlKey&&!e.metaKey){
  const a=document.activeElement,t=a&&a.tagName;
  if(t==='INPUT'||t==='TEXTAREA'||t==='SELECT'||(a&&a.isContentEditable)||($('#dlg')&&$('#dlg').open))return;
  e.preventDefault();srOpen();
 }
 if(e.key==='Escape'&&$('#srch')&&!$('#srch').hidden)srClose();
});
