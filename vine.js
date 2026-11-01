// Haricot magique (accueil) ; page « Le lieu sûr » : une corde dorée en arc relie la femme (à gauche) à l'homme (à droite)
(()=>{
const svg=document.getElementById('vine'),sc=document.getElementById('scene');if(!svg)return;
const WOMAN=`<g fill="none" stroke="var(--gold)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"> <path d="M0 -12L0 12" stroke="var(--rope)" stroke-width="1.8"/> <path d="M-5 20C-11 28-10 44-13 62M5 20C11 28 10 44 13 60" opacity=".8" stroke-width="1"/> <path d="M-15.5 38C-15 28-10 18-5.5 9L-1.5 11C-5 19-8 29-9 39Z" fill="var(--gold)" fill-opacity=".12"/> <path d="M15.5 38C15 28 10 18 5.5 9L1.5 11C5 19 8 29 9 39Z" fill="var(--gold)" fill-opacity=".12"/> <path d="M-2.4 29.5L-2.4 37M2.4 29.5L2.4 37"/> <path d="M-13 38C-7 36 7 36 13 38C14 48 9 55 8 61C10 67 14 71 14 79L-14 79C-14 71-10 67-8 61C-9 55-14 48-13 38Z" fill="var(--gold)" fill-opacity=".12"/> <path d="M-14 79C-15 92-11 104-9.5 116C-9 122-7.5 127-5.5 134L-1 134C-1 126 0 118 0 110L0 79ZM14 79C15 92 11 104 9.5 116C9 122 7.5 127 5.5 134L1 134C1 126 0 118 0 110L0 79Z" fill="var(--gold)" fill-opacity=".12"/> <ellipse cx="0" cy="24" rx="4.9" ry="6.2" fill="var(--bg)"/> <path d="M-4 20C-2 17 3 17 5 20" stroke-width="1" opacity=".7"/> <g stroke="var(--rope)" stroke-width="1.3"><path d="M-12 41L8 65M12 41L-8 65M-12.5 45L12.5 45M-11 52L11 52M-8.6 59L8.6 59M-12 70L12 70M-14 81L14 81M-13 93L13 93M-11.5 105L11.5 105M-9.7 114L9.7 114M-9.6 117L9.6 117M-9.4 120L9.4 120"/></g> <g fill="var(--rope)" stroke="none"><circle cx="0" cy="52" r="1.6"/><circle cx="0" cy="81" r="1.6"/><circle cx="0" cy="117" r="1.9"/></g> <path d="M0 118C3 124 1 128 4 132" stroke="var(--rope)" stroke-width="1.1"/> <ellipse cx="-3.2" cy="9.5" rx="2.9" ry="3.3" fill="var(--bg)"/><ellipse cx="3.2" cy="11.5" rx="2.9" ry="3.3" fill="var(--bg)"/> </g>`;
const MAN=`<g fill="none" stroke="var(--gold)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"> <path d="M-34 99C-39 112-41 130-40 150L-34 151C-34 134-33 118-30 106Z" fill="var(--gold)" fill-opacity=".12"/> <path d="M-34 98C-24 93-8 93 2 98C3 114-2 128-3 142C-1 148-3 152-3 154L-29 154C-29 152-31 148-29 142C-30 128-35 114-34 98Z" fill="var(--gold)" fill-opacity=".12"/> <path d="M-6 102L-4.6 52L-3.6 9L3.6 9L4.6 52L6 102Z" fill="var(--gold)" fill-opacity=".12"/> <path d="M-29 154C-30 175-29 205-28 226L-19 226C-19 205-17 175-16 154ZM-16 154C-15 175-12 205-11 226L-2 226C-3 205-4 175-3 154Z" fill="var(--gold)" fill-opacity=".12"/> <ellipse cx="-24" cy="230" rx="8" ry="3"/><ellipse cx="-6" cy="230" rx="8" ry="3"/> <path d="M-19 88L-19 97M-13 88L-13 97"/> <ellipse cx="-16" cy="80" rx="7" ry="8.6" fill="var(--bg)"/> <g stroke="var(--gold)" stroke-width="3.2"><path d="M-5.4 19L5.4 13M-5.4 26L5.4 20M-5.4 33L5.4 27M-5.4 40L5.4 34M-5.4 47L5.4 41"/><path d="M5 43C9 52 6 60 9 68" stroke-width="2.6"/></g> <g stroke="var(--rope)" stroke-width="3.2" stroke-dasharray="1.2 3.4" opacity=".8"><path d="M-5.4 19L5.4 13M-5.4 26L5.4 20M-5.4 33L5.4 27M-5.4 40L5.4 34M-5.4 47L5.4 41"/><path d="M5 43C9 52 6 60 9 68" stroke-width="2.6"/></g> <ellipse cx="0" cy="3" rx="5.4" ry="6.2" fill="var(--bg)" stroke="var(--gold)"/><path d="M-3 3L3 3M-3.5 0L3.5 0" stroke-width=".9" opacity=".7"/> </g>`;
const calm=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode='',path,len=1,leaves=[],lastH=0,lastW=0,P={};
const isEnvers=()=>document.body.classList.contains('envers');
function build(){lastH=innerHeight;lastW=innerWidth;mode=isEnvers()?'rope':'vine';
 if(mode==='rope'){svg.innerHTML='';buildScene()}else{if(sc)sc.innerHTML='';buildVine()}grow()}
function buildVine(){
 const H=innerHeight,W=56,pts=[];
 for(let y=H+10;y>=-10;y-=12)pts.push([W/2+13*Math.sin(y/80),y]);
 const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 let g='';
 for(let i=6,k=0;i<pts.length-3;i+=9,k++){
  const x=pts[i][0],y=pts[i][1],s=k%2?-1:1;
  g+=`<g class="lf" data-y="${y}" transform="translate(${x} ${y}) scale(${s} 1) rotate(${-20-(k%3)*8})"><path d="M0 0C8-9 22-8 27 3C17 10 5 9 0 0Z" fill="var(--leaf)"/><path d="M2 1L22 3" stroke="var(--vine)" stroke-width=".8" fill="none"/></g>`;
  if(k%3===2)g+=`<g class="lf" data-y="${y}" transform="translate(${x} ${y}) scale(${-s} 1)"><ellipse cx="9" cy="9" rx="9" ry="3.2" transform="rotate(35 9 9)" fill="var(--pod)"/></g>`}
 const gy=Math.round(H*.82),gx=W/2+13*Math.sin(gy/80);
 g+=`<g class="gold" transform="translate(${gx.toFixed(1)} ${gy}) rotate(10)"><circle cx="9" cy="9" r="22" fill="transparent"/><g transform="rotate(35 9 9)"><ellipse cx="9" cy="9" rx="9" ry="3.4" fill="var(--key)"/><text x="9" y="10.7" font-size="4.6" text-anchor="middle" fill="#2f4a33" fill-opacity=".6" font-family="Georgia,serif">8</text></g></g>`;
 svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
 svg.innerHTML=`<g class="sway"><path id="stem" d="${d}" fill="none" stroke="var(--vine)" stroke-width="3" stroke-linecap="round"/>${g}</g>`;
 svg.querySelector('.gold').onclick=()=>{typeof openDoor==='function'&&openDoor()};
 path=svg.querySelector('#stem');len=path.getTotalLength();leaves=[...svg.querySelectorAll('.lf')];}

function buildScene(){
 if(!sc)return;
 const W=innerWidth,H=innerHeight,kW=W>1100?1.4:1.15,s=Math.min(.9,(H-60)/260);
 P={W,H,wx:70,mx:W-70,my:H-24-232*s};
 sc.setAttribute('viewBox',`0 0 ${W} ${H}`);
 sc.innerHTML=`<path id="arc" fill="none" stroke="var(--gold)" stroke-width="3.2" stroke-linecap="round"/><path id="arc2" fill="none" stroke="var(--rope)" stroke-width="3.2" stroke-dasharray="1.4 4.4" opacity=".75"/>
 <g id="fig"><g>${calm?'':'<animateTransform attributeName="transform" type="rotate" values="-2.5;2.5;-2.5" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="7s" repeatCount="indefinite"/>'}<g transform="scale(${kW})">${WOMAN}</g></g></g>
 <g id="man" transform="translate(${P.mx} ${P.my}) scale(${s})">${MAN}</g>`}
function grow(){
 const H=innerHeight,max=document.documentElement.scrollHeight-innerHeight,p=max>0?Math.min(scrollY/max,1):1;
 if(mode==='rope'){
  if(!sc||!sc.querySelector('#arc'))return;
  const{W,wx,mx,my}=P,y1=H*(.3+.22*p),d=`M ${wx} ${y1} C ${wx} ${y1*.35} ${wx} 14 ${wx+110} 18 Q ${W/2} 58 ${mx-110} 18 C ${mx} 14 ${mx} ${my*.35} ${mx} ${my}`;
  sc.querySelector('#arc').setAttribute('d',d);sc.querySelector('#arc2').setAttribute('d',d);
  sc.querySelector('#fig').setAttribute('transform',`translate(${wx} ${y1})`);return}
 if(!path)return;
 const r=.3+.7*p;
 path.style.strokeDasharray=len;path.style.strokeDashoffset=len*(1-r);
 leaves.forEach(l=>{l.style.transition='opacity .6s';l.style.opacity=(H-l.dataset.y)/H<=r?1:0})}
addEventListener('scroll',grow,{passive:true});
addEventListener('resize',()=>{(Math.abs(innerHeight-lastH)>150||Math.abs(innerWidth-lastW)>80)?build():grow()});
new ResizeObserver(grow).observe(document.body);
new MutationObserver(()=>{if((mode==='rope')!==isEnvers())build()}).observe(document.body,{attributes:true,attributeFilter:['class']});
build();
})();
