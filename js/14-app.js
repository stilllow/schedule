/* Напоминания и запуск приложения */
const fired=new Set();
setInterval(()=>{
 if(!me||!P)return;const n=new Date();hwRemind(n);if(dayInfo(n))return;
 [...lessonsOn(n),...lessonsOn(n,true)].forEach(l=>{
  if(l.cancel)return;const [h,m]=l.start.split(':').map(Number),diff=(h*60+m)-(n.getHours()*60+n.getMinutes()),k=n.toDateString()+l.id;
  if(diff>0&&diff<=P.remind&&!fired.has(k)){fired.add(k);notify(P.nt,`${l.subject} в ${l.start}${l.room?', ауд. '+l.room:''}`)}
 });
},20000);
(async()=>{
 const A=$('#app');applyScale();paintLang();if(LANG==='en'){document.documentElement.lang='en';document.title=T(document.title);trNode($('#ui'))}
 if(!window.supabase||SUPABASE_URL.startsWith('ВАШ')||SUPABASE_KEY.startsWith('ВАШ')){document.body.classList.add('anon');A.innerHTML='<div class="auth gl"><h1>Нужна настройка</h1><p class="n">Создайте рядом с index.html файл config.js и впишите в него Project URL и публичный ключ Supabase.</p></div>';return}
 sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);renderWx();loadWx();
 const shTok=new URLSearchParams(location.search).get('s');if(shTok){SHARED=true;await loadShared(shTok);render();return}
 sb.auth.onAuthStateChange(ev=>{if(ev==='PASSWORD_RECOVERY')setTimeout(async()=>{const {data}=await sb.auth.getSession();if(data.session){me=data.session.user;P=null;view='acc';render();await load();render();toast('Введите новый пароль в разделе «Аккаунт»')}},0)});
 A.innerHTML='<div class="empty">Загрузка…</div>';
 try{const {data}=await sb.auth.getSession();if(data.session){me=data.session.user;render();await load()}}catch(_){}
 render();
})();
