// Statistiques d'écriture (pages admin et invité). Les chiffres viennent des textes eux-mêmes :
// à chaque enregistrement, les mots ajoutés sont notés à la date du jour (champ wl, brouillons compris) ;
// les mots déjà présents avant cette fonction sont placés à la date du texte.
(function(){if(document.getElementById('st-css'))return;const s=document.createElement('style');s.id='st-css';s.textContent=`
.st-tabs{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;margin:1rem 0 .4rem}
.st-tabs button{background:none;color:var(--ink);border:1px solid var(--line);padding:.4rem .9rem;font-size:.9rem}
.st-tabs button[aria-pressed=true]{background:var(--accent);color:var(--on);border-color:var(--accent)}
.st-tabs button[disabled]{opacity:.35;cursor:default}
.st-rng{flex:1;text-align:center;color:var(--soft);font-size:.9rem;min-width:7rem}
.st-ch{display:flex;align-items:flex-end;gap:4px;height:210px;padding:.4rem .4rem 0;border:1px solid var(--line);border-radius:8px;background:var(--card)}
.st-b{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%}
.st-v{font-size:.68rem;color:var(--soft);height:1rem;line-height:1rem;white-space:nowrap}
.st-bar{width:100%;display:flex;flex-direction:column;justify-content:flex-end;height:calc(100% - 2.7rem)}
.st-bar i{display:block;width:100%}
.st-pb{background:var(--accent);opacity:.8;border-radius:3px 3px 0 0}
.st-dr{background:repeating-linear-gradient(45deg,var(--accent),var(--accent) 3px,transparent 3px,transparent 6px);opacity:.55;border-radius:3px 3px 0 0}
.st-b.now .st-pb{opacity:1}
.st-l{font-size:.68rem;color:var(--soft);height:1.4rem;line-height:1.4rem;white-space:nowrap;overflow:hidden}
.st-leg{display:flex;flex-wrap:wrap;gap:1rem;margin:.5rem 0 0;font-size:.82rem;color:var(--soft)}
.st-leg i{display:inline-block;width:.9rem;height:.7rem;margin-right:.35rem;vertical-align:-.05rem;border-radius:2px}
.st-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.6rem;margin:1.2rem 0}
@media(max-width:560px){.st-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
.st-c{padding:.7rem .8rem;border:1px solid var(--line);border-radius:8px;background:var(--card)}
.st-n{font:500 1.7rem/1.1 var(--serif,Georgia,serif)}
.st-t{font-size:.82rem;color:var(--soft);margin-top:.2rem}
.st-s{font-size:.78rem;color:var(--accent);margin-top:.15rem}
@media(max-width:560px){.st-b:nth-child(odd) .st-l{visibility:hidden}.st-v{font-size:.6rem}}
.st-note{color:var(--soft);font-size:.82rem;margin:1rem 0}
.st-note.warn{color:var(--accent)}
`;document.head.appendChild(s)})();

const sIso=d=>{const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())};
const sDate=s=>new Date(s+'T12:00:00');
const sAdd=(d,n)=>{const x=new Date(d.getTime());x.setDate(x.getDate()+n);return x};
const sMonday=d=>sAdd(d,-((d.getDay()+6)%7));
const sFr=n=>Math.round(n).toLocaleString('fr-FR');
const sFr1=n=>(Math.round(n*10)/10).toLocaleString('fr-FR');
const sShort=d=>d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
const sEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let STS={mode:'day',off:0};
const ST_COL=['#7a6a80','#6f9f66','#d4ae52','#6c9bd1','#d58a97','#e0806a','#8d949e','#4f8f8b'];

// événements d'écriture : {d:date, w:mots, dr:brouillon ?, r:rubrique}
function statEvents(entries,who){
 const ev=[];
 const add=(x,date,draft,rub)=>{const wl=x.wl||{};let sum=0;
  for(const d in wl){if(wl[d]>0)ev.push({d,w:wl[d],dr:draft,r:rub});sum+=wl[d]}
  const old=Math.max(0,wordsOf(x.body)-sum);if(old>0&&date)ev.push({d:date,w:old,dr:draft,r:rub})};
 for(const{t,rub}of entries){
  if(isDuo(t)){for(const p of t.parts)if(p.by===who)add(p,p.date||t.date,false,rub)}
  else add(t,t.date,!!t.draft,rub)}
 return ev}

// o:{box, entries:[{t,rub}], who:'moi'|'invite', note}
function statsRender(o){
 const box=o.box,ev=statEvents(o.entries,o.who),now=new Date(),today=sIso(now);
 const byDay={};ev.forEach(e=>{const b=byDay[e.d]||(byDay[e.d]={p:0,d:0});e.dr?b.d+=e.w:b.p+=e.w});
 const sumR=(a,b)=>{let s=0;for(const d in byDay)if(d>=a&&d<=b)s+=byDay[d].p+byDay[d].d;return s};
 const total=ev.reduce((s,e)=>s+e.w,0),days=Object.keys(byDay).sort();
 const monthsFrom=iso=>{if(!iso)return 1;const a=sDate(iso);return Math.max(1,(now.getFullYear()-a.getFullYear())*12+now.getMonth()-a.getMonth()+1)};
 // textes publiés / brouillons
 let pubN=0,pubW=0,drN=0,drW=0,firstPub='';
 for(const{t}of o.entries){
  if(isDuo(t)){const mine=t.parts.filter(p=>p.by===o.who);if(!mine.length)continue;pubN++;pubW+=mine.reduce((s,p)=>s+wordsOf(p.body),0);const d=t.date||'';if(d&&(!firstPub||d<firstPub))firstPub=d}
  else if(t.draft){drN++;drW+=wordsOf(t.body)}
  else{pubN++;pubW+=wordsOf(t.body);const d=t.date||'';if(d&&(!firstPub||d<firstPub))firstPub=d}}
 let best=null;days.forEach(d=>{const v=byDay[d].p+byDay[d].d;if(!best||v>best.v)best={d,v}});
 const m0=sIso(new Date(now.getFullYear(),now.getMonth(),1));
 const wDays=days.filter(d=>d>=m0&&d<=today&&byDay[d].p+byDay[d].d>0).length;
 // histogramme
 const N={day:14,week:12,month:12}[STS.mode],bk=[];
 for(let i=N-1;i>=0;i--){const k=i+STS.off*N;let a,b,l;
  if(STS.mode==='day'){const d=sAdd(now,-k);a=b=sIso(d);l=d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}
  else if(STS.mode==='week'){const d=sMonday(sAdd(now,-7*k));a=sIso(d);b=sIso(sAdd(d,6));l=d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}
  else{const d=new Date(now.getFullYear(),now.getMonth()-k,1);a=sIso(d);b=sIso(new Date(d.getFullYear(),d.getMonth()+1,0));l=d.toLocaleDateString('fr-FR',{month:'short'}).replace('.','')+(d.getMonth()===0?' '+String(d.getFullYear()).slice(2):'')}
  let p=0,dr=0;for(const d in byDay)if(d>=a&&d<=b){p+=byDay[d].p;dr+=byDay[d].d}
  bk.push({a,b,l,p,dr,now:k===0})}
 const mx=Math.max(1,...bk.map(x=>x.p+x.dr));
 const rng=bk.length?sShort(sDate(bk[0].a))+' – '+sShort(sDate(bk[bk.length-1].b))+' '+sDate(bk[bk.length-1].b).getFullYear():'';
 const chart=bk.map(x=>{const t=x.p+x.dr,h=v=>(v/mx*100).toFixed(1)+'%';
  return `<div class="st-b${x.now?' now':''}" title="${sEsc(x.l)} : ${sFr(t)} mot${t>1?'s':''}${x.dr?' (dont '+sFr(x.dr)+' en brouillon)':''}"><span class="st-v">${t?sFr(t):''}</span><div class="st-bar"><i class="st-dr" style="height:${h(x.dr)}"></i><i class="st-pb" style="height:${h(x.p)}"></i></div><span class="st-l">${sEsc(x.l)}</span></div>`}).join('');
 // camembert par rubrique
 const byR={};ev.forEach(e=>{byR[e.r]=(byR[e.r]||0)+e.w});
 const rs=Object.keys(byR).sort((a,b)=>byR[b]-byR[a]);let acc=0;
 const stops=rs.map((r,i)=>{const a=acc/total*100;acc+=byR[r];return`${ST_COL[i%ST_COL.length]} ${a}% ${acc/total*100}%`});
 const pie=total?`<div class="mem"><div class="pie" role="img" aria-label="Répartition des mots par rubrique" style="width:120px;height:120px;background:conic-gradient(${stops.join(',')})"></div><div class="leg">${rs.map((r,i)=>`<i style="background:${ST_COL[i%ST_COL.length]}"></i>${sEsc(r)} : ${sFr(byR[r])} mot${byR[r]>1?'s':''} (${Math.round(byR[r]/total*100)} %)`).join('<br>')}</div></div>`:'';
 const card=(n,t,s)=>`<div class="st-c"><div class="st-n">${n}</div><div class="st-t">${t}</div>${s?`<div class="st-s">${s}</div>`:''}</div>`;
 const wk=sIso(sMonday(now));
 box.innerHTML=
  (o.note?`<p class="st-note warn">${sEsc(o.note)}</p>`:'')
  +`<div class="st-cards">`
  +card(sFr(sumR(today,today)),'Mots aujourd’hui')
  +card(sFr(sumR(wk,today)),'Mots cette semaine')
  +card(sFr(sumR(m0,today)),'Mots ce mois-ci',wDays+' jour'+(wDays>1?'s':'')+' d’écriture')
  +card(sFr(total),'Mots écrits en tout',sFr(total/monthsFrom(days[0]))+' par mois en moyenne')
  +card(sFr(pubN),'Textes publiés',pubN?sFr1(pubN/monthsFrom(firstPub))+' par mois en moyenne':'')
  +card(sFr(drN),'Brouillons',drN?sFr(drW)+' mot'+(drW>1?'s':'')+' à finir':'')
  +card(best?sFr(best.v):'0','Meilleur jour',best?sShort(sDate(best.d))+' '+sDate(best.d).getFullYear():'')
  +card(pubN?sFr(pubW/pubN):'0','Mots par texte publié')
  +`</div>`
  +`<div class="st-tabs" role="group" aria-label="Période">`
  +['day|Jour','week|Semaine','month|Mois'].map(x=>{const[k,l]=x.split('|');return`<button type="button" data-m="${k}" aria-pressed="${STS.mode===k}">${l}</button>`}).join('')
  +`<span class="st-rng"><button type="button" data-o="1" aria-label="Période précédente">‹</button> ${sEsc(rng)} <button type="button" data-o="-1" aria-label="Période suivante"${STS.off<=0?' disabled':''}>›</button></span></div>`
  +`<div class="st-ch" role="img" aria-label="Mots écrits">${chart}</div>`
  +`<div class="st-leg"><span><i style="background:var(--accent);opacity:.8"></i>Texte publié</span><span><i style="background:repeating-linear-gradient(45deg,var(--accent),var(--accent) 2px,transparent 2px,transparent 4px);opacity:.6"></i>Brouillon</span></div>`
  +pie
  +`<p class="st-note">Chaque enregistrement (brouillon, publication ou modification) ajoute à la date du jour les mots écrits en plus ; supprimer des mots ne retranche rien. Les textes écrits avant cette fonction sont placés à leur date.</p>`;
 box.onclick=ev=>{const b=ev.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.m){STS={mode:b.dataset.m,off:0};statsRender(o)}
  else if(b.dataset.o){STS.off=Math.max(0,STS.off+(+b.dataset.o));statsRender(o)}}}
