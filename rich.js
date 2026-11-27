// Mise en page : nettoyage du HTML (le texte de l'invité s'affiche sur la page : tout est filtré) et petit éditeur
const FONTS={'Cormorant Garamond':"'Cormorant Garamond',Georgia,serif",'Nunito Sans':"'Nunito Sans',system-ui,sans-serif",'Lora':"Lora,Georgia,serif",'Playfair Display':"'Playfair Display',Georgia,serif",'Dancing Script':"'Dancing Script',cursive",'Courier New':"'Courier New',monospace"};
const RTAGS=new Set(['P','BR','B','STRONG','I','EM','U','SPAN','UL','OL','LI','DIV','H2','H3']);
const RCOLOR=/^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.]+(\s*,\s*[\d.]+){2,3}\s*\))$/i;
const SIZE_EM={1:'.7em',2:'.85em',3:'1em',4:'1.15em',5:'1.4em',6:'1.8em',7:'2.2em'};
const fontKey=f=>{f=String(f||'').replace(/["']/g,'').split(',')[0].trim().toLowerCase();return Object.keys(FONTS).find(k=>k.toLowerCase()===f)};
function cleanStyle(el,out){
 const s=el.style;if(!s)return;let css='';
 if(s.color&&RCOLOR.test(s.color))css+='color:'+s.color+';';
 if(s.backgroundColor&&RCOLOR.test(s.backgroundColor))css+='background-color:'+s.backgroundColor+';';
 const f=fontKey(s.fontFamily);if(f)css+='font-family:'+FONTS[f]+';';
 if(/^\d*\.?\d+em$/.test(s.fontSize||'')){const v=parseFloat(s.fontSize);if(v>=.6&&v<=3)css+='font-size:'+v+'em;'}
 if(/^(bold|[6-9]00)$/.test(s.fontWeight))css+='font-weight:bold;';
 if(s.fontStyle==='italic')css+='font-style:italic;';
 if(/underline/.test((s.textDecoration||'')+(s.textDecorationLine||'')))css+='text-decoration:underline;';
 if(css)out.setAttribute('style',css);
}
function cleanNode(src,dst,keep){
 for(const n of [...src.childNodes]){
  if(n.nodeType===3){dst.appendChild(document.createTextNode(n.nodeValue));continue}
  if(n.nodeType!==1)continue;
  const t=n.tagName;
  if(/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|TEMPLATE|SVG|MATH)$/.test(t))continue;
  if(t==='FONT'){const s=document.createElement('span'),c=n.getAttribute('color'),f=fontKey(n.getAttribute('face')),z=n.getAttribute('size');
   if(c&&RCOLOR.test(c))s.style.color=c;if(f)s.style.fontFamily=FONTS[f];if(SIZE_EM[z])s.style.fontSize=SIZE_EM[z];
   cleanNode(n,s,keep);dst.appendChild(s);continue}
  if(t==='SPAN'&&n.getAttribute('data-ann')){
   const ty=n.getAttribute('data-ann');
   if(!keep||!/^(todo|syn)$/.test(ty)||!n.textContent){cleanNode(n,dst,keep);continue}
   const e=document.createElement('span');e.setAttribute('data-ann',ty);
   const id=(n.getAttribute('data-aid')||'').replace(/[^a-z0-9]/gi,'').slice(0,24);if(id)e.setAttribute('data-aid',id);
   const nt=(n.getAttribute('data-note')||'').slice(0,300);if(nt)e.setAttribute('data-note',nt);
   cleanStyle(n,e);cleanNode(n,e,keep);dst.appendChild(e);continue}
  if(RTAGS.has(t)){const e=document.createElement(t);if(/^(SPAN|P|DIV|LI)$/.test(t))cleanStyle(n,e);cleanNode(n,e,keep);dst.appendChild(e)}
  else cleanNode(n,dst,keep);
 }
}
// keep : garde les annotations (« à compléter », « synonymes ») ; sans keep elles sont retirées (site de lecture, aperçus)
function sanitize(h,keep){const d=new DOMParser().parseFromString('<body>'+(h||''),'text/html'),o=document.createElement('div');cleanNode(d.body,o,!!keep);return o.innerHTML}
const rEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plainToHtml=t=>String(t||'').split(/\n{2,}/).filter(p=>p.trim()).map(p=>'<p>'+rEsc(p).replace(/\n/g,'<br>')+'</p>').join('');
function htmlToText(h){const d=document.createElement('div');d.innerHTML=sanitize(h);d.querySelectorAll('br').forEach(b=>b.replaceWith('\n'));
 return [...d.childNodes].map(n=>n.nodeType===3?n.nodeValue:/^(UL|OL)$/.test(n.nodeName)?[...n.children].map(l=>'• '+l.textContent).join('\n'):n.textContent).join('\n\n').replace(/\n{3,}/g,'\n\n').trim()}

function confirmBox(text,yes){return new Promise(res=>{
 const d=document.createElement('div');d.className='dlg';
 d.innerHTML='<div role="dialog" aria-modal="true"><p class="t"></p><p class="row" style="flex-wrap:wrap"><button class="ok"></button><button class="ghost no" type="button">Annuler</button></p></div>';
 d.querySelector('.t').textContent=text;d.querySelector('.ok').textContent=yes||'Confirmer la mise en ligne';(document.fullscreenElement||document.webkitFullscreenElement||document.body).appendChild(d);
 const end=v=>{d.remove();res(v)};d.querySelector('.ok').onclick=()=>end(true);d.querySelector('.no').onclick=()=>end(false);
 d.addEventListener('keydown',e=>{if(e.key==='Escape')end(false)});d.querySelector('.ok').focus()})}

// Styles propres à l'éditeur : injectés ici pour ne pas dépendre de la version de style.css
(function(){if(document.getElementById('rich-css'))return;const st=document.createElement('style');st.id='rich-css';st.textContent=`
#title,#catg,.ed{box-sizing:border-box;width:100%;background:#fff;border:1px solid #aeb8ad;border-radius:6px;padding:.7rem .85rem;color:var(--ink,#3a3f46);font:inherit;font-size:1.05rem}
.ed{min-height:18rem;font:1.15rem/1.65 var(--serif,Georgia,serif);overflow-wrap:anywhere}
@media(prefers-color-scheme:dark){#title,#catg,.ed{background:#2b3236;border-color:#5a646b}}
.ed:empty:before{content:attr(data-ph);color:#8a929a}
.ed p{margin:0 0 .9em}.ed ul,.ed ol{margin:0 0 .9em 1.4em;padding:0}
.ed h2,.text h2{font-size:1.55em;font-weight:500;line-height:1.25;margin:.9em 0 .4em}.ed h3,.text h3{font-size:1.28em;font-weight:500;line-height:1.3;margin:.8em 0 .35em}
.tbar{display:flex;align-items:center;gap:.15rem;margin:.5rem 0 0;padding:.35rem .5rem;border:1px solid var(--line,#dde2dc);border-radius:14px;background:var(--card,#fbfcfa);overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.tbar::-webkit-scrollbar{display:none}
.tbar button,.tsel{position:relative;flex:none;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:2.5rem;height:2.5rem;margin:0;padding:0;border:0;border-radius:8px;background:none;color:var(--ink,#3a3f46);font:inherit;font-size:1.05rem;line-height:1;cursor:pointer}
.tbar button:hover,.tsel:hover{background:rgba(122,106,128,.18)}
.tbar button[aria-pressed=true]{background:var(--accent,#7a6a80);color:var(--on,#fff)}
.tbar svg{width:1.3rem;height:1.3rem;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
.tbar .gl{font:600 1.1rem Georgia,serif;pointer-events:none}
.tbar .sep{flex:none;width:1px;height:1.5rem;margin:0 .35rem;background:var(--line,#dde2dc)}
.tsel select{position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0;padding:0;margin:0;font-size:16px}
.tsel:focus-within,.tbar button:focus-visible{outline:2px solid var(--accent,#7a6a80)}
.rib{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.5rem;margin:.5rem 0 0}
.rib select,.rib button{box-sizing:border-box;width:100%;height:2.6rem;margin:0;padding:0 .6rem;font:inherit;font-size:.92rem;line-height:1;color:var(--ink,#3a3f46);background:#fff;border:1px solid #aeb8ad;border-radius:6px;cursor:pointer;text-align:center}
@media(prefers-color-scheme:dark){.rib select,.rib button{background:#2b3236;border-color:#5a646b}}
.rib button:hover,.rib select:hover{border-color:var(--accent,#7a6a80)}
.rib button[aria-pressed=true]{background:var(--accent,#7a6a80);color:var(--on,#fff);border-color:var(--accent,#7a6a80)}
.stick{position:sticky;top:var(--stick-top,0px);z-index:20;background:var(--bg,#f4f6f3);padding:.1rem 0 .3rem;box-shadow:0 7px 8px -7px rgba(0,0,0,.3)}
.edhead{display:flex;justify-content:flex-end;align-items:center;gap:.6rem;flex-wrap:wrap;margin:.45rem 0 0}
.edbtns{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
.linkbtn{background:none;border:0;padding:0;font:inherit;font-size:.8rem;color:var(--soft,#6f7780);text-decoration:underline;cursor:pointer}
.fsbtn{box-sizing:border-box;height:2.2rem;margin:0;padding:0 .9rem;font:inherit;font-size:.85rem;line-height:1;color:var(--ink,#3a3f46);background:none;border:1px solid #aeb8ad;border-radius:6px;cursor:pointer}
.fsbtn:hover{border-color:var(--accent,#7a6a80)}
.fsdraft{display:none}.is-full .fsdraft{display:inline-block}
.edmsg{display:none;margin:.4rem 0 0;color:var(--accent,#7a6a80);min-height:1.3rem}.is-full .edmsg{display:block}
.edwrap{position:relative}
.edwrap:fullscreen{background:var(--bg,#f4f6f3);overflow:auto;padding:.8rem 1.2rem 1.2rem;box-sizing:border-box}
.edwrap:-webkit-full-screen{background:var(--bg,#f4f6f3);overflow:auto;padding:.8rem 1.2rem 1.2rem;box-sizing:border-box}
.edwrap.fb{position:fixed;top:0;right:0;bottom:0;left:0;z-index:1000;background:var(--bg,#f4f6f3);overflow:auto;padding:.8rem 1.2rem 1.2rem;box-sizing:border-box}
.edwrap.is-full .ed{min-height:calc(100vh - 12rem)}
body.ed-lock{overflow:hidden}
.edwrap.is-full .stick{top:0}
.tbar2{margin-top:.35rem}
.tbar button.anb{width:auto;gap:.4rem;padding:0 .75rem;font-size:.85rem}
.chpop,.anbar{display:flex;flex-wrap:wrap;align-items:center;gap:.3rem;margin:.35rem 0 0;padding:.4rem;border:1px solid var(--line,#dde2dc);border-radius:10px;background:var(--card,#fbfcfa)}
.chpop button{min-width:2.3rem;height:2.3rem;padding:0 .4rem;border:1px solid var(--line,#dde2dc);border-radius:6px;background:none;color:var(--ink,#3a3f46);font:1.05rem Georgia,serif;cursor:pointer}
.chpop button:hover{border-color:var(--accent,#7a6a80)}
.chpop button small{font:.62rem var(--sans,system-ui,sans-serif)}
.anbar .anty{font-size:.85rem;font-weight:600}
.anbar .annote{flex:1;min-width:9rem;height:2.3rem;padding:0 .6rem;font:.9rem var(--sans,system-ui,sans-serif)}
.anbar button,.anbar a{height:2.3rem;display:inline-flex;align-items:center;padding:0 .7rem;border:1px solid var(--line,#dde2dc);border-radius:6px;background:none;color:var(--ink,#3a3f46);font-size:.85rem;text-decoration:none;cursor:pointer}
.anbar.an-todo{border-color:#e8913f}.anbar.an-syn{border-color:#5d8fc6}
.ed [data-ann]{border-radius:3px;padding:0 1px;cursor:pointer}
.ed [data-ann=todo]{background:rgba(240,150,60,.32);border-bottom:2px dashed #e8913f}
.ed [data-ann=syn]{background:rgba(100,160,230,.28);border-bottom:2px dotted #5d8fc6}
.anlist{margin:.8rem 0 0;padding:.5rem .7rem;border:1px solid var(--line,#dde2dc);border-radius:10px;background:var(--card,#fbfcfa)}
.anlist h4{margin:.1rem 0 .4rem;font-size:.85rem;color:var(--soft,#6f7780);font-weight:600}
.anlist ul{list-style:none;margin:0;padding:0}.anlist li{display:flex;align-items:center;gap:.4rem;margin:.15rem 0}
.anlist .anit{flex:1;text-align:left;border:0;background:none;color:var(--ink,#3a3f46);font-size:.9rem;padding:.25rem .3rem;cursor:pointer;border-radius:6px}
.anlist .anit:hover{background:rgba(122,106,128,.14)}
.anlist .anx{border:0;background:none;color:var(--soft,#6f7780);cursor:pointer;padding:.2rem .5rem}
.anlist i{display:inline-block;width:.7rem;height:.7rem;border-radius:2px;margin-right:.4rem;vertical-align:-.05rem}
.anlist i.t{background:rgba(240,150,60,.7)}.anlist i.s{background:rgba(100,160,230,.7)}
.anlist small{color:var(--soft,#6f7780)}
.edhead .pchip{margin-right:auto}
.ed.v-moi,.ed.v-moi *{color:var(--vx-moi,#9a7515)!important}.ed.v-inv,.ed.v-inv *{color:var(--vx-inv,#566f8f)!important}
.acts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem;margin:1rem 0 .5rem}
.acts button{box-sizing:border-box;width:100%;height:2.9rem;margin:0;padding:0 .8rem;font:inherit;font-size:.95rem;line-height:1;border-radius:6px;cursor:pointer}
.acts button#pub{background:var(--accent,#7a6a80);color:var(--on,#fff);border:1px solid var(--accent,#7a6a80)}
.acts button:not(#pub){background:none;color:var(--ink,#3a3f46);border:1px solid #aeb8ad}
#msg.smsg{position:fixed;top:auto;left:50%;bottom:1rem;transform:translateX(-50%);max-width:92vw;margin:0;min-height:0;background:#2b3236;color:#fff;padding:.7rem 1.1rem;border-radius:8px;z-index:2100;box-shadow:0 4px 14px rgba(0,0,0,.35)}
#msg.smsg:empty{display:none}
.dlg{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2000;display:flex;align-items:center;justify-content:center;background:rgba(244,246,243,.8)}
@media(prefers-color-scheme:dark){.dlg{background:rgba(31,35,38,.8)}}
.dlg>div{width:min(26rem,90vw);padding:1.6rem;background:var(--card,#fff);border:1px solid var(--line,#dde2dc);border-radius:10px;text-align:center;color:var(--ink,#3a3f46)}
@media(max-width:700px){.ribs{display:flex;gap:.4rem;overflow-x:auto;padding:.4rem 0 .3rem;-webkit-overflow-scrolling:touch}.ribs .rib{display:contents}.ribs .rib>*{flex:0 0 auto;width:auto;min-width:6.4rem}.ribs .rib select{min-width:6.8rem}.acts{grid-template-columns:1fr}.edwrap.fb,.edwrap:fullscreen{padding:.6rem .7rem 1rem}}

.rib3{grid-template-columns:minmax(0,1fr) minmax(0,1.2fr) minmax(0,1.5fr) minmax(0,1.5fr) minmax(0,1fr)}
.lhr{display:flex;align-items:center;gap:.5rem;box-sizing:border-box;height:2.6rem;margin:0;padding:0 .6rem;border:1px solid #aeb8ad;border-radius:6px;background:#fff;font-size:.85rem;color:var(--ink,#3a3f46)}
@media(prefers-color-scheme:dark){.lhr{background:#2b3236;border-color:#5a646b}}
.lhr input{flex:1;min-width:0;width:auto;height:auto;padding:0;margin:0;border:0;background:none;accent-color:var(--accent,#7a6a80)}
.lhr output{min-width:2rem;text-align:right}
.rib button.primary{background:var(--accent,#7a6a80);color:var(--on,#fff);border-color:var(--accent,#7a6a80);line-height:1.1;font-size:.82rem;white-space:normal;padding:0 .4rem}
.rib3 select{padding:0 .3rem;font-size:.85rem}
.rib button.b-d{line-height:1.1;font-size:.82rem;white-space:normal;padding:0 .4rem}
@media(max-width:700px){.rib3{display:flex;gap:.4rem;overflow-x:auto;padding:.1rem 0 .3rem;margin-top:.4rem;-webkit-overflow-scrolling:touch}.rib3>*{flex:0 0 auto;width:auto;min-width:6.4rem}.rib3 .b-d{order:1;min-width:8.5rem}.rib3 #pub{min-width:8.5rem}.rib3 #pub{order:2}.rib3 .b-x{order:3}.rib3 select{order:4}.rib3 .lhr{order:5;min-width:11rem}}
`;document.head.appendChild(st)})();

function initEditor(box,ph,opts){
 opts=opts&&typeof opts==='object'?opts:{};
 const opt=(a,f)=>a.map(([v,l])=>`<option value="${v}"${f?` style="${f(v)}"`:''}>${l}</option>`).join('');
 const selb=(c,label,icon,opts)=>`<label class="tsel" title="${label}">${icon}<select data-c="${c}" aria-label="${label}"><option value="">${label}</option>${opts}</select></label>`;
 const IC={
  size:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 19 8 5l5.5 14M4.6 14h6.8"/><path d="M15.5 19l3-7.5 3 7.5M16.6 16.4h4.8"/></svg>',
  font:'<span class="gl" aria-hidden="true">Aa</span>',
  color:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15 12 3l6 12M8.3 10.5h7.4"/><path d="M4 20h16" stroke="#d58a97" stroke-width="3"/></svg>',
  hl:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 12 5.5-5.5 4 4L13 16z"/><path d="M9 12l-3 3v3h4l3-2"/><path d="M4 21h10" stroke="#e8c53a" stroke-width="3"/></svg>',
  ul:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/></svg>',
  ol:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6h10M10 12h10M10 18h10"/><text x="2.5" y="8" font-size="6.5" fill="currentColor" stroke="none">1</text><text x="2.5" y="14" font-size="6.5" fill="currentColor" stroke="none">2</text><text x="2.5" y="20" font-size="6.5" fill="currentColor" stroke="none">3</text></svg>',
  clr:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14M12 5v8"/><path d="M5 20 19 10"/></svg>',
  todo:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="10" rx="2" stroke="#e8913f"/><circle cx="8" cy="12" r="1.1" fill="#e8913f" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="#e8913f" stroke="none"/><circle cx="16" cy="12" r="1.1" fill="#e8913f" stroke="none"/></svg>',
  syn:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h13l-3-3M20 15H7l3 3" stroke="#5d8fc6"/></svg>'};
 const size=selb('size','Taille du texte',IC.size,opt([['h2','Titre'],['h3','Sous-titre'],['p','Texte normal'],['.85','Petit'],['1.4','Grand'],['1.9','Très grand']]));
 const font=selb('font','Police',IC.font,opt(Object.keys(FONTS).map(k=>[k,k]),v=>'font-family:'+FONTS[v]));
 const color=selb('color','Couleur du texte',IC.color,opt([['#c9a24a','Doré'],['#d58a97','Rose'],['#7fae88','Vert sauge'],['#6c9bd1','Bleu ciel'],['#a08ab0','Violet'],['#e0806a','Corail'],['#8d949e','Gris']],v=>'color:'+v));
 const NB='\u00A0',NF='\u202F';
 const CHARS=[['’','Apostrophe typographique'],['…','Points de suspension'],['–','Tiret demi-cadratin'],['œ','œ'],['Œ','Œ'],['æ','æ'],['Æ','Æ'],['À','À'],['É','É'],['È','È'],['Ê','Ê'],['Ç','Ç'],['‹','Guillemet simple ouvrant'],['›','Guillemet simple fermant'],['°','Degré'],[NB,'Espace insécable','<small>ins.</small>'],[NF,'Espace fine insécable','<small>fine</small>']];
 const chb=(c,label,inner)=>`<button type="button" data-ch="${c}" title="${label}" aria-label="${label}"><span class="gl">${inner}</span></button>`;
 const anb=(a,label,inner,txt)=>`<button type="button" class="anb" data-an="${a}" aria-pressed="false" title="${label}" aria-label="${label}">${inner}<span>${txt}</span></button>`;
 const tb=(t,label,inner)=>`<button type="button" data-t="${t}" aria-pressed="false" title="${label}" aria-label="${label}">${inner}</button>`;
 const bar=`<div class="tbar" role="toolbar" aria-label="Mise en forme du texte">${size}${font}${color}<i class="sep"></i>${tb('bold','Gras','<b>B</b>')}${tb('italic','Italique','<i>I</i>')}${tb('underline','Souligné','<u>U</u>')}${tb('hl','Surligné',IC.hl)}<i class="sep"></i>${tb('insertUnorderedList','Liste à puces',IC.ul)}${tb('insertOrderedList','Liste numérotée',IC.ol)}<i class="sep"></i><button type="button" data-b="removeFormat" title="Effacer la mise en forme" aria-label="Effacer la mise en forme">${IC.clr}</button></div><div class="tbar tbar2" role="toolbar" aria-label="Caractères spéciaux et annotations">${chb('fr','Guillemets français « »','«»')}${chb('en','Guillemets de citation “ ”','“”')}${chb('dash','Tiret cadratin —','—')}${chb('more','Autres caractères','Ω')}${opts.actions?'<i class="sep"></i>'+anb('todo','À compléter (surligne le passage en orange)',IC.todo,'À compléter')+anb('syn','Synonymes à chercher (surligne le passage en bleu)',IC.syn,'Synonymes'):''}</div>`;
 const rib3=opts.actions?`<div class="rib rib3" role="toolbar" aria-label="Interligne et actions"><select data-l="sel" aria-label="Interligne"><option value="">Interligne</option><option value="1.15">Simple</option><option value="1.5">1,5</option><option value="2">Double</option><option value="x" hidden>Personnalisé</option></select><label class="lhr"><input type="range" data-l="rng" min="1" max="3" step="0.1" value="1.7" aria-label="Interligne (curseur)"><output data-l="out">—</output></label><button type="button" id="draft" class="b-d" aria-label="Enregistrer comme brouillon">Enregistrer comme brouillon</button><button type="button" id="pub" class="primary">Publier</button><button type="button" id="del" class="b-x">Supprimer</button></div>`:'';
 box.innerHTML=`<div class="edwrap"><div class="stick">${bar}${rib3}
 <div class="chpop" hidden role="group" aria-label="Autres caractères">${CHARS.map(([c,t,l])=>`<button type="button" data-c2="${c}" title="${t}" aria-label="${t}">${l||c}</button>`).join('')}</div>
 <div class="anbar" hidden></div>
 <div class="edhead"><span class="edbtns"><button type="button" class="fsbtn" data-f="full" aria-pressed="false">Plein écran</button></span></div></div>
 <p class="edmsg" role="status"></p>
 <div class="ed" contenteditable="true" role="textbox" aria-multiline="true" data-ph="${ph||''}"></div>
 <div class="anlist" hidden></div>
 <p class="cnt hint">Sélectionnez un mot ou un passage, puis utilisez les menus et les boutons ci-dessus.</p></div>`;
 const wrap=box.querySelector('.edwrap'),ed=box.querySelector('.ed'),fsb=box.querySelector('[data-f=full]'),cntEl=document.getElementById('cnt');
 if(cntEl)wrap.appendChild(cntEl);
 let saved=null;const HL='rgba(255,224,102,.5)';
 try{document.execCommand('defaultParagraphSeparator',false,'p')}catch{}
 const state=c=>{try{return document.queryCommandState(c)}catch{return false}};
 const inHl=()=>{const s=getSelection();if(!s||!s.rangeCount)return false;let n=s.anchorNode;n=n&&(n.nodeType===3?n.parentElement:n);
  for(;n&&n!==ed&&ed.contains(n);n=n.parentElement){const b=getComputedStyle(n).backgroundColor;if(b&&b!=='transparent'&&b!=='rgba(0, 0, 0, 0)')return true}return false};
 const refresh=()=>{const s=getSelection();if(!s||!s.rangeCount||!ed.contains(s.anchorNode))return;
  box.querySelectorAll('[data-t]').forEach(b=>{const t=b.dataset.t;b.setAttribute('aria-pressed',String(t==='hl'?inHl():state(t)))});
  box.querySelectorAll('[data-an]').forEach(b=>b.setAttribute('aria-pressed',String(inAnn(b.dataset.an))))};
 document.addEventListener('selectionchange',()=>{const s=getSelection();if(s&&s.rangeCount&&ed.contains(s.anchorNode)){saved=s.getRangeAt(0).cloneRange();refresh()}});
 const fire=()=>ed.dispatchEvent(new Event('input',{bubbles:true}));
 const restore=()=>{ed.focus();if(saved){const s=getSelection();s.removeAllRanges();s.addRange(saved)}};
 const exec=(c,v,css=true)=>{try{document.execCommand('styleWithCSS',false,css);return document.execCommand(c,false,v)}catch{return false}};
 const run=(c,v,css=true)=>{restore();exec(c,v,css);fire();refresh()};
 const collapsed=()=>!saved||saved.collapsed;
 const applySize=em=>{restore();exec('fontSize','7',false);ed.querySelectorAll('font[size="7"]').forEach(f=>{const sp=document.createElement('span');sp.style.fontSize=em+'em';while(f.firstChild)sp.appendChild(f.firstChild);f.replaceWith(sp)});fire()};
 // ---- caractères spéciaux ----
 const keepSel=()=>{const sl=getSelection();if(!(sl&&sl.rangeCount&&ed.contains(sl.anchorNode)))restore()};
 const insertChars=txt=>{keepSel();let done=false;try{done=document.execCommand('insertText',false,txt)}catch{}
  if(!done){const sl=getSelection();if(!sl.rangeCount)return;const r=sl.getRangeAt(0);if(!ed.contains(r.commonAncestorContainer))return;r.deleteContents();const tn=document.createTextNode(txt);r.insertNode(tn);r.setStartAfter(tn);r.collapse(true);sl.removeAllRanges();sl.addRange(r)}
  fire()};
 const wrapPair=(open,close)=>{keepSel();const sl=getSelection();if(!sl.rangeCount)return;const r=sl.getRangeAt(0);if(!ed.contains(r.commonAncestorContainer))return;
  const nr=document.createRange();
  if(r.collapsed){const tn=document.createTextNode(open+close);r.insertNode(tn);nr.setStart(tn,open.length);nr.collapse(true)}
  else{const e=r.cloneRange();e.collapse(false);const st=r.cloneRange();st.collapse(true);const cn=document.createTextNode(close);e.insertNode(cn);st.insertNode(document.createTextNode(open));nr.setStartAfter(cn);nr.collapse(true)}
  sl.removeAllRanges();sl.addRange(nr);fire()};
 const pop=box.querySelector('.chpop');
 box.querySelectorAll('button[data-ch]').forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>{const c=b.dataset.ch;
  if(c==='fr')wrapPair('«'+NB,NB+'»');else if(c==='en')wrapPair('“','”');else if(c==='dash')insertChars('—');
  else{pop.hidden=!pop.hidden}}});
 pop.querySelectorAll('button').forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>{insertChars(b.dataset.c2);pop.hidden=true}});

 // ---- annotations (« à compléter » / « synonymes ») : visibles seulement dans l'éditeur ----
 const ANL={todo:'À compléter',syn:'Synonymes'};
 const bar2=box.querySelector('.anbar'),alist=box.querySelector('.anlist');
 const annEls=id=>[...ed.querySelectorAll('[data-aid]')].filter(x=>x.dataset.aid===id);
 const unwrap=sp=>{const p=sp.parentNode;if(!p)return;while(sp.firstChild)p.insertBefore(sp.firstChild,sp);p.removeChild(sp);p.normalize()};
 const newId=()=>'a'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
 const annOf=n=>{let x=n&&(n.nodeType===3?n.parentElement:n);return x&&x.closest?x.closest('[data-ann]'):null};
 const inAnn=t=>{const sl=getSelection();if(!sl||!sl.rangeCount||!ed.contains(sl.anchorNode))return false;const a=annOf(sl.anchorNode);return !!a&&a.dataset.ann===t};
 function wordRange(){const sl=getSelection();if(!sl.rangeCount)return null;const r=sl.getRangeAt(0);let n=r.startContainer,o=r.startOffset;
  if(n.nodeType!==3||!ed.contains(n))return null;const tx=n.nodeValue,W=/[\p{L}\p{N}'’-]/u;let a=o,b=o;while(a>0&&W.test(tx[a-1]))a--;while(b<tx.length&&W.test(tx[b]))b++;
  if(a===b)return null;const nr=document.createRange();nr.setStart(n,a);nr.setEnd(n,b);return nr}
 function textNodesIn(r){const out=[],root=r.commonAncestorContainer.nodeType===3?r.commonAncestorContainer.parentNode:r.commonAncestorContainer;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(!r.intersectsNode(n))continue;
   let a=n===r.startContainer?r.startOffset:0,b=n===r.endContainer?r.endOffset:n.nodeValue.length;if(b<=a)continue;
   if(!n.nodeValue.slice(a,b).trim())continue;out.push([n,a,b])}return out}
 function annotate(type){
  keepSel();const sl=getSelection();if(!sl.rangeCount)return;let r=sl.getRangeAt(0);if(!ed.contains(r.commonAncestorContainer))return;
  if(r.collapsed){const wr=wordRange();if(!wr){o_notify('Sélectionnez un mot ou un passage à annoter.');return}r=wr}
  const hit=new Set();textNodesIn(r).forEach(([n])=>{const a=annOf(n);if(a)hit.add(a.dataset.aid||'')});
  if(!hit.size&&r.startContainer.nodeType===3){const a=annOf(r.startContainer);if(a)hit.add(a.dataset.aid||'')}
  if(hit.size){const first=[...hit][0],ty=(annEls(first)[0]||{dataset:{}}).dataset.ann;
   hit.forEach(id=>{if(ty===type)annEls(id).forEach(unwrap);else annEls(id).forEach(x=>x.setAttribute('data-ann',type))});
   bar2.hidden=true}
  else{const id=newId();textNodesIn(r).reverse().forEach(([n,a,b])=>{let mid=n;if(b<n.nodeValue.length)n.splitText(b);if(a>0)mid=n.splitText(a);
    const sp=document.createElement('span');sp.setAttribute('data-ann',type);sp.setAttribute('data-aid',id);mid.parentNode.insertBefore(sp,mid);sp.appendChild(mid)});
   const f=annEls(id)[0];if(f)showBar(id)}
  fire();renderAnn();refresh()}
 const o_notify=t=>{const m=box.querySelector('.edmsg');m.textContent=t;m.style.display='block';clearTimeout(o_notify.t);o_notify.t=setTimeout(()=>{m.textContent='';m.style.display=''},4000)};
 function showBar(id){const els=annEls(id);if(!els.length){bar2.hidden=true;return}
  const ty=els[0].dataset.ann,word=els.map(x=>x.textContent).join(' ').trim().split(/\s+/).slice(0,3).join(' '),note=els[0].dataset.note||'';
  bar2.className='anbar an-'+ty;bar2.hidden=false;bar2.dataset.id=id;
  bar2.innerHTML='<span class="anty">'+ANL[ty]+'</span><input class="annote" type="text" maxlength="300" placeholder="'+(ty==='syn'?'Mots envisagés…':'Ce qu’il faut compléter…')+'" aria-label="Note"><span style="flex:1"></span>'
   +(ty==='syn'?'<a href="https://www.cnrtl.fr/synonymie/'+encodeURIComponent(word.replace(/[^\p{L}\p{N}\s'’-]/gu,''))+'" target="_blank" rel="noopener" title="Ouvre le dictionnaire des synonymes en ligne (seul ce mot est envoyé)">Dictionnaire</a>':'')
   +'<button type="button" data-x="del">Retirer</button><button type="button" data-x="close">Fermer</button>';
  bar2.querySelector('.annote').value=note}
 bar2.addEventListener('input',e=>{if(!e.target.classList.contains('annote'))return;const v=e.target.value.slice(0,300);annEls(bar2.dataset.id).forEach(x=>{v?x.setAttribute('data-note',v):x.removeAttribute('data-note')});renderAnn()});
 bar2.addEventListener('click',e=>{const b=e.target.closest('button[data-x]');if(!b)return;
  if(b.dataset.x==='del'){annEls(bar2.dataset.id).forEach(unwrap);fire();renderAnn()}bar2.hidden=true});
 ed.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('[data-ann]');if(a&&a.dataset.aid)showBar(a.dataset.aid)});
 function renderAnn(){const g=new Map();ed.querySelectorAll('[data-ann]').forEach(sp=>{const id=sp.dataset.aid||'';const x=g.get(id)||{id,ty:sp.dataset.ann,t:'',n:sp.dataset.note||''};x.t+=(x.t?' ':'')+sp.textContent;g.set(id,x)});
  const L=[...g.values()];if(!L.length){alist.hidden=true;alist.innerHTML='';return}
  alist.hidden=false;
  alist.innerHTML='<h4>Annotations ('+L.length+')</h4><ul>'+L.map(x=>'<li><button type="button" class="anit" data-g="'+x.id+'"><i class="'+(x.ty==='todo'?'t':'s')+'"></i>'+ANL[x.ty]+' · « '+rEsc(x.t.length>40?x.t.slice(0,40)+'…':x.t)+' »'+(x.n?' <small>— '+rEsc(x.n.length>50?x.n.slice(0,50)+'…':x.n)+'</small>':'')+'</button><button type="button" class="anx" data-d="'+x.id+'" aria-label="Retirer l’annotation" title="Retirer">✕</button></li>').join('')+'</ul>'}
 alist.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.d){annEls(b.dataset.d).forEach(unwrap);fire();renderAnn();if(bar2.dataset.id===b.dataset.d)bar2.hidden=true;return}
  if(b.dataset.g){const els=annEls(b.dataset.g);if(!els.length)return;els[0].scrollIntoView({block:'center'});showBar(b.dataset.g);
   const r=document.createRange();r.selectNodeContents(els[0]);const sl=getSelection();sl.removeAllRanges();sl.addRange(r)}});
 box.querySelectorAll('button[data-an]').forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>annotate(b.dataset.an)});
 ed.addEventListener('input',()=>{clearTimeout(renderAnn.t);renderAnn.t=setTimeout(renderAnn,300)});
 ed.addEventListener('ed-rebase',()=>{bar2.hidden=true;renderAnn()});
 box.querySelectorAll('button[data-b]').forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>run(b.dataset.b)});
 box.querySelectorAll('button[data-t]').forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>{const t=b.dataset.t;
  if(t==='hl'){const on=inHl();restore();if(!exec('hiliteColor',on?'transparent':HL))exec('backColor',on?'transparent':HL);fire();refresh()}else run(t)}});
 box.querySelectorAll('select[data-c]').forEach(s=>{s.onchange=()=>{const v=s.value,c=s.dataset.c;if(!v)return;
  if(c==='font')run('fontName',v);
  else if(c==='color')run('foreColor',v);
  else if(c==='list'){restore();const u=state('insertUnorderedList'),o=state('insertOrderedList');
   if(v==='ul'&&!u)exec('insertUnorderedList');else if(v==='ol'&&!o)exec('insertOrderedList');else if(v==='none'){if(u)exec('insertUnorderedList');else if(o)exec('insertOrderedList')}
   fire();refresh()}
  else if(c==='size'){
   if(v==='h2'||v==='h3')run('formatBlock',v);
   else if(v==='p'){run('formatBlock','p');if(!collapsed())applySize(1)}
   else if(!collapsed())applySize(v)}
  s.selectedIndex=0}});
 ed.addEventListener('paste',e=>{e.preventDefault();const t=(e.clipboardData||window.clipboardData).getData('text/plain');document.execCommand('insertText',false,t)});

 // Plein écran : API du navigateur, avec repli « maison » (bloc fixe) si elle n'est pas disponible (iPhone, etc.)
 const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
 const isFull=()=>wrap.classList.contains('is-full');
 const setUI=on=>{wrap.classList.toggle('is-full',on);fsb.textContent=on?'Quitter le plein écran':'Plein écran';fsb.setAttribute('aria-pressed',String(on));
  if(!on){wrap.classList.remove('fb');document.body.classList.remove('ed-lock');box.querySelector('.edmsg').textContent=''}};
 const enter=()=>{if(isFull())return;
  const rq=wrap.requestFullscreen||wrap.webkitRequestFullscreen;
  const fb=()=>{wrap.classList.add('fb');document.body.classList.add('ed-lock');setUI(true)};
  if(rq){try{const p=rq.call(wrap);if(p&&p.then)p.then(()=>setUI(true),fb);else setUI(true)}catch{fb()}}else fb();
  setTimeout(()=>ed.focus(),60)};
 const exit=()=>{if(!isFull())return;
  if(fsEl()===wrap){try{const p=(document.exitFullscreen||document.webkitExitFullscreen).call(document);if(p&&p.catch)p.catch(()=>{})}catch{}}
  setUI(false)};
 fsb.onmousedown=e=>e.preventDefault();fsb.onclick=()=>isFull()?exit():enter();
  const onFs=()=>{if(!fsEl()&&isFull()&&!wrap.classList.contains('fb'))setUI(false)};
 document.addEventListener('fullscreenchange',onFs);document.addEventListener('webkitfullscreenchange',onFs);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&wrap.classList.contains('fb'))exit()});

 // Interligne enregistré avec le texte : valeurs fixes + curseur ; la dernière valeur choisie sert de départ pour un nouveau texte
 const lsel=box.querySelector('[data-l=sel]'),lrng=box.querySelector('[data-l=rng]'),lout=box.querySelector('[data-l=out]');let lh=null;
 const PRE=['1.15','1.5','2'];
 const remembered=()=>{try{const v=parseFloat(localStorage.getItem('lh'));return v>=1&&v<=3?v:null}catch{return null}};
 const setLH=v=>{const n=v==null||v===''||isNaN(+v)?null:Math.min(3,Math.max(1,+v));lh=n;ed.style.lineHeight=n?String(n):'';
  if(lsel){lsel.value=n==null?'':(PRE.includes(String(n))?String(n):'x');lrng.value=n||1.7;lout.textContent=n?String(n).replace('.',','):'—'}};
 const userLH=n=>{setLH(n);try{localStorage.setItem('lh',n==null?'':String(n))}catch{}};
 if(lsel){lsel.onchange=()=>{if(lsel.value==='x'){lsel.value=lh?'x':'';return}userLH(lsel.value===''?null:+lsel.value)};lrng.oninput=()=>userLH(+lrng.value)}
 setLH(remembered());
 return{getLH:()=>lh,setLH,resetLH:()=>setLH(remembered()),el:ed,html:()=>sanitize(ed.innerHTML,true),text:()=>htmlToText(ed.innerHTML),set:h=>{ed.innerHTML=sanitize(h,true);ed.dispatchEvent(new Event('ed-rebase'))},clear:()=>{ed.innerHTML='';ed.dispatchEvent(new Event('ed-rebase'))},onInput:f=>ed.addEventListener('input',f),
  isFull,exitFull:exit,setVoice:v=>{ed.classList.remove('v-moi','v-inv');if(v)ed.classList.add(v==='moi'?'v-moi':'v-inv');const cs=box.querySelector('[data-c=color]');if(cs)(cs.closest('.tsel')||cs).hidden=!!v},notify:t=>{box.querySelector('.edmsg').textContent=t}};
}
