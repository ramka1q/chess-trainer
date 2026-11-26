/* ================= ШАХИ-БУРЯ: LIVE EVENTS =================
   Ten real-time events (~10 seconds each). They run WHILE you keep playing: you can react to them
   (move the hunted piece away, catch the thief, leave the fire…). Three of them break the fourth wall
   and leave the board for the rest of the website. Loaded before storm.js, which merges them into EVENTS.
   Each event: {i,n,rar,omen,d,live:true, run(A)} — A is the live API built by StormRun (see liveApi in storm.js). */
(function(){
'use strict';
window.STORM_LIVE_DEF=function(H){
const {sqN,fr,PACC,noise,tone}=H;
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const now=()=>performance.now();
const cheb=(a,b)=>{const[x,y]=fr(a),[u,v]=fr(b);return Math.max(Math.abs(x-u),Math.abs(y-v))};
const manh=(a,b)=>{const[x,y]=fr(a),[u,v]=fr(b);return Math.abs(x-u)+Math.abs(y-v)};
const inB=(f,r)=>f>=0&&f<8&&r>=0&&r<8;
const ALL=(()=>{const a=[];for(let r=0;r<8;r++)for(let f=0;f<8;f++)a.push(sqN(f,r));return a})();
const near=(sq,d=1)=>{const[f,r]=fr(sq),o=[];for(let df=-d;df<=d;df++)for(let dr=-d;dr<=d;dr++){if(!df&&!dr)continue;if(inB(f+df,r+dr))o.push(sqN(f+df,r+dr))}return o};
const colName=c=>c==='w'?'білого':'чорного';
const mk=(parent,css,html='')=>{const d=document.createElement('div');d.style.cssText='position:absolute;'+css;d.innerHTML=html;parent.appendChild(d);return d};
const pic=p=>window.PIC?PIC(p.color,p.type):'';
/* one-time styles */
if(!document.getElementById('wxLiveCss')){const s=document.createElement('style');s.id='wxLiveCss';s.textContent=`
@keyframes wxFl{0%{transform:scaleY(1) translateY(0)}50%{transform:scaleY(1.18) translateY(-4%)}100%{transform:scaleY(.92) translateY(2%)}}
@keyframes wxSpin{to{transform:rotate(360deg)}}
@keyframes wxPulse{0%,100%{opacity:.35}50%{opacity:.9}}
@keyframes wxBob{0%,100%{margin-top:0}50%{margin-top:-6%}}
@keyframes wxRain{to{transform:translateY(120%)}}
.wxFlame{position:absolute;left:8%;right:8%;bottom:4%;height:78%;transform-origin:50% 100%;border-radius:50% 50% 30% 30%/70% 70% 30% 30%;background:radial-gradient(ellipse at 50% 85%,#fff8c4 0,#ffd54f 22%,#ff9100 48%,rgba(255,61,0,.75) 66%,rgba(255,61,0,0) 74%);animation:wxFl .18s ease-in-out infinite alternate;mix-blend-mode:screen;pointer-events:none}
.wxHot{position:absolute;inset:0;background:radial-gradient(circle,rgba(255,120,0,.45),rgba(255,60,0,.15) 70%);pointer-events:none;animation:wxPulse .5s infinite}
.wxDanger{position:absolute;border:3px solid #ff1744;border-radius:6px;box-shadow:inset 0 0 14px #ff1744,0 0 10px #ff1744;animation:wxPulse .5s infinite;pointer-events:none;transition:left .25s,top .25s}
`;document.head.appendChild(s)}
/* ---------- drawings ---------- */
const DINO='<svg viewBox="0 0 100 80" width="100%" height="100%"><path d="M6 50Q18 38 37 41L50 30Q54 17 69 15L88 17Q97 19 96 28L86 30L93 34Q91 41 80 38L72 40Q66 50 58 54L61 72L52 72L50 59L41 61L43 74L34 74L32 58Q19 58 6 50Z" fill="#5d8a3a" stroke="#28401a" stroke-width="2.2" stroke-linejoin="round"/><path d="M80 31l2 4 2-4 2 4 2-4" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="80" cy="23" r="3.6" fill="#fff"/><circle cx="81" cy="23" r="1.8" fill="#111"/><path d="M60 44l7 4-2 3" fill="none" stroke="#28401a" stroke-width="2.4" stroke-linecap="round"/><path d="M40 44q6-5 14-4" fill="none" stroke="#8fbf5a" stroke-width="2"/></svg>';
const MONKEY='<svg viewBox="0 0 60 64" width="100%" height="100%"><path d="M44 50q14 2 12-12" fill="none" stroke="#6d4c41" stroke-width="4" stroke-linecap="round"/><ellipse cx="30" cy="46" rx="14" ry="13" fill="#8d6e63"/><circle cx="14" cy="22" r="7" fill="#8d6e63"/><circle cx="46" cy="22" r="7" fill="#8d6e63"/><circle cx="30" cy="24" r="15" fill="#8d6e63"/><ellipse cx="30" cy="28" rx="10" ry="9" fill="#ffccbc"/><circle cx="25" cy="22" r="2.4" fill="#111"/><circle cx="35" cy="22" r="2.4" fill="#111"/><path d="M25 31q5 4 10 0" fill="none" stroke="#5d4037" stroke-width="2"/></svg>';
const CHICK='<svg viewBox="0 0 60 60" width="100%" height="100%"><path d="M22 50l-2 8M36 50l2 8" stroke="#ff9800" stroke-width="3"/><ellipse cx="30" cy="36" rx="18" ry="15" fill="#fafafa" stroke="#bbb"/><circle cx="40" cy="20" r="9" fill="#fafafa" stroke="#bbb"/><path d="M36 11q3-7 6 0q3-6 5 2" fill="#e53935"/><path d="M48 20l7 2-7 3z" fill="#ffb300"/><circle cx="42" cy="18" r="1.8" fill="#111"/><path d="M41 28q2 4 0 6" fill="none" stroke="#e53935" stroke-width="3"/><path d="M14 34q6 6 14 2" fill="none" stroke="#ccc" stroke-width="2"/></svg>';
const EGG='<svg viewBox="0 0 40 50" width="100%" height="100%"><ellipse cx="20" cy="27" rx="14" ry="18" fill="#fff3d6" stroke="#d7c39a" stroke-width="1.5"/><ellipse cx="15" cy="19" rx="4" ry="6" fill="#fff" opacity=".8"/></svg>';
const BOMB='<svg viewBox="0 0 60 60" width="100%" height="100%"><circle cx="27" cy="36" r="19" fill="#212121" stroke="#000" stroke-width="2"/><ellipse cx="20" cy="28" rx="5" ry="3" fill="#616161" transform="rotate(-30 20 28)"/><rect x="34" y="12" width="9" height="9" rx="2" fill="#424242" transform="rotate(40 38 16)"/><path d="M42 12q6-8 12-4" fill="none" stroke="#a1887f" stroke-width="2.5"/></svg>';
const CURSOR='<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M3 2l15 11-6.5.8 3.8 7.4-3 1.5-3.7-7.5L3 20z" fill="#fff" stroke="#000" stroke-width="1.4"/></svg>';
const GRAB='<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M7 11V7a1.5 1.5 0 013 0v3-5a1.5 1.5 0 013 0v5-4a1.5 1.5 0 013 0v5-2a1.5 1.5 0 013 0v6c0 4-3 7-7 7h-1c-3 0-5-2-6-4l-2-4a1.5 1.5 0 012.5-1.5z" fill="#fff" stroke="#000" stroke-width="1.2"/></svg>';
/* ---------- sounds ---------- */
const snd={
  thud:(g=.25)=>{tone(70,.25,{f2:40,g});noise(.15,{f:200,g:g*.8})},
  roar:()=>{noise(1.2,{f:500,f2:150,g:.35,att:.1});tone(110,1.1,{type:'sawtooth',f2:60,g:.08})},
  chomp:()=>{noise(.08,{type:'bandpass',f:900,g:.5});setTimeout(()=>noise(.1,{type:'bandpass',f:600,g:.5}),110)},
  squeak:()=>tone(1500+Math.random()*600,.12,{type:'square',f2:2400,g:.03}),
  tick:(f=1400)=>tone(f,.05,{type:'square',g:.04}),
  boom:()=>{noise(1.4,{f:700,f2:60,g:.6,att:.005});tone(70,1,{f2:30,g:.2})},
  burn:()=>noise(.6,{type:'highpass',f:2500,g:.18}),
  pop:()=>tone(600,.12,{f2:1200,g:.06}),
  win:()=>[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.15,{type:'triangle',g:.06}),i*80)),
  sad:()=>[392,330,262].forEach((f,i)=>setTimeout(()=>tone(f,.25,{type:'triangle',g:.05}),i*150)),
  whoosh:()=>noise(.35,{type:'bandpass',f:600,f2:3500,g:.25}),
  knock:()=>{[0,180,360].forEach(d=>setTimeout(()=>{tone(170,.12,{f2:90,g:.3});noise(.04,{type:'bandpass',f:900,g:.3})},d))},
  click:()=>noise(.03,{type:'bandpass',f:3000,g:.35}),
  cluck:()=>{tone(700,.08,{type:'square',f2:500,g:.03});setTimeout(()=>tone(800,.08,{type:'square',f2:550,g:.03}),120)},
  chirp:()=>{for(let i=0;i<3;i++)setTimeout(()=>tone(2600,.06,{f2:3300,g:.03}),i*90)},
  hum:()=>tone(55,2,{type:'sawtooth',g:.03}),
  creep:()=>{tone(220,1.6,{g:.03});tone(233,1.6,{g:.03})},
};
/* smooth move of a positioned element (board or page coordinates); cancel by setting tok.stop */
function glide(el,x0,y0,x1,y1,ms,{hop=0,tok={}}={}){return new Promise(res=>{const t0=now();const f=()=>{if(tok.stop)return res(false);const k=Math.min(1,(now()-t0)/ms);const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
  el.style.left=(x0+(x1-x0)*e)+'px';el.style.top=(y0+(y1-y0)*e-Math.sin(k*Math.PI)*hop)+'px';if(k<1)requestAnimationFrame(f);else res(true)};f()})}
const place=(el,c,w,h)=>{el.style.left=(c.x-w/2)+'px';el.style.top=(c.y-h/2)+'px'};
/* a non-king piece of the player (bot game) or of anybody */
function victimSquare(A,m){const own=Object.keys(m).filter(s=>m[s].type!=='k'&&(!A.human||m[s].color===A.human));const any=Object.keys(m).filter(s=>m[s].type!=='k');return rnd(own.length?own:any)}
/* put a piece back near where it was */
function putBack(A,from,p){const m=A.map();const order=[from,...ALL.filter(s=>s!==from).sort((a,b)=>manh(a,from)-manh(b,from))];for(const s of order){if(m[s])continue;if(p.type==='p'&&(s[1]==='1'||s[1]==='8'))continue;if(A.add(s,p,null))return s}return null}

return{
/* 1 ─ the dinosaur hunts the nearest piece */
dino:{i:'🦖',n:'Динозавр',rar:'r',live:true,omen:'🌿 Земля здригається від важких кроків…',
  d:'Динозавр цілу хвилину повільно ходить по клітинках і йде до найближчої фігури. Не встиг відвести її — зʼїсть. Встиг — він піде до іншої. Короля не чіпає.',
  async run(A){
    const s0=A.sz();const W=()=>A.sz()*1.3;const d=mk(A.lay,`width:${W()}px;height:${W()*.8}px;z-index:6;filter:drop-shadow(0 5px 4px rgba(0,0,0,.55));transition:transform .2s`,DINO);
    const mark=mk(A.lay,'opacity:0');mark.className='wxDanger';
    const edge=rnd([[0,rnd([2,3,4,5])],[7,rnd([2,3,4,5])],[rnd([2,3,4,5]),0],[rnd([2,3,4,5]),7]]);let pos=sqN(edge[0],edge[1]);
    let c=A.center(pos);const off={x:c.x+(edge[0]===0?-W():edge[0]===7?W():0),y:c.y+(edge[1]===0?W():edge[1]===7?-W():0)};
    place(d,off,W(),W()*.8);snd.roar();await A.banner('Динозавр!','Ціла хвилина: відводь фігури, до яких він іде');
    await glide(d,off.x-W()/2,off.y-W()*.4,c.x-W()/2,c.y-W()*.55,700,{hop:s0*.15});snd.thud(.35);
    const T0=now();let eaten=0;
    while(A.alive()&&now()-T0<60000){
      const m=A.map();const tg=Object.keys(m).filter(s=>m[s].type!=='k');if(!tg.length)break;
      tg.sort((a,b)=>cheb(a,pos)-cheb(b,pos)||manh(a,pos)-manh(b,pos)||Math.random()-.5);const t=tg[0];A.threat([t]);
      const tc=A.center(t),sz=A.sz();Object.assign(mark.style,{left:(tc.x-sz/2)+'px',top:(tc.y-sz/2)+'px',width:sz+'px',height:sz+'px',opacity:1});
      if(t===pos){d.style.transform='scale(1.25) rotate(-8deg)';snd.chomp();const p=m[t];
        const ok=A.kill(t,`Динозавр зʼїв ${colName(p.color)} ${PACC[p.type]} на ${t}.`);await sleep(250);d.style.transform='';
        if(ok){eaten++;A.flash(t,'#ff1744')}else{snd.squeak();const n=near(pos).filter(s=>!m[s]);if(n.length)pos=rnd(n)}
        await sleep(1350);c=A.center(pos);await glide(d,parseFloat(d.style.left),parseFloat(d.style.top),c.x-W()/2,c.y-W()*.55,1350,{hop:sz*.1});continue}
      const[pf,pr]=fr(pos),[tf,tr]=fr(t);const nx=sqN(pf+Math.sign(tf-pf),pr+Math.sign(tr-pr));
      const a=A.center(pos),b=A.center(nx);d.querySelector('svg').style.transform=b.x<a.x-1?'scaleX(-1)':b.x>a.x+1?'':d.querySelector('svg').style.transform;
      pos=nx;await glide(d,a.x-W()/2,a.y-W()*.55,b.x-W()/2,b.y-W()*.55,1860,{hop:sz*.12});snd.thud();A.shake(2);await sleep(390)}
    A.threat(null);mark.remove();snd.roar();
    if(A.alive()){const a=A.center(pos),sz=A.sz();const ex=a.x<sz*4?-W()*1.5:sz*8+W()*.5;await glide(d,a.x-W()/2,a.y-W()*.55,ex,a.y-W()*.55,1200,{hop:sz*.2})}
    if(!eaten)A.say('Ти встиг відвести всі фігури. Динозавр пішов голодним!')}},
/* 2 ─ fire spreads from square to square */
fire:{i:'🔥',n:'Пожежа',rar:'c',live:true,omen:'🚬 Пахне димом…',
  d:'Одна клітинка спалахує, і вогонь 10 секунд розповзається на сусідні. Фігура, що простоїть у вогні 2 секунди, згорає. Потім іде дощ.',
  async run(A){
    const m0=A.map();const pcs=Object.keys(m0).filter(s=>m0[s].type!=='k'&&+s[1]>=3&&+s[1]<=6);const start=pcs.length?rnd(pcs):rnd(['d4','e4','d5','e5']);
    const burn=new Map(),hot=new Map();
    const ignite=sq=>{if(burn.has(sq))return;const box=mk(A.lay,'');const el2=mk(box,'inset:0','<div class="wxHot"></div><div class="wxFlame"></div><div class="wxFlame" style="left:30%;right:20%;height:55%;animation-duration:.13s"></div>');burn.set(sq,box);pos()};
    const pos=()=>{const sz=A.sz();burn.forEach((box,sq)=>{const c=A.center(sq);Object.assign(box.style,{left:(c.x-sz/2)+'px',top:(c.y-sz/2)+'px',width:sz+'px',height:sz+'px'})})};
    snd.burn();await A.banner('Пожежа!','Виводь фігури з вогню');ignite(start);
    const T0=now();let lastSpread=now(),burned=0;
    while(A.alive()&&now()-T0<10000){
      await sleep(200);pos();
      if(now()-lastSpread>1300&&burn.size<14){lastSpread=now();for(let k=0;k<1+(Math.random()<.5);k++){const from=rnd([...burn.keys()]);const[f,r]=fr(from);const opts=[[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>[f+a,r+b]).filter(([a,b])=>inB(a,b)).map(([a,b])=>sqN(a,b)).filter(s=>!burn.has(s));if(opts.length){ignite(rnd(opts));snd.burn()}}}
      const m=A.map();A.threat([...burn.keys()].filter(s=>m[s]&&m[s].type!=='k'));
      for(const sq of burn.keys()){const p=m[sq];if(!p||p.type==='k'){hot.delete(sq);continue}const key=p.color+p.type;const h=hot.get(sq);
        if(!h||h.key!==key){hot.set(sq,{key,t:now()});continue}
        if(now()-h.t>2000){hot.delete(sq);if(A.kill(sq,`Згорів ${colName(p.color)} ${PACC[p.type].replace('пішака','пішак').replace('коня','кінь').replace('слона','слон').replace('туру','тура').replace('ферзя','ферзь')} на ${sq}.`)){burned++;snd.burn();A.flash(sq,'#ff9100')}}}}
    A.threat(null);
    /* rain puts it out */
    const rain=mk(A.lay,'inset:-20% 0 0 0;background:repeating-linear-gradient(100deg,transparent 0 14px,rgba(160,200,255,.55) 14px 15px);z-index:8;opacity:0;transition:opacity .4s');requestAnimationFrame(()=>rain.style.opacity=1);
    rain.animate([{transform:'translateY(0)'},{transform:'translateY(20%)'}],{duration:300,iterations:8});noise(2.2,{type:'highpass',f:1500,g:.12,att:.3});
    burn.forEach(box=>box.animate([{opacity:1},{opacity:0}],{duration:1600,fill:'forwards'}));await sleep(1800);
    if(!burned&&A.alive())A.say('Жодна фігура не згоріла. Чудова реакція!')}},
/* 3 ─ a monkey steals a piece; catch it by clicking */
monkey:{i:'🐒',n:'Мавпа-злодійка',rar:'c',live:true,omen:'🍌 На підвіконні лежить шкірка від банана…',
  d:'Мавпа хапає фігуру й бігає з нею по дошці 10 секунд. Натисни на мавпу, щоб забрати фігуру назад. Не встигнеш — мавпа втече.',
  async run(A){
    const m=A.map();let from=victimSquare(A,m);let p=from&&m[from];if(!p)return;
    const sz0=A.sz();const mon=mk(A.lay,`width:${sz0*1.1}px;height:${sz0*1.2}px;z-index:7;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 4px 4px rgba(0,0,0,.5))`,MONKEY+`<img src="${pic(p)}" style="position:absolute;left:18%;top:-38%;width:64%;transform:rotate(-12deg)">`);
    A.stopProp(mon);const tok={};let caught=false;
    const catchIt=e=>{e.preventDefault();e.stopPropagation();if(caught||tok.stop)return;caught=true;tok.stop=true};
    mon.addEventListener('pointerdown',catchIt);mon.addEventListener('click',catchIt);
    const c0=A.center(from);place(mon,{x:-sz0,y:c0.y},sz0*1.1,sz0*1.2);
    await glide(mon,-sz0,c0.y-sz0*.6,c0.x-sz0*.55,c0.y-sz0*.6,600,{hop:sz0*.4,tok});
    if(!A.kill(from,`Мавпа вкрала ${colName(p.color)} ${PACC[p.type]} з ${from}.`)){mon.remove();return}
    snd.squeak();A.say('Лови мавпу! Натисни на неї.');
    let pos=from;const T0=now();
    while(A.alive()&&!caught&&now()-T0<10000){const sz=A.sz();const opts=near(pos,2);const nx=rnd(opts);const a=A.center(pos),b=A.center(nx);pos=nx;
      if(!await glide(mon,a.x-sz*.55,a.y-sz*.6,b.x-sz*.55,b.y-sz*.6,520,{hop:sz*.45,tok}))break;if(Math.random()<.3)snd.squeak()}
    if(caught&&A.alive()){snd.win();mon.querySelector('img').remove();mon.animate([{transform:'rotate(0)'},{transform:'rotate(-25deg)'},{transform:'rotate(20deg)'},{transform:'rotate(0)'}],{duration:500});
      const at=putBack(A,from,p);A.log(at?`Ти впіймав мавпу! ${PACC[p.type][0].toUpperCase()+PACC[p.type].slice(1)} повернувся на ${at}.`:'Мавпу впіймали, але фігуру нікуди поставити.');A.say(at?'Впіймав! Фігура повернулась.':'Впіймав, але місця для фігури немає.');
      const sz=A.sz();const a=A.center(pos);await sleep(300);await glide(mon,a.x-sz*.55,a.y-sz*.6,sz*9,a.y-sz,900,{hop:sz})}
    else if(A.alive()){snd.sad();const sz=A.sz();const a=A.center(pos);await glide(mon,a.x-sz*.55,a.y-sz*.6,a.x<sz*4?-sz*2:sz*9,a.y-sz*2,900,{hop:sz});A.log(`Мавпа втекла з ${PACC[p.type]}.`);A.say('Мавпа втекла з фігурою…')}}},
/* 4 ─ a bomb with a burning fuse */
bomb:{i:'💣',n:'Бомба',rar:'c',live:true,omen:'⏰ Щось тихо цокає…',
  d:'На дошку падає бомба з гнотом. Через 10 секунд вона вибухає і знищує всі фігури в квадраті 3×3 навколо себе (крім королів). Встигни вивести фігури.',
  async run(A){
    const m=A.map();let best=[],bv=-1;for(const sq of ALL){if(m[sq])continue;const v=near(sq).filter(s=>m[s]&&m[s].type!=='k').length;if(v>bv){bv=v;best=[sq]}else if(v===bv)best.push(sq)}const at=rnd(best.length?best:ALL);
    const area=[at,...near(at)];const sz0=A.sz();
    const zone=area.map(sq=>{const z=mk(A.lay,'background:rgba(255,23,68,.18)');z.className='wxDanger';return{sq,z}});
    const posZ=()=>{const sz=A.sz();zone.forEach(({sq,z})=>{const c=A.center(sq);Object.assign(z.style,{left:(c.x-sz/2+2)+'px',top:(c.y-sz/2+2)+'px',width:(sz-4)+'px',height:(sz-4)+'px'})})};posZ();
    const b=mk(A.lay,`width:${sz0*.9}px;height:${sz0*.9}px;z-index:7`,BOMB+`<svg viewBox="0 0 40 40" style="position:absolute;inset:-30%;width:160%;height:160%"><circle cx="20" cy="20" r="17" fill="none" stroke="#ff1744" stroke-width="2.5" stroke-dasharray="107" stroke-dashoffset="0" id="fz" transform="rotate(-90 20 20)"/></svg>`);
    const spark=mk(b,'left:78%;top:2%;width:26%;height:26%;border-radius:50%;background:radial-gradient(circle,#fff,#ffeb3b 40%,rgba(255,120,0,0) 70%)');spark.animate([{transform:'scale(.6)'},{transform:'scale(1.3)'}],{duration:120,iterations:200,direction:'alternate'});
    const c=A.center(at);await glide(b,c.x-sz0*.45,-sz0,c.x-sz0*.45,c.y-sz0*.45,600);snd.thud(.4);A.shake(4);
    await A.banner('Бомба!','10 секунд до вибуху');A.threat(area);
    const fz=b.querySelector('#fz');const T0=now();let nextTick=0;
    while(A.alive()&&now()-T0<10000){const k=(now()-T0)/10000;fz.setAttribute('stroke-dashoffset',String(107*k));posZ();const c2=A.center(at),sz=A.sz();b.style.left=(c2.x-sz*.45)+'px';b.style.top=(c2.y-sz*.45)+'px';
      if(now()-T0>nextTick){snd.tick(k>.7?1900:1400);nextTick+=k>.7?250:k>.4?500:1000}await sleep(50)}
    A.threat(null);if(!A.alive())return;
    snd.boom();A.shake(14);b.remove();const fl=mk(A.lay,`z-index:9;border-radius:50%;background:radial-gradient(circle,#fff,#ffeb3b 30%,#ff6d00 60%,rgba(255,61,0,0) 72%)`);const sz=A.sz();const cc=A.center(at);Object.assign(fl.style,{left:(cc.x-sz*2)+'px',top:(cc.y-sz*2)+'px',width:sz*4+'px',height:sz*4+'px'});
    fl.animate([{transform:'scale(.2)',opacity:1},{transform:'scale(1)',opacity:1,offset:.4},{transform:'scale(1.2)',opacity:0}],{duration:800,fill:'forwards'});
    const m2=A.map();let n=0;for(const sq of area){const p=m2[sq];if(p&&p.type!=='k'&&A.kill(sq,null))n++}
    A.log(n?`Бомба вибухнула на ${at} і знищила фігур: ${n}.`:`Бомба вибухнула на ${at}, але всі встигли втекти!`);A.say(n?`Бабах! Знищено фігур: ${n}.`:'Бабах! Але всі встигли втекти.');
    zone.forEach(({z})=>z.remove());await sleep(800)}},
/* 5 ─ a black hole pulls everything in */
hole:{i:'🕳',n:'Чорна діра',rar:'l',live:true,omen:'🌀 Стрілки годинника крутяться назад…',
  d:'Посеред дошки відкривається чорна діра. 10 секунд вона щодві секунди підтягує фігури поруч на одну клітинку до себе. Хто потрапить у центр — зникає. Королі занадто важкі.',
  async run(A){
    const m=A.map();const cand=['d4','e4','d5','e5','c4','f4','c5','f5'].filter(s=>!m[s]||m[s].type!=='k');const at=rnd(cand.length?cand:['d4']);
    const sz0=A.sz();const h=mk(A.lay,`z-index:4;border-radius:50%;background:radial-gradient(circle,#000 0 34%,#1a0033 46%,rgba(120,60,255,.55) 58%,rgba(120,60,255,0) 72%)`);
    const ring=mk(h,'inset:8%;border-radius:50%;background:conic-gradient(from 0deg,transparent,rgba(190,150,255,.9),transparent 40%,rgba(255,150,255,.8),transparent 75%);animation:wxSpin 1.1s linear infinite;mix-blend-mode:screen');
    const posH=s=>{const sz=A.sz(),c=A.center(at);Object.assign(h.style,{left:(c.x-sz*s/2)+'px',top:(c.y-sz*s/2)+'px',width:sz*s+'px',height:sz*s+'px'})};
    posH(.1);snd.hum();await A.banner('Чорна діра!','Тримай фігури подалі від неї');
    for(let i=0;i<=10;i++){posH(.1+i*.17);await sleep(30)}
    let eaten=0;const T0=now();let pulls=0;
    while(A.alive()&&pulls<5){
      const mm=A.map();A.threat(near(at).filter(s=>mm[s]&&mm[s].type!=='k'));
      await sleep(Math.max(0,T0+2000*(pulls+1)-now()));if(!A.alive())break;pulls++;posH(1.9);noise(.7,{type:'bandpass',f:200,f2:800,g:.3});A.shake(3);
      const mp=A.map();const list=Object.keys(mp).filter(s=>mp[s].type!=='k'&&s!==at&&cheb(s,at)<=3).sort((a,b)=>cheb(a,at)-cheb(b,at));
      for(const s of list){const p=A.map()[s];if(!p)continue;const[f,r]=fr(s),[af,ar]=fr(at);const to=sqN(f+Math.sign(af-f),r+Math.sign(ar-r));
        if(to===at){if(A.kill(s,`Чорна діра поглинула ${colName(p.color)} ${PACC[p.type]}.`)){eaten++;A.flash(s,'#b388ff')}}
        else if(!A.map()[to])A.move(s,to,null)}
      await sleep(150);posH(1.7)}
    A.threat(null);for(let i=10;i>=0;i--){posH(.1+i*.17);await sleep(30)}h.remove();
    A.log(eaten?`Чорна діра закрилась. Поглинула фігур: ${eaten}.`:'Чорна діра закрилась, нікого не поглинувши.')}},
/* 6 ─ FOURTH WALL: a piece jumps out of the board and runs around the website */
escape:{i:'🏃',n:'Втеча з дошки',rar:'r',live:true,omen:'🚪 Хтось смикає ручку вікна браузера…',
  d:'Фігура вистрибує з дошки й бігає по всьому сайту 10 секунд: ховається за меню, визирає з-за краю екрана, стукає в скло. Натисни на неї, щоб повернути на дошку. Не впіймаєш — втече назавжди.',
  async run(A){
    const m=A.map();const from=victimSquare(A,m);const p=from&&m[from];if(!p)return;
    const sz=Math.max(48,A.sz()*1.1);const st=A.pageCenter(from);
    const el=mk(A.page,`width:${sz}px;height:${sz}px;pointer-events:auto;cursor:pointer;z-index:2;filter:drop-shadow(0 6px 6px rgba(0,0,0,.6))`,`<img src="${pic(p)}" style="width:100%;height:100%;display:block">`);
    place(el,st,sz,sz);
    if(!A.kill(from,`${PACC[p.type][0].toUpperCase()+PACC[p.type].slice(1)} з ${from} вистрибнув з дошки й тікає по сайту!`)){el.remove();return}
    const tok={};let caught=false;el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(!caught){caught=true;tok.stop=true}});
    snd.whoosh();A.say('Фігура втекла з дошки! Лови її по всьому сайту.');
    const W=innerWidth,Hh=innerHeight;let x=st.x-sz/2,y=st.y-sz/2;
    const spots=[[.03,.2],[.04,.75],[.5,.02],[.94,.08],[.93,.6],[.7,.93],[.25,.93],[.5,.5],[.97,.95],[.15,.45]];
    const T0=now();let knocked=false;
    while(A.alive()&&!caught&&now()-T0<10000){
      const s=rnd(spots);const nx=s[0]*W-sz/2,ny=s[1]*Hh-sz/2;el.style.transform=nx<x?'scaleX(-1)':'';
      if(!await glide(el,x,y,nx,ny,750+Math.random()*300,{hop:sz*.8,tok}))break;x=nx;y=ny;snd.squeak();
      /* peek from behind the edge of the screen */
      if(s[0]>.9||s[0]<.06){const ex=s[0]>.5?W-sz*.35:-sz*.65;if(!await glide(el,x,y,ex,y,300,{tok}))break;await sleep(500);if(tok.stop)break;if(!await glide(el,ex,y,x,y,300,{tok}))break}
      /* knock on the glass once */
      if(!knocked&&now()-T0>4000&&!tok.stop){knocked=true;const a=el.animate([{transform:'scale(1)',filter:'blur(0)'},{transform:'scale(3.2)',filter:'blur(1px)',offset:.35},{transform:'scale(3.2)',filter:'blur(1px)',offset:.8},{transform:'scale(1)',filter:'blur(0)'}],{duration:1600});setTimeout(snd.knock,500);await a.finished.catch(()=>{})}}
    if(caught&&A.alive()){snd.win();const back=A.pageCenter(from);await glide(el,x,y,back.x-sz/2,back.y-sz/2,600,{hop:sz});el.remove();const at=putBack(A,from,p);A.log(at?`Впіймав! ${PACC[p.type][0].toUpperCase()+PACC[p.type].slice(1)} повернувся на ${at}.`:'Впіймав, але фігуру нікуди поставити.');A.say(at?'Впіймав утікача! Він знову на дошці.':'Впіймав, але місця для фігури немає.')}
    else if(A.alive()){snd.sad();el.style.transform='';await glide(el,x,y,x<W/2?-sz*2:W+sz,y-sz,700,{hop:sz});A.log(`${PACC[p.type][0].toUpperCase()+PACC[p.type].slice(1)} втік із сайту назавжди.`);A.say('Утікач зник за краєм екрана…')}}},
/* 7 ─ FOURTH WALL: somebody else's mouse */
cursor:{i:'🖱',n:'Чужа мишка',rar:'r',live:true,omen:'🖐 Мишка сама трохи посунулась…',
  d:'На екрані зʼявляється чужий курсор. Він клацає по сайту, а потім хапає фігуру і пересуває її на сусідню клітинку. Встигни натиснути на курсор, і він злякається.',
  async run(A){
    const W=innerWidth,Hh=innerHeight,cs=30;const cur=mk(A.page,`width:${cs}px;height:${cs}px;pointer-events:auto;cursor:pointer;z-index:3;filter:drop-shadow(1px 2px 2px rgba(0,0,0,.5))`,CURSOR);
    const tok={};let scared=false;cur.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(!scared){scared=true;tok.stop=true}});
    let x=W+20,y=Hh*.6;place(cur,{x,y},0,0);
    const ripple=()=>{const r=mk(A.page,`left:${x-12}px;top:${y-12}px;width:24px;height:24px;border:2px solid #fff;border-radius:50%`);r.animate([{transform:'scale(.3)',opacity:1},{transform:'scale(2)',opacity:0}],{duration:400,fill:'forwards'});setTimeout(()=>r.remove(),420);snd.click()};
    const go=async(nx,ny,ms)=>{const ok=await glide(cur,x,y,nx,ny,ms,{tok});if(ok){x=nx;y=ny}return ok};
    A.say('Хтось інший рухає мишкою! Натисни на чужий курсор.');
    const navs=[...document.querySelectorAll('#nav a,#nav .it,#nav button,#side button,.btn')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.top>0&&r.bottom<Hh});
    let ok=true;
    for(let i=0;i<2&&ok;i++){const t=navs.length?rnd(navs).getBoundingClientRect():{left:W*Math.random(),top:Hh*Math.random(),width:0,height:0};ok=await go(t.left+t.width/2,t.top+t.height/2,900);if(ok){ripple();await sleep(350)}}
    /* then it grabs a piece */
    const m=A.map();let mvF=null,mvT=null;for(const s of Object.keys(m).sort(()=>Math.random()-.5)){if(m[s].type==='k')continue;const opts=near(s).filter(t=>!m[t]&&!(m[s].type==='p'&&(t[1]==='1'||t[1]==='8')));if(opts.length){mvF=s;mvT=rnd(opts);break}}
    if(ok&&mvF&&A.alive()){const a=A.pageCenter(mvF);ok=await go(a.x,a.y,800);
      if(ok){ripple();cur.innerHTML=GRAB;await sleep(300);const p=A.map()[mvF];
        if(p&&!scared){const sz=A.sz();const ghost=mk(A.page,`width:${sz}px;height:${sz}px;z-index:2;opacity:.9`,`<img src="${pic(p)}" style="width:100%;height:100%">`);place(ghost,a,sz,sz);
          const b=A.pageCenter(mvT);const t0=now();await new Promise(res=>{const f=()=>{const k=Math.min(1,(now()-t0)/700);const xx=a.x+(b.x-a.x)*k,yy=a.y+(b.y-a.y)*k;cur.style.left=xx+'px';cur.style.top=yy+'px';ghost.style.left=(xx-sz/2)+'px';ghost.style.top=(yy-sz/2)+'px';if(k<1&&!tok.stop)requestAnimationFrame(f);else res()};f()});
          ghost.remove();x=parseFloat(cur.style.left);y=parseFloat(cur.style.top);
          if(!scared){if(A.move(mvF,mvT,`Чужа мишка пересунула ${colName(p.color)} ${PACC[p.type]} з ${mvF} на ${mvT}.`)){snd.pop();A.flash(mvT,'#80deea');A.say('Чужа мишка пересунула фігуру!')}}}
        cur.innerHTML=CURSOR}}
    if(scared){snd.squeak();A.log('Ти налякав чужу мишку, і вона втекла.');A.say('Курсор злякався й утік!');tok.stop=false;cur.animate([{transform:'rotate(0)'},{transform:'rotate(25deg)'},{transform:'rotate(-25deg)'},{transform:'rotate(0)'}],{duration:300});await glide(cur,x,y,W+60,y-80,450)}
    else{cur.animate([{transform:'translateX(0)'},{transform:'translateX(-8px)'},{transform:'translateX(8px)'},{transform:'translateX(0)'}],{duration:200,iterations:3});await sleep(650);await glide(cur,x,y,W+60,Hh*.3,800)}}},
/* 8 ─ FOURTH WALL: the lights go out on the whole website */
dark:{i:'🔦',n:'Світло вимкнули',rar:'c',live:true,omen:'💡 Екран на мить блимає…',
  d:'Гасне світло на всьому сайті на 12 секунд. Видно тільки коло ліхтарика навколо твоєї мишки чи пальця. А з темряви хтось дивиться…',
  async run(A){
    const br=A.rect();let mx=br.left+br.width/2,my=br.top+br.height/2;const R=Math.min(innerWidth,innerHeight)*.17;
    const ov=mk(A.page,'inset:0;background:rgba(0,0,0,.95);opacity:0');const upd=()=>{const g=`radial-gradient(circle at ${mx}px ${my}px, transparent ${R*.55}px, rgba(0,0,0,.6) ${R*.85}px, #000 ${R}px)`;ov.style.webkitMaskImage=g;ov.style.maskImage=g};upd();
    const mv=e=>{mx=e.clientX;my=e.clientY;upd()};addEventListener('pointermove',mv);addEventListener('pointerdown',mv);A.onClean(()=>{removeEventListener('pointermove',mv);removeEventListener('pointerdown',mv)});
    snd.click();await sleep(80);ov.animate([{opacity:0},{opacity:1},{opacity:.2},{opacity:1},{opacity:.5},{opacity:1}],{duration:700,fill:'forwards'});A.say('Світло вимкнули! Грай із ліхтариком.');
    const eyes=()=>{const W=innerWidth,Hh=innerHeight;let x,y;for(let k=0;k<20;k++){x=Math.random()*W;y=Math.random()*Hh;if(Math.hypot(x-mx,y-my)>R*1.6)break}
      const e=mk(A.page,`left:${x}px;top:${y}px;width:60px;height:20px;z-index:2;opacity:0`,'<svg viewBox="0 0 60 20" width="60" height="20"><ellipse cx="14" cy="10" rx="9" ry="6" fill="#fffde7"/><ellipse cx="46" cy="10" rx="9" ry="6" fill="#fffde7"/><circle cx="15" cy="10" r="3.5" fill="#c62828"/><circle cx="47" cy="10" r="3.5" fill="#c62828"/></svg>');
      e.animate([{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.45},{opacity:0,offset:.5},{opacity:1,offset:.55},{opacity:1,offset:.9},{opacity:0}],{duration:2600,fill:'forwards'});snd.creep();setTimeout(()=>e.remove(),2700)};
    const T0=now();let n=0;while(A.alive()&&now()-T0<12000){await sleep(300);if(now()-T0>2500+n*3500&&n<3){n++;eyes()}}
    ov.animate([{opacity:1},{opacity:.3},{opacity:1},{opacity:0}],{duration:600,fill:'forwards'});snd.click();await sleep(650);A.log('Світло знову ввімкнулось.')}},
/* 9 ─ blitz: 5 seconds per move or a random move is played */
blitz:{i:'⏱',n:'Бліц',rar:'c',live:true,omen:'⏳ Пісок у годиннику сиплеться швидше…',
  d:'Наступні 4 ходи — бліц: на кожен хід лише 5 секунд. Не встиг — за тебе зіграє випадковий хід.',
  async run(A){
    const bar=mk(A.lay,'left:0;top:0;height:7px;width:100%;z-index:9;background:linear-gradient(90deg,#ff1744,#ffd54f);transform-origin:left;box-shadow:0 0 10px #ff1744');
    let moves=0;A.onMove(()=>{moves++;dl=now()+5000});await A.banner('Бліц!','5 секунд на хід');let dl=now()+5000;let lastBusy=now();const T0=now();let lastTick=0;
    while(A.alive()&&moves<4&&now()-T0<40000){await sleep(80);
      const mine=A.mode==='friend'||!A.human||A.g().turn()===A.human;
      if(A.busy()||!mine){dl+=now()-lastBusy;lastBusy=now();bar.style.opacity=mine?'.4':'.15';continue}lastBusy=now();bar.style.opacity='1';
      const left=Math.max(0,dl-now());bar.style.transform=`scaleX(${left/5000})`;
      const s=Math.ceil(left/1000);if(s!==lastTick){lastTick=s;if(s<=3)snd.tick(s===1?2000:1500)}
      if(left<=0){snd.sad();A.log('Час вийшов! Зіграно випадковий хід.');A.say('Час вийшов! Випадковий хід.');A.randomMove();dl=now()+5000;await sleep(400)}}
    bar.remove()}},
/* 10 ─ a chicken lays eggs that hatch into pawns */
chicken:{i:'🐔',n:'Курка',rar:'c',live:true,omen:'🐣 Десь кудкудакає…',
  d:'Курка бігає по дошці й несе 3 яйця. Через 3 секунди з яйця вилуплюється пішак: на половині білих — білий, на половині чорних — чорний. Стань фігурою на яйце, і воно розібʼється.',
  async run(A){
    const sz0=A.sz();const ch=mk(A.lay,`width:${sz0*.95}px;height:${sz0*.95}px;z-index:7;filter:drop-shadow(0 3px 3px rgba(0,0,0,.5))`,CHICK);
    const empt=()=>{const m=A.map();return ALL.filter(s=>!m[s]&&+s[1]>=2&&+s[1]<=7)};let pos=rnd(empt())||'d4';const c=A.center(pos);
    place(ch,{x:-sz0,y:c.y},sz0*.95,sz0*.95);await glide(ch,-sz0,c.y-sz0*.5,c.x-sz0*.48,c.y-sz0*.5,700,{hop:sz0*.3});snd.cluck();
    const eggs=[];const T0=now();let laid=0;
    const tickEggs=()=>{const m=A.map();for(const e of eggs){if(e.done)continue;const cc=A.center(e.sq),sz=A.sz();Object.assign(e.el.style,{left:(cc.x-sz*.22)+'px',top:(cc.y-sz*.28)+'px',width:sz*.44+'px',height:sz*.56+'px'});
        if(m[e.sq]){e.done=true;e.el.innerHTML='<svg viewBox="0 0 40 40" width="100%" height="100%"><circle cx="20" cy="24" r="12" fill="#fff8e1"/><circle cx="20" cy="24" r="6" fill="#ffb300"/></svg>';e.el.animate([{opacity:1},{opacity:0}],{duration:900,delay:500,fill:'forwards'});snd.chomp();continue}
        if(now()-e.t>3000){e.done=true;const col=+e.sq[1]<=4?'w':'b';const ok=A.add(e.sq,{type:'p',color:col},`З яйця на ${e.sq} вилупився ${col==='w'?'білий':'чорний'} пішак!`);
          e.el.animate([{transform:'scale(1)'},{transform:'scale(1.3) rotate(10deg)'},{transform:'scale(0)'}],{duration:400,fill:'forwards'});if(ok){snd.chirp();A.flash(e.sq,'#ffeb3b')}else snd.pop()}}};
    while(A.alive()&&now()-T0<10000){const opts=near(pos).filter(s=>{const m=A.map();return!m[s]});const nx=opts.length?rnd(opts):pos;const a=A.center(pos),b=A.center(nx),sz=A.sz();ch.querySelector('svg').style.transform=b.x<a.x?'scaleX(-1)':'';pos=nx;
      await glide(ch,a.x-sz*.48,a.y-sz*.5,b.x-sz*.48,b.y-sz*.5,500,{hop:sz*.15});tickEggs();
      if(laid<3&&now()-T0>2200+laid*2600&&+pos[1]>=2&&+pos[1]<=7&&!A.map()[pos]&&!eggs.some(e=>e.sq===pos)){laid++;snd.cluck();const el=mk(A.lay,'z-index:5',EGG);eggs.push({sq:pos,el,t:now()});tickEggs()}}
    {const a=A.center(pos),sz=A.sz();glide(ch,a.x-sz*.48,a.y-sz*.5,sz*9,a.y-sz*.5,900,{hop:sz*.2})}
    const T1=now();while(A.alive()&&eggs.some(e=>!e.done)&&now()-T1<5000){await sleep(150);tickEggs()}}},
};};
})();
