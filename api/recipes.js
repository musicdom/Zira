const REDIS_URL=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL||'';
const REDIS_TOKEN=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN||'';
const REDIS_KEY='zira:recipes:v1';

async function redis(command,args=[]){
  if(!REDIS_URL||!REDIS_TOKEN)throw new Error('Redis не подключён');
  const r=await fetch(REDIS_URL,{method:'POST',headers:{Authorization:'Bearer '+REDIS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify([command,...args])});
  const j=await r.json();
  if(!r.ok||j.error)throw new Error(j.error||'Redis API error');
  return j.result;
}

async function getRecipes(){
  const stored=await redis('GET',[REDIS_KEY]);
  if(stored){
    try{
      const data=typeof stored==='string'?JSON.parse(stored):stored;
      const recipes=Array.isArray(data?.recipes)?data.recipes:[];
      const userRecipes=recipes.filter(r=>Number(r.id)>80);
      if(userRecipes.length!==recipes.length){
        const cleaned={version:1,recipes:userRecipes};
        await redis('SET',[REDIS_KEY,JSON.stringify(cleaned)]);
        return cleaned;
      }
      return data;
    }catch{}
  }
  return {version:1,recipes:[]};
}

export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'Метод не поддерживается'});
  try{
    const data=await getRecipes();
    return res.status(200).json({ok:true,version:data.version||1,recipes:Array.isArray(data.recipes)?data.recipes:[]});
  }catch(e){
    console.error('Public recipes error:',e);
    return res.status(500).json({ok:false,error:'Не удалось загрузить каталог блюд'});
  }
}
