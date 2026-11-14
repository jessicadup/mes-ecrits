// Catégories / chapitres : stockées comme éléments {kind:'cat'} dans le même fichier chiffré que les textes
const isCat=x=>!!x&&x.kind==='cat';
const textsOf=l=>l.filter(x=>!isCat(x));
const ownerOf=x=>x.by||'moi';
const byOrder=(a,b)=>((a.ord==null?1e9:a.ord)-(b.ord==null?1e9:b.ord))||(a.date||'').localeCompare(b.date||'')||String(a.id).localeCompare(String(b.id));
const catsOf=(l,sec,by)=>l.filter(x=>isCat(x)&&x.section===sec&&(by==null||ownerOf(x)===by)).sort((a,b)=>(a.order||0)-(b.order||0));
function groupTexts(texts,cats){const known=new Set(cats.map(c=>c.id));
 return{g:cats.map(c=>({cat:c,items:texts.filter(t=>t.cat===c.id).sort(byOrder)})),rest:texts.filter(t=>!t.cat||!known.has(t.cat))}}
const siblings=(t,pool)=>pool.filter(x=>!isCat(x)&&x.cat===t.cat&&ownerOf(x)===ownerOf(t)).sort(byOrder);

// Anciennes données (rubriques « Pour mes filles » / « Textes libres » + catégories) -> rubriques à plat.
// Appliquée en lecture sur le site et dans l'admin ; sans effet si les données sont déjà au nouveau format.
function normalizeMain(list){
 const old=list.filter(x=>isCat(x)&&(x.section==='roman'||x.section==='libre')).sort((a,b)=>(a.section==='roman'?0:1)-(b.section==='roman'?0:1)||(a.order||0)-(b.order||0));
 const legacyTxt=list.some(x=>!isCat(x)&&(x.category==='roman'||x.category==='libre'));
 if(!old.length&&!legacyTxt)return list;
 const rt={id:'rub-roman-temoignage',kind:'cat',section:'main',name:'Roman - Témoignage',order:0};
 [rt,...old].forEach((r,i)=>{r.section='main';r.order=i+1});
 list.push(rt);
 list.forEach(t=>{if(isCat(t))return;if(t.category==='roman'&&!t.cat)t.cat=rt.id;if(t.category==='roman'||t.category==='libre')t.category='main'});
 list.filter(t=>!isCat(t)&&t.cat===rt.id).sort(byOrder).forEach((t,i)=>t.ord=i+1);
 return list}

// --- modifications de la liste (utilisées par les pages d'édition) ---
function addCat(list,sec,name,by){
 const mx=Math.max(0,...list.filter(x=>isCat(x)&&x.section===sec&&ownerOf(x)===(by||'moi')).map(x=>x.order||0));
 const c={id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),kind:'cat',section:sec,name:String(name).trim(),order:mx+1};
 if(by&&by!=='moi')c.by=by;list.push(c);return c}
function renameCat(list,id,name){const c=list.find(x=>x.id===id&&isCat(x));if(c)c.name=String(name).trim()}
function removeCat(list,id){const i=list.findIndex(x=>x.id===id&&isCat(x));if(i>=0)list.splice(i,1);list.forEach(t=>{if(!isCat(t)&&t.cat===id){delete t.cat;delete t.ord}})}
function moveCat(list,id,dir){const c=list.find(x=>x.id===id&&isCat(x));if(!c)return;
 const sib=catsOf(list,c.section,ownerOf(c)),i=sib.indexOf(c),j=i+dir;if(j<0||j>=sib.length)return;
 [sib[i],sib[j]]=[sib[j],sib[i]];sib.forEach((x,k)=>x.order=k+1)}
function moveText(list,id,dir){const t=list.find(x=>x.id===id&&!isCat(x));if(!t||!t.cat)return;
 // on se déplace parmi les textes de même état (publiés entre eux, brouillons entre eux)
 const all=siblings(t,list),sib=all.filter(x=>!!x.draft===!!t.draft),i=sib.indexOf(t),j=i+dir;if(j<0||j>=sib.length)return;
 all.forEach((x,k)=>x.ord=k+1);const o=sib[i].ord;sib[i].ord=sib[j].ord;sib[j].ord=o}
// place un texte dans une catégorie : à la fin s'il est nouveau ou change de catégorie, sinon il garde sa place
function placeText(list,e){
 if(!e.cat){delete e.cat;delete e.ord;return}
 const inGrp=x=>!isCat(x)&&x.cat===e.cat&&ownerOf(x)===ownerOf(e);
 const prev=list.find(x=>x.id===e.id&&!isCat(x));
 if(prev&&prev.cat===e.cat){const all=list.filter(inGrp).sort(byOrder),p=all.findIndex(x=>x.id===e.id);if(p>=0)all[p]=e;all.forEach((x,k)=>x.ord=k+1)}
 else{const all=list.filter(x=>inGrp(x)&&x.id!==e.id).sort(byOrder);all.forEach((x,k)=>x.ord=k+1);e.ord=all.length+1}}

// --- Consultation en accordéon (admin et page invité) : seuls les noms des rubriques sont visibles, une seule rubrique ouverte sur la page ---
let CAOPEN=null; // clé de la rubrique ouverte : « portée:identifiant » (ou « portée:none » pour « Sans rubrique »)
const openAt=(scope,id)=>{CAOPEN=scope+':'+(id||'none')};
(function(){if(document.getElementById('ca-css'))return;const s=document.createElement('style');s.id='ca-css';s.textContent=`
.rh{font:500 1.5rem var(--serif,Georgia,serif);margin:2rem 0 .3rem}
.ca{border:1px solid var(--line,#dde2dc);border-radius:8px;margin:0 0 .8rem;overflow:hidden}
.ca-h{display:flex;align-items:center;gap:.8rem;width:100%;box-sizing:border-box;margin:0;padding:1rem 1.1rem;background:none;border:0;border-radius:0;color:inherit;font:inherit;text-align:left;cursor:pointer}
.ca-h:hover{background:rgba(122,106,128,.08)}
.ca-n{font:500 1.45rem/1.2 var(--serif,Georgia,serif)}
.ca-c{font-size:.85rem;color:var(--soft,#6f7780)}
.ca-a{flex:none;width:.55rem;height:.55rem;border-right:2px solid var(--accent,#7a6a80);border-bottom:2px solid var(--accent,#7a6a80);transform:rotate(-45deg);transition:transform .35s ease}
.ca-h[aria-expanded=true] .ca-a{transform:rotate(45deg)}
.ca-b{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s ease}
.ca-b.open{grid-template-rows:1fr}
.ca-i{min-height:0;overflow:hidden;padding:0 1.1rem;visibility:hidden;transition:visibility 0s .35s}
.ca-b.open .ca-i{visibility:visible;transition:visibility 0s}
.ca-t{display:flex;flex-wrap:wrap;gap:.35rem;padding:.2rem 0 .8rem;border-bottom:1px solid var(--line,#dde2dc)}
.ca .item{padding:.8rem 0}.ca .item:last-child{border-bottom:0}.ca .item b{font-size:1.25rem}
.ca .item.row>.bb{display:flex;gap:.35rem;flex-wrap:wrap;justify-content:flex-end}
.ca .item.row>.bb button[disabled],.ca-t button[disabled]{opacity:.35;cursor:default}
@media(max-width:560px){.ca .item.row{flex-direction:column;align-items:flex-start}.ca .item.row>.bb{justify-content:flex-start}}
@media(prefers-reduced-motion:reduce){.ca-b,.ca-a{transition:none}.ca-i{transition:none}}
.ca-d{font-size:.8rem;color:var(--accent,#7a6a80);border:1px solid var(--accent,#7a6a80);border-radius:9px;padding:0 .5rem;white-space:nowrap}
.ca-sum{margin:0 0 .8rem;padding:.55rem .9rem;border-left:4px solid var(--accent,#7a6a80);background:rgba(122,106,128,.14);border-radius:0 6px 6px 0;font-size:.92rem}
.ca-st{margin:.9rem 0 .2rem;font-size:.8rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--soft,#6f7780)}
.ca-dr{margin:.5rem 0;padding:.1rem .8rem .3rem;border:1px dashed var(--accent,#7a6a80);border-radius:8px;background:rgba(122,106,128,.12)}
.ca-dr .ca-st{margin-top:.6rem;color:var(--accent,#7a6a80)}
.ca .item.is-draft b:before{content:"✎ ";color:var(--accent,#7a6a80)}
.nbd{margin-left:.5rem;font-size:.8rem;color:var(--accent,#7a6a80);border:1px solid var(--accent,#7a6a80);border-radius:9px;padding:0 .45rem}
:root{--vx-moi:#9a7515;--vx-inv:#566f8f}
@media(prefers-color-scheme:dark){:root{--vx-moi:#e6c876;--vx-inv:#a9bdd6}}
body.envers{--vx-moi:#e6c876;--vx-inv:#a9bdd6}
.vx{margin:0 0 1.1em;padding-left:.9rem;border-left:3px solid transparent}
.vx>:last-child{margin-bottom:0}
.vx-moi{border-left-color:var(--vx-moi)}.vx-inv{border-left-color:var(--vx-inv)}
.vx-moi,.vx-moi *{color:var(--vx-moi)!important}
.vx-inv,.vx-inv *{color:var(--vx-inv)!important}
.vx-w{margin:0 0 .9rem}
.vx-h{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem;font-size:.85rem;margin:.6rem 0 .3rem}
.vx-l{font-weight:600}.vx-l-moi{color:var(--vx-moi)}.vx-l-inv{color:var(--vx-inv)}
`;document.head.appendChild(s)})();
document.addEventListener('click',e=>{const h=e.target.closest('.cons .ca-h');if(!h)return;
 const box=h.parentElement,o=!box.querySelector('.ca-b').classList.contains('open');
 document.querySelectorAll('.cons .ca').forEach(x=>{const on=o&&x===box;x.querySelector('.ca-b').classList.toggle('open',on);x.querySelector('.ca-h').setAttribute('aria-expanded',String(on))});
 CAOPEN=o?box.dataset.k:null});
// o:{texts,cats,meta,scope,restTitle,readonly}
function treeHtml(o){
 const{g,rest}=groupTexts(o.texts,o.cats),E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),sc=o.scope||'x',ro=!!o.readonly;
 const row=(t,mv,first,last)=>`<div class="item row${t.draft?' is-draft':''}"><div><b>${E(t.title)}</b><span>${o.meta(t)}</span></div>${ro?'':`<div class="bb">${mv?`<button class="ghost" data-a="tup" data-id="${t.id}"${first?' disabled':''} title="Monter">↑</button><button class="ghost" data-a="tdown" data-id="${t.id}"${last?' disabled':''} title="Descendre">↓</button>`:''}<button class="ghost" data-a="edit" data-id="${t.id}">Modifier</button><button class="ghost" data-a="ttitle" data-id="${t.id}">Titre</button><button class="ghost" data-a="trub" data-id="${t.id}">Rubrique</button><button class="ghost" data-a="del" data-id="${t.id}">Supprimer</button></div>`}</div>`;
 const acc=(key,name,n,tools,inner,dn)=>{const op=CAOPEN===key;
  return `<div class="ca" data-k="${E(key)}"><button type="button" class="ca-h" aria-expanded="${op}"><span class="ca-a" aria-hidden="true"></span><span class="ca-n">${E(name)}</span><span class="ca-c">${n} texte${n>1?'s':''}</span>${dn?`<span class="ca-d">✎ ${dn} brouillon${dn>1?'s':''}</span>`:''}</button><div class="ca-b${op?' open':''}"><div class="ca-i">${tools}${inner||'<p class="empty">Aucun texte dans cette rubrique.</p>'}</div></div></div>`};
 // brouillons d'abord (section à part), puis textes publiés ; les flèches ne concernent que les publiés
 const body=(items,mv)=>{const dr=items.filter(t=>t.draft),pb=items.filter(t=>!t.draft);let r='';
  if(dr.length)r+=`<div class="ca-dr"><p class="ca-st">✎ Brouillons (${dr.length})</p>${dr.map(t=>row(t,false)).join('')}</div>`;
  if(dr.length&&pb.length)r+=`<p class="ca-st">Publiés (${pb.length})</p>`;
  return r+pb.map((t,j)=>row(t,mv,j===0,j===pb.length-1)).join('')};
 const nd=o.texts.filter(t=>t.draft).length;
 let h=!ro&&nd?`<p class="ca-sum">✎ ${nd} brouillon${nd>1?'s':''} à terminer</p>`:'';
 g.forEach((x,i)=>{const tools=ro?'':`<div class="ca-t"><button class="ghost" data-a="cup" data-id="${x.cat.id}"${i===0?' disabled':''} title="Monter">↑</button><button class="ghost" data-a="cdown" data-id="${x.cat.id}"${i===g.length-1?' disabled':''} title="Descendre">↓</button><button class="ghost" data-a="cren" data-id="${x.cat.id}">Renommer</button><button class="ghost" data-a="cdel" data-id="${x.cat.id}">Supprimer la rubrique</button></div>`;
  h+=acc(sc+':'+x.cat.id,x.cat.name,x.items.length,tools,body(x.items,true),x.items.filter(t=>t.draft).length)});
 if(rest.length)h+=acc(sc+':none',o.restTitle||'Sans rubrique',rest.length,'',body([...rest].sort(byOrder),false),rest.filter(t=>t.draft).length);
 return `<div class="cons">${h||'<p class="empty">Aucun texte pour l’instant.</p>'}</div>`}

// Choix d'une rubrique d'arrivée (suppression d'une rubrique, ou bouton « Rubrique » d'un texte)
// o:{text,ok,others,none,pref} -> {mode:'none'}|{mode:'cat',id}|{mode:'new',name}|null
function askRub(o){return new Promise(res=>{
 const E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const d=document.createElement('div');d.className='dlg';
 const rows=[];
 if(o.none)rows.push(['none','<label style="display:block;margin:.5rem 0"><input type="radio" name="dm" value="none"> Dans « Sans rubrique »</label>']);
 if(o.others.length)rows.push(['cat',`<label style="display:block;margin:.5rem 0"><input type="radio" name="dm" value="cat"> Dans la rubrique : <select class="dsel" style="width:auto;max-width:100%">${o.others.map(c=>`<option value="${c.id}">${E(c.name)}</option>`).join('')}</select></label>`]);
 rows.push(['new','<label style="display:block;margin:.5rem 0"><input type="radio" name="dm" value="new"> Dans une nouvelle rubrique : <input type="text" class="dnew" placeholder="Nom de la rubrique" style="margin-top:.3rem"></label>']);
 d.innerHTML=`<div role="dialog" aria-modal="true" style="text-align:left"><p class="t" style="text-align:center"></p>${rows.map(r=>r[1]).join('')}<p class="row" style="flex-wrap:wrap;margin-top:1rem"><button class="ok" type="button"></button><button class="ghost no" type="button">Annuler</button></p></div>`;
 d.querySelector('.t').textContent=o.text;d.querySelector('.ok').textContent=o.ok;
 const want=rows.some(r=>r[0]===o.pref)?o.pref:rows[0][0];d.querySelector(`input[value=${want}]`).checked=true;
 const dsel=d.querySelector('.dsel'),dnew=d.querySelector('.dnew');
 if(dsel)dsel.onchange=()=>{d.querySelector('input[value=cat]').checked=true};
 dnew.onfocus=()=>{d.querySelector('input[value=new]').checked=true};
 document.body.appendChild(d);
 const end=v=>{d.remove();res(v)};
 d.querySelector('.no').onclick=()=>end(null);
 d.addEventListener('keydown',e=>{if(e.key==='Escape')end(null)});
 d.querySelector('.ok').onclick=()=>{const m=d.querySelector('input[name=dm]:checked').value;
  if(m==='none')return end({mode:'none'});
  if(m==='cat')return end({mode:'cat',id:dsel.value});
  const nm=dnew.value.trim();if(!nm){dnew.focus();return}end({mode:'new',name:nm})};
 d.querySelector('.ok').focus()})}
const chooseDest=(name,n,others)=>askRub({text:`La rubrique « ${name} » contient ${n} texte${n>1?'s':''}. Où les déplacer ?`,ok:'Supprimer la rubrique',others,none:true,pref:'none'});
// déplace tous les textes d'une rubrique supprimée (sec : 'main' ou 'grivois' ; by : 'invite' pour la page invité)
function moveTexts(list,from,dest,sec,by){
 const target=dest.mode==='new'?addCat(list,sec||'main',dest.name,by):dest.mode==='cat'?list.find(x=>x.id===dest.id&&isCat(x)):null;
 openAt(sec==='grivois'?(by==='invite'?'lieu-invite':'lieu-moi'):'main',target?target.id:null);
 list.filter(t=>!isCat(t)&&t.cat===from).sort(byOrder).forEach(t=>{if(target){t.cat=target.id;t.ord=1e9}else{delete t.cat;delete t.ord}});
 if(target)list.filter(t=>!isCat(t)&&t.cat===target.id).sort(byOrder).forEach((t,k)=>t.ord=k+1)}

// --- Écriture à deux voix : texte composé de passages, chacun écrit par « moi » (la propriétaire) ou « invite » ---
// Entrée : {id,date,title,by:'duo',duo:true,cat:DUO_ID,parts:[{id,by:'moi'|'invite',date,html,body,lh}],body,n} ; rubrique commune « À quatre mains » (by:'duo')
const DUO_ID='rub-quatre-mains';
const isDuo=x=>!!x&&!isCat(x)&&x.duo===true;
function duoCat(list){let c=list.find(x=>x.id===DUO_ID&&isCat(x));
 if(!c){c={id:DUO_ID,kind:'cat',section:'grivois',name:'À quatre mains',order:0,by:'duo'};list.push(c)}return c}
function duoCalc(t){t.body=t.parts.map(p=>p.body).join('\n\n');t.n={c:t.body.length,w:(t.body.trim().match(/\S+/g)||[]).length}}
const vxc=b=>b==='moi'?'moi':'inv';
const vxlh=p=>{const v=+p.lh;return v>=1&&v<=3?` style="line-height:${v}"`:''};
// lecture : passages dans leurs deux couleurs
function duoView(t){return(t.parts||[]).map(p=>`<div class="vx vx-${vxc(p.by)}"${vxlh(p)}>${p.html?sanitize(p.html):plainToHtml(p.body)}</div>`).join('')}
// page d'édition : passages déjà écrits ; boutons seulement sur les passages de celui qui écrit (who)
function duoRecap(t,who){const E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 return t.parts.map(p=>{const mine=p.by===who,c=vxc(p.by);
  return `<div class="vx-w"><div class="vx-h"><span class="vx-l vx-l-${c}">${mine?'Vous':'L’autre'}</span>${mine?`<button class="ghost" type="button" data-a="pedit" data-p="${E(p.id)}">Modifier ce passage</button><button class="ghost" type="button" data-a="pdel" data-p="${E(p.id)}">Supprimer ce passage</button>`:''}</div><div class="vx vx-${c}"${vxlh(p)}>${sanitize(p.html||plainToHtml(p.body))}</div></div>`}).join('')}
// consultation : une rubrique « À quatre mains » en accordéon (o:{texts,who}) ; vide si aucun texte à deux voix
function duoHtml(o){const E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const items=o.texts.filter(isDuo).sort(byOrder);if(!items.length)return'';
 const key='duo:quatre',op=CAOPEN===key,n=items.length;
 const row=t=>{const own=t.parts.some(p=>p.by===o.who),np=t.parts.length,w=t.n?t.n.w:0;
  return `<div class="item row"><div><b>${E(t.title)}</b><span>${E(t.date||'')} · ${np} passage${np>1?'s':''} · ${w.toLocaleString('fr-FR')} mot${w>1?'s':''}</span></div><div class="bb"><button class="ghost" data-a="dcont" data-id="${t.id}">Continuer</button><button class="ghost" data-a="ttitle" data-id="${t.id}">Titre</button>${own?`<button class="ghost" data-a="ddel" data-id="${t.id}">Supprimer</button>`:''}</div></div>`};
 return `<div class="cons"><div class="ca" data-k="${key}"><button type="button" class="ca-h" aria-expanded="${op}"><span class="ca-a" aria-hidden="true"></span><span class="ca-n">À quatre mains</span><span class="ca-c">${n} texte${n>1?'s':''}</span></button><div class="ca-b${op?' open':''}"><div class="ca-i">${items.map(row).join('')}</div></div></div></div>`}

// Pastille « ✎ n » sur le bouton « Consultation des textes » : brouillons en attente
function draftBadge(n){const b=document.querySelector('.menu button[data-v=list]');if(!b)return;
 b.innerHTML='Consultation des textes'+(n?' <span class="nbd">✎ '+n+'</span>':'')}
