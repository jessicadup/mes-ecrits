const $=s=>document.querySelector(s);
const CATN={main:'Mots après maux',grivois:'Le lieu sûr'};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fr=n=>n.toLocaleString('fr-FR');
const msg=t=>{$('#msg').textContent=t;clearTimeout(window._mt);if(t)window._mt=setTimeout(()=>{$('#msg').textContent=''},9000);try{if(ED&&ED.isFull())ED.notify(t)}catch{}};
const today=()=>new Date().toISOString().slice(0,10);
const cnt=t=>({c:t.length,w:(t.trim().match(/\S+/g)||[]).length});
const bad=e=>e.name==='OperationError'?'Mot de passe incorrect.':e.message;
let editId=null,cur=[],lcur=[],PW=null,TOK='',LP=null;
const ED=initEditor($('#edbox'),'Écrivez ici…',{actions:true});

const S=JSON.parse(localStorage.getItem('cfg')||'{}');
const host=location.hostname.endsWith('github.io')?location.hostname.split('.')[0]:'';
let g=location.pathname.split('/')[1];if(!g||g.endsWith('.html'))g=host?host+'.github.io':'';
const D={owner:CFG.owner||host,repo:g,repo2:CFG.lieu,branch:CFG.branch};
for(const k in D)$('#'+k).value=S[k]||D[k];
$('#first').hidden=!!S.tok;
const cfg=()=>({o:$('#owner').value.trim(),r:$('#repo').value.trim(),r2:$('#repo2').value.trim(),b:$('#branch').value.trim()||'main',t:TOK});
$('#sp').onchange=e=>['gpw','gpw2','token'].forEach(k=>{$('#'+k).type=e.target.checked?'text':'password'});
$('#sp2').onchange=e=>{$('#pw').type=e.target.checked?'text':'password'};

// Connexion : le mot de passe déchiffre le jeton stocké et la liste des textes
$('#unlock').onclick=async()=>{
 const p=$('#gpw').value,m=t=>$('#gmsg').textContent=t;
 if(p.length<10)return m('Mot de passe : 10 caractères minimum.');
 if(S.tok){try{TOK=(await unlock(S.tok,p)).t}catch{return m('Mot de passe incorrect.')}}
 else{if(p!==$('#gpw2').value)return m('Les deux mots de passe sont différents.');TOK=$('#token').value.trim();if(!TOK)return m('Collez le jeton GitHub.')}
 PW=p;m('Connexion…');
 try{await refresh(true);
  if(!S.tok){const c=cfg();localStorage.setItem('cfg',JSON.stringify({owner:c.o,repo:c.r,repo2:c.r2,branch:c.b,tok:await lock({t:TOK},p)}))}
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

// GitHub : chaque fichier est chiffré avant l'envoi (site : mot de passe du site ; lieu sûr : son propre mot de passe)
const api=(c,t)=>`https://api.github.com/repos/${c.o}/${t==='lieu'?c.r2:c.r}/contents/${t==='lieu'?'lieu.json':'content/texts.json'}`;
const hd=c=>({Authorization:'Bearer '+c.t,Accept:'application/vnd.github+json'});
async function load(t='main',pw=PW){const c=cfg(),r=await fetch(api(c,t)+'?ref='+c.b+'&_='+Date.now(),{headers:hd(c)});
 if(r.status===404)return{list:[],sha:null,size:0};
 if(!r.ok)throw new Error('GitHub a répondu '+r.status+' : vérifiez le jeton, l’identifiant et le nom du dépôt.');
 const j=await r.json(),o=JSON.parse(new TextDecoder().decode(fromB64(j.content.replace(/\n/g,''))));
 const raw=Array.isArray(o)?o:await unlock(o.enc,pw);return{list:t==='lieu'?raw:normalizeMain(raw),sha:j.sha,size:j.size}}
async function save(list,sha,message,t='main',pw=PW){const c=cfg(),b={message,branch:c.b,content:toB64(new TextEncoder().encode(JSON.stringify({v:2,enc:await lock(list,pw)})))};
 if(sha)b.sha=sha;const r=await fetch(api(c,t),{method:'PUT',headers:hd(c),body:JSON.stringify(b)});
 if(!r.ok)throw new Error('L’enregistrement a échoué ('+r.status+'). Le jeton autorise-t-il l’écriture sur ce dépôt ?')}
const sortD=l=>[...l].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
const meta=t=>{const n=t.n||(t.body!=null?cnt(t.body):null);return n?` · ${fr(n.c)} caractères · ${fr(n.w)} mots · ⏳ ${Math.max(1,Math.ceil(n.w/200))} min`:''};

// Formulaire
$('#date').value=today();
$('#cat').onchange=()=>{$('#pwrow').hidden=$('#cat').value!=='grivois';fillCats()};
function reset(){editId=null;['title','pw','file'].forEach(k=>$('#'+k).value='');ED.clear();ED.resetLH();$('#catg').value='';$('#date').value=today();$('#pub').textContent='Publier';$('#ftitle').textContent='Nouveau texte';upd()}
$('#del').onclick=()=>delOrClear();
function upd(){const n=cnt(ED.text());$('#cnt').textContent=n.c?`${fr(n.c)} caractères · ${fr(n.w)} mots · ⏳ ${Math.max(1,Math.ceil(n.w/200))} min de lecture`:''}
ED.onInput(upd);

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
 const cg=$('#catg').value==='__new'?'':$('#catg').value,cat=$('#cat').value,title=$('#title').value.trim()||(draft?'Sans titre':''),text=ED.text(),html=ED.html(),date=$('#date').value,id=editId||Date.now().toString(36),wasEdit=!!editId;
 if(!text)return msg('Il manque le texte.');
 if(!title)return msg('Il manque le titre.');
 const was=(cat==='grivois'?lcur:cur).find(x=>x.id===id);
 if(draft&&was&&!was.draft&&!await confirmBox('Ce texte est en ligne. Le retirer du site et le garder en brouillon ?','Retirer du site'))return;
 if(!draft&&!await confirmBox(`Mettre en ligne « ${title} » (${CATN[cat]}${cg?' › '+((cat==='grivois'?catsOf(lcur,'grivois'):catsOf(cur,'main')).find(c=>c.id===cg)||{name:''}).name:''}) ?`))return;
 try{
  const base={id,date,title,body:text,html,n:cnt(text)};if(draft)base.draft=true;{const lhv=ED.getLH();if(lhv)base.lh=lhv}
  if(cat==='grivois'){
   const p=$('#pw').value||LP||'';if(p.length<10)return msg('Mot de passe du lieu sûr : 10 caractères minimum.');
   msg('Enregistrement en cours…');
   const{list,sha}=await load('lieu',p),i=list.findIndex(x=>x.id===id),e={...base,by:(i>=0&&list[i].by)||'moi'};if(cg)e.cat=cg;placeText(list,e);
   i>=0?list[i]=e:list.push(e);await save(list,sha,'Mise a jour','lieu',p);LP=p;lcur=list;renderLieu();
  }else{
   msg('Enregistrement en cours…');
   const{list,sha}=await load(),e={...base,category:cat},i=list.findIndex(x=>x.id===id);if(cg)e.cat=cg;placeText(list,e);
   i>=0?list[i]=e:list.push(e);await save(list,sha,'Mise a jour du contenu');refresh();
  }
  openAt(cat==='grivois'?'lieu-moi':'main',cg);reset();msg(draft?'Brouillon enregistré. Il n’est pas visible sur le site.':'Publié. Le texte apparaît sur le site dans une à deux minutes.');
   if(wasEdit){ED.exitFull();view('list');scrollTo(0,0)}return true;
 }catch(err){msg(bad(err))}}
$('#pub').onclick=async()=>{if(await send(false))ED.exitFull()};
$('#draft').onclick=async()=>{if(await send(true))ED.exitFull()};

// Mes textes (site principal)
async function refresh(strict){
 try{const{list,size}=await load();cur=list;pie(list,size);
  renderMain(list);
 }catch(e){if(strict)throw e;msg(bad(e))}}
$('#list').onclick=ev=>treeAction(ev,'main');

function renderMain(list){const m=t=>(t.date||'')+(t.draft?' · <span class="badge">brouillon</span>':'')+meta(t);
 const tx=textsOf(list).filter(t=>t.category!=='grivois');
 let h='<h2 class="rh">Mots après maux</h2><p style="margin:.2rem 0 .8rem"><button class="ghost" data-a="cnew" data-sec="main">+ Nouvelle rubrique</button></p>'+treeHtml({texts:tx,cats:catsOf(list,'main'),meta:m,scope:'main',restTitle:'Sans rubrique'});
 $('#list').innerHTML=h;fillCats()}

// Catégories : liste déroulante du formulaire
function fillCats(){const s=$('#catg');if(!s)return;const L=$('#cat').value==='grivois',keep=s.value;
 const src=L?catsOf(lcur,'grivois','moi'):catsOf(cur,'main');
 $('label[for=catg]').textContent='Rubrique';
 s.innerHTML='<option value="">Sans rubrique</option>'+src.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')+'<option value="__new">+ Nouvelle rubrique…</option>';
 s.value=[...s.options].some(o=>o.value===keep)?keep:''}
$('#catg').onchange=async()=>{const s=$('#catg');if(s.value!=='__new')return;
 const lieuS=$('#cat').value==='grivois',sec=lieuS?'grivois':'main',pw=lieuS?($('#pw').value||LP):PW;
 const name=prompt('Nom de la nouvelle rubrique :');if(!name||!name.trim()){s.value='';return}
 if(lieuS&&(!pw||pw.length<10)){s.value='';return msg('Saisissez d’abord le mot de passe du lieu sûr (10 caractères minimum).')}
 try{const store=lieuS?'lieu':'main',{list,sha}=await load(store,pw),c=addCat(list,sec,name);await save(list,sha,'Mise a jour',store,pw);
  if(lieuS){LP=pw;lcur=list;renderLieu()}else{cur=list;await refresh()}
  fillCats();s.value=c.id}catch(e){s.value='';msg(bad(e))}};
$('#pw').onchange=async()=>{const p=$('#pw').value;if(p.length<10||$('#cat').value!=='grivois')return;try{const{list}=await load('lieu',p);LP=p;lcur=list;fillCats()}catch{}};

// Actions de la consultation (textes et catégories), pour le site principal ('main') et le lieu sûr ('lieu')
async function treeAction(ev,store){
 const b=ev.target.closest('button[data-a]');if(!b||b.disabled)return;
 const a=b.dataset.a,id=b.dataset.id,L=store==='lieu',pw=L?LP:PW,src=()=>L?lcur:cur;
 const sec=L?'grivois':'main',after=async list=>{if(L){lcur=list;renderLieu()}else await refresh()};
  if(b.dataset.by==='invite')return;
  {const tg=id&&src().find(x=>x.id===id);if(tg&&ownerOf(tg)==='invite')return}
  try{
  if(a==='edit'){const t=src().find(x=>x.id===id);if(!t)return;
   editId=t.id;$('#cat').value=L?'grivois':'main';$('#cat').onchange();$('#date').value=t.date||today();
   $('#title').value=t.title;ED.set(t.html||plainToHtml(t.body));if(L)$('#pw').value=LP;$('#catg').value=t.cat||'';ED.setLH(t.lh||null);
   upd();$('#pub').textContent=t.draft?'Publier':'Enregistrer les modifications';msg('Modification en cours.');$('#ftitle').textContent='Modifier un texte';view('new');scrollTo(0,0);return}
  let text=null,name=null,dest=null;
  if(a==='del'){const t0=src().find(x=>x.id===id);if(!await confirmBox('Supprimer définitivement « '+(t0?t0.title:'ce texte')+' » ?','Supprimer'))return;text='Texte supprimé.'}
   else if(a==='trub'){const t0=src().find(x=>x.id===id);if(!t0)return;
    dest=await askRub({text:'Où placer « '+t0.title+' » ?',ok:'Déplacer',others:catsOf(src(),sec,'moi').filter(c=>c.id!==t0.cat),none:!!t0.cat,pref:'cat'});if(!dest)return;text='Texte déplacé.'}
  else if(a==='cnew'){name=prompt('Nom de la nouvelle rubrique :');if(!name||!name.trim())return;text='Rubrique créée.'}
  else if(a==='cren'){const c=src().find(x=>x.id===id);name=prompt('Nouveau nom de la rubrique :',c?c.name:'');if(!name||!name.trim())return;text='Rubrique renommée.'}
  else if(a==='cdel'){const c=src().find(x=>x.id===id);
    const n=textsOf(src()).filter(t=>t.cat===id).length;
    if(n){dest=await chooseDest(c?c.name:'',n,catsOf(src(),sec,'moi').filter(x=>x.id!==id));if(!dest)return}
    else if(!confirm(`Supprimer la rubrique « ${c?c.name:''} » ?`))return;
    text='Rubrique supprimée.'}
const{list,sha}=await load(store,pw);let nl=list;
  if(a==='del')nl=list.filter(x=>x.id!==id);
  else if(a==='cnew')addCat(list,b.dataset.sec,name,b.dataset.by);
  else if(a==='cren')renameCat(list,id,name);
  else if(a==='cdel'){if(dest)moveTexts(list,id,dest,sec);removeCat(list,id)}
   else if(a==='trub'){const i=list.findIndex(x=>x.id===id&&!isCat(x));if(i<0)return msg('Texte introuvable.');
    const tg=dest.mode==='new'?addCat(list,sec,dest.name):dest.mode==='cat'?list.find(x=>x.id===dest.id&&isCat(x)):null;
    const e={...list[i]};if(tg)e.cat=tg.id;else delete e.cat;placeText(list,e);list[i]=e;openAt(L?'lieu-moi':'main',tg?tg.id:null)}
  else if(a==='cup'||a==='cdown')moveCat(list,id,a==='cup'?-1:1);
  else if(a==='tup'||a==='tdown')moveText(list,id,a==='tup'?-1:1);
  await save(nl,sha,'Mise a jour',store,pw);if(text)msg(text);await after(nl);
 }catch(e){msg(bad(e))}}

// Le lieu sûr (fichier séparé, son propre mot de passe)
function renderLieu(){const vis=textsOf(lcur).filter(t=>!(ownerOf(t)==='invite'&&t.draft)),m=t=>(t.date||'')+(t.draft?' · <span class="badge">brouillon</span>':'')+meta(t);
 $('#llist').innerHTML='<h2 class="rh">Mes textes</h2><p style="margin:.2rem 0 .8rem"><button class="ghost" data-a="cnew" data-sec="grivois" data-by="moi">+ Nouvelle rubrique</button></p>'
  +treeHtml({texts:vis.filter(t=>ownerOf(t)!=='invite'),cats:catsOf(lcur,'grivois','moi'),meta:m,scope:'lieu-moi',restTitle:'Sans rubrique'})
  +'<h2 class="rh">Textes de l’invité (lecture seule)</h2>'
  +treeHtml({texts:vis.filter(t=>ownerOf(t)==='invite'),cats:catsOf(lcur,'grivois','invite'),meta:m,scope:'lieu-invite',restTitle:'Sans rubrique',readonly:true});fillCats()}
$('#lieuOpen').onclick=async()=>{const p=prompt('Mot de passe du lieu sûr :');if(!p)return;
 try{const{list}=await load('lieu',p);LP=p;lcur=list;renderLieu()}catch(e){msg(bad(e))}};
$('#llist').onclick=ev=>treeAction(ev,'lieu');
// Camembert de mémoire (site principal) et sauvegarde
const LIMIT=1000000,COL={main:'var(--accent)'};
function pie(list,size){
 const by={main:0};let P=0;
 list.forEach(t=>{const b=JSON.stringify(t).length;by.main+=b;P+=b});
 let acc=0;const st=[],sh={};
 for(const k in by){sh[k]=P?size*by[k]/P:0;st.push(`${COL[k]} ${acc/LIMIT*100}% ${(acc+sh[k])/LIMIT*100}%`);acc+=sh[k]}
 st.push(`var(--line) ${Math.min(acc/LIMIT*100,100)}% 100%`);
 $('#pie').style.background=`conic-gradient(${st.join(',')})`;
 const ko=n=>fr(Math.round(n/1024))+' Ko';
 $('#leg').innerHTML=`<b>${ko(size)} utilisés sur ${ko(LIMIT)} (${Math.round(size/LIMIT*100)} %)</b><br>`
  +Object.keys(by).map(k=>`<i style="background:${COL[k]}"></i>${CATN[k]} : ${ko(sh[k])}`).join('<br>')
  +`<br><i style="background:var(--line)"></i>Espace libre : ${ko(Math.max(LIMIT-size,0))}`
  +(size>LIMIT*.7?'<br>⚠ Bientôt plein : il faudra passer à un fichier par texte.':'')}
$('#bk').onclick=ev=>{const b=ev.target.closest('button');if(b)exportCat(b.dataset.x)};
async function exportCat(x){
 const rn=t=>(catsOf(cur,'main').find(c=>c.id===t.cat)||{name:'Sans rubrique'}).name;
 let items=(x==='grivois'?[]:textsOf(cur).filter(t=>t.category!=='grivois')).map(t=>({...t,rub:rn(t)}));
 if(x==='grivois'||x==='all'){const p=prompt('Mot de passe du lieu sûr (laisser vide pour ignorer le lieu sûr) :');
  if(p){try{const L=await load('lieu',p);items=items.concat(L.list.filter(t=>!isCat(t)).map(t=>({...t,category:'grivois'})))}catch(e){return msg(bad(e))}}}
 items.sort((a,b)=>(a.date||'').localeCompare(b.date||''));
 if(!items.length)return msg('Rien à exporter.');
 const out=items.map(t=>`${t.category==='grivois'?CATN.grivois:(t.rub||CATN.main)} — ${t.title}\n${t.date||''}\n\n${t.body}`);
 const a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob([out.join('\n\n\n'+'='.repeat(40)+'\n\n\n')],{type:'text/plain;charset=utf-8'}));
 a.download=`sauvegarde-${x}-${today()}.txt`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
 msg(`${out.length} texte(s) exporté(s). Ce fichier n’est pas chiffré : rangez-le en lieu sûr.`)}

// Supprimer : texte en cours de modification -> suppression définitive ; nouveau texte -> vide le formulaire
async function delOrClear(){
 const L=$('#cat').value==='grivois';
 if(editId){
  const t=(L?lcur:cur).find(x=>x.id===editId),pw=L?($('#pw').value||LP):PW;
  if(L&&(!pw||pw.length<10))return msg('Saisissez le mot de passe du lieu sûr (10 caractères minimum).');
  if(!await confirmBox('Supprimer définitivement « '+(t?t.title:'ce texte')+' » ?','Supprimer'))return;
  try{const store=L?'lieu':'main',{list,sha}=await load(store,pw),nl=list.filter(x=>x.id!==editId);await save(nl,sha,'Mise a jour',store,pw);
   if(L){lcur=nl;renderLieu()}else await refresh();
   reset();msg('Texte supprimé.');ED.exitFull();view('list');scrollTo(0,0)}catch(e){msg(bad(e))}
 }else{
  if((ED.text()||$('#title').value.trim())&&!await confirmBox('Vider le formulaire ? Le texte saisi sera perdu.','Vider le formulaire'))return;
  reset();msg('Formulaire vidé.');ED.exitFull()}}
