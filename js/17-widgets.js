/* Виджеты раздела «Сегодня» (на ПК): добавление, порядок, размер, настройки */
let WG=null,wgEdit=false;
const isPC=()=>!!(window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine) and (min-width:1100px)').matches);
const inTxt=m=>'через '+(m>=60?Math.floor(m/60)+' ч'+(m%60?' '+m%60+' мин':''):m+' мин');
const WPAL={clock:'pk',note:'pk',cards:'lm',countdown:'lm',week:'bl',tasks:'bl',next:'or',elective:'or',tod:'bl',tomorrow:'or',dayprog:'gn',weather:'bl'};
const WDEF=[{id:'w1',type:'next',size:2,cfg:{}},{id:'w2',type:'tasks',size:1,cfg:{}},{id:'w3',type:'clock',size:1,cfg:{}}];
/* Что делает каждый виджет (показывается при добавлении и в настройках) */
const WINFO={
 clock:'Время и дата. Можно выбрать цифровые или механические часы.',
 next:'Какая пара идёт сейчас или какая будет следующей, и сколько осталось до неё.',
 tasks:'Невыполненные задания с ближайшим сроком. Нажмите на кружок, чтобы отметить задание выполненным.',
 cards:'Сколько карточек пора повторить сегодня и кнопка, чтобы сразу начать.',
 tod:'Ночь, рассвет или день: фон плавно меняется, по дуге идёт солнце или луна, справа температура.',
 note:'Быстрая заметка прямо на экране «Сегодня». Текст сохраняется сам.',
 countdown:'Сколько дней осталось до важной даты: сессии, зачёта, каникул.',
 week:'Итоги недели: сколько пар, сколько часов и какой день самый загруженный.',
 elective:'Ближайшее факультативное занятие и когда оно будет.',
 tomorrow:'Какие пары будут завтра: время, предмет и аудитория.',
 dayprog:'Сколько пар сегодня уже прошло и сколько осталось до конца учёбы.',
 weather:'Погода в выбранном городе: температура, как ощущается, минимум и максимум.'
};
const WCOL=[['','Стандартный для этого виджета'],['th','Цвет темы'],['pk','Фиолетовый'],['lm','Лаймовый'],['bl','Голубой'],['or','Оранжевый'],['rs','Розовый'],['gn','Зелёный']];
const YN=[['1','Да'],['0','Нет']];
/* настройки по видам: [ключ, название, пояснение, варианты, значение по умолчанию] */
const WOPT={
 clock:[['style','Вид часов','Цифровые или со стрелками. «Как в настройках» берёт выбор из раздела «Настройки → Часы».',[['','Как в настройках'],['digital','Цифровые'],['analog','Механические']],''],['date','Дата под часами','Показывать день недели и число. Работает для цифровых часов.',YN,'1']],
 next:[['room','Аудитория','Показывать номер аудитории рядом со временем.',YN,'1'],['count','Сколько осталось','Подпись вроде «через 20 мин» или «Идёт сейчас».',YN,'1']],
 tasks:[['n','Сколько заданий показывать','Максимум строк в списке.',[['1','1'],['2','2'],['3','3'],['4','4'],['5','5']],'3'],['due','Срок сдачи','Показывать дату под названием задания.',YN,'1']],
 cards:[['btn','Кнопка «Учить»','Быстрый переход к повторению карточек.',YN,'1']],
 tod:[['temp','Температура','Показывать температуру справа. Нужен выбранный город в настройках.',YN,'1'],['sub','Подпись','Короткая фраза под названием периода.',YN,'1']],
 note:[['big','Размер текста','Крупный текст удобен для короткой заметки.',[['0','Обычный'],['1','Крупный']],'0']],
 countdown:[['mode','Как показывать остаток','Только дни или недели и дни.',[['d','Только дни'],['w','Недели и дни']],'d']],
 week:[],
 elective:[['room','Аудитория','Показывать номер аудитории.',YN,'1']],
 tomorrow:[['n','Сколько пар показывать','Максимум строк в списке.',[['3','3'],['4','4'],['5','5'],['6','6']],'4'],['room','Аудитория','Показывать номер аудитории рядом с предметом.',YN,'1']],
 dayprog:[['mode','Что показывать','Сколько пар прошло или сколько времени осталось до конца последней пары.',[['count','Сколько пар прошло'],['time','Сколько времени осталось']],'count']],
 weather:[['feels','Ощущается как','Показывать температуру «как ощущается».',YN,'1'],['range','Минимум и максимум','Показывать минимальную и максимальную температуру дня.',YN,'1']]
};
const wv=(w,k)=>{const o=(WOPT[w.type]||[]).find(x=>x[0]===k),v=(w.cfg||{})[k];return v===undefined?(o?o[4]:''):String(v)};
const WT={
 clock:{n:'Часы и дата',r:w=>{const d=new Date(),st=wv(w,'style')||CLK;if(st==='analog')return`<div class="wa">${clockSVG()}</div>`;return`<div class="wbig">${hm(d)}</div>${wv(w,'date')==='0'?'':`<span class="n">${esc(d.toLocaleDateString(LOC(),{weekday:'long',day:'numeric',month:'long'}))}</span>`}`}},
 next:{n:'Ближайшее занятие',r:w=>{
  const now=new Date(),t=lessonsOn(now).filter(l=>!l.cancel),tm=hm(now),cur=t.find(l=>l.start<=tm&&tm<l.end),nx=cur||t.find(l=>l.start>tm);
  if(!nx)return'<p class="n">Сегодня занятий больше нет</p>';
  const m=toMin(nx.start)-(now.getHours()*60+now.getMinutes());
  return`<b class="hl">${esc(nx.subject)}</b><span>${nx.start}–${nx.end}${nx.room&&wv(w,'room')!=='0'?' · ауд. '+esc(nx.room):''}</span>${wv(w,'count')==='0'?'':`<span class="cd">${cur?'Идёт сейчас':inTxt(m)}</span>`}${safeUrl(nx.link)?`<a class="join" href="${esc(safeUrl(nx.link))}" target="_blank" rel="noopener noreferrer">${ic('link')}Подключиться</a>`:''}`;
 }},
 tasks:{n:'Ближайшие задания',r:w=>{
  const a=HW.filter(h=>!h.done).sort((x,y)=>x.due_date.localeCompare(y.due_date)).slice(0,+wv(w,'n')||3),td=ymd(new Date());
  return a.length?a.map(h=>`<div class="wrow"><button class="ck2" data-a="hwt" data-id="${h.id}" aria-label="Выполнено">${ic('check')}</button><span><b>${esc(h.title)}</b>${wv(w,'due')==='0'?'':`<small class="${h.due_date<td?'od':''}">${fmt(h.due_date)}</small>`}</span></div>`).join(''):'<p class="n">Заданий нет</p>';
 }},
 cards:{n:'Карточки на сегодня',r:w=>{
  if(!cardsLoaded){if(isPC())loadCards();return'<p class="n">Загрузка…</p>'}
  const due=CARDS.filter(c=>cardState(c)==='due').length,nw=CARDS.filter(c=>cardState(c)==='new').length;
  return`<div class="wbig">${due}</div><span class="n">пора повторить</span>${due+nw&&wv(w,'btn')!=='0'?`<button class="btn g" data-a="stall">Учить</button>`:''}`;
 }},
 tod:{n:'Время суток',r:w=>todHTML({temp:wv(w,'temp')!=='0',sub:wv(w,'sub')!=='0'})},
 note:{n:'Стикер',r:w=>`<textarea class="wnote${wv(w,'big')==='1'?' big':''}" data-s="wgnote" data-id="${w.id}" maxlength="500" placeholder="Напишите что-нибудь…">${esc((w.cfg||{}).text||'')}</textarea>`},
 countdown:{n:'Обратный отсчёт',r:w=>{
  const c=w.cfg||{};if(!c.date)return'<p class="n">Нажмите «Настроить» и выберите дату</p>';
  const d=Math.max(0,Math.round((pd(c.date)-pd(ymd(new Date())))/864e5));
  const big=wv(w,'mode')==='w'&&d>=7?`${Math.floor(d/7)} нед. ${d%7?d%7+' дн.':''}`:String(d);
  return`<b class="hl">${esc(c.title||'')}</b><div class="wbig${big.length>3?' sm':''}">${big}</div><span class="n">${wv(w,'mode')==='w'&&d>=7?'осталось':'дн. осталось'}</span>`;
 }},
 week:{n:'Сводка недели',r:()=>(weekSumHTML()||'').replace('card gl sum','sum2')||'<p class="n">Пока пусто</p>'},
 tomorrow:{n:'Расписание на завтра',r:w=>{
  const d=new Date();d.setDate(d.getDate()+1);
  const t=lessonsOn(d).filter(l=>!l.cancel).slice(0,+wv(w,'n')||4);
  return t.length?t.map(l=>`<div class="wl" style="--c:${col(l)}"><i></i><span><b>${esc(l.subject)}</b><small>${l.start}${l.room&&wv(w,'room')!=='0'?' · ауд. '+esc(l.room):''}</small></span></div>`).join(''):'<p class="n">Завтра занятий нет</p>';
 }},
 dayprog:{n:'Прогресс дня',r:w=>{
  const now=new Date(),t=lessonsOn(now).filter(l=>!l.cancel),tm=hm(now);
  if(!t.length)return'<p class="n">Сегодня занятий нет</p>';
  const done=t.filter(l=>l.end<=tm).length,last=t[t.length-1],pct=Math.round(done/t.length*100);
  const left=Math.max(0,toMin(last.end)-(now.getHours()*60+now.getMinutes()));
  const txt=wv(w,'mode')==='time'?(left?(left>=60?Math.floor(left/60)+' '+T('ч')+' '+(left%60?left%60+' '+T('мин'):''):left+' '+T('мин')):T('Учёба закончилась')):`${done} ${T('из')} ${t.length}`;
  return`<div class="ring" style="--p:${pct}"><b>${pct}%</b></div><span class="n">${wv(w,'mode')==='time'?(left?'до конца учёбы':''):'пар прошло'}</span><span class="hl">${txt}</span>`;
 }},
 weather:{n:'Погода',r:w=>{
  if(!CITY)return'<p class="n">Выберите город в настройках</p>';
  if(!WX)return'<p class="n">Погода недоступна</p>';
  const c=WCODE(WX.c);
  return`<div class="wwx">${ic(c[0])}<div class="wbig">${WX.t}°</div></div><span class="hl">${c[1]}</span><span class="n">${esc(CITY.name)}${wv(w,'feels')==='0'?'':' · '+T('ощущается')+' '+WX.f+'°'}${wv(w,'range')==='0'?'':' · '+WX.min+'…'+WX.max+'°'}</span>`;
 }},
 elective:{n:'Ближайший факультатив',r:w=>{
  const now=new Date();let best=null;
  elGroups().forEach(g=>{const n=elNext(g,now);if(n&&(!best||n.score<best.n.score))best={g,n}});
  return best?`<b class="hl">${esc(best.g.subject)}</b><span>${elWhen(best.n)}${best.n.r.room&&wv(w,'room')!=='0'?' · ауд. '+esc(best.n.r.room):''}</span>`:'<p class="n">Пока нет факультативов</p>';
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
 const ty=WT[w.type],c=w.cfg||{};
 if(w.type==='tod'&&TODM)return'';
 const pal=c.color||WPAL[w.type]||'th';
 const edit=wgEdit?`<button class="wgcfgbtn" data-a="wgcfg" data-id="${w.id}">${ic('edit')}Настроить</button>`:'';
 return`<section class="card gl wg s${w.size===2?2:1}${w.type==='tod'?' wgtod':''}${wgEdit?' wg-edit':''}" data-p="${pal}" data-wid="${w.id}"${wgEdit?' draggable="true"':''}><div class="wh"><h3>${esc(c.name||T(ty.n))}</h3></div><div class="wb">${ty.r(w)}</div>${edit}</section>`;
}
function wgGridHTML(){
 const l=wgList();
 return l.map((w,i)=>wgItem(w,i,l.length)).join('')+(wgEdit?`<button class="addtile wgadd" data-a="wgadd">${ic('plus')}Добавить виджет</button>`:'')||'<p class="n">Нет виджетов</p>';
}
function widgetsHTML(){
 return`<section class="wgsec"><div class="dh"><h2>Виджеты</h2><button class="btn g" data-a="wgedit">${ic(wgEdit?'check':'widget')}${wgEdit?'Готово':'Изменить'}</button></div>${wgEdit?'<p class="n wghint">Перетащите плитку мышью, чтобы поменять порядок. Кнопка «Настроить» открывает цвет, размер и параметры именно этого виджета.</p>':''}<div class="wgrid2" id="wgc">${wgGridHTML()}</div></section>`;
}
const wgRefresh=()=>{const c=$('#wgc');if(c)c.innerHTML=wgGridHTML()};
/* Правая колонка: виджеты только на «Сегодня» и только на ПК */
function railPaint(force){const r=$('#rw');if(!r)return;r.innerHTML=(force||(me&&!SHARED&&view==='today'&&isPC()))?widgetsHTML():''}
function wgConfig(w){
 const ty=WT[w.type],c=w.cfg||{},hint=h=>h?`<p class="n">${h}</p>`:'';
 const sel=(name,opts,cur)=>`<select name="${name}">${opts.map(([v,t])=>`<option value="${v}" ${String(cur)===String(v)?'selected':''}>${t}</option>`).join('')}</select>`;
 let h=`<p class="wgname"><b>${esc(c.name||T(ty.n))}</b></p><p class="n">${WINFO[w.type]}</p>`;
 h+=fld('Название плитки',`<input name="name" maxlength="30" value="${esc(c.name||'')}" placeholder="${esc(T(ty.n))}">`+hint('Оставьте пустым, и будет стандартное название.'));
 if(w.type==='countdown')h+=fld('Название события',`<input name="title" maxlength="40" value="${esc(c.title||'')}">`+hint('Например: «Сессия» или «Зачёт по физике».'))+fld('Дата события',`<input name="date" type="date" required value="${esc(c.date||'')}">`+hint('До этого дня считаются оставшиеся дни.'));
 (WOPT[w.type]||[]).forEach(([k,l,hh,opts])=>{h+=fld(l,sel('o_'+k,opts,wv(w,k))+hint(hh))});
 h+=fld('Цвет плитки',sel('color',WCOL,c.color||'')+hint('Цвет свечения по краям. «Цвет темы» подстраивается под выбранную тему интерфейса.'));
 h+=fld('Размер',sel('size',[['1','Маленький (квадрат)'],['2','Большой (вдвое шире)']],w.size===2?2:1)+hint('Большие плитки занимают всю ширину колонки.'));
 h+=`<label>Место среди других виджетов</label><div class="row"><button type="button" class="btn g" data-a="wgmv" data-id="${w.id}" data-d="-1">${ic('left')}Раньше</button><button type="button" class="btn g" data-a="wgmv" data-id="${w.id}" data-d="1">Позже${ic('right')}</button></div>${hint('Меняет плитку местами с соседней: «раньше» ближе к началу, «позже» ближе к концу.')}`;
 h+=`<button type="button" class="btn d wide" data-a="wgdel" data-id="${w.id}">${ic('trash')}Удалить этот виджет</button>`;
 dlg('Настройки виджета',h,async v=>{
  const nc={...c,name:(v.get('name')||'').trim(),color:v.get('color')||''};
  if(w.type==='countdown'){nc.title=(v.get('title')||'').trim();nc.date=v.get('date')||''}
  (WOPT[w.type]||[]).forEach(([k])=>{const x=v.get('o_'+k);if(x!==null)nc[k]=x});
  w.cfg=nc;w.size=v.get('size')==='2'?2:1;saveWidgets();wgRefresh();return true;
 });
}
ACTIONS.wgedit=()=>{wgEdit=!wgEdit;isPC()?railPaint():render()};
ACTIONS.wgmv=t=>{const l=wgList(),i=l.findIndex(w=>w.id===t.dataset.id),j=i+ +t.dataset.d;if(i<0||j<0||j>=l.length)return toast('Дальше двигать некуда');[l[i],l[j]]=[l[j],l[i]];saveWidgets();wgRefresh()};
ACTIONS.wgdel=t=>{WG=wgList().filter(w=>w.id!==t.dataset.id);saveWidgets();const d=$('#dlg');if(d&&d.open)d.close();wgRefresh()};
ACTIONS.wgcfg=t=>{const w=wgList().find(x=>x.id===t.dataset.id);if(w)wgConfig(w)};
ACTIONS.wgadd=()=>{
 dlg('Добавить виджет',`<p class="n">Выберите, что показывать. После добавления нажмите «Настроить» на плитке.</p><div class="wgpick">${Object.keys(WT).map(k=>`<button type="button" class="wgp" data-a="wgnew" data-t="${k}"><b>${WT[k].n}</b><span>${WINFO[k]}</span></button>`).join('')}</div>`,async()=>true,'Закрыть');
};
ACTIONS.wgnew=t=>{
 const k=t.dataset.t,w={id:'w'+Date.now().toString(36),type:k,size:k==='week'||k==='next'||k==='tod'||k==='weather'||k==='tomorrow'?2:1,cfg:k==='countdown'?{title:'',date:''}:{}};
 wgList().push(w);saveWidgets();$('#dlg').close();wgRefresh();
 if(k==='countdown')setTimeout(()=>wgConfig(w),50);
};
document.addEventListener('change',e=>{
 if(e.target.dataset&&e.target.dataset.s==='wgnote'){const w=wgList().find(x=>x.id===e.target.dataset.id);if(w){w.cfg={...w.cfg,text:e.target.value};saveWidgets()}}
});
setInterval(()=>{
 const c=$('#wgc');if(!c||view!=='today'||wgEdit)return;
 if(document.activeElement&&c.contains&&c.contains(document.activeElement))return;
 c.innerHTML=wgGridHTML();
},30000);

/* перетаскивание плиток мышью в режиме «Изменить» */
(function(){
 let dragId=null;
 const tile=e=>e.target.closest&&e.target.closest('.wg[data-wid]');
 document.addEventListener('dragstart',e=>{const t=tile(e);if(!t||!wgEdit)return;dragId=t.dataset.wid;t.classList.add('dragging');if(e.dataTransfer){e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',dragId)}catch(x){}}});
 document.addEventListener('dragover',e=>{const t=tile(e);if(!t||!dragId)return;e.preventDefault();document.querySelectorAll('.wg.over').forEach(x=>x!==t&&x.classList.remove('over'));if(t.dataset.wid!==dragId)t.classList.add('over')});
 document.addEventListener('dragend',()=>{dragId=null;document.querySelectorAll('.wg.dragging,.wg.over').forEach(x=>x.classList.remove('dragging','over'))});
 document.addEventListener('drop',e=>{
  const t=tile(e);if(!t||!dragId)return;e.preventDefault();
  const l=wgList(),from=l.findIndex(w=>w.id===dragId),to=l.findIndex(w=>w.id===t.dataset.wid);
  dragId=null;if(from<0||to<0||from===to)return;
  const [m]=l.splice(from,1);l.splice(to,0,m);saveWidgets();wgRefresh();
 });
})();
