/* Виджет времени и погоды (ПК) */
let CITY=null,WX=null;try{CITY=JSON.parse(localStorage.getItem('city')||'null')}catch(e){}
const WCODE=c=>c===0?['sun','Ясно']:c<=2?['partly','Малооблачно']:c===3?['cloud','Облачно']:c<=48?['fog','Туман']:c<=67?['rain','Дождь']:c<=77?['snow','Снег']:c<=82?['rain','Ливень']:c<=86?['snow','Снегопад']:['storm','Гроза'];
async function loadWx(){
 if(!CITY)return renderWx();
 try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${CITY.lat}&longitude=${CITY.lon}&current=temperature_2m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`),j=await r.json();
  WX={t:Math.round(j.current.temperature_2m),f:Math.round(j.current.apparent_temperature),c:j.current.weather_code,max:Math.round(j.daily.temperature_2m_max[0]),min:Math.round(j.daily.temperature_2m_min[0])}}catch(e){WX=null}
 renderWx();
}
function renderWx(){
 const e=$('#wx');if(!e)return;const n=new Date(),w=WX?WCODE(WX.c):null;
 e.innerHTML=`<div class="wxh"><span>${esc(n.toLocaleDateString(LOC(),{weekday:'long',day:'numeric',month:'long'}))}</span><span>${CITY?esc(CITY.name):''}</span></div>
 <div class="wxm"><div class="wxt">${hm(n)}</div>${WX?`<div class="wxw">${ic(w[0])}<b>${WX.t}°</b></div>`:''}</div>
 ${WX?`<div class="wxs"><span>${w[1]}, ощущается ${WX.f}°</span><span class="pl">${ic('up')}${WX.max}°</span><span class="pl">${ic('down')}${WX.min}°</span></div>`:`<div class="wxs"><span>${CITY?'Погода недоступна':'Город не выбран'}</span><button class="btn g" data-a="goset">Настроить</button></div>`}
 ${wstrip(n)}`;
}
function setCity(c){CITY=c;try{localStorage.setItem('city',JSON.stringify(c))}catch(e){}WX=null;loadWx();render();toast('Город: '+c.name)}
async function findCity(){const v=(($('#cityin')||{}).value||'').trim();if(!v)return toast('Введите название города');
 try{const r=await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=ru&name='+encodeURIComponent(v)),j=await r.json(),x=(j.results||[])[0];if(!x)return toast('Город не найден');setCity({name:x.name,lat:x.latitude,lon:x.longitude})}catch(e){toast('Не удалось найти город')}}
function geoCity(){if(!navigator.geolocation)return toast('Геолокация недоступна');navigator.geolocation.getCurrentPosition(p=>setCity({name:'Моё местоположение',lat:p.coords.latitude,lon:p.coords.longitude}),()=>toast('Нет доступа к геопозиции'))}
setInterval(renderWx,10000);setInterval(loadWx,1800000);
