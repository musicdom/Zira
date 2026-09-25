import crypto from 'node:crypto';
const GITHUB_API='https://api.github.com';
const REPO='musicdom/Zira';
const PATH='data/recipes.json';
const ADMIN_IDS=new Set(['6825986431','1379107010']);
function telegramUser(initData){
  const botToken=process.env.TELEGRAM_BOT_TOKEN;
  if(!botToken||!initData)return null;
  const params=new URLSearchParams(initData); const hash=params.get('hash'); const authDate=params.get('auth_date');
  if(!hash||!authDate)return null;
  const age=Math.floor(Date.now()/1000)-Number(authDate); if(!Number.isFinite(age)||age<0||age>86400)return null;
  const dataCheck=[...params.entries()].filter(([k])=>k!=='hash').sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n');
  const secret=crypto.createHmac('sha256','WebAppData').update(botToken).digest();
  const expected=crypto.createHmac('sha256',secret).update(dataCheck).digest('hex');
  if(!crypto.timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(hash,'hex')))return null;
  try{return JSON.parse(params.get('user')||'null')}catch{return null}
}
function auth(req){const user=telegramUser(req.headers['x-telegram-init-data']||'');return user&&ADMIN_IDS.has(String(user.id))?user:null}
async function gh(method,url,body){const r=await fetch(GITHUB_API+url,{method,headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const j=await r.json();if(!r.ok)throw new Error(j.message||'GitHub API error');return j}
async function getFile(){return gh('GET',`/repos/${REPO}/contents/${PATH}?ref=main`)}
function validRecipe(r){return r&&typeof r.name==='string'&&r.name.trim()&&typeof r.cat==='string'&&Array.isArray(r.filters)&&Array.isArray(r.ingredients)&&Array.isArray(r.steps)}
export default async function handler(req,res){
 const user=auth(req); if(!user)return res.status(403).json({ok:false,error:'Доступ разрешён только администраторам Telegram'});
 try{const file=await getFile();const current=JSON.parse(Buffer.from(file.content,'base64').toString('utf8'));if(req.method==='GET')return res.status(200).json({ok:true,recipes:current.recipes||[],user:{id:user.id,name:user.first_name||''}});if(req.method!=='POST')return res.status(405).json({ok:false,error:'Метод не поддерживается'});const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};let list=current.recipes||[];if(body.action==='save'){if(!validRecipe(body.recipe))return res.status(400).json({ok:false,error:'Проверьте данные блюда'});const r={...body.recipe,id:Number(body.recipe.id)||Date.now()};const i=list.findIndex(x=>Number(x.id)===r.id);if(i>=0)list[i]=r;else{r.id=Math.max(0,...list.map(x=>Number(x.id)||0))+1;list.push(r)}}else if(body.action==='delete'){list=list.filter(x=>Number(x.id)!==Number(body.id))}else return res.status(400).json({ok:false,error:'Неизвестное действие'});const content=Buffer.from(JSON.stringify({version:1,recipes:list},null,2)).toString('base64');const saved=await gh('PUT',`/repos/${REPO}/contents/${PATH}`,{message:body.action==='delete'?'Удалить блюдо из каталога':'Сохранить блюдо в каталоге',content,sha:file.sha,branch:'main'});return res.status(200).json({ok:true,recipes:list,commit:saved.commit?.sha||null})}catch(e){return res.status(500).json({ok:false,error:e.message||'Ошибка сервера'})}}
