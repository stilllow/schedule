/* Глобальные обработчики кликов, ввода, изменений и входа */
$('#df').addEventListener('submit',async e=>{e.preventDefault();if(await DOK(new FormData(e.target)))$('#dlg').close()});
document.addEventListener('click',async e=>{
 const v=e.target.closest('#nav [data-v]');
 if(v){view=v.dataset.v;$('#nav').classList.remove('open');render();return}
 if(e.target.closest('#burger')){$('#nav').classList.toggle('open');return}
 if(!e.target.closest('#nav'))$('#nav').classList.remove('open');
 const t=e.target.closest('[data-a]');if(!t)return;const a=t.dataset.a,id=t.dataset.id,i=+t.dataset.i;
 if(a==='mode'){mode=t.dataset.m;err='';info='';render()}
 else if(a==='wsel'){wsel=t.dataset.w;render()}
 else if(a==='gv'){gv=t.dataset.g;render()}
 else if(a==='dd'){cur=new Date(cur.getFullYear(),cur.getMonth(),cur.getDate()+ +t.dataset.n);render()}
 else if(a==='tod'){cur=new Date();render()}
 else if(a==='add')openLesson({day:+t.dataset.d,el:t.dataset.el==='1'});
 else if(a==='edit')openLesson(L.find(x=>x.id===id));
 else if(a==='copy')openLesson({...L.find(x=>x.id===id),id:null});
 else if(a==='ovr')openOv(lessonsOn(cur).find(x=>x.id===id));
 else if(a==='del'){if(!confirm(T('Удалить занятие?')))return;const r=await sb.from('lessons').delete().eq('id',id);if(r.error)return toast('Ошибка: '+r.error.message);L=L.filter(x=>x.id!==id);HW=HW.map(h=>h.lesson_id===id?{...h,lesson_id:null}:h);render()}
 else if(a==='hwa')openHW();
 else if(a==='hwe')openHW(HW.find(x=>x.id===id));
 else if(a==='hwd'){if(!confirm(T('Удалить задание?')))return;const r=await sb.from('homework').delete().eq('id',id);if(r.error)return toast('Ошибка: '+r.error.message);HW=HW.filter(x=>x.id!==id);render()}
 else if(a==='hwt'){const h=HW.find(x=>x.id===id),r=await sb.from('homework').update({done:!h.done}).eq('id',id).select().single();if(r.error)toast('Ошибка: '+r.error.message);else HW=HW.map(x=>x.id===id?r.data:x);render()}
 else if(a==='th'){P.theme=t.dataset.v;applyUI(P.theme,P.font);render();saveProfile()}
 else if(a==='ft'){if(!fontOk(t.dataset.v))return;P.font=t.dataset.v;applyUI(P.theme,P.font);render();saveProfile()}
 else if(a==='bd'){if(P.bells.length>1){P.bells.splice(i,1);render();saveProfile()}}
 else if(a==='ba'){const b=P.bells[P.bells.length-1]||['08:30','10:00'];P.bells.push([b[1],b[1]]);render();saveProfile()}
 else if(a==='hd'){P.hol.splice(i,1);render();saveProfile()}
 else if(a==='ha')dlg('Каникулы',fld('Название',`<input name="t" required maxlength="40" placeholder="Зимние каникулы">`)+`<div class="row">`+fld('С',`<input name="f" type="date" required>`)+fld('По',`<input name="e" type="date" required>`)+`</div>`,async v=>{if(v.get('e')<v.get('f')){toast('Дата окончания раньше начала');return false}P.hol.push({title:v.get('t').trim(),from:v.get('f'),to:v.get('e')});render();saveProfile();return true});
 else if(a==='cyc'){P.cyc=t.dataset.v==='1';try{localStorage.setItem('g1','1')}catch(e){}render();saveProfile()}
 else if(a==='sat'){P.satOff=!P.satOff;render();saveProfile()}
 else if(a==='grp')$('#grp').classList.toggle('open');
 else if(a==='avpick')$('#avf').click();
 else if(a==='avdel'){const r=await sb.from('profiles').upsert({id:me.id,avatar:null});if(r.error)return toast('Ошибка: '+r.error.message);P.avatar='';toast('Фото удалено');render()}
 else if(a==='imp')openImport(t.dataset.g==='el');
 else if(a==='ics')exportICS();
 else if(a==='share')shareToggle(!P.share);
 else if(a==='shnew')shareToggle(true);
 else if(a==='shcopy')copyShare();
 else if(a==='eladd')openElective();
 else if(a==='eledit')openElective(elGroups().find(g=>g.key===t.dataset.k));
 else if(a==='eldel')delElective(t.dataset.k);
 else if(a==='elsess')$('#sess').insertAdjacentHTML('beforeend',sessRow({id:'',day:1,start:'16:00',end:'17:30',room:'',week:'both'}));
 else if(a==='elrm'){const sc=$('#sess');if(sc.children.length>1)t.closest('.sess').remove();else toast('Добавьте хотя бы один день')}
 else if(a==='eld'){elDay=t.dataset.d===''?null:+t.dataset.d;render()}
 else if(a==='elcyc'){P.elCyc=!P.elCyc;render();saveProfile()}
 else if(a==='hwr'){try{localStorage.setItem('hwr',hwrOn()?'0':'1')}catch(e){}render()}
 else if(a==='gdis'){try{localStorage.setItem('guide','0')}catch(e){}render()}
 else if(a==='gweek'){view='week';render()}
 else if(a==='sv'){view=t.dataset.v;render()}
 else if(a==='lang')applyLang(t.dataset.l);
 else if(a==='city')findCity();
 else if(a==='geo')geoCity();
 else if(a==='goset'){view='set';render()}
 else if(a==='accname'){const v=$('#an').value.trim(),r=await sb.from('profiles').upsert({id:me.id,display_name:v||null});if(r.error)return toast('Ошибка: '+r.error.message);P.name=v;toast('Имя сохранено');render()}
 else if(a==='accmail'){const v=$('#ae').value.trim();if(!v)return toast('Введите новую почту');const r=await sb.auth.updateUser({email:v});toast(r.error?tr(r.error.message):'Письмо с подтверждением отправлено на новую почту')}
 else if(a==='accpass'){const v=$('#ap').value;if(v.length<6)return toast('Пароль слишком короткий (минимум 6 символов)');if(v!==$('#ap2').value)return toast('Пароли не совпадают');const r=await sb.auth.updateUser({password:v});toast(r.error?tr(r.error.message):'Пароль изменён');if(!r.error)render()}
 else if(a==='accwipe'){if(!confirm(T('Удалить все занятия, задания и отмены? Это нельзя отменить.')))return;const r1=await sb.from('homework').delete().eq('user_id',me.id),r2=await sb.from('lessons').delete().eq('user_id',me.id),er=r1.error||r2.error;if(er)return toast('Ошибка: '+er.message);L=[];HW=[];OV={};toast('Расписание очищено');render()}
 else if(a==='accdel'){if(!confirm(T('Удалить аккаунт навсегда вместе со всеми данными?')))return;const r=await sb.rpc('delete_my_account');if(r.error)return toast('Не удалось удалить: '+r.error.message+'. Выполнен ли migration_v3.sql?');await sb.auth.signOut();me=null;P=null;L=[];HW=[];OV={};view='today';render();toast('Аккаунт удалён')}
 else if(a==='forgot'){const v=(($('#u')||{}).value||'').trim();if(!v)return toast('Сначала введите почту в поле выше');const r=await sb.auth.resetPasswordForEmail(v,{redirectTo:location.href.split('#')[0]});toast(r.error?tr(r.error.message):'Письмо для сброса пароля отправлено')}
 else if(a==='pc')$('#df').c.value=t.dataset.c;
 else if(a==='day'){cur=pd(t.dataset.d);view='today';render()}
 else if(a==='notif'){if(!window.Notification)return toast('Браузер не поддерживает уведомления. Напоминания будут показываться на странице.');await Notification.requestPermission();render()}
 else if(a==='test')notify(P.nt,'Пример: Математика в 08:30, ауд. 214');
 else if(a==='out'){await sb.auth.signOut();me=null;P=null;L=[];HW=[];OV={};view='today';err='';info='';$('#nav').classList.remove('open');render()}
});
document.addEventListener('input',e=>{if(e.target.id==='q'){q=e.target.value.trim().toLowerCase();$('#wk').innerHTML=wkHTML()}});
document.addEventListener('change',async e=>{
 const el=e.target,s=el.dataset.s;
 if(el.name==='pair'&&el.value!==''){const b=P.bells[+el.value];el.form.a.value=b[0];el.form.b.value=b[1]}
 if(s==='date'&&el.value){cur=pd(el.value);render()}
 else if(s==='type'){P.anchor={wk:wk(new Date()),type:el.value,date:ymd(monday(new Date()))};wsel=el.value;try{localStorage.setItem('g1','1')}catch(e){}render();saveProfile()}
 else if(s==='scale'){SC=+el.value;try{localStorage.setItem('scale',SC)}catch(e){}applyScale();render()}
 else if(s==='remind'){P.remind=+el.value;saveProfile()}
 else if(s==='ntext'){if(el.value==='__c'){cm=true;render()}else{cm=false;P.nt=el.value;render();saveProfile()}}
 else if(s==='ncust'){P.nt=el.value.trim()||PRE[1];saveProfile()}
 else if(s==='bell'){P.bells[+el.dataset.i][+el.dataset.k]=el.value;saveProfile()}
 else if(s==='sem'){P.sem[+el.dataset.i]=el.value;saveProfile()}
});
document.addEventListener('submit',async e=>{
 if(e.target.id!=='af')return;e.preventDefault();
 const em=$('#u').value.trim(),p=$('#p').value;err='';info='';
 if(mode==='up'&&p!==$('#p2').value){err='Пароли не совпадают';render();$('#u').value=em;return}
 e.target.querySelector('button.btn').disabled=true;
 const r=mode==='up'?await sb.auth.signUp({email:em,password:p}):await sb.auth.signInWithPassword({email:em,password:p});
 if(r.error){err=tr(r.error.message);render();$('#u').value=em;return}
 if(!r.data.session){info='Аккаунт создан. Подтвердите почту по ссылке из письма, затем войдите.';mode='in';render();return}
 me=r.data.user;view='today';P=null;render();await load();render();
});
