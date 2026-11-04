const $=s=>document.querySelector(s),main=$('#main');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CATS={roman:['Pour mes filles','Un roman-témoignage, écrit pour elles.'],libre:['Textes libres','Des textes posés ici, sans lien entre eux.'],grivois:['Privé','Un coin réservé. Le mot de passe est nécessaire.']};
let texts=[],plain={},lieu=[],mcats=[],lieuCats=[],open=false;
const OWNER=CFG.owner||(location.hostname.endsWith('github.io')?location.hostname.split('.')[0]:'');
const LIEU_URL=()=>`https://raw.githubusercontent.com/${OWNER}/${CFG.lieu}/${CFG.branch}/lieu.json?_=${Date.now()}`;
const fmt=d=>d?new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}):'';
const body=t=>esc(t).split(/\n{2,}/).map(p=>'<p>'+p.replace(/\n/g,'<br>')+'</p>').join('');
const of=c=>texts.filter(t=>t.category===c).sort((a,b)=>(a.date||'').localeCompare(b.date||'')*(c==='roman'?1:-1));
const KNOT={e:'<svg class="knot" viewBox="0 0 32 16" width="34" height="17" style="width:1.9em;height:.95em;vertical-align:-.14em;margin-right:.5em;color:var(--accent);flex:none" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M16 8C9.5 1.5 1.5 3 1.5 8C1.5 13 9.5 14.5 16 8"/><path d="M16 8C22.5 1.5 30.5 3 30.5 8C30.5 13 22.5 14.5 16 8"/><path d="M13 10.6L19 5.4" stroke="var(--bg)" stroke-width="4.4"/><path d="M13 10.6L19 5.4"/></svg>',c:'<svg class="knot" viewBox="-1 1.5 26 21" width="26" height="21" style="width:1.3em;height:1.05em;vertical-align:-.16em;margin-right:.5em;color:var(--accent);flex:none" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><ellipse cx="9" cy="12" rx="7.5" ry="6"/><ellipse cx="15" cy="12" rx="7.5" ry="6" stroke="var(--bg)" stroke-width="4.4"/><ellipse cx="15" cy="12" rx="7.5" ry="6"/><path d="M13.8 7.4A7.5 6 0 0 0 9.65 6" stroke="var(--bg)" stroke-width="4.4"/><path d="M13.8 7.4A7.5 6 0 0 0 9.65 6"/><path d="M3.2 16L1 21M20.8 8L23 3"/></svg>'};
const knot=t=>t.category==='grivois'?(t.by==='invite'?KNOT.c:KNOT.e):'';
const sortD=l=>[...l].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
const wc=s=>(String(s).match(/\S+/g)||[]).length;
const rt=s=>'⏳ '+Math.max(1,Math.ceil(wc(s)/200))+' min de lecture';
const nrm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const list=(items,sc)=>items.length?items.map(t=>{const v=plain[t.id]||t;return `<a class="item" href="#/t/${t.id}"><b>${knot(t)}${esc(v.title)}</b><span>${sc?CATS[t.category][0]+' · ':''}${fmt(t.date)} · ${rt(v.body)}</span></a>`}).join(''):'<p class="empty">Rien ici pour l’instant.</p>';

// Accordéon des catégories : seuls les noms s'affichent, un clic déplie la liste des textes (styles intégrés ici)
(function(){if(document.getElementById('acc-css'))return;const s=document.createElement('style');s.id='acc-css';s.textContent=`
.acc{border:1px solid var(--line,#dde2dc);border-radius:8px;margin:0 0 .8rem;overflow:hidden}
.acc-h{display:flex;align-items:center;gap:.8rem;width:100%;box-sizing:border-box;margin:0;padding:1rem 1.1rem;background:none;border:0;border-radius:0;color:inherit;font:inherit;text-align:left;cursor:pointer}
.acc-h:hover{background:rgba(122,106,128,.08)}
.acc-n{font:500 1.45rem/1.2 var(--serif,Georgia,serif)}
.acc-c{font-size:.85rem;color:var(--soft,#6f7780)}
.acc-h .arr{order:-1;flex:none;width:.55rem;height:.55rem;border-right:2px solid var(--accent,#7a6a80);border-bottom:2px solid var(--accent,#7a6a80);transform:rotate(-45deg);transition:transform .3s ease}
.acc-h[aria-expanded=true] .arr{transform:rotate(45deg)}
.acc-r .acc-h{justify-content:flex-end;text-align:right}
.acc-r .acc-h .arr{order:1;transform:rotate(135deg)}
.acc-r .acc-h[aria-expanded=true] .arr{transform:rotate(45deg)}
.acc-b{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s ease}
.acc-b.open{grid-template-rows:1fr}
.acc-i{min-height:0;overflow:hidden;padding:0 1.1rem;visibility:hidden;transition:visibility 0s .35s}
.acc-b.open .acc-i{visibility:visible;transition:visibility 0s}
@media(prefers-reduced-motion:reduce){.acc-b,.acc-h .arr{transition:none}.acc-i{transition:none}}
`;document.head.appendChild(s)})();
const openSet=new Set();
function acc(key,name,count,inner){const o=openSet.has(key);
 return `<div class="acc${key.startsWith('lieu-invite')?' acc-r':''}" data-k="${esc(key)}"><button type="button" class="acc-h" aria-expanded="${o}"><span class="acc-n">${esc(name)}</span><span class="acc-c">${count} texte${count>1?'s':''}</span><span class="arr" aria-hidden="true"></span></button><div class="acc-b${o?' open':''}"><div class="acc-i">${inner}</div></div></div>`}
function grouped(items,cats,rule,scope){
 const{g,rest}=groupTexts(items,cats),shown=g.filter(x=>x.items.length);
 if(!shown.length)return list([...rest].sort(rule));
 let h='';
 shown.forEach(x=>{h+=acc(scope+':'+x.cat.id,x.cat.name,x.items.length,list(x.items))});
 if(rest.length)h+=acc(scope+':none','Sans catégorie',rest.length,list([...rest].sort(rule)));
 return h}
main.addEventListener('click',e=>{const h=e.target.closest('.acc-h');if(!h)return;
 const box=h.parentElement,b=box.querySelector('.acc-b'),o=!b.classList.contains('open');
 b.classList.toggle('open',o);h.setAttribute('aria-expanded',String(o));o?openSet.add(box.dataset.k):openSet.delete(box.dataset.k)});

function home(){
 main.innerHTML='<input type="search" id="q" placeholder="Rechercher un texte…" aria-label="Rechercher un texte" autocomplete="off" style="margin-bottom:1.2rem"><div id="res"></div><div id="cats">'+Object.entries(CATS).filter(([k])=>k!=='grivois').map(([k,v])=>`<a class="item" href="#/${k}"><b>${v[0]}</b><span>${v[1]}</span></a>`).join('')+'</div>';
 $('#q').oninput=e=>{const q=nrm(e.target.value.trim());$('#cats').hidden=!!q;
  const r=q?texts.filter(t=>{const v=plain[t.id]||t;return t.category!=='grivois'&&v.title&&nrm(v.title+' '+v.body).includes(q)}):[];
  $('#res').innerHTML=q?(r.length?list(r,true):'<p class="empty">Aucun résultat.</p>'):''}}

function cat(c){
 if(c==='grivois'){
  const mine=sortD(lieu.filter(x=>x.by!=='invite')),his=sortD(lieu.filter(x=>x.by==='invite'));
  const cp=innerWidth<=900;
  main.innerHTML='<a class="back" href="#/">← Revenir</a><div class="mir" style="display:flex;flex-direction:column;gap:2.5rem;margin-top:2rem;'+(cp?'padding:0 36px;':'')+'"><section class="mine" style="text-align:left;min-height:'+(cp?'8rem':'16rem')+'">'+(lieu.length?(mine.length?grouped(mine,catsOf(lieuCats,'grivois','moi'),(a,b)=>(b.date||'').localeCompare(a.date||''),'lieu-moi'):''):'<p class="empty">Rien ici pour l’instant.</p>')+'</section><section class="his" style="text-align:right;min-height:'+(cp?'10rem':'20rem')+'">'+(his.length?grouped(his,catsOf(lieuCats,'grivois','invite'),(a,b)=>(b.date||'').localeCompare(a.date||''),'lieu-invite'):'')+'</section></div>';return}
 main.innerHTML=`<h1>${CATS[c][0]}</h1><p class="lead">${CATS[c][1]}</p>`+(of(c).length?grouped(of(c),catsOf(mcats,c),(a,b)=>(a.date||'').localeCompare(b.date||'')*(c==='roman'?1:-1),c):'<p class="empty">Rien ici pour l’instant.</p>');
}

function show(id){
 const t=texts.find(x=>x.id===id)||lieu.find(x=>x.id===id);if(!t)return home();
 const g=t.category==='grivois';if(g&&!lieuOk){location.hash='#/envers';return}
 let top='',nav='';
 if(t.cat){const c=(g?lieuCats:mcats).find(x=>x.id===t.cat),sib=siblings(t,g?lieu:texts),i=sib.findIndex(x=>x.id===t.id);
  if(c&&i>=0){top=`<p class="catline" style="margin:1.4rem 0 0;color:var(--accent);font-size:.9rem">${esc(c.name)} · ${i+1} / ${sib.length}</p>`;
   const bs='display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;min-height:2.8rem;padding:0 1.2rem;border:1px solid var(--line);border-radius:6px;text-decoration:none;color:var(--ink);flex:1 1 13rem;text-align:center';
   nav=`<div class="chnav" style="display:flex;flex-wrap:wrap;gap:.7rem;margin-top:2.5rem">${i>0?`<a class="chbtn" style="${bs}" href="#/t/${sib[i-1].id}">← Chapitre précédent</a>`:'<span style="flex:1 1 13rem"></span>'}${i<sib.length-1?`<a class="chbtn" style="${bs}" href="#/t/${sib[i+1].id}">Chapitre suivant →</a>`:'<span style="flex:1 1 13rem"></span>'}</div>`}}
 main.innerHTML=`<a class="back" href="#/${g?'envers':t.category}">← ${g?'Le lieu sûr':CATS[t.category][0]}</a>${top}<h1 style="margin-top:${top?'.4rem':'1.5rem'}">${knot(t)}${esc(t.title)}</h1><p class="lead">${fmt(t.date)} · ${rt(t.body)}</p><div class="text">${t.html?sanitize(t.html):body(t.body)}</div>${nav}`;
}

let lieuOk=false;
function route(){
 if(!open)return;
 const h=location.hash.replace(/^#\/?/,'').split('/'),k=h[0];
 let view=k==='t'?'t':k==='envers'?'envers':(CATS[k]&&k!=='grivois')?k:'home',ask=false;
 if(view==='envers'&&!lieuOk){view='home';ask=true;history.replaceState(null,'',location.pathname+location.search+'#/')}
 const tx=view==='t'?texts.find(x=>x.id===h[1])||lieu.find(x=>x.id===h[1]):null;
 const env=view==='envers'||!!(tx&&tx.category==='grivois'&&lieuOk);
 if(!env){lieuOk=false;lieu=[];lieuCats=[]}
 document.body.classList.toggle('envers',env);
 document.querySelector('.brand').textContent=document.title=env?'Le lieu sûr':'Mots après maux';
 document.body.classList.toggle('home',view==='home');
 document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.hash==='#/'+k));
 scrollTo(0,0);
 if(view==='t')return show(h[1]);
 if(view==='envers')return cat('grivois');
 view==='home'?home():cat(view);
 if(ask)openDoor();
}
function openDoor(){
 if($('#door'))return;
 const d=document.createElement('div');d.id='door';
 d.innerHTML='<form role="dialog" aria-modal="true" aria-label="Accès"><input type="password" id="dp" placeholder="Mot de passe" autocomplete="current-password" aria-label="Mot de passe"><label class="show"><input type="checkbox" id="dsp"> Afficher le mot de passe</label><p><button>Entrer</button> <button type="button" class="ghost" id="dc">Annuler</button></p><p class="msg" id="dm" role="status"></p></form>';
 document.body.appendChild(d);
 const close=()=>d.remove();
 $('#dp').focus();
 $('#dsp').onchange=e=>{$('#dp').type=e.target.checked?'text':'password'};
 $('#dc').onclick=close;
 d.onclick=e=>{if(e.target===d)close()};
 d.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 d.querySelector('form').onsubmit=async e=>{e.preventDefault();$('#dm').textContent='Vérification…';
  try{const r=await fetch(LIEU_URL());if(!r.ok)throw 0;const o=await r.json();
   {const all=await unlock(o.enc,$('#dp').value);lieuCats=all.filter(isCat);lieu=all.filter(x=>!isCat(x)&&!x.draft).map(x=>({...x,category:'grivois'}))}
   lieuOk=true;close();location.hash==='#/envers'?route():location.hash='#/envers'}
  catch{$('#dm').textContent='Mot de passe incorrect.'}};
}
addEventListener('hashchange',route);
function gate(){
 main.innerHTML='<form id="g" class="gate"><h1>Accès privé</h1><p class="lead">Ce site est réservé.</p><input type="password" id="gp" placeholder="Mot de passe" autocomplete="current-password" aria-label="Mot de passe" autofocus><label class="show"><input type="checkbox" id="sp"> Afficher le mot de passe</label><p><button>Entrer</button></p><p class="msg" id="gm" role="status"></p></form>';
 $('#sp').onchange=e=>{$('#gp').type=e.target.checked?'text':'password'};
 $('#g').onsubmit=async e=>{e.preventDefault();$('#gm').textContent='Vérification…';
  try{const r=await fetch('content/texts.json?'+Date.now()),o=r.ok?await r.json():[];
   {const all=Array.isArray(o)?[]:await unlock(o.enc,$('#gp').value);mcats=all.filter(isCat);texts=all.filter(t=>!isCat(t)&&t.category!=='grivois'&&!t.draft)}
   open=true;$('nav').hidden=false;route()}catch{$('#gm').textContent='Mot de passe incorrect.'}}}
gate();

// Dissuasion contre la copie (ne remplace pas le chiffrement)
const inField=e=>/^(INPUT|TEXTAREA)$/.test((e.target.tagName||''));
['contextmenu','copy','cut','dragstart','selectstart'].forEach(v=>addEventListener(v,e=>{if(!inField(e))e.preventDefault()}));
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&/^[cpsua]$/i.test(e.key)&&!/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName))e.preventDefault()});
const veil=on=>document.body.classList.toggle('veil',on);
addEventListener('blur',()=>veil(true));addEventListener('focus',()=>veil(false));
document.addEventListener('visibilitychange',()=>veil(document.hidden));
