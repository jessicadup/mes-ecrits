// Écriture à deux voix : logique commune à la page admin (voix « moi ») et à la page invité (voix « invite »).
// Un texte à deux voix est une suite de passages ; chacun ne peut modifier ou supprimer que les siens.
function makeDuo(o){
 const q=s=>document.querySelector(s),ED=o.ED,who=o.who,me=who==='moi'?'moi':'inv';
 const find=(l,id)=>l.find(x=>x.id===id&&isDuo(x));
 const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
 let S={on:false,tid:null,pid:null};

 function apply(){
  const r=q('#duorecap'),t=S.tid?find(o.get(),S.tid):null;
  q('#duo').checked=S.on;q('#duo').disabled=!!S.tid;
  q('#title').readOnly=!!S.tid;q('#catrow').hidden=S.on;q('#draft').hidden=S.on;
  ED.setVoice(S.on?who:null);
  if(S.on){q('#ftitle').textContent=S.pid?'Modifier mon passage':S.tid?'Continuer le texte':'Nouveau texte à deux voix';q('#pub').textContent=S.pid?'Enregistrer les modifications':'Publier'}
  else{q('#ftitle').textContent='Nouveau texte';q('#pub').textContent='Publier'}
  if(t){r.hidden=false;
   r.innerHTML='<label>Texte déjà écrit à deux voix</label><p class="cnt">Votre couleur : <b class="vx-l vx-l-'+me+'">'+(who==='moi'?'doré':'bleu-gris')+'</b>. Vous pouvez modifier ou supprimer vos passages, pas ceux de l’autre.</p>'+duoRecap(t,who)}
  else{r.hidden=true;r.innerHTML=''}
  if(o.page)o.page(S)}

 function reset(){S={on:false,tid:null,pid:null};q('#duorow').hidden=false;apply()}
 function toggle(){if(S.tid)return;S.on=q('#duo').checked;S.pid=null;apply()}

 // « Continuer » : ouvre l'éditeur sur un texte à deux voix existant (nouveau passage à la fin)
 function start(id){
  const t=find(o.get(),id);if(!t)return o.msg('Texte introuvable.');
  o.reset();S={on:true,tid:id,pid:null};q('#title').value=t.title;apply();o.view('new');scrollTo(0,0);o.msg('')}

 // Modifier un de ses passages
 function editPart(pid){
  const t=S.tid?find(o.get(),S.tid):null,p=t&&t.parts.find(x=>x.id===pid&&x.by===who);if(!p)return o.msg('Passage introuvable.');
  S.pid=pid;ED.set(p.html||plainToHtml(p.body));ED.setLH(p.lh||null);apply();o.upd();
  try{q('#edbox').scrollIntoView({behavior:'smooth',block:'start'})}catch{}
  o.msg('Modification de votre passage.')}

 // Publier : nouveau texte à deux voix, nouveau passage ou passage modifié (toujours appliqué sur la dernière version du texte)
 async function send(){
  const title=q('#title').value.trim(),text=ED.text(),html=ED.html();
  if(!text){o.msg('Il manque le texte.');return}
  if(!title){o.msg('Il manque le titre.');return}
  if(!await confirmBox(S.tid?`Mettre en ligne ce passage de « ${title} » ?`:`Mettre en ligne « ${title} » (À quatre mains) ?`))return;
  try{
   o.msg('Enregistrement en cours…');
   const{list,sha}=await o.ld(),part={id:S.pid||uid(),by:who,date:o.today(),html,body:text},lhv=ED.getLH();if(lhv)part.lh=lhv;
   let t;
   if(S.tid){
    t=find(list,S.tid);if(!t){o.msg('Ce texte n’existe plus.');return}
    if(S.pid){const i=t.parts.findIndex(x=>x.id===S.pid&&x.by===who);if(i<0){o.msg('Passage introuvable.');return}
     part.date=t.parts[i].date||part.date;t.parts[i]=part}
    else t.parts.push(part)}
   else{const c=duoCat(list);t={id:Date.now().toString(36),date:o.date(),title,by:'duo',duo:true,cat:c.id,parts:[part]};list.push(t)}
   duoCalc(t);
   await o.sv(list,sha);o.done(list);openAt('duo','quatre');return true
  }catch(e){o.msg(o.bad(e))}}

 // Supprimer un de ses passages (depuis l'éditeur)
 async function delPart(pid){
  if(!S.tid)return;
  if(!await confirmBox('Supprimer ce passage ? Il sera retiré définitivement.','Supprimer'))return;
  try{
   const{list,sha}=await o.ld(),x=find(list,S.tid);if(!x){o.msg('Ce texte n’existe plus.');return}
   x.parts=x.parts.filter(p=>!(p.id===pid&&p.by===who));
   const gone=!x.parts.length;if(gone)list.splice(list.indexOf(x),1);else duoCalc(x);
   await o.sv(list,sha);o.done(list);
   if(gone){o.reset();ED.exitFull();o.view('list');scrollTo(0,0)}
   else{S.pid=null;ED.clear();ED.resetLH();apply();o.upd()}
   o.msg('Passage supprimé.')
  }catch(e){o.msg(o.bad(e))}}

 // Supprimer le texte (depuis la liste) : seulement ses propres passages ; ceux de l'autre sont conservés
 async function delMine(tid){
  const t=find(o.get(),tid);if(!t)return;
  const others=t.parts.some(p=>p.by!==who);
  if(!await confirmBox(others?`Supprimer vos passages de « ${t.title} » ? Ceux de l’autre sont conservés.`:`Supprimer définitivement « ${t.title} » ?`,'Supprimer'))return;
  try{
   const{list,sha}=await o.ld(),x=find(list,tid);if(!x){o.msg('Ce texte n’existe plus.');return}
   x.parts=x.parts.filter(p=>p.by!==who);
   if(!x.parts.length)list.splice(list.indexOf(x),1);else duoCalc(x);
   await o.sv(list,sha);o.done(list);
   if(S.tid===tid)o.reset();
   o.msg(others?'Vos passages ont été supprimés.':'Texte supprimé.')
  }catch(e){o.msg(o.bad(e))}}

 async function act(a,id){if(a==='dcont')return start(id);if(a==='ddel')return delMine(id)}

 q('#duorecap').onclick=ev=>{const b=ev.target.closest('button[data-a]');if(!b)return;
  if(b.dataset.a==='pedit')editPart(b.dataset.p);else if(b.dataset.a==='pdel')delPart(b.dataset.p)};

 return{on:()=>S.on,pid:()=>S.pid,toggle,reset,start,send,delPart,act}
}
