// Le haricot magique (accueil) devient une corde dorée avec une silhouette suspendue (le lieu sûr)
(()=>{
const svg=document.getElementById('vine');if(!svg)return;
const FIG=`<g fill="none" stroke="var(--gold)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"> <circle cx="0" cy="1.5" r="2.6"/> <path d="M-1.2 3.8L-13 34M1.2 3.8L13 34" stroke-width="1.6"/> <path d="M-5 14C-13 22-12 40-16 56C-17 62-14 68-12 71M5 13C13 22 12 38 15 52C16 60 13 66 12 72" opacity=".8" stroke-width="1"/> <path d="M-12 34C-6 32 6 32 12 34C13 44 8 52 7 58C9 64 13 68 13 74L-13 74C-13 68 -9 64 -7 58C-8 52 -13 44 -12 34Z" fill="var(--gold)" fill-opacity=".12"/> <path d="M-13 74C-14 88-11 100-10 112C-9 120-7 126-5 133L-1 133C-1 124 0 116 0 108L0 74ZM13 74C14 88 11 100 10 112C9 120 7 126 5 133L1 133C1 124 0 116 0 108L0 74Z" fill="var(--gold)" fill-opacity=".12"/> <path d="M-7 16C-12 30-9 46-11 60M7 15C11 28 10 44 12 58" opacity=".5" stroke-width=".8"/> <path d="M-3 25.5L-3 33M3 25.5L3 33"/> <ellipse cx="1" cy="19" rx="7" ry="8.6" transform="rotate(12 1 19)" fill="var(--bg)"/> <path d="M-6 14C-2 9 5 9 8 14C6 12 0 12-4 16" stroke-width="1" opacity=".7"/> <g stroke-width="1.3" stroke="var(--rope)"><path d="M-12 36L7 62M12 36L-7 62M-11 42L11 42M-9.5 49L9.5 49M-8 56L8 56M-7 62L7 62"/> <path d="M-12 82L12 82M-11.5 92L11.5 92M-10 106L10 106"/></g> <g fill="var(--rope)" stroke="none"><circle cx="0" cy="49" r="1.7"/><circle cx="0" cy="82" r="1.7"/><circle cx="0" cy="62" r="1.7"/></g> </g>`;
const calm=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode='',path,len=1,leaves=[],lastH=0;
const isEnvers=()=>document.body.classList.contains('envers');
function build(){lastH=innerHeight;mode=isEnvers()?'rope':'vine';mode==='rope'?buildRope():buildVine();grow()}
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
 g+=`<g class="gold" transform="translate(${gx.toFixed(1)} ${gy}) rotate(10)"><circle cx="9" cy="9" r="22" fill="transparent"/><g transform="rotate(35 9 9)"><ellipse cx="9" cy="9" rx="9" ry="3.4" fill="var(--gold)"/><text x="9" y="10.7" font-size="4.6" text-anchor="middle" fill="#6b5216" fill-opacity=".6" font-family="Georgia,serif">8</text></g></g>`;
 svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
 svg.innerHTML=`<g class="sway"><path id="stem" d="${d}" fill="none" stroke="var(--vine)" stroke-width="3" stroke-linecap="round"/>${g}</g>`;
 svg.querySelector('.gold').onclick=()=>{location.hash='#/envers'};
 path=svg.querySelector('#stem');len=path.getTotalLength();leaves=[...svg.querySelectorAll('.lf')];}
function buildRope(){
 const H=innerHeight,k=innerWidth>760?1.5:1;
 svg.setAttribute('viewBox',`0 0 150 ${H}`);
 svg.innerHTML=`<path id="r1" fill="none" stroke="var(--gold)" stroke-width="4" stroke-linecap="round"/><path id="r2" fill="none" stroke="var(--rope)" stroke-width="4" stroke-dasharray="1.6 5" opacity=".75"/><g id="fig"><g>${calm?'':'<animateTransform attributeName="transform" type="rotate" values="-3;3;-3" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="7s" repeatCount="indefinite"/>'}<g transform="scale(${k})">${FIG}</g></g></g>`}
function grow(){
 const H=innerHeight,max=document.documentElement.scrollHeight-innerHeight,p=max>0?Math.min(scrollY/max,1):1;
 if(mode==='rope'){
  const e=H*(.22+.3*p),d=`M60 -10C66 ${e*.3} 54 ${e*.65} 60 ${e}`;
  svg.querySelector('#r1').setAttribute('d',d);svg.querySelector('#r2').setAttribute('d',d);
  svg.querySelector('#fig').setAttribute('transform',`translate(60 ${e})`);return}
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
