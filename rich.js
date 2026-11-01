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

function initEditor(box,ph,below){
 const opt=(a,f)=>a.map(([v,l])=>`<option value="${v}"${f?` style="${f(v)}"`:''}>${l}</option>`).join('');
 const font=`<select data-c="font" aria-label="Police"><option value="">Police</option>${opt(Object.keys(FONTS).map(k=>[k,k]),v=>'font-family:'+FONTS[v])}</select>`;
 const size=`<select data-c="size" aria-label="Taille"><option value="">Taille</option>${opt([['.85','Petit'],['1','Normal'],['1.4','Grand'],['1.9','Très grand']])}</select>`;
 const color=`<select data-c="color" aria-label="Couleur du texte"><option value="">Couleur</option>${opt([['#c9a24a','Doré'],['#d58a97','Rose'],['#7fae88','Vert sauge'],['#6c9bd1','Bleu ciel'],['#a08ab0','Violet'],['#e0806a','Corail'],['#8d949e','Gris']],v=>'color:'+v)}</select>`;
 const hl=`<select data-c="hl" aria-label="Surligner"><option value="">Surligner</option>${opt([['rgba(255,224,102,.45)','Jaune'],['rgba(244,160,180,.4)','Rose'],['rgba(140,200,150,.4)','Vert'],['rgba(130,170,230,.4)','Bleu']])}</select>`;
 const B='<button type="button" data-b="bold" title="Gras"><b>G</b></button>',I='<button type="button" data-b="italic" title="Italique"><i>I</i></button>',U='<button type="button" data-b="underline" title="Souligner"><u>S</u></button>';
 const L='<button type="button" data-b="insertUnorderedList" title="Liste à puces">• Liste</button><button type="button" data-b="insertOrderedList" title="Liste numérotée">1. Liste</button><button type="button" data-b="removeFormat" title="Effacer la mise en forme">✕ Effacer</button>';
 const edv=`<div class="ed" contenteditable="true" role="textbox" aria-multiline="true" data-ph="${ph||''}"></div>`;
 const hint='<p class="cnt hint">Sélectionnez un mot ou un passage, puis choisissez la police, la taille, la couleur ou le surlignage.</p>';
 box.innerHTML=below
  ?`${edv}<div class="band" role="toolbar" aria-label="Police, taille, couleur">${font}${size}${color}</div><div class="band" role="toolbar" aria-label="Style du texte">${B}${hl}${U}${I}${L}</div>${hint}`
  :`<div class="tb" role="toolbar" aria-label="Mise en page">${font}${size}${color}${hl}${B}${I}${U}${L}</div>${edv}${hint}`;
 const ed=box.querySelector('.ed');let saved=null;
 try{document.execCommand('defaultParagraphSeparator',false,'p')}catch{}
 document.addEventListener('selectionchange',()=>{const s=getSelection();if(s&&s.rangeCount&&ed.contains(s.anchorNode))saved=s.getRangeAt(0).cloneRange()});
 const fire=()=>ed.dispatchEvent(new Event('input',{bubbles:true}));
 const restore=()=>{ed.focus();if(saved){const s=getSelection();s.removeAllRanges();s.addRange(saved)}};
 const run=(c,v,css=true)=>{restore();try{document.execCommand('styleWithCSS',false,css);document.execCommand(c,false,v)}catch{}fire()};
 const collapsed=()=>!saved||saved.collapsed;
 box.querySelectorAll('button[data-b]').forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>run(b.dataset.b)});
 box.querySelectorAll('select[data-c]').forEach(s=>{s.onchange=()=>{const v=s.value,c=s.dataset.c;if(!v)return;
  if(c==='font')run('fontName',v);
  else if(c==='color')run('foreColor',v);
  else if(c==='hl'){restore();try{document.execCommand('styleWithCSS',false,true);if(!document.execCommand('hiliteColor',false,v))document.execCommand('backColor',false,v)}catch{}fire()}
  else if(c==='size'&&!collapsed()){run('fontSize','7',false);ed.querySelectorAll('font[size="7"]').forEach(f=>{const sp=document.createElement('span');sp.style.fontSize=v+'em';while(f.firstChild)sp.appendChild(f.firstChild);f.replaceWith(sp)});fire()}
  s.selectedIndex=0}});
 ed.addEventListener('paste',e=>{e.preventDefault();const t=(e.clipboardData||window.clipboardData).getData('text/plain');document.execCommand('insertText',false,t)});
 return{el:ed,html:()=>sanitize(ed.innerHTML),text:()=>htmlToText(ed.innerHTML),set:h=>{ed.innerHTML=sanitize(h)},clear:()=>{ed.innerHTML=''},onInput:f=>ed.addEventListener('input',f)};
}
