const GITHUB_API='https://api.github.com';
const REPO='musicdom/Zira';
const PATH='data/recipes.json';
function auth(req){const p=req.headers['x-admin-password'];return !!process.env.ADMIN_PASSWORD&&p===process.env.ADMIN_PASSWORD}
async function gh(method,url,body){const r=await fetch(GITHUB_API+url,{method,headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const j=await r.json();if(!r.ok)throw new Error(j.message||'GitHub API error');return j}
async function getFile(){return gh('GET',`/repos/${REPO}/contents/${PATH}?ref=main`)}
function validRecipe(r){return r&&typeof r.name==='string'&&r.name.trim()&&typeof r.cat==='string'&&Array.isArray(r.filters)&&Array.isArray(r.ingredients)&&Array.isArray(r.steps)}
export default async function handler(req,res){
 if(!auth(req))return res.status(401).json({ok:false,error:'Неавторизовано'});
 try{
  const file=await getFile();
  const current=JSON.parse(Buffer.from(file.content,'base64').toString('utf8'));
  if(req.method==='GET')return res.status(200).json({ok:true,recipes:current.recipes||[]});
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'Метод не поддерживается'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{}; let list=current.recipes||[];
  if(body.action==='save'){if(!validRecipe(body.recipe))return res.status(400).json({ok:false,error:'Проверьте данные блюда'});const r={...body.recipe,id:Number(body.recipe.id)||Date.now()};const i=list.findIndex(x=>Number(x.id)===r.id);if(i>=0)list[i]=r;else{r.id=Math.max(0,...list.map(x=>Number(x.id)||0))+1;list.push(r)}}
  else if(body.action==='delete'){list=list.filter(x=>Number(x.id)!==Number(body.id))}
  else return res.status(400).json({ok:false,error:'Неизвестное действие'});
  const content=Buffer.from(JSON.stringify({version:1,recipes:list},null,2)).toString('base64');
  const saved=await gh('PUT',`/repos/${REPO}/contents/${PATH}`,{message:body.action==='delete'?'Удалить блюдо из каталога':'Сохранить блюдо в каталоге',content,sha:file.sha,branch:'main'});
  return res.status(200).json({ok:true,recipes:list,commit:saved.commit?.sha||null});
 }catch(e){return res.status(500).json({ok:false,error:e.message||'Ошибка сервера'})}
}