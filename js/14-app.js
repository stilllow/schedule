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
 if(!window.supabase){for(const u of ['https://fastly.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js','https://unpkg.com/@supabase/supabase-js@2.45.4/dist/umd/supabase.js']){try{await loadScript(u)}catch(e){}if(window.supabase)break}}
 if(!window.supabase||SUPABASE_URL.startsWith('ВАШ')||SUPABASE_KEY.startsWith('ВАШ')){document.body.classList.add('anon');A.innerHTML=setupHTML();return}
 sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);renderWx();loadWx();
 const shTok=new URLSearchParams(location.search).get('s');if(shTok){SHARED=true;await loadShared(shTok);render();return}
 sb.auth.onAuthStateChange(ev=>{if(ev==='PASSWORD_RECOVERY')setTimeout(async()=>{const {data}=await sb.auth.getSession();if(data.session){me=data.session.user;P=null;view='acc';render();await load();render();toast('Введите новый пароль в разделе «Аккаунт»')}},0)});
 A.innerHTML='<div class="empty">Загрузка…</div>';
 try{const {data}=await sb.auth.getSession();if(data.session){me=data.session.user;render();await load()}}catch(_){}
 render();
})();

function setupHTML(){
 const st=[[!!window.supabase,'Библиотека Supabase загружена'],[_cf.hasCfg,'Файл config.js найден'],[!!(_cf.url&&_cf.key),'Ключи заполнены']];
 return`<div class="auth gl"><div class="lg">${langBtns()}</div><h1>Нужна настройка</h1><p class="n">Проверка:</p>${st.map(([ok,t])=>`<div class="note" style="margin-bottom:.4rem">${ic(ok?'check':'alert')}${t}</div>`).join('')}
 <p class="n">Введите ключи прямо здесь — они сохранятся в этом браузере.</p>
 <label>Project URL</label><input id="cfu" placeholder="https://xxxx.supabase.co" autocomplete="off" value="${esc(_cf.url||'')}">
 <label>Публичный ключ (anon / publishable)</label><input id="cfk" autocomplete="off" value="${esc(_cf.key||'')}">
 <button class="btn wide" data-a="cfgsave">Сохранить и запустить</button>
 ${window.supabase?'':'<p class="n">Если библиотека не загружена, отключите блокировщик рекламы или VPN и обновите страницу.</p>'}</div>`;
}
