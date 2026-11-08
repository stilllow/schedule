/* Настройки, константы, состояние, вспомогательные функции, даты, модель занятий */
// ===== Ключи Supabase берутся из файла config.js (лежит рядом с index.html) =====
const SUPABASE_URL=(window.CFG&&window.CFG.url)||'ВАШ_PROJECT_URL';
const SUPABASE_KEY=(window.CFG&&window.CFG.key)||'ВАШ_ПУБЛИЧНЫЙ_КЛЮЧ';
// =================================================================================
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const DAYS=['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],WN={up:'Над чертой',down:'Под чертой',both:'Каждая неделя'};
const KINDS=['Лекция','Практика','Лабораторная','Другое'],PAL=['#E07A47','#D4A72C','#8FA68F','#C47C8A','#2F6F6D','#59718A','#5B3A62','#6C151E'];
const PRE=['Привет, вот твоё расписание','Не забывай про пары','Скоро занятие','Пора собираться на пару'];
const BELLS=[['08:30','10:00'],['10:10','11:40'],['12:10','13:40'],['13:50','15:20'],['15:30','17:00'],['17:10','18:40']];
const THEMES=[['graphite','Графит','#253745'],['fog','Туман','#9BA8AB'],['bordo','Бордо','#6C151E'],['forest','Лес','#0F3D3A'],['cream','Крем','#F2E9D8'],['teal','Бирюза','#2F6F6D'],['terra','Терракота','#E07A47'],['plum','Слива','#5B3A62']];
const TPV={graphite:['#06141B','#4A5C6A'],fog:['#CCD0CF','#9BA8AB'],bordo:['#F5DABF','#6C151E'],forest:['#0a2927','#1d6b64'],cream:['#F2E9D8','#59718A'],teal:['#0b2a29','#8FA68F'],terra:['#F2E9D8','#E07A47'],plum:['#1d1022','#C47C8A']};
const FONTS=[['system','Системный','ru en'],['pressstart','Press Start 2P','ru en'],['lobster','Lobster','ru en'],['blackops','Black Ops One','en'],['bebas','Bebas Neue','en'],['sciencegothic','Science Gothic','ru en'],['dela','Dela Gothic One','ru en']];
const FF={pressstart:'PressStart',lobster:'Lobster',blackops:'BlackOps',bebas:'Bebas',sciencegothic:'ScienceGothic',dela:'Dela'};
let LANG=(()=>{try{const l=localStorage.getItem('lang');if(l==='ru'||l==='en')return l}catch(e){}return(navigator.language||'ru').toLowerCase().startsWith('ru')?'ru':'en'})();
let SC=(()=>{try{return Math.min(125,Math.max(75,Math.round((+localStorage.getItem('scale')||100)/5)*5))}catch(e){return 100}})();
const LOC=()=>LANG==='en'?'en-US':'ru-RU';
const fontOk=k=>(FONTS.find(f=>f[0]===k)||[0,0,''])[2].split(' ').includes(LANG);
const ic=n=>`<svg class="i"><use href="#i-${n}"/></svg>`,WD=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const wstrip=(b=cur)=>{const m=monday(b);return'<div class="wds gl">'+WD.map((n,i)=>{const d=new Date(m.getFullYear(),m.getMonth(),m.getDate()+i);return`<button class="wd ${ymd(d)===ymd(b)?'on':''}" data-a="day" data-d="${ymd(d)}">${n}</button>`}).join('')+'</div>'};
const TC={graphite:'#06141B',fog:'#CCD0CF',bordo:'#F5DABF',forest:'#0a2927',cream:'#F2E9D8',teal:'#0b2a29',terra:'#F2E9D8',plum:'#1d1022'};
let SHARED=false,SH=null,sb=null,me=null,P=null,L=[],HW=[],OV={},mode='in',view='today',wsel='up',cur=new Date(),gv='list',q='',err='',info='',cm=false,DOK=null;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tr=m=>/Invalid login/i.test(m)?'Неверная почта или пароль':/already registered/i.test(m)?'Эта почта уже зарегистрирована':/at least 6/i.test(m)?'Пароль слишком короткий (минимум 6 символов)':m;
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.display='none',5000)}
function notify(title,body){toast(T(title)+': '+T(body));try{if(window.Notification&&Notification.permission==='granted')new Notification(T(title),{body:T(body)})}catch(_){}}
const pad=n=>String(n).padStart(2,'0'),ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()),pd=s=>new Date(s+'T00:00:00');
const fmt=s=>pd(s).toLocaleDateString(LOC(),{day:'numeric',month:'long'});
const monday=d=>{const m=new Date(d);m.setDate(m.getDate()-((m.getDay()+6)%7));return m};
const hm=d=>pad(d.getHours())+':'+pad(d.getMinutes());
function wk(d){const day=(d.getDay()+6)%7;return Math.round((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5-day-4)/7)}
function wkType(d){const a=P.anchor,odd=Math.abs(wk(d)-a.wk)%2;return odd?(a.type==='up'?'down':'up'):a.type}
const hash=s=>[...String(s)].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
const col=l=>l.color||PAL[hash(l.subject)%8];
const lessonsFor=(day,t,el=false)=>day===5&&P&&P.satOff&&!el?[]:L.filter(l=>!!l.el===el&&l.day===day&&(!(el?P.elCyc:P.cyc)||l.week==='both'||l.week===t)).sort((a,b)=>a.start.localeCompare(b.start));
function lessonsOn(d,el=false){const day=(d.getDay()+6)%7;if(day>5)return[];const s=ymd(d);
 return lessonsFor(day,wkType(d),el).map(l=>{const o=OV[l.id+s];if(!o)return l;
  if(o.kind==='cancel')return{...l,cancel:1,o,note2:o.note};
  return{...l,repl:1,o,note2:o.note,start:o.start_time?o.start_time.slice(0,5):l.start,end:o.end_time?o.end_time.slice(0,5):l.end,room:o.room??l.room}}).sort((a,b)=>a.start.localeCompare(b.start))}
function dayInfo(d){const s=ymd(d),h=P.hol.find(h=>s>=h.from&&s<=h.to);if(h)return'Каникулы: '+h.title;if((P.sem[0]&&s<P.sem[0])||(P.sem[1]&&s>P.sem[1]))return'Вне семестра';return''}
const fromRow=r=>({id:r.id,subject:r.subject,day:r.day_of_week,week:r.week_type,start:String(r.start_time).slice(0,5),end:String(r.end_time).slice(0,5),room:r.room||'',teacher:r.teacher||'',notes:r.notes||'',kind:r.kind||'',color:r.color||'',el:!!r.elective});
const toRow=o=>({subject:o.subject,day_of_week:o.day,week_type:o.week,start_time:o.start,end_time:o.end,room:o.room||null,teacher:o.teacher||null,notes:o.notes||null,kind:o.kind||null,color:o.color||null,...(o.el?{elective:true}:{})});
