// Minuteur « tomate » (méthode Pomodoro) et suivi de la session d'écriture (pages admin et invité).
// Seul le temps passé en phase d'écriture compte : temps, tomates terminées, mots et caractères tapés dans l'éditeur
// (ni collage ni fichier importé ; les suppressions ne retranchent rien). Historique gardé sur l'appareil (localStorage).
(function(){if(document.getElementById('pomo-css'))return;const s=document.createElement('style');s.id='pomo-css';s.textContent=`
.pchip{display:inline-flex;align-items:center;gap:.4rem;height:2.2rem;margin:0 auto 0 0;padding:0 .8rem;font-size:.85rem;line-height:1;background:none;color:var(--ink,#3a3f46);border:1px solid #aeb8ad;border-radius:999px;cursor:pointer}
.pchip:hover{border-color:var(--accent,#7a6a80)}
.pchip.run{border-color:#c9402d}.pchip.run.short{border-color:#6aa253}.pchip.run.long{border-color:#5d8fc6}
.pchip .pt,.pmini .pt{font-variant-numeric:tabular-nums;font-weight:600}
.pmini{display:inline-flex;align-items:center;gap:.4rem;height:2rem;padding:0 .7rem;margin:0 .5rem 0 0;font-size:.85rem;line-height:1;background:none;color:var(--ink,#3a3f46);border:1px solid var(--line,#dde2dc);border-radius:999px;cursor:pointer}
.pchip svg,.pmini svg{flex:none}
#lock .pmini{width:auto;padding:0 .6rem;justify-content:flex-start;color:var(--ink,#3a3f46)}#lock .pmini .pt{display:inline}
.pomo-card{position:relative;max-height:90vh;overflow:auto}
.pomo-card .pclose{position:absolute;top:.6rem;right:.6rem;padding:.2rem .6rem}
.pomo-card .pph{margin:.2rem 0 .6rem;color:var(--soft,#6f7780)}
.pomo-card .pbtns{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center;margin:.8rem 0}
.pomo-card .pbtns button{padding:.55rem 1rem;font-size:.92rem}
.pomo-card .pcnt{font-size:.9rem;margin:.5rem 0;line-height:1.5}
.pomo-card .pcnt b{font-weight:600}
.pomo-card details{margin-top:1rem;text-align:left}
.pomo-card .pset label{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin:.4rem 0}
.pomo-card .pset input[type=number]{width:5rem}
.pomo-card .pset input[type=checkbox]{width:auto}
@media(prefers-reduced-motion:no-preference){.pchip.run svg{animation:pbeat 2s ease-in-out infinite}}
@keyframes pbeat{50%{transform:scale(1.12)}}
`;document.head.appendChild(s)})();

function makePomo(o){
 const ED=o.ED,K=o.key,LOGK=K+'log',SETK=K+'set',q=s=>document.querySelector(s),ed=ED.el,T0=document.title;
 const DEF={work:25,short:5,long:15,every:4,chime:true};
 const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v&&typeof v==='object'?v:d}catch{return d}};
 const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
 let SET={...DEF,...ld(SETK,{})};
 const dur=ph=>Math.round(+(ph==='work'?SET.work:ph==='short'?SET.short:SET.long)*60000);
 let S={phase:'work',running:false,end:0,left:dur('work'),cycle:0,sess:null,last:0,...ld(K,{})};
 let pend={ms:0,p:0,c:0,w:0,s:0},iv=0,ctx=null,dirty=false,needRebase=true,lc=0,lw=0,panel=null,uid=0;
 const persist=()=>sv(K,S);
 const pad=n=>String(n).padStart(2,'0');
 const fmt=ms=>{const s=Math.ceil(ms/1000);return pad(Math.floor(s/60))+':'+pad(s%60)};
 const dm=ms=>{const m=Math.round(ms/60000);return m>=60?Math.floor(m/60)+' h '+pad(m%60):m+' min'};
 const nf=n=>Math.round(n).toLocaleString('fr-FR');

 // ---------- compteurs de l'éditeur ----------
 ed.addEventListener('input',()=>{dirty=true});
 ed.addEventListener('paste',()=>{needRebase=true;dirty=true});
 ed.addEventListener('ed-rebase',()=>{needRebase=true;dirty=true});
 function count(){
  if(!(dirty||needRebase))return;
  const t=ed.innerText!==undefined?ed.innerText:ed.textContent,c=t.replace(/[\r\n]+/g,'').length,w=wordsOf(t);
  if(needRebase){needRebase=false}
  else if(S.sess){const dc=Math.max(0,c-lc),dw=Math.max(0,w-lw);if(dc){S.sess.c+=dc;pend.c+=dc}if(dw){S.sess.w+=dw;pend.w+=dw}}
  lc=c;lw=w;dirty=false}

 // ---------- historique du jour (appareil) ----------
 function flush(){
  if(!(pend.ms||pend.c||pend.w||pend.p||pend.s))return;
  const L=ld(LOGK,{}),d=localDay(),r=L[d]||(L[d]={ms:0,p:0,c:0,w:0,s:0});
  r.ms+=pend.ms;r.p+=pend.p;r.c+=pend.c;r.w+=pend.w;r.s+=pend.s;sv(LOGK,L);pend={ms:0,p:0,c:0,w:0,s:0}}
 const today=()=>{const r=ld(LOGK,{})[localDay()]||{ms:0,p:0,c:0,w:0,s:0};return{ms:r.ms+pend.ms,p:r.p+pend.p,c:r.c+pend.c,w:r.w+pend.w,s:r.s+pend.s}};

 // ---------- minuteur ----------
 function chime(){
  if(!SET.chime)return;
  try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=ctx||(ctx=new A());
   [880,1175].forEach((f,i)=>{const t=c.currentTime+i*.28,os=c.createOscillator(),g=c.createGain();os.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.2,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+.55);os.connect(g);g.connect(c.destination);os.start(t);os.stop(t+.6)})}catch{}}
 function ensure(){if(S.running&&!iv)iv=setInterval(tick,1000);if(!S.running&&iv){clearInterval(iv);iv=0}}
 function accrue(upto){
  if(S.running&&S.phase==='work'&&S.sess){const dt=Math.max(0,upto-(S.last||upto));S.sess.ms+=dt;pend.ms+=dt;count()}
  S.last=upto}
 // fin de phase (la phase d'écriture donne une tomate et lance la pause ; la pause se termine sans relancer l'écriture)
 function complete(){
  if(S.phase==='work'){
   if(S.sess){S.sess.p++;pend.p++}
   S.cycle++;const nx=S.cycle>=SET.every?'long':'short';
   S.phase=nx;S.running=true;S.last=Date.now();S.end=S.last+dur(nx);
   chime();o.msg('Tomate terminée ! '+(nx==='long'?'Pause longue.':'Pause.'))}
  else{
   if(S.phase==='long')S.cycle=0;
   S.phase='work';S.running=false;S.left=dur('work');
   chime();o.msg('Pause terminée : à vos plumes !')}
  persist();flush();ensure()}
 function tick(){
  const now=Date.now();
  if(S.running){accrue(Math.min(now,S.end));if(now>=S.end)complete()}
  render()}
 function start(){
  if(S.running)return;
  try{const A=window.AudioContext||window.webkitAudioContext;if(A&&!ctx)ctx=new A();if(ctx&&ctx.resume)ctx.resume()}catch{}
  if(!S.sess){S.sess={start:Date.now(),ms:0,p:0,c:0,w:0};pend.s++}
  const now=Date.now();S.end=now+S.left;S.last=now;S.running=true;needRebase=true;dirty=true;count();
  persist();ensure();render()}
 function pause(){
  if(!S.running)return;tick();if(!S.running)return;
  S.left=Math.max(0,S.end-Date.now());S.running=false;persist();flush();ensure();render()}
 async function stop(){
  if(!S.sess)return;
  if(!await confirmBox('Arrêter la session ? Les chiffres du jour sont conservés.','Arrêter'))return;
  tick();flush();S.sess=null;S.running=false;S.phase='work';S.cycle=0;S.left=dur('work');persist();ensure();render()}
 function skip(){
  if(!S.sess)return;
  if(S.phase==='work'){if(S.running)tick();else S.last=Date.now();complete()}
  else{if(S.phase==='long')S.cycle=0;S.phase='work';S.running=false;S.left=dur('work');persist();ensure();render()}}

 // ---------- dessin ----------
 function tomato(frac,ph,txt,sz,ring){
  const id='tg'+(++uid),C=2*Math.PI*54,off=C*(1-Math.min(1,Math.max(0,frac)));
  const col=ph==='work'?['#ef6a52','#c9402d']:ph==='short'?['#9ccc7a','#6aa253']:['#8db6e3','#5d8fc6'];
  return `<svg viewBox="0 0 120 120" width="${sz}" height="${sz}" role="img" aria-label="${txt||'Tomate'}"><defs><radialGradient id="${id}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="${col[0]}"/><stop offset="1" stop-color="${col[1]}"/></radialGradient></defs>`
   +(ring?`<circle cx="60" cy="60" r="54" fill="none" stroke="var(--line,#dde2dc)" stroke-width="6"/><circle cx="60" cy="60" r="54" fill="none" stroke="${col[1]}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 60 60)"/>`:'')
   +`<ellipse cx="60" cy="66" rx="38" ry="34" fill="url(#${id})"/><ellipse cx="47" cy="52" rx="9" ry="5" fill="#fff" opacity=".28" transform="rotate(-25 47 52)"/>`
   +`<path d="M60 33c-3 7-12 9-19 8 6 3 11 8 19 7 8 1 13-4 19-7-7 1-16-1-19-8z" fill="#5f9a4a"/><path d="M60 36c0-6 2-10 6-13" stroke="#4d7f3b" stroke-width="3" fill="none" stroke-linecap="round"/>`
   +(txt?`<text x="60" y="75" text-anchor="middle" font-size="19" font-weight="700" fill="#fff" stroke="rgba(0,0,0,.25)" stroke-width=".6">${txt}</text>`:'')+`</svg>`}
 const label=()=>S.phase==='work'?'Écriture · tomate '+(S.cycle+1)+' sur '+SET.every:S.phase==='short'?'Pause courte':'Pause longue';

 // pastille dans l'éditeur et dans la barre du haut
 const head=q('.edhead'),chip=document.createElement('button');chip.type='button';chip.className='pchip';chip.setAttribute('aria-label','Minuteur tomate');
 if(head)head.insertBefore(chip,head.firstChild);
 chip.onmousedown=e=>e.preventDefault();chip.onclick=()=>open();
 const bar=q('#lock'),mini=document.createElement('button');mini.type='button';mini.className='pmini';mini.hidden=true;mini.setAttribute('aria-label','Minuteur tomate');
 if(bar)bar.insertBefore(mini,bar.firstChild);
 mini.onclick=()=>open();

 function render(){
  const now=Date.now(),rem=S.running?Math.max(0,S.end-now):S.left,tot=dur(S.phase)||1,frac=1-rem/tot,t=fmt(rem);
  const inner=tomato(0,S.phase,'',22,false)+'<span class="pt">'+t+'</span>';
  chip.className='pchip '+S.phase+(S.running?' run':'');chip.innerHTML=inner;
  mini.hidden=!S.sess;mini.innerHTML=inner;
  document.title=S.running?'🍅 '+t+' · '+T0:T0;
  if(panel)renderPanel(frac,rem,t)}

 function renderPanel(frac,rem,t){
  const dyn=panel.querySelector('.pdyn');if(!dyn)return;
  const fresh=S.phase==='work'&&!S.running&&S.left===dur('work');
  const bt=S.running?'<button type="button" data-p="pause">⏸ Pause</button>':'<button type="button" data-p="start">▶ '+(!S.sess?'Démarrer':fresh?'Nouvelle tomate':'Reprendre')+'</button>';
  const sk=S.sess?'<button type="button" class="ghost" data-p="skip">⏭ '+(S.phase==='work'?'Terminer cette tomate':'Passer la pause')+'</button>':'';
  const st=S.sess?'<button type="button" class="ghost" data-p="stop">⏹ Arrêter la session</button>':'';
  const se=S.sess,td=today();
  dyn.innerHTML=`<div>${tomato(frac,S.phase,t,170,true)}</div><p class="pph">${label()}${S.running?'':S.sess?' · en pause':''}</p><p class="pbtns">${bt}${sk}${st}</p>`
   +(se?`<p class="pcnt"><b>Cette session</b> : ${se.p} 🍅 · ${dm(se.ms)} · ${nf(se.w)} mot${se.w>1?'s':''} · ${nf(se.c)} caractère${se.c>1?'s':''}</p>`:'<p class="pcnt">Lancez le minuteur quand vous décidez d’écrire : seul le temps d’écriture est compté.</p>')
   +`<p class="pcnt"><b>Aujourd’hui</b> (cet appareil) : ${td.p} 🍅 · ${dm(td.ms)} · ${nf(td.w)} mot${td.w>1?'s':''} · ${nf(td.c)} caractère${td.c>1?'s':''}</p>`}

 function open(){
  if(panel)return;
  const d=document.createElement('div');d.className='dlg pomo-dlg';
  d.innerHTML=`<div role="dialog" aria-modal="true" aria-label="Minuteur tomate" class="pomo-card"><button type="button" class="ghost pclose" aria-label="Fermer">✕</button><div class="pdyn"></div>
  <details class="pset"><summary>Réglages</summary>
   <label>Écriture (minutes)<input type="number" min="1" max="120" step="1" data-k="work"></label>
   <label>Pause courte (minutes)<input type="number" min="1" max="60" step="1" data-k="short"></label>
   <label>Pause longue (minutes)<input type="number" min="1" max="120" step="1" data-k="long"></label>
   <label>Pause longue toutes les (tomates)<input type="number" min="2" max="12" step="1" data-k="every"></label>
   <label>Carillon à la fin d’une phase<input type="checkbox" data-k="chime"></label></details></div>`;
  (document.fullscreenElement||document.webkitFullscreenElement||document.body).appendChild(d);panel=d;
  d.querySelectorAll('[data-k]').forEach(i=>{const k=i.dataset.k;if(i.type==='checkbox')i.checked=!!SET[k];else i.value=SET[k]})
  d.onclick=e=>{
   if(e.target===d)return close();
   const b=e.target.closest('button');if(!b)return;
   if(b.classList.contains('pclose'))return close();
   const a=b.dataset.p;if(a==='start')start();else if(a==='pause')pause();else if(a==='skip')skip();else if(a==='stop')stop()};
  d.onchange=e=>{const i=e.target.closest('[data-k]');if(!i)return;const k=i.dataset.k;
   if(i.type==='checkbox')SET[k]=i.checked;else{const v=Math.round(+i.value);if(!(v>=+i.min&&v<=+i.max)){i.value=SET[k];return}SET[k]=v}
   sv(SETK,SET);if(!S.sess&&!S.running)S.left=dur('work');persist();render()};
  d.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  render();const f=d.querySelector('.pbtns button');if(f)f.focus()}
 function close(){if(panel){panel.remove();panel=null}}

 // reprise après rechargement de la page
 if(S.running){const now=Date.now();
  if(now>=S.end){if(S.phase==='work'&&S.sess){accrue(S.end);S.sess.p++;pend.p++;S.cycle++;if(S.cycle>=SET.every)S.cycle=0}else if(S.phase==='long')S.cycle=0;
   S.phase='work';S.running=false;S.left=dur('work');flush();persist()}
  else{S.last=Math.max(S.last||now,now-1000)}}
 ensure();render();
 addEventListener('visibilitychange',()=>{if(document.hidden){if(S.running)accrue(Math.min(Date.now(),S.end));flush();persist()}else tick()});
 addEventListener('beforeunload',()=>{if(S.running)accrue(Math.min(Date.now(),S.end));flush();persist()});
 return{tick,open,close,start,pause,skip,stop,state:()=>S,log:()=>ld(LOGK,{}),settings:()=>SET}
}
