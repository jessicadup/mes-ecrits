const $=s=>document.querySelector(s);
const CATN={roman:'Pour mes filles',libre:'Textes libres',grivois:'Le lieu sûr'};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const msg=t=>{$('#msg').textContent=t};
const today=()=>new Date().toISOString().slice(0,10);
let editId=null,cur=[],PW=null,TOK='';

const S=JSON.parse(localStorage.getItem('cfg')||'{}');
const host=location.hostname.endsWith('github.io')?location.hostname.split('.')[0]:'';
let g=location.pathname.split('/')[1];if(!g||g.endsWith('.html'))g=host?host+'.github.io':'';
const D={owner:host,repo:g,branch:'main'};
for(const k in D)$('#'+k).value=S[k]||D[k];
$('#first').hidden=!!S.tok;
const cfg=()=>({o:$('#owner').value.trim(),r:$('#repo').value.trim(),b:$('#branch').value.trim()||'main',t:TOK});

// Connexion : le mot de passe déchiffre le jeton stocké et la liste des textes
$('#unlock').onclick=async()=>{
 const p=$('#gpw').value,m=t=>$('#gmsg').textContent=t;
 if(p.length<10)return m('Mot de passe : 10 caractères minimum.');
 if(S.tok){try{TOK=(await unlock(S.tok,p)).t}catch{return m('Mot de passe incorrect.')}}
 else{if(p!==$('#gpw2').value)return m('Les deux mots de passe sont différents.');TOK=$('#token').value.trim();if(!TOK)return m('Collez le jeton GitHub.')}
 PW=p;m('Connexion…');
 try{await refresh(true);
  if(!S.tok){const c=cfg();localStorage.setItem('cfg',JSON.stringify({owner:c.o,repo:c.r,branch:c.b,tok:await lock({t:TOK},p)}))}
  $('#gate').hidden=true;$('#app').hidden=false;
 }catch(e){PW=null;m(e.name==='OperationError'?'Mot de passe incorrect.':e.message)}};

$('#sp').onchange=e=>['gpw','gpw2','token'].forEach(k=>{$('#'+k).type=e.target.checked?'text':'password'});
$('#sp2').onchange=e=>{$('#pw').type=e.target.checked?'text':'password'};

// GitHub : tout le contenu est chiffré avec le mot de passe du site avant l'envoi
const api=c=>`https://api.github.com/repos/${c.o}/${c.r}/contents/content/texts.json`;
const hd=c=>({Authorization:'Bearer '+c.t,Accept:'application/vnd.github+json'});
async function load(){const c=cfg(),r=await fetch(api(c)+'?ref='+c.b+'&_='+Date.now(),{headers:hd(c)});
 if(r.status===404)return{list:[],sha:null,size:0};
 if(!r.ok)throw new Error('GitHub a répondu '+r.status+' : vérifiez le jeton, l’identifiant et le nom du dépôt.');
 const j=await r.json(),o=JSON.parse(new TextDecoder().decode(fromB64(j.content.replace(/\n/g,''))));
 return{list:Array.isArray(o)?o:await unlock(o.enc,PW),sha:j.sha,size:j.size}}
async function save(list,sha,message){const c=cfg(),b={message,branch:c.b,content:toB64(new TextEncoder().encode(JSON.stringify({v:2,enc:await lock(list,PW)})))};
 if(sha)b.sha=sha;const r=await fetch(api(c),{method:'PUT',headers:hd(c),body:JSON.stringify(b)});
 if(!r.ok)throw new Error('L’enregistrement a échoué ('+r.status+'). Le jeton autorise-t-il l’écriture sur ce dépôt ?')}

// Formulaire
$('#date').value=today();
$('#cat').onchange=()=>{$('#pwrow').hidden=$('#cat').value!=='grivois'};
function reset(){editId=null;['title','body','pw','file'].forEach(k=>$('#'+k).value='');$('#date').value=today();$('#pub').textContent='Publier';upd()}
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
 const cat=$('#cat').value,title=$('#title').value.trim(),text=$('#body').value.trim(),date=$('#date').value;
 if(!title||!text)return msg('Il manque le titre ou le texte.');
 const e={id:editId||Date.now().toString(36),category:cat,date,n:cnt(text)};
 try{
  if(cat==='grivois'){const p=$('#pw').value;if(p.length<8)return msg('Second mot de passe : 8 caractères minimum.');e.enc=await lock({title,body:text},p)}
  else{e.title=title;e.body=text}
  msg('Publication en cours…');
  const{list,sha}=await load(),i=list.findIndex(x=>x.id===e.id);
  i>=0?list[i]=e:list.push(e);
  await save(list,sha,'Mise a jour du contenu');
  reset();msg('Publié. Le texte apparaît sur le site dans une à deux minutes.');refresh();
 }catch(err){msg(err.message)}};

async function refresh(strict){
 try{const{list,size}=await load();cur=list;pie(list,size);
  $('#list').innerHTML=list.length?[...list].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(t=>`<div class="item row"><div><b>${t.enc?'🔒 Texte privé':esc(t.title)}</b><span>${CATN[t.category]} · ${t.date||''}${meta(t)}</span></div><div style="flex:none"><button class="ghost" data-e="${t.id}">Modifier</button> <button class="ghost" data-d="${t.id}">Supprimer</button></div></div>`).join(''):'<p class="empty">Aucun texte pour l’instant.</p>';
 }catch(e){if(strict)throw e;msg(e.message)}}

$('#list').onclick=async ev=>{const b=ev.target.closest('button');if(!b)return;
 if(b.dataset.d){if(!confirm('Supprimer ce texte définitivement ?'))return;
  try{const{list,sha}=await load();await save(list.filter(x=>x.id!==b.dataset.d),sha,'Mise a jour du contenu');msg('Texte supprimé. Le site se met à jour dans une à deux minutes.');refresh()}catch(e){msg(e.message)}}
 if(b.dataset.e){const t=cur.find(x=>x.id===b.dataset.e);let v=t,p='';
  if(t.enc){p=prompt('Second mot de passe de ce texte :');if(!p)return;try{v=await unlock(t.enc,p)}catch{return msg('Mot de passe incorrect.')}}
  editId=t.id;$('#cat').value=t.category;$('#cat').onchange();$('#date').value=t.date||today();
  $('#title').value=v.title;$('#body').value=v.body;upd();$('#pw').value=p;$('#pub').textContent='Enregistrer les modifications';msg('Modification en cours.');scrollTo(0,0)}};

// Compteurs, camembert de mémoire, sauvegarde
const fr=n=>n.toLocaleString('fr-FR');
const cnt=t=>({c:t.length,w:(t.trim().match(/\S+/g)||[]).length});
const meta=t=>{const n=t.n||(t.body!=null?cnt(t.body):null);return n?` · ${fr(n.c)} caractères · ${fr(n.w)} mots · ⏳ ${Math.max(1,Math.ceil(n.w/200))} min`:''};
function upd(){const n=cnt($('#body').value);$('#cnt').textContent=n.c?`${fr(n.c)} caractères · ${fr(n.w)} mots · ⏳ ${Math.max(1,Math.ceil(n.w/200))} min de lecture`:''}
$('#body').oninput=upd;

const LIMIT=1000000,COL={roman:'var(--accent)',libre:'#8fae9b',grivois:'#c9a9a6'};
function pie(list,size){
 const by={roman:0,libre:0,grivois:0};let P=0;
 list.forEach(t=>{const b=JSON.stringify(t).length;by[t.category]=(by[t.category]||0)+b;P+=b});
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
 const items=cur.filter(t=>x==='all'||t.category===x).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
 if(!items.length)return msg('Rien à exporter dans cette catégorie.');
 let pw=null;if(items.some(t=>t.enc))pw=prompt('Second mot de passe des textes du lieu sûr (laisser vide pour les ignorer) :');
 const out=[];let skipped=0;
 for(const t of items){let v=t;
  if(t.enc){if(!pw){skipped++;continue}try{v=await unlock(t.enc,pw)}catch{skipped++;continue}}
  out.push(`${CATN[t.category]} — ${v.title}\n${t.date||''}\n\n${v.body}`)}
 if(!out.length)return msg('Aucun texte exporté (mot de passe Le lieu sûr manquant ou incorrect).');
 const a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob([out.join('\n\n\n'+'='.repeat(40)+'\n\n\n')],{type:'text/plain;charset=utf-8'}));
 a.download=`sauvegarde-${x}-${today()}.txt`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
 msg(`${out.length} texte(s) exporté(s)${skipped?`, ${skipped} ignoré(s)`:''}. Ce fichier n’est pas chiffré : rangez-le en lieu sûr.`)}
