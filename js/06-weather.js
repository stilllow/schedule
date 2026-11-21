/* Виджет времени и погоды (ПК) */
let CITY=null,WX=null;try{CITY=JSON.parse(localStorage.getItem('city')||'null')}catch(e){}
const WCODE=c=>c===0?['sun','Ясно']:c<=2?['partly','Малооблачно']:c===3?['cloud','Облачно']:c<=48?['fog','Туман']:c<=67?['rain','Дождь']:c<=77?['snow','Снег']:c<=82?['rain','Ливень']:c<=86?['snow','Снегопад']:['storm','Гроза'];
async function loadWx(){
 if(!CITY)return renderWx();
 try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${CITY.lat}&longitude=${CITY.lon}&current=temperature_2m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`),j=await r.json();
  WX={t:Math.round(j.current.temperature_2m),f:Math.round(j.current.apparent_temperature),c:j.current.weather_code,max:Math.round(j.daily.temperature_2m_max[0]),min:Math.round(j.daily.temperature_2m_min[0])}}catch(e){WX=null}
 renderWx();
}
/* Стиль часов: цифровые или механические; «Время суток» может быть частью карточки часов */
let CLK='digital',TODM=false;try{CLK=localStorage.getItem('clk')==='analog'?'analog':'digital';TODM=localStorage.getItem('todm')==='1'}catch(e){}
const ACK=(()=>{let t='';for(let i=0;i<60;i++){const a=i*Math.PI/30,m=i%5===0,r1=m?39:44,r2=47.5,x=Math.sin(a),y=-Math.cos(a);t+=`<line x1="${(50+r1*x).toFixed(2)}" y1="${(50+r1*y).toFixed(2)}" x2="${(50+r2*x).toFixed(2)}" y2="${(50+r2*y).toFixed(2)}" class="${m?'tm':'tn'}"/>`}return t})();
const clkAng=d=>{const s=d.getSeconds()+d.getMilliseconds()/1000,m=d.getMinutes()+s/60;return{s:s*6,m:m*6,h:((d.getHours()%12)+m/60)*30}};
const clockSVG=()=>{const a=clkAng(new Date());return`<svg class="ack" viewBox="0 0 100 100" role="img" aria-label="Часы"><circle class="cf" cx="50" cy="50" r="49"/>${ACK}<g class="hh" transform="rotate(${a.h.toFixed(1)} 50 50)"><line x1="50" y1="55" x2="50" y2="28"/></g><g class="mh" transform="rotate(${a.m.toFixed(1)} 50 50)"><line x1="50" y1="56" x2="50" y2="14"/></g><g class="sh" transform="rotate(${a.s.toFixed(1)} 50 50)"><line x1="50" y1="60" x2="50" y2="9"/></g><circle class="cd0" cx="50" cy="50" r="2.2"/></svg>`};
/* стрелки двигаются отдельно от перерисовки блоков: меняется только атрибут transform */
function clkTick(){
 const c=document.querySelectorAll('.ack');
 if(c.length){const a=clkAng(new Date()),set=(e,k,v)=>{const g=e.querySelector('.'+k);if(g)g.setAttribute('transform','rotate('+v.toFixed(2)+' 50 50)')};c.forEach(e=>{set(e,'hh',a.h);set(e,'mh',a.m);set(e,'sh',a.s)});requestAnimationFrame(clkTick)}
 else setTimeout(()=>requestAnimationFrame(clkTick),1000);
}
if(typeof requestAnimationFrame==='function')requestAnimationFrame(clkTick);

/* Время суток: ночь, рассвет, день; фон плавно перетекает, по дуге идёт солнце или луна */
const smt=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
function todState(d){
 const h=d.getHours()+d.getMinutes()/60;
 const dawn=smt(4,5.2,h)*(1-smt(8,9.5,h)),day=smt(8,9.5,h)*(1-smt(18,19.5,h)),night=Math.max(0,1-dawn-day);
 const k=night>=dawn&&night>=day?'night':dawn>=day?'dawn':'day';
 const sun=h>=5.5&&h<19,p=sun?(h-5.5)/13.5:((h>=19?h-19:h+5)/10.5);
 return{k,w:{night,dawn,day},sun,p};
}
const TODN={night:['Ночь','Время отдыхать'],dawn:['Рассвет','Новый день начинается'],day:['День','Время действовать']};
function todHTML(o={}){const showT=o.temp!==false,showS=o.sub!==false;
 const s=todState(new Date()),x=50-42*Math.cos(Math.PI*s.p),y=36-28*Math.sin(Math.PI*s.p),n=TODN[s.k];
 const body=s.sun?`<circle class="sun" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.4"/>`:`<path class="moon" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(.5) translate(-12 -12)" d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>`;
 return`<div class="tod" data-k="${s.k}"><i class="tb b0" style="opacity:${s.w.night.toFixed(2)}"></i><i class="tb b1" style="opacity:${s.w.dawn.toFixed(2)}"></i><i class="tb b2" style="opacity:${s.w.day.toFixed(2)}"></i><div class="tx"><b>${n[0]}</b>${showS?`<span>${n[1]}</span>`:''}</div>${WX&&showT?`<div class="tt">${WX.t}°</div>`:''}<svg class="tarc" viewBox="0 0 100 40" aria-hidden="true"><path class="ap" d="M8 36A42 28 0 0 1 92 36"/>${body}</svg></div>`;
}

function renderWx(){
 const e=$('#wx');if(!e)return;const n=new Date(),w=WX?WCODE(WX.c):null;
 e.classList.toggle('merged',TODM);
 e.innerHTML=`<div class="wxh"><span>${esc(n.toLocaleDateString(LOC(),{weekday:'long',day:'numeric',month:'long'}))}</span><span>${CITY?esc(CITY.name):''}</span></div>
 <div class="wxm">${CLK==='analog'?`<div class="wxa">${clockSVG()}</div>`:`<div class="wxt">${hm(n)}</div>`}${WX?`<div class="wxw">${ic(w[0])}<b>${WX.t}°</b></div>`:''}</div>
 ${WX?`<div class="wxs"><span>${w[1]}, ощущается ${WX.f}°</span><span class="pl">${ic('up')}${WX.max}°</span><span class="pl">${ic('down')}${WX.min}°</span></div>`:`<div class="wxs"><span>${CITY?'Погода недоступна':'Город не выбран'}</span><button class="btn g" data-a="goset">Настроить</button></div>`}
 ${TODM?todHTML({temp:false}):''}
 ${wstrip(n)}`;
}
async function setClockPref(col,val){
 try{localStorage.setItem(col==='clock_style'?'clk':'todm',col==='clock_style'?val:(val?'1':'0'))}catch(e){}
 if(me&&sb&&sb.from){const r=await sb.from('profiles').update({[col]:val}).eq('id',me.id);if(r&&r.error&&/column|schema/i.test(r.error.message))toast('Выполните migration_v7.sql, чтобы настройка сохранялась на всех устройствах')}
}
ACTIONS.clk=t=>{CLK=t.dataset.v==='analog'?'analog':'digital';setClockPref('clock_style',CLK);renderWx();render()};
ACTIONS.todm=()=>{TODM=!TODM;setClockPref('tod_merge',TODM);renderWx();render()};
function setCity(c){CITY=c;try{localStorage.setItem('city',JSON.stringify(c))}catch(e){}WX=null;loadWx();render();toast('Город: '+c.name)}
async function findCity(){const v=(($('#cityin')||{}).value||'').trim();if(!v)return toast('Введите название города');
 try{const r=await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=ru&name='+encodeURIComponent(v)),j=await r.json(),x=(j.results||[])[0];if(!x)return toast('Город не найден');setCity({name:x.name,lat:x.latitude,lon:x.longitude})}catch(e){toast('Не удалось найти город')}}
function geoCity(){if(!navigator.geolocation)return toast('Геолокация недоступна');navigator.geolocation.getCurrentPosition(p=>setCity({name:'Моё местоположение',lat:p.coords.latitude,lon:p.coords.longitude}),()=>toast('Нет доступа к геопозиции'))}
setInterval(renderWx,10000);setInterval(loadWx,1800000);
