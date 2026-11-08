/* Подсказки для новых пользователей: короткий чек-лист «Начало работы» */
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
function guideHTML(){
 if(lsGet('guide')==='0')return'';
 const hasL=L.some(l=>!l.el),notif=!!(window.Notification&&Notification.permission==='granted'),g1=lsGet('g1')==='1';
 if(hasL&&notif&&g1)return'';
 const step=(done,n,txt,btn)=>`<div class="gs${done?' done':''}"><span class="gn">${done?ic('check'):n}</span><div class="m"><b>${txt}</b>${done?'':btn}</div></div>`;
 return`<div class="card gl guide"><div class="dh"><h2 style="margin:0">Начало работы</h2><button class="btn d" data-a="gdis">Скрыть подсказки</button></div>`+
  step(g1,1,'Выберите тип расписания и текущую неделю','<div class="chips"><button class="btn g" data-a="goset">Настроить</button></div>')+
  step(hasL,2,'Добавьте занятия','<div class="chips"><button class="btn g" data-a="gweek">Добавить вручную</button><button class="btn g" data-a="imp">Загрузить файл или фото</button></div>')+
  step(notif,3,'Включите уведомления','<div class="chips"><button class="btn g" data-a="goset">Настроить</button></div>')+'</div>';
}
