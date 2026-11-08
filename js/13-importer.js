/* Импорт расписания: текст, CSV, Excel, PDF и фото (распознавание на устройстве) */
const p2=n=>String(n).padStart(2,'0');
const WKRE=/^(понедельник|вторник|сред[ауы]|четверг|пятниц[ауы]|суббот[ауы]|пн|вт|ср|чт|пт|сб)(?![а-яёА-ЯЁ])[\s.:,)\-–—]*(.*)$/i;
const TIMERE=/(\d{1,2})[:.](\d{2})\s*[-–—−]\s*(\d{1,2})[:.](\d{2})/;
const ROOMRE=/(?:ауд(?:итория|\.)?|каб(?:инет|\.)?|комн(?:ата|\.)?)\s*\.?\s*([A-Za-zА-Яа-я]{0,2}-?\d[\w\-./]*)/i;
const TEACHRE=/[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?\s+[А-ЯЁ]\.\s?[А-ЯЁ]\./;
const KINDRE=/(?<![А-Яа-яЁё])(лекц(?:ия|\.)?|лек\.|практик[аи]|практическ(?:ое|ая)(?:\s+занятие)?|пр\.|лабораторн(?:ая|ое)(?:\s+работа)?|лаб\.?|семинар)(?![А-Яа-яЁё])/i;
const WEEKLINE=/^(?:над\s*чертой|под\s*чертой|числитель|знаменатель)[\s:.]*$/i;
const weekOf=s=>/над\s*чертой|числител|верхн/i.test(s)?'up':/под\s*чертой|знаменател|нижн/i.test(s)?'down':'';
function dayIdx(w){
 w=w.toLowerCase();
 return w.startsWith('пон')||w==='пн'?0:w.startsWith('вто')||w==='вт'?1:w.startsWith('сре')||w==='ср'?2:w.startsWith('чет')||w==='чт'?3:w.startsWith('пят')||w==='пт'?4:5;
}
const kindName=k=>/лек/i.test(k)?'Лекция':/лаб/i.test(k)?'Лабораторная':'Практика';
function fillLesson(c,s,cont){
 s=' '+s+' ';let m;
 if((m=s.match(TEACHRE))){if(!c.teacher)c.teacher=m[0];s=s.replace(m[0],' ')}
 if((m=s.match(ROOMRE))){if(!c.room)c.room=m[1];s=s.replace(m[0],' ')}
 if((m=s.match(KINDRE))){if(!c.kind)c.kind=kindName(m[1]);s=s.replace(m[0],' ')}
 s=s.replace(/(над\s*чертой|под\s*чертой|числитель|знаменатель)/ig,' ')
  .replace(/^\s*\d+\s*(?:пара|п\.)?[.)]\s+|^\s*\d+\s*пара\s+/i,' ')
  .replace(/[(),;]+/g,' ').replace(/\s+/g,' ').replace(/^[\s\-–—.:]+|[\s\-–—.:]+$/g,'');
 if(!c.room&&!cont){m=s.match(/(?:^|\s)([A-Za-zА-Яа-я]{0,2}-?\d{2,4}[А-Яа-яA-Za-z]?)$/);if(m){c.room=m[1];s=s.slice(0,m.index).trim()}}
 if(s){if(!c.subject)c.subject=s;else if(!cont)c.subject+=' '+s}
}
function parseSchedule(text){
 const bells=(typeof P!=='undefined'&&P&&P.bells)||BELLS;
 const lines=String(text).replace(/\r/g,'').split('\n').map(x=>x.replace(/[\t;|]+/g,' ').replace(/\s+/g,' ').trim()).filter(Boolean);
 const out=[];let day=-1,week='both',cur=null;
 for(let line of lines){
  const md=line.match(WKRE);
  if(md){day=dayIdx(md[1]);week=weekOf(md[2])||'both';cur=null;line=md[2].trim();if(!TIMERE.test(line)&&!/^[1-8]\s*(?:пара|[.)])\s+/i.test(line))continue}
  else if(WEEKLINE.test(line)){week=weekOf(line);cur=null;continue}
  const wm=weekOf(line);
  let tm=line.match(TIMERE),pm=null;
  if(tm&&(+tm[1]>23||+tm[3]>23||+tm[2]>59||+tm[4]>59))tm=null;
  if(!tm&&day>=0)pm=line.match(/^([1-8])\s*(?:пара|[.)])\s+(.+)$/i);
  if(!tm&&!pm){if(cur)fillLesson(cur,line,true);continue}
  let st,en,rest;
  if(tm){st=p2(tm[1])+':'+tm[2];en=p2(tm[3])+':'+tm[4];rest=line.slice(0,tm.index)+' '+line.slice(tm.index+tm[0].length)}
  else{const b=bells[+pm[1]-1];if(!b)continue;st=b[0];en=b[1];rest=pm[2]}
  cur={day:day<0?0:day,unk:day<0,start:st,end:en,week:wm||week,subject:'',room:'',teacher:'',kind:''};
  fillLesson(cur,rest,false);out.push(cur);
 }
 return out;
}
const loadScript=src=>new Promise((res,rej)=>{
 if(document.querySelector('script[src="'+src+'"]'))return res();
 const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('load '+src));document.head.appendChild(s);
});
async function fileText(f,st){
 const n=f.name.toLowerCase(),t=f.type||'';
 if(/\.(txt|csv)$/.test(n)||t.startsWith('text/'))return await f.text();
 if(/\.xlsx?$/.test(n)){
  await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
  const wb=XLSX.read(await f.arrayBuffer()),ws=wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws,{header:1,raw:false}).map(r=>r.join(' ')).join('\n');
 }
 if(/\.pdf$/.test(n)||t==='application/pdf'){
  await loadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js');
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;let out='';
  for(let p=1;p<=pdf.numPages;p++){
   const c=await(await pdf.getPage(p)).getTextContent(),rows={};
   c.items.forEach(i=>{const y=Math.round(i.transform[5]/3);(rows[y]=rows[y]||[]).push([i.transform[4],i.str])});
   out+=Object.keys(rows).map(Number).sort((a,b)=>b-a).map(y=>rows[y].sort((a,b)=>a[0]-b[0]).map(x=>x[1]).join(' ')).join('\n')+'\n';
  }
  return out;
 }
 if(t.startsWith('image/')||/\.(png|jpe?g|webp|heic)$/.test(n)){
  await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js');
  const r=await Tesseract.recognize(f,'rus+eng',{logger:m=>{if(m.status&&st)st(m.status+' '+Math.round((m.progress||0)*100)+'%')}});
  return r.data.text;
 }
 throw new Error('unsupported');
}
let impEl=false;
function openImport(el){
 impEl=!!el;
 dlg('Импорт расписания',
  fld('Куда добавить',`<select name="g"><option value="main" ${!el?'selected':''}>Основное расписание</option><option value="el" ${el?'selected':''}>Факультативы</option></select>`)+
  fld('Вставьте текст расписания',`<textarea name="t" id="impt" rows="7" placeholder="Например: Пн 08:30-10:00 Математика ауд. 214"></textarea>`)+
  `<label>или загрузите файл</label><input type="file" id="impf" accept="image/*,.pdf,.xlsx,.xls,.csv,.txt"><p class="n" id="impst">Фото, PDF, Excel, CSV или текст. Распознавание не идеально, поэтому на следующем шаге всё можно проверить и поправить.</p>`,
  async v=>{
   impEl=v.get('g')==='el';
   const rows=parseSchedule(v.get('t')||'');
   if(!rows.length){toast('Ничего не найдено. Проверьте текст: нужны дни недели и время вида 08:30-10:00.');return false}
   impPreview(rows);return false;
  },'Распознать');
}
function impPreview(rows){
 const cy=impEl?P.elCyc:P.cyc;
 $('#dt').textContent='Проверьте занятия';
 $('#df').innerHTML=`<p class="n">Найдено занятий: ${rows.length}. Проверьте и исправьте.</p>`+rows.map((r,i)=>`<div class="sess"><label class="ck3"><input type="checkbox" name="on_${i}" checked>Включить</label>${r.unk?`<span class="tag w">${ic('alert')}День не определён</span>`:''}${fld('День',`<select name="d_${i}">${DAYS.map((n,k)=>`<option value="${k}" ${r.day===k?'selected':''}>${n}</option>`).join('')}</select>`)}<div class="row t2">${fld('Начало',`<input type="time" name="a_${i}" value="${r.start}">`)}${fld('Конец',`<input type="time" name="b_${i}" value="${r.end}">`)}</div>${fld('Предмет',`<input name="s_${i}" maxlength="80" value="${esc(r.subject)}">`)}<div class="row">${fld('Аудитория',`<input name="r_${i}" maxlength="30" value="${esc(r.room)}">`)}${fld('Преподаватель',`<input name="t_${i}" maxlength="80" value="${esc(r.teacher)}">`)}</div>${cy?fld('Неделя',`<select name="w_${i}">${['both','up','down'].map(k=>`<option value="${k}" ${r.week===k?'selected':''}>${WN[k]}</option>`).join('')}</select>`):''}</div>`).join('')+'<div class="row"><button type="button" class="btn g" id="cx">Отмена</button><button class="btn">Импортировать</button></div>';
 $('#cx').onclick=()=>$('#dlg').close();
 DOK=async v=>{
  const out=[];
  rows.forEach((r,i)=>{if(!v.get('on_'+i))return;out.push({subject:(v.get('s_'+i)||'').trim(),day:+v.get('d_'+i),week:cy?(v.get('w_'+i)||'both'):'both',start:v.get('a_'+i),end:v.get('b_'+i),room:(v.get('r_'+i)||'').trim(),teacher:(v.get('t_'+i)||'').trim(),kind:r.kind||'',color:'',notes:'',el:impEl})});
  if(!out.length){toast('Выберите хотя бы одно занятие');return false}
  if(out.some(o=>!o.subject||!o.start||!o.end||o.end<=o.start)){toast('Проверьте поля: нужны название и время (конец позже начала)');return false}
  const r=await sb.from('lessons').insert(out.map(toRow)).select();
  if(r.error){toast('Ошибка: '+r.error.message);return false}
  L=[...L,...r.data.map(fromRow)];toast('Импортировано: '+r.data.length);render();return true;
 };
}
document.addEventListener('change',async e=>{
 if(e.target.id!=='impf')return;
 const f=e.target.files[0],st=$('#impst'),set=m=>{if(st)st.textContent=m};
 if(!f)return;
 set('Распознаю…');
 try{const t=await fileText(f,set),box=$('#impt');box.value=(box.value?box.value+'\n':'')+t;set('Готово. Проверьте текст и нажмите «Распознать».')}
 catch(err){set('Не удалось прочитать файл')}
});
