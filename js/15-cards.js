/* Карточки: колоды, редактор карточек, обучение с интервальным повторением */
let DECKS=[],CARDS=[],cardsLoaded=false,cardsLoading=false,deckId=null,STUDY=null,revMode=false,cq='';
const fromDeck=r=>({id:r.id,title:r.title,desc:r.description||'',color:r.color||''});
const fromCard=r=>({id:r.id,deck:r.deck_id,front:r.front,back:r.back,due:r.due_at,interval:r.interval_days||0,ease:r.ease||2.5,reps:r.reps||0,lapses:r.lapses||0,last:r.last_reviewed||''});
const escNl=s=>esc(s).replace(/\n/g,'<br>');
const cardState=c=>c.reps===0&&!c.last?'new':new Date(c.due)<=new Date()?'due':'later';
const daysTo=iso=>Math.max(1,Math.ceil((new Date(iso)-new Date())/864e5));
function deckStats(d){
 let total=0,nw=0,due=0,learned=0;
 CARDS.forEach(c=>{if(c.deck!==d.id)return;total++;const s=cardState(c);if(s==='new')nw++;else if(s==='due')due++;if(c.reps>=3)learned++});
 return{total,new:nw,due,learned};
}
/* q: 0 снова, 1 трудно, 2 хорошо, 3 легко */
function nextSchedule(c,q,now){
 now=now||new Date();
 let{reps,interval,ease,lapses}=c;
 if(q===0){return{reps:0,interval:0,ease:Math.max(1.3,ease-.2),lapses:lapses+1,due:new Date(now.getTime()+10*60000).toISOString()}}
 if(reps===0)interval=[0,1,2,4][q];else if(reps===1)interval=[0,2,4,7][q];else interval=Math.max(1,Math.round(interval*ease*[0,.8,1,1.3][q]));
 ease=Math.min(3,Math.max(1.3,ease+[0,-.15,0,.15][q]));
 return{reps:reps+1,interval,ease,lapses,due:new Date(now.getTime()+interval*864e5).toISOString()};
}
const ivTxt=n=>n.interval===0?'10 мин':n.interval+' д';
function parseCards(text){
 const out=[];
 String(text).split('\n').forEach(line=>{
  line=line.trim();if(!line)return;
  const m=line.match(/^(.+?)(?:\t| :: | — | – | - |;| = )(.+)$/);
  if(m&&m[1].trim()&&m[2].trim())out.push({front:m[1].trim(),back:m[2].trim()});
 });
 return out;
}
async function loadCards(){
 if(cardsLoading)return;cardsLoading=true;
 try{DECKS=(await fetchAll('decks','created_at')).map(fromDeck).reverse();CARDS=(await fetchAll('cards','created_at')).map(fromCard).reverse()}
 catch(e){toast('Ошибка: '+((e&&e.message)||e)+'. Выполнен ли migration_v6.sql?')}
 cardsLoaded=true;cardsLoading=false;
 if(['cards','deck','study','today'].includes(view))render();
}
function buildQueue(ids,mode){
 const a=CARDS.filter(c=>ids.includes(c.deck));
 if(mode==='all')return shuffle(a).map(c=>c.id);
 if(mode==='new')return shuffle(a.filter(c=>cardState(c)==='new')).map(c=>c.id);
 return shuffle(a.filter(c=>cardState(c)==='due')).concat(shuffle(a.filter(c=>cardState(c)==='new')).slice(0,20)).map(c=>c.id);
}
function startStudy(ids,mode){
 const q=buildQueue(ids,mode);
 if(!q.length)return toast('Нет карточек для повторения');
 STUDY={queue:q,i:0,show:false,rev:revMode,ids,mode,stat:[0,0,0,0]};view='study';render();
}
function deckTile(d){
 const s=deckStats(d),pct=s.total?Math.round(s.learned/s.total*100):0;
 return`<article class="dtile gl" style="--c:${d.color||'var(--ac)'}" data-a="dopen" data-id="${d.id}"><b>${esc(d.title)}</b>${d.desc?`<p>${esc(d.desc)}</p>`:''}<div class="chips"><span class="chip"><b>${s.total}</b> всего</span>${s.due?`<span class="chip on"><b>${s.due}</b> пора</span>`:''}${s.new?`<span class="chip"><b>${s.new}</b> новых</span>`:''}</div><div class="progress"><i style="width:${pct}%"></i></div>${s.due+s.new?`<button class="btn" data-a="dstudy" data-id="${d.id}">${ic('right')}Учить</button>`:''}</article>`;
}
function cardsHTML(){
 if(!cardsLoaded){loadCards();return'<div class="empty">Загрузка…</div>'}
 const due=CARDS.filter(c=>cardState(c)!=='later').length;
 return`<div class="top"><h1>Карточки</h1><button class="btn" data-a="dnew">${ic('plus')}Колода</button></div>`+
 (DECKS.length?`<div class="card gl sum"><div class="dh"><div><b class="wbig">${due}</b> <span>к повторению сегодня</span></div>${due?`<button class="btn" data-a="stall">${ic('right')}Учить</button>`:''}</div></div><div class="dgrid">${DECKS.map(deckTile).join('')}</div>`:
 `<div class="ecard gl emp">${ic('cards')}<b>Колод пока нет. Создайте первую — например, по предмету.</b><button class="btn" data-a="dnew">${ic('plus')}Колода</button></div>`);
}
const cardRow=c=>{const s=cardState(c);return`<div class="card gl l crow" style="--c:var(--ac)"><div class="m"><b>${escNl(c.front)}</b><span>${escNl(c.back)}</span></div><span class="chip${s==='due'?' w':''}">${s==='new'?'новая':s==='due'?'пора':'через '+daysTo(c.due)+' д'}</span><button class="ib" data-a="cedit" data-id="${c.id}" aria-label="Изменить">${ic('edit')}</button><button class="ib" data-a="cdel" data-id="${c.id}" aria-label="Удалить">${ic('trash')}</button></div>`};
function cardsListHTML(){
 const d=DECKS.find(x=>x.id===deckId),qq=cq.trim().toLowerCase();
 const cs=CARDS.filter(c=>c.deck===deckId&&(!qq||(c.front+' '+c.back).toLowerCase().includes(qq)));
 return cs.length?cs.map(cardRow).join(''):`<div class="note">${ic('cards')}Пока нет карточек</div>`;
}
function deckHTML(){
 const d=DECKS.find(x=>x.id===deckId);
 if(!d){view='cards';return cardsHTML()}
 const s=deckStats(d);
 return`<div class="top"><button class="btn g" data-a="dback">${ic('left')}Назад</button><div class="chips" style="margin:0"><button class="ib" data-a="dedit" aria-label="Изменить колоду">${ic('edit')}</button><button class="ib" data-a="ddel" aria-label="Удалить колоду">${ic('trash')}</button></div></div>
 <div class="hero gl" style="--c:${d.color||'var(--ac)'}"><b class="hl">${esc(d.title)}</b>${d.desc?`<span>${esc(d.desc)}</span>`:''}<div class="chips"><span class="chip"><b>${s.total}</b> всего</span><span class="chip"><b>${s.due}</b> пора</span><span class="chip"><b>${s.new}</b> новых</span><span class="chip"><b>${s.learned}</b> выучено</span></div></div>
 <div class="chips" style="margin:0 0 12px"><button class="btn" data-a="dstudy" data-id="${d.id}">${ic('right')}Учить</button><button class="btn g" data-a="dall" data-id="${d.id}">Все по кругу</button><button class="btn g" data-a="dnewonly" data-id="${d.id}">Только новые</button><button class="chip btnchip${revMode?' on':''}" data-a="drev">Наоборот</button></div>
 <div class="card gl"><h2 style="margin-top:0">Добавить карточку</h2>${fld('Вопрос','<textarea id="cf" rows="2" maxlength="2000"></textarea>')}${fld('Ответ','<textarea id="cb" rows="2" maxlength="2000"></textarea>')}<div class="row"><button class="btn wide" data-a="cadd">${ic('plus')}Добавить карточку</button><button class="btn g wide" data-a="cbulk">Добавить списком</button></div></div>
 <input id="cqs" placeholder="Поиск" value="${esc(cq)}" style="margin-top:12px"><div id="cl">${cardsListHTML()}</div>`;
}
function studyHTML(){
 const s=STUDY;if(!s)return'<div class="empty">—</div>';
 if(s.i>=s.queue.length){
  const n=s.stat.reduce((a,b)=>a+b,0);
  return`<div class="top"><button class="btn g" data-a="sback">${ic('left')}Назад</button></div><div class="ecard gl emp">${ic('check')}<b>Сессия завершена</b><span>Повторено карточек: ${n}</span><div class="chips">${['Снова','Трудно','Хорошо','Легко'].map((t,k)=>`<span class="chip"><b>${s.stat[k]}</b> ${t}</span>`).join('')}</div><button class="btn" data-a="sagain">Ещё раз</button></div>`;
 }
 const c=CARDS.find(x=>x.id===s.queue[s.i]);
 if(!c){s.i++;return studyHTML()}
 const face=s.rev?c.back:c.front,ans=s.rev?c.front:c.back,pct=Math.round(s.i/s.queue.length*100);
 return`<div class="top"><button class="btn g" data-a="sback">${ic('left')}Назад</button><span class="n">${s.i+1} / ${s.queue.length}</span></div><div class="progress"><i style="width:${pct}%"></i></div>
 <div class="flash gl" data-a="sflip"><div class="fq">${escNl(face)}</div>${s.show?`<hr><div class="fa">${escNl(ans)}</div>`:'<p class="n">Нажмите, чтобы показать ответ</p>'}</div>
 ${s.show?`<div class="rates">${[0,1,2,3].map(q=>`<button class="btn ${q===0?'d':q===3?'':'g'} rate" data-a="srate" data-q="${q}"><b>${['Снова','Трудно','Хорошо','Легко'][q]}</b><small>${ivTxt(nextSchedule(c,q))}</small></button>`).join('')}</div>`:'<button class="btn wide" data-a="sflip">Показать ответ</button>'}`;
}
EXTRA_VIEWS.cards=cardsHTML;EXTRA_VIEWS.deck=deckHTML;EXTRA_VIEWS.study=studyHTML;

function openDeck(d){
 d=d||{id:'',title:'',desc:'',color:''};
 dlg(d.id?'Изменить колоду':'Новая колода',
  fld('Название',`<input name="t" required maxlength="80" value="${esc(d.title)}">`)+fld('Описание',`<input name="d" maxlength="300" value="${esc(d.desc)}">`)+
  fld('Цвет',`<div class="sw">${PAL.map(c=>`<button type="button" data-a="pc" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}<input name="c" type="color" value="${d.color||PAL[5]}"></div>`),
  async v=>{
   const row={title:v.get('t').trim(),description:v.get('d').trim()||null,color:v.get('c')};
   const r=d.id?await sb.from('decks').update(row).eq('id',d.id).select().single():await sb.from('decks').insert(row).select().single();
   if(r.error){toast('Ошибка: '+r.error.message);return false}
   const n=fromDeck(r.data);DECKS=d.id?DECKS.map(x=>x.id===n.id?n:x):[...DECKS,n];render();return true;
  });
}
function openCard(c){
 dlg('Изменить карточку',fld('Вопрос',`<textarea name="f" rows="3" required maxlength="2000">${esc(c.front)}</textarea>`)+fld('Ответ',`<textarea name="b" rows="3" required maxlength="2000">${esc(c.back)}</textarea>`),
  async v=>{
   const f=v.get('f').trim(),b=v.get('b').trim();
   if(!f||!b){toast('Нужны вопрос и ответ');return false}
   const r=await sb.from('cards').update({front:f,back:b}).eq('id',c.id);
   if(r.error){toast('Ошибка: '+r.error.message);return false}
   c.front=f;c.back=b;render();return true;
  });
}
function openBulk(){
 dlg('Добавить списком',fld('Вставьте по одной карточке в строке: вопрос — ответ','<textarea name="t" rows="9" placeholder="вопрос — ответ"></textarea>'),
  async v=>{
   const rows=parseCards(v.get('t')||'');
   if(!rows.length){toast('Не удалось разобрать строки');return false}
   for(let i=0;i<rows.length;i+=200){
    const r=await sb.from('cards').insert(rows.slice(i,i+200).map(x=>({deck_id:deckId,front:x.front.slice(0,2000),back:x.back.slice(0,2000)}))).select();
    if(r.error){toast('Ошибка: '+r.error.message);return false}
    CARDS=[...CARDS,...r.data.map(fromCard)];
   }
   toast('Карточек добавлено: '+rows.length);render();return true;
  });
}
document.addEventListener('input',e=>{if(e.target.id==='cqs'){cq=e.target.value;const l=$('#cl');if(l)l.innerHTML=cardsListHTML()}});
document.addEventListener('keydown',e=>{
 if(view!=='study'||!STUDY)return;
 if(e.target&&e.target.closest&&e.target.closest('input,textarea,select'))return;
 if(e.key===' '||e.key==='Enter'){e.preventDefault();ACTIONS.sflip()}
 else if(STUDY.show&&'1234'.includes(e.key)&&e.key.length===1)ACTIONS.srate({dataset:{q:String(+e.key-1)}});
});
ACTIONS.dnew=()=>openDeck();
ACTIONS.dopen=t=>{deckId=t.dataset.id;cq='';view='deck';render()};
ACTIONS.dback=()=>{view='cards';render()};
ACTIONS.dedit=()=>openDeck(DECKS.find(x=>x.id===deckId));
ACTIONS.ddel=async()=>{
 const d=DECKS.find(x=>x.id===deckId);if(!d)return;
 if(!confirm(T('Удалить колоду «'+d.title+'» со всеми карточками?')))return;
 const r=await sb.from('decks').delete().eq('id',d.id);if(r.error)return toast('Ошибка: '+r.error.message);
 DECKS=DECKS.filter(x=>x.id!==d.id);CARDS=CARDS.filter(c=>c.deck!==d.id);view='cards';render();
};
ACTIONS.dstudy=t=>startStudy([t.dataset.id],'due');
ACTIONS.dall=t=>startStudy([t.dataset.id],'all');
ACTIONS.dnewonly=t=>startStudy([t.dataset.id],'new');
ACTIONS.stall=()=>startStudy(DECKS.map(d=>d.id),'due');
ACTIONS.drev=()=>{revMode=!revMode;render()};
ACTIONS.cadd=async()=>{
 const f=($('#cf').value||'').trim(),b=($('#cb').value||'').trim();
 if(!f||!b)return toast('Нужны вопрос и ответ');
 const r=await sb.from('cards').insert({deck_id:deckId,front:f,back:b}).select().single();
 if(r.error)return toast('Ошибка: '+r.error.message);
 CARDS=[...CARDS,fromCard(r.data)];render();setTimeout(()=>{const e=$('#cf');if(e)e.focus()},0);
};
ACTIONS.cedit=t=>{const c=CARDS.find(x=>x.id===t.dataset.id);if(c)openCard(c)};
ACTIONS.cdel=async t=>{
 if(!confirm(T('Удалить карточку?')))return;
 const r=await sb.from('cards').delete().eq('id',t.dataset.id);if(r.error)return toast('Ошибка: '+r.error.message);
 CARDS=CARDS.filter(c=>c.id!==t.dataset.id);render();
};
ACTIONS.cbulk=()=>openBulk();
ACTIONS.sflip=()=>{if(!STUDY||STUDY.i>=STUDY.queue.length||STUDY.show)return;STUDY.show=true;render()};
ACTIONS.srate=async t=>{
 const s=STUDY;if(!s||!s.show)return;
 const q=+t.dataset.q,c=CARDS.find(x=>x.id===s.queue[s.i]);if(!c)return;
 const n=nextSchedule(c,q),prev={...c};
 Object.assign(c,{reps:n.reps,interval:n.interval,ease:n.ease,lapses:n.lapses,due:n.due,last:new Date().toISOString()});
 s.stat[q]++;if(q===0)s.queue.push(c.id);s.i++;s.show=false;render();
 const r=await sb.from('cards').update({reps:n.reps,interval_days:n.interval,ease:n.ease,lapses:n.lapses,due_at:n.due,last_reviewed:c.last}).eq('id',c.id);
 if(r.error){Object.assign(c,prev);toast('Ошибка: '+r.error.message)}
};
ACTIONS.sback=()=>{view=deckId&&DECKS.some(d=>d.id===deckId)&&STUDY&&STUDY.ids.length===1?'deck':'cards';STUDY=null;render()};
ACTIONS.sagain=()=>{const s=STUDY;if(s)startStudy(s.ids,s.mode)};
