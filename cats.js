// Catégories / chapitres : stockées comme éléments {kind:'cat'} dans le même fichier chiffré que les textes
const isCat=x=>!!x&&x.kind==='cat';
const textsOf=l=>l.filter(x=>!isCat(x));
const ownerOf=x=>x.by||'moi';
const byOrder=(a,b)=>((a.ord==null?1e9:a.ord)-(b.ord==null?1e9:b.ord))||(a.date||'').localeCompare(b.date||'')||String(a.id).localeCompare(String(b.id));
const catsOf=(l,sec,by)=>l.filter(x=>isCat(x)&&x.section===sec&&(by==null||ownerOf(x)===by)).sort((a,b)=>(a.order||0)-(b.order||0));
function groupTexts(texts,cats){const known=new Set(cats.map(c=>c.id));
 return{g:cats.map(c=>({cat:c,items:texts.filter(t=>t.cat===c.id).sort(byOrder)})),rest:texts.filter(t=>!t.cat||!known.has(t.cat))}}
const siblings=(t,pool)=>pool.filter(x=>!isCat(x)&&x.cat===t.cat&&ownerOf(x)===ownerOf(t)&&x.category===t.category).sort(byOrder);

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
 const sib=siblings(t,list),i=sib.indexOf(t),j=i+dir;if(j<0||j>=sib.length)return;
 [sib[i],sib[j]]=[sib[j],sib[i]];sib.forEach((x,k)=>x.ord=k+1)}
// place un texte dans une catégorie (à la fin si nouvelle ou changée), sans toucher à l'ordre des autres
function placeText(list,e){
 if(!e.cat){delete e.cat;delete e.ord;return}
 const prev=list.find(x=>x.id===e.id&&!isCat(x)),same=prev&&prev.cat===e.cat&&prev.ord!=null;
 const grp=list.filter(x=>!isCat(x)&&x.id!==e.id&&x.cat===e.cat&&ownerOf(x)===ownerOf(e)&&x.category===e.category);
 e.ord=same?prev.ord:1e9;[...grp,e].sort(byOrder).forEach((x,k)=>x.ord=k+1)}

// --- arborescence pour les pages d'édition (consultation) ---
(function(){if(document.getElementById('cats-css'))return;const s=document.createElement('style');s.id='cats-css';s.textContent=`
.cg{margin:0 0 1.2rem}.cgh{background:rgba(122,106,128,.09);padding:.6rem .8rem!important;border-radius:6px;border-bottom:0!important}
.cg .item.row:not(.cgh){padding-left:1.1rem}
.rh{font:500 1.5rem var(--serif,Georgia,serif);margin:2rem 0 .3rem}
.cgh button[disabled],.cg button[disabled]{opacity:.35;cursor:default}
.item.row>div:last-child{display:flex;gap:.35rem;flex-wrap:wrap;justify-content:flex-end}
@media(max-width:560px){.item.row{flex-direction:column;align-items:flex-start}.item.row>div:last-child{justify-content:flex-start}}
`;document.head.appendChild(s)})();
function treeHtml(o){ // o:{texts,cats,meta}
 const{g,rest}=groupTexts(o.texts,o.cats),E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const row=(t,mv,first,last)=>`<div class="item row"><div><b>${t.enc?'🔒 Ancien texte Privé':E(t.title)}</b><span>${o.meta(t)}</span></div><div>${mv?`<button class="ghost" data-a="tup" data-id="${t.id}"${first?' disabled':''} title="Monter">↑</button><button class="ghost" data-a="tdown" data-id="${t.id}"${last?' disabled':''} title="Descendre">↓</button>`:''}${t.enc?'':`<button class="ghost" data-a="edit" data-id="${t.id}">Modifier</button>`}<button class="ghost" data-a="del" data-id="${t.id}">Supprimer</button></div></div>`;
 let h='';
 g.forEach((x,i)=>{h+=`<div class="cg"><div class="item row cgh"><div><b>${E(x.cat.name)}</b><span>Catégorie · ${x.items.length} texte(s)</span></div><div><button class="ghost" data-a="cup" data-id="${x.cat.id}"${i===0?' disabled':''} title="Monter">↑</button><button class="ghost" data-a="cdown" data-id="${x.cat.id}"${i===g.length-1?' disabled':''} title="Descendre">↓</button><button class="ghost" data-a="cren" data-id="${x.cat.id}">Renommer</button><button class="ghost" data-a="cdel" data-id="${x.cat.id}">Supprimer</button></div></div>${x.items.map((t,j)=>row(t,true,j===0,j===x.items.length-1)).join('')}</div>`});
 if(rest.length)h+=`<div class="cg">${g.length?'<div class="item cgh"><b>Sans catégorie</b></div>':''}${[...rest].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(t=>row(t,false)).join('')}</div>`;
 return h||'<p class="empty">Aucun texte pour l’instant.</p>'}
