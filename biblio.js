// Bibliothèque : lecture libre (fichier bibliotheque.json du dépôt du lieu, non chiffré) ; écriture avec le jeton déjà stocké (admin ou invité)
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nrm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const today=()=>new Date().toISOString().slice(0,10);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const OWNER=CFG.owner||(location.hostname.endsWith('github.io')?location.hostname.split('.')[0]:'');
const TYPES=['Définition','Synonymes','Astuce'],PAL=['#e8b4a0','#c9a58c','#b7c4a8','#d9c7b0','#a9b8c4','#e3c3c8','#cfa07f','#9fb09a','#d8b07a'];
const DEC=['<svg viewBox="0 0 40 50" width="40"><path d="M20 30C10 22 8 12 14 6M20 30C20 18 22 10 28 4M20 30C30 24 34 16 32 10" stroke="#7d9468" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M10 30h20l-3 16H13z" fill="#c98a68"/></svg>','<svg viewBox="0 0 44 54" width="44"><rect x="2" y="2" width="40" height="50" fill="#f3e6d3" stroke="#c9a283" stroke-width="3"/><circle cx="22" cy="24" r="8" fill="#e3b6a0"/><path d="M8 46c8-10 20-10 28 0z" fill="#a9b79c"/></svg>','<svg viewBox="0 0 24 44" width="24"><rect x="5" y="16" width="14" height="26" rx="3" fill="#f2dcb8"/><path d="M12 4c5 6 3 10 0 10s-5-4 0-10z" fill="#e9a35f"/></svg>','<svg viewBox="0 0 30 50" width="30"><path d="M11 4h8l-1 10c8 6 8 24-3 32C4 38 4 20 12 14z" fill="#a8785c"/></svg>','<svg viewBox="0 0 60 36" width="60"><path d="M4 8h52l-6 26H10z" fill="none" stroke="#8d7a6a" stroke-width="2"/><path d="M10 14h40M13 22h34M16 30h28" stroke="#8d7a6a"/><rect x="14" y="0" width="8" height="12" fill="#e3b6a0"/><rect x="24" y="2" width="8" height="10" fill="#b7c4a8"/></svg>'];
// Citations du sous-main : une au hasard à chaque ouverture (ajoutez les vôtres ici)
const QUOTES=[['Écrire, c’est une façon de parler sans être interrompu.','Jules Renard'],['Ce que l’on conçoit bien s’énonce clairement, et les mots pour le dire arrivent aisément.','Boileau'],['Le style, c’est l’homme même.','Buffon'],['Polissez-le sans cesse, et le repolissez.','Boileau']];
{const q=QUOTES[Math.floor(Math.random()*QUOTES.length)];$('#qt').textContent='« '+q[0]+' »';$('#qa').textContent=q[1]}
let D={books:[],cards:[]},WHO=null,TOK='',CS=null,cur=null,edit=false,eid=null,PG=[],ps=0;
const ED=initEditor($('#edbox'),'Écrivez la fiche ici…');
$('#fty').innerHTML=TYPES.map(t=>`<option>${t}</option>`).join('');
const norm=d=>({books:Array.isArray(d&&d.books)?d.books:[],cards:Array.isArray(d&&d.cards)?d.cards:[]});
const hash=s=>[...s].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
const bn=id=>(D.books.find(b=>b.id===id)||{name:''}).name;
const toast=t=>{const e=$('#toast');e.textContent=t;e.hidden=!t;clearTimeout(toast.t);if(t)toast.t=setTimeout(()=>{e.hidden=true},6000)};
const ovOpen=()=>!$('#veil').hidden;

// Lecture (sans mot de passe)
async function load(){try{const r=await fetch(`https://raw.githubusercontent.com/${OWNER}/${CFG.lieu}/${CFG.branch}/bibliotheque.json?_=${Date.now()}`);if(r.ok)D=norm(await r.json())}catch{}render()}

// Écriture : le mot de passe de la page admin ou invité (sur cet appareil) déchiffre le jeton
const askPw=()=>new Promise(res=>{const d=document.createElement('div');d.className='dlg';
 d.innerHTML='<div role="dialog" aria-modal="true"><p>Mot de passe de votre page (admin ou invité)</p><input type="password" id="ap" autocomplete="current-password"><p class="row"><button class="ok" type="button">Entrer</button><button class="ghost no" type="button">Annuler</button></p></div>';
 document.body.appendChild(d);const i=d.querySelector('#ap'),e=v=>{d.remove();res(v)};
 d.querySelector('.ok').onclick=()=>e(i.value);d.querySelector('.no').onclick=()=>e(null);i.onkeydown=k=>{if(k.key==='Enter')e(i.value);if(k.key==='Escape')e(null)};i.focus()});
async function auth(){if(TOK)return true;
 const A=JSON.parse(localStorage.getItem('cfg')||'null'),L=JSON.parse(localStorage.getItem('cfgL')||'null');
 if(!(A&&A.tok)&&!(L&&L.tok)){toast('Pour écrire, ouvrez d’abord votre page admin ou invité sur cet appareil.');return false}
 const pw=await askPw();if(!pw)return false;
 for(const[c,w]of[[A,'moi'],[L,'invite']])if(c&&c.tok){try{TOK=(await unlock(c.tok,pw)).t;WHO=w;CS=c;return true}catch{}}
 toast('Mot de passe incorrect.');return false}
const api=()=>`https://api.github.com/repos/${CS.owner}/${CS.repo2}/contents/bibliotheque.json`;
const hd=()=>({Authorization:'Bearer '+TOK,Accept:'application/vnd.github+json'});
// Chaque modification est appliquée sur la dernière version du fichier
async function change(fn,ok){try{
 const r=await fetch(api()+'?ref='+CFG.branch+'&_='+Date.now(),{headers:hd()});let sha=null,d=norm(null);
 if(r.ok){const j=await r.json();sha=j.sha;d=norm(JSON.parse(new TextDecoder().decode(fromB64(j.content.replace(/\n/g,'')))))}else if(r.status!==404)throw new Error('GitHub a répondu '+r.status+' : vérifiez le jeton.');
 fn(d);const b={message:'Bibliotheque',branch:CFG.branch,content:toB64(new TextEncoder().encode(JSON.stringify(d)))};if(sha)b.sha=sha;
 const w=await fetch(api(),{method:'PUT',headers:hd(),body:JSON.stringify(b)});if(!w.ok)throw new Error('L’enregistrement a échoué ('+w.status+'). Réessayez.');
 D=d;render();toast(ok);return true}catch(e){toast(e.message);return false}}

// Étagères
const spine=b=>{const h=hash(b.id+b.name),n=D.cards.filter(c=>c.book===b.id).length;
 return `<button class="spine" type="button" data-id="${b.id}" aria-label="Ouvrir le livre ${esc(b.name)}" style="background:${PAL[h%PAL.length]};height:${120+h%50}px;width:${34+Math.min(n*4,28)}px"><span>${esc(b.name)}</span></button>`};
function render(){const per=innerWidth<760?4:5,rows=Math.max(3,Math.ceil(D.books.length/per));let h='';
 for(let r=0;r<rows;r++)h+=`<div class="shelf"><div class="row-b">${D.books.slice(r*per,(r+1)*per).map(spine).join('')}<span class="dec" aria-hidden="true">${DEC[r%5]}</span></div></div>`;
 $('#shelves').innerHTML=h+(D.books.length?'':'<p class="empty" style="padding:1rem">La bibliothèque est vide. Prenez la plume pour créer un premier livre.</p>');
 if(ovOpen())view();applyQ()}
const hits=()=>{const k=nrm($('#sq').value.trim());return k?D.cards.filter(c=>nrm(c.title+' '+c.type+' '+c.body+' '+bn(c.book)).includes(k)):[]};
function applyQ(){const k=nrm($('#sq').value.trim()),s=new Set(hits().map(c=>c.book));D.books.forEach(b=>{if(k&&nrm(b.name).includes(k))s.add(b.id)});
 document.querySelectorAll('.spine').forEach(e=>{e.classList.toggle('hit',!!k&&s.has(e.dataset.id));e.classList.toggle('dim',!!k&&!s.has(e.dataset.id))})}

// Livre ouvert (ou résultats de recherche quand aucun livre n'est choisi) : les fiches sont réparties en pages
const card=(c,res)=>`<article class="fc" id="f-${c.id}"${res?` data-a="go" data-b="${c.book}" data-id="${c.id}" style="cursor:pointer"`:''}>${res?`<p class="bk2">📖 ${esc(bn(c.book))}</p>`:''}<div class="ft"><span class="tag">${esc(c.type)}</span><b>${esc(c.title)}</b></div><div class="fx">${sanitize(c.html||plainToHtml(c.body))}</div>${edit&&!res?`<p class="fa"><button type="button" data-a="fe" data-id="${c.id}">Modifier</button>${c.by===WHO?`<button type="button" data-a="fd" data-id="${c.id}">Supprimer</button>`:''}</p>`:''}</article>`;
const one=()=>innerWidth<760;
function paginate(cs,res){const pr=$('#pr'),m=document.createElement('div');m.className='pp';
 m.style.cssText='visibility:hidden;left:-9999px;top:0;width:'+pr.offsetWidth+'px;height:'+pr.offsetHeight+'px;overflow:hidden';document.body.appendChild(m);
 const out=[];let pg=[];
 for(const c of cs){const h=card(c,res);m.innerHTML=pg.map(x=>x.h).join('')+h;if(pg.length&&m.scrollHeight>m.clientHeight+1){out.push(pg);pg=[]}pg.push({h,id:c.id})}
 if(pg.length)out.push(pg);m.remove();return out}
function showPages(){const n=PG.length,sp=one()?n:Math.ceil(n/2),H=i=>PG[i]?PG[i].map(x=>x.h).join(''):'';
 ps=Math.max(0,Math.min(ps,Math.max(sp-1,0)));
 $('#pl').innerHTML=one()?'':H(ps*2);$('#pr').innerHTML=H(one()?ps:ps*2+1)||(n?'':`<p class="empty">${cur?'Ce livre est encore vide.':'Aucun résultat.'}</p>`);
 $('#pn').textContent=sp?'Page '+(ps+1)+' / '+sp:'';$('#pv').disabled=ps<=0;$('#nx').disabled=ps>=sp-1;
 if(!cur&&!n)$('#pl').innerHTML=''}
function turn(d){ps+=d;const r=$('#pr');r.classList.remove('turn');void r.offsetWidth;if(!reduce)r.classList.add('turn');showPages()}
function view(fid){const res=!cur,ba=$('#bact');let cs;
 if(res){cs=hits();$('#bt').textContent='Résultats pour « '+$('#sq').value.trim()+' »';$('#cf').textContent=''}
 else{cs=D.cards.filter(c=>c.book===cur.id).sort((a,b)=>(a.date||'').localeCompare(b.date||''));$('#bt').textContent=cur.name;$('#cf').textContent=cur.name;
  $('#bk').style.setProperty('--cc',PAL[hash(cur.id+cur.name)%PAL.length])}
 if(res)$('#bk').style.setProperty('--cc','#c4977a');
 PG=paginate(cs,res);
 if(fid){const i=PG.findIndex(p=>p.some(x=>x.id===fid));if(i>=0)ps=one()?i:i>>1}
 showPages();
 ba.hidden=res||!edit;
 if(!res&&edit){const own=cur.by===WHO&&!D.cards.some(c=>c.book===cur.id&&c.by!==WHO);
  ba.innerHTML='<button type="button" data-a="fnew">+ Nouvelle fiche</button><button type="button" class="ghost" data-a="bren">Renommer</button>'+(own?'<button type="button" class="ghost" data-a="bdel">Supprimer le livre</button>':'')}
 if(!edit||res)$('#form').hidden=true;
 if(fid){const e=document.getElementById('f-'+fid);if(e){e.classList.add('flash');e.scrollIntoView({block:'nearest'})}}}
function openBook(id,el,fid){const b=D.books.find(x=>x.id===id);if(!b)return;cur=b;edit=false;ps=0;$('#pen').setAttribute('aria-pressed','false');
 const v=$('#veil'),bk=$('#book'),k=$('#bk');v.hidden=false;v.classList.toggle('full',one());k.classList.add('closed');view(fid);
 const go=()=>k.classList.remove('closed');
 if(el&&!reduce){const a=el.getBoundingClientRect();bk.style.transition='none';bk.style.transform='none';bk.style.opacity='1';const t=bk.getBoundingClientRect();
  bk.style.transform=`translate(${a.left+a.width/2-t.left-t.width/2}px,${a.top+a.height/2-t.top-t.height/2}px) scale(${a.width/t.width},${a.height/t.height})`;bk.style.opacity='.2';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{bk.style.transition='transform .6s cubic-bezier(.2,.8,.2,1),opacity .4s';bk.style.transform='none';bk.style.opacity='1';setTimeout(go,650)}))}else go()}
function closeBook(){ED.exitFull();cur=null;edit=false;eid=null;$('#veil').hidden=true;$('#veil').classList.remove('full');$('#bfs').textContent='Plein écran';$('#form').hidden=true;$('#pen').setAttribute('aria-pressed','false')}
$('#bfs').onclick=()=>{const f=$('#veil').classList.toggle('full');$('#bfs').textContent=f?'Quitter le plein écran':'Plein écran';setTimeout(()=>view(),60)};
$('#pv').onclick=()=>turn(-1);$('#nx').onclick=()=>turn(1);

// Fiches
function openForm(c){$('#form').hidden=false;$('#ftit').value=c?c.title:'';$('#fty').value=c?c.type:TYPES[0];ED.set(c?(c.html||plainToHtml(c.body)):'');eid=c?c.id:null;
 try{$('#form').scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'})}catch{}$('#ftit').focus()}
$('#fcancel').onclick=()=>{$('#form').hidden=true;ED.exitFull();eid=null};
$('#fsave').onclick=async()=>{const title=$('#ftit').value.trim(),text=ED.text();if(!title||!text)return toast('Il manque le mot ou le texte.');
 const type=$('#fty').value,html=ED.html(),id=eid||Date.now().toString(36),bid=cur.id;
 const ok=await change(d=>{const i=d.cards.findIndex(x=>x.id===id),o=i>=0?d.cards[i]:null,e={id,book:bid,title,type,html,body:text,by:o?o.by:WHO,date:o?o.date:today()};i>=0?d.cards[i]=e:d.cards.push(e)},'Fiche enregistrée.');
 if(ok){ED.exitFull();$('#form').hidden=true;eid=null;view(id)}};

// Clics
$('#shelves').onclick=e=>{const s=e.target.closest('.spine');if(s)openBook(s.dataset.id,s)};
$('#veil').onclick=e=>{if(e.target.id==='veil'&&!$('#veil').classList.contains('full'))closeBook()};$('#bx').onclick=closeBook;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ovOpen()&&!document.querySelector('.dlg')&&!$('#edbox').querySelector('.is-full'))closeBook()});
const pgClick=async e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id;
 if(a==='go'){cur=D.books.find(x=>x.id===b.dataset.b)||null;edit=false;if(cur)view(id);return}
 const c=D.cards.find(x=>x.id===id);
 if(a==='fe'&&c)openForm(c);
 if(a==='fd'&&c&&await confirmBox('Supprimer définitivement « '+c.title+' » ?','Supprimer'))change(d=>{d.cards=d.cards.filter(x=>!(x.id===id&&x.by===WHO))},'Fiche supprimée.')};
$('#pl').onclick=pgClick;$('#pr').onclick=pgClick;
$('#bact').onclick=async e=>{const a=e.target.closest('[data-a]');if(!a||!cur)return;const id=cur.id;
 if(a.dataset.a==='fnew')openForm(null);
 if(a.dataset.a==='bren'){const n=prompt('Nouveau nom du livre :',cur.name);if(n&&n.trim())change(d=>{const b=d.books.find(x=>x.id===id);if(b)b.name=n.trim()},'Livre renommé.')}
 if(a.dataset.a==='bdel'&&await confirmBox('Supprimer le livre « '+cur.name+' » et toutes ses fiches ?','Supprimer')){if(await change(d=>{d.books=d.books.filter(x=>!(x.id===id&&x.by===WHO));d.cards=d.cards.filter(x=>x.book!==id)},'Livre supprimé.'))closeBook()}};
// Plume : édition (ou création d'un livre si aucun n'est ouvert)
$('#pen').onclick=async()=>{if(!await auth())return;
 if(cur){edit=!edit;$('#pen').setAttribute('aria-pressed',String(edit));view();toast(edit?'Mode édition : choisissez une fiche à modifier ou ajoutez-en une.':'');return}
 if(ovOpen())return;
 const n=prompt('Nom du nouveau livre :');if(n&&n.trim())change(d=>{d.books.push({id:'b'+Date.now().toString(36),name:n.trim(),by:WHO,date:today()})},'Livre créé.')};
// Loupe : recherche dans tout le contenu
$('#lens').onclick=()=>{const s=$('#sq'),on=s.hidden;s.hidden=!on;$('#lens').setAttribute('aria-pressed',String(on));
 if(on)s.focus();else{s.value='';applyQ();if(!cur&&ovOpen())closeBook()}};
$('#sq').oninput=()=>{const k=$('#sq').value.trim();applyQ();
 if(k.length>=2){cur=null;edit=false;$('#veil').hidden=false;view()}else if(!cur&&ovOpen())closeBook()};
addEventListener('resize',()=>{clearTimeout(render.t);render.t=setTimeout(render,200)});
document.addEventListener('keydown',e=>{if(ovOpen()&&$('#form').hidden&&!document.querySelector('.dlg')&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){if(e.key==='ArrowRight')turn(1);if(e.key==='ArrowLeft')turn(-1)}});
load();
