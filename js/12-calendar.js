/* Экспорт в календарь (.ics), ссылка для просмотра и публичная страница расписания */
const icsEsc=s=>String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
const icsFold=l=>{let o='';while(l.length>70){o+=l.slice(0,70)+'\r\n ';l=l.slice(70)}return o+l};
const icsDt=(d,t)=>ymd(d).replace(/-/g,'')+'T'+String(t).replace(':','')+'00';
function buildICS(){
 const start=P.sem[0]?pd(P.sem[0]):monday(new Date());
 const until=P.sem[1]?pd(P.sem[1]):new Date(start.getFullYear(),start.getMonth(),start.getDate()+7*18);
 const out=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Schedule//RU','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:'+icsEsc(P.name||'Расписание')];
 const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
 const alarm=()=>['BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEsc(P.nt),'TRIGGER:-PT'+P.remind+'M','END:VALARM'];
 const ev=(uid,d,st,en,l,room,extra)=>{
  const desc=[l.kind,l.teacher,l.notes].filter(Boolean).join(' · ');
  out.push('BEGIN:VEVENT','UID:'+uid+'@schedule','DTSTAMP:'+stamp,'DTSTART:'+icsDt(d,st),'DTEND:'+icsDt(d,en),'SUMMARY:'+icsEsc((l.el?'★ ':'')+l.subject));
  if(room)out.push('LOCATION:'+icsEsc(room));
  if(desc)out.push('DESCRIPTION:'+icsEsc(desc));
  if(extra)out.push(...extra);
  out.push(...alarm(),'END:VEVENT');
 };
 L.forEach(l=>{
  if(hiddenSat(l))return;
  const per=((l.el?P.elCyc:P.cyc)&&l.week!=='both');
  const d=new Date(start.getFullYear(),start.getMonth(),start.getDate());
  let guard=0;
  while(((d.getDay()+6)%7!==l.day||(per&&wkType(d)!==l.week))&&guard++<20)d.setDate(d.getDate()+1);
  if(d>until||guard>=20)return;
  const ex=[],rep=[];
  for(const x=new Date(d);x<=until;x.setDate(x.getDate()+(per?14:7))){
   const s=ymd(x),hol=P.hol.some(h=>s>=h.from&&s<=h.to),o=!l.el&&OV[l.id+s];
   if(hol||o)ex.push(icsDt(x,l.start));
   if(o&&o.kind==='replace'&&!hol)rep.push({x:new Date(x),o});
  }
  const rule='RRULE:FREQ=WEEKLY;INTERVAL='+(per?2:1)+';UNTIL='+ymd(until).replace(/-/g,'')+'T235959';
  ev(l.id,d,l.start,l.end,l,l.room,[rule,...(ex.length?['EXDATE:'+ex.join(',')]:[])]);
  rep.forEach(({x,o})=>ev(l.id+'-'+ymd(x),x,o.start_time?o.start_time.slice(0,5):l.start,o.end_time?o.end_time.slice(0,5):l.end,{...l,notes:o.note||l.notes},o.room??l.room,null));
 });
 out.push('END:VCALENDAR');
 return out.map(icsFold).join('\r\n')+'\r\n';
}
function exportICS(){
 const b=new Blob([buildICS()],{type:'text/calendar;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');
 a.href=u;a.download='schedule.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);
 toast('Файл расписания скачан. Откройте его, чтобы добавить в календарь');
}
const newToken=()=>{const a=new Uint8Array(24);crypto.getRandomValues(a);return btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')};
const shareUrl=()=>location.origin+location.pathname+'?s='+P.share;
async function shareToggle(on){
 const tk=on?newToken():null,r=await sb.from('profiles').upsert({id:me.id,share_token:tk});
 if(r.error)return toast(/column|schema/i.test(r.error.message)?'Выполните migration_v5.sql, чтобы включить доступ по ссылке':'Ошибка: '+r.error.message);
 P.share=tk||'';render();
}
async function copyShare(){
 try{await navigator.clipboard.writeText(shareUrl());toast('Ссылка скопирована')}
 catch(e){const i=$('#shu');if(i){i.select();document.execCommand&&document.execCommand('copy');toast('Ссылка скопирована')}}
}
async function loadShared(tok){
 const r=await sb.rpc('get_shared_schedule',{t:tok});
 if(r.error||!r.data){SH=null;return}
 const d=r.data,p=d.profile||{},date=p.anchor_week_start||ymd(monday(new Date())),de=document.documentElement.dataset;
 P={name:p.display_name||'',anchor:{wk:wk(pd(date)),type:p.anchor_week_type||'up',date},remind:10,bells:p.bells||BELLS,sem:[p.semester_start||'',p.semester_end||''],hol:p.holidays||[],nt:PRE[1],theme:de.th||'graphite',font:de.f||'system',cyc:p.schedule_cyclic!==false,satOff:!!p.saturday_off,elCyc:!!p.electives_cyclic,avatar:'',share:''};
 L=(d.lessons||[]).map(fromRow);OV={};(d.overrides||[]).forEach(x=>OV[x.lesson_id+x.on_date]=x);HW=[];SH=d;wsel=wkType(new Date());
}
function sharedHTML(){
 if(!SH)return`<div class="auth gl"><div class="lg">${langBtns()}</div><h1>Ссылка недействительна</h1><p class="n">Владелец мог отключить доступ или ссылка скопирована не полностью.</p></div>`;
 if(!['today','week','elv'].includes(view))view='today';
 const tabs=[['today','Сегодня'],['week','Расписание'],['elv','Факультативы']];
 return`<div class="top"><div><h1>Расписание: ${esc(P.name||'')}</h1><span class="n">Только просмотр</span></div><div class="lg">${langBtns()}</div></div><div class="sg gl" style="margin-bottom:12px">${tabs.map(([k,n])=>`<button class="btn ${view===k?'':'g'}" data-a="sv" data-v="${k}">${n}</button>`).join('')}</div>`+(view==='today'?todayHTML(true):view==='elv'?elvHTML(true):weekTop());
}
