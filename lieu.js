// Accès « invité » : écrire uniquement dans le lieu sûr (fichier lieu.json du dépôt dédié)
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fr=n=>n.toLocaleString('fr-FR');
const msg=t=>{$('#msg').textContent=t;clearTimeout(window._mt);if(t)window._mt=setTimeout(()=>{$('#msg').textContent=''},9000);try{if(ED&&ED.isFull())ED.notify(t)}catch{}};
const today=()=>new Date().toISOString().slice(0,10);
const cnt=t=>({c:t.length,w:(t.trim().match(/\S+/g)||[]).length});
const bad=e=>e.name==='OperationError'?'Mot de passe incorrect.':e.message;
let PW=null,TOK='',editId=null,all=[];
const ED=initEditor($('#edbox'),'Écrivez ici…',{actions:true});

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
  $('#gate').hidden=true;$('#app').hidden=false;$('#lock').hidden=false;document.body.classList.add('has-lock');
 }catch(e){PW=null;m(bad(e))}};


// Menu : Nouveau texte / Consultation / Voir le site (rien d'autre n'est affiché à la connexion)
function view(v){
 $('#v-new').hidden=v!=='new';$('#v-list').hidden=v!=='list';$('#lock').hidden=false;document.body.classList.add('has-lock');
 document.querySelectorAll('.menu button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
 if(v==='list')refresh();
}
$('.menu').onclick=e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.v==='new'&&(editId||DU.on()))reset();
 msg('');view(b.dataset.v)};

// Il ne voit et ne modifie que les textes qu'il a lui-même écrits (by:'invite')
async function refresh(strict){
 try{const{list}=await load();all=list;
  const mt=textsOf(list).filter(x=>x.by==='invite'),mc=catsOf(list,'grivois','invite');
  $('#list').innerHTML='<p style="margin:.2rem 0 .8rem"><button class="ghost" data-a="cnew">+ Nouvelle rubrique</button></p>'+treeHtml({texts:mt,cats:mc,scope:'lieu-invite',restTitle:'Sans rubrique',meta:t=>(t.date||'')+(t.draft?' · <span class="badge">brouillon</span>':'')+(t.n?` · ${fr(t.n.c)} caractères · ${fr(t.n.w)} mots`:'')});
  {const dh=duoHtml({texts:textsOf(list),who:'invite'});if(dh)$('#list').insertAdjacentHTML('beforeend','<div style="margin-top:1.2rem">'+dh+'</div>')}
  fillCats();draftBadge(mt.filter(t=>t.draft).length);
 }catch(e){if(strict)throw e;msg(bad(e))}}

// Rubriques : liste déroulante du formulaire (ses propres rubriques seulement)
function fillCats(){const s=$('#catg');if(!s)return;const keep=s.value,src=catsOf(all,'grivois','invite');
 s.innerHTML='<option value="">Sans rubrique</option>'+src.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')+'<option value="__new">+ Nouvelle rubrique…</option>';
 s.value=[...s.options].some(o=>o.value===keep)?keep:''}
$('#catg').onchange=async()=>{const s=$('#catg');if(s.value!=='__new')return;
 const name=prompt('Nom de la nouvelle rubrique :');if(!name||!name.trim()){s.value='';return}
 try{const{list,sha}=await load(),c=addCat(list,'grivois',name,'invite');await save(list,sha,'Mise a jour');all=list;fillCats();s.value=c.id}catch(e){s.value='';msg(bad(e))}};

$('#date').value=today();
function upd(){const n=cnt(ED.text());$('#cnt').textContent=n.c?`${fr(n.c)} caractères · ${fr(n.w)} mots · ⏳ ${Math.max(1,Math.ceil(n.w/200))} min de lecture`:''}
ED.onInput(upd);
function reset(){editId=null;['title','file'].forEach(k=>$('#'+k).value='');ED.clear();ED.resetLH();$('#catg').value='';$('#date').value=today();$('#pub').textContent='Publier';$('#ftitle').textContent='Nouveau texte';DU.reset();upd()}
$('#del').onclick=()=>delOrClear();

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
 const cg=$('#catg').value==='__new'?'':$('#catg').value,title=$('#title').value.trim()||(draft?'Sans titre':''),text=ED.text(),html=ED.html(),date=$('#date').value,id=editId||Date.now().toString(36),wasEdit=!!editId;
 if(!text)return msg('Il manque le texte.');
 if(!title)return msg('Il manque le titre.');
 const was=all.find(x=>x.id===id&&x.by==='invite');
 if(draft&&was&&!was.draft&&!await confirmBox('Ce texte est en ligne. Le retirer du site et le garder en brouillon ?','Retirer du site'))return;
 if(!draft&&!await confirmBox(`Mettre en ligne « ${title} » ?`))return;
 try{msg('Enregistrement en cours…');
  const{list,sha}=await load(),e={id,date,title,body:text,html,n:cnt(text),by:'invite'};if(draft)e.draft=true;if(cg)e.cat=cg;{const lhv=ED.getLH();if(lhv)e.lh=lhv}
  const i=list.findIndex(x=>x.id===id&&x.by==='invite');placeText(list,e);i>=0?list[i]=e:list.push(e);
  await save(list,sha,'Mise a jour');openAt('lieu-invite',cg);reset();msg(draft?'Brouillon enregistré. Il n’est pas visible sur le site.':'Publié.');refresh();
   if(wasEdit){ED.exitFull();view('list');scrollTo(0,0)}return true;
 }catch(err){msg(bad(err))}}
$('#pub').onclick=async()=>{if(DU.on()){if(await DU.send()){reset();msg('Publié.');ED.exitFull();view('list');scrollTo(0,0)}return}if(await send(false))ED.exitFull()};
$('#draft').onclick=async()=>{if(DU.on())return;if(await send(true))ED.exitFull()};

$('#list').onclick=async ev=>{const b=ev.target.closest('button[data-a]');if(!b||b.disabled)return;
 const a=b.dataset.a,id=b.dataset.id,own=x=>!!x&&ownerOf(x)==='invite',ownT=x=>!!x&&!isCat(x)&&(ownerOf(x)==='invite'||isDuo(x));
 if(a==='dcont'||a==='ddel'){await DU.act(a,id);return}
 try{
  if(a==='edit'){const t=all.find(x=>x.id===id&&x.by==='invite');if(!t)return;
   editId=t.id;DU.reset();$('#duorow').hidden=true;$('#date').value=t.date||today();$('#title').value=t.title;ED.set(t.html||plainToHtml(t.body));$('#catg').value=t.cat||'';ED.setLH(t.lh||null);
   upd();$('#pub').textContent=t.draft?'Publier':'Enregistrer les modifications';msg('Modification en cours.');$('#ftitle').textContent='Modifier un texte';view('new');scrollTo(0,0);return}
  let text=null,name=null,dest=null;
  if(a==='del'){const t0=all.find(x=>x.id===id&&own(x));if(!t0)return;if(!await confirmBox('Supprimer définitivement « '+t0.title+' » ?','Supprimer'))return;text='Texte supprimé.'}
  else if(a==='trub'){const t0=all.find(x=>x.id===id&&!isCat(x)&&own(x));if(!t0)return;
   dest=await askRub({text:'Où placer « '+t0.title+' » ?',ok:'Déplacer',others:catsOf(all,'grivois','invite').filter(c=>c.id!==t0.cat),none:!!t0.cat,pref:'cat'});if(!dest)return;text='Texte déplacé.'}
  else if(a==='ttitle'){const t0=all.find(x=>x.id===id&&ownT(x));if(!t0)return;name=prompt('Nouveau titre :',t0.title);if(name==null||!name.trim())return;text='Titre modifié.'}
  else if(a==='cnew'){name=prompt('Nom de la nouvelle rubrique :');if(!name||!name.trim())return;text='Rubrique créée.'}
  else if(a==='cren'){const c=all.find(x=>x.id===id);if(!own(c))return;name=prompt('Nouveau nom de la rubrique :',c?c.name:'');if(!name||!name.trim())return;text='Rubrique renommée.'}
  else if(a==='cdel'){const c=all.find(x=>x.id===id);if(!own(c))return;
   const n=textsOf(all).filter(t=>t.cat===id&&own(t)).length;
   if(n){dest=await chooseDest(c.name,n,catsOf(all,'grivois','invite').filter(x=>x.id!==id));if(!dest)return}
   else if(!confirm(`Supprimer la rubrique « ${c.name} » ?`))return;
   text='Rubrique supprimée.'}
  const{list,sha}=await load();let nl=list;const tg=list.find(x=>x.id===id);
  if(a==='del')nl=list.filter(x=>!(x.id===id&&x.by==='invite'));
  else if(a==='ttitle'){const t=list.find(x=>x.id===id&&ownT(x));if(!t)return msg('Texte introuvable.');t.title=name.trim()}
  else if(a==='cnew')addCat(list,'grivois',name,'invite');
  else if(a==='cren'&&own(tg))renameCat(list,id,name);
  else if(a==='cdel'&&own(tg)){if(dest)moveTexts(list,id,dest,'grivois','invite');removeCat(list,id)}
  else if(a==='trub'){const i=list.findIndex(x=>x.id===id&&!isCat(x)&&own(x));if(i<0)return msg('Texte introuvable.');
   const tc=dest.mode==='new'?addCat(list,'grivois',dest.name,'invite'):dest.mode==='cat'?list.find(x=>x.id===dest.id&&isCat(x)&&own(x)):null;
   const e={...list[i]};if(tc)e.cat=tc.id;else delete e.cat;placeText(list,e);list[i]=e;openAt('lieu-invite',tc?tc.id:null)}
  else if((a==='cup'||a==='cdown')&&own(tg))moveCat(list,id,a==='cup'?-1:1);
  else if((a==='tup'||a==='tdown')&&own(tg))moveText(list,id,a==='tup'?-1:1);
  await save(nl,sha,'Mise a jour');if(text)msg(text);refresh();
 }catch(e){msg(bad(e))}};

// Supprimer : texte en cours de modification -> suppression définitive (le sien) ; nouveau texte -> vide le formulaire
async function delOrClear(){
 if(DU.on()&&DU.pid()){await DU.delPart(DU.pid());return}
 if(editId){
  const t=all.find(x=>x.id===editId&&x.by==='invite');
  if(!await confirmBox('Supprimer définitivement « '+(t?t.title:'ce texte')+' » ?','Supprimer'))return;
  try{const{list,sha}=await load();await save(list.filter(x=>!(x.id===editId&&x.by==='invite')),sha,'Mise a jour');reset();msg('Texte supprimé.');refresh();ED.exitFull();view('list');scrollTo(0,0)}catch(e){msg(bad(e))}
 }else{
  if((ED.text()||$('#title').value.trim())&&!await confirmBox('Vider le formulaire ? Le texte saisi sera perdu.','Vider le formulaire'))return;
  reset();msg('Formulaire vidé.');ED.exitFull()}}

// Écriture à deux voix (logique commune dans duo.js)
const DU=makeDuo({who:'invite',ED,get:()=>all,bad,msg,upd,today,
 reset:()=>reset(),view:v=>view(v),date:()=>$('#date').value||today(),
 async ld(){return load()},
 async sv(list,sha){await save(list,sha,'Mise a jour')},
 done(list){all=list;refresh()},
 page:S=>{$('#rowd').hidden=!!S.tid}});
$('#duo').onchange=()=>DU.toggle();
