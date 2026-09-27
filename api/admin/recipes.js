import crypto from 'node:crypto';

const REDIS_URL=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL||'';
const REDIS_TOKEN=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN||'';
const REDIS_KEY='zira:recipes:v1';
const ADMIN_IDS=new Set(['6825986431','1379107010']);
const CATEGORIES=new Set(['Завтраки','Обеды','Ужины','Десерты','Салаты']);
const FILTERS={Завтраки:new Set(['protein','carbs','oatmeal','eggs','cottage']),Обеды:new Set(['fish','meat','chicken','seafood','airfryer','oven']),Ужины:new Set(['fish','meat','seafood','airfryer','oven']),Десерты:new Set(['lowcal','lactose','nosugar','quick']),Салаты:new Set(['protein','chicken','seafood'])};

function telegramUser(initData){
  const botToken=process.env.TELEGRAM_BOT_TOKEN;
  if(!botToken||!initData)return null;
  const params=new URLSearchParams(initData),hash=params.get('hash'),authDate=params.get('auth_date');
  if(!hash||!authDate)return null;
  const age=Math.floor(Date.now()/1000)-Number(authDate);
  if(!Number.isFinite(age)||age<0||age>86400)return null;
  const dataCheck=[...params.entries()].filter(([k])=>k!=='hash').sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n');
  const secret=crypto.createHmac('sha256','WebAppData').update(botToken).digest();
  const expected=crypto.createHmac('sha256',secret).update(dataCheck).digest('hex');
  if(expected.length!==hash.length||!crypto.timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(hash,'hex')))return null;
  try{return JSON.parse(params.get('user')||'null')}catch{return null}
}
function auth(req){const user=telegramUser(req.headers['x-telegram-init-data']||'');return user&&ADMIN_IDS.has(String(user.id))?user:null}
async function redis(command,args=[]){
  if(!REDIS_URL||!REDIS_TOKEN)throw new Error('Redis не подключён');
  const r=await fetch(REDIS_URL,{method:'POST',headers:{Authorization:'Bearer '+REDIS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify([command,...args])});
  const j=await r.json();if(!r.ok||j.error)throw new Error(j.error||'Redis API error');return j.result;
}
async function getRecipes(){
  const stored=await redis('GET',[REDIS_KEY]);
  if(!stored)return {version:1,recipes:[]};
  try{
    const data=typeof stored==='string'?JSON.parse(stored):stored;
    const recipes=Array.isArray(data?.recipes)?data.recipes:[];
    const cleaned=recipes.filter(r=>Number(r.id)>80).map(r=>({...r,source:'admin'}));
    const changed=cleaned.length!==recipes.length||cleaned.some((r,i)=>r.source!==recipes[i]?.source);
    const result={version:1,recipes:cleaned};
    if(changed)await redis('SET',[REDIS_KEY,JSON.stringify(result)]);
    return result;
  }catch{return {version:1,recipes:[]}}
}
function validRecipe(r){
  if(!r||typeof r.name!=='string'||!r.name.trim()||r.name.trim().length>120||!CATEGORIES.has(r.cat)||!Array.isArray(r.filters)||!r.filters.every(x=>FILTERS[r.cat]?.has(x))||!Array.isArray(r.ingredients)||!r.ingredients.length||r.ingredients.length>100||!r.ingredients.every(x=>typeof x==='string'&&x.trim()&&x.length<=300)||!Array.isArray(r.steps)||!r.steps.length||r.steps.length>100||!r.steps.every(x=>typeof x==='string'&&x.trim()&&x.length<=500))return false;
  for(const k of ['kcal','b','j','u']){const n=Number(r[k]);if(!Number.isFinite(n)||n<0||n>10000)return false}
  if(r.image&&(!/^https?:\/\//i.test(String(r.image))||String(r.image).length>2000))return false;
  return true;
}
export default async function handler(req,res){
  const user=auth(req);if(!user)return res.status(403).json({ok:false,error:'Доступ разрешён только администраторам Telegram'});
  try{
    const current=await getRecipes();
    if(req.method==='GET')return res.status(200).json({ok:true,recipes:current.recipes||[],user:{id:user.id,name:user.first_name||''}});
    if(req.method!=='POST')return res.status(405).json({ok:false,error:'Метод не поддерживается'});
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};let list=current.recipes||[];
    if(body.action==='save'){
      if(!validRecipe(body.recipe))return res.status(400).json({ok:false,error:'Проверьте название, категорию, фильтры, КБЖУ, ингредиенты и шаги'});
      const incoming=body.recipe;const id=Number(incoming.id)||0;const r={...incoming,id,source:'admin'};
      const i=id?list.findIndex(x=>Number(x.id)===id):-1;
      if(i>=0)list[i]=r;else{r.id=Math.max(80,...list.map(x=>Number(x.id)||0))+1;list.push(r)}
    }else if(body.action==='delete'){
      const id=Number(body.id);if(!Number.isInteger(id)||id<=80)return res.status(400).json({ok:false,error:'Некорректное блюдо'});
      const before=list.length;list=list.filter(x=>Number(x.id)!==id);if(list.length===before)return res.status(404).json({ok:false,error:'Блюдо не найдено'});
    }else return res.status(400).json({ok:false,error:'Неизвестное действие'});
    const next={version:1,recipes:list};await redis('SET',[REDIS_KEY,JSON.stringify(next)]);
    const verify=await redis('GET',[REDIS_KEY]);let verified=null;try{verified=typeof verify==='string'?JSON.parse(verify):verify}catch{}
    const verifiedList=Array.isArray(verified?.recipes)?verified.recipes:[];
    if(body.action==='delete'?verifiedList.some(x=>Number(x.id)===Number(body.id)):!verifiedList.some(x=>Number(x.id)===Number(body.action==='save'?body.recipe?.id:0)||String(x.name||'')===String(body.recipe?.name||'')))throw new Error('Redis не подтвердил изменение');
    return res.status(200).json({ok:true,recipes:verifiedList,commit:null});
  }catch(e){console.error('Redis recipes error:',e);return res.status(500).json({ok:false,error:e.message||'Ошибка сервера'})}
}