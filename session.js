// Session des pages d'écriture (admin et invité) :
// - verrouillage après 5 minutes d'inactivité et bouton « Verrouiller » : l'écran est couvert, les mots de passe sont effacés de la mémoire, le texte en cours est conservé ;
// - les pages ouvertes depuis celle-ci (site, lieu, bibliothèque) reçoivent les mots de passe, en mémoire seulement. Une page ouverte autrement n'est pas reconnue.
function makeSession(o){
 const MS=o.ms||300000,q=s=>document.querySelector(s),kids=new Set();
 let timer=0,locked=false,ov=null,last=0;
 const on=()=>!locked&&o.isOn();
 function bump(){const n=Date.now();if(n-last<200&&timer)return;last=n;clearTimeout(timer);timer=0;if(on())timer=setTimeout(lock,MS)}
 ['pointerdown','pointermove','keydown','scroll','wheel','touchstart','input'].forEach(e=>addEventListener(e,bump,{capture:true,passive:true}));

 (function(){if(document.getElementById('lockov-css'))return;const s=document.createElement('style');s.id='lockov-css';s.textContent=
 '#lockov{position:fixed;top:0;left:0;right:0;bottom:0;z-index:5000;display:flex;align-items:center;justify-content:center;background:var(--bg,#f4f6f3);color:var(--ink,#3a3f46)}'
 +'#lockov form{width:min(22rem,88vw);text-align:center}#lockov h2{font:500 1.8rem var(--serif,Georgia,serif);margin:0 0 .4rem}#lockov p{margin:.6rem 0}'
 +'body.is-locked{overflow:hidden}';document.head.appendChild(s)})();

 function lock(){
  if(locked||!o.isOn())return;
  locked=true;clearTimeout(timer);timer=0;
  try{if(o.beforeLock)o.beforeLock()}catch{}
  o.clear();
  try{document.activeElement&&document.activeElement.blur()}catch{}
  const d=document.createElement('div');d.id='lockov';
  d.innerHTML='<form role="dialog" aria-modal="true" aria-label="Page verrouillée"><h2>Page verrouillée</h2><p>Ce que vous écriviez est conservé.</p><input type="password" id="lockpw" autocomplete="current-password" placeholder="Mot de passe" aria-label="Mot de passe"><label class="show"><input type="checkbox" id="lockshow"> Afficher le mot de passe</label><p><button type="submit">Déverrouiller</button></p><p class="msg" id="lockmsg" role="status"></p></form>';
  document.body.appendChild(d);document.body.classList.add('is-locked');ov=d;
  const app=q('#app');if(app)app.inert=true;
  d.querySelector('#lockshow').onchange=e=>{d.querySelector('#lockpw').type=e.target.checked?'text':'password'};
  d.querySelector('form').onsubmit=async e=>{e.preventDefault();
   const m=d.querySelector('#lockmsg');m.textContent='Vérification…';
   try{await o.restore(d.querySelector('#lockpw').value)}catch{m.textContent='Mot de passe incorrect.';return}
   locked=false;d.remove();ov=null;document.body.classList.remove('is-locked');if(app)app.inert=false;bump()};
  d.querySelector('#lockpw').focus()}

 // pages ouvertes depuis cette page : seules celles-là peuvent demander les mots de passe
 addEventListener('message',async ev=>{const m=ev.data;
  if(ev.origin!==location.origin||!m||!kids.has(ev.source))return;
  if(m.t==='alive'){bump();return}
  if(m.t==='lp'){if(on()&&o.onLP&&typeof m.lp==='string')o.onLP(m.lp);return}
  if(m.t!=='need-creds')return;
  const c=on()?await o.creds():null;
  ev.source.postMessage({t:'creds',sp:(c&&c.sp)||null,lp:(c&&c.lp)||null},location.origin)});
 function open(url){const w=window.open(url,'_blank');if(w)kids.add(w);return w}
 function wireLinks(sel){document.querySelectorAll(sel).forEach(a=>a.addEventListener('click',e=>{
  if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button)return;
  e.preventDefault();
  if(!open(a.href)){const t=document.createElement('a');t.href=a.href;t.target='_blank';t.rel='noopener';t.click()}}))}
 return{start:bump,lock,open,wireLinks,isLocked:()=>locked}
}
