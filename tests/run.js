/* Автопроверка сайта без браузера: синтаксис всех файлов + прогон экранов и логики в «пустом» DOM.
   Запуск: npm test  (или: node tests/run.js) */
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const files=[...html.matchAll(/<script src="(js\/[^"?]+)/g)].map(m=>m[1]);
if(!files.length){console.error('В index.html не найдено ни одного js-файла');process.exit(1)}
let failed=0;
const fail=m=>{failed++;console.error('FAIL',m)};

// 1. синтаксис
for(const f of [...files,'tests/cases.js']){
  try{new vm.Script(fs.readFileSync(path.join(root,f),'utf8'),{filename:f})}catch(e){fail('синтаксис '+f+': '+e.message)}
}

// 2. «пустой» DOM
function mk(){
  return new Proxy({innerHTML:'',textContent:'',style:{setProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},children:[],options:[],value:''},{
    get(t,k){if(k in t)return t[k];if(k==='querySelectorAll')return()=>[];if(k==='firstElementChild')return mk();if(typeof k==='symbol')return undefined;return function(){return mk()}},
    set(t,k,v){t[k]=v;return true}
  });
}
const els={};
const doc={querySelector(s){return els[s]||(els[s]=mk())},querySelectorAll(){return[]},addEventListener(){},body:mk(),head:mk(),documentElement:mk(),createElement(){return mk()},createTreeWalker(){return{nextNode(){return null}}},title:''};
const ctx={document:doc,navigator:{language:'ru'},localStorage:{getItem(){return null},setItem(){}},matchMedia(){return{matches:false}},innerHeight:800,location:{href:'http://x/',origin:'http://x',pathname:'/'},setInterval(){},setTimeout(){},clearTimeout(){},MutationObserver:class{observe(){}},NodeFilter:{SHOW_TEXT:4},Event:class{},console,fetch:async()=>({json:async()=>({})}),addEventListener(){},scrollY:0,confirm(){return true}};
ctx.window=ctx;ctx.self=ctx;
vm.createContext(ctx);
for(const f of files){
  try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f})}catch(e){fail('загрузка '+f+': '+e.message)}
}

// 3. проверки
let res=[];
try{res=vm.runInContext(fs.readFileSync(path.join(root,'tests/cases.js'),'utf8'),ctx,{filename:'tests/cases.js'})}catch(e){fail('tests/cases.js: '+e.stack)}
let n=0;
for(const r of res){n++;if(!r.ok)fail(r.n+(r.d?' — '+r.d:''))}
console.log(`${n} проверок, ошибок: ${failed}`);
process.exit(failed?1:0);
