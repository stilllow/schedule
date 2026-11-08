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
 return R;
})()
