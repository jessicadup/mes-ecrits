// Le haricot magique (accueil) devient une corde dorée avec une silhouette suspendue (le lieu sûr)
(()=>{
const svg=document.getElementById('vine');if(!svg)return;
const FIG=`<g fill="none" stroke="var(--gold)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"> <circle cx="0" cy="1.5" r="2.6"/> <path d="M0 4L-20 33.2M0 4L-7 23.2M0 4L7 23.2M0 4L20 33.2" stroke="var(--rope)" stroke-width="1.5"/> <g transform="translate(0 66) scale(1.25)"> <path d="M0-19C-10-18-16-8-16 6M2-19C-6-18-12-6-13 8M-3-18C-12-12-19 0-18 12M-1-19C-7-12-11 0-9 10" stroke-width="1" opacity=".8"/> <path d="M-6-8C-15 0-17 14-11 23C-6 27 6 27 14 25C19 18 19 8 14 0C11-4 6-6 0-7Z" fill="var(--gold)" fill-opacity=".16"/> <path d="M-8 21C0 14 8 6 14 0M-7-4C0 4 8 6 14 0" stroke-width=".9" opacity=".75"/> <ellipse cx="5" cy="-13" rx="6.3" ry="6.8" transform="rotate(20 5 -13)" fill="var(--bg)"/> <path d="M-1-16C2-22 11-20 11-13" stroke-width="1"/> </g> <g stroke="var(--rope)" stroke-width="1.1"> <ellipse cx="0" cy="66" rx="30" ry="44" stroke-width="1.8"/> <path d="M0 22C-17 44-17 88 0 110M0 22C17 44 17 88 0 110"/> <ellipse cx="0" cy="40" rx="24.2" ry="3.4"/><ellipse cx="0" cy="53" rx="28.7" ry="3.4"/><ellipse cx="0" cy="66" rx="30" ry="3.4"/><ellipse cx="0" cy="79" rx="28.7" ry="3.4"/><ellipse cx="0" cy="92" rx="24.2" ry="3.4"/> </g> <g fill="var(--rope)" stroke="none"><circle cx="-20" cy="33.2" r="1.7"/><circle cx="20" cy="33.2" r="1.7"/><circle cx="-7" cy="23.2" r="1.7"/><circle cx="7" cy="23.2" r="1.7"/></g> </g>`;
const calm=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const svg2=document.getElementById('vine2');
const HAND=`<g fill="var(--gold)" fill-opacity=".10" stroke="var(--gold)" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"> <path d="M0-14C20-16 40-18 78-20L78 20C40 19 20 16 0 14Z"/> <path d="M0-14C-8-17-22-18-34-16C-36-8-36 8-34 17C-22 19-8 17 0 14Z"/> <rect x="-70" y="-16.5" width="37" height="8" rx="4" transform="rotate(-4 -34 -12)"/> <rect x="-75" y="-8.5" width="42" height="8.2" rx="4.1" transform="rotate(-1 -34 -4)"/> <rect x="-71" y="-.3" width="38" height="8" rx="4" transform="rotate(2 -34 4)"/> <rect x="-62" y="8" width="29" height="7.6" rx="3.8" transform="rotate(6 -34 12)"/> <path d="M-6 14C-12 20-20 26-28 31C-33 34-37 30-34 27C-28 22-22 16-19 11Z"/> <path d="M-10-6C-18-2-24 4-26 10M-8 5C-14 9-19 12-23 14" fill="none" stroke-width=".9" opacity=".6"/> </g> <g fill="none" stroke-linecap="round"> <path d="M3-15C9-6 9 6 3 15M10-15.5C16-6 16 6 10 15.5M17-16C23-6 23 6 17 16" stroke="var(--gold)" stroke-width="3.6"/> <path d="M3-15C9-6 9 6 3 15M10-15.5C16-6 16 6 10 15.5M17-16C23-6 23 6 17 16" stroke="var(--rope)" stroke-width="3.6" stroke-dasharray="1.2 3.4" opacity=".8"/> <path d="M17 15.5C21 24 15 32 19 42" stroke="var(--gold)" stroke-width="3"/><path d="M17 15.5C21 24 15 32 19 42" stroke="var(--rope)" stroke-width="3" stroke-dasharray="1.2 3.4" opacity=".8"/> </g>`;
const WX=125;let K2=1;
let mode='',path,len=1,leaves=[],lastH=0;
const isEnvers=()=>document.body.classList.contains('envers');
function build(){lastH=innerHeight;mode=isEnvers()?'rope':'vine';mode==='rope'?buildRope():buildVine();if(svg2){svg2.innerHTML='';if(mode==='rope')buildHand()}grow()}
function buildHand(){
 const k=innerWidth>1100?1.4:1;K2=k;
 svg2.setAttribute('viewBox',`0 0 190 ${innerHeight}`);
 svg2.innerHTML=`<path id="h1" fill="none" stroke="var(--gold)" stroke-width="4" stroke-linecap="round"/><path id="h2" fill="none" stroke="var(--rope)" stroke-width="4" stroke-dasharray="1.6 5" opacity=".75"/><g id="hand"><g transform="scale(${k})">${HAND}</g></g>`}
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
function buildRope(){
 const H=innerHeight,k=innerWidth>760?1.5:.8;
 svg.setAttribute('viewBox',`0 0 150 ${H}`);
 svg.innerHTML=`<path id="r1" fill="none" stroke="var(--gold)" stroke-width="4" stroke-linecap="round"/><path id="r2" fill="none" stroke="var(--rope)" stroke-width="4" stroke-dasharray="1.6 5" opacity=".75"/><g id="fig"><g>${calm?'':'<animateTransform attributeName="transform" type="rotate" values="-3;3;-3" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="7s" repeatCount="indefinite"/>'}<g transform="scale(${k})">${FIG}</g></g></g>`}
function grow(){
 const H=innerHeight,max=document.documentElement.scrollHeight-innerHeight,p=max>0?Math.min(scrollY/max,1):1;
 if(mode==='rope'){
  const e=H*(.22+.3*p),d=`M72 -10C78 ${e*.3} 66 ${e*.65} 72 ${e}`;
  svg.querySelector('#r1').setAttribute('d',d);svg.querySelector('#r2').setAttribute('d',d);
  svg.querySelector('#fig').setAttribute('transform',`translate(72 ${e})`);
  if(svg2&&svg2.querySelector('#h1')){const e2=H*(.4+.25*p),x=WX+3*K2,y=e2-15*K2,d2=`M${x} -10C${x+5} ${y*.35} ${x-5} ${y*.7} ${x} ${y}`;
   svg2.querySelector('#h1').setAttribute('d',d2);svg2.querySelector('#h2').setAttribute('d',d2);
   svg2.querySelector('#hand').setAttribute('transform',`translate(${WX} ${e2})`)}
  return}
 if(!path)return;
 const r=.3+.7*p;
 path.style.strokeDasharray=len;path.style.strokeDashoffset=len*(1-r);
 leaves.forEach(l=>{l.style.transition='opacity .6s';l.style.opacity=(H-l.dataset.y)/H<=r?1:0})}
addEventListener('scroll',grow,{passive:true});
addEventListener('resize',()=>{Math.abs(innerHeight-lastH)>150?build():grow()});
new ResizeObserver(grow).observe(document.body);
new MutationObserver(()=>{if((mode==='rope')!==isEnvers())build()}).observe(document.body,{attributes:true,attributeFilter:['class']});
build();
})();
