// Mise en page : nettoyage du HTML (le texte de l'invité s'affiche sur la page : tout est filtré) et petit éditeur
const FONTS={'Cormorant Garamond':"'Cormorant Garamond',Georgia,serif",'Nunito Sans':"'Nunito Sans',system-ui,sans-serif",'Lora':"Lora,Georgia,serif",'Playfair Display':"'Playfair Display',Georgia,serif",'Dancing Script':"'Dancing Script',cursive",'Courier New':"'Courier New',monospace"};
const RTAGS=new Set(['P','BR','B','STRONG','I','EM','U','SPAN','UL','OL','LI','DIV']);
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
function cleanNode(src,dst){
 for(const n of [...src.childNodes]){
  if(n.nodeType===3){dst.appendChild(document.createTextNode(n.nodeValue));continue}
  if(n.nodeType!==1)continue;
  const t=n.tagName;
  if(/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|TEMPLATE|SVG|MATH)$/.test(t))continue;
  if(t==='FONT'){const s=document.createElement('span'),c=n.getAttribute('color'),f=fontKey(n.getAttribute('face')),z=n.getAttribute('size');
   if(c&&RCOLOR.test(c))s.style.color=c;if(f)s.style.fontFamily=FONTS[f];if(SIZE_EM[z])s.style.fontSize=SIZE_EM[z];
   cleanNode(n,s);dst.appendChild(s);continue}
  if(RTAGS.has(t)){const e=document.createElement(t);if(/^(SPAN|P|DIV|LI)$/.test(t))cleanStyle(n,e);cleanNode(n,e);dst.appendChild(e)}
  else cleanNode(n,dst);
 }
}
function sanitize(h){const d=new DOMParser().parseFromString('<body>'+(h||''),'text/html'),o=document.createElement('div');cleanNode(d.body,o);return o.innerHTML}
const rEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plainToHtml=t=>String(t||'').split(/\n{2,}/).filter(p=>p.trim()).map(p=>'<p>'+rEsc(p).replace(/\n/g,'<br>')+'</p>').join('');
function htmlToText(h){const d=document.createElement('div');d.innerHTML=sanitize(h);d.querySelectorAll('br').forEach(b=>b.replaceWith('\n'));
 return [...d.childNodes].map(n=>n.nodeType===3?n.nodeValue:/^(UL|OL)$/.test(n.nodeName)?[...n.children].map(l=>'• '+l.textContent).join('\n'):n.textContent).join('\n\n').replace(/\n{3,}/g,'\n\n').trim()}

function confirmBox(text,yes){return new Promise(res=>{
 const d=document.createElement('div');d.className='dlg';
 d.innerHTML='<div role="dialog" aria-modal="true"><p class="t"></p><p class="row" style="flex-wrap:wrap"><button class="ok"></button><button class="ghost no" type="button">Annuler</button></p></div>';
 d.querySelector('.t').textContent=text;d.querySelector('.ok').textContent=yes||'Confirmer la mise en ligne';document.body.appendChild(d);
 const end=v=>{d.remove();res(v)};d.querySelector('.ok').onclick=()=>end(true);d.querySelector('.no').onclick=()=>end(false);
 d.addEventListener('keydown',e=>{if(e.key==='Escape')end(false)});d.querySelector('.ok').focus()})}

// Styles propres à l'éditeur : injectés ici pour ne pas dépendre de la version de style.css
(function(){if(document.getElementById('rich-css'))return;const st=document.createElement('style');st.id='rich-css';st.textContent=`
#title,.ed{box-sizing:border-box;width:100%;background:#fff;border:1px solid #aeb8ad;border-radius:6px;padding:.7rem .85rem;color:var(--ink,#3a3f46);font:inherit;font-size:1.05rem}
.ed{min-height:18rem;font:1.15rem/1.65 var(--serif,Georgia,serif);overflow-wrap:anywhere}
@media(prefers-color-scheme:dark){#title,.ed{background:#2b3236;border-color:#5a646b}}
.ed:empty:before{content:attr(data-ph);color:#8a929a}
.ed p{margin:0 0 .9em}.ed ul,.ed ol{margin:0 0 .9em 1.4em;padding:0}
.rib{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.5rem;margin:.5rem 0 0}
.rib select,.rib button{box-sizing:border-box;width:100%;height:2.6rem;margin:0;padding:0 .6rem;font:inherit;font-size:.92rem;line-height:1;color:var(--ink,#3a3f46);background:#fff;border:1px solid #aeb8ad;border-radius:6px;cursor:pointer;text-align:center}
@media(prefers-color-scheme:dark){.rib select,.rib button{background:#2b3236;border-color:#5a646b}}
.rib button:hover,.rib select:hover{border-color:var(--accent,#7a6a80)}
.rib button[aria-pressed=true]{background:var(--accent,#7a6a80);color:var(--on,#fff);border-color:var(--accent,#7a6a80)}
.clr{text-align:right;margin:.35rem 0 .7rem}
.linkbtn{background:none;border:0;padding:0;font:inherit;font-size:.8rem;color:var(--soft,#6f7780);text-decoration:underline;cursor:pointer}
.acts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem;margin:1rem 0 .5rem}
.acts button{box-sizing:border-box;width:100%;height:2.9rem;margin:0;padding:0 .8rem;font:inherit;font-size:.95rem;line-height:1;border-radius:6px;cursor:pointer}
.acts button#pub{background:var(--accent,#7a6a80);color:var(--on,#fff);border:1px solid var(--accent,#7a6a80)}
.acts button:not(#pub){background:none;color:var(--ink,#3a3f46);border:1px solid #aeb8ad}
@media(max-width:560px){.rib{grid-template-columns:repeat(2,minmax(0,1fr))}.acts{grid-template-columns:1fr}}
`;document.head.appendChild(st)})();

function initEditor(box,ph){
 const opt=(a,f)=>a.map(([v,l])=>`<option value="${v}"${f?` style="${f(v)}"`:''}>${l}</option>`).join('');
 const size=`<select data-c="size" aria-label="Taille du texte"><option value="">Taille</option>${opt([['.85','Petit'],['1','Normal'],['1.4','Grand'],['1.9','Très grand']])}</select>`;
 const font=`<select data-c="font" aria-label="Police"><option value="">Police</option>${opt(Object.keys(FONTS).map(k=>[k,k]),v=>'font-family:'+FONTS[v])}</select>`;
 const color=`<select data-c="color" aria-label="Couleur du texte"><option value="">Couleur</option>${opt([['#c9a24a','Doré'],['#d58a97','Rose'],['#7fae88','Vert sauge'],['#6c9bd1','Bleu ciel'],['#a08ab0','Violet'],['#e0806a','Corail'],['#8d949e','Gris']],v=>'color:'+v)}</select>`;
 const list=`<select data-c="list" aria-label="Liste"><option value="">Liste</option>${opt([['ul','Liste à puces'],['ol','Liste numérotée'],['none','Aucune liste']])}</select>`;
 box.innerHTML=`<div class="rib" role="toolbar" aria-label="Taille, police, couleur, liste">${size}${font}${color}${list}</div>
 <div class="rib" role="toolbar" aria-label="Style du texte"><button type="button" data-t="bold" aria-pressed="false"><b>Gras</b></button><button type="button" data-t="italic" aria-pressed="false"><i>Italique</i></button><button type="button" data-t="underline" aria-pressed="false"><u>Souligné</u></button><button type="button" data-t="hl" aria-pressed="false"><span style="background:rgba(255,224,102,.65);padding:0 .3em">Surligné</span></button></div>
 <p class="clr"><button type="button" class="linkbtn" data-b="removeFormat">Effacer la mise en forme</button></p>
 <div class="ed" contenteditable="true" role="textbox" aria-multiline="true" data-ph="${ph||''}"></div>
 <p class="cnt hint">Sélectionnez un mot ou un passage, puis utilisez les menus et les boutons ci-dessus.</p>`;
 const ed=box.querySelector('.ed');let saved=null;const HL='rgba(255,224,102,.5)';
 try{document.execCommand('defaultParagraphSeparator',false,'p')}catch{}
 const state=c=>{try{return document.queryCommandState(c)}catch{return false}};
 const inHl=()=>{const s=getSelection();if(!s||!s.rangeCount)return false;let n=s.anchorNode;n=n&&(n.nodeType===3?n.parentElement:n);
  for(;n&&n!==ed&&ed.contains(n);n=n.parentElement){const b=getComputedStyle(n).backgroundColor;if(b&&b!=='transparent'&&b!=='rgba(0, 0, 0, 0)')return true}return false};
 const refresh=()=>{const s=getSelection();if(!s||!s.rangeCount||!ed.contains(s.anchorNode))return;
  box.querySelectorAll('[data-t]').forEach(b=>{const t=b.dataset.t;b.setAttribute('aria-pressed',String(t==='hl'?inHl():state(t)))})};
 document.addEventListener('selectionchange',()=>{const s=getSelection();if(s&&s.rangeCount&&ed.contains(s.anchorNode)){saved=s.getRangeAt(0).cloneRange();refresh()}});
 const fire=()=>ed.dispatchEvent(new Event('input',{bubbles:true}));
 const restore=()=>{ed.focus();if(saved){const s=getSelection();s.removeAllRanges();s.addRange(saved)}};
 const exec=(c,v,css=true)=>{try{document.execCommand('styleWithCSS',false,css);return document.execCommand(c,false,v)}catch{return false}};
 const run=(c,v,css=true)=>{restore();exec(c,v,css);fire();refresh()};
 const collapsed=()=>!saved||saved.collapsed;
 box.querySelectorAll('button[data-b]').forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>run(b.dataset.b)});
 box.querySelectorAll('button[data-t]').forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>{const t=b.dataset.t;
  if(t==='hl'){const on=inHl();restore();if(!exec('hiliteColor',on?'transparent':HL))exec('backColor',on?'transparent':HL);fire();refresh()}else run(t)}});
 box.querySelectorAll('select[data-c]').forEach(s=>{s.onchange=()=>{const v=s.value,c=s.dataset.c;if(!v)return;
  if(c==='font')run('fontName',v);
  else if(c==='color')run('foreColor',v);
  else if(c==='list'){restore();const u=state('insertUnorderedList'),o=state('insertOrderedList');
   if(v==='ul'&&!u)exec('insertUnorderedList');else if(v==='ol'&&!o)exec('insertOrderedList');else if(v==='none'){if(u)exec('insertUnorderedList');else if(o)exec('insertOrderedList')}
   fire();refresh()}
  else if(c==='size'&&!collapsed()){restore();exec('fontSize','7',false);ed.querySelectorAll('font[size="7"]').forEach(f=>{const sp=document.createElement('span');sp.style.fontSize=v+'em';while(f.firstChild)sp.appendChild(f.firstChild);f.replaceWith(sp)});fire()}
  s.selectedIndex=0}});
 ed.addEventListener('paste',e=>{e.preventDefault();const t=(e.clipboardData||window.clipboardData).getData('text/plain');document.execCommand('insertText',false,t)});
 return{el:ed,html:()=>sanitize(ed.innerHTML),text:()=>htmlToText(ed.innerHTML),set:h=>{ed.innerHTML=sanitize(h)},clear:()=>{ed.innerHTML=''},onInput:f=>ed.addEventListener('input',f)};
}
