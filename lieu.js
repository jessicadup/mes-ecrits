// Accès « invité » : écrire uniquement dans le lieu sûr (fichier lieu.json du dépôt dédié)
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fr=n=>n.toLocaleString('fr-FR');
const msg=t=>{$('#msg').textContent=t};
const today=()=>new Date().toISOString().slice(0,10);
const cnt=t=>({c:t.length,w:(t.trim().match(/\S+/g)||[]).length});
const bad=e=>e.name==='OperationError'?'Mot de passe incorrect.':e.message;
let PW=null,TOK='',editId=null,all=[];

const S=JSON.parse(localStorage.getItem('cfgL')||'{}');
const host=location.hostname.endsWith('github.io')?location.hostname.split('.')[0]:'';
$('#owner').value=S.owner||CFG.owner||host;$('#repo2').value=S.repo2||CFG.lieu;
$('#first').hidden=!!S.tok;
const cfg=()=>({o:$('#owner').value.trim(),r:$('#repo2').value.trim(),b:CFG.branch,t:TOK});
$('#sp').onchange=e=>['gpw','token'].forEach(k=>{$('#'+k).type=e.target.checked?'text':'password'});

const api=c=>`https://api.github.com/repos/${c.o}/${c.r}/contents/lieu.json`;
const hd=c=>({Authorization:'Bearer '+c.t,Accept:'application/vnd.github+json'});
async function load(){const c=cfg(),r=await fetch(api(c)+'?ref='+c.b+'&_='+Date.now(),{headers:hd(c)});
 if(r.status===404)throw new Error('Le lieu sûr n’est pas encore ouvert : demandez qu’un premier texte y soit publié.');
 if(!r.ok)throw new Error('GitHub a répondu '+r.status+' : vérifiez le jeton et le nom du dépôt.');
 const j=await r.json(),o=JSON.parse(new TextDecoder().decode(fromB64(j.content.replace(/\n/g,''))));
 return{list:await unlock(o.enc,PW),sha:j.sha}}
async function save(list,sha,message){const c=cfg(),b={message,branch:c.b,sha,content:toB64(new TextEncoder().encode(JSON.stringify({v:2,enc:await lock(list,PW)})))};
 const r=await fetch(api(c),{method:'PUT',headers:hd(c),body:JSON.stringify(b)});
 if(!r.ok)throw new Error('L’enregistrement a échoué ('+r.status+'). Le jeton est-il encore valide ?')}

$('#unlock').onclick=async()=>{
 const p=$('#gpw').value,m=t=>$('#gmsg').textContent=t;
 if(p.length<10)return m('Mot de passe : 10 caractères minimum.');
 if(S.tok){try{TOK=(await unlock(S.tok,p)).t}catch{return m('Mot de passe incorrect.')}}
 else{TOK=$('#token').value.trim();if(!TOK)return m('Collez le jeton d’accès.')}
 PW=p;m('Connexion…');
 try{await refresh(true);
  if(!S.tok){const c=cfg();localStorage.setItem('cfgL',JSON.stringify({owner:c.o,repo2:c.r,tok:await lock({t:TOK},p)}))}
  $('#gate').hidden=true;$('#app').hidden=false;
 }catch(e){PW=null;m(bad(e))}};

// Il ne voit et ne modifie que les textes qu'il a lui-même écrits (by:'invite')
const mine=l=>l.filter(x=>x.by==='invite').sort((a,b)=>(b.date||'').localeCompare(a.date||''));
async function refresh(strict){
 try{const{list}=await load();all=list;
  const m=mine(list);
  $('#list').innerHTML=m.length?m.map(t=>`<div class="item row"><div><b>${esc(t.title)}</b><span>${t.date||''}${t.n?` · ${fr(t.n.c)} caractères · ${fr(t.n.w)} mots`:''}</span></div><div style="flex:none"><button class="ghost" data-e="${t.id}">Modifier</button> <button class="ghost" data-d="${t.id}">Supprimer</button></div></div>`).join(''):'<p class="empty">Aucun texte pour l’instant.</p>';
 }catch(e){if(strict)throw e;msg(bad(e))}}

$('#date').value=today();
function upd(){const n=cnt($('#body').value);$('#cnt').textContent=n.c?`${fr(n.c)} caractères · ${fr(n.w)} mots · ⏳ ${Math.max(1,Math.ceil(n.w/200))} min de lecture`:''}
$('#body').oninput=upd;
function reset(){editId=null;['title','body','file'].forEach(k=>$('#'+k).value='');$('#date').value=today();$('#pub').textContent='Publier';upd()}
$('#cancel').onclick=()=>{reset();msg('')};

$('#file').onchange=async ev=>{const f=ev.target.files[0];if(!f)return;const n=f.name.toLowerCase();let t='';
 try{
  if(n.endsWith('.docx'))t=(await mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()})).value;
  else if(n.endsWith('.pdf')){pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
   const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;
   for(let p=1;p<=pdf.numPages;p++){const c=await(await pdf.getPage(p)).getTextContent();t+=c.items.map(i=>i.str+(i.hasEOL?'\n':'')).join('')+'\n\n'}}
  else if(n.endsWith('.doc'))return msg('Ce vieux format .doc n’est pas lisible ici : ouvrez-le dans Word, « Enregistrer sous » .docx, puis importez-le.');
  else t=await f.text();
 }catch(e){return msg('Lecture impossible : '+e.message)}
 $('#body').value=t.trim();if(!$('#title').value)$('#title').value=f.name.replace(/\.[^.]+$/,'');
 upd();msg('Fichier importé. Relisez le texte avant de publier.')};

$('#pub').onclick=async()=>{
 const title=$('#title').value.trim(),text=$('#body').value.trim(),date=$('#date').value;
 if(!title||!text)return msg('Il manque le titre ou le texte.');
 try{msg('Publication en cours…');
  const{list,sha}=await load(),id=editId||Date.now().toString(36),e={id,date,title,body:text,n:cnt(text),by:'invite'};
  const i=list.findIndex(x=>x.id===id&&x.by==='invite');i>=0?list[i]=e:list.push(e);
  await save(list,sha,'Mise a jour');reset();msg('Publié.');refresh();
 }catch(err){msg(bad(err))}};

$('#list').onclick=async ev=>{const b=ev.target.closest('button');if(!b)return;
 if(b.dataset.d){if(!confirm('Supprimer ce texte définitivement ?'))return;
  try{const{list,sha}=await load();await save(list.filter(x=>!(x.id===b.dataset.d&&x.by==='invite')),sha,'Mise a jour');msg('Texte supprimé.');refresh()}catch(e){msg(bad(e))}}
 if(b.dataset.e){const t=all.find(x=>x.id===b.dataset.e&&x.by==='invite');if(!t)return;
  editId=t.id;$('#date').value=t.date||today();$('#title').value=t.title;$('#body').value=t.body;upd();$('#pub').textContent='Enregistrer les modifications';msg('Modification en cours.');scrollTo(0,0)}};
