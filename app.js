const $=s=>document.querySelector(s),main=$('#main');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CATS={roman:['Pour mes filles','Un roman-témoignage, écrit pour elles.'],libre:['Textes libres','Des textes posés ici, sans lien entre eux.'],grivois:['Privé','Un coin réservé. Le mot de passe est nécessaire.']};
let texts=[],plain={},lieu=[],open=false;
const OWNER=CFG.owner||(location.hostname.endsWith('github.io')?location.hostname.split('.')[0]:'');
const LIEU_URL=()=>`https://raw.githubusercontent.com/${OWNER}/${CFG.lieu}/${CFG.branch}/lieu.json?_=${Date.now()}`;
const fmt=d=>d?new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}):'';
const body=t=>esc(t).split(/\n{2,}/).map(p=>'<p>'+p.replace(/\n/g,'<br>')+'</p>').join('');
const of=c=>texts.filter(t=>t.category===c).sort((a,b)=>(a.date||'').localeCompare(b.date||'')*(c==='roman'?1:-1));
const wc=s=>(String(s).match(/\S+/g)||[]).length;
const rt=s=>'⏳ '+Math.max(1,Math.ceil(wc(s)/200))+' min de lecture';
const nrm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const list=(items,sc)=>items.length?items.map(t=>{const v=plain[t.id]||t;return `<a class="item" href="#/t/${t.id}"><b>${esc(v.title)}</b><span>${sc?CATS[t.category][0]+' · ':''}${fmt(t.date)} · ${rt(v.body)}</span></a>`}).join(''):'<p class="empty">Rien ici pour l’instant.</p>';

function home(){
 main.innerHTML='<input type="search" id="q" placeholder="Rechercher un texte…" aria-label="Rechercher un texte" autocomplete="off" style="margin-bottom:1.2rem"><div id="res"></div><div id="cats">'+Object.entries(CATS).filter(([k])=>k!=='grivois').map(([k,v])=>`<a class="item" href="#/${k}"><b>${v[0]}</b><span>${v[1]}</span></a>`).join('')+'</div>';
 $('#q').oninput=e=>{const q=nrm(e.target.value.trim());$('#cats').hidden=!!q;
  const r=q?texts.filter(t=>{const v=plain[t.id]||t;return t.category!=='grivois'&&v.title&&nrm(v.title+' '+v.body).includes(q)}):[];
  $('#res').innerHTML=q?(r.length?list(r,true):'<p class="empty">Aucun résultat.</p>'):''}}

function cat(c){
 if(c==='grivois'){main.innerHTML='<a class="back" href="#/">← Revenir</a><br><br>'+list([...lieu].sort((a,b)=>(b.date||'').localeCompare(a.date||'')));return}
 main.innerHTML=`<h1>${CATS[c][0]}</h1><p class="lead">${CATS[c][1]}</p>`+list(of(c));
}

function show(id){
 const t=texts.find(x=>x.id===id)||lieu.find(x=>x.id===id);if(!t)return home();
 const g=t.category==='grivois';if(g&&!lieuOk){location.hash='#/envers';return}
 main.innerHTML=`<a class="back" href="#/${g?'envers':t.category}">← ${g?'Le lieu sûr':CATS[t.category][0]}</a><h1 style="margin-top:1.5rem">${esc(t.title)}</h1><p class="lead">${fmt(t.date)} · ${rt(t.body)}</p><div class="text">${body(t.body)}</div>`;
}

let lieuOk=false;
function route(){
 if(!open)return;
 const h=location.hash.replace(/^#\/?/,'').split('/'),k=h[0];
 let view=k==='t'?'t':k==='envers'?'envers':(CATS[k]&&k!=='grivois')?k:'home',ask=false;
 if(view==='envers'&&!lieuOk){view='home';ask=true;history.replaceState(null,'',location.pathname+location.search+'#/')}
 const tx=view==='t'?texts.find(x=>x.id===h[1])||lieu.find(x=>x.id===h[1]):null;
 const env=view==='envers'||!!(tx&&tx.category==='grivois'&&lieuOk);
 if(!env){lieuOk=false;lieu=[]}
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
   lieu=(await unlock(o.enc,$('#dp').value)).map(x=>({...x,category:'grivois'}));
   lieuOk=true;close();location.hash==='#/envers'?route():location.hash='#/envers'}
  catch{$('#dm').textContent='Mot de passe incorrect.'}};
}
addEventListener('hashchange',route);
function gate(){
 main.innerHTML='<form id="g" class="gate"><h1>Accès privé</h1><p class="lead">Ce site est réservé.</p><input type="password" id="gp" placeholder="Mot de passe" autocomplete="current-password" aria-label="Mot de passe" autofocus><label class="show"><input type="checkbox" id="sp"> Afficher le mot de passe</label><p><button>Entrer</button></p><p class="msg" id="gm" role="status"></p></form>';
 $('#sp').onchange=e=>{$('#gp').type=e.target.checked?'text':'password'};
 $('#g').onsubmit=async e=>{e.preventDefault();$('#gm').textContent='Vérification…';
  try{const r=await fetch('content/texts.json?'+Date.now()),o=r.ok?await r.json():[];
   texts=(Array.isArray(o)?[]:await unlock(o.enc,$('#gp').value)).filter(t=>t.category!=='grivois');
   open=true;$('nav').hidden=false;route()}catch{$('#gm').textContent='Mot de passe incorrect.'}}}
gate();

// Dissuasion contre la copie (ne remplace pas le chiffrement)
const inField=e=>/^(INPUT|TEXTAREA)$/.test((e.target.tagName||''));
['contextmenu','copy','cut','dragstart','selectstart'].forEach(v=>addEventListener(v,e=>{if(!inField(e))e.preventDefault()}));
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&/^[cpsua]$/i.test(e.key)&&!/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName))e.preventDefault()});
const veil=on=>document.body.classList.toggle('veil',on);
addEventListener('blur',()=>veil(true));addEventListener('focus',()=>veil(false));
document.addEventListener('visibilitychange',()=>veil(document.hidden));
