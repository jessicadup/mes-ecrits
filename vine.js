// Le haricot magique : une tige qui grimpe sur le côté et pousse quand on fait défiler la page
(()=>{
const svg=document.getElementById('vine');if(!svg)return;
let path,len=1,leaves=[],lastH=0;
function build(){
 const H=innerHeight,W=56,pts=[];lastH=H;
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
 path=svg.querySelector('#stem');len=path.getTotalLength();leaves=[...svg.querySelectorAll('.lf')];grow()}
function grow(){
 if(!path)return;
 const max=document.documentElement.scrollHeight-innerHeight,p=max>0?scrollY/max:1,r=.3+.7*p,H=innerHeight;
 path.style.strokeDasharray=len;path.style.strokeDashoffset=len*(1-r);
 leaves.forEach(l=>{l.style.transition='opacity .6s';l.style.opacity=(H-l.dataset.y)/H<=r?1:0})}
addEventListener('scroll',grow,{passive:true});
addEventListener('resize',()=>{Math.abs(innerHeight-lastH)>150?build():grow()});
new ResizeObserver(grow).observe(document.body);
build();
})();
