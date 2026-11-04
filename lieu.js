// Accès « invité » : écrire uniquement dans le lieu sûr (fichier lieu.json du dépôt dédié)
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fr=n=>n.toLocaleString('fr-FR');
const msg=t=>{$('#msg').textContent=t;clearTimeout(window._mt);if(t)window._mt=setTimeout(()=>{$('#msg').textContent=''},9000);try{if(ED&&ED.isFull())ED.notify(t)}catch{}};
const today=()=>new Date().toISOString().slice(0,10);
const cnt=t=>({c:t.length,w:(t.trim().match(/\S+/g)||[]).length});
const bad=e=>e.name==='OperationError'?'Mot de passe incorrect.':e.message;
let PW=null,TOK='',editId=null,all=[];
const ED=initEditor($('#edbox'),'Écrivez ici…',{onDraft:async()=>{if(await send(true))ED.exitFull()}});

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


// Menu : Nouveau texte / Consultation / Voir le site (rien d'autre n'est affiché à la connexion)
function view(v){
 $('#v-new').hidden=v!=='new';$('#v-list').hidden=v!=='list';$('#lock').hidden=false;
 document.querySelectorAll('.menu button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
 if(v==='list')refresh();
}
$('.menu').onclick=e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.v==='new'&&editId)reset();
 msg('');view(b.dataset.v)};

// Il ne voit et ne modifie que les textes qu'il a lui-même écrits (by:'invite')
const mine=l=>l.filter(x=>x.by==='invite').sort((a,b)=>(b.date||'').localeCompare(a.date||''));
async function refresh(strict){
 try{const{list}=await load();all=list;
  const mt=textsOf(list).filter(x=>x.by==='invite'),mc=catsOf(list,'grivois','invite');
  $('#list').innerHTML='<p style="margin:.2rem 0 .8rem"><button class="ghost" data-a="cnew">+ Nouvelle catégorie</button></p>'+treeHtml({texts:mt,cats:mc,meta:t=>(t.date||'')+(t.draft?' · <span class="badge">brouillon</span>':'')+(t.n?` · ${fr(t.n.c)} caractères · ${fr(t.n.w)} mots`:'')});
  fillCats();
 }catch(e){if(strict)throw e;msg(bad(e))}}

// Catégories : liste déroulante du formulaire (ses propres catégories seulement)
function fillCats(){const s=$('#catg');if(!s)return;const keep=s.value,src=catsOf(all,'grivois','invite');
 s.innerHTML='<option value="">Sans catégorie</option>'+src.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')+'<option value="__new">+ Nouvelle catégorie…</option>';
 s.value=[...s.options].some(o=>o.value===keep)?keep:''}
$('#catg').onchange=async()=>{const s=$('#catg');if(s.value!=='__new')return;
 const name=prompt('Nom de la nouvelle catégorie :');if(!name||!name.trim()){s.value='';return}
 try{const{list,sha}=await load(),c=addCat(list,'grivois',name,'invite');await save(list,sha,'Mise a jour');all=list;fillCats();s.value=c.id}catch(e){s.value='';msg(bad(e))}};

$('#date').value=today();
function upd(){const n=cnt(ED.text());$('#cnt').textContent=n.c?`${fr(n.c)} caractères · ${fr(n.w)} mots · ⏳ ${Math.max(1,Math.ceil(n.w/200))} min de lecture`:''}
ED.onInput(upd);
function reset(){editId=null;['title','file'].forEach(k=>$('#'+k).value='');ED.clear();$('#catg').value='';$('#date').value=today();$('#pub').textContent='Publier';$('#ftitle').textContent='Nouveau texte';upd()}
$('#cancel').onclick=()=>{reset();msg('')};

$('#file').onchange=async ev=>{const f=ev.target.files[0];if(!f)return;const n=f.name.toLowerCase();let h='';
 try{
  if(n.endsWith('.docx'))h=(await mammoth.convertToHtml({arrayBuffer:await f.arrayBuffer()})).value;
  else if(n.endsWith('.pdf')){let t='';pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
   const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;
   for(let p=1;p<=pdf.numPages;p++){const c=await(await pdf.getPage(p)).getTextContent();t+=c.items.map(i=>i.str+(i.hasEOL?'\n':'')).join('')+'\n\n'}h=plainToHtml(t)}
  else if(n.endsWith('.doc'))return msg('Ce vieux format .doc n’est pas lisible ici : ouvrez-le dans Word, « Enregistrer sous » .docx, puis importez-le.');
  else h=plainToHtml(await f.text());
 }catch(e){return msg('Lecture impossible : '+e.message)}
 ED.set(h);if(!$('#title').value)$('#title').value=f.name.replace(/\.[^.]+$/,'');
 upd();msg('Fichier importé. Relisez le texte avant de publier.')};

async function send(draft){
 const cg=$('#catg').value==='__new'?'':$('#catg').value,title=$('#title').value.trim()||(draft?'Sans titre':''),text=ED.text(),html=ED.html(),date=$('#date').value,id=editId||Date.now().toString(36);
 if(!text)return msg('Il manque le texte.');
 if(!title)return msg('Il manque le titre.');
 const was=all.find(x=>x.id===id&&x.by==='invite');
 if(draft&&was&&!was.draft&&!await confirmBox('Ce texte est en ligne. Le retirer du site et le garder en brouillon ?','Retirer du site'))return;
 if(!draft&&!await confirmBox(`Mettre en ligne « ${title} » ?`))return;
 try{msg('Enregistrement en cours…');
  const{list,sha}=await load(),e={id,date,title,body:text,html,n:cnt(text),by:'invite'};if(draft)e.draft=true;
  const i=list.findIndex(x=>x.id===id&&x.by==='invite');i>=0?list[i]=e:list.push(e);
  await save(list,sha,'Mise a jour');reset();msg(draft?'Brouillon enregistré. Il n’est pas visible sur le site.':'Publié.');refresh();return true;
 }catch(err){msg(bad(err))}}
$('#pub').onclick=()=>send(false);
$('#draft').onclick=()=>send(true);

$('#list').onclick=async ev=>{const b=ev.target.closest('button');if(!b)return;
 if(b.dataset.d){if(!confirm('Supprimer ce texte définitivement ?'))return;
  try{const{list,sha}=await load();await save(list.filter(x=>!(x.id===b.dataset.d&&x.by==='invite')),sha,'Mise a jour');msg('Texte supprimé.');refresh()}catch(e){msg(bad(e))}}
 if(b.dataset.e){const t=all.find(x=>x.id===b.dataset.e&&x.by==='invite');if(!t)return;
  editId=t.id;$('#date').value=t.date||today();$('#title').value=t.title;ED.set(t.html||plainToHtml(t.body));upd();$('#pub').textContent=t.draft?'Publier':'Enregistrer les modifications';msg('Modification en cours.');$('#ftitle').textContent='Modifier un texte';view('new');scrollTo(0,0)}};
