/* Карточки и экраны: сегодня, расписание, задания, настройки, render() */
const fld=(t,h)=>`<div><label>${t}</label>${h}</div>`;
function dlg(title,body,ok,label){$('#dt').textContent=title;$('#df').innerHTML=body+'<div class="row acts"><button type="button" class="btn g" id="cx">Отмена</button><button class="btn">'+(label||'Сохранить')+'</button></div>';DOK=ok;$('#dlg').showModal();$('#cx').onclick=()=>$('#dlg').close()}
function card(l,m,now){
 const st=l.cancel?'opacity:.55;text-decoration:line-through':'';
 const acts=m==='edit'?`<button class="ib" data-a="edit" data-id="${l.id}" aria-label="Изменить">${ic('edit')}</button><button class="ib" data-a="copy" data-id="${l.id}" aria-label="Копировать">${ic('copy')}</button><button class="ib" data-a="del" data-id="${l.id}" aria-label="Удалить">${ic('trash')}</button>`:m==='ro'?'':`<button class="ib" data-a="ovr" data-id="${l.id}" aria-label="Отменить или заменить">${ic('swap')}</button>`;
 return`<div class="card gl l${now?' now':''}" style="--c:${col(l)}"><div class="t" style="${st}">${l.start}<small>${l.end}</small></div><div class="m"><b style="${st}">${esc(l.subject)}</b><span>${[l.kind,l.teacher,l.room&&'ауд. '+l.room].filter(Boolean).map(esc).join(' · ')||'Аудитория не указана'}</span>${l.notes?`<span>${esc(l.notes)}</span>`:''}${l.cancel?'<span class="tag x">Отменено</span>':l.repl?'<span class="tag">Замена</span>':''}${m==='edit'&&l.week!=='both'?`<span class="tag">${WN[l.week]}</span>`:''}${l.note2?`<span>${esc(l.note2)}</span>`:''}${cfTag(l)}</div>${acts}</div>`}
function hwHTML(){
 const t=ymd(new Date()),op=HW.filter(h=>!h.done).sort((a,b)=>a.due_date.localeCompare(b.due_date)),dn=HW.filter(h=>h.done);
 const row=h=>{const ls=L.find(l=>l.id===h.lesson_id),od=!h.done&&h.due_date<t;return`<div class="card gl l"><button class="ck2${h.done?' on':''}" data-a="hwt" data-id="${h.id}" aria-label="Выполнено">${ic('check')}</button><div class="m"><b style="${h.done?'text-decoration:line-through;opacity:.6':''}">${esc(h.title)}</b><span class="${od?'od':''}">${ls?esc(ls.subject)+' · ':''}до ${fmt(h.due_date)}${od?' · просрочено':''}</span></div><button class="ib" data-a="hwe" data-id="${h.id}" aria-label="Изменить">${ic('edit')}</button><button class="ib" data-a="hwd" data-id="${h.id}" aria-label="Удалить">${ic('trash')}</button></div>`};
 return`<div class="top"><h1>Задания</h1><button class="btn" data-a="hwa">${ic('plus')}Задание</button></div><p class="n hint">Сроки видны в сводке недели и в напоминаниях.</p>`+(op.length?op.map(row).join(''):'<div class="empty">Невыполненных заданий нет</div>')+(dn.length?'<h2>Выполнено</h2>'+dn.map(row).join(''):'')}
function weekTop(){
 return`<div class="top"><h1>Расписание</h1>${SHARED?'':`<button class="btn g" data-a="imp">${ic('upload')}Импорт</button>`}</div>
 ${P.cyc?`<div class="seg2"><div class="sg gl"><button class="btn ${wsel==='up'?'':'g'}" data-a="wsel" data-w="up">Над чертой</button><button class="btn ${wsel==='down'?'':'g'}" data-a="wsel" data-w="down">Под чертой</button></div></div>`:''}`+
 (SHARED?'':`<div class="card gl sat"><span>Выходная суббота</span><button class="sw2${P.satOff?' on':''}" role="switch" aria-checked="${P.satOff}" data-a="sat" aria-label="Выходная суббота"><i></i></button></div><p class="n legend">${ic('edit')} изменить ${ic('copy')} копировать ${ic('trash')} удалить</p>`)+
 `<input id="q" placeholder="Поиск по предмету или преподавателю" value="${esc(q)}"><div id="wk">${wkHTML()}</div>`}
function wkHTML(){
 const ed=!SHARED,m=ed?'edit':'ro',ms=l=>!q||(l.subject+' '+l.teacher).toLowerCase().includes(q),sat=i=>i===5&&P.satOff;
 const day=(n,i)=>{
  const ls=sat(i)?[]:lessonsFor(i,wsel,false).filter(ms);
  const inner=sat(i)?`<div class="note">${ic('moon')}Суббота — выходной день</div>`:ls.length?ls.map(l=>card(l,m)).join(''):'<p class="n none">Нет занятий</p>';
  const add=ed&&!sat(i)?`<button class="addrow" data-a="add" data-d="${i}" data-el="0" aria-label="Добавить: ${n}">${ic('plus')}Добавить</button>`:'';
  return`<section class="card gl dayc"><h2>${n}</h2>${inner}${add}</section>`;
 };
 return'<div class="wgrid">'+DAYS.map(day).join('')+'</div>'}
function todayHTML(ro){
 const now=new Date(),t=lessonsOn(cur),te=lessonsOn(cur,true),inf=dayInfo(cur),isT=ymd(cur)===ymd(now),tm=hm(now),nx=isT?t.findIndex(l=>!l.cancel&&l.end>tm):-1,day=(cur.getDay()+6)%7,off=day>=6||(day===5&&P.satOff);
 let h=`<div class="top"><h1>${esc(cur.toLocaleDateString(LOC(),{weekday:'long',day:'numeric',month:'long'}))}</h1>${P.cyc?`<span class="badge">${WN[wkType(cur)]}</span>`:''}</div>
 <div class="dn"><button class="btn g sq" data-a="dd" data-n="-1" aria-label="Предыдущий день">${ic('left')}</button><button class="btn g" data-a="tod">Сегодня</button><input type="date" data-s="date" value="${ymd(cur)}" style="margin:0;flex:2"><button class="btn g sq" data-a="dd" data-n="1" aria-label="Следующий день">${ic('right')}</button></div>`+wstrip();
 if(!ro)h+=guideHTML();
 if(inf)h+=`<div class="note">${ic('moon')}${esc(inf)}</div>`;
 h+=t.length?gapList(t,nx,ro):`<div class="empty">${!ro&&!L.some(l=>!l.el)?'Занятий пока нет.':off?'Выходной':'Занятий нет'}</div>`;
 if(te.length)h+='<h2>Факультативы</h2>'+te.map(l=>card(l,'ro')).join('');
 if(!ro)h+=weekSumHTML()+(t.length?`<p class="n legend">${ic('swap')} отмена или замена на этот день</p>`:'');
 return h}
function render(){
 const A=$('#app');document.body.classList.toggle('anon',!me);if(!sb)return;if(SHARED){A.innerHTML=sharedHTML();return}
 $$('#nav [data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===view));const gp=$('#grp');if(gp){const e2=view==='elv'||view==='ele';gp.firstElementChild.classList.toggle('on',e2)}
 if(!me){A.innerHTML=`<div class="auth gl"><div class="lg">${langBtns()}</div><h1>Моё расписание</h1><p class="n">Войдите или зарегистрируйтесь — расписание будет на всех устройствах.</p>
 <div class="seg"><button class="btn ${mode==='in'?'':'g'}" data-a="mode" data-m="in">Вход</button><button class="btn ${mode==='up'?'':'g'}" data-a="mode" data-m="up">Регистрация</button></div>
 <form id="af"><label>Email</label><input id="u" type="email" autocomplete="email" required maxlength="100"><label>Пароль</label><input id="p" type="password" autocomplete="${mode==='in'?'current-password':'new-password'}" required minlength="6">
 ${mode==='up'?'<label>Повторите пароль</label><input id="p2" type="password" autocomplete="new-password" required>':''}
 <div class="err">${esc(err)}</div>${info?`<p class="n">${esc(info)}</p>`:''}<button class="btn" style="width:100%">${mode==='in'?'Войти':'Создать аккаунт'}</button>${mode==='in'?'<button type="button" class="btn d" data-a="forgot" style="width:100%;margin-top:6px">Забыли пароль?</button>':''}</form></div>`;return}
 if(!P){A.innerHTML='<div class="empty">Загрузка…</div>';return}
 const now=new Date();let h='';
 if(view==='today'){h=todayHTML();
 }else if(view==='week'){h=weekTop();
 }else if(view==='elv'){h=elvHTML();
 }else if(view==='ele'){h=eleHTML();
 }else if(view==='hw')h=hwHTML();
 else if(view==='acc')h=accHTML();
 else{
  const np=window.Notification?Notification.permission:'unsupported',cust=cm||!PRE.includes(P.nt),ct=wkType(now);
  h=`<h1>Настройки</h1><div class="card gl"><h2 style="margin-top:0">Оформление</h2><label>Тема</label><div class="tiles">${THEMES.map(([k,n])=>`<button class="tile${P.theme===k?' on':''}" data-a="th" data-v="${k}"><span class="pv" style="background:linear-gradient(135deg,${TPV[k][0]},${TPV[k][1]})"></span><span>${n}</span></button>`).join('')}</div>
  <label>Шрифт</label><div class="tiles">${FONTS.map(([k,n])=>`<button class="tile${P.font===k?' on':''}" data-a="ft" data-v="${k}" ${fontOk(k)?'':'disabled'} style="font-family:${FF[k]||'system-ui'},system-ui"><span class="ag">${LANG==='ru'?'Аа':'Aa'}</span><span>${n}</span></button>`).join('')}</div><p class="n">Серые шрифты не поддерживают этот язык.</p></div>
  <div class="card gl"><h2 style="margin-top:0">Интерфейс</h2><label>Язык</label><div class="seg"><button class="btn ${LANG==='ru'?'':'g'}" data-a="lang" data-l="ru">Русский</button><button class="btn ${LANG==='en'?'':'g'}" data-a="lang" data-l="en">English</button></div>
  <label>Масштаб интерфейса: <b id="scv">${SC}%</b></label>${sliderHTML()}<p class="n">Стандарт — 100%.</p></div>
  <div class="card gl"><h2 style="margin-top:0">Недели и напоминания</h2><label>Тип расписания</label><div class="seg"><button class="btn ${P.cyc?'':'g'}" data-a="cyc" data-v="1">Цикличное</button><button class="btn ${P.cyc?'g':''}" data-a="cyc" data-v="0">Статичное</button></div><p class="n">Цикличное — недели чередуются. Статичное — всегда одинаково.</p>${P.cyc?`<label>Какая неделя идёт сейчас?</label><select data-s="type"><option value="up" ${ct==='up'?'selected':''}>Над чертой</option><option value="down" ${ct==='down'?'selected':''}>Под чертой</option></select>`:''}
  <label>Напоминать за</label><select data-s="remind">${[5,10,15,30,60].map(m=>`<option value="${m}" ${P.remind===m?'selected':''}>${m} мин до начала</option>`).join('')}</select>
  <label>Текст сообщения</label><select data-s="ntext">${PRE.map(p=>`<option value="${p}" ${!cust&&P.nt===p?'selected':''}>${p}</option>`).join('')}<option value="__c" ${cust?'selected':''}>Свой текст…</option></select>
  ${cust?`<input data-s="ncust" maxlength="80" placeholder="Например: Пора на пару!" value="${esc(P.nt)}">`:''}
  <div class="row"><button class="btn g" data-a="notif">${np==='granted'?ic('check')+'Уведомления включены':ic('bell')+'Включить уведомления'}</button><button class="btn g" data-a="test">Проверить сообщение</button></div>
  <div class="card sat"><span>Напоминать о заданиях</span><button class="sw2${hwrOn()?' on':''}" role="switch" aria-checked="${hwrOn()}" data-a="hwr" aria-label="Напоминать о заданиях"><i></i></button></div>
  <div class="card sat"><span>Цикличность факультативов</span><button class="sw2${P.elCyc?' on':''}" role="switch" aria-checked="${P.elCyc}" data-a="elcyc" aria-label="Цикличность факультативов"><i></i></button></div>
  <p class="n">Нужно, только если у факультативов чередуются недели.</p>
  <p class="n">Напоминания работают, пока сайт открыт.</p></div>
  <div class="card gl"><h2 style="margin-top:0">Экспорт и доступ</h2><button class="btn g wide" data-a="ics">${ic('download')}Скачать расписание (.ics)</button><p class="n">Для Google, Apple и Outlook Calendar. Конец — по дате конца семестра.</p>
  <div class="card sat"><span>Доступ по ссылке</span><button class="sw2${P.share?' on':''}" role="switch" aria-checked="${!!P.share}" data-a="share" aria-label="Доступ по ссылке"><i></i></button></div>
  <p class="n">Видно всем, у кого есть ссылка (без заметок и заданий).</p>
  ${P.share?`<input readonly id="shu" value="${esc(shareUrl())}"><div class="row"><button class="btn g" data-a="shcopy">${ic('copy')}Копировать ссылку</button><button class="btn g" data-a="shnew">Новая ссылка</button></div>`:''}</div>
  <div class="card gl"><h2 style="margin-top:0">Погода (виджет на компьютере)</h2><label>Город</label><input id="cityin" placeholder="${CITY?esc(CITY.name):'Например: Москва'}"><div class="row"><button class="btn g" data-a="city">Найти город</button><button class="btn g" data-a="geo">По геопозиции</button></div><p class="n">Выбрано: ${CITY?esc(CITY.name):'—'}. Виджет — только на ПК.</p></div>
  <div class="card gl"><h2 style="margin-top:0">Звонки (сетка пар)</h2><p class="n">Для быстрого выбора времени.</p>${P.bells.map((b,i)=>`<div class="bl"><b>${i+1}</b><input type="time" data-s="bell" data-i="${i}" data-k="0" value="${b[0]}"><input type="time" data-s="bell" data-i="${i}" data-k="1" value="${b[1]}"><button class="ib" data-a="bd" data-i="${i}" aria-label="Удалить">${ic('trash')}</button></div>`).join('')}<button class="btn g" data-a="ba" style="margin-top:8px">${ic('plus')}Пара</button></div>
  <div class="card gl"><h2 style="margin-top:0">Семестр и каникулы</h2><p class="n">В каникулы напоминаний нет.</p><div class="row"><div><label>Начало семестра</label><input type="date" data-s="sem" data-i="0" value="${P.sem[0]}"></div><div><label>Конец семестра</label><input type="date" data-s="sem" data-i="1" value="${P.sem[1]}"></div></div>
  ${P.hol.map((x,i)=>`<div class="dh"><span>${esc(x.title)}: ${fmt(x.from)} — ${fmt(x.to)}</span><button class="ib" data-a="hd" data-i="${i}" aria-label="Удалить">${ic('trash')}</button></div>`).join('')}<button class="btn g" data-a="ha" style="margin-top:8px">${ic('plus')}Каникулы</button></div>
  <p class="n">Вы вошли как ${esc(me.email||'')}</p>`;
 }
 A.innerHTML=h;paintUser();$$('#app [aria-label]').forEach(e=>{if(!e.title)e.title=e.getAttribute('aria-label')});
}
