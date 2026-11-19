(function(){
 const R=[],ok=(n,c,d)=>R.push({n,ok:!!c,d:d||''});
 const A=document.querySelector('#app');
 sb={};me={email:'a@b.c',id:'1'};
 const base=()=>({name:'Д',anchor:{wk:wk(new Date()),type:'up',date:ymd(monday(new Date()))},remind:10,bells:BELLS,sem:['',''],hol:[],nt:PRE[1],theme:'graphite',font:'system',cyc:true,satOff:false,avatar:'',elCyc:false,share:''});
 const mk=(id,o)=>Object.assign({id,subject:'Предмет'+id,day:2,week:'both',start:'08:30',end:'10:00',room:'1',teacher:'',notes:'',kind:'',color:'',el:false},o);
 const reset=()=>{L=[mk('1',{}),mk('2',{subject:'Кружок',el:true,day:1,start:'16:00',end:'17:30'}),mk('3',{subject:'Йога',el:true,day:3,start:'18:00',end:'19:00',week:'up'}),mk('4',{day:2,start:'09:00',end:'11:00'}),mk('5',{day:2,start:'12:00',end:'13:00'})];HW=[{id:'h',title:'Реферат',due_date:ymd(new Date()),done:false,lesson_id:'1'}];OV={}};
 reset();
 // экраны во всех режимах и языках
 const states={cyc:{},static:{cyc:false},satoff:{satOff:true},elcyc:{elCyc:true},share:{share:'tok'},avatar:{avatar:'data:image/jpeg;base64,AAAA'}};
 for(const lang of ['ru','en']){
  LANG=lang;
  for(const [sn,o] of Object.entries(states)){
   P=Object.assign(base(),o);
   for(const v of ['today','week','hw','acc','set','elv','ele']){
    view=v;A.innerHTML='';
    try{render();ok(`экран ${lang}/${sn}/${v}`,A.innerHTML.length>200)}catch(e){ok(`экран ${lang}/${sn}/${v}`,false,e.message)}
   }
  }
 }
 LANG='ru';P=base();
 ok('LOC() не зацикливается',LOC()==='ru-RU');
 ok('шрифт без кириллицы недоступен в RU',!fontOk('bebas')&&fontOk('lobster'));
 // факультативы отделены от основного расписания
 view='week';render();ok('факультатив не виден в основном расписании',!A.innerHTML.includes('Кружок'));
 view='elv';render();ok('факультатив виден в своём экране',A.innerHTML.includes('Кружок')&&A.innerHTML.includes('Ближайший факультатив'));
 view='ele';render();ok('есть кнопка «Добавить факультатив»',A.innerHTML.includes('data-a="eladd"'));
 view='week';render();ok('кнопка «Добавить» лежит внутри блока дня',(A.innerHTML.match(/class="addrow"/g)||[]).length===6&&A.innerHTML.includes('class="card gl dayc"'));
 P.satOff=true;render();ok('в выходную субботу кнопки «Добавить» нет',(A.innerHTML.match(/class="addrow"/g)||[]).length===5);P.satOff=false;
 view='week';render();ok('расписание: плитки 2×3, без переключателя вида',A.innerHTML.includes('class="wgrid"')&&!A.innerHTML.includes('data-a="gv"'));
 view='set';render();ok('настройки: темы и шрифты в плитках',A.innerHTML.includes('class="tiles"')&&A.innerHTML.includes('data-a="th"')&&!A.innerHTML.includes('class="btn g" data-a="th"'));
 ok('по умолчанию у факультативов нет цикличности',lessonsFor(3,'down',true).length===1&&lessonsFor(3,'up',true).length===1);
 P.elCyc=true;ok('при включённой цикличности фильтр по неделе работает',lessonsFor(3,'down',true).length===0&&lessonsFor(3,'up',true).length===1);P.elCyc=false;
 // выходная суббота касается только основного расписания
 L.push(mk('6',{day:5}),mk('7',{day:5,el:true,subject:'Бассейн'}));P.satOff=true;
 ok('суббота скрыта в основном',lessonsFor(5,'up',false).length===0);
 ok('суббота не скрывает факультативы',lessonsFor(5,'up',true).length===1);P.satOff=false;
 // пересечения, окна, сводка
 reset();
 ok('пересечение найдено',conflictsFor(L[0]).some(x=>x.id==='4')&&!conflictsFor(L[0]).some(x=>x.id==='5'));
 ok('метка пересечения на карточке',cfTag(L[0]).includes('Пересечение'));
 let d=new Date();while((d.getDay()+6)%7!==2)d.setDate(d.getDate()+1);cur=d;view='today';render();
 ok('окно между занятиями показано',A.innerHTML.includes('Окно'));
 ok('сводка недели показана',A.innerHTML.includes('Сводка недели'));
 ok('факультативы не попадают в основной список дня',!A.innerHTML.includes('Бассейн'));
 // разбор текста для импорта
 const rows=parseSchedule('Понедельник\n1. 08:30-10:00 Математика (лекция), ауд. 214, Иванов И.И.\nВторник (над чертой)\n12:10-13:40 Английский язык 101\nСреда\n13:50 - 15:20\nИстория России\nауд. А-12');
 ok('импорт: найдено 3 занятия',rows.length===3,JSON.stringify(rows));
 ok('импорт: поля первого занятия',rows[0]&&rows[0].subject==='Математика'&&rows[0].room==='214'&&rows[0].teacher==='Иванов И.И.'&&rows[0].kind==='Лекция'&&rows[0].day===0);
 ok('импорт: неделя и аудитория',rows[1]&&rows[1].week==='up'&&rows[1].room==='101'&&rows[1].subject==='Английский язык');
 ok('импорт: строки-продолжения',rows[2]&&rows[2].subject==='История России'&&rows[2].room==='А-12');
 // экспорт в календарь
 reset();P=base();P.hol=[{title:'Каникулы',from:ymd(new Date()),to:ymd(new Date(Date.now()+86400000*30))}];
 const ics=buildICS(),lines=ics.split('\r\n');
 ok('ics: структура',ics.startsWith('BEGIN:VCALENDAR')&&ics.includes('BEGIN:VEVENT')&&ics.includes('RRULE:FREQ=WEEKLY')&&ics.includes('END:VCALENDAR'));
 ok('ics: каникулы исключены (EXDATE)',ics.includes('EXDATE:'));
 ok('ics: строки не длиннее 72 символов',lines.every(l=>l.length<=72));
 P.cyc=true;L=[mk('9',{week:'up'})];ok('ics: цикличное занятие идёт через неделю',buildICS().includes('INTERVAL=2'));
 // переводы
 LANG='en';
 ok('перевод: простая фраза',T('Занятий нет')==='No classes');
 ok('перевод: окно',T('Окно 1 ч 20 мин')==='Break 1 h 20 min');
 ok('перевод: пересечение',T('Пересечение: Физика')==='Overlap: Physics'.replace('Physics','Физика'));
 ok('перевод: аудитория в списке',T('Лекция · Иванов · ауд. 214')==='Lecture · Иванов · Room 214');
 ok('перевод: дни недели',T('Пн, Ср')==='Mon, Wed');
 LANG='ru';
 // публичная страница
 reset();P=base();SHARED=true;SH={x:1};view='today';render();
 ok('публичная страница: просмотр',A.innerHTML.includes('Только просмотр')&&!A.innerHTML.includes('Начало работы'));
 SH=null;render();ok('публичная страница: недействительная ссылка',A.innerHTML.includes('Ссылка недействительна'));
 SHARED=false;SH=null;
 ok('экран настройки: форма ключей и проверка',setupHTML().includes('data-a="cfgsave"')&&setupHTML().includes('Проверка:'));
 ok('заглушки из config.js не считаются ключами',_cf.url===''&&_cf.key==='');
 ok('версия сайта определена',typeof APP_VERSION==='string'&&APP_VERSION.length>0);
 {const keepP=P,keepV=view;P={};view='set';render();ok('ошибка экрана показывается, а не прячется',A.innerHTML.includes('Ошибка'));P=keepP;view=keepV}

 // --- учёба, друзья, профиль, виджеты ---
 {
  const keepV=view,keepP=P;P=base();LANG='ru';
  ok('mdLite: HTML экранируется',!mdLite('<script>alert(1)</script> **b**').includes('<script')&&mdLite('**b**').includes('<b>b</b>'));
  ok('mdLite: ссылки безопасны',mdLite('https://e.com/a?b=1&c="x"').includes('rel="noopener noreferrer"')&&!mdLite('https://e.com/a?b=1&c="x"').includes('c="x"'));
  ok('чек-листы: подсчёт',taskStats('- [x] a\n- [ ] b\ntext').total===2&&taskStats('- [x] a\n- [ ] b').done===1);
  ok('чек-листы: переключение',toggleTask('- [ ] a\n- [x] b',0)==='- [x] a\n- [x] b'&&toggleTask('- [ ] a\n- [x] b',1)==='- [ ] a\n- [ ] b');
  const n0={reps:0,interval:0,ease:2.5,lapses:0};
  ok('повторение: первая оценка «хорошо» = 2 дня',nextSchedule(n0,2,new Date(0)).interval===2);
  ok('повторение: «снова» возвращает через 10 минут',(x=>x.interval===0&&x.lapses===1&&x.due===new Date(600000).toISOString())(nextSchedule(n0,0,new Date(0))));
  ok('повторение: интервал растёт, лёгкость ограничена',nextSchedule({reps:2,interval:10,ease:3,lapses:0},3,new Date(0)).interval===39&&nextSchedule({reps:2,interval:10,ease:3,lapses:0},3,new Date(0)).ease===3&&nextSchedule({reps:2,interval:10,ease:1.3,lapses:0},1,new Date(0)).ease===1.3);
  ok('карточки списком: разбор строк',parseCards('a — b\nc;d\nplain\ne\tf\n - \n').length===3);
  ok('ник: нормализация и формат',normNick('@Foo-Bar!')==='foobar'&&NICK.test('ab_9')&&!NICK.test('ab')&&!NICK.test('Abc'));
  ok('«был(а) в сети»',agoTxt('')==='был(а) давно'&&agoTxt(new Date(Date.now()-5*60000).toISOString())==='был(а) 5 мин назад');
  ok('картинки: только безопасные адреса',safeImg('javascript:alert(1)')===''&&safeImg('data:image/jpeg;base64,AAAA')!=='');
  NOTES=[{id:'1',title:'Б',body:'икс',subject:'Физика',tags:['а'],color:'',pinned:false,archived:false,remind:'',created:'2026-01-01',updated:'2026-01-02'},{id:'2',title:'А',body:'- [ ] t',subject:'',tags:[],color:'',pinned:true,archived:false,remind:'',created:'2026-01-03',updated:'2026-01-03'},{id:'3',title:'В',body:'',subject:'',tags:[],color:'',pinned:false,archived:true,remind:'',created:'',updated:''}];
  notesLoaded=true;nf={q:'',scope:'all',subj:'',tag:'',sort:'upd'};
  ok('заметки: закреплённые первыми, архив отдельно',notesFiltered().map(n=>n.id).join()==='2,1');
  nf.scope='arch';ok('заметки: архив',notesFiltered().map(n=>n.id).join()==='3');
  nf={q:'икс',scope:'all',subj:'',tag:'',sort:'upd'};ok('заметки: поиск',notesFiltered().map(n=>n.id).join()==='1');
  nf={q:'',scope:'all',subj:'',tag:'',sort:'upd'};
  view='notes';render();ok('экран: заметки',A.innerHTML.includes('class="ngrid"')&&A.innerHTML.includes('data-a="nnew"'));
  ne={id:'1',title:'Б',body:'# T\n- [ ] a',subject:'',tags:[],color:'',pinned:false,archived:false,remind:'',created:'',updated:'',preview:false,dirty:false,st:''};
  view='note';render();ok('экран: редактор заметки',A.innerHTML.includes('id="nb"')&&A.innerHTML.includes('data-a="nfmt"'));
  ne.preview=true;render();ok('экран: просмотр заметки с чек-листом',A.innerHTML.includes('data-a="nchk"'));
  ne=null;
  DECKS=[{id:'d1',title:'Физика',desc:'',color:''}];
  CARDS=[{id:'c1',deck:'d1',front:'Q',back:'A',due:new Date(0).toISOString(),interval:0,ease:2.5,reps:0,lapses:0,last:''},{id:'c2',deck:'d1',front:'Q2',back:'A2',due:new Date(Date.now()+864e5*5).toISOString(),interval:5,ease:2.5,reps:3,lapses:0,last:'2026-01-01'}];
  cardsLoaded=true;
  ok('карточки: состояния',cardState(CARDS[0])==='new'&&cardState(CARDS[1])==='later'&&deckStats(DECKS[0]).total===2);
  view='cards';render();ok('экран: колоды',A.innerHTML.includes('class="dgrid"'));
  deckId='d1';view='deck';render();ok('экран: колода с карточками',A.innerHTML.includes('data-a="cadd"')&&A.innerHTML.includes('class="card gl l crow"'));
  STUDY={queue:['c1'],i:0,show:false,ids:['d1'],mode:'due',stat:[0,0,0,0],rev:false};view='study';render();
  ok('экран: обучение, вопрос',A.innerHTML.includes('data-a="sflip"')&&!A.innerHTML.includes('data-a="srate"'));
  STUDY.show=true;render();ok('экран: обучение, оценки',(A.innerHTML.match(/data-a="srate"/g)||[]).length===4);
  STUDY.i=1;render();ok('экран: итог сессии',A.innerHTML.includes('data-a="sagain"'));STUDY=null;
  FR=[{fid:'f1',status:'accepted',dir:'friend',uid:'u2',username:'bob',name:'Боб',thumb:'',uni:'МГУ',online:true,seen:''},{fid:'f2',status:'pending',dir:'in',uid:'u3',username:'ann',name:'',thumb:'',uni:'',online:false,seen:''}];
  view='friends';render();ok('экран: друзья, «в сети», запросы',A.innerHTML.includes('в сети')&&A.innerHTML.includes('data-a="facc"')&&A.innerHTML.includes('id="fq"'));
  PROF={id:'u9',username:'abc',display_name:'Имя',bio:'x<script>',relation:'none',online:true};
  view='profile';render();ok('экран: профиль безопасен',A.innerHTML.includes('data-a="fadd"')&&!A.innerHTML.includes('<script>'));
  PROF=null;
  view='acc';render();ok('аккаунт: редактирование профиля',A.innerHTML.includes('id="pu"')&&A.innerHTML.includes('data-a="profsave"'));
  ok('меню: профиль подсвечивает «Друзья»',navKey('profile')==='friends'&&navKey('note')==='notes'&&navKey('study')==='cards');
  WG=Object.keys(WT).map(k=>({id:k,type:k,size:1,cfg:{text:'x',title:'t',date:'2027-01-01'}}));wgEdit=false;
  view='today';render();ok('«Сегодня»: виджеты не в основной колонке',!A.innerHTML.includes('class="wgsec"'));
  railPaint(true);{const RW=$('#rw').innerHTML;ok('правая колонка: все виджеты строятся',RW.includes('class="wgsec"')&&(RW.match(/class="card gl wg /g)||[]).length===Object.keys(WT).length&&RW.includes('data-p="pk"')&&RW.includes('class="tod"'))}
  {const k=(h,m)=>todState(new Date(2026,0,1,h,m)).k;ok('время суток: ночь, рассвет, день',k(2,0)==='night'&&k(6,30)==='dawn'&&k(13,0)==='day'&&k(23,0)==='night');const s=todState(new Date(2026,0,1,12,0));ok('время суток: солнце днём, луна ночью',s.sun&&s.p>0.4&&s.p<0.6&&!todState(new Date(2026,0,1,1,0)).sun)}
  {const o=CLK;CLK='analog';const sv=clockSVG();ok('механические часы: стрелки и засечки',sv.includes('class="hh"')&&sv.includes('class="mh"')&&sv.includes('class="sh"')&&(sv.match(/class="tn"/g)||[]).length===48);ok('виджет часов: механический вариант',wgItem({id:'c',type:'clock',size:1,cfg:{}},0,1).includes('class="ack"'));CLK=o}
  {const o=TODM;TODM=true;ok('«Время суток» совмещается с часами',wgItem({id:'t',type:'tod',size:2,cfg:{}},0,1)==='');TODM=o}
  wgEdit=true;railPaint(true);{const RW=$('#rw').innerHTML;ok('«Сегодня»: режим правки виджетов',RW.includes('data-a="wgadd"')&&RW.includes('data-a="wgdel"'))}wgEdit=false;WG=null;
  LANG='en';
  ok('перевод: учёба и друзья',T('Нажмите, чтобы показать ответ')==='Tap to show the answer'&&T('через 3 д')==='in 3 d'&&T('был(а) 5 мин назад')==='seen 5 min ago'&&T('Добавить @bob в друзья?')==='Add @bob as a friend?'&&T('12 слов · 80 симв.')==='12 words · 80 chars');
  LANG='ru';view=keepV;P=keepP;
 }
 return R;
})()
