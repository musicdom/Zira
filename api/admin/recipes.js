import crypto from 'node:crypto';

const REDIS_URL=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL||'';
const REDIS_TOKEN=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN||'';
const REDIS_KEY='zira:recipes:v1';
const SEED_URL='https://raw.githubusercontent.com/musicdom/Zira/main/data/recipes.json';
const ADMIN_IDS=new Set(['6825986431','1379107010']);

function telegramUser(initData){
  const botToken=process.env.TELEGRAM_BOT_TOKEN;
  if(!botToken||!initData)return null;
  const params=new URLSearchParams(initData);
  const hash=params.get('hash');
  const authDate=params.get('auth_date');
  if(!hash||!authDate)return null;
  const age=Math.floor(Date.now()/1000)-Number(authDate);
  if(!Number.isFinite(age)||age<0||age>86400)return null;
  const dataCheck=[...params.entries()]
    .filter(([k])=>k!=='hash')
    .sort(([a],[b])=>a.localeCompare(b))
    .map(([k,v])=>k+'='+v)
    .join('\n');
  const secret=crypto.createHmac('sha256','WebAppData').update(botToken).digest();
  const expected=crypto.createHmac('sha256',secret).update(dataCheck).digest('hex');
  if(!crypto.timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(hash,'hex')))return null;
  try{return JSON.parse(params.get('user')||'null')}catch{return null}
}

function auth(req){
  const user=telegramUser(req.headers['x-telegram-init-data']||'');
  return user&&ADMIN_IDS.has(String(user.id))?user:null;
}

async function redis(command,args=[]){
  if(!REDIS_URL||!REDIS_TOKEN)throw new Error('Redis не подключён. Добавьте UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN в Vercel.');
  const r=await fetch(REDIS_URL,{
    method:'POST',
    headers:{
      Authorization:'Bearer '+REDIS_TOKEN,
      'Content-Type':'application/json'
    },
    body:JSON.stringify([command,...args])
  });
  const j=await r.json();
  if(!r.ok||j.error)throw new Error(j.error||'Redis API error');
  return j.result;
}

async function getRecipes(){
  const stored=await redis('GET',[REDIS_KEY]);
  if(stored){
    try{return typeof stored==='string'?JSON.parse(stored):stored}catch{}
  }

  const seedResponse=await fetch(SEED_URL);
  if(!seedResponse.ok)throw new Error('Не удалось загрузить исходный каталог блюд');
  const seed=await seedResponse.json();
  await redis('SET',[REDIS_KEY,JSON.stringify(seed)]);
  return seed;
}

function validRecipe(r){
  return r&&typeof r.name==='string'&&r.name.trim()&&typeof r.cat==='string'&&
    Array.isArray(r.filters)&&Array.isArray(r.ingredients)&&Array.isArray(r.steps);
}

export default async function handler(req,res){
  const user=auth(req);
  if(!user)return res.status(403).json({ok:false,error:'Доступ разрешён только администраторам Telegram'});

  try{
    const current=await getRecipes();

    if(req.method==='GET'){
      return res.status(200).json({
        ok:true,
        recipes:current.recipes||[],
        user:{id:user.id,name:user.first_name||''}
      });
    }

    if(req.method!=='POST'){
      return res.status(405).json({ok:false,error:'Метод не поддерживается'});
    }

    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    let list=current.recipes||[];

    if(body.action==='save'){
      if(!validRecipe(body.recipe))return res.status(400).json({ok:false,error:'Проверьте данные блюда'});
      const r={...body.recipe,id:Number(body.recipe.id)||Date.now()};
      const i=list.findIndex(x=>Number(x.id)===r.id);
      if(i>=0)list[i]=r;
      else{
        r.id=Math.max(0,...list.map(x=>Number(x.id)||0))+1;
        list.push(r);
      }
    }else if(body.action==='delete'){
      list=list.filter(x=>Number(x.id)!==Number(body.id));
    }else{
      return res.status(400).json({ok:false,error:'Неизвестное действие'});
    }

    const next={version:1,recipes:list};
    await redis('SET',[REDIS_KEY,JSON.stringify(next)]);

    const verify=await redis('GET',[REDIS_KEY]);
    let verified=null;
    try{verified=typeof verify==='string'?JSON.parse(verify):verify}catch{}
    const verifiedList=Array.isArray(verified?.recipes)?verified.recipes:[];
    const saved=body.action==='delete'
      ? !verifiedList.some(x=>Number(x.id)===Number(body.id))
      : verifiedList.some(x=>Number(x.id)===Number(body.recipe?.id||0)||String(x.name||'')===String(body.recipe?.name||''));
    if(!saved)throw new Error('Redis не подтвердил сохранение блюда');

    return res.status(200).json({ok:true,recipes:verifiedList,commit:null});
  }catch(e){
    console.error('Redis recipes error:',e);
    return res.status(500).json({ok:false,error:e.message||'Ошибка сервера'});
  }
}
