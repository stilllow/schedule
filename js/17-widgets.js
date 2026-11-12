/* Виджеты раздела «Сегодня» (на ПК): добавление, порядок, размер, настройки */
let WG=null,wgEdit=false;
const isPC=()=>!!(window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine) and (min-width:1100px)').matches);
const inTxt=m=>'через '+(m>=60?Math.floor(m/60)+' ч'+(m%60?' '+m%60+' мин':''):m+' мин');
const WDEF=[{id:'w1',type:'next',size:2,cfg:{}},{id:'w2',type:'tasks',size:1,cfg:{}},{id:'w3',type:'clock',size:1,cfg:{}}];
const WT={
 clock:{n:'Часы и дата',r:()=>{const d=new Date();return`<div class="wbig">${hm(d)}</div><span class="n">${esc(d.toLocaleDateString(LOC(),{weekday:'long',day:'numeric',month:'long'}))}</span>`}},
 next:{n:'Ближайшее занятие',r:()=>{
  const now=new Date(),t=lessonsOn(now).filter(l=>!l.cancel),tm=hm(now),cur=t.find(l=>l.start<=tm&&tm<l.end),nx=cur||t.find(l=>l.start>tm);
  if(!nx)return'<p class="n">Сегодня занятий больше нет</p>';
  const m=toMin(nx.start)-(now.getHours()*60+now.getMinutes());
  return`<b class="hl">${esc(nx.subject)}</b><span>${nx.start}–${nx.end}${nx.room?' · ауд. '+esc(nx.room):''}</span><span class="cd">${cur?'Идёт сейчас':inTxt(m)}</span>`;
 }},
 tasks:{n:'Ближайшие задания',r:()=>{
  const a=HW.filter(h=>!h.done).sort((x,y)=>x.due_date.localeCompare(y.due_date)).slice(0,4),td=ymd(new Date());
  return a.length?a.map(h=>`<div class="wrow"><button class="ck2" data-a="hwt" data-id="${h.id}" aria-label="Выполнено">${ic('check')}</button><span><b>${esc(h.title)}</b><small class="${h.due_date<td?'od':''}">${fmt(h.due_date)}</small></span></div>`).join(''):'<p class="n">Заданий нет</p>';
 }},
 cards:{n:'Карточки на сегодня',r:()=>{
  if(!cardsLoaded){if(isPC())loadCards();return'<p class="n">Загрузка…</p>'}
  const due=CARDS.filter(c=>cardState(c)==='due').length,nw=CARDS.filter(c=>cardState(c)==='new').length;
  return`<div class="wbig">${due}</div><span class="n">пора повторить</span>${due+nw?`<button class="btn g" data-a="stall">Учить</button>`:''}`;
 }},
 note:{n:'Стикер',r:w=>`<textarea class="wnote" data-s="wgnote" data-id="${w.id}" maxlength="500" placeholder="Напишите что-нибудь…">${esc((w.cfg||{}).text||'')}</textarea>`},
 countdown:{n:'Обратный отсчёт',r:w=>{
  const c=w.cfg||{};if(!c.date)return'<p class="n">Выберите дату в настройках</p>';
  const d=Math.round((pd(c.date)-pd(ymd(new Date())))/864e5);
  return`<b class="hl">${esc(c.title||'')}</b><div class="wbig">${Math.max(0,d)}</div><span class="n">дн. осталось</span>`;
 }},
 week:{n:'Сводка недели',r:()=>(weekSumHTML()||'').replace('card gl sum','sum2')||'<p class="n">Пока пусто</p>'},
 elective:{n:'Ближайший факультатив',r:()=>{
  const now=new Date();let best=null;
  elGroups().forEach(g=>{const n=elNext(g,now);if(n&&(!best||n.score<best.n.score))best={g,n}});
  return best?`<b class="hl">${esc(best.g.subject)}</b><span>${elWhen(best.n)}${best.n.r.room?' · ауд. '+esc(best.n.r.room):''}</span>`:'<p class="n">Пока нет факультативов</p>';
 }}
};
function wgList(){
 if(WG)return WG;
 let l=null;
 try{l=Array.isArray(P&&P.widgets)?P.widgets:JSON.parse(localStorage.getItem('wg')||'null')}catch(e){}
 WG=Array.isArray(l)?l.filter(w=>w&&WT[w.type]).map(w=>({id:String(w.id),type:w.type,size:w.size===2?2:1,cfg:w.cfg||{}})):WDEF.map(w=>({...w}));
 return WG;
}
async function saveWidgets(){
 try{localStorage.setItem('wg',JSON.stringify(WG))}catch(e){}
 try{if(me&&sb&&sb.from)await sb.from('profiles').update({widgets:WG}).eq('id',me.id)}catch(e){}
}
function wgItem(w,i,n){
 const ty=WT[w.type];
 const ctl=wgEdit?`<div class="wctl"><button class="ib" data-a="wgmv" data-id="${w.id}" data-d="-1" ${i===0?'disabled':''} aria-label="Влево">${ic('left')}</button><button class="ib" data-a="wgmv" data-id="${w.id}" data-d="1" ${i===n-1?'disabled':''} aria-label="Вправо">${ic('right')}</button><button class="ib" data-a="wgsize" data-id="${w.id}" aria-label="Размер">${ic('widget')}</button>${['note','countdown'].includes(w.type)?`<button class="ib" data-a="wgcfg" data-id="${w.id}" aria-label="Настроить">${ic('edit')}</button>`:''}<button class="ib" data-a="wgdel" data-id="${w.id}" aria-label="Удалить виджет">${ic('trash')}</button></div>`:'';
 return`<section class="card gl wg s${w.size===2?2:1}"><div class="wh"><h3>${ty.n}</h3>${ctl}</div><div class="wb">${ty.r(w)}</div></section>`;
}
function wgGridHTML(){
 const l=wgList();
 return l.map((w,i)=>wgItem(w,i,l.length)).join('')+(wgEdit?`<button class="addtile wgadd" data-a="wgadd">${ic('plus')}Добавить виджет</button>`:'')||'<p class="n">Нет виджетов</p>';
}
function widgetsHTML(){
 return`<section class="wgsec"><div class="dh"><h2>Виджеты</h2><button class="btn g" data-a="wgedit">${ic(wgEdit?'check':'widget')}${wgEdit?'Готово':'Изменить'}</button></div><div class="wgrid2" id="wgc">${wgGridHTML()}</div></section>`;
}
const wgRefresh=()=>{const c=$('#wgc');if(c)c.innerHTML=wgGridHTML()};
function wgConfig(w){
 if(w.type==='note')return;
 dlg('Обратный отсчёт',fld('Название',`<input name="t" maxlength="40" value="${esc((w.cfg||{}).title||'')}">`)+fld('Дата',`<input name="d" type="date" required value="${esc((w.cfg||{}).date||'')}">`),
  async v=>{w.cfg={title:v.get('t').trim(),date:v.get('d')};saveWidgets();wgRefresh();return true});
}
ACTIONS.wgedit=()=>{wgEdit=!wgEdit;render()};
ACTIONS.wgmv=t=>{const l=wgList(),i=l.findIndex(w=>w.id===t.dataset.id),j=i+ +t.dataset.d;if(i<0||j<0||j>=l.length)return;[l[i],l[j]]=[l[j],l[i]];saveWidgets();wgRefresh()};
ACTIONS.wgsize=t=>{const w=wgList().find(x=>x.id===t.dataset.id);if(!w)return;w.size=w.size===2?1:2;saveWidgets();wgRefresh()};
ACTIONS.wgdel=t=>{WG=wgList().filter(w=>w.id!==t.dataset.id);saveWidgets();wgRefresh()};
ACTIONS.wgcfg=t=>{const w=wgList().find(x=>x.id===t.dataset.id);if(w)wgConfig(w)};
ACTIONS.wgadd=()=>{
 dlg('Добавить виджет',`<div class="tiles">${Object.keys(WT).map(k=>`<button type="button" class="tile" data-a="wgnew" data-t="${k}"><span>${WT[k].n}</span></button>`).join('')}</div>`,async()=>true,'Закрыть');
};
ACTIONS.wgnew=t=>{
 const k=t.dataset.t,w={id:'w'+Date.now().toString(36),type:k,size:k==='week'||k==='next'?2:1,cfg:k==='countdown'?{title:'',date:''}:{}};
 wgList().push(w);saveWidgets();$('#dlg').close();wgRefresh();
 if(k==='countdown')wgConfig(w);
};
document.addEventListener('change',e=>{
 if(e.target.dataset&&e.target.dataset.s==='wgnote'){const w=wgList().find(x=>x.id===e.target.dataset.id);if(w){w.cfg={...w.cfg,text:e.target.value};saveWidgets()}}
});
setInterval(()=>{
 const c=$('#wgc');if(!c||view!=='today'||wgEdit)return;
 if(document.activeElement&&c.contains&&c.contains(document.activeElement))return;
 c.innerHTML=wgGridHTML();
},30000);
