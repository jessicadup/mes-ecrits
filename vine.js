// Haricot magique (accueil) ; « Le lieu sûr » : la femme (à gauche, avec ses textes) et l'homme (à droite, avec ceux de l'invité) sont reliés par une corde en arc
(()=>{
const svg=document.getElementById('vine'),sc=document.getElementById('scene');if(!svg)return;
const WOMAN=`<g fill="none" stroke="var(--gold)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"> <path d="M0 -12L0 12" stroke="var(--rope)" stroke-width="1.8"/> <path d="M-5 20C-11 28-10 44-13 62M5 20C11 28 10 44 13 60" opacity=".8" stroke-width="1"/> <path d="M-15.5 38C-15 28-10 18-5.5 9L-1.5 11C-5 19-8 29-9 39Z" fill="var(--gold)" fill-opacity=".12"/> <path d="M15.5 38C15 28 10 18 5.5 9L1.5 11C5 19 8 29 9 39Z" fill="var(--gold)" fill-opacity=".12"/> <path d="M-2.4 29.5L-2.4 37M2.4 29.5L2.4 37"/> <path d="M-13 38C-7 36 7 36 13 38C14 48 9 55 8 61C10 67 14 71 14 79L-14 79C-14 71-10 67-8 61C-9 55-14 48-13 38Z" fill="var(--gold)" fill-opacity=".12"/> <path d="M-14 79C-15 92-11 104-9.5 116C-9 122-7.5 127-5.5 134L-1 134C-1 126 0 118 0 110L0 79ZM14 79C15 92 11 104 9.5 116C9 122 7.5 127 5.5 134L1 134C1 126 0 118 0 110L0 79Z" fill="var(--gold)" fill-opacity=".12"/> <ellipse cx="0" cy="24" rx="4.9" ry="6.2" fill="var(--bg)"/> <path d="M-4 20C-2 17 3 17 5 20" stroke-width="1" opacity=".7"/> <g stroke="var(--rope)" stroke-width="1.3"><path d="M-12 41L8 65M12 41L-8 65M-12.5 45L12.5 45M-11 52L11 52M-8.6 59L8.6 59M-12 70L12 70M-14 81L14 81M-13 93L13 93M-11.5 105L11.5 105M-9.7 114L9.7 114M-9.6 117L9.6 117M-9.4 120L9.4 120"/></g> <g fill="var(--rope)" stroke="none"><circle cx="0" cy="52" r="1.6"/><circle cx="0" cy="81" r="1.6"/><circle cx="0" cy="117" r="1.9"/></g> <path d="M0 118C3 124 1 128 4 132" stroke="var(--rope)" stroke-width="1.1"/> <ellipse cx="-3.2" cy="9.5" rx="2.9" ry="3.3" fill="var(--bg)"/><ellipse cx="3.2" cy="11.5" rx="2.9" ry="3.3" fill="var(--bg)"/> </g>`;
const MAN=`<g fill="none" stroke="var(--gold)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"> <path d="M-34 99C-39 112-41 130-40 150L-34 151C-34 134-33 118-30 106Z" fill="var(--gold)" fill-opacity=".12"/> <path d="M-34 98C-24 93-8 93 2 98C3 114-2 128-3 142C-1 148-3 152-3 154L-29 154C-29 152-31 148-29 142C-30 128-35 114-34 98Z" fill="var(--gold)" fill-opacity=".12"/> <path d="M-6 102L-4.6 52L-3.6 9L3.6 9L4.6 52L6 102Z" fill="var(--gold)" fill-opacity=".12"/> <path d="M-29 154C-30 175-29 205-28 226L-19 226C-19 205-17 175-16 154ZM-16 154C-15 175-12 205-11 226L-2 226C-3 205-4 175-3 154Z" fill="var(--gold)" fill-opacity=".12"/> <ellipse cx="-24" cy="230" rx="8" ry="3"/><ellipse cx="-6" cy="230" rx="8" ry="3"/> <path d="M-19 88L-19 97M-13 88L-13 97"/> <ellipse cx="-16" cy="80" rx="7" ry="8.6" fill="var(--bg)"/> <g stroke="var(--gold)" stroke-width="3.2"><path d="M-5.4 19L5.4 13M-5.4 26L5.4 20M-5.4 33L5.4 27M-5.4 40L5.4 34M-5.4 47L5.4 41"/><path d="M5 43C9 52 6 60 9 68" stroke-width="2.6"/></g> <g stroke="var(--rope)" stroke-width="3.2" stroke-dasharray="1.2 3.4" opacity=".8"><path d="M-5.4 19L5.4 13M-5.4 26L5.4 20M-5.4 33L5.4 27M-5.4 40L5.4 34M-5.4 47L5.4 41"/><path d="M5 43C9 52 6 60 9 68" stroke-width="2.6"/></g> <ellipse cx="0" cy="3" rx="5.4" ry="6.2" fill="var(--bg)" stroke="var(--gold)"/><path d="M-3 3L3 3M-3.5 0L3.5 0" stroke-width=".9" opacity=".7"/> </g>`;
sc&&(sc.style.cssText='position:absolute;top:0;left:0;width:100%;height:0;pointer-events:none;z-index:0;overflow:hidden;display:none');document.body.style.position='relative';
const calm=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode='',path,len=1,leaves=[],lastH=0,lastW=0,raf=0;
const isEnvers=()=>document.body.classList.contains('envers');
function build(){lastH=innerHeight;lastW=innerWidth;mode=isEnvers()?'rope':'vine';
 if(mode==='rope'){svg.style.display='none';svg.innerHTML='';buildScene()}else{if(sc){sc.innerHTML='';sc.style.display='none'}svg.style.display='';buildVine();grow()}}
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

// Page « Le lieu sûr » : les silhouettes sont posées à hauteur de leurs textes et défilent avec la page
function buildScene(){
 if(!sc)return;
 const q=s=>document.querySelector(s),mainEl=q('main');if(!mainEl)return;
 const W=innerWidth,compact=W<=900,foot=q('footer'),mr=mainEl.getBoundingClientRect();
 const dh=Math.max(innerHeight,(foot?foot.getBoundingClientRect().bottom:mr.bottom)+scrollY);
 const R=e=>{const r=e.getBoundingClientRect();return{t:r.top+scrollY,b:r.bottom+scrollY,l:r.left}};
 const mR=R(mainEl),mine=q('.mine')?R(q('.mine')):{t:mR.t,b:mR.t+260},his=q('.his')?R(q('.his')):{t:mR.b-320,b:mR.b};
 const gut=compact?(q('.mir')?R(q('.mir')).l+36:mr.left+36):mr.left;
 const kW=compact?.62:(W>1100?1.4:1.15),s=compact?.5:.9,k=s/.9,ox=compact?40:110,sw=compact?2.2:3.2;
 const wx=compact?Math.max(18,gut/2):Math.min(130,Math.max(40,gut*.5)),mx=compact?W-Math.max(18,gut/2)+17*s:W-wx;
 const hW=134*kW,y1=Math.min(Math.max((mine.t+mine.b)/2-hW/2,mine.t+10),Math.max(mine.b-hW-10,mine.t+10));
 const hM=233*s,feet=Math.min(Math.max((his.t+his.b)/2+hM/2,his.t+hM+20),Math.max(his.b-20,his.t+hM+20)),my=feet-232*s,gy=feet+2;
 const hatch=Array.from({length:12},(_,i)=>`M${mx-62*k+i*9*k} ${gy+1}l${-5*k} ${8*k}`).join('');
 sc.style.cssText='position:absolute;top:0;left:0;width:100%;height:'+dh+'px;pointer-events:none;z-index:0;overflow:hidden;display:block';
 sc.setAttribute('viewBox',`0 0 ${W} ${dh}`);sc.setAttribute('width',W);sc.setAttribute('height',dh);
 const d=`M ${wx} ${y1} C ${wx} ${y1*.35} ${wx} 14 ${wx+ox} 18 Q ${W/2} 58 ${mx-ox} 18 C ${mx} 14 ${mx} ${my*.35} ${mx} ${my}`;
 sc.innerHTML=`<path d="${d}" fill="none" stroke="var(--gold)" stroke-width="${sw}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="var(--rope)" stroke-width="${sw}" stroke-dasharray="1.4 4.4" opacity=".75"/>
 <g transform="translate(${wx} ${y1})"><g>${calm?'':'<animateTransform attributeName="transform" type="rotate" values="-2.5;2.5;-2.5" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="7s" repeatCount="indefinite"/>'}<g transform="scale(${kW})">${WOMAN}</g></g></g>
 <g fill="none" stroke="var(--gold)" stroke-linecap="round" stroke-width="1.3"><path d="M${mx-70*k} ${gy}L${mx+36*k} ${gy}"/><path d="${hatch}" opacity=".55" stroke-width="1"/><path d="M${mx-26*k} ${gy}C${mx-30*k} ${gy+10*k} ${mx-38*k} ${gy+14*k} ${mx-44*k} ${gy+22*k}M${mx-8*k} ${gy}C${mx-6*k} ${gy+10*k} ${mx+2*k} ${gy+16*k} ${mx+8*k} ${gy+24*k}" opacity=".6" stroke-width="1"/></g>
 <g transform="translate(${mx} ${my}) scale(${s})">${MAN}</g>`}
function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;if(mode==='rope')buildScene();else grow()})}
function grow(){
 if(mode==='rope')return;
 const H=innerHeight,max=document.documentElement.scrollHeight-innerHeight,p=max>0?Math.min(scrollY/max,1):1;
 if(!path)return;
 const r=.3+.7*p;
 path.style.strokeDasharray=len;path.style.strokeDashoffset=len*(1-r);
 leaves.forEach(l=>{l.style.transition='opacity .6s';l.style.opacity=(H-l.dataset.y)/H<=r?1:0})}
addEventListener('scroll',grow,{passive:true});
addEventListener('resize',()=>{(Math.abs(innerHeight-lastH)>150||Math.abs(innerWidth-lastW)>80)?build():schedule()});
new ResizeObserver(schedule).observe(document.body);
new MutationObserver(()=>{if((mode==='rope')!==isEnvers())build();else if(mode==='rope')schedule()}).observe(document.body,{attributes:true,attributeFilter:['class']});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(schedule);
build();
})();
