/* Умные подсказки: пересечения, «окна», сводка недели, напоминания о заданиях */
const toMin=s=>{const [h,m]=String(s).split(':').map(Number);return h*60+m};
const durTxt=m=>m>=60?Math.floor(m/60)+' ч'+(m%60?' '+m%60+' мин':''):m+' мин';
const effWeek=l=>(l.el?P.elCyc:P.cyc)?l.week:'both';
const hiddenSat=l=>!l.el&&l.day===5&&P.satOff;
function overlaps(a,b){
 return a.id!==b.id&&a.day===b.day&&!hiddenSat(a)&&!hiddenSat(b)&&a.start<b.end&&b.start<a.end&&
  (effWeek(a)==='both'||effWeek(b)==='both'||effWeek(a)===effWeek(b));
}
const conflictsFor=l=>L.filter(x=>overlaps(l,x));
function cfTag(l){
 if(SHARED||!P||l.cancel)return'';
 const cf=conflictsFor(l);
 return cf.length?`<span class="tag w">${ic('alert')}Пересечение: ${cf.map(x=>esc(x.subject)).join(', ')}</span>`:'';
}
function gapList(ts,nx,ro){
 let out='';
 ts.forEach((l,i)=>{
  if(i>0&&!ts[i-1].cancel&&!l.cancel){const g=toMin(l.start)-toMin(ts[i-1].end);if(g>=30)out+=`<div class="gap">${ic('clock')}Окно ${durTxt(g)}</div>`}
  out+=card(l,ro?'ro':'day',i===nx);
 });
 return out;
}
function weekSumHTML(){
 const m=monday(cur),free=[];let n=0,mins=0,bz=null;
 for(let i=0;i<6;i++){
  const d=new Date(m.getFullYear(),m.getMonth(),m.getDate()+i);
  if(dayInfo(d)||(i===5&&P.satOff))continue;
  const ls=lessonsOn(d).filter(l=>!l.cancel),mm=ls.reduce((a,l)=>a+toMin(l.end)-toMin(l.start),0);
  n+=ls.length;mins+=mm;if(mm&&(!bz||mm>bz.mm))bz={i,mm};if(!ls.length)free.push(WD[i]);
 }
 const a=ymd(m),b=ymd(new Date(m.getFullYear(),m.getMonth(),m.getDate()+6)),td=ymd(new Date());
 const hw=HW.filter(h=>!h.done&&h.due_date>=a&&h.due_date<=b).sort((x,y)=>x.due_date.localeCompare(y.due_date));
 if(!n&&!hw.length)return'';
 const hrs=(mins/60).toFixed(1).replace(/\.0$/,'');
 return`<div class="card gl sum"><h2 style="margin-top:0">Сводка недели</h2><div class="chips"><span class="chip"><b>${n}</b> занятий</span><span class="chip"><b>${hrs}</b> ч</span>${bz?`<span class="chip">Самый загруженный: <b>${DAYS[bz.i]}</b></span>`:''}${free.length?`<span class="chip">Свободные дни: <b>${free.join(', ')}</b></span>`:''}</div>${hw.length?`<div class="chips">${hw.map(h=>`<span class="chip${h.due_date<td?' w':''}">${ic('check')}<b>${esc(h.title)}</b> · ${fmt(h.due_date)}</span>`).join('')}</div>`:''}</div>`;
}
const hwrOn=()=>{try{return localStorage.getItem('hwr')!=='0'}catch(e){return true}};
function hwRemind(n){
 if(!hwrOn()||n.getHours()<8)return;
 const td=ymd(n),tm=ymd(new Date(n.getFullYear(),n.getMonth(),n.getDate()+1));
 HW.filter(h=>!h.done&&(h.due_date===td||h.due_date===tm)).forEach(h=>{
  const k='hw'+h.id+td;
  if(!fired.has(k)){fired.add(k);notify('Срок задания',h.title+' — '+(h.due_date===td?'сегодня':'завтра'))}
 });
}
