/* ================= ШАХИ-БУРЯ =================
   Normal chess (vs bot or a friend on one device), but every few moves the weather strikes.
   Between events you play on the usual 2D board. When an event starts, the 2D board is swapped
   for a Three.js scene that looks pixel-identical (same colours, same piece pictures lying flat,
   camera straight above). Then the camera lifts, the pieces stand up as cardboard figures, the room
   appears and the camera turns to the window. Afterwards everything flies back and the 2D board returns. */
(function(){
'use strict';
const FILES='abcdefgh';
const sqN=(f,r)=>FILES[f]+(r+1);                 /* f,r: 0..7 */
const fr=sq=>[sq.charCodeAt(0)-97,+sq[1]-1];
const shuffleA=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const PNAME={p:'пішак',n:'кінь',b:'слон',r:'тура',q:'ферзь',k:'король'};
const PACC={p:'пішака',n:'коня',b:'слона',r:'туру',q:'ферзя',k:'короля'};

/* ---------- position helpers ---------- */
function mapOf(g){const m={};const B=g.board();for(let r=0;r<8;r++)for(let f=0;f<8;f++){const p=B[r][f];if(p)m[FILES[f]+(8-r)]={type:p.type,color:p.color}}return m}
function fenOf(m,turn,oldFen){
  const rows=[];for(let r=7;r>=0;r--){let s='',e=0;for(let f=0;f<8;f++){const p=m[sqN(f,r)];if(!p){e++;continue}if(e){s+=e;e=0}s+=p.color==='w'?p.type.toUpperCase():p.type}if(e)s+=e;rows.push(s)}
  const parts=oldFen.split(' '),old=parts[2];let cr='';
  const has=(sq,t,c)=>m[sq]&&m[sq].type===t&&m[sq].color===c;
  if(old.includes('K')&&has('e1','k','w')&&has('h1','r','w'))cr+='K';
  if(old.includes('Q')&&has('e1','k','w')&&has('a1','r','w'))cr+='Q';
  if(old.includes('k')&&has('e8','k','b')&&has('h8','r','b'))cr+='k';
  if(old.includes('q')&&has('e8','k','b')&&has('a8','r','b'))cr+='q';
  return `${rows.join('/')} ${turn} ${cr||'-'} - 0 ${parts[5]||1}`;
}
/* returns a legal FEN for the new placement, or null (two kings, no pawns on rank 1/8,
   and the side that just moved must not be left in check) */
function valid(m,turn,oldFen){
  let kw=0,kb=0;
  for(const[sq,p]of Object.entries(m)){if(p.type==='k'){if(p.color==='w')kw++;else kb++}if(p.type==='p'&&(sq[1]==='1'||sq[1]==='8'))return null}
  if(kw!==1||kb!==1)return null;
  const fen=fenOf(m,turn,oldFen);const t=new Chess();if(!t.load(fen))return null;
  const sp=fen.split(' ');sp[1]=turn==='w'?'b':'w';const t2=new Chess();if(!t2.load(sp.join(' ')))return null;
  if(t2.in_check())return null;
  return fen;
}
const nonKings=(m,c)=>Object.keys(m).filter(s=>m[s].type!=='k'&&(!c||m[s].color===c));
const empties=(m,rmin,rmax)=>{const a=[];for(let r=rmin;r<=rmax;r++)for(let f=0;f<8;f++){const s=sqN(f,r);if(!m[s])a.push(s)}return a};

/* ---------- the events ---------- */
const RING=(()=>{const a=[];for(let f=0;f<8;f++)a.push(sqN(f,7));for(let r=6;r>=0;r--)a.push(sqN(7,r));for(let f=6;f>=0;f--)a.push(sqN(f,0));for(let r=1;r<7;r++)a.push(sqN(0,r));return a})();
const RAR={c:{n:'звичайна',w:3,col:'#8b8987'},r:{n:'рідкісна',w:1.4,col:'#749BBF'},l:{n:'легендарна',w:.55,col:'#F7C631'}};

const EVENTS={
  tornado:{i:'🌪',n:'Торнадо',rar:'c',omen:'🍃 Вітер завиває, фіранки здуваються…',
    d:'Фігури на краю дошки зсуваються на 1 клітинку по колу. Пішаків, яких занесло на перший чи останній ряд, здуває.',
    apply(m0,X){
      for(const dir of shuffleA([1,-1])){
        const m={...m0},ch=[];const slots=RING.filter(s=>!(m0[s]&&m0[s].type==='k'));const pcs=slots.map(s=>m0[s]||null);
        slots.forEach(s=>delete m[s]);
        slots.forEach((s,i)=>{const p=pcs[i];if(!p)return;const to=slots[(i+dir+slots.length)%slots.length];
          if(p.type==='p'&&(to[1]==='1'||to[1]==='8')){ch.push({t:'kill',sq:s,p,how:'fly'});return}
          m[to]=p;ch.push({t:'move',from:s,to,p})});
        const fen=valid(m,X.turn,X.fen);
        if(fen&&ch.length){const k=ch.filter(c=>c.t==='kill').length;return{fen,ch,note:`Торнадо прокрутив край дошки ${dir>0?'за годинниковою стрілкою':'проти годинникової стрілки'}${k?`, здуло пішаків: ${k}`:''}.`}}
      }
      return null}},
  lightning:{i:'⚡',n:'Блискавка',rar:'c',omen:'⚡ Десь далеко гримить…',
    d:'Б’є двічі: спалює по одній однаковій фігурі в кожного.',
    apply(m0,X){
      const W={p:6,n:2,b:2,r:1,q:.35};
      for(let tr=0;tr<30;tr++){
        const types=Object.keys(W).filter(t=>nonKings(m0,'w').some(s=>m0[s].type===t)&&nonKings(m0,'b').some(s=>m0[s].type===t));
        if(!types.length)return null;
        let tot=types.reduce((a,t)=>a+W[t],0),x=Math.random()*tot,ty=types[0];for(const t of types){x-=W[t];if(x<=0){ty=t;break}}
        const a=rnd(nonKings(m0,'w').filter(s=>m0[s].type===ty)),b=rnd(nonKings(m0,'b').filter(s=>m0[s].type===ty));
        const m={...m0};delete m[a];delete m[b];const fen=valid(m,X.turn,X.fen);
        if(fen)return{fen,ch:[{t:'kill',sq:a,p:m0[a],how:'burn'},{t:'kill',sq:b,p:m0[b],how:'burn'}],note:`Блискавка спалила ${PACC[ty]} на ${a} і ${PACC[ty]} на ${b}.`};
      }
      return null}},
  crow:{i:'🐦‍⬛',n:'Ворона',rar:'c',omen:'🐦 На підвіконня сіла ворона й дивиться на пішаків…',
    d:'Краде пішака в того, в кого їх більше, і кидає його в іншому місці дошки.',
    apply(m0,X){
      const pw=c=>Object.keys(m0).filter(s=>m0[s].type==='p'&&m0[s].color===c);
      const nw=pw('w').length,nb=pw('b').length;if(!nw&&!nb)return null;
      const c=nw===nb?rnd(['w','b']):nw>nb?'w':'b';
      for(let tr=0;tr<30;tr++){
        const from=rnd(pw(c));const to=rnd(empties(m0,2,5));if(!from||!to)return null;
        const m={...m0};delete m[from];m[to]=m0[from];const fen=valid(m,X.turn,X.fen);
        if(fen)return{fen,ch:[{t:'move',from,to,p:m0[from],how:'crow'}],note:`Ворона вкрала ${c==='w'?'білого':'чорного'} пішака з ${from} і кинула на ${to}.`};
      }
      return null}},
  fog:{i:'🌫',n:'Туман',rar:'c',omen:'🌫 Вікно запотіває…',
    d:'Частину дошки затягує туманом на 4 півходи: там видно тільки силуети фігур.',
    apply(m0,X){return{fen:X.fen,ch:[],fog:4,note:'Туман накрив частину дошки на 4 півходи.'}}},
  quake:{i:'🌋',n:'Землетрус',rar:'c',omen:'☕ Чай у чашці тремтить…',
    d:'Одна горизонталь тріскається і зсувається вбік на 1 клітинку.',
    apply(m0,X){
      for(const r of shuffleA([2,3,4,5]))for(const dir of shuffleA([1,-1])){
        const m={...m0},ch=[];const order=dir>0?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];
        for(const f of order){const s=sqN(f,r),p=m[s];if(!p||p.type==='k')continue;const nf=f+dir;if(nf<0||nf>7)continue;const t=sqN(nf,r);if(m[t])continue;delete m[s];m[t]=p;ch.push({t:'move',from:s,to:t,p,how:'hop'})}
        if(!ch.length)continue;const fen=valid(m,X.turn,X.fen);
        if(fen)return{fen,ch,rank:r,note:`Землетрус зсунув ${r+1}-у горизонталь ${dir>0?'праворуч':'ліворуч'} (з боку білих).`};
      }
      return null}},
  frost:{i:'❄',n:'Мороз',rar:'r',omen:'❄ Шибка вкривається інеєм…',
    d:'По одній фігурі кожного замерзає на 2 ходи: ними не можна ходити (але їх можна збити).',
    apply(m0,X){
      const a=rnd(nonKings(m0,'w')),b=rnd(nonKings(m0,'b'));if(!a||!b)return null;
      return{fen:X.fen,ch:[],freeze:[a,b],note:`Замерзли: ${PNAME[m0[a].type]} на ${a} і ${PNAME[m0[b].type]} на ${b}.`}}},
  ufo:{i:'🛸',n:'НЛО',rar:'r',omen:'📻 Радіо шипить дивними звуками…',
    d:'Забирає фігуру. Через 2 ходи повертає її в інше місце… але вже іншого кольору.',
    apply(m0,X){
      for(let tr=0;tr<30;tr++){
        const s=rnd(Object.keys(m0).filter(x=>m0[x].type!=='k'&&m0[x].type!=='q'));if(!s)return null;
        const m={...m0};delete m[s];const fen=valid(m,X.turn,X.fen);
        if(fen)return{fen,ch:[{t:'kill',sq:s,p:m0[s],how:'zap'}],ufo:{p:{type:m0[s].type,color:m0[s].color==='w'?'b':'w'}},note:`НЛО забрало ${m0[s].color==='w'?'білого':'чорного'} ${PACC[m0[s].type].replace('пішака','пішака')} з ${s}. Повернеться через 2 ходи…`};
      }
      return null}},
  ufoBack:{i:'🛸',n:'НЛО повертається',rar:'r',hidden:true,omen:'',
    d:'',
    apply(m0,X){
      const p=X.ufoP;
      for(let tr=0;tr<40;tr++){const to=rnd(empties(m0,2,5));if(!to)return null;const m={...m0};m[to]=p;const fen=valid(m,X.turn,X.fen);
        if(fen)return{fen,ch:[{t:'add',sq:to,p,how:'beam'}],note:`НЛО повернуло ${PACC[p.type]} на ${to}, але тепер ${p.color==='w'?'білого':'чорного'}!`}}
      return null}},
  rainbow:{i:'🌈',n:'Веселка',rar:'r',omen:'☀ Крізь хмари пробивається сонце…',
    d:'Найпередовіші пішаки обох сторін роблять крок уперед.',
    apply(m0,X){
      const m={...m0},ch=[];
      for(const c of shuffleA(['w','b'])){
        const ps=Object.keys(m).filter(s=>m[s].type==='p'&&m[s].color===c).map(s=>({s,adv:c==='w'?+s[1]:9-+s[1]})).filter(o=>{const[f,r]=fr(o.s);const nr=r+(c==='w'?1:-1);return nr>=1&&nr<=6&&!m[sqN(f,nr)]});
        if(!ps.length)continue;const mx=Math.max(...ps.map(o=>o.adv));const o=rnd(ps.filter(x=>x.adv===mx));const[f,r]=fr(o.s);const to=sqN(f,r+(c==='w'?1:-1));
        const t={...m};const p=t[o.s];delete t[o.s];t[to]=p;if(!valid(t,X.turn,X.fen))continue;delete m[o.s];m[to]=p;ch.push({t:'move',from:o.s,to,p,how:'hop'});
      }
      const fen=ch.length&&valid(m,X.turn,X.fen);
      return fen?{fen,ch,note:'Веселка: '+ch.map(c=>`${c.p.color==='w'?'білий':'чорний'} пішак ${c.from}→${c.to}`).join(', ')+'.'}:null}},
  watcher:{i:'👁',n:'Хтось у вікні',rar:'r',omen:'💡 Лампа мерехтить…',
    d:'Світло гасне. Коли вмикається, одна фігура вже стоїть не там. Знайди яку.',
    apply(m0,X){
      const c=X.human||rnd(['w','b']);
      for(let tr=0;tr<40;tr++){
        const s=rnd(nonKings(m0,c));if(!s)return null;const[f,r]=fr(s);
        const opts=[];for(const[df,dr]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nf=f+df,nr=r+dr;if(nf<0||nf>7||nr<0||nr>7)continue;const t=sqN(nf,nr);if(!m0[t])opts.push(t)}
        if(!opts.length)continue;const to=rnd(opts);const m={...m0};delete m[s];m[to]=m0[s];const fen=valid(m,X.turn,X.fen);
        if(fen)return{fen,ch:[{t:'move',from:s,to,p:m0[s],how:'blink'}],secret:{from:s,to,p:m0[s]},note:`Поки світла не було, хтось пересунув ${c==='w'?'білу':'чорну'} фігуру. Яку?`};
      }
      return null}},
  meteor:{i:'☄',n:'Метеорит',rar:'l',omen:'🔴 Небо червоніє…',
    d:'Падає в центр дошки: знищує все в квадраті 2×2, крім королів.',
    apply(m0,X){
      const blocks=[[3,3],...shuffleA([[2,2],[2,3],[2,4],[3,2],[3,4],[4,2],[4,3],[4,4]])];
      for(const[f0,r0]of blocks){
        const sq=[sqN(f0,r0),sqN(f0+1,r0),sqN(f0,r0+1),sqN(f0+1,r0+1)];const hit=sq.filter(s=>m0[s]&&m0[s].type!=='k');if(!hit.length)continue;
        const m={...m0};hit.forEach(s=>delete m[s]);const fen=valid(m,X.turn,X.fen);
        if(fen)return{fen,ch:hit.map(s=>({t:'kill',sq:s,p:m0[s],how:'smash'})),block:sq,note:`Метеорит упав на ${sq[0]}–${sq[3]} і знищив: ${hit.map(s=>PNAME[m0[s].type]).join(', ')}.`};
      }
      return null}},
};
/* live events (real time, ~10 s, while you keep playing) come from storm-live.js */
if(window.STORM_LIVE_DEF)try{Object.assign(EVENTS,window.STORM_LIVE_DEF({sqN,fr,FILES,PNAME,PACC,noise,tone}))}catch(e){console.warn('live events',e)}
const POOL=Object.keys(EVENTS).filter(k=>!EVENTS[k].hidden);
function wpick(keys){const tot=keys.reduce((a,k)=>a+RAR[EVENTS[k].rar].w,0);let x=Math.random()*tot;for(const k of keys){x-=RAR[EVENTS[k].rar].w;if(x<=0)return k}return keys[keys.length-1]}
function makeForecast(noLive){const out=[];let left=POOL.filter(k=>!(noLive&&EVENTS[k].live));while(out.length<4&&left.length){const k=wpick(left);out.push(k);left=left.filter(x=>x!==k)}return out}

/* ---------- tiny synth for weather sounds ---------- */
let AC=null;
function ac(){if(typeof S!=='undefined'&&S.sound===false)return null;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();return AC}catch(e){return null}}
function noise(dur,o={}){const a=ac();if(!a)return;const{f=800,f2=null,q=.7,g=.4,type='lowpass',att=.02,delay=0}=o;const t0=a.currentTime+delay;
  const n=Math.floor(a.sampleRate*dur),b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
  const s=a.createBufferSource();s.buffer=b;const fl=a.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f,t0);fl.Q.value=q;if(f2)fl.frequency.linearRampToValueAtTime(f2,t0+dur);
  const gn=a.createGain();gn.gain.setValueAtTime(.0001,t0);gn.gain.linearRampToValueAtTime(g,t0+att);gn.gain.exponentialRampToValueAtTime(.0001,t0+dur);s.connect(fl).connect(gn).connect(a.destination);s.start(t0);s.stop(t0+dur+.05)}
function tone(f,dur,o={}){const a=ac();if(!a)return;const{type='sine',g=.15,f2=null,delay=0,att=.01}=o;const t0=a.currentTime+delay;const os=a.createOscillator();os.type=type;os.frequency.setValueAtTime(f,t0);if(f2)os.frequency.exponentialRampToValueAtTime(f2,t0+dur);
  const gn=a.createGain();gn.gain.setValueAtTime(.0001,t0);gn.gain.linearRampToValueAtTime(g,t0+att);gn.gain.exponentialRampToValueAtTime(.0001,t0+dur);os.connect(gn).connect(a.destination);os.start(t0);os.stop(t0+dur+.05)}
/* ---- original music stingers, synthesised on the fly (drums, risers, choir pads, chimes) ---- */
const MUS={
  drum(delay=0,g=.9){tone(110,.45,{f2:38,g,delay});noise(.25,{f:180,g:g*.6,att:.002,delay})},
  hit(delay=0){this.drum(delay,1);noise(.9,{type:'highpass',f:3500,g:.25,att:.005,delay})},
  riser(dur=1.2,delay=0){noise(dur,{type:'bandpass',f:300,f2:5000,q:3,g:.35,att:dur*.9,delay});tone(120,dur,{type:'sawtooth',f2:600,g:.05,att:dur*.8,delay})},
  /* a dark minor chord from detuned saws = "choir" */
  choir(notes,dur=2.5,delay=0,g=.04){notes.forEach(f=>{[-4,0,4].forEach(dt=>tone(f*(1+dt/1200),dur,{type:'sawtooth',g,att:dur*.35,delay}))})},
  arp(notes,step=.09,delay=0,type='triangle',g=.08){notes.forEach((f,i)=>tone(f,.5,{type,g,delay:delay+i*step}))},
  taiko(n=4,gap=.18,delay=0){for(let i=0;i<n;i++)this.drum(delay+i*gap,.6+i*.1)},
  boomFall(delay=0){tone(220,1.6,{type:'sine',f2:30,g:.5,delay});noise(1.6,{f:200,f2:40,g:.9,att:.01,delay})},
};
const SFX={
  thunder(d=0){noise(.25,{f:4000,type:'highpass',g:.35,delay:d});noise(3.2,{f:260,f2:90,g:.9,att:.03,delay:d+.05})},
  wind(dur=3){noise(dur,{type:'bandpass',f:300,f2:900,q:1.2,g:.45,att:dur*.4})},
  glass(){noise(.6,{type:'highpass',f:2500,g:.5});for(let i=0;i<6;i++)tone(2500+Math.random()*3000,.15,{type:'triangle',g:.05,delay:.05+i*.06})},
  caw(){[0,.35].forEach(d=>{tone(720,.28,{type:'sawtooth',f2:420,g:.08,delay:d});noise(.28,{type:'bandpass',f:1100,q:3,g:.15,delay:d})})},
  ufo(){tone(220,2.2,{type:'sine',f2:880,g:.12});tone(330,2.2,{type:'triangle',f2:110,g:.06,delay:.3})},
  boom(){noise(2.5,{f:180,f2:40,g:1,att:.01})},
  rumble(dur=2.5){noise(dur,{f:90,g:.9,att:.3})},
  chime(){[523,659,784,1047].forEach((f,i)=>tone(f,.9,{g:.08,delay:i*.12}))},
  freeze(){for(let i=0;i<8;i++)tone(1800+i*250,.25,{type:'triangle',g:.04,delay:i*.07})},
  flick(){noise(.08,{type:'highpass',f:3000,g:.2})},
};

/* ================= 3D SCENE ================= */
/* phones and weak computers get a lighter version of every animation */
const LOW=(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||innerWidth<760||(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=3;
const PQ=n=>Math.max(1,Math.round(n*(LOW?.35:1)));   /* particle / object counts */
let THREE_P=null;
window.loadThree=function(){return loadThree()};
function loadThree(){return THREE_P||(THREE_P=new Promise((res,rej)=>{if(window.THREE)return res(window.THREE);const s=document.createElement('script');s.src='https://unpkg.com/three@0.149.0/build/three.min.js';s.crossOrigin='anonymous';s.onload=()=>res(window.THREE);s.onerror=()=>{THREE_P=null;rej(new Error('three'))};document.head.appendChild(s)}))}

const W3={ready:false};
const easeIO=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
const easeO=k=>1-Math.pow(1-k,3);
const lerp=(a,b,k)=>a+(b-a)*k;

function makeTex(cv){const T=W3.T;const t=new T.CanvasTexture(cv);t.anisotropy=4;return t}
function gradTex(stops,w=8,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,h);stops.forEach(([o,col])=>g.addColorStop(o,col));x.fillStyle=g;x.fillRect(0,0,w,h);return makeTex(c)}
function blobTex(col='255,255,255'){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,`rgba(${col},1)`);g.addColorStop(.5,`rgba(${col},.45)`);g.addColorStop(1,`rgba(${col},0)`);x.fillStyle=g;x.fillRect(0,0,128,128);return makeTex(c)}

async function init3D(){
  if(W3.ready)return W3;
  const T=await loadThree();W3.T=T;
  const cv=document.createElement('canvas');cv.id='stormCv';document.body.appendChild(cv);
  const R=new T.WebGLRenderer({canvas:cv,antialias:!LOW,alpha:true,powerPreference:'high-performance'});
  R.setPixelRatio(LOW?Math.min(window.devicePixelRatio||1,1):Math.min(window.devicePixelRatio||1,1.5));R.setClearColor(0x000000,0);
  const scene=new T.Scene();const cam=new T.PerspectiveCamera(35,1,.05,500);
  Object.assign(W3,{R,scene,cam,cv,upd:new Set(),fade:[],room:new T.Group(),out:new T.Group(),pcs:{},lvl:1,flash:0,shake:0,speed:1,roomA:0,stand:0});
  scene.add(W3.room);W3.room.add(W3.out);
  /* lights (affect only the room: board and pieces are unlit so that the top view matches the 2D board exactly) */
  W3.amb=new T.AmbientLight(0x8a90a8,.55);scene.add(W3.amb);
  W3.lamp=new T.PointLight(0xffc98a,1.3,40,1.4);W3.lamp.position.set(-6,7,3);scene.add(W3.lamp);
  W3.moon=new T.DirectionalLight(0x9fb4ff,.45);W3.moon.position.set(4,10,-30);scene.add(W3.moon);

  const box=(w,h,d,col,x,y,z,parent=W3.room,o={})=>{const m=new T.MeshLambertMaterial({color:col,transparent:true,opacity:0,...o});m.userData.base=o.opacity??1;W3.fade.push(m);const me=new T.Mesh(new T.BoxGeometry(w,h,d),m);me.position.set(x,y,z);parent.add(me);return me};
  const basic=(geo,o,parent=W3.room)=>{const m=new T.MeshBasicMaterial({transparent:true,opacity:0,...o});m.userData.base=o.opacity??1;W3.fade.push(m);const me=new T.Mesh(geo,m);parent.add(me);return me};
  W3.box=box;W3.basic=basic;

  /* board body under the flat top, and the table */
  box(8.06,.32,8.06,0x5a3d26,0,-.165,0);
  box(18,.4,12,0x6b4a30,0,-.53,0);
  box(18,.06,12,0x7a5536,0,-.33,0);
  /* tea cup */
  W3.cup=new T.Group();W3.room.add(W3.cup);W3.cup.position.set(6,-.3,2.2);
  {const c=box(.01,.01,.01,0xffffff,0,0,0,W3.cup);c.visible=false;
   const cm=new T.MeshLambertMaterial({color:0xf2efe8,transparent:true,opacity:0});cm.userData.base=1;W3.fade.push(cm);
   const cup=new T.Mesh(new T.CylinderGeometry(.55,.42,.9,20),cm);cup.position.y=.45;W3.cup.add(cup);
   const tea=new T.Mesh(new T.CircleGeometry(.5,20),new T.MeshLambertMaterial({color:0x6b3410,transparent:true,opacity:0}));tea.material.userData.base=1;W3.fade.push(tea.material);tea.rotation.x=-Math.PI/2;tea.position.y=.85;W3.cup.add(tea);
   const pl=new T.Mesh(new T.CylinderGeometry(.9,.8,.08,24),cm);pl.position.y=.04;W3.cup.add(pl);}
  /* room: floor, back wall with a window, side walls, ceiling */
  box(60,.2,60,0x3a2a20,0,-8,0);
  const WALL=0x463631;const wz=-9;
  box(40,22,.4,WALL,-25,2,wz);box(40,22,.4,WALL,25,2,wz);   /* left / right of window (window x -5..5) */
  box(10,10,.4,WALL,0,-4,wz);box(10,5,.4,WALL,0,10.5,wz);       /* below (top y=1) / above (bottom y=8) */
  const FR=0xd9cfbf;box(10.6,.35,.6,FR,0,.95,wz+.1);box(10.6,.35,.6,FR,0,8.05,wz+.1);box(.35,7.4,.6,FR,-5.15,4.5,wz+.1);box(.35,7.4,.6,FR,5.15,4.5,wz+.1);
  box(11.6,.25,1.4,0xcfc5b4,0,.8,wz+.6); /* sill */
  box(.4,22,60,0x3f302b,-14,2,0);box(.4,22,60,0x3f302b,14,2,0);
  /* ceiling: a plane facing down, so the camera above the room (top view) never sees it */
  {const m=new T.MeshLambertMaterial({color:0x2e2420,transparent:true,opacity:0});m.userData.base=1;W3.fade.push(m);const c=new T.Mesh(new T.PlaneGeometry(60,60),m);c.rotation.x=Math.PI/2;c.position.y=13;W3.room.add(c)}
  /* curtains */
  W3.curt=[box(2.2,8.5,.15,0x7b2f2f,-6.6,4.4,wz+.6),box(2.2,8.5,.15,0x7b2f2f,6.6,4.4,wz+.6)];
  /* glass */
  W3.glass=basic(new T.PlaneGeometry(10,7),{color:0xa9c8ff,opacity:.1,depthWrite:false});W3.glass.position.set(0,4.5,wz);
  W3.frost=basic(new T.PlaneGeometry(10,7),{map:frostTex(),opacity:0,depthWrite:false});W3.frost.position.set(0,4.5,wz+.02);W3.frost.material.userData.base=0;
  /* outside: sky, ground, houses, trees, clouds, rain */
  W3.sky=basic(new T.PlaneGeometry(420,160),{map:gradTex([[0,'#0b1022'],[.55,'#26304d'],[1,'#5a5468']]),depthWrite:false},W3.out);W3.sky.position.set(0,40,-150);
  basic(new T.PlaneGeometry(400,200),{color:0x1d2a1c},W3.out).rotation.x=-Math.PI/2;W3.out.children[W3.out.children.length-1].position.set(0,-5,-110);
  const houses=new T.Group();W3.out.add(houses);W3.houses=houses;
  for(let i=0;i<PQ(14);i++){const x=-70+i*(LOW?28:10)+Math.random()*4,z=-60-Math.random()*30,h=6+Math.random()*16,w=5+Math.random()*4;
    box(w,h,5,0x171a24,x,-5+h/2,z,houses);
    for(let k=0;k<4;k++)if(Math.random()<.55){const lw=basic(new T.PlaneGeometry(.9,1.2),{color:0xffd27a},houses);lw.position.set(x-w/2+1+Math.random()*(w-2),-3+Math.random()*(h-3),z+2.55)}}
  for(let i=0;i<PQ(16);i++){const tm=new T.MeshLambertMaterial({color:0x14301c,transparent:true,opacity:0});tm.userData.base=1;W3.fade.push(tm);const t=new T.Mesh(new T.ConeGeometry(1.6+Math.random(),5+Math.random()*4,7),tm);t.position.set(-40+Math.random()*80,-2,-25-Math.random()*25);W3.out.add(t)}
  W3.clouds=[];const ctex=blobTex('120,125,140');
  for(let i=0;i<PQ(10);i++){const c=basic(new T.PlaneGeometry(60,22),{map:ctex,opacity:.75,depthWrite:false},W3.out);c.position.set(-120+i*26,30+Math.random()*15,-130+Math.random()*10);W3.clouds.push(c)}
  /* rain as line segments */
  {const N=PQ(900),pos=new Float32Array(N*6);for(let i=0;i<N;i++){const x=-35+Math.random()*70,y=-5+Math.random()*30,z=-11-Math.random()*40;pos.set([x,y,z,x-.15,y-1.1,z],i*6)}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));const m=new T.LineBasicMaterial({color:0x9fb3d6,transparent:true,opacity:0});m.userData.base=.55;W3.fade.push(m);W3.rain=new T.LineSegments(g,m);W3.out.add(W3.rain);W3.rainSpeed=38;W3.rainLen=1.1}
  /* board top + piece textures */
  W3.bcv=document.createElement('canvas');W3.bcv.width=W3.bcv.height=1024;W3.btex=makeTex(W3.bcv);
  W3.top=new T.Mesh(new T.PlaneGeometry(8,8),new T.MeshBasicMaterial({map:W3.btex}));W3.top.rotation.x=-Math.PI/2;W3.top.position.y=.001;scene.add(W3.top);
  W3.ptex={};await Promise.all(['w','b'].flatMap(c=>['p','n','b','r','q','k'].map(t=>new Promise(res=>{const im=new Image();im.onload=()=>{const c2=document.createElement('canvas');c2.width=c2.height=256;c2.getContext('2d').drawImage(im,0,0,256,256);W3.ptex[c+t]=makeTex(c2);res()};im.onerror=res;im.src=PIC(c,t)}))));
  W3.pgeo=new T.PlaneGeometry(1,1);
  await crownInit();if(CR.ready)W3.crownTex=makeTex(CR.cv2);
  /* main loop */
  let last=performance.now();
  let lastStep=0;
  const step=(now,maxDt)=>{lastStep=performance.now();if(!W3.on){last=now;return}const dt=Math.min(maxDt,(now-last)/1000)*W3.speed;last=now;for(const u of [...W3.upd])u(now,dt);frame(dt);R.render(scene,cam)};
  const loop=now=>{requestAnimationFrame(loop);step(now,W3.base>1?.2:.05)}; /* mini events keep real time even on slow devices */
  requestAnimationFrame(loop);
  /* background tab: browsers pause requestAnimationFrame, so a timer finishes the cutscene (fast) */
  setInterval(()=>{if(W3.on&&performance.now()-lastStep>250){const n=performance.now();step(n,document.hidden?1:.25)}},100);
  W3.ready=true;return W3;
}
function frostTex(){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
  const g=x.createRadialGradient(256,256,80,256,256,360);g.addColorStop(0,'rgba(230,245,255,.15)');g.addColorStop(1,'rgba(240,250,255,.95)');x.fillStyle=g;x.fillRect(0,0,512,512);
  x.strokeStyle='rgba(255,255,255,.7)';for(let i=0;i<160;i++){let px=Math.random()*512,py=Math.random()*512,a=Math.random()*6.3;x.lineWidth=Math.random()*1.5+.3;x.beginPath();x.moveTo(px,py);for(let k=0;k<6;k++){a+=(Math.random()-.5)*1.2;px+=Math.cos(a)*14;py+=Math.sin(a)*14;x.lineTo(px,py)}x.stroke()}
  return new W3.T.CanvasTexture(c)}

/* time helpers (W3.speed > 1 when the player presses "skip") */
function tween(ms,f,ease=easeIO){return new Promise(res=>{let t=0;const u=(now,dt)=>{t+=dt*1000;const k=Math.min(1,t/ms);f(ease(k),k);if(k>=1){W3.upd.delete(u);res()}};W3.upd.add(u)})}
function wait(ms){return tween(ms,()=>{})}
function every(f){W3.upd.add(f);return()=>W3.upd.delete(f)}

function setRoomAlpha(a){W3.roomA=a;for(const m of W3.fade){const op=a*m.userData.base;m.opacity=op;const tr=op<.999;if(m.transparent!==tr&&m.userData.base>=1){m.transparent=tr;m.needsUpdate=true}}}

/* square → world (board centred at origin, screen-up = -z, so it matches the 2D board in both orientations) */
function sqW(sq){const[f,r]=fr(sq);return W3.flip?{x:3.5-f,z:r-3.5}:{x:f-3.5,z:3.5-r}}

/* same rule as Board.render in index.html */
const isLight=sq=>((sq.charCodeAt(0)-97)+(+sq[1]))%2===0;
function drawBoard(info){
  const c=W3.bcv,x=c.getContext('2d'),S=c.width,q=S/8;const cs=getComputedStyle(document.documentElement);const V=n=>cs.getPropertyValue(n).trim();
  const L=V('--light')||'#EBECD0',D=V('--dark')||'#739552',HL=V('--hl-l')||'#F5F682',HD=V('--hl-d')||'#B9CA43';
  const wood=document.body.classList.contains('wood')&&window.WOOD&&WOOD.l;
  for(let r=0;r<8;r++)for(let f=0;f<8;f++){const sq=W3.flip?sqN(7-f,r):sqN(f,7-r);const light=isLight(sq);const hl=info.last&&info.last.includes(sq);
    if(wood){/* same piece of the wood picture as the 2D square (background 300%, position --wo) */
      const tile=light?WOOD.l:WOOD.d,tw=tile.width,k=tw/(3*q);const pp=WOOD_POS(r*8+f).match(/[\d.]+/g).map(Number);
      x.drawImage(tile,2*q*pp[0]/100*k,2*q*pp[1]/100*k,q*k,q*k,f*q,r*q,q,q);
      if(hl){x.fillStyle=light?'rgba(190,205,60,.5)':'rgba(170,190,40,.5)';x.fillRect(f*q,r*q,q,q)}}
    else{x.fillStyle=light?(hl?HL:L):(hl?HD:D);x.fillRect(f*q,r*q,q,q)}}
  x.font=`700 ${S/46}px "Segoe UI",system-ui,Arial,sans-serif`;
  for(let i=0;i<8;i++){
    const rk=W3.flip?i+1:8-i;const sqL=W3.flip?sqN(7,i):sqN(0,7-i);const lt=isLight(sqL);x.fillStyle=lt?D:L;x.textAlign='left';x.textBaseline='top';x.fillText(String(rk),q*.04,i*q+q*.03);
    const fl=W3.flip?FILES[7-i]:FILES[i];const sqB=W3.flip?sqN(7-i,7):sqN(i,0);const lb=isLight(sqB);x.fillStyle=lb?D:L;x.textAlign='right';x.textBaseline='bottom';x.fillText(fl,i*q+q*.95,S-q*.02);
  }
  W3.btex.needsUpdate=true;
}

/* the crown a pawn earns by capturing a queen: purely cosmetic, it stays on the piece */
const CROWN_SVG="data:image/svg+xml,"+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 72'><g stroke='#6b4300' stroke-width='2.5' stroke-linejoin='round'><polygon points='0,47 14,3 28,47' fill='#ffd54a'/><polygon points='92,47 106,3 120,47' fill='#ffd54a'/><polygon points='46,47 60,1 74,47' fill='#ffd54a'/><path d='M2,42 Q60,52 118,42 L118,63 Q60,73 2,63 Z' fill='#ffc928'/><ellipse cx='12' cy='54' rx='4.5' ry='8' fill='#3bff8a'/><circle cx='60' cy='58' r='8.5' fill='#3bb2ff'/><ellipse cx='108' cy='54' rx='4.5' ry='8' fill='#ff3b5c'/></g><path d='M8,47 Q60,56 112,47' stroke='#fff2b0' stroke-width='2' fill='none' opacity='.75'/></svg>`);
const CR={p:null,ready:false,failed:false};
function crownInit(){
  if(CR.p)return CR.p;
  CR.p=(async()=>{try{
    const T=await loadThree();const CW=LOW?160:240,CH=LOW?120:180;const r=new T.WebGLRenderer({alpha:true,antialias:!LOW});r.setPixelRatio(1);r.setSize(CW,CH,false);r.setClearColor(0,0);
    const sc=new T.Scene();const cam=new T.PerspectiveCamera(30,4/3,.05,20);cam.position.set(0,.3,1.25);cam.lookAt(0,.09,0);
    const g=buildCrown(T);sc.add(g);const cv2=document.createElement('canvas');cv2.width=CW;cv2.height=CH;
    Object.assign(CR,{T,r,sc,cam,g,cv2,ready:true});
    const draw=n=>{const els=document.querySelectorAll('canvas.wxCrownC');if(!els.length&&!(W3.on&&W3.crownTex))return;
      g.rotation.y=n/700;g.position.y=Math.sin(n/300)*.02;r.render(sc,cam);
      const x=cv2.getContext('2d');x.clearRect(0,0,CW,CH);x.drawImage(r.domElement,0,0);
      els.forEach(c=>{const cx=c.getContext('2d');cx.clearRect(0,0,c.width,c.height);cx.drawImage(cv2,0,0,c.width,c.height)});
      if(W3.crownTex)W3.crownTex.needsUpdate=true};
    let lastD=0;const loop=n=>{requestAnimationFrame(loop);if(document.hidden)return;if(n-lastD<(LOW?33:16))return;lastD=n;draw(n)};requestAnimationFrame(loop);
  }catch(e){CR.failed=true}})();
  return CR.p;
}
/* 2D board: a canvas showing the spinning 3D crown (60% × 45% of the square, over the piece's head) */
function crownHTML(){if(CR.failed)return`<img class="wxCrown" src="${CROWN_SVG}" draggable="false" style="top:4%;height:30%">`;if(!CR.ready)crownInit();return`<canvas class="wxCrown wxCrownC" width="120" height="90"></canvas>`}
/* 3D scene: lying flat it shows the same spinning picture, standing up it becomes the crown model */
function crownOn(o){
  if(o.crown||!W3.crownTex)return;const T=W3.T;
  const m=new T.Mesh(new T.PlaneGeometry(.6,.45),new T.MeshBasicMaterial({map:W3.crownTex,transparent:true,alphaTest:.02,side:T.DoubleSide}));
  m.position.set(0,.5-.105,.004);o.pl.add(m);o.crown=m;
  o.crown3=makeCrown(true);o.crown3.scale.setScalar(.001);
}

/* a piece is just its 2D picture: lies flat (identical to the 2D board from above) and stands up when s→1 */
function makePiece(sq,p){
  const T=W3.T;const grp=new T.Group();grp.rotation.order='YXZ';
  const mat=new T.MeshBasicMaterial({map:W3.ptex[p.color+p.type],transparent:true,alphaTest:.02,side:T.DoubleSide});
  const pl=new T.Mesh(W3.pgeo,mat);grp.add(pl);
  W3.scene.add(grp);
  const o={sq,p,grp,pl,mat,x:0,z:0,lift:0,spin:0,fall:0,alpha:1,tint:1,own:false,scale:1};const w=sqW(sq);o.x=w.x;o.z=w.z;return o;
}
function disposePiece(o){W3.scene.remove(o.grp);o.mat.dispose();if(o.crown){o.crown.geometry.dispose();o.crown.material.dispose()}if(o.crown3)W3.scene.remove(o.crown3)}

/* per-frame: camera, pieces, weather */
function frame(dt){
  const T=W3.T,C=W3.C,cam=W3.cam;
  W3.flash=Math.max(0,W3.flash-dt*2.2);
  const lv=(1-.13*W3.roomA)*W3.lvl+W3.flash*.9;
  W3.top.material.color.setScalar(Math.min(1.6,lv));
  W3.amb.intensity=.55*W3.lvl+W3.flash*2.5;W3.lamp.intensity=1.3*W3.lamp.userData.on;
  W3.sky.material.color.setScalar(1+W3.flash*3).multiply(W3.skyTint);
  for(const k in W3.pcs){const o=W3.pcs[k];updPiece(o,lv)}
  for(const o of W3.extra)updPiece(o,lv);
  for(const c of W3.clouds){c.position.x+=dt*3;if(c.position.x>150)c.position.x=-150}
  /* rain */
  const pa=W3.rain.geometry.attributes.position,a=pa.array;const sp=W3.rainSpeed*dt;
  for(let i=0;i<a.length;i+=6){a[i+1]-=sp;a[i+4]-=sp;a[i]-=sp*.12;a[i+3]-=sp*.12;if(a[i+1]<-5){const x=-35+Math.random()*70,y=24+Math.random()*6,z=a[i+2];a[i]=x;a[i+1]=y;a[i+3]=x-.15;a[i+4]=y-W3.rainLen}}
  pa.needsUpdate=true;
  /* camera */
  const sh=W3.shake;const jx=(Math.random()-.5)*sh,jy=(Math.random()-.5)*sh;
  cam.position.set(C.p.x+jx,C.p.y+jy,C.p.z);cam.up.copy(C.u).normalize();cam.lookAt(C.t.x+jx*.5,C.t.y+jy*.5,C.t.z);
  const Wd=W3.W,Hd=W3.H;if(C.k>.0005)cam.setViewOffset(Wd,Hd,(Wd/2-W3.cx)*C.k,(Hd/2-W3.cy)*C.k,Wd,Hd);else cam.clearViewOffset();
  cam.updateProjectionMatrix();
}
function updPiece(o,lv){
  const s=o.own?o.s??W3.stand:W3.stand;
  const flat=Math.max(1-s,o.fall);
  o.grp.position.set(o.x,.012+o.lift,o.z+.5*(1-s)*o.scale);
  o.grp.rotation.y=o.spin;o.grp.rotation.x=-Math.PI/2*flat;
  o.grp.scale.setScalar(o.scale);
  o.pl.position.y=(.5-.1*s);
  o.mat.color.setScalar(Math.min(1.6,lv*o.tint));o.mat.opacity=o.alpha;
  if(o.crown){ /* standing: the 3D crown floats over the head (same as when it was won); lying flat: the 2D picture */
    const k=Math.min(1,Math.max(0,(s-.15)/.6));const n=performance.now();
    o.crown.material.opacity=(1-k)*o.alpha;o.crown.visible=k<.99;
    o.crown3.visible=k>.01&&o.alpha>.02&&o.fall<.5;o.crown3.scale.setScalar(Math.max(.001,k*o.scale*Math.min(1,o.alpha*1.5)));
    o.crown3.position.set(o.x,o.lift+1.18*k+.35*(1-k)+Math.sin(n/300)*.04*k,o.z);o.crown3.rotation.y=n/700;
  }
}

/* camera shots */
function shot(n){const V=(x,y,z)=>new W3.T.Vector3(x,y,z);
  if(n==='top')return{p:V(0,W3.d,0),t:V(0,0,0),u:V(0,0,-1),k:1};
  if(n==='board')return{p:V(0,7.2,10.2),t:V(0,-.3,.3),u:V(0,1,0),k:0};
  if(n==='window')return{p:V(0,3.6,7),t:V(0,4.6,-9),u:V(0,1,0),k:0};
  if(n==='out')return{p:V(0,4.6,-6.5),t:V(0,6.5,-40),u:V(0,1,0),k:0};
  if(n==='low')return{p:V(-5.5,2.6,6),t:V(0,.2,-.5),u:V(0,1,0),k:0};
}
function cloneShot(s){return{p:s.p.clone(),t:s.t.clone(),u:s.u.clone(),k:s.k}}
function camTo(n,ms,ease=easeIO){const a=cloneShot(W3.C),b=typeof n==='string'?shot(n):n;return tween(ms,e=>{W3.C.p.lerpVectors(a.p,b.p,e);W3.C.t.lerpVectors(a.t,b.t,e);W3.C.u.lerpVectors(a.u,b.u,e);W3.C.k=lerp(a.k,b.k,e)},ease)}

/* overlay: letterbox bars, caption, skip */
function ui3(){
  if(W3.ui)return W3.ui;
  const d=document.createElement('div');d.id='stormUi';d.innerHTML=`<div class="lb t"></div><div class="lb b"></div><div class="cap"><div class="ci"></div><div class="cn"></div><div class="cd"></div></div><button class="skip">Пропустити ⏭</button><div class="bo"></div>`;
  document.body.appendChild(d);d.querySelector('.skip').onclick=()=>{W3.speed=5};W3.ui=d;return d;
}
function caption(ev){const u=ui3();u.querySelector('.ci').textContent=ev.i;u.querySelector('.cn').textContent=ev.n.toUpperCase();u.querySelector('.cd').textContent=ev.d||'';u.classList.add('capOn')}

/* ---------- generic board consequences ---------- */
function liftArc(o,to,ms,h=1.3,spins=1){const w=sqW(to),x0=o.x,z0=o.z,s0=o.spin;return tween(ms,e=>{o.x=lerp(x0,w.x,e);o.z=lerp(z0,w.z,e);o.lift=Math.sin(e*Math.PI)*h;o.spin=s0+e*Math.PI*2*spins},easeIO)}
async function applyChanges(res,how0){
  const jobs=[];const P2={...W3.pcs};
  for(const c of res.ch){if(c.t==='move')delete P2[c.from];if(c.t==='kill')delete P2[c.sq]}
  for(const c of res.ch)if(c.t==='move'&&W3.pcs[c.from]){P2[c.to]=W3.pcs[c.from];W3.pcs[c.from].sq=c.to}
  res.ch.forEach((c,i)=>{
    const how=c.how||how0;
    if(c.t==='move'){const o=W3.pcs[c.from];if(!o)return;
      jobs.push((async()=>{await wait(i*60);if(how==='hop')await liftArc(o,c.to,520,.6,0);else await liftArc(o,c.to,900,1.6,1)})())}
    if(c.t==='kill'){const o=W3.pcs[c.sq];if(!o)return;
      jobs.push((async()=>{await wait(i*80);
        if(how==='burn'){await tween(400,e=>{o.tint=lerp(1,.12,e)});await tween(600,e=>{o.fall=e;o.alpha=1-e*.9})}
        else if(how==='zap'){const s0=o.spin;await tween(1300,e=>{o.lift=e*7;o.spin=s0+e*9;o.alpha=1-Math.max(0,e-.6)/.4;o.tint=1+e*.6},easeIO)}
        else if(how==='smash'){const ang=Math.atan2(o.z,o.x)+(Math.random()-.5);const x0=o.x,z0=o.z;await tween(900,e=>{o.x=x0+Math.cos(ang)*e*7;o.z=z0+Math.sin(ang)*e*7;o.lift=Math.sin(e*Math.PI)*3;o.spin=e*14;o.alpha=1-e;o.tint=lerp(1,.25,e)},easeO)}
        else{const x0=o.x,z0=o.z;await tween(1200,e=>{o.x=lerp(x0,(Math.random()-.5)+x0*.3,e);o.z=lerp(z0,-14,e);o.lift=e*7;o.spin=e*16;o.alpha=1-Math.max(0,e-.5)*2},easeIO)}
        disposePiece(o)})())}
  });
  W3.pcs=P2;
  await Promise.all(jobs);
}
function addPieceDrop(sq,p,from='sky'){const o=makePiece(sq,p);o.own=true;o.s=1;o.alpha=0;W3.pcs[sq]=o;return o}

/* ---------- weather effects (outside the window + on the board) ---------- */
function particles(n,col,size,opa=.9){const T=W3.T;const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(n*3),3));const m=new T.PointsMaterial({color:col,size,transparent:true,opacity:opa,depthWrite:false,map:W3.dot||(W3.dot=blobTex()),blending:T.NormalBlending});const p=new T.Points(g,m);W3.scene.add(p);return p}
function breakGlass(){
  if(!W3.glass.visible)return;W3.glass.visible=false;SFX.glass();const T=W3.T;const sh=[];
  for(let i=0;i<26;i++){const m=new T.Mesh(new T.CircleGeometry(.25+Math.random()*.35,3),new T.MeshBasicMaterial({color:0xcfe3ff,transparent:true,opacity:.55,side:T.DoubleSide,depthWrite:false}));m.position.set(-4.5+Math.random()*9,1.5+Math.random()*6,-9);W3.scene.add(m);sh.push({m,v:new T.Vector3((Math.random()-.5)*4,Math.random()*3,4+Math.random()*7),r:new T.Vector3(Math.random()*9,Math.random()*9,0)})}
  const stop=every((n,dt)=>{for(const s of sh){s.v.y-=12*dt;s.m.position.addScaledVector(s.v,dt);s.m.rotation.x+=s.r.x*dt;s.m.rotation.y+=s.r.y*dt;if(s.m.position.y<-.3&&s.m.position.z>-6&&s.m.position.z<6&&Math.abs(s.m.position.x)<9){s.m.position.y=-.3;s.v.set(0,0,0);s.r.set(0,0,0)}}});
  W3.cleanup.push(()=>{stop();sh.forEach(s=>{W3.scene.remove(s.m);s.m.geometry.dispose();s.m.material.dispose()})});
}
function boltMesh(a,b,w=.12,col=0xeef3ff){const T=W3.T;const pts=[];const n=12;for(let i=0;i<=n;i++){const k=i/n;const p=new T.Vector3().lerpVectors(a,b,k);if(i&&i<n){p.x+=(Math.random()-.5)*1.6*Math.min(1,a.distanceTo(b)/10);p.z+=(Math.random()-.5)*.8}pts.push(p)}
  const m=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts,false,'catmullrom',0),40,w,5),new T.MeshBasicMaterial({color:col,transparent:true,opacity:1}));W3.scene.add(m);return m}
async function zap(a,b,w){const m=boltMesh(a,b,w);W3.flash=1;SFX.thunder();await tween(380,e=>{m.material.opacity=1-e;m.visible=Math.random()>.25||e>.6});W3.scene.remove(m);m.geometry.dispose()}

function makeBird(){const T=W3.T;const g=new T.Group();const mat=new T.MeshLambertMaterial({color:0x111114});
  const body=new T.Mesh(new T.SphereGeometry(.45,10,8),mat);body.scale.set(1,.7,1.8);g.add(body);
  const head=new T.Mesh(new T.SphereGeometry(.3,10,8),mat);head.position.set(0,.25,-.85);g.add(head);
  const beak=new T.Mesh(new T.ConeGeometry(.1,.4,6),new T.MeshLambertMaterial({color:0x444036}));beak.rotation.x=-Math.PI/2;beak.position.set(0,.2,-1.25);g.add(beak);
  const eye=new T.Mesh(new T.SphereGeometry(.05,6,6),new T.MeshBasicMaterial({color:0xffe08a}));eye.position.set(.18,.32,-1);g.add(eye);const eye2=eye.clone();eye2.position.x=-.18;g.add(eye2);
  const wg=new T.BufferGeometry();wg.setAttribute('position',new T.Float32BufferAttribute([0,0,-.5,0,0,.6,1.9,0,.25],3));wg.computeVertexNormals();
  const wm=new T.MeshLambertMaterial({color:0x18181c,side:T.DoubleSide});const wl=new T.Mesh(wg,wm),wr=new T.Mesh(wg,wm);wr.scale.x=-1;g.add(wl);g.add(wr);
  const tail=new T.Mesh(new T.ConeGeometry(.3,.9,4),mat);tail.rotation.x=Math.PI/2;tail.position.z=.95;tail.scale.y=1;g.add(tail);
  g.userData.flap=every((n)=>{const a=Math.sin(n/70)*.9;wl.rotation.z=a;wr.rotation.z=-a});W3.scene.add(g);return g}
function birdFly(b,to,ms,lookAhead=true){const a=b.position.clone();return tween(ms,e=>{b.position.lerpVectors(a,to,e);b.position.y+=Math.sin(e*Math.PI)*1.2;if(lookAhead){const d=new W3.T.Vector3().subVectors(to,a);b.rotation.y=Math.atan2(-d.x,-d.z)}})}

function makeUfo(){const T=W3.T;const g=new T.Group();
  const hull=new T.Mesh(new T.SphereGeometry(2.4,28,12),new T.MeshLambertMaterial({color:0x9aa3ad,emissive:0x1a2230}));hull.scale.y=.28;g.add(hull);
  const dome=new T.Mesh(new T.SphereGeometry(1,20,10,0,Math.PI*2,0,Math.PI/2),new T.MeshBasicMaterial({color:0x8ff6d0,transparent:true,opacity:.75}));dome.position.y=.4;g.add(dome);
  const lights=[];for(let i=0;i<10;i++){const l=new T.Mesh(new T.SphereGeometry(.13,6,6),new T.MeshBasicMaterial({color:0xffee66}));const a=i/10*Math.PI*2;l.position.set(Math.cos(a)*2.2,-.05,Math.sin(a)*2.2);g.add(l);lights.push(l)}
  g.userData.spin=every(n=>{g.rotation.y=n/600;lights.forEach((l,i)=>l.material.color.setHex((Math.floor(n/150)+i)%3?0xffee66:0xff4477))});W3.scene.add(g);return g}
function beamTo(from,to,col=0x8ff6d0){const T=W3.T;const len=from.distanceTo(to);const geo=new T.CylinderGeometry(.35,1.1,len,20,1,true);geo.translate(0,-len/2,0);
  const m=new T.Mesh(geo,new T.MeshBasicMaterial({color:col,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));m.position.copy(from);
  const dir=new T.Vector3().subVectors(to,from).normalize();m.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),dir);W3.scene.add(m);return m}

/* ================= QUEEN CAPTURE: the weaker the capturer, the more epic ================= */
const QTIER={k:1,q:1,r:2,n:3,b:3,p:4};
const QCAP={
  k:{i:'👑',n:'Король розібрався з ферзем'},
  q:{i:'♛',n:'Ферзь проти ферзя'},
  r:{i:'🏰',n:'Тура трощить ферзя'},
  n:{i:'🐴',n:'Кінь збиває ферзя!'},
  b:{i:'⛪',n:'Слон збиває ферзя!'},
  p:{i:'♟',n:'ПІШАК ЗБИВ ФЕРЗЯ!!!'},
};
function qcapCaption(p){const t=QTIER[p];return{i:QCAP[p].i,n:QCAP[p].n,d:'Епічність: '+'★'.repeat(t)+'☆'.repeat(4-t)+(t===4?'  ·  ЛЕГЕНДАРНО':'')}}
function shotAt(w,a,dist,h,ty=.45){const V=(x,y,z)=>new W3.T.Vector3(x,y,z);return{p:V(w.x+Math.sin(a)*dist,h,w.z+Math.cos(a)*dist),t:V(w.x,ty,w.z),u:V(0,1,0),k:0}}
/* the queen's own picture is cut into a 5×5 grid and the pieces fly apart */
function shatter(o,power){
  const T=W3.T,N=5,frags=[],tex=o.mat.map;
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){
    const geo=new T.PlaneGeometry(1/N,1/N);const uv=geo.attributes.uv;
    for(let k=0;k<uv.count;k++)uv.setXY(k,(i+uv.getX(k))/N,(j+uv.getY(k))/N);
    const m=new T.Mesh(geo,new T.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.05,side:T.DoubleSide}));
    m.position.set(o.x+(i+.5)/N-.5,(j+.5)/N-.1+o.lift,o.z);W3.scene.add(m);
    const v=new T.Vector3((i+.5)/N-.5,(j+.5)/N-.25,Math.random()-.35).normalize().multiplyScalar(power*(2+Math.random()*3));v.y+=power*2.2;
    frags.push({m,v,r:new T.Vector3(Math.random()*12,Math.random()*12,Math.random()*12)});
  }
  const stop=every((n,dt)=>{for(const f of frags){f.v.y-=9.8*dt;f.m.position.addScaledVector(f.v,dt);f.m.rotation.x+=f.r.x*dt;f.m.rotation.y+=f.r.y*dt;f.m.rotation.z+=f.r.z*dt;
    if(f.m.position.y<.03&&Math.abs(f.m.position.x)<4.5&&Math.abs(f.m.position.z)<4.5){f.m.position.y=.03;f.v.multiplyScalar(.45);f.v.y=Math.abs(f.v.y)*.3;f.r.multiplyScalar(.5)}}});
  W3.cleanup.push(()=>{stop();frags.forEach(f=>{W3.scene.remove(f.m);f.m.geometry.dispose();f.m.material.dispose()})});
  W3.onReturn.push(e=>frags.forEach(f=>f.m.material.opacity=1-e));
}
function shockwave(w,size,col=0xfff1c0){const T=W3.T;const m=new T.Mesh(new T.RingGeometry(.3,.55,64),new T.MeshBasicMaterial({color:col,transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));m.rotation.x=-Math.PI/2;m.position.set(w.x,.06,w.z);W3.scene.add(m);W3.cleanup.push(()=>W3.scene.remove(m));
  return tween(900,e=>{m.scale.setScalar(1+e*size);m.material.opacity=.9*(1-e)},easeO)}
function burst(w,n,col,speed,size=.25,y=.4){const T=W3.T;const P=particles(n,col,size,1);P.material.blending=T.AdditiveBlending;const a=P.geometry.attributes.position.array;const v=[];
  for(let i=0;i<n;i++){a[i*3]=w.x;a[i*3+1]=y;a[i*3+2]=w.z;const d=new T.Vector3(Math.random()-.5,Math.random()*.9+.2,Math.random()-.5).normalize().multiplyScalar(speed*(.4+Math.random()));v.push(d)}
  const stop=every((nw,dt)=>{for(let i=0;i<n;i++){v[i].y-=6*dt;a[i*3]+=v[i].x*dt;a[i*3+1]=Math.max(.04,a[i*3+1]+v[i].y*dt);a[i*3+2]+=v[i].z*dt}P.geometry.attributes.position.needsUpdate=true;P.material.opacity=Math.max(0,P.material.opacity-dt*.35)});
  W3.cleanup.push(()=>{stop();W3.scene.remove(P)});}
function buildCrown(T){const g=new T.Group();const m=new T.MeshBasicMaterial({color:0xffd54a});
  const band=new T.Mesh(new T.CylinderGeometry(.3,.3,.14,20,1,true),new T.MeshBasicMaterial({color:0xffc928,side:T.DoubleSide}));g.add(band);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const c=new T.Mesh(new T.ConeGeometry(.07,.22,6),m);c.position.set(Math.cos(a)*.3,.17,Math.sin(a)*.3);g.add(c);
    const gem=new T.Mesh(new T.SphereGeometry(.045,8,6),new T.MeshBasicMaterial({color:[0xff3b5c,0x3bb2ff,0x3bff8a][i%3]}));gem.position.set(Math.cos(a)*.31,0,Math.sin(a)*.31);g.add(gem)}
  return g}
function makeCrown(keep){const g=buildCrown(W3.T);g.userData.crown3d=!keep;
  W3.scene.add(g);if(!keep)W3.cleanup.push(()=>W3.scene.remove(g));return g}
function heartbeat(n=3,gap=.75){for(let i=0;i<n;i++){tone(52,.22,{g:.5,delay:i*gap});tone(46,.25,{g:.45,delay:i*gap+.22})}}
function fanfare(){[[392,0],[523,.18],[659,.36],[784,.54],[1047,.8]].forEach(([f,d])=>{tone(f,.9,{type:'triangle',g:.1,delay:d});tone(f/2,.9,{type:'sawtooth',g:.03,delay:d})})}

async function qcapFX(X){
  const c=X.qc,t=QTIER[c.p]||1;const o=W3.pcs[c.from],q=W3.pcs[c.to];if(!o||!q)return;
  const wf=sqW(c.from),wt=sqW(c.to);
  const back=Math.atan2(wf.x-wt.x,wf.z-wt.z);            /* direction from the queen towards the capturer */
  o.own=true;o.s=1;q.own=true;q.s=1;
  const slow=W3.speed<=1;
  /* 1. dramatic intro */
  if(t===4){
    W3.lamp.userData.on=1;
    await Promise.all([camTo(shotAt(wf,back+.35,3.2,1.5,.6),1200),tween(1100,e=>{W3.lvl=lerp(1,.32,e);W3.lamp.userData.on=1-e*.85})]);
    const aura=new W3.T.Sprite(new W3.T.SpriteMaterial({map:blobTex('255,200,70'),transparent:true,depthWrite:false,blending:W3.T.AdditiveBlending,opacity:0}));aura.scale.set(3.2,3.2,1);W3.scene.add(aura);W3.cleanup.push(()=>W3.scene.remove(aura));
    const crown=makeCrown();W3.floatCrown=crown;crown.scale.setScalar(.01);if(o.crown)crown.visible=false; /* already crowned: keep its own crown */
    const follow=every(n=>{aura.position.set(o.x,o.lift+.5,o.z);crown.position.set(o.x,o.lift+1.18+Math.sin(n/300)*.04,o.z);crown.rotation.y=n/700});W3.cleanup.push(follow);
    heartbeat(4,.7);
    burst(wf,PQ(160),0xffd54a,2.2,.18,.2);
    await tween(1600,e=>{o.lift=e*1.1;o.tint=lerp(1,1.9,e);aura.material.opacity=e*.95;o.spin=Math.sin(e*Math.PI)*.4});
    tone(110,3.2,{type:'sawtooth',g:.05});tone(165,3.2,{type:'sawtooth',g:.04});tone(220,3.2,{type:'triangle',g:.05});
    await tween(700,e=>crown.scale.setScalar(Math.max(.01,e)),easeO);
    /* full 360° orbit around the crowned pawn */
    await tween(2600,e=>{const a=back+.35+e*Math.PI*2;const s=shotAt(wf,a,3.4-Math.sin(e*Math.PI)*.6,1.6+Math.sin(e*Math.PI)*.9,.9);W3.C.p.copy(s.p);W3.C.t.copy(s.t)},easeIO);
    await camTo(shotAt(wt,back+.25,4.6,2.6,.6),900);
    o.lift=1.1;
  }else{
    await camTo(shotAt(wt,back+.5,3.6+t*.5,1.5+t*.35,.5),1100);
    if(t>=3){ /* half orbit around the doomed queen */
      tone(82,2.2,{type:'sawtooth',g:.05});noise(2,{type:'bandpass',f:200,f2:900,g:.25,att:1.6});
      const a0=back+.5;await tween(1800,e=>{const s=shotAt(wt,a0+e*Math.PI*.9,4.4,2,.5);W3.C.p.copy(s.p);W3.C.t.copy(s.t)},easeIO);
      await camTo(shotAt(wt,back+.4,4.2,2.2,.6),600);
    }
  }
  /* 2. the jump */
  const H=[0,1.1,2.1,3.2,4.6][t];const x0=o.x,z0=o.z,l0=o.lift;
  noise(.5+t*.15,{type:'bandpass',f:600,f2:2400,q:2,g:.25});
  await tween(650+t*180,e=>{o.x=lerp(x0,wt.x,e);o.z=lerp(z0,wt.z,e);o.lift=lerp(l0,H,easeO(e));o.spin=(t>=2?e*Math.PI*2*(t-1):0)},easeIO);
  /* 3. slow motion at the top */
  if(t>=2&&slow){const sp=W3.speed;W3.speed=t===4?.18:.3;q.tint=1;
    tone(t===4?60:90,1.2,{type:'sine',f2:40,g:.3});
    await tween(t===4?260:200,e=>{o.lift=H+Math.sin(e*Math.PI)*.25;o.spin+=.01});W3.speed=sp}
  /* 4. SLAM */
  await tween(t===4?160:200,e=>{o.lift=H*(1-e)},k=>k*k);o.lift=0;o.spin=0;
  q.alpha=0;shatter(q,.6+t*.45);
  W3.flash=.25+.3*t;W3.shake=.06*t+.04;
  if(t===1){noise(.5,{f:900,g:.5});tone(300,.3,{type:'triangle',g:.1})}else SFX.boom();
  if(t>=2){shockwave(wt,4+t*2.5)}
  if(t>=3){const V=(x,y,z)=>new W3.T.Vector3(x,y,z);zap(V(wt.x-1.5,14,wt.z-3),V(wt.x,.1,wt.z),.08);setTimeout(()=>zap(V(wt.x+2,14,wt.z-4),V(wt.x,.1,wt.z),.08),120);SFX.thunder()
    /* every other piece on the board jumps from the hit */
    const others=Object.values(W3.pcs).filter(x=>x!==o&&x!==q);others.forEach(x=>x.own=true);
    tween(900,e=>others.forEach(x=>{const d=Math.hypot(x.x-wt.x,x.z-wt.z);const k=Math.max(0,1-d/9);x.lift=Math.sin(Math.min(1,e*1.6-d*.05)*Math.PI)*k*.35*t;x.spin=Math.sin(e*Math.PI*2)*.25*k}),k=>k).then(()=>others.forEach(x=>{x.lift=0;x.spin=0;x.own=false}));}
  if(t===4){
    setTimeout(()=>shockwave(wt,18,0xffd54a),180);setTimeout(()=>shockwave(wt,26,0xff8a3b),360);
    burst(wt,PQ(700),0xffd54a,9,.22);burst(wt,PQ(300),0xff5a5a,7,.2);
    W3.skyTint.setRGB(2.2,1.8,1);W3.flash=1.6;setTimeout(fanfare,500);
  }
  await tween(700+t*150,e=>{W3.shake=(.06*t+.04)*(1-e)});
  /* 5. hero pose */
  W3.pcs[c.to]=o;delete W3.pcs[c.from];o.sq=c.to;
  if(q.crown||t===4){if(W3.floatCrown){W3.floatCrown.visible=false;W3.floatCrown.scale.setScalar(.001)}crownOn(o)}
  disposePiece(q);
  if(t===4){await camTo(shotAt(wt,back+.25,4,1.9,.9),1100);await wait(900);await tween(900,e=>{W3.lvl=lerp(.32,1,e);W3.lamp.userData.on=lerp(.15,1,e);o.tint=lerp(1.9,1,e);W3.skyTint.setRGB(lerp(2.2,1,e),lerp(1.8,1,e),1)})}
  else{await camTo(shotAt(wt,back+.4,3+t*.3,1.3,.5),900);await wait(400+t*150)}
  o.own=false;
}

const FX={
  async tornado(X){
    const T=W3.T;SFX.wind(5);W3.rainSpeed=60;
    const N=PQ(1600);const P=particles(N,0xa9a49a,LOW?3.6:2.6,.6);const seed=[];for(let i=0;i<N;i++)seed.push({h:Math.random(),a:Math.random()*6.28,s:.8+Math.random()*1.5,j:Math.random()});
    const debris=[];for(let i=0;i<14;i++){const m=new T.Mesh(new T.BoxGeometry(.6,.3,.9),new T.MeshLambertMaterial({color:[0x5b4a3a,0x7d6a55,0x3c3f44][i%3]}));W3.scene.add(m);debris.push({m,a:Math.random()*6.28,h:Math.random(),s:1+Math.random()})}
    const pos=new T.Vector3(-16,-5,-46);let t=0;
    const stop=every((n,dt)=>{t+=dt;const a=P.geometry.attributes.position.array;
      for(let i=0;i<N;i++){const s=seed[i];s.a+=dt*s.s*(3+(1-s.h)*3);const y=s.h*26;const r=.6+Math.pow(s.h,1.6)*9+s.j*.8;a[i*3]=pos.x+Math.cos(s.a)*r+Math.sin(t*2+s.h*5)*1.2*s.h;a[i*3+1]=pos.y+y;a[i*3+2]=pos.z+Math.sin(s.a)*r}
      P.geometry.attributes.position.needsUpdate=true;
      for(const d of debris){d.a+=dt*d.s*4;const r=3+d.h*7;d.m.position.set(pos.x+Math.cos(d.a)*r,pos.y+2+d.h*18,pos.z+Math.sin(d.a)*r);d.m.rotation.x+=dt*5;d.m.rotation.z+=dt*3}
      W3.curt.forEach((c,i)=>{c.rotation.y=Math.sin(n/120+i)*.25*W3.wind;c.position.z=-8.4+W3.wind*.8})});
    W3.wind=.3;W3.cleanup.push(()=>{stop();W3.scene.remove(P);P.geometry.dispose();debris.forEach(d=>W3.scene.remove(d.m));W3.wind=0});
    await camTo('out',900);
    await tween(2600,e=>{pos.set(lerp(-16,4,e),-5,lerp(-46,-24,e));W3.shake=e*.12;W3.wind=.3+e*.7},easeIO);
    breakGlass();W3.shake=.25;await camTo('board',900);
  },
  async lightning(X){
    await camTo('out',800);const V=(x,y,z)=>new W3.T.Vector3(x,y,z);
    await zap(V(-20,45,-90),V(-14,-5,-70),.5);await wait(350);await zap(V(15,45,-80),V(9,-5,-50),.45);await wait(300);
    await camTo('board',900);
    const k=X.res.ch;for(const c of k){const w=sqW(c.sq);await zap(V(w.x*.4,16,-7),V(w.x,.1,w.z),.09);}
  },
  async crow(X){
    SFX.caw();const b=makeBird();b.position.set(-30,12,-60);W3.cleanup.push(()=>{W3.upd.delete(b.userData.flap);W3.scene.remove(b)});
    await camTo('window',800);await birdFly(b,new W3.T.Vector3(0,4.2,-8.6),1800);SFX.caw();await wait(500);
    const c=X.res.ch[0];const o=W3.pcs[c.from];if(!o)return;const wf=sqW(c.from),wt=sqW(c.to);
    camTo('board',1100);await birdFly(b,new W3.T.Vector3(wf.x,1.3,wf.z),1200);
    o.own=true;o.s=1;const grab=every(()=>{o.x=b.position.x;o.z=b.position.z;o.lift=Math.max(0,b.position.y-1.4);o.spin+=.05});
    await birdFly(b,new W3.T.Vector3(wf.x*.3+wt.x*.7,4,(wf.z+wt.z)/2-1),900);await birdFly(b,new W3.T.Vector3(wt.x,2.6,wt.z),700);
    grab();SFX.caw();const l0=o.lift;await tween(380,e=>{o.x=wt.x;o.z=wt.z;o.lift=l0*(1-e)},k=>k*k);o.lift=0;o.own=false;
    delete W3.pcs[c.from];W3.pcs[c.to]=o;o.sq=c.to;
    birdFly(b,new W3.T.Vector3(0,6,-30),1600);await wait(600);
  },
  async fog(X){
    const T=W3.T;await camTo('window',900);W3.scene.fog=new T.FogExp2(0x9aa3ab,0);const tex=blobTex('205,212,220');const pl=[];
    for(let i=0;i<14;i++){const m=new T.Mesh(new T.PlaneGeometry(9,5),new T.MeshBasicMaterial({map:tex,transparent:true,opacity:0,depthWrite:false}));m.position.set(-12+Math.random()*24,1+Math.random()*6,-30+Math.random()*18);W3.scene.add(m);pl.push(m)}
    W3.cleanup.push(()=>{W3.scene.fog=null;pl.forEach(m=>W3.scene.remove(m))});
    SFX.wind(4);await tween(2200,e=>{W3.scene.fog.density=e*.05;pl.forEach((m,i)=>{m.material.opacity=e*.8;m.position.z+=.03})});
    W3.frost.material.userData.base=.35;W3.frost.material.opacity=.35;
    await camTo('board',900);
    const zs=X.fogZ;pl.forEach((m,i)=>{m.position.set(-3.5+(i%4)*2.4,.6+Math.random()*.6,lerp(zs[0],zs[1],Math.random()));m.rotation.x=-Math.PI/2.4});
    await tween(900,e=>{W3.scene.fog.density=.05*(1-e)+.01*e});
  },
  async quake(X){
    await camTo('low',900);SFX.rumble(3.4);
    const cup=W3.cup;await tween(1300,e=>{W3.shake=e*.35;cup.rotation.z=e>.7?(e-.7)/.3*1.45:Math.sin(e*60)*.05;cup.position.x=6+(e>.7?(e-.7)/.3*.6:0)});
    await camTo('board',700);W3.shake=.22;
    await applyChanges(X.res,'hop');await tween(600,e=>{W3.shake=.22*(1-e)});
  },
  async frost(X){
    W3.rainSpeed=5;W3.rainLen=.15;W3.rain.material.color.setHex(0xffffff);
    await camTo('window',900);SFX.freeze();W3.frost.material.userData.base=.9;await tween(1600,e=>{W3.frost.material.opacity=e*.9});
    await camTo('board',900);const T=W3.T;
    for(const sq of X.res.freeze){const w=sqW(sq);const m=new T.Mesh(new T.BoxGeometry(.95,1.1,.95),new T.MeshLambertMaterial({color:0xbfe8ff,transparent:true,opacity:.55,emissive:0x2a5a7a}));m.position.set(w.x,.55,w.z);m.scale.setScalar(.01);W3.scene.add(m);W3.cleanup.push(()=>W3.scene.remove(m));W3.ice.push(m);
      const o=W3.pcs[sq];SFX.freeze();await tween(600,e=>{m.scale.setScalar(e);if(o)o.tint=lerp(1,.75,e)},easeO)}
    await wait(500);
  },
  async ufo(X){
    const u=makeUfo();u.position.set(30,30,-70);W3.cleanup.push(()=>{W3.upd.delete(u.userData.spin);W3.scene.remove(u)});SFX.ufo();
    await camTo('window',900);await tween(2200,e=>{u.position.set(lerp(30,0,e),lerp(30,7.5,e),lerp(-70,-14,e))},easeO);
    await camTo('board',900);const c=X.res.ch[0];const w=sqW(c.sq);const bm=beamTo(u.position.clone().add(new W3.T.Vector3(0,-.4,0)),new W3.T.Vector3(w.x,0,w.z));W3.cleanup.push(()=>W3.scene.remove(bm));
    SFX.ufo();await tween(500,e=>{bm.material.opacity=e*.45});await applyChanges(X.res);await tween(400,e=>{bm.material.opacity=.45*(1-e)});
    tween(1400,e=>{u.position.y=7.5+e*30},k=>k*k);await wait(400);
  },
  async ufoBack(X){
    const u=makeUfo();u.position.set(0,40,-20);W3.cleanup.push(()=>{W3.upd.delete(u.userData.spin);W3.scene.remove(u)});SFX.ufo();
    await camTo('window',800);await tween(1500,e=>{u.position.set(0,lerp(40,7.5,e),lerp(-20,-14,e))},easeO);
    await camTo('board',900);const c=X.res.ch[0];const w=sqW(c.sq);const bm=beamTo(u.position.clone(),new W3.T.Vector3(w.x,0,w.z));W3.cleanup.push(()=>W3.scene.remove(bm));
    await tween(500,e=>{bm.material.opacity=e*.45});
    const o=addPieceDrop(c.sq,c.p);o.lift=6;SFX.ufo();await tween(1400,e=>{o.lift=6*(1-e);o.alpha=Math.min(1,e*2);o.spin=(1-e)*10},easeO);o.own=false;
    await tween(400,e=>{bm.material.opacity=.45*(1-e)});tween(1400,e=>{u.position.y=7.5+e*30},k=>k*k);await wait(400);
  },
  async rainbow(X){
    const T=W3.T;W3.rainSpeed=0;W3.rain.visible=false;SFX.chime();
    await camTo('window',900);const cols=[0xff3b30,0xff9500,0xffcc00,0x34c759,0x30b0ff,0x5856d6];const arcs=[];
    cols.forEach((c,i)=>{const m=new T.Mesh(new T.TorusGeometry(40-i*1.1,.55,6,80,Math.PI),new T.MeshBasicMaterial({color:c,transparent:true,opacity:0,depthWrite:false}));m.position.set(0,-5,-110);W3.scene.add(m);arcs.push(m)});
    W3.cleanup.push(()=>{arcs.forEach(m=>W3.scene.remove(m));W3.rain.visible=true});
    await tween(1800,e=>{arcs.forEach(m=>m.material.opacity=e*.7);W3.skyTint.setRGB(lerp(1,2.2,e),lerp(1,2.3,e),lerp(1,2.6,e))});
    await camTo('board',900);await applyChanges(X.res,'hop');SFX.chime();
  },
  async watcher(X){
    const T=W3.T;await camTo('window',1100);
    const fig=new T.Group();const mat=new T.MeshBasicMaterial({color:0x050507});
    const body=new T.Mesh(new T.CylinderGeometry(1.1,1.4,7,14),mat);body.position.y=-1;fig.add(body);const head=new T.Mesh(new T.SphereGeometry(1,16,12),mat);head.position.y=3.3;fig.add(head);
    const eyeM=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0});const e1=new T.Mesh(new T.SphereGeometry(.12,8,8),eyeM);e1.position.set(.35,3.4,.9);const e2=e1.clone();e2.position.x=-.35;fig.add(e1);fig.add(e2);
    fig.position.set(1.5,1,-13);W3.scene.add(fig);W3.cleanup.push(()=>W3.scene.remove(fig));fig.visible=false;
    for(let i=0;i<5;i++){W3.lamp.userData.on=i%2?1:.1;W3.lvl=i%2?1:.55;SFX.flick();await wait(120+Math.random()*120)}
    W3.lamp.userData.on=.35;W3.lvl=.6;fig.visible=true;W3.rainSpeed=10;
    await tween(1800,e=>{eyeM.opacity=e;fig.position.z=lerp(-13,-11,e)});await wait(700);
    tone(55,1.5,{type:'sawtooth',g:.15});
    const bo=ui3().querySelector('.bo');bo.style.opacity=1;await wait(900);
    /* in the dark: the piece is moved */
    const c=X.res.ch[0];const o=W3.pcs[c.from];if(o){const w=sqW(c.to);o.x=w.x;o.z=w.z;delete W3.pcs[c.from];W3.pcs[c.to]=o;o.sq=c.to}
    fig.visible=false;W3.lamp.userData.on=1;W3.lvl=1;W3.rainSpeed=38;W3.C=cloneShot(shot('board'));
    bo.style.opacity=0;SFX.flick();await wait(900);
  },
  async meteor(X){
    const T=W3.T;await camTo('window',900);
    await tween(1200,e=>W3.skyTint.setRGB(lerp(1,2.4,e),lerp(1,.8,e),lerp(1,.7,e)));
    const rock=new T.Mesh(new T.IcosahedronGeometry(.9,1),new T.MeshBasicMaterial({color:0xffb347}));W3.scene.add(rock);
    const tail=particles(300,0xff7b2e,1.2,.9);const tr=[];W3.cleanup.push(()=>{W3.scene.remove(rock);W3.scene.remove(tail)});
    const blk=X.res.block.map(sqW);const cx=blk.reduce((a,b)=>a+b.x,0)/4,cz=blk.reduce((a,b)=>a+b.z,0)/4;
    const A=new T.Vector3(-60,60,-140),B=new T.Vector3(0,5,-9),Cc=new T.Vector3(cx,.2,cz);
    noise(3,{type:'bandpass',f:200,f2:1400,g:.5,att:2.5});
    const stepTail=()=>{tr.unshift(rock.position.clone());tr.length=Math.min(tr.length,300);const a=tail.geometry.attributes.position.array;for(let i=0;i<300;i++){const p=tr[Math.min(i,tr.length-1)];a[i*3]=p.x+(Math.random()-.5)*.6;a[i*3+1]=p.y+(Math.random()-.5)*.6;a[i*3+2]=p.z+(Math.random()-.5)*.6}tail.geometry.attributes.position.needsUpdate=true};
    const stT=every(stepTail);W3.cleanup.push(stT);
    await tween(2200,e=>{rock.position.lerpVectors(A,B,e);rock.rotation.x+=.1},k=>k*k);
    breakGlass();camTo('board',500);await tween(500,e=>{rock.position.lerpVectors(B,Cc,e)},k=>k*k);
    rock.visible=false;SFX.boom();W3.flash=1.3;W3.shake=.6;
    const EN=PQ(500);const ex=particles(EN,0xffa040,.6,1);const v=[];for(let i=0;i<EN;i++)v.push(new T.Vector3((Math.random()-.5)*14,Math.random()*12,(Math.random()-.5)*14));const ea=ex.geometry.attributes.position.array;for(let i=0;i<EN;i++){ea[i*3]=cx;ea[i*3+1]=.3;ea[i*3+2]=cz}
    const stE=every((n,dt)=>{for(let i=0;i<EN;i++){v[i].y-=14*dt;ea[i*3]+=v[i].x*dt;ea[i*3+1]=Math.max(.05,ea[i*3+1]+v[i].y*dt);ea[i*3+2]+=v[i].z*dt}ex.geometry.attributes.position.needsUpdate=true;ex.material.opacity=Math.max(0,ex.material.opacity-dt*.5)});W3.cleanup.push(()=>{stE();W3.scene.remove(ex)});
    const cr=new T.Mesh(new T.CircleGeometry(1.5,24),new T.MeshBasicMaterial({color:0x1a0f08,transparent:true,opacity:.85,depthWrite:false}));cr.rotation.x=-Math.PI/2;cr.position.set(cx,.008,cz);W3.scene.add(cr);W3.crater=cr;W3.cleanup.push(()=>W3.scene.remove(cr));
    await applyChanges(X.res,'smash');await tween(700,e=>{W3.shake=.6*(1-e)});
  },
};

/* the whole cutscene. Returns after the 3D board is back exactly where the 2D board is. */
async function play3D(evk,X){
  await init3D();const T=W3.T;
  const rc=$('#board').getBoundingClientRect();
  if(!innerWidth||!innerHeight||rc.width<40)throw new Error('board not visible');W3.W=innerWidth;W3.H=innerHeight;W3.cx=rc.left+rc.width/2;W3.cy=rc.top+rc.height/2;
  W3.R.setSize(W3.W,W3.H,false);W3.cv.style.width=W3.W+'px';W3.cv.style.height=W3.H+'px';W3.cam.aspect=W3.W/W3.H;W3.cam.fov=35;W3.cam.updateProjectionMatrix();
  W3.d=8*W3.H/(rc.width*2*Math.tan(35*Math.PI/360));
  W3.flip=X.flip;W3.base=X.speed||1;W3.speed=W3.base;W3.cleanup=[];W3.onReturn=[];W3.floatCrown=null;W3.extra=[];W3.ice=[];W3.flash=0;W3.shake=0;W3.lvl=1;W3.wind=0;W3.lamp.userData.on=1;W3.skyTint=new T.Color(1,1,1);
  W3.rainSpeed=38;W3.rainLen=1.1;W3.rain.material.color.setHex(0x9fb3d6);W3.rain.visible=true;W3.glass.visible=true;W3.frost.material.userData.base=0;W3.frost.material.opacity=0;
  W3.cup.rotation.set(0,0,0);W3.cup.position.set(6,-.3,2.2);W3.curt.forEach(c=>{c.rotation.set(0,0,0);c.position.z=-8.4});
  for(const k in W3.pcs)disposePiece(W3.pcs[k]);W3.pcs={};
  for(const[sq,p]of Object.entries(X.map0)){W3.pcs[sq]=makePiece(sq,p);if(X.crowns&&X.crowns.includes(sq))crownOn(W3.pcs[sq])}
  drawBoard({last:X.last});W3.C=cloneShot(shot('top'));W3.stand=0;setRoomAlpha(0);
  const u=ui3();u.classList.remove('capOn');u.querySelector('.bo').style.opacity=0;u.classList.toggle('mini',W3.base>1);
  W3.on=true;W3.cv.style.display='block';u.style.display='block';
  /* one frame identical to the 2D board, then hide the DOM board under it */
  await wait(30);X.hide2D(true);
  u.classList.add('on');
  /* lift off */
  W3.speed=W3.base;
  await Promise.all([camTo('board',1500),tween(900,e=>setRoomAlpha(e)),(async()=>{await wait(350);await tween(900,e=>W3.stand=e,easeO)})()]);
  if(evk!=='qcap')caption(X.cap||EVENTS[evk]);
  const needCh=['crow','ufo','ufoBack','watcher','meteor'];
  const generic=async()=>{await camTo('window',900);if(evk==='lightning'||evk==='meteor')SFX.thunder();else if(evk==='crow')SFX.caw();else if(evk.startsWith('ufo'))SFX.ufo();else SFX.wind(2.5);await wait(1400);await camTo('board',900)};
  if(evk==='qcap')await qcapFX(X);else
  await ((X.res.miss&&needCh.includes(evk))||!FX[evk]?generic:FX[evk])(X);
  /* generic consequences for events whose FX did not move the pieces themselves */
  if(X.res&&!['crow','quake','ufo','ufoBack','rainbow','watcher','meteor','qcap'].includes(evk))await applyChanges(X.res,evk==='tornado'?'fly':null);
  if(evk==='tornado'){await tween(700,e=>{W3.shake=.25*(1-e)})}
  if(X.res&&X.res.miss){await wait(400)}
  await wait(700);
  u.classList.remove('capOn');
  /* sync the 3D pieces with the final position (safety) and go back */
  const fin=mapOf(new Chess(X.res?X.res.fen:X.fen));
  for(const k in W3.pcs){const o=W3.pcs[k];const p=fin[k];if(!p||p.type!==o.p.type||p.color!==o.p.color){disposePiece(o);delete W3.pcs[k]}}
  for(const[sq,p]of Object.entries(fin))if(!W3.pcs[sq])W3.pcs[sq]=makePiece(sq,p);
  for(const k in W3.pcs){const o=W3.pcs[k];const w=sqW(k);o.own=false;o.lift=0;o.fall=0;o.alpha=1;o.x=w.x;o.z=w.z}
  const spins=Object.values(W3.pcs).map(o=>[o,o.spin%(Math.PI*2),o.tint]);
  drawBoard({last:null});W3.scene.fog=null;
  W3.speed=Math.min(W3.speed,Math.max(2,W3.base));
  const crater=W3.crater;W3.crater=null;
  await Promise.all([
    camTo('top',1500),
    tween(1300,e=>{W3.stand=1-e;W3.onReturn.forEach(f=>f(e));spins.forEach(([o,s,t])=>{o.spin=s*(1-e);o.tint=lerp(t,1,e)});W3.ice.forEach(m=>m.material.opacity=.55*(1-e));if(crater)crater.material.opacity=.85*(1-e);W3.shake*=.9},easeIO),
    (async()=>{await wait(700);await tween(800,e=>setRoomAlpha(1-e))})()
  ]);
  W3.shake=0;W3.flash=0;
  await wait(40);
  if(X.before2D)X.before2D();
  X.hide2D(false);await wait(30);
  W3.on=false;W3.cv.style.display='none';u.classList.remove('on');u.style.display='none';
  W3.cleanup.forEach(f=>{try{f()}catch(e){}});W3.cleanup=[];W3.upd.clear();
  for(const k in W3.pcs)disposePiece(W3.pcs[k]);W3.pcs={};
}
/* fallback when WebGL / three.js is unavailable */
async function play2D(evk,X){
  const u=ui3();u.style.display='block';u.classList.add('on');if(evk!=='qcap')caption(X.cap||EVENTS[evk]);if(evk==='qcap'){SFX.boom();await sleep(600)}
  const b=document.querySelector('#board');b.classList.add('wxShake');
  if(evk==='lightning'||evk==='meteor')SFX.thunder();else if(evk==='tornado'||evk==='fog')SFX.wind(3);else if(evk==='crow')SFX.caw();else if(evk.startsWith('ufo'))SFX.ufo();else if(evk==='quake')SFX.rumble();else if(evk==='rainbow')SFX.chime();else if(evk==='frost')SFX.freeze();
  await sleep(X.speed>1?900:2200);b.classList.remove('wxShake');u.classList.remove('capOn','on');u.style.display='none';
}

/* ================= MINI WEATHER (2D, about one second, right on the normal board) ================= */
async function playMini(k,X){
  const B=$('#board'),br=B.getBoundingClientRect(),sz=br.width/8;const ev=EVENTS[k];const res=X.res||{ch:[]};
  const lay=document.createElement('div');lay.className='wxMini';B.appendChild(lay);
  const sqEl=sq=>{for(let i=0;i<64;i++)if(board.idxToSq(i)===sq)return board.sqs[i];return null};
  const pos=sq=>{const r=sqEl(sq).getBoundingClientRect();return{x:r.left-br.left,y:r.top-br.top}};
  /* everything is drawn 2.6× slower than the first version (1 s was too fast to understand) */
  const MT=2.4;
  const done=[];const A=(e,kf,o)=>{const a=e.animate(kf,{fill:'both',easing:'ease-in-out',...o,duration:(o&&o.duration||0)*MT,delay:(o&&o.delay||0)*MT});done.push(a.finished.catch(()=>{}));return a};
  const el=(cls,html,css)=>{const d=document.createElement('div');d.className=cls;if(html!=null)d.innerHTML=html;if(css)d.style.cssText=css;lay.appendChild(d);return d};
  const emo=(ch,size,x,y)=>el('wxFx',ch,`left:${x}px;top:${y}px;font-size:${size}px;line-height:1;transform-origin:center`);
  /* a copy of the piece that can fly around; the real one is hidden until the new position is drawn */
  const clone=(sq,p)=>{const s=sqEl(sq);let src=null;if(s){const im=s.querySelector('img.pc');if(im){im.style.visibility='hidden';src=im.src}s.querySelectorAll('.wxCrown').forEach(c=>c.style.visibility='hidden')}
    if(p)src=PIC(p.color,p.type);if(!src)return null;const c=document.createElement('img');c.src=src;c.className='wxMp';const q=pos(sq);c.style.cssText=`left:${q.x}px;top:${q.y}px;width:${sz}px;height:${sz}px`;lay.appendChild(c);return c};
  /* name + what is happening, readable for the whole animation */
  /* no words on the board: the coach panel explains what happened right after */
  /* cinematic intro: dark edges, a slanted title band, and particles that set the mood */
  {const K={lay,A,el,sz,W:br.width,B};const EVC={tornado:'#90A4AE',lightning:'#FFD54F',crow:'#546E7A',fog:'#B0BEC5',quake:'#A1887F',frost:'#81D4FA',ufo:'#69F0AE',ufoBack:'#69F0AE',rainbow:'#F48FB1',watcher:'#FF1744',meteor:'#FF7043'};
   const AMB={tornado:'leaves',lightning:'rain',crow:'feathers',fog:'mist',quake:'dust',frost:'snow',ufo:'stars',ufoBack:'stars',rainbow:'sparkle',meteor:'embers'};
   fxVignette(K,1700,k==='watcher'?.95:.75,0,k==='watcher'?'40,0,0':'0,0,0');
   fxBanner(K,{icon:ev.i,title:'',col:EVC[k]||'#90A4AE',dur:460});MUS.riser(.9);MUS.drum(.95,.7);
   if(AMB[k])fxAmbient(K,AMB[k],1500,100);
   }
  await sleep(420*MT);
  const flash=(col,op,d,delay=0)=>{const f=el('wxFx','',`inset:0;background:${col}`);A(f,[{opacity:0},{opacity:op,offset:.15},{opacity:0}],{duration:d,delay})};
  const shake=(amp,d,delay=0)=>A(B,[0,1,2,3,4,5,6,7,8].map(i=>({transform:i===8?'none':`translate(${(Math.random()-.5)*amp}px,${(Math.random()-.5)*amp}px) rotate(${(Math.random()-.5)*amp*.15}deg)`})),{duration:d,delay,easing:'linear',fill:'none'});
  /* how the pieces change (second half of the second) */
  const pieces=(delay=450,dur=550)=>{for(const c of res.ch){
    if(c.t==='move'&&c.how!=='crow'&&c.how!=='blink'){const m=clone(c.from);if(!m)continue;const a=pos(c.from),b=pos(c.to);const dx=b.x-a.x,dy=b.y-a.y;const h=c.how==='hop'?sz*.35:sz*.9;
      A(m,[{transform:'translate(0,0) scale(1) rotate(0)'},{transform:`translate(${dx*.5}px,${dy*.5-h}px) scale(1.25) rotate(${c.how==='hop'?0:200}deg)`},{transform:`translate(${dx}px,${dy}px) scale(1) rotate(${c.how==='hop'?0:360}deg)`}],{duration:dur,delay})}
    if(c.t==='kill'){const m=clone(c.sq);if(!m)continue;
      if(c.how==='burn')A(m,[{filter:'brightness(1)',transform:'scale(1)',opacity:1},{filter:'brightness(0)',transform:'scale(1.1)',opacity:1,offset:.4},{filter:'brightness(0)',transform:'scale(.2) rotate(40deg)',opacity:0}],{duration:dur,delay});
      else if(c.how==='zap')A(m,[{transform:'translateY(0) rotate(0)',opacity:1},{transform:`translateY(${-sz*3}px) rotate(540deg)`,opacity:0}],{duration:dur,delay,easing:'ease-in'});
      else if(c.how==='smash'){const ang=Math.random()*Math.PI*2;A(m,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${Math.cos(ang)*sz*3}px,${Math.sin(ang)*sz*3}px) rotate(${(Math.random()-.5)*900}deg) scale(.4)`,opacity:0}],{duration:dur,delay,easing:'ease-out'})}
      else A(m,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${sz*4}px,${-sz*5}px) rotate(720deg) scale(.5)`,opacity:0}],{duration:dur,delay,easing:'ease-in'})}
    if(c.t==='add'){const m=clone(c.sq,c.p);if(!m)continue;m.style.opacity=0;A(m,[{transform:`translateY(${-sz*3}px) rotate(-360deg)`,opacity:0},{transform:'translateY(0) rotate(0)',opacity:1}],{duration:dur,delay,easing:'cubic-bezier(.3,1.4,.5,1)'})}
  }};
  const W=br.width,mid=W/2;
  if(k==='tornado'){SFX.wind(3.2);const t=emo('🌪',sz*2.6,-sz*3,mid-sz*1.3);A(t,[{transform:'translateX(0) rotate(0)'},{transform:`translateX(${W+sz*4}px) rotate(1080deg)`}],{duration:1050,easing:'ease-in-out'});
    A(B,[{transform:'rotate(0)'},{transform:'rotate(-2.5deg)',offset:.35},{transform:'rotate(2deg)',offset:.65},{transform:'rotate(0)'}],{duration:1000,fill:'none'});pieces(300,650)}
  else if(k==='lightning'){SFX.thunder();flash('#fff',.85,350);
    res.ch.forEach((c,i)=>{const q=pos(c.sq);const bolt=el('wxFx',`<svg viewBox="0 0 40 160" width="${sz*.7}" height="${q.y+sz}"><polyline points="22,0 12,60 26,62 8,160 30,78 16,76 28,0" fill="#fff9c4" stroke="#ffd54a" stroke-width="3"/></svg>`,`left:${q.x+sz*.15}px;top:0;filter:drop-shadow(0 0 8px #fff)`);
      A(bolt,[{opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.3},{opacity:0}],{duration:600,delay:i*150})});pieces(250,600)}
  else if(k==='crow'){SFX.caw();const c=res.ch[0];
    if(c){const a=pos(c.from),b=pos(c.to);const bird=emo('🐦‍⬛',sz*.9,-sz,-sz);const m=clone(c.from);
      A(bird,[{transform:'translate(0,0)'},{transform:`translate(${a.x+sz*1.05}px,${a.y+sz*.6}px)`,offset:.35},{transform:`translate(${b.x+sz*1.05}px,${b.y+sz*.6}px)`,offset:.75},{transform:`translate(${W+sz*2}px,${-sz*2}px)`}],{duration:1100,easing:'linear'});
      if(m)A(m,[{transform:'translate(0,0)'},{transform:'translate(0,0)',offset:.35},{transform:`translate(${(b.x-a.x)*.5}px,${(b.y-a.y)*.5-sz*.8}px) rotate(-20deg)`,offset:.55},{transform:`translate(${b.x-a.x}px,${b.y-a.y}px)`,offset:.75},{transform:`translate(${b.x-a.x}px,${b.y-a.y}px)`}],{duration:1100,easing:'linear'})}
    else{const bird=emo('🐦‍⬛',sz*.9,-sz,mid);A(bird,[{transform:'translate(0,0)'},{transform:`translate(${W+sz*2}px,${-sz*3}px)`}],{duration:1000})}}
  else if(k==='fog'){SFX.wind(3);const f=el('wxFx','',`left:0;right:0;top:0;height:100%;background:linear-gradient(180deg,rgba(215,220,226,.0),rgba(215,220,226,.85) 30%,rgba(215,220,226,.85) 70%,rgba(215,220,226,0));backdrop-filter:blur(4px)`);
    A(f,[{transform:'translateY(-100%)',opacity:1},{transform:'translateY(0)',opacity:1,offset:.6},{transform:'translateY(0)',opacity:0}],{duration:1050})}
  else if(k==='quake'){SFX.rumble(3);shake(sz*.35,900);
    if(res.rank!=null){const y=pos(sqN(0,res.rank)).y;const crack=el('wxFx','',`left:0;right:0;top:${y+sz/2-2}px;height:4px;background:#3a2a1a;box-shadow:0 0 6px #000`);A(crack,[{transform:'scaleX(0)'},{transform:'scaleX(1)',offset:.4},{transform:'scaleX(1)',opacity:1,offset:.85},{opacity:0}],{duration:1000})}
    pieces(350,550)}
  else if(k==='frost'){SFX.freeze();const f=el('wxFx','',`inset:0;box-shadow:inset 0 0 ${sz*1.5}px ${sz*.4}px rgba(200,240,255,.95)`);A(f,[{opacity:0},{opacity:1,offset:.4},{opacity:0}],{duration:1050});
    (res.freeze||[]).forEach((sq,i)=>{const q=pos(sq);for(let j=0;j<(LOW?3:6);j++){const sn=emo('❄',sz*.35,q.x+sz*.35,q.y+sz*.3);const a=Math.random()*6.28;A(sn,[{transform:'translate(0,0) scale(.3)',opacity:1},{transform:`translate(${Math.cos(a)*sz*.7}px,${Math.sin(a)*sz*.7}px) scale(1)`,opacity:0}],{duration:800,delay:200+i*120+j*30})}
      const ice=el('wxFx','',`left:${q.x+sz*.05}px;top:${q.y+sz*.05}px;width:${sz*.9}px;height:${sz*.9}px;border-radius:12%;background:linear-gradient(135deg,rgba(215,245,255,.7),rgba(120,190,235,.4))`);A(ice,[{transform:'scale(0)'},{transform:'scale(1.1)',offset:.7},{transform:'scale(1)'}],{duration:500,delay:300+i*120})})}
  else if(k==='ufo'||k==='ufoBack'){SFX.ufo();const c=res.ch[0];const sq=c?(c.sq):'e5';const q=pos(sq);
    const ufo=emo('🛸',sz*1.1,q.x-sz*.05,-sz*1.5);A(ufo,[{transform:'translateY(0)'},{transform:`translateY(${q.y-sz*.2+sz*1.5}px)`,offset:.35},{transform:`translateY(${q.y-sz*.2+sz*1.5}px)`,offset:.75},{transform:`translateY(${-sz}px)`}],{duration:1150});
    const beam=el('wxFx','',`left:${q.x+sz*.1}px;top:${sz*.0}px;width:${sz*.8}px;height:${q.y+sz}px;background:linear-gradient(180deg,rgba(143,246,208,0),rgba(143,246,208,.55));clip-path:polygon(35% 0,65% 0,100% 100%,0 100%)`);
    A(beam,[{opacity:0},{opacity:0,offset:.3},{opacity:1,offset:.4},{opacity:1,offset:.75},{opacity:0}],{duration:1150});pieces(420,520)}
  else if(k==='rainbow'){SFX.chime();const r=el('wxFx','',`left:-10%;right:-10%;top:15%;height:${W*.9}px;border-radius:50% 50% 0 0;background:radial-gradient(circle at 50% 100%,transparent 52%,rgba(255,59,48,.55) 53%,rgba(255,149,0,.55) 57%,rgba(255,204,0,.55) 61%,rgba(52,199,89,.55) 65%,rgba(48,176,255,.55) 69%,rgba(88,86,214,.55) 73%,transparent 74%)`);
    A(r,[{opacity:0,transform:'translateY(10%)'},{opacity:1,transform:'translateY(0)',offset:.4},{opacity:0}],{duration:1100});pieces(350,500)}
  else if(k==='watcher'){SFX.flick();const d=el('wxFx','',`inset:0;background:#000`);A(d,[{opacity:0},{opacity:.96,offset:.2},{opacity:.96,offset:.75},{opacity:0}],{duration:1150});
    const eyes=emo('👁️👁️',sz*.8,mid-sz*.9,mid-sz*.5);A(eyes,[{opacity:0},{opacity:0,offset:.25},{opacity:1,offset:.4},{opacity:1,offset:.65},{opacity:0,offset:.75}],{duration:1150});
    setTimeout(()=>{for(const c of res.ch){if(c.t!=='move')continue;const m=clone(c.from);if(!m)continue;const a=pos(c.from),b=pos(c.to);m.style.transform=`translate(${b.x-a.x}px,${b.y-a.y}px)`}},500*MT);
    setTimeout(()=>SFX.flick(),850*MT)}
  else if(k==='meteor'){const blk=(res.block||['d4','e4','d5','e5']).map(pos);const cx=blk.reduce((a,b)=>a+b.x,0)/4+sz/2,cy=blk.reduce((a,b)=>a+b.y,0)/4+sz/2;
    noise(.6,{type:'bandpass',f:300,f2:1500,g:.4,att:.4});const m=emo('☄️',sz*1.4,-sz*2,-sz*2);A(m,[{transform:'translate(0,0) rotate(0)'},{transform:`translate(${cx+sz*1.3}px,${cy+sz*1.3}px) rotate(20deg)`}],{duration:420,easing:'ease-in'});
    setTimeout(()=>{SFX.boom();m.style.display='none'},420*MT);flash('#ffb347',.9,450,420);shake(sz*.5,500,420);
    const ring=el('wxFx','',`left:${cx-sz*2}px;top:${cy-sz*2}px;width:${sz*4}px;height:${sz*4}px;border-radius:50%;border:${sz*.15}px solid rgba(255,220,140,.9)`);A(ring,[{transform:'scale(.1)',opacity:1},{transform:'scale(1.4)',opacity:0}],{duration:600,delay:420,easing:'ease-out'});
    pieces(440,600)}
  else pieces(200,600);
  await Promise.all(done);await sleep(30);lay.remove();
}


/* ================= ANIME FX (checks, checkmate "Chess Expansion", weather intros) =================
   All drawn with DOM + Web Animations on top of the normal 2D board, so it runs on phones too. */
function fxLayer(scale=1){
  const B=$('#board'),br=B.getBoundingClientRect(),sz=br.width/8,W=br.width;
  const lay=document.createElement('div');lay.className='wxMini';B.appendChild(lay);
  const done=[];
  const A=(e,kf,o={})=>{const a=e.animate(kf,{fill:'both',easing:'ease-in-out',...o,duration:(o.duration||0)*scale,delay:(o.delay||0)*scale});done.push(a.finished.catch(()=>{}));return a};
  const el=(cls,html,css)=>{const d=document.createElement('div');d.className=cls;if(html!=null)d.innerHTML=html;if(css)d.style.cssText=css;lay.appendChild(d);return d};
  const sqEl=sq=>{for(let i=0;i<64;i++)if(board.idxToSq(i)===sq)return board.sqs[i];return null};
  const pos=sq=>{const r=sqEl(sq).getBoundingClientRect();return{x:r.left-br.left,y:r.top-br.top}};
  const center=sq=>{const p=pos(sq);return{x:p.x+sz/2,y:p.y+sz/2}};
  return{B,br,lay,A,el,sz,W,done,sqEl,pos,center,scale,finish:async()=>{await Promise.all(done);await sleep(30);lay.remove()}};
}
function fxVignette(K,dur,op=.8,delay=0,col='0,0,0'){const v=K.el('wxFx','',`inset:0;background:radial-gradient(circle,transparent 35%,rgba(${col},${op}) 100%)`);K.A(v,[{opacity:0},{opacity:1,offset:.12},{opacity:1,offset:.88},{opacity:0}],{duration:dur,delay});return v}
function fxDim(K,dur,op=.55,delay=0){const v=K.el('wxFx','',`inset:0;background:#000`);K.A(v,[{opacity:0},{opacity:op,offset:.1},{opacity:op,offset:.9},{opacity:0}],{duration:dur,delay});return v}
function fxBanner(K,{icon='',img='',title,sub='',col='#ff4d6d',dur=1000,delay=0,top=36}){
  const b=K.el('wxBan',`${img?`<img src="${img}" class="bimg">`:icon?`<span class="bi">${icon}</span>`:''}<div class="bt">${esc(title)}${sub?`<small>${esc(sub)}</small>`:''}</div>`,`top:${top}%;--bc:${col}`);
  K.A(b,[{transform:'translateX(-130%) skewY(-7deg)',opacity:0},{transform:'translateX(0) skewY(-7deg)',opacity:1,offset:.22},{transform:'translateX(4%) skewY(-7deg)',opacity:1,offset:.78},{transform:'translateX(130%) skewY(-7deg)',opacity:0}],{duration:dur,delay,easing:'cubic-bezier(.2,.8,.2,1)'});
  return b}
function fxSpeedLines(K,cx,cy,col,dur,delay=0){
  let ln='';for(let i=0;i<34;i++){const a=i/34*Math.PI*2+Math.random()*.1,r0=K.W*(.32+Math.random()*.12),r1=K.W*1.1;
    ln+=`<line x1="${cx+Math.cos(a)*r0}" y1="${cy+Math.sin(a)*r0}" x2="${cx+Math.cos(a)*r1}" y2="${cy+Math.sin(a)*r1}" stroke="${i%3?'#fff':col}" stroke-width="${1+Math.random()*3}" opacity="${.35+Math.random()*.5}"/>`}
  const v=K.el('wxFx',`<svg width="${K.W}" height="${K.W}">${ln}</svg>`,'left:0;top:0');
  K.A(v,[{opacity:0,transform:'scale(1.15)'},{opacity:1,transform:'scale(1)',offset:.2},{opacity:1,offset:.7},{opacity:0,transform:'scale(.95)'}],{duration:dur,delay});return v}
function fxBeam(K,a,b,col,w,dur,delay=0){
  const len=Math.hypot(b.x-a.x,b.y-a.y),ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
  const v=K.el('wxFx','',`left:${a.x}px;top:${a.y-w/2}px;width:${len}px;height:${w}px;border-radius:${w}px;transform-origin:0 50%;transform:rotate(${ang}deg) scaleX(0);background:linear-gradient(90deg,${col}00,${col} 30%,#fff 60%,${col});box-shadow:0 0 ${w*1.5}px ${col},0 0 ${w*3}px ${col}`);
  K.A(v,[{transform:`rotate(${ang}deg) scaleX(0)`,opacity:1},{transform:`rotate(${ang}deg) scaleX(1)`,opacity:1,offset:.35},{transform:`rotate(${ang}deg) scaleX(1)`,opacity:1,offset:.75},{transform:`rotate(${ang}deg) scaleX(1)`,opacity:0}],{duration:dur,delay,easing:'ease-out'});return v}
function fxRing(K,c,col,size,dur,delay=0,bw=.12){const r=K.el('wxFx','',`left:${c.x-size/2}px;top:${c.y-size/2}px;width:${size}px;height:${size}px;border-radius:50%;border:${K.sz*bw}px solid ${col};box-shadow:0 0 ${K.sz*.4}px ${col}`);K.A(r,[{transform:'scale(.05)',opacity:1},{transform:'scale(1)',opacity:0}],{duration:dur,delay,easing:'ease-out'});return r}
function fxFlash(K,col,op,dur,delay=0){const f=K.el('wxFx','',`inset:0;background:${col}`);K.A(f,[{opacity:0},{opacity:op,offset:.12},{opacity:0}],{duration:dur,delay});return f}
function fxShake(K,amp,dur,delay=0){return K.A(K.B,[0,1,2,3,4,5,6,7,8,9].map(i=>({transform:i===9?'none':`translate(${(Math.random()-.5)*amp}px,${(Math.random()-.5)*amp}px) rotate(${(Math.random()-.5)*amp*.12}deg)`})),{duration:dur,delay,easing:'linear',fill:'none'})}
function fxStamp(K,text,col,dur,delay=0,size=5.2){const t=K.el('wxStamp',esc(text),`--sc:${col};font-size:calc(var(--bs)/${size})`);K.A(t,[{transform:'translate(-50%,-50%) scale(3) rotate(-8deg)',opacity:0},{transform:'translate(-50%,-50%) scale(1) rotate(-8deg)',opacity:1,offset:.18},{transform:'translate(-50%,-50%) scale(1.06) rotate(-8deg)',opacity:1,offset:.8},{transform:'translate(-50%,-50%) scale(1.3) rotate(-8deg)',opacity:0}],{duration:dur,delay,easing:'cubic-bezier(.2,.9,.3,1.2)'});return t}
function fxPiece(K,src,x,y,size,css=''){const i=document.createElement('img');i.src=src;i.className='wxMp';i.style.cssText=`left:${x-size/2}px;top:${y-size/2}px;width:${size}px;height:${size}px;${css}`;K.lay.appendChild(i);return i}
/* floating particles that set the mood (rain, snow, embers…) */
function fxAmbient(K,kind,dur,delay=0){
  const W=K.W,N=LOW?14:30;
  for(let i=0;i<N;i++){
    let html='',css='',kf;const x=Math.random()*W,y=Math.random()*W,d=dur*(.5+Math.random()*.5),dl=delay+Math.random()*dur*.4;
    if(kind==='rain'){css=`left:${x}px;top:${-W*.2}px;width:2px;height:${K.sz*.6}px;background:linear-gradient(#cfe3ff00,#cfe3ff);border-radius:2px`;kf=[{transform:'translate(0,0) rotate(15deg)',opacity:0},{opacity:.9,offset:.1},{transform:`translate(${-W*.25}px,${W*1.3}px) rotate(15deg)`,opacity:.6}]}
    else if(kind==='snow'){html='❄';css=`left:${x}px;top:${-K.sz}px;font-size:${K.sz*(.18+Math.random()*.25)}px;color:#e3f6ff`;kf=[{transform:'translate(0,0) rotate(0)',opacity:0},{opacity:1,offset:.1},{transform:`translate(${(Math.random()-.5)*K.sz*2}px,${W*1.15}px) rotate(360deg)`,opacity:.7}]}
    else if(kind==='embers'){css=`left:${x}px;top:${W}px;width:${3+Math.random()*4}px;height:${3+Math.random()*4}px;border-radius:50%;background:#ffb347;box-shadow:0 0 8px #ff7043`;kf=[{transform:'translate(0,0)',opacity:0},{opacity:1,offset:.1},{transform:`translate(${(Math.random()-.5)*K.sz*2}px,${-W*1.1}px)`,opacity:0}]}
    else if(kind==='leaves'){html='🍃';css=`left:${-K.sz}px;top:${y}px;font-size:${K.sz*(.25+Math.random()*.2)}px`;kf=[{transform:'translate(0,0) rotate(0)',opacity:0},{opacity:1,offset:.1},{transform:`translate(${W*1.3}px,${(Math.random()-.5)*W*.5}px) rotate(${720+Math.random()*720}deg)`,opacity:.8}]}
    else if(kind==='sparkle'){html='✨';css=`left:${x}px;top:${y}px;font-size:${K.sz*(.2+Math.random()*.2)}px`;kf=[{transform:'scale(0) rotate(0)',opacity:0},{transform:'scale(1.2) rotate(90deg)',opacity:1,offset:.5},{transform:'scale(0) rotate(180deg)',opacity:0}]}
    else if(kind==='stars'){css=`left:${x}px;top:${y}px;width:3px;height:3px;border-radius:50%;background:#b2ff59;box-shadow:0 0 8px #b2ff59`;kf=[{opacity:0},{opacity:1,offset:.5},{opacity:0}]}
    else if(kind==='feathers'){css=`left:${x}px;top:${-K.sz}px;width:${K.sz*.12}px;height:${K.sz*.35}px;border-radius:50%;background:#263238`;kf=[{transform:'translate(0,0) rotate(0)',opacity:0},{opacity:.9,offset:.1},{transform:`translate(${(Math.random()-.5)*K.sz*3}px,${W*1.1}px) rotate(${(Math.random()-.5)*720}deg)`,opacity:.6}]}
    else if(kind==='dust'){css=`left:${x}px;top:${W}px;width:${4+Math.random()*8}px;height:${4+Math.random()*8}px;border-radius:50%;background:#a1887f`;kf=[{transform:'translate(0,0)',opacity:0},{opacity:.8,offset:.15},{transform:`translate(${(Math.random()-.5)*K.sz}px,${-K.sz*(1+Math.random()*2)}px)`,opacity:0}]}
    else if(kind==='mist'){css=`left:${x-K.sz}px;top:${y-K.sz*.5}px;width:${K.sz*3}px;height:${K.sz*1.4}px;border-radius:50%;background:radial-gradient(rgba(230,235,240,.7),rgba(230,235,240,0) 70%)`;kf=[{transform:'translateX(-30%)',opacity:0},{opacity:1,offset:.3},{transform:'translateX(30%)',opacity:0}]}
    else continue;
    const p=K.el('wxFx',html,css);K.A(p,kf,{duration:d,delay:dl,easing:'linear'});
  }
}

/* castling: magic circles under king and rook, both rise and swap with light trails */
async function playCastle(I){
  const K=fxLayer();const{A,el,sz,W}=K;const GOLD='#FFD54F',CY='#80DEEA';
  MUS.arp([523,659,784,1047,784,659],.08,0,'triangle',.06);MUS.choir([261.6,329.6,392],2.2,0,.025);
  fxVignette(K,2200,.6);
  const circ=(c,col,d)=>{const o=el('wxFx',`<svg viewBox="-50 -50 100 100" width="${sz*1.9}" height="${sz*1.9}"><circle r="46" fill="none" stroke="${col}" stroke-width="2.5"/><circle r="36" fill="none" stroke="${col}" stroke-width="1" stroke-dasharray="4 4"/><g transform="rotate(45)"><rect x="-20" y="-20" width="40" height="40" fill="none" stroke="${col}" stroke-width="1.6"/>${[0,1,2,3].map(i=>[0,1,2,3].filter(j=>(i+j)%2===0).map(j=>`<rect x="${-20+i*10}" y="${-20+j*10}" width="10" height="10" fill="${col}" opacity=".45"/>`).join('')).join('')}</g></svg>`,`left:${c.x-sz*.95}px;top:${c.y-sz*.95}px;filter:drop-shadow(0 0 8px ${col})`);
    A(o,[{transform:'scale(0) rotate(0)',opacity:0},{transform:'scale(1) rotate(120deg)',opacity:1,offset:.25},{transform:'scale(1) rotate(300deg)',opacity:1,offset:.8},{transform:'scale(1.4) rotate(360deg)',opacity:0}],{duration:2000,delay:d,easing:'linear'})};
  const k0=K.center(I.kFrom),k1=K.center(I.kTo),r0=K.center(I.rFrom),r1=K.center(I.rTo);
  circ(k0,GOLD,0);circ(r0,CY,120);circ(k1,GOLD,700);circ(r1,CY,800);
  const fly=(src,a,b,col,d)=>{const im=fxPiece(K,src,a.x,a.y,sz,`filter:drop-shadow(0 0 12px ${col})`);
    A(im,[{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${(b.x-a.x)*.5}px,${-sz*1.2}px) scale(1.35)`,opacity:1,offset:.5},{transform:`translate(${b.x-a.x}px,${b.y-a.y}px) scale(1)`,opacity:1,offset:.9},{opacity:0}],{duration:1300,delay:d,easing:'ease-in-out'});
    fxBeam(K,a,b,col,sz*.08,1100,d+200)};
  /* hide the real pieces while their copies fly */
  [I.kTo,I.rTo].forEach(sq=>{const im=K.sqEl(sq).querySelector('img.pc');if(im){im.style.visibility='hidden';setTimeout(()=>im.style.visibility='',2100)}});
  fly(PIC(I.color,'k'),k0,k1,GOLD,400);fly(PIC(I.color,'r'),r0,r1,CY,500);
  setTimeout(()=>MUS.hit(),1600);fxRing(K,k1,GOLD,sz*2.5,700,1600);fxRing(K,r1,CY,sz*2.5,700,1650);
  fxAmbient(K,'sparkle',1800,300);
  await K.finish();
}
/* promotion: a pillar of light and the pawn is reborn as the new piece */
async function playPromo(I){
  const K=fxLayer();const{A,el,sz,W}=K;const c=K.center(I.to);const GOLD='#FFD54F';
  MUS.riser(1.1);MUS.choir([293.7,370,440],2.6,.3,.03);
  fxVignette(K,2400,.7);
  const real=K.sqEl(I.to).querySelector('img.pc');if(real){real.style.visibility='hidden';setTimeout(()=>real.style.visibility='',2300)}
  const pillar=el('wxFx','',`left:${c.x-sz*.6}px;top:0;width:${sz*1.2}px;height:${c.y+sz*.5}px;background:linear-gradient(180deg,${GOLD}00,${GOLD}aa 40%,#fff);filter:blur(2px);mix-blend-mode:screen`);
  A(pillar,[{transform:'scaleX(0)',opacity:0},{transform:'scaleX(1)',opacity:1,offset:.3},{transform:'scaleX(1.3)',opacity:1,offset:.7},{transform:'scaleX(0)',opacity:0}],{duration:2200});
  const pawn=fxPiece(K,PIC(I.color,'p'),c.x,c.y,sz,`filter:drop-shadow(0 0 10px ${GOLD})`);
  A(pawn,[{transform:'translateY(0) scale(1)',opacity:1,filter:'brightness(1)'},{transform:`translateY(${-sz*.8}px) scale(1.2)`,opacity:1,filter:'brightness(3)',offset:.6},{transform:`translateY(${-sz*.8}px) scale(.2)`,opacity:0,filter:'brightness(5)'}],{duration:1100});
  const nw=fxPiece(K,PIC(I.color,I.promo||'q'),c.x,c.y,sz,`filter:drop-shadow(0 0 14px ${GOLD})`);
  A(nw,[{transform:`translateY(${-sz*.8}px) scale(.2)`,opacity:0},{transform:`translateY(${-sz*.8}px) scale(1.5)`,opacity:1,offset:.4},{transform:'translateY(0) scale(1)',opacity:1,offset:.85},{opacity:1}],{duration:1100,delay:1000});
  setTimeout(()=>{MUS.hit();MUS.arp([587,740,880,1175],.08,.05)},1100);
  fxRing(K,c,GOLD,sz*3,800,1100);fxFlash(K,GOLD,.4,500,1100);fxAmbient(K,'sparkle',1600,900);
  await K.finish();
}
async function boardTo3D(kingSq){
  const B=$('#board'),br=B.getBoundingClientRect(),sz=br.width/8;
  const clip=document.createElement('div');clip.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;overflow:hidden;z-index:955;pointer-events:none';document.body.appendChild(clip);
  const stage=document.createElement('div');stage.style.cssText=`position:absolute;left:${br.left}px;top:${br.top}px;width:${br.width}px;height:${br.height}px;perspective:${br.width*1.4}px;pointer-events:none`;clip.appendChild(stage);
  const kc=(()=>{for(let i=0;i<64;i++)if(board.idxToSq(i)===kingSq){const r=board.sqs[i].getBoundingClientRect();return{x:r.left-br.left+sz/2,y:r.top-br.top+sz/2}}return{x:br.width/2,y:br.width/2}})();
  /* copies of every square and piece, so the real board can hide underneath */
  const tiles=[];for(let i=0;i<64;i++){const sqd=board.sqs[i],r=sqd.getBoundingClientRect(),cs=getComputedStyle(sqd);const t=document.createElement('div');
    t.style.cssText=`position:absolute;left:${r.left-br.left}px;top:${r.top-br.top}px;width:${sz}px;height:${sz}px;background:${cs.backgroundColor} ${cs.backgroundImage};background-size:${cs.backgroundSize};background-position:${cs.backgroundPosition};transform-style:preserve-3d;backface-visibility:hidden`;
    const im=sqd.querySelector('img.pc');if(im){const c=im.cloneNode();c.style.cssText='width:100%;height:100%';t.appendChild(c)}stage.appendChild(t);tiles.push({t,x:r.left-br.left+sz/2,y:r.top-br.top+sz/2})}
  B.style.visibility='hidden';
  MUS.riser(1.3);
  const inv=document.createElement('div');inv.style.cssText='position:fixed;inset:0;z-index:956;background:#fff;mix-blend-mode:difference;opacity:0;pointer-events:none';document.body.appendChild(inv);
  inv.animate([{opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.25},{opacity:0,offset:.35},{opacity:0}],{duration:1500});
  /* 1. tilt and rush toward the king */
  stage.animate([{transform:'rotateX(0) scale(1)'},{transform:`rotateX(48deg) scale(1.05)`,offset:.45},{transform:`rotateX(58deg) translateZ(${br.width*.25}px) scale(1.25)`}],{duration:1200,easing:'cubic-bezier(.5,0,.3,1)',fill:'forwards'});
  await sleep(700);
  /* 2. the tiles break away, the king's square last */
  tiles.forEach(({t,x,y})=>{const dx=x-kc.x,dy=y-kc.y,d=Math.hypot(dx,dy)/sz;const ang=Math.atan2(dy,dx);
    t.animate([{transform:'translate3d(0,0,0) rotate3d(1,1,0,0deg)',opacity:1},{transform:`translate3d(${Math.cos(ang)*br.width*(.6+Math.random()*.6)}px,${Math.sin(ang)*br.width*(.6+Math.random()*.6)}px,${200+Math.random()*700}px) rotate3d(${Math.random()},${Math.random()},${Math.random()},${300+Math.random()*500}deg)`,opacity:0}],{duration:900+Math.random()*300,delay:Math.max(0,(8-d))*25,easing:'cubic-bezier(.4,0,.8,.6)',fill:'forwards'})});
  setTimeout(()=>{MUS.hit();noise(.9,{type:'highpass',f:2500,g:.3,att:.005})},250);
  await sleep(900);
  /* 3. white flash — the 3D scene starts inside it */
  const wf=document.createElement('div');wf.style.cssText='position:fixed;inset:0;z-index:970;background:#fff;opacity:0;pointer-events:none';document.body.appendChild(wf);
  await wf.animate([{opacity:0},{opacity:1}],{duration:220,fill:'forwards'}).finished.catch(()=>{});
  /* the flash must not stay on top of the 3D scene (it made the whole screen white) */
  setTimeout(()=>{wf.animate([{opacity:1},{opacity:0}],{duration:500,fill:'forwards'}).finished.catch(()=>{}).then(()=>wf.remove())},400);
  return()=>{clip.remove();inv.remove();B.style.visibility='';wf.remove()};
}
/* how "special" is this checkmate? more unusual mates get the longer, wilder cinematic */
function mateLevel(g,mv,king,checkers){
  let sc=0;const dbl=checkers.length>1,disc=!checkers.some(c=>c.sq===mv.to);
  if(dbl)sc+=2;if(disc)sc+=1;
  const f=king.charCodeAt(0)-97,r=+king[1];let own=0,all=0;
  for(let df=-1;df<=1;df++)for(let dr=-1;dr<=1;dr++){if(!df&&!dr)continue;const ff=f+df,rr=r+dr;if(ff<0||ff>7||rr<1||rr>8)continue;all++;const p=g.get(String.fromCharCode(97+ff)+rr);if(p&&p.color===g.turn())own++}
  if(all&&own===all&&checkers.length===1&&checkers[0].type==='n')sc+=2;   /* smothered mate */
  sc+={p:2,n:1.5,b:1,r:.5,q:0,k:2}[mv.piece]||0;
  const mat=c=>g.board().flat().filter(x=>x&&x.color===c).reduce((a,x)=>a+({p:1,n:3,b:3,r:5,q:9,k:0}[x.type]),0);
  if(mat(mv.color)<mat(g.turn()))sc+=1;
  return sc>=3?3:sc>=1.5?2:1;
}
const CHECKFX={
  p:{n:'Пішаковий удар',c:'#7CFC9A'},n:{n:'Стрибок вершника',c:'#FFB347'},b:{n:'Промінь єпископа',c:'#B388FF'},
  r:{n:'Таран вежі',c:'#4FC3F7'},q:{n:'Гнів королеви',c:'#FF4D6D'},k:{n:'Королівський крок',c:'#FFD54F'}};
/* I = {color, piece, from, to, king, checkers:[{sq,type}], disc, dbl, mate} */
/* 8 kinds of check (6 pieces + discovered + double) × 5 variants = 40 different check animations.
   Each variant combines its own intro, attack and impact; nothing is written on the board. */
const CHK_PAL=['#7CFC9A','#FFB347','#B388FF','#4FC3F7','#FF4D6D','#FFD54F','#FF3B3B','#80DEEA','#F48FB1','#69F0AE','#FF9100','#EA80FC'];
async function playCheck(I){
  const K=fxLayer();const{A,sz,W,el}=K;
  if(I.mate)return playExpansion(K,I);
  const kc=K.center(I.king),main=I.checkers[0]||{sq:I.to,type:I.piece};
  const kind=I.dbl?'dbl':I.disc?'disc':main.type;
  const ti={p:0,n:1,b:2,r:3,q:4,k:5,disc:6,dbl:7}[kind]||0;
  const v=I.variant!=null?I.variant%5:Math.floor(Math.random()*5);
  const base=I.dbl?'#FF3B3B':I.disc?'#B388FF':(CHECKFX[main.type]||CHECKFX.q).c;
  const col=v===0?base:CHK_PAL[(ti*3+v*5)%CHK_PAL.length];
  const intro=v,attack=(v+ti)%5,impact=(v*2+ti)%5;
  const atkSrc=PIC(I.color,main.type),kingSrc=PIC(I.color==='w'?'b':'w','k');
  MUS.riser(.9);[()=>MUS.taiko(3,.16,.1),()=>MUS.arp([330,392,494,587],.1,.1,'square',.03),()=>{tone(80,1,{type:'sawtooth',f2:300,g:.08})},()=>MUS.taiko(5,.1,.05),()=>MUS.arp([880,1175,1568],.12,.2,'sine',.05)][(v+ti)%5]();
  fxDim(K,2400,.5);fxVignette(K,2400,.85);
  /* ---- intro (5 styles) ---- */
  if(intro===0){fxSpeedLines(K,kc.x,kc.y,col,900,80);fxBanner(K,{img:atkSrc,title:'',col,dur:1050});if(I.dbl&&I.checkers[1])fxBanner(K,{img:PIC(I.color,I.checkers[1].type),title:'',col:'#FFD54F',dur:1050,delay:150,top:58})}
  else if(intro===1){ /* versus screen: two panels slide in from the sides */
    const L=el('wxFx',`<img src="${atkSrc}" style="height:80%;filter:drop-shadow(0 0 14px ${col})">`,`left:0;top:20%;width:50%;height:60%;display:flex;align-items:center;justify-content:center;background:linear-gradient(90deg,${col}cc,${col}22);clip-path:polygon(0 0,100% 0,85% 100%,0 100%)`);
    const Rr=el('wxFx',`<img src="${kingSrc}" style="height:70%;filter:drop-shadow(0 0 10px #000)">`,`right:0;top:20%;width:50%;height:60%;display:flex;align-items:center;justify-content:center;background:linear-gradient(270deg,#000c,#0003);clip-path:polygon(15% 0,100% 0,100% 100%,0 100%)`);
    A(L,[{transform:'translateX(-100%)'},{transform:'translateX(0)',offset:.25},{transform:'translateX(0)',offset:.8},{transform:'translateX(-100%)'}],{duration:1050,easing:'cubic-bezier(.2,.8,.2,1)'});
    A(Rr,[{transform:'translateX(100%)'},{transform:'translateX(0)',offset:.25},{transform:'translateX(0)',offset:.8},{transform:'translateX(100%)'}],{duration:1050,easing:'cubic-bezier(.2,.8,.2,1)'});
    fxFlash(K,'#fff',.35,250,260)}
  else if(intro===2){ /* zoom punch toward the king */
    K.A(K.B,[{transform:'scale(1)',transformOrigin:`${kc.x}px ${kc.y}px`},{transform:'scale(1.32)',transformOrigin:`${kc.x}px ${kc.y}px`,offset:.35},{transform:'scale(1.32)',transformOrigin:`${kc.x}px ${kc.y}px`,offset:.7},{transform:'scale(1)',transformOrigin:`${kc.x}px ${kc.y}px`}],{duration:900,fill:'none',easing:'cubic-bezier(.3,1.3,.5,1)'});
    fxSpeedLines(K,kc.x,kc.y,col,800,0)}
  else if(intro===3){ /* negative freeze-frames */
    K.A(K.B,[{filter:'none'},{filter:'invert(1) hue-rotate(180deg)',offset:.1},{filter:'none',offset:.2},{filter:'invert(1) hue-rotate(90deg)',offset:.35},{filter:'none',offset:.45},{filter:'invert(1) contrast(1.5)',offset:.6},{filter:'none'}],{duration:900,fill:'none',easing:'steps(1,end)'});
    tone(1400,.08,{type:'square',g:.05});tone(1400,.08,{type:'square',g:.05,delay:.3})}
  else{ /* a glint on the attacker */
    const ac=K.center(main.sq);const g=el('wxFx',`<svg viewBox="-50 -50 100 100" width="${sz*2.2}" height="${sz*2.2}"><path d="M0 -48 L6 -6 L48 0 L6 6 L0 48 L-6 6 L-48 0 L-6 -6Z" fill="#fff"/></svg>`,`left:${ac.x-sz*1.1}px;top:${ac.y-sz*1.1}px;filter:drop-shadow(0 0 10px ${col})`);
    A(g,[{transform:'scale(0) rotate(0)',opacity:0},{transform:'scale(1) rotate(45deg)',opacity:1,offset:.4},{transform:'scale(0) rotate(90deg)',opacity:0}],{duration:700,delay:200});
    fxRing(K,ac,col,sz*2.5,600,250);tone(2400,.4,{type:'triangle',g:.05,delay:.2,f2:3200})}
  /* ---- attack (5 styles) ---- */
  const T0=950;
  I.checkers.forEach((c,i)=>{const a=K.center(c.sq);const d=T0+i*160;
    if(c.type==='n'){const corner=Math.abs(kc.x-a.x)>Math.abs(kc.y-a.y)?{x:kc.x,y:a.y}:{x:a.x,y:kc.y};
      [a,corner,kc].forEach((p,j)=>{const g=fxPiece(K,PIC(I.color,'n'),p.x,p.y,sz*1.1,`filter:drop-shadow(0 0 10px ${col})`);A(g,[{opacity:0,transform:'scale(.6)'},{opacity:.8-j*.15,transform:'scale(1.15)',offset:.4},{opacity:0,transform:'scale(1.3)'}],{duration:520,delay:d+j*110})})}
    if(attack===0){
      if(c.type==='p'){[45,-45].forEach((ang,j)=>{const s2=el('wxFx','',`left:${kc.x-sz*.8}px;top:${kc.y-sz*.05}px;width:${sz*1.6}px;height:${sz*.1}px;border-radius:${sz}px;background:linear-gradient(90deg,transparent,#fff,${col},transparent);box-shadow:0 0 12px ${col}`);A(s2,[{transform:`rotate(${ang}deg) scaleX(0)`,opacity:1},{transform:`rotate(${ang}deg) scaleX(1.1)`,opacity:1,offset:.3},{transform:`rotate(${ang}deg) scaleX(1.1)`,opacity:0}],{duration:520,delay:d+j*140})})}
      else{fxBeam(K,a,kc,col,sz*(c.type==='q'?.22:.16),700,d);if(c.type==='q'){fxBeam(K,{x:a.x+sz*.2,y:a.y-sz*.2},kc,'#FFD54F',sz*.06,700,d+60)}}}
    else if(attack===1){ /* zigzag lightning */
      const pts=[];const n=8;for(let k=0;k<=n;k++){const q=k/n;const nx=-(kc.y-a.y),ny=kc.x-a.x,L=Math.hypot(nx,ny)||1;const off=k&&k<n?(Math.random()-.5)*sz*.9:0;pts.push(`${a.x+(kc.x-a.x)*q+nx/L*off},${a.y+(kc.y-a.y)*q+ny/L*off}`)}
      const z=el('wxFx',`<svg width="${W}" height="${W}"><polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="${sz*.16}" stroke-linejoin="round" opacity=".7"/><polyline points="${pts.join(' ')}" fill="none" stroke="#fff" stroke-width="${sz*.05}" stroke-linejoin="round"/></svg>`,`left:0;top:0;filter:drop-shadow(0 0 10px ${col})`);
      A(z,[{opacity:0},{opacity:1,offset:.1},{opacity:.2,offset:.2},{opacity:1,offset:.3},{opacity:.3,offset:.45},{opacity:1,offset:.55},{opacity:0}],{duration:700,delay:d,easing:'steps(1,end)'});noise(.6,{type:'highpass',f:2000,g:.25,delay:d/1000})}
    else if(attack===2){ /* spiral orbs */
      for(let k=0;k<6;k++){const o=el('wxFx','',`left:${a.x-sz*.15}px;top:${a.y-sz*.15}px;width:${sz*.3}px;height:${sz*.3}px;border-radius:50%;background:radial-gradient(circle,#fff,${col});box-shadow:0 0 14px ${col}`);
        const kf=[];for(let q=0;q<=10;q++){const f=q/10,sw=Math.sin(f*Math.PI*3+k)*sz*.6*(1-f);kf.push({transform:`translate(${(kc.x-a.x)*f+sw}px,${(kc.y-a.y)*f+Math.cos(f*Math.PI*3+k)*sz*.6*(1-f)}px)`,opacity:q===10?0:1})}
        A(o,kf,{duration:650,delay:d+k*60,easing:'linear'})}}
    else if(attack===3){ /* dash with afterimages */
      for(let k=0;k<5;k++){const g=fxPiece(K,PIC(I.color,c.type),a.x,a.y,sz,`filter:drop-shadow(0 0 10px ${col});opacity:${1-k*.18}`);
        A(g,[{transform:'translate(0,0)',opacity:0},{transform:'translate(0,0)',opacity:1-k*.18,offset:.05},{transform:`translate(${kc.x-a.x}px,${kc.y-a.y}px)`,opacity:1-k*.18,offset:.5},{transform:'translate(0,0)',opacity:0}],{duration:800,delay:d+k*45,easing:'cubic-bezier(.6,0,.4,1)'})}}
    else{ /* converging lances */
      for(let k=0;k<9;k++){const ang=Math.atan2(kc.y-a.y,kc.x-a.x)+(k-4)*.18;const st={x:kc.x-Math.cos(ang)*W*.7,y:kc.y-Math.sin(ang)*W*.7};fxBeam(K,st,kc,k%2?col:'#ffffff',sz*.05,600,d+k*40)}}
  });
  /* ---- impact (5 styles) ---- */
  const hit=T0+(main.type==='n'?420:attack===3?420:320);
  setTimeout(()=>{MUS.hit();tone(110,.5,{type:'sawtooth',f2:55,g:.12});MUS.arp(I.dbl?[523,659,784,1047,1319]:[392,523,659],.07,.15)},hit);
  fxFlash(K,col,.2,380,hit);fxShake(K,sz*.25,420,hit);
  const king=fxPiece(K,kingSrc,kc.x,kc.y,sz,`filter:drop-shadow(0 0 12px ${col})`);A(king,[{transform:'translate(0,0)',opacity:0},{transform:'translate(0,0)',opacity:1,offset:.01},{transform:`translate(${sz*.12}px,0) rotate(8deg)`,offset:.2},{transform:`translate(${-sz*.1}px,0) rotate(-6deg)`,offset:.4},{transform:'translate(0,0)',opacity:1,offset:.6},{opacity:0}],{duration:900,delay:hit});
  if(impact===0){const st=el('wxFx',`<svg viewBox="-50 -50 100 100" width="${sz*2.4}" height="${sz*2.4}"><path d="${(()=>{let d='';for(let i=0;i<16;i++){const r=i%2?18:48,a=i/16*Math.PI*2;d+=(i?'L':'M')+(Math.cos(a)*r).toFixed(1)+' '+(Math.sin(a)*r).toFixed(1)}return d+'Z'})()}" fill="${col}" stroke="#fff" stroke-width="3"/></svg>`,`left:${kc.x-sz*1.2}px;top:${kc.y-sz*1.2}px;mix-blend-mode:screen`);
    A(st,[{transform:'scale(0) rotate(0)',opacity:1},{transform:'scale(1) rotate(20deg)',opacity:.9,offset:.35},{transform:'scale(1.3) rotate(40deg)',opacity:0}],{duration:700,delay:hit,easing:'ease-out'})}
  else if(impact===1){[0,120,240].forEach((dd,i)=>fxRing(K,kc,i===1?'#fff':col,sz*(2.4+i*1.2),650,hit+dd,.1-i*.025))}
  else if(impact===2){ /* cracks spreading */
    let ln='';for(let k=0;k<9;k++){let x=kc.x,y=kc.y,ang=k/9*Math.PI*2+Math.random()*.3;let d=`M${x} ${y}`;for(let j=0;j<5;j++){ang+=(Math.random()-.5)*.8;x+=Math.cos(ang)*sz*.35;y+=Math.sin(ang)*sz*.35;d+=` L${x.toFixed(1)} ${y.toFixed(1)}`}ln+=`<path d="${d}" fill="none" stroke="#fff" stroke-width="2.5"/><path d="${d}" fill="none" stroke="${col}" stroke-width="6" opacity=".5"/>`}
    const cr=el('wxFx',`<svg width="${W}" height="${W}">${ln}</svg>`,`left:0;top:0;filter:drop-shadow(0 0 6px ${col})`);
    A(cr,[{clipPath:`circle(0px at ${kc.x}px ${kc.y}px)`,opacity:1},{clipPath:`circle(${sz*2.2}px at ${kc.x}px ${kc.y}px)`,opacity:1,offset:.3},{clipPath:`circle(${sz*2.2}px at ${kc.x}px ${kc.y}px)`,opacity:0}],{duration:900,delay:hit,easing:'ease-out'});noise(.4,{type:'highpass',f:3000,g:.3,delay:hit/1000})}
  else if(impact===3){ /* petal storm */
    for(let k=0;k<(LOW?10:20);k++){const ang=Math.random()*Math.PI*2,dist=sz*(1+Math.random()*2.2);const pe=el('wxFx','',`left:${kc.x}px;top:${kc.y}px;width:${sz*.22}px;height:${sz*.12}px;border-radius:50%;background:${k%3?col:'#F8BBD0'}`);
      A(pe,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist+sz*.6}px) rotate(${(Math.random()-.5)*900}deg)`,opacity:0}],{duration:900+Math.random()*400,delay:hit,easing:'ease-out'})}}
  else{ /* vortex implosion, then pop */
    const vx=el('wxFx',`<svg viewBox="-50 -50 100 100" width="${sz*3}" height="${sz*3}"><path d="M0 0 ${(()=>{let d='';for(let i=0;i<60;i++){const a=i*.35,r=i*.75;d+=`L${(Math.cos(a)*r).toFixed(1)} ${(Math.sin(a)*r).toFixed(1)} `}return d})()}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round"/></svg>`,`left:${kc.x-sz*1.5}px;top:${kc.y-sz*1.5}px;filter:drop-shadow(0 0 8px ${col})`);
    A(vx,[{transform:'scale(1.3) rotate(0)',opacity:0},{transform:'scale(1) rotate(-180deg)',opacity:1,offset:.3},{transform:'scale(.05) rotate(-540deg)',opacity:1,offset:.75},{transform:'scale(2) rotate(-600deg)',opacity:0}],{duration:900,delay:hit-250,easing:'ease-in'});
    fxRing(K,kc,'#fff',sz*3,500,hit+430,.08)}
  await K.finish();
}
/* checkmate: the board turns into a "domain" — a dark void with spinning rings — and the king is shattered */
async function playExpansion(K,I){
  /* An original two-force duel: the mating side's blue energy against the king's red energy.
     They clash in the middle, sparks fly, the blue wave wins and the king shatters. No words: only light and sound. */
  const{A,el,sz,W}=K;const kc=K.center(I.king),main=I.checkers[0]||{sq:I.to,type:I.piece};
  const BLUE='#4FC3F7',RED='#FF1744',VIO='#B388FF';
  MUS.choir([110,130.8,164.8],5.2,0,.03);MUS.riser(2.2,.2);
  /* 1. the world goes dark around the board */
  const dom=el('wxFx','',`inset:0;background:radial-gradient(circle at 50% 55%,#0b0420 0%,#05010d 60%,#000 100%)`);
  A(dom,[{clipPath:`circle(0px at ${kc.x}px ${kc.y}px)`,opacity:1},{clipPath:`circle(${W*1.6}px at ${kc.x}px ${kc.y}px)`,opacity:1,offset:.12},{clipPath:`circle(${W*1.6}px at ${kc.x}px ${kc.y}px)`,opacity:1,offset:.92},{opacity:0}],{duration:6200,easing:'ease-in'});
  /* starfield + slowly turning rings of chess symbols */
  fxAmbient(K,'stars',5200,200);
  const glyph='♔ ♕ ♖ ♗ ♘ ♙ ♚ ♛ ♜ ♝ ♞ ♟ ';
  const ring=el('wxFx',`<svg viewBox="0 0 200 200" width="${W}" height="${W}"><defs><path id="exR1" d="M100,100 m-86,0 a86,86 0 1,1 172,0 a86,86 0 1,1 -172,0"/></defs><circle cx="100" cy="100" r="96" fill="none" stroke="${VIO}" stroke-width="1.2" opacity=".6"/><circle cx="100" cy="100" r="74" fill="none" stroke="${BLUE}" stroke-width=".7" stroke-dasharray="2 6" opacity=".7"/><text font-size="10" fill="#d1c4ff" letter-spacing="2" opacity=".75"><textPath href="#exR1">${glyph.repeat(4)}</textPath></text></svg>`,'left:0;top:0');
  A(ring,[{transform:'scale(.3) rotate(0)',opacity:0},{transform:'scale(1) rotate(60deg)',opacity:1,offset:.2},{transform:'scale(1.02) rotate(260deg)',opacity:1,offset:.88},{transform:'scale(1.3) rotate(300deg)',opacity:0}],{duration:6000,delay:200,easing:'linear'});
  /* 2. two champions with auras: attacker (left, blue) and king (right, red) */
  const aura=(x,col,delay)=>{const o=el('wxFx','',`left:${x-sz*1.8}px;top:${W*.58-sz*1.8}px;width:${sz*3.6}px;height:${sz*3.6}px;border-radius:50%;background:radial-gradient(circle,${col}cc 0%,${col}55 35%,transparent 70%);mix-blend-mode:screen`);
    A(o,[{transform:'scale(.2)',opacity:0},{transform:'scale(1)',opacity:1,offset:.2},{transform:'scale(1.15)',opacity:.85,offset:.5},{transform:'scale(1)',opacity:1,offset:.8},{transform:'scale(1.4)',opacity:0}],{duration:3600,delay});return o};
  aura(W*.22,BLUE,700);aura(W*.78,RED,900);
  const atk=fxPiece(K,PIC(I.color,main.type),W*.22,W*.58,sz*2.3,`filter:drop-shadow(0 0 16px ${BLUE}) drop-shadow(0 0 4px #fff)`);
  A(atk,[{opacity:0,transform:'translateY(30%) scale(.7)'},{opacity:1,transform:'translateY(0) scale(1)',offset:.2},{transform:'translateY(-4%) scale(1.04)',offset:.6},{opacity:1,transform:'translateY(0) scale(1)',offset:.9},{opacity:0}],{duration:4000,delay:700});
  const kg=fxPiece(K,PIC(I.color==='w'?'b':'w','k'),W*.78,W*.58,sz*2.2,`filter:drop-shadow(0 0 16px ${RED})`);
  A(kg,[{opacity:0,transform:'translateY(30%) scale(.7)'},{opacity:1,transform:'translateY(0) scale(1)',offset:.2},{transform:'translateX(2%) rotate(3deg)',offset:.62},{transform:'translateX(-2%) rotate(-3deg)',offset:.7},{opacity:1,transform:'translateX(0)',offset:.78},{opacity:0,transform:'scale(1.25) rotate(14deg)',filter:'brightness(4)'}],{duration:4000,delay:900});
  MUS.taiko(6,.22,1.0);
  /* 3. clash: blue and red beams meet in the middle and push against each other */
  const mid={x:W*.5,y:W*.58};
  const beamL=fxBeam(K,{x:W*.27,y:W*.58},mid,BLUE,sz*.45,1700,1900);
  const beamR=fxBeam(K,{x:W*.73,y:W*.58},mid,RED,sz*.45,1700,1900);
  const clash=el('wxFx','',`left:${mid.x-sz*1.3}px;top:${mid.y-sz*1.3}px;width:${sz*2.6}px;height:${sz*2.6}px;border-radius:50%;background:radial-gradient(circle,#fff 0%,${VIO} 30%,transparent 70%);mix-blend-mode:screen`);
  A(clash,[{transform:'scale(0)',opacity:0},{transform:'scale(.6)',opacity:1,offset:.15},{transform:'scale(1)',opacity:1,offset:.35},{transform:'scale(.7)',opacity:1,offset:.55},{transform:'scale(1.2)',opacity:1,offset:.8},{transform:'scale(1.6)',opacity:0}],{duration:1900,delay:2200});
  for(let i=0;i<(LOW?10:22);i++){const a=Math.random()*Math.PI*2,d=sz*(1+Math.random()*2.5);const sp=el('wxFx','',`left:${mid.x}px;top:${mid.y}px;width:${3+Math.random()*4}px;height:${3+Math.random()*4}px;border-radius:50%;background:${i%2?BLUE:RED};box-shadow:0 0 8px ${i%2?BLUE:RED}`);
    A(sp,[{transform:'translate(0,0)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px)`,opacity:0}],{duration:600+Math.random()*500,delay:2300+Math.random()*1400,easing:'ease-out'})}
  fxShake(K,sz*.15,1500,2300);
  setTimeout(()=>{noise(1.7,{type:'bandpass',f:400,f2:1600,q:.8,g:.5,att:.2});tone(196,1.6,{type:'sawtooth',g:.05});tone(207.6,1.6,{type:'sawtooth',g:.05})},2300);
  /* 4. the blue wave wins and sweeps over the king */
  const wave=el('wxFx','',`left:${W*.2}px;top:${W*.58-sz*.9}px;width:${W*.7}px;height:${sz*1.8}px;border-radius:${sz}px;background:linear-gradient(90deg,${BLUE}00,${BLUE} 40%,#fff 75%,${VIO});box-shadow:0 0 ${sz}px ${BLUE};transform-origin:0 50%`);
  A(wave,[{transform:'scaleX(0)',opacity:0},{transform:'scaleX(1)',opacity:1,offset:.45},{transform:'scaleX(1.05)',opacity:0}],{duration:900,delay:3900,easing:'cubic-bezier(.2,.9,.2,1)'});
  setTimeout(()=>{MUS.boomFall();MUS.hit(.05);MUS.choir([98,123.5,146.8],2.4,.3,.035)},4300);
  fxFlash(K,'#fff',.9,600,4300);fxShake(K,sz*.55,800,4300);
  fxRing(K,{x:W*.78,y:W*.58},BLUE,W*1.1,1000,4300);fxRing(K,{x:W*.78,y:W*.58},VIO,W*.7,900,4400,.06);fxRing(K,{x:W*.78,y:W*.58},'#fff',W*.4,700,4500,.04);
  /* shards of the shattered king */
  for(let i=0;i<(LOW?8:16);i++){const a=Math.random()*Math.PI*2,d=sz*(1.5+Math.random()*3);const sh=el('wxFx','',`left:${W*.78}px;top:${W*.58}px;width:0;height:0;border-left:${sz*.12}px solid transparent;border-right:${sz*.12}px solid transparent;border-bottom:${sz*.28}px solid ${i%3?'#eee':RED}`);
    A(sh,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) rotate(${(Math.random()-.5)*900}deg)`,opacity:0}],{duration:900+Math.random()*500,delay:4350,easing:'ease-out'})}
  await K.finish();
}

/* ================= GAME RUN ================= */
const CSS=`
#stormCv{position:fixed;inset:0;z-index:900;display:none;touch-action:none}
#stormUi{position:fixed;inset:0;z-index:901;display:none;pointer-events:none}
#stormUi .lb{position:absolute;left:0;right:0;height:0;background:#000;transition:height .7s ease}
#stormUi .lb.t{top:0} #stormUi .lb.b{bottom:0}
#stormUi.on .lb{height:9vh}
#stormUi .cap{position:absolute;left:0;right:0;top:12vh;text-align:center;color:#fff;opacity:0;transform:translateY(-12px);transition:opacity .6s,transform .6s;text-shadow:0 2px 12px #000,0 0 3px #000}
#stormUi.capOn .cap{opacity:1;transform:none}
#stormUi .ci{font-size:54px;line-height:1} #stormUi .cn{font-size:34px;font-weight:900;letter-spacing:.12em;margin-top:6px} #stormUi .cd{font-size:15px;max-width:560px;margin:8px auto 0;opacity:.9;padding:0 16px}
#stormUi.mini .skip,#stormUi.mini .cd{display:none}
#stormUi .skip{position:absolute;right:16px;bottom:calc(9vh + 14px);pointer-events:auto;background:rgba(0,0,0,.55);color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:6px;padding:7px 12px;font-weight:700;cursor:pointer}
#stormUi .bo{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .15s}
.sq .wxFog{position:absolute;inset:-1px;z-index:4;background:rgba(214,219,224,.62);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);pointer-events:none}
.sq.fogd img.pc{filter:brightness(0) opacity(.55)}
.sq .wxIce{position:absolute;inset:5%;z-index:4;border-radius:12%;background:linear-gradient(135deg,rgba(215,245,255,.62),rgba(120,190,235,.32));box-shadow:inset 0 0 0 2px rgba(255,255,255,.75),0 0 10px rgba(160,220,255,.6);pointer-events:none}
.sq .wxUfo{position:absolute;inset:0;z-index:4;pointer-events:none;background:radial-gradient(circle,rgba(143,246,208,.0) 30%,rgba(143,246,208,.35) 70%)}
#board.wxShake{animation:wxSh .12s linear 14}
@keyframes wxSh{0%{transform:translate(0,0)}25%{transform:translate(4px,-3px)}50%{transform:translate(-4px,2px)}75%{transform:translate(3px,3px)}100%{transform:translate(0,0)}}
.wxRadio{background:linear-gradient(160deg,#2b3247,#1d2233);border:1px solid #3d4766}
.wxEv{display:flex;gap:8px;align-items:center;margin:5px 0}
.wxEv .i{font-size:22px;width:30px;text-align:center}
.wxLog{max-height:190px;overflow:auto;font-size:13px;line-height:1.55}
.wxNav{display:flex;align-items:center;gap:6px;margin:2px 0 8px}.wxNav .btn{min-width:38px;padding:4px 8px}.wxNavT{flex:1;text-align:center;font-size:13px;opacity:.8}
.wxPast{background:rgba(255,213,79,.12);border:1px solid rgba(255,213,79,.5);border-radius:6px;padding:6px 8px;margin-bottom:8px;font-size:13px}
.wxLog .e{background:rgba(116,155,191,.16);border-left:3px solid #749BBF;padding:3px 7px;margin:4px 0;border-radius:3px}
.sq .wxCrown{position:absolute;left:20%;top:-12%;width:60%;height:45%;z-index:5;pointer-events:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.45))}
.wxFly{position:fixed;z-index:950;pointer-events:none;filter:drop-shadow(0 0 10px rgba(255,210,80,.9))}
.wxSpark{position:fixed;z-index:951;pointer-events:none;font-size:16px}
.wxMini{position:absolute;inset:0;z-index:30;pointer-events:none;overflow:hidden}
.wxMini .wxMp{position:absolute;pointer-events:none;will-change:transform,opacity}
.wxMini .wxFx{position:absolute;pointer-events:none;will-change:transform,opacity}
@media (pointer:coarse),(max-width:760px){.sq .wxFog{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(214,219,224,.82)!important}.wxMini .wxFx{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}.sq .wxCrown{filter:none}}
.wxMini .wxLab{position:absolute;left:50%;top:6px;background:rgba(0,0,0,.78);color:#fff;font-weight:800;padding:6px 14px;border-radius:14px;font-size:calc(var(--bs)/28);z-index:5;transform:translateX(-50%);text-align:center;width:max-content;max-width:88%}
.wxMini .wxBan{position:absolute;left:-6%;right:-6%;height:22%;display:flex;align-items:center;justify-content:center;gap:4%;background:linear-gradient(90deg,transparent,var(--bc) 12%,rgba(0,0,0,.85) 50%,var(--bc) 88%,transparent);color:#fff;font-weight:900;font-size:calc(var(--bs)/13);letter-spacing:.04em;text-shadow:0 0 14px var(--bc),2px 2px 0 #000;z-index:6;border-top:2px solid #fff;border-bottom:2px solid #fff;box-shadow:0 0 30px var(--bc)}
.wxMini .wxBan .bimg{height:150%;filter:drop-shadow(0 0 12px var(--bc)) drop-shadow(0 0 3px #fff)}
.wxMini .wxBan .bi{font-size:2.2em;filter:drop-shadow(0 0 10px var(--bc))}
.wxMini .wxBan small{display:block;font-size:.4em;letter-spacing:.35em;opacity:.95;color:var(--bc);text-shadow:0 0 8px #000}
.wxMini .wxStamp{position:absolute;left:50%;top:58%;font-weight:900;color:#fff;-webkit-text-stroke:calc(var(--bs)/170) #000;text-shadow:0 0 30px var(--sc),0 0 8px var(--sc);z-index:7;white-space:nowrap;font-style:italic}
.wxMini .wxExp{position:absolute;left:50%;top:22%;transform:translate(-50%,-50%);text-align:center;z-index:7;white-space:nowrap}
.wxMini .wxExp .ex1{font-weight:900;font-size:calc(var(--bs)/14);color:#fff;letter-spacing:.12em;text-shadow:0 0 18px #ff2d55,0 0 4px #ff2d55}
.wxMini .wxExp .ex2{font-weight:900;font-size:calc(var(--bs)/9);color:#FFD54F;letter-spacing:.2em;text-shadow:0 0 22px #ff2d55,2px 2px 0 #000;margin-top:2%}
.wxMini .wxLabD{font-weight:500;font-size:calc(var(--bs)/42);opacity:.9;margin-top:3px;line-height:1.3}
.wxOmen{background:rgba(247,198,49,.12);border:1px dashed var(--gold);border-radius:6px;padding:8px 10px;font-size:14px;margin-bottom:8px}
`;
let cssDone=false;function css(){if(cssDone)return;cssDone=true;const s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s)}

const FREQ={rare:['Рідко',[16,22]],normal:['Нормально',[10,16]],often:['Часто',[6,10]],chaos:['Хаос',[3,5]],every30:['Кожні 30 ходів',[60,60]]};
const MINI=7;            /* weather cutscenes play this many times faster (about a second) */
let GAL_FULL=false;      /* gallery switch: watch the slow full version */

/* ================= ONLINE (PeerJS, browser-to-browser) =================
   The host decides all randomness (weather) and sends it to the guest, so both see the same thing. */
const PFX='chstorm-';
const NET={peer:null,conn:null,handler:null,onClose:null,isHost:false};
let PEER_P=null;
function loadPeer(){return PEER_P||(PEER_P=new Promise((res,rej)=>{if(window.Peer)return res();const s=document.createElement('script');s.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';s.crossOrigin='anonymous';s.onload=()=>res();s.onerror=()=>{PEER_P=null;rej(new Error('peerjs'))};document.head.appendChild(s)}))}
function netClose(){const c=NET.conn,p=NET.peer,rl=NET.relays||[];NET.conn=NET.peer=null;NET.relays=[];NET.handler=null;NET.onClose=null;try{c&&c.close()}catch(e){}try{p&&p.destroy()}catch(e){}rl.forEach(r=>{try{r.close()}catch(e){}})}
/* ---- relay channel: when a direct browser-to-browser link can't be made (mobile networks, strict routers),
   the game messages go through a public MQTT broker over WebSocket. Topics carry only the random invite code. ---- */
const BROKERS=['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt'];
let MQTT_P=null;
function loadMqtt(){return MQTT_P||(MQTT_P=new Promise((res,rej)=>{if(window.mqtt)return res();const s=document.createElement('script');s.src='https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js';s.crossOrigin='anonymous';s.onload=()=>res();s.onerror=()=>{MQTT_P=null;rej(new Error('mqtt'))};document.head.appendChild(s)}))}
/* one relay endpoint. role 'h' (host) waits for a hello, role 'g' (guest) says hello until the host answers */
function relay(url,code,role,onOpen){
  const H={},Qd=[],R={open:false,kind:'relay',url,on(ev,f){H[ev]=f;if(ev==='data'){Qd.splice(0).forEach(d=>f(d))}},send(d){if(!R.cli)return;R.seq=(R.seq||0)+1;try{R.cli.publish(`chstorm/${code}/${role==='h'?'g':'h'}`,JSON.stringify({s:R.seq,d}),{qos:1})}catch(e){}},
    close(){if(R.closed)return;R.closed=true;try{if(R.open)R.cli.publish(`chstorm/${code}/${role==='h'?'g':'h'}`,JSON.stringify({bye:1}),{qos:0})}catch(e){}clearInterval(R.hi);setTimeout(()=>{try{R.cli&&R.cli.end(true)}catch(e){}},200)}};
  let last=0;
  try{R.cli=window.mqtt.connect(url,{clientId:'chs_'+role+'_'+Math.random().toString(36).slice(2,10),keepalive:25,reconnectPeriod:2500,connectTimeout:8000,clean:true})}catch(e){return R}
  const mine=`chstorm/${code}/${role}`,theirs=`chstorm/${code}/${role==='h'?'g':'h'}`;
  R.cli.on('connect',()=>{if(R.closed)return;R.cli.subscribe(mine,{qos:1});if(role==='g'&&!R.open){const hi=()=>{try{R.cli.publish(theirs,JSON.stringify({hello:1}),{qos:0})}catch(e){}};hi();clearInterval(R.hi);R.hi=setInterval(()=>{if(R.open||R.closed)return clearInterval(R.hi);hi()},1200)}});
  R.cli.on('message',(t,buf)=>{if(R.closed)return;let m;try{m=JSON.parse(buf.toString())}catch(e){return}
    if(m.hello&&role==='h'){if(R.open){try{R.cli.publish(theirs,JSON.stringify({ack:1}),{qos:1})}catch(e){}return}if(NET.conn&&NET.conn.open&&NET.conn!==R)return;try{R.cli.publish(theirs,JSON.stringify({ack:1}),{qos:1})}catch(e){}R.open=true;if(onOpen(R)===false)R.open=false;return}
    if(m.ack&&role==='g'){if(!R.open){R.open=true;clearInterval(R.hi);onOpen(R)}return}
    if(m.bye){if(R.open){R.open=false;H.close&&H.close()}return}
    if(m.s!=null){if(m.s<=last)return;last=m.s;if(H.data)H.data(m.d);else Qd.push(m.d)}});
  R.cli.on('error',()=>{});
  return R}
function netSend(d){try{if(NET.conn&&NET.conn.open)NET.conn.send(d)}catch(e){}}
function bindConn(c){NET.conn=c;c.on('data',d=>{if(!d||typeof d!=='object')return;if(d.t==='start'&&!NET.isHost){guestStart(d);return}NET.handler&&NET.handler(d)});c.on('close',()=>{if(NET.conn===c){NET.onClose&&NET.onClose()}});c.on('error',()=>{})}
const netErr=e=>{const t=e&&e.type;return t==='peer-unavailable'?'Запрошення не знайдено. Можливо, друг закрив сторінку або посилання старе.':t==='network'||t==='server-error'||t==='socket-error'||t==='socket-closed'?'Немає зв’язку з сервером з’єднання. Перевір інтернет і спробуй ще раз.':t==='browser-incompatible'?'Цей браузер не підтримує гру по мережі.':'Не вдалося з’єднатися ('+(t||e&&e.message||'помилка')+').'};
async function netHost(onReady,onConn,onErr){
  await loadPeer();netClose();NET.isHost=true;
  const code=Array.from({length:6},()=>'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random()*31)]).join('');
  const peer=new window.Peer(PFX+code);NET.peer=peer;
  let first=true;peer.on('open',()=>{NET.hostSt&&NET.hostSt(true);if(first){first=false;onReady(code)}});
  const vis=()=>{if(document.hidden||NET.peer!==peer||peer.destroyed){if(NET.peer!==peer)document.removeEventListener('visibilitychange',vis);return}if(peer.disconnected){NET.hostSt&&NET.hostSt(false);try{peer.reconnect()}catch(e){}}};
  document.addEventListener('visibilitychange',vis);
  /* phones drop the signalling connection when the screen sleeps: reconnect with the same code */
  peer.on('disconnected',()=>{NET.hostSt&&NET.hostSt(false);if(NET.peer===peer&&!peer.destroyed)setTimeout(()=>{try{if(NET.peer===peer&&!peer.destroyed)peer.reconnect()}catch(e){}},1000)});
  peer.on('connection',c=>{if(NET.conn&&NET.conn.open){c.on('open',()=>c.close());return}c.on('open',()=>{if(NET.conn&&NET.conn.open){c.close();return}bindConn(c);onConn()})});
  /* relay endpoints for guests whose network blocks the direct link */
  loadMqtt().then(()=>{if(NET.peer!==peer)return;NET.relays=BROKERS.map(u=>relay(u,code,'h',r=>{if(NET.conn&&NET.conn.open&&NET.conn!==r)return false;bindConn(r);onConn();return true}))}).catch(()=>{});
  peer.on('error',e=>{if(NET.peer!==peer)return;if(e.type==='unavailable-id'){netHost(onReady,onConn,onErr);return}if(e.type==='peer-unavailable')return;onErr(e)});
}
async function netJoin(code,onOk,onErr){
  await loadPeer();netClose();NET.isHost=false;
  const peer=new window.Peer();NET.peer=peer;
  let tmo=null,done=false,errs=0;
  const win=c=>{if(done||NET.peer!==peer){try{c.close()}catch(e){}return}done=true;clearTimeout(tmo);(NET.relays||[]).forEach(r=>{if(r!==c)try{r.close()}catch(e){}});bindConn(c);onOk()};
  const fail=e=>{if(done||NET.peer!==peer)return;done=true;clearTimeout(tmo);onErr(e)};
  tmo=setTimeout(()=>fail({type:'peer-unavailable'}),20000);
  peer.on('open',()=>{if(localStorage.wxForceRelay)return;/* (debug: test the relay alone) */const c=peer.connect(PFX+code,{reliable:true});c.on('open',()=>win(c))});
  peer.on('error',e=>{if(NET.peer!==peer)return;if(e&&e.type==='peer-unavailable'){errs++;return}/* the relay may still work */});
  setTimeout(()=>{if(done||NET.peer!==peer)return;loadMqtt().then(()=>{if(done||NET.peer!==peer)return;NET.relays=BROKERS.map(u=>relay(u,code,'g',r=>win(r)))}).catch(()=>{})},2500);
}
function guestStart(d){
  if(CUR&&CUR.stop)CUR.stop(true);CUR=null;closeModal();showMain();setNav('storm');
  CUR=StormRun({mode:'net',host:false,color:d.color,freq:d.freq,forecast:d.forecast,nextAt:d.nextAt,showQ:d.showQ!==false});
}

function StormRun(opt){
  css();loadThree().catch(()=>{});
  S.storm=S.storm||{games:0,seen:{}};
  const me={alive:true,stop};
  const NETM=opt.mode==='net',HOST=NETM&&opt.host;
  const human=opt.mode==='bot'||NETM?(opt.color==='r'?(Math.random()<.5?'w':'b'):opt.color):null;
  let waitHost=false,q=Promise.resolve();
  const L=LEVELS[opt.level]||LEVELS[1];
  let g=opt.fen?new Chess(opt.fen):new Chess(),busy=false,over=false,ply=0;
  const gapR=FREQ[opt.freq][1];const gap=()=>gapR[0]+Math.floor(Math.random()*(gapR[1]-gapR[0]+1));
  let nextAt=opt.nextAt||Math.max(6,gap()),upcoming=null;
  const st={fog:0,fogR:null,frozen:{},ufo:null,secret:null,crowns:{...(opt.crowns||{})}};
  let VW=null,liveLast=null;   /* VW = index in the history while looking at the past (null = the live game) */
  const showQ=opt.showQ!==false&&!opt.gallery;
  const H=[];            /* every move (fen before/after) and every weather event, for the review */
  let RV=null;           /* review state while the post-game review is open */
  $('#evalbar').style.visibility=showQ?'':'hidden';
  const log=[];const forecast=(opt.forecast||makeForecast(NETM)).filter(k=>EVENTS[k]&&!(NETM&&EVENTS[k].live));
  board.clear();board.flip=human==='b';board.set(g);board.showDots=true;
  /* board hooks: frozen pieces cannot move, fog / ice / ufo marks drawn after every render */
  board.targets=function(from){if(st.frozen[from])return[];return Board.prototype.targets.call(this,from)};
  board.render=function(a){Board.prototype.render.call(this,a);decorate()};
  function decorate(){
    if(RV||VW!=null)return;
    for(let i=0;i<64;i++){const sq=board.idxToSq(i),d=board.sqs[i];
      if(st.fog>0&&st.fogR&&+sq[1]>=st.fogR[0]&&+sq[1]<=st.fogR[1]){d.classList.add('fogd');d.insertAdjacentHTML('beforeend','<span class="wxFog"></span>')}
      if(st.frozen[sq])d.insertAdjacentHTML('beforeend','<span class="wxIce"></span>');
      if(st.crowns[sq]&&!(st.crownHide===sq)&&!(board.drag&&board.drag.moved&&board.drag.from===sq))d.insertAdjacentHTML('beforeend',crownHTML())}
  }
  const names=()=>{
    if(opt.mode==='friend'){const top=board.flip?'w':'b',bot=board.flip?'b':'w';players(plHtml(top==='w'?'Білі':'Чорні','друг',top),plHtml(bot==='w'?'Білі':'Чорні','друг',bot))}
    else if(NETM)players(plHtml('Друг','🌐 по мережі',other(human)),plHtml('Ти','',human));
    else players(plHtml('Бот: '+L.n,'~'+L.elo,other(human)),plHtml('Ти','',human));
  };
  names();
  board.canMove=()=>VW==null&&!busy&&!over&&me.alive&&!waitHost&&(opt.mode==='friend'||g.turn()===human);
  board.onMove=(m,noAnim)=>{if(!board.canMove())return;const mv=g.move(m);if(!mv)return;
    if(NETM){netSend({t:'mv',u:mUci(mv)});if(!HOST)waitHost=true}
    afterMove(mv,noAnim)};
  /* online: messages are processed strictly one after another */
  if(NETM){
    NET.handler=d=>{q=q.then(()=>onNet(d)).catch(e=>console.warn('net',e))};
    NET.onClose=()=>{if(!me.alive)return;if(!over){over=true;busy=false;render({h:'🔌 Друг відключився. Партію зупинено.',k:'bad'})}else foot()};
  }
  async function onNet(d){
    if(!me.alive)return;
    if(d.t==='mv'){if(over)return;const mv=g.move(uciObj(d.u));if(!mv){if(!HOST)netSend({t:'sync?'});return}if(!HOST)waitHost=true;await afterMove(mv)}
    else if(d.t==='ev'&&!HOST){await showEvent(d.k,d.res,d.fogR)}
    else if(d.t==='ready'&&!HOST){if(d.fen&&d.fen!==g.fen()){g=new Chess(d.fen);board.set(g)}nextAt=d.nextAt;upcoming=d.upcoming||null;waitHost=false;busy=false;if(!over){if(!checkOver())render()}}
    else if(d.t==='sync?'&&HOST){sendReady()}
    else if(d.t==='resign'){finish(human,'Друг здався. Ти переміг!')}
    else if(d.t==='bye'){if(!over){over=true;busy=false;render({h:'Друг вийшов з партії.',k:'bad'})}}
  }
  function sendReady(){if(HOST)netSend({t:'ready',ply,fen:g.fen(),nextAt,upcoming})}

  /* ---- looking back through the game: every move and every weather event is a step ---- */
  function timeline(){
    const tl=[];const first=H.find(x=>x.mv);tl.push({fen:first?first.fenB:(H[0]&&H[0].fen)||g.fen(),last:null,label:'Початок партії',h:-1});
    H.forEach((x,i)=>{if(x.mv){const n=+x.fenB.split(' ')[5];tl.push({fen:x.fenA,last:[x.mv.from,x.mv.to],label:`${x.mv.color==='w'?n+'.':n+'…'} ${x.mv.san}`,h:i})}
      else if(x.fen)tl.push({fen:x.fen,last:null,label:`${x.i} ${x.note}`,h:i,ev:true})});
    return tl}
  function viewAt(i){
    if(RV)return;const tl=timeline();if(i==null||i>=tl.length-1){exitView();return}i=Math.max(0,i);
    if(VW==null)liveLast=board.last;VW=i;const e=tl[i];
    board.g=new Chess(e.fen);board.sel=null;board.last=e.last;board.arrows=[];board.badge=null;board.skipAnim=true;Board.prototype.render.call(board);
    render();
  }
  function exitView(){if(VW==null)return;VW=null;board.g=g;board.sel=null;board.last=liveLast;board.skipAnim=true;board.render();if(!RV)render()}
  function histStep(d){const tl=timeline();const cur=VW==null?tl.length-1:VW;viewAt(cur+d)}
  const histKey=e=>{if(RV||!me.alive)return;const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;
    if(e.key==='ArrowLeft'){histStep(-1);e.preventDefault()}else if(e.key==='ArrowRight'){histStep(1);e.preventDefault()}else if(e.key==='Escape'&&VW!=null)exitView()};
  document.addEventListener('keydown',histKey);
  function render(msg){
    if(RV)return;
    const turnTxt=over?'':opt.mode==='friend'?`Хід ${g.turn()==='w'?'білих':'чорних'}`:g.turn()===human?(waitHost?'Синхронізація…':'Твій хід'):NETM?'Хід друга…':'Бот думає…';
    const eff=[];if(st.fog>0)eff.push(`🌫 туман: ще ${st.fog} півх.`);const fz=Object.keys(st.frozen);if(fz.length)eff.push(`❄ замерзли: ${fz.join(', ')}`);if(st.ufo)eff.push(`🛸 НЛО повернеться через ${Math.max(1,Math.ceil((st.ufo.at-ply)/2))} хід`);
    const left=Math.max(0,nextAt-ply);
    $('#pb').innerHTML=`${msg?`<div id="coachBox"></div>`:''}
      ${upcoming&&!over?`<div class="wxOmen">${EVENTS[upcoming].omen}<div class="small mut" style="margin-top:3px">Щось насувається…</div></div>`:''}
      <div class="card wxRadio"><h4>📻 Прогноз погоди на цю партію</h4>${forecast.map(k=>`<div class="wxEv"><span class="i">${EVENTS[k].i}</span><div style="flex:1"><b>${EVENTS[k].n}</b> <span class="tag" style="background:${RAR[EVENTS[k].rar].col};color:#111">${RAR[EVENTS[k].rar].n}</span><div class="small mut">${EVENTS[k].d}</div></div></div>`).join('')}
        <div class="small" style="margin-top:6px;opacity:.8">${over?'':left<=1?'⚠ Погода зміниться після наступного ходу!':`Наступна зміна погоди приблизно через ${Math.ceil(left/2)} ${plural(Math.ceil(left/2),'хід','ходи','ходів')}.`}</div></div>
      ${eff.length?`<div class="card small">${eff.join('<br>')}</div>`:''}
      ${st.secret&&st.secret.show?`<div class="card small">👁 <b>Що змінилося:</b> ${PNAME[st.secret.p.type]} ${st.secret.from} → ${st.secret.to}</div>`:''}
      <div class="card"><h4>${turnTxt||'Партія'}</h4>${(()=>{const tl=timeline();if(tl.length<2)return'';const cur=VW==null?tl.length-1:VW;const e=tl[cur];
          return`<div class="wxNav"><button class="btn g sm" data-nv="0" title="На початок">⏮</button><button class="btn g sm" data-nv="-1" title="Назад (←)">◀</button><span class="wxNavT">${VW==null?'Зараз':`${cur} / ${tl.length-1}`}</span><button class="btn g sm" data-nv="1" title="Вперед (→)">▶</button><button class="btn sm" data-nv="end" title="До гри">⏭</button></div>
          ${VW!=null?`<div class="wxPast">${e.ev?'Подія':'Хід'}: <b>${esc(e.label)}</b><div class="small mut">Ти дивишся минуле. Натисни ⏭, щоб повернутися до гри.</div></div>`:''}`})()}
        <div class="wxLog" id="wxLog">${log.map(x=>{const on=VW!=null&&x.h!=null&&timeline()[VW]&&timeline()[VW].h===x.h;const a=x.h!=null?` data-h="${x.h}" style="cursor:pointer${on?';outline:2px solid #ffd54f;border-radius:3px':''}"`:'';return x.e?`<div class="e"${a}>${x.e}</div>`:`<span${a}>${x.s} </span>`}).join('')||'<span class="dim">Ходів ще немає</span>'}</div></div>`;
    if(msg)coachSay(msg.h,msg.k||'');
    const lg=$('#wxLog');if(lg){const on=VW!=null&&lg.querySelector('[style*="outline"]');if(on)on.scrollIntoView({block:'nearest'});else lg.scrollTop=lg.scrollHeight}
    document.querySelectorAll('[data-nv]').forEach(b=>b.onclick=()=>{const v=b.dataset.nv;if(v==='end')exitView();else if(v==='0')viewAt(0);else histStep(+v)});
    document.querySelectorAll('#wxLog [data-h]').forEach(el=>el.onclick=()=>{const h=+el.dataset.h;const tl=timeline();const i=tl.findIndex(e=>e.h===h);if(i>=0)viewAt(i)});
    foot();
  }
  function foot(){
    if(RV)return;
    if(over&&NETM){
      const alive=!!(NET.conn&&NET.conn.open);
      $('#pf').innerHTML=`<button class="btn" id="wxRev">📈 Розбір</button>`+(HOST&&alive?`<button class="btn" id="wxAgain">↻ Реванш (кольори міняються)</button>`:alive?`<div class="small mut" style="flex:1;align-self:center">Чекаємо, поки друг почне реванш…</div>`:'')+`<button class="btn g" id="wxMenu">Вийти</button>`;$('#pf').style.display='flex';
      if($('#wxAgain'))$('#wxAgain').onclick=()=>{const fc=makeForecast(true),na=Math.max(6,gap());netSend({t:'start',color:human,freq:opt.freq,forecast:fc,nextAt:na,showQ:opt.showQ});stop(true);CUR=StormRun({...opt,color:other(human),forecast:fc,nextAt:na})};
      $('#wxMenu').onclick=()=>showView('storm');$('#wxRev').onclick=openReview;return}
    if(over&&!opt.gallery){$('#pf').innerHTML=`<button class="btn" id="wxRev">📈 Розбір партії</button><button class="btn g" id="wxAgain">↻ Ще раз</button><button class="btn g" id="wxMenu">Налаштування</button>`;$('#pf').style.display='flex';$('#wxAgain').onclick=()=>{stopCur();CUR=StormRun(opt)};$('#wxMenu').onclick=()=>showView('storm');$('#wxRev').onclick=openReview;return}
    if(opt.gallery){$('#pf').innerHTML=`<button class="btn" id="wxGal">🎬 Обрати анімацію</button><button class="btn g sm" id="wxGalX">Вийти</button>`;$('#pf').style.display='flex';$('#wxGal').onclick=()=>galleryPick();$('#wxGalX').onclick=()=>showView('storm');return}
    $('#pf').innerHTML=`${st.secret&&!st.secret.show?'<button class="btn g sm" id="wxReveal">👁 Показати, що змінилося</button>':''}${opt.mode==='friend'?'<button class="btn g sm" id="wxFlip">⇅ Перевернути</button>':''}<button class="btn g sm" id="wxResign">🏳 ${opt.mode==='friend'?'Закінчити':'Здатися'}</button>`;
    $('#pf').style.display='flex';
    if($('#wxReveal'))$('#wxReveal').onclick=()=>{st.secret.show=true;board.arrows=[{from:st.secret.from,to:st.secret.to,c:'b'}];board.render();render()};
    if($('#wxFlip'))$('#wxFlip').onclick=()=>{board.flip=!board.flip;board.render();names()};
    $('#wxResign').onclick=()=>{if(busy)return;if(NETM)netSend({t:'resign'});finish(opt.mode==='friend'?null:other(human),opt.mode==='friend'?'Партію закінчено.':'Ти здався.')};
  }
  function checkOver(){
    if(g.in_checkmate()){const w=other(g.turn());finish(w,`Мат! ${w==='w'?'Білі':'Чорні'} перемогли.`);return true}
    if(g.in_stalemate()){finish(null,'Пат. Нічия.');return true}
    if(g.insufficient_material()){finish(null,'Недостатньо матеріалу. Нічия.');return true}
    if(g.in_threefold_repetition()||g.in_draw()){finish(null,'Нічия.');return true}
    return false;
  }
  function finish(winner,txt){
    if(over)return;over=true;busy=false;
    S.storm.games++;save();
    const ev=log.filter(x=>x.e).length;
    let h=`<b>${txt}</b><div class="small mut" style="margin-top:4px">Подій погоди за партію: ${ev}. Натисни «📈 Розбір», щоб побачити, як ти зіграв.</div>`;
    if(opt.mode==='bot'||NETM){if(winner===human){h='🏆 '+h;confetti&&confetti();addXP&&addXP(30,'Перемога в бурі')}else if(winner)h='😵 '+h}
    snd&&snd(winner?'win':'move');
    render({h,k:winner===human||!winner?'good':'bad'});
  }
  async function afterMove(mv,noAnim){
    if(VW!=null)exitView();busy=true;
    {const fenA=g.fen();g.undo();const fenB=g.fen();g.move({from:mv.from,to:mv.to,promotion:mv.promotion});const h={fenB,fenA,mv};H.push(h);if(showQ)liveRate(h)}
    {const n=+g.fen().split(' ')[5];log.push({s:(mv.color==='w'?n+'.':(n-1)+'…')+' '+mv.san,h:H.length-1})}
    if(st.frozen[mv.to])delete st.frozen[mv.to];
    /* crowns follow their piece; a captured crown goes to the capturer */
    const capSq=mv.flags.includes('e')?mv.to[0]+mv.from[1]:mv.captured?mv.to:null;
    const stolen=capSq&&st.crowns[capSq]&&mv.captured!=='q';
    if(capSq){if(mv.captured==='q'&&st.crowns[capSq])st.crownQ=true;delete st.crowns[capSq]}
    if(st.crowns[mv.from]){delete st.crowns[mv.from];st.crowns[mv.to]=1}
    if(mv.flags.includes('k')||mv.flags.includes('q')){const r=mv.from[1],a=mv.flags.includes('k')?['h'+r,'f'+r]:['a'+r,'d'+r];if(st.crowns[a[0]]){delete st.crowns[a[0]];st.crowns[a[1]]=1}}
    ply++;
    for(const k of Object.keys(st.frozen)){st.frozen[k]--;if(st.frozen[k]<=0)delete st.frozen[k]}
    if(st.fog>0)st.fog--;
    if(st.secret&&ply>=st.secret.until)st.secret=null;
    /* (the queen-capture cutscenes were removed on request; only the crown stays) */
    if(mv.captured==='q'){const hadCrown=!!st.crownQ;st.crownQ=false;if(mv.piece==='p'||hadCrown)st.crowns[mv.to]=1}
    board.last=[mv.from,mv.to];board.arrows=[];board.badge=null;
    if(stolen){st.crownHide=mv.to;board.render(noAnim?undefined:[mv.from,mv.to]);moveSound(mv,g);await crownSteal(capSq,mv.to);st.crownHide=null;st.crowns[mv.to]=1;board.render()}
    else{board.render(noAnim?undefined:[mv.from,mv.to]);moveSound(mv,g)}
    if(st.live)st.live.moveFns.forEach(f=>{try{f(mv)}catch(e){console.warn(e)}});
    await specialFx(mv);
    if(checkOver()){sendReady();return}
    render();
    await weather();
    if(!me.alive||over){sendReady();return}
    unstick();
    busy=false;render();sendReady();
    if(opt.mode==='bot'&&g.turn()!==human)botMove();
    else if(opt.mode==='friend'&&opt.autoFlip){board.flip=g.turn()==='b';board.render();names()}
  }
  /* a side whose only legal moves belong to frozen pieces gets them unfrozen */
  function unstick(){const ms=g.moves({verbose:true});if(ms.length&&ms.every(m=>st.frozen[m.from])){st.frozen={};board.render()}}

  async function weather(){
    if(NETM&&!HOST)return; /* the host decides the weather */
    /* UFO brings its passenger back */
    if(st.ufo&&ply>=st.ufo.at){const p=st.ufo.p;st.ufo=null;await runEvent('ufoBack',{ufoP:p});if(over||!me.alive)return}
    if(ply===nextAt-1&&!upcoming){upcoming=wpick(forecast);if(Math.random()<.04)upcoming='meteor';snd&&snd('click');render()}
    if(opt.gallery)return;
    if(st.live){if(ply>=nextAt)nextAt=ply+2;return}
    if(ply>=nextAt){const k=upcoming||wpick(forecast);upcoming=null;nextAt=ply+gap();await runEvent(k,{})}
  }
  async function runEvent(k,extra){
    if(!me.alive)return;busy=true;const ev=EVENTS[k];
    if(ev.live){if(NETM||st.live)return;return startLive(k)}
    const fen=g.fen();const map0=mapOf(g);const turn=g.turn();
    let fogZ=null,fogR=null;
    if(k==='fog')fogR=opt.mode==='bot'?(human==='w'?[5,8]:[1,4]):[3,6];
    const X={turn,fen,human:NETM?null:human,ufoP:extra.ufoP};
    let res=ev.apply(map0,X);
    if(!res)res={fen,ch:[],miss:true,note:`${ev.n} пройшов${k==='crow'||k==='rainbow'?'ла':''} повз: на дошці нічого не змінилося.`};
    if(NETM)netSend({t:'ev',k,res,fogR});
    await showEvent(k,res,fogR);
  }
  async function showEvent(k,res,fogR){
    if(!me.alive)return;if(VW!=null)exitView();busy=true;const ev=EVENTS[k];
    const fen=g.fen();const map0=mapOf(g);const turn=g.turn();
    const fogZ=fogR?[W3flipZ(fogR[0]),W3flipZ(fogR[1])]:null;
    const X={turn,fen,human};
    if(k==='ufoBack')st.ufo=null;
    {const r0=$('#board').getBoundingClientRect();if(r0.top<0||r0.bottom>innerHeight){$('#board').scrollIntoView({block:'center'});await sleep(250)}}
    const rect=$('#board').getBoundingClientRect();
    const ctx={...X,res,map0,flip:board.flip,last:board.last,rect,fogZ,crowns:Object.keys(st.crowns),speed:opt.gallery&&GAL_FULL?1:MINI,hide2D:h=>{$('#board').style.visibility=h?'hidden':''}};
    board.sel=null;board.render();
    let applied=false;
    const apply=()=>{if(applied||!me.alive)return;applied=true;
      if(res.fen!==g.fen()){g=new Chess(res.fen);board.set(g)}
      board.last=null;board.arrows=[];board.badge=null;
      if(res.fog){st.fog=res.fog;st.fogR=fogR}
      if(res.freeze)res.freeze.forEach(s=>st.frozen[s]=4);
      if(res.ufo)st.ufo={p:res.ufo.p,at:ply+4};
      if(res.secret){st.secret={...res.secret,show:false,until:ply+6};}
      for(const c of res.ch)if(c.t==='move'&&st.frozen[c.from]){st.frozen[c.to]=st.frozen[c.from];delete st.frozen[c.from]}
      for(const c of res.ch)if(c.t==='kill')delete st.frozen[c.sq];
      {const nc={};for(const k of Object.keys(st.crowns)){const mvd=res.ch.find(c=>c.t==='move'&&c.from===k);const kil=res.ch.find(c=>c.t==='kill'&&c.sq===k);if(kil)continue;nc[mvd?mvd.to:k]=1}st.crowns=nc}
      board.skipAnim=true;board.render()};
    if(!(opt.gallery&&GAL_FULL)){board.sel=null;if(window.STORM_FX){try{await window.STORM_FX.play(k,{res,board,H:{noise,tone,SFX},speed:1},apply)}catch(e){console.warn('fx',e)}}else await playMini(k,ctx)}
    else try{await play3D(k,ctx)}catch(e){console.warn('storm 3D failed',e);$('#board').style.visibility='';try{W3.on=false;W3.cv&&(W3.cv.style.display='none');W3.ui&&(W3.ui.style.display='none')}catch(_){}await play2D(k,ctx)}
    if(!me.alive){$('#board').style.visibility='';return}
    apply();
    board.render();
    if(k!=='ufoBack'){S.storm.seen[k]=(S.storm.seen[k]||0)+1;save()}
    log.push({e:`${ev.i} ${esc(res.note)}`,h:H.length});H.push({ev:k,i:ev.i,note:res.note,fen:g.fen()});
    render({h:`${ev.i} <b>${ev.n}</b><br>${esc(res.note)}`,k:res.miss?'':'warn'});
    if(checkOver())return;
    if(g.in_check())snd&&snd('check');
  }
  /* epic moments on the normal board: castling, promotion, check, checkmate (no text, only light and sound) */
  async function specialFx(mv){
    if(!me.alive)return;
    try{
      if(mv.flags.includes('k')||mv.flags.includes('q')){const r=mv.from[1];const ks=mv.flags.includes('k');await playCastle({color:mv.color,kFrom:mv.from,kTo:mv.to,rFrom:(ks?'h':'a')+r,rTo:(ks?'f':'d')+r})}
      if(mv.flags.includes('p'))await playPromo({color:mv.color,to:mv.to,promo:mv.promotion});
      /* only checkmate gets an animation; an ordinary check plays nothing */
      if(g.in_checkmate()){const king=board.kingSq(g.turn());const checkers=attackersOf(g,king,mv.color);
        const info={color:mv.color,piece:mv.promotion||mv.piece,from:mv.from,to:mv.to,king,checkers,disc:!checkers.some(c=>c.sq===mv.to),dbl:checkers.length>1,mate:g.in_checkmate(),variant:window.CHK_VARIANT};window.CHK_VARIANT=null;
        /* a rare, beautiful mate earns one of the five 2-minute legendary films */
        const lg=info.mate&&window.legendFor?window.legendFor({g,mv,king,checkers}):null;
        if(lg&&window.playLegend){let ok=false;
          try{await window.playLegend({id:lg,color:mv.color,piece:info.piece,kingColor:g.turn(),fen:g.fen(),kingSq:king,checkers:checkers.map(c=>c.type)});ok=true}catch(e){console.warn('legend failed',e)}
          if(ok){S.storm.legends=S.storm.legends||{};const first=!S.storm.legends[lg];S.storm.legends[lg]=(S.storm.legends[lg]||0)+1;save();const L=(window.LEGENDS||[]).find(x=>x.id===lg);if(first&&L)toast(`🏆 Новий легендарний мат: ${L.n}!`,4500);return}}
        if(info.mate&&window.playCinema){
          /* checkmate: the board breaks into a 3D cinematic; harder mates get the longer version */
          const level=mateLevel(g,mv,king,checkers);let back=null;
          try{back=await boardTo3D(king);await window.playCinema({color:mv.color,piece:info.piece,kingColor:g.turn(),level})}
          catch(e){console.warn('cinema failed',e);back&&back();back=null;await playCheck(info)}
          back&&back();
        }else await playCheck(info)}  /* (only reached for a mate when 3D is unavailable) */
    }catch(e){console.warn('fx',e);$('#board').querySelectorAll('.wxMini').forEach(x=>x.remove())}
  }
  /* replays the capture as a 3D cutscene: the 2D board still shows the position before the move */
  async function queenCapture(mv,hadCrown){
    if(!me.alive)return;busy=true;
    const u=g.undo();if(!u)return;const map0=mapOf(g);const last0=board.last;g.move({from:u.from,to:u.to,promotion:u.promotion});
    board.sel=null;
    {const r0=$('#board').getBoundingClientRect();if(r0.top<0||r0.bottom>innerHeight){$('#board').scrollIntoView({block:'center'});await sleep(250)}}
    const ctx={turn:g.turn(),fen:g.fen(),res:{fen:g.fen(),ch:[]},map0,flip:board.flip,last:last0,rect:$('#board').getBoundingClientRect(),
      qc:{from:mv.from,to:mv.to,p:mv.piece},cap:qcapCaption(mv.piece),crowns:[...Object.keys(st.crowns).map(k=>k===mv.to?mv.from:k),...(hadCrown?[mv.to]:[])],
      before2D:()=>{if(mv.piece==='p'||hadCrown)st.crowns[mv.to]=1;board.last=[mv.from,mv.to];board.arrows=[];board.skipAnim=true;board.render()},hide2D:h=>{$('#board').style.visibility=h?'hidden':''}};
    try{await play3D('qcap',ctx)}catch(e){console.warn('capture 3D failed',e);$('#board').style.visibility='';try{W3.on=false;W3.cv&&(W3.cv.style.display='none');W3.ui&&(W3.ui.style.display='none')}catch(_){}await play2D('qcap',ctx)}
    $('#board').style.visibility='';
    if(me.alive){S.storm.qcap=S.storm.qcap||{};S.storm.qcap[mv.piece]=(S.storm.qcap[mv.piece]||0)+1;save();log.push({e:`${QCAP[mv.piece].i} ${QCAP[mv.piece].n}`})}
  }
  me._mv=(from,to)=>{if(busy||over)return'busy';const mv=g.move({from,to,promotion:'q'});if(!mv)return'illegal';afterMove(mv);return'ok'};
  async function crownSteal(fromSq,toSq){
    const sqEl=sq=>{for(let i=0;i<64;i++)if(board.idxToSq(i)===sq)return board.sqs[i];return null};
    const a=sqEl(fromSq).getBoundingClientRect(),b=sqEl(toSq).getBoundingClientRect();
    const w=a.width*.6,h=a.width*.45;
    let im;if(CR.ready){im=document.createElement('canvas');im.width=120;im.height=90;im.className='wxFly wxCrownC'}else{im=document.createElement('img');im.src=CROWN_SVG;im.className='wxFly'}
    im.style.width=w+'px';im.style.height=h+'px';
    const x0=a.left+a.width*.2,y0=a.top-a.width*.12,x1=b.left+b.width*.2,y1=b.top-b.width*.12;
    im.style.left=x0+'px';im.style.top=y0+'px';document.body.appendChild(im);
    tone(880,.15,{type:'triangle',g:.08});tone(1320,.25,{type:'triangle',g:.06,delay:.12});
    const up=Math.max(a.width*1.3,60);
    const an=im.animate([
      {transform:'translate(0,0) rotate(0) scale(1)'},
      {transform:`translate(${(x1-x0)*.35}px,${-up+(y1-y0)*.35}px) rotate(200deg) scale(1.7)`,offset:.45},
      {transform:`translate(${(x1-x0)*.8}px,${-up*.55+(y1-y0)*.8}px) rotate(330deg) scale(1.35)`,offset:.75},
      {transform:`translate(${x1-x0}px,${y1-y0}px) rotate(360deg) scale(1)`}
    ],{duration:1150,easing:'cubic-bezier(.3,.6,.4,1)'});
    /* sparkles */
    for(let i=0;i<(LOW?7:14);i++){const sp=document.createElement('span');sp.className='wxSpark';sp.textContent=['✨','⭐','💛'][i%3];sp.style.left=(x0+w/2)+'px';sp.style.top=(y0+h/2)+'px';document.body.appendChild(sp);
      const ang=Math.random()*Math.PI*2,d=40+Math.random()*70;sp.animate([{transform:'translate(0,0) scale(.4)',opacity:1},{transform:`translate(${Math.cos(ang)*d}px,${Math.sin(ang)*d-30}px) scale(1.1)`,opacity:0}],{duration:900+Math.random()*400,easing:'ease-out',delay:i*25}).onfinish=()=>sp.remove()}
    await new Promise(r=>{an.onfinish=r;setTimeout(r,1400)});
    [523,659,784].forEach((f,i)=>tone(f,.4,{type:'triangle',g:.07,delay:i*.07}));
    im.remove();
  }
  /* ---- engine helpers shared by the live badges and the review ---- */
  const EVC={};
  function evalFen(fen){
    if(EVC[fen])return EVC[fen];
    const t=new Chess(fen);
    if(t.in_checkmate())return EVC[fen]=Promise.resolve({cp:-10000,best:null,second:null});
    if(t.game_over())return EVC[fen]=Promise.resolve({cp:0,best:null,second:null});
    return EVC[fen]=coachE.analyse(fen,{depth:12,time:350,multipv:2}).then(a=>({cp:a.cp,best:a.best,second:a.lines[1]?a.lines[1].cp:null})).catch(()=>{delete EVC[fen];return null});
  }
  async function rateMove(h){
    if(h.R!==undefined)return h.R;
    const[b,a]=await Promise.all([evalFen(h.fenB),evalFen(h.fenA)]);
    if(!b||!a)return h.R=null;
    const cb=b.cp;let ca=mUci(h.mv)===b.best?cb:-a.cp;
    const drop=cb-ca;const caN=drop>45?ca+45:cb;
    let c;try{c=classifyMove(h.fenB,h.mv,cb,mUci(h.mv)===b.best?cb:caN,b.best,b.second)}catch(e){c=null}
    return h.R={cb,s:ca,e:h.mv.color==='w'?ca:-ca,b:b.best,sc:b.second,c};
  }
  async function liveRate(h){
    const R=await rateMove(h);if(!R||!R.c||!me.alive||RV)return;
    if(board.g.fen()===h.fenA&&board.last&&board.last[0]===h.mv.from&&board.last[1]===h.mv.to){board.badge={sq:h.mv.to,cls:R.c};board.skipAnim=true;board.render()}
  }

  /* ---- post-game review: how well each side played, move by move ---- */
  async function openReview(){
    if(RV)return;RV={idx:-1,tok:0};const myRV=RV;
    const moves=H.filter(x=>x.mv);
    const back=()=>{RV=null;document.removeEventListener('keydown',RVkey);board.badge=null;board.arrows=[];g&&board.set(g);render()};
    const RVkey=e=>{if(!RV||!RV.ready)return;if(e.key==='ArrowLeft'){step(-1);e.preventDefault()}if(e.key==='ArrowRight'){step(1);e.preventDefault()}};
    myRV.back=back;
    $('#pf').innerHTML=`<button class="btn g" id="rvBack">← Назад</button>`;$('#pf').style.display='flex';$('#rvBack').onclick=back;
    for(let i=0;i<moves.length;i++){
      if(RV!==myRV||!me.alive)return;
      $('#pb').innerHTML=`<div class="card"><h4>📈 Розбір партії</h4><div class="small mut">Тренер аналізує хід ${i+1} з ${moves.length}…</div><div class="tbar" style="margin-top:8px"><i style="width:${Math.round(i/moves.length*100)}%;background:var(--green)"></i></div></div>`;
      await rateMove(moves[i]);
    }
    if(RV!==myRV||!me.alive)return;
    const mvs=moves.map(m=>m.mv),rev=moves.map(m=>m.R);
    let CC=[];try{CC=ccClassify(mvs,rev)}catch(e){CC=rev.map(()=>'')}
    RV.CL=moves.map((m,i)=>{const R=rev[i];if(!R)return null;const c=CC[i];if(c)return c;if(['mistake','blunder','miss'].includes(R.c))return'inaccuracy';return R.c==='book'?'best':R.c});
    RV.moves=moves;RV.ready=true;
    const acc=col=>{const a=[];moves.forEach(m=>{if(m.mv.color!==col||!m.R)return;const x=50+50*wc(m.R.cb),y=50+50*wc(m.R.s);a.push(Math.max(0,Math.min(100,103.1668*Math.exp(-0.04354*Math.max(0,x-y))-3.1669)))});return a.length?Math.round(a.reduce((p,q)=>p+q,0)/a.length):null};
    RV.acc={w:acc('w'),b:acc('b')};
    document.addEventListener('keydown',RVkey);
    S.storm.lastAcc=human?RV.acc[human]:null;save();
    showRV();
  }
  function step(d){if(!RV||!RV.ready)return;RV.idx=Math.max(-1,Math.min(RV.moves.length-1,RV.idx+d));showRV()}
  function showRV(){
    const moves=RV.moves,CL=RV.CL,i=RV.idx;
    const keys=['brilliant','great','best','excellent','good','book','inaccuracy','mistake','miss','blunder'];
    const cnt=(col,k)=>CL.filter((c,j)=>c===k&&moves[j].mv.color===col).length;
    const nameOf=col=>opt.mode==='friend'?(col==='w'?'Білі':'Чорні'):col===human?'Ти':(NETM?'Друг':'Бот');
    /* board */
    if(i<0){board.set(new Chess(moves[0]?moves[0].fenB:undefined));board.last=null;board.badge=null;board.arrows=[];board.render()}
    else{const m=moves[i],c=CL[i];const t=new Chess(m.fenA);board.g=t;board.sel=null;board.last=[m.mv.from,m.mv.to];board.badge=c&&CLS[c]?{sq:m.mv.to,cls:c}:null;board.arrows=[];
      if(m.R&&m.R.b&&m.R.b!==mUci(m.mv)&&['inaccuracy','mistake','blunder','miss','good'].includes(c))board.arrows.push({from:m.R.b.slice(0,2),to:m.R.b.slice(2,4),c:'g'});
      board.skipAnim=true;board.render()}
    /* move list with weather events between the moves */
    let html='',k=0;
    for(const x of H){
      if(x.ev){html+=`<div class="e">${x.i} ${esc(x.note)}</div>`;continue}
      const j=k++;const c=CL[j];const B=c&&CLS[c];const n=+x.fenB.split(' ')[5];
      html+=`<span class="rvm ${j===i?'on':''}" data-j="${j}" style="cursor:pointer;padding:1px 4px;border-radius:4px;white-space:nowrap;${j===i?'background:#4b4847':''}">${x.mv.color==='w'?n+'.':''}${B?`<b style="color:${B.c}">${B.s}</b> `:''}${esc(x.mv.san)}</span> `;
    }
    const m=i>=0?moves[i]:null,c=m?CL[i]:null;
    let note='Натисни на хід або гортай стрілками ← →.';
    if(m&&c&&CLS[c]){const bestSan=m.R&&m.R.b&&m.R.b!==mUci(m.mv)?sanOf(m.fenB,m.R.b):null;
      note=`<b style="color:${CLS[c].c}">${CLS[c].s} ${esc(m.mv.san)}: ${CLS[c].n}</b>${bestSan&&['inaccuracy','mistake','blunder','miss','good'].includes(c)?`<br>Найкраще було <b>${esc(bestSan)}</b> (зелена стрілка).`:''}`}
    $('#pb').innerHTML=`<div class="card"><h4>📈 Розбір партії</h4>
      <div class="row" style="gap:10px">${['w','b'].map(col=>`<div style="flex:1;text-align:center;background:var(--panel2);border-radius:8px;padding:8px"><div class="small mut">${nameOf(col)} (${col==='w'?'білі':'чорні'})</div><div class="big">${RV.acc[col]==null?'—':RV.acc[col]+'%'}</div><div class="small dim">точність</div></div>`).join('')}</div>
      <div style="margin-top:8px">${keys.filter(k=>cnt('w',k)||cnt('b',k)).map(k=>`<div class="small row" style="justify-content:space-between;margin:2px 0"><span style="width:28px;text-align:center">${cnt('w',k)}</span><span><b style="color:${CLS[k].c}">${CLS[k].s}</b> ${CLS[k].n}</span><span style="width:28px;text-align:center">${cnt('b',k)}</span></div>`).join('')}</div></div>
      <div class="card small">${note}</div>
      <div class="card"><div class="wxLog" style="max-height:220px">${html}</div></div>`;
    document.querySelectorAll('.rvm').forEach(e=>e.onclick=()=>{RV.idx=+e.dataset.j;showRV()});
    const on=document.querySelector('.rvm.on');if(on)on.scrollIntoView({block:'nearest'});
    $('#pf').innerHTML=`<button class="btn g sm" id="rvBack">← Назад</button><button class="btn g sm" id="rvS">⏮</button><button class="btn g sm" id="rvP">◀</button><button class="btn sm" id="rvN">▶</button><button class="btn g sm" id="rvE">⏭</button>`;$('#pf').style.display='flex';
    $('#rvBack').onclick=RV.back;$('#rvS').onclick=()=>{RV.idx=-1;showRV()};$('#rvP').onclick=()=>step(-1);$('#rvN').onclick=()=>step(1);$('#rvE').onclick=()=>{RV.idx=RV.moves.length-1;showRV()};
  }

  function W3flipZ(rank){/* rank 1..8 → world z of that rank's centre (for fog planes) */const r=rank-1;return board.flip?r-3.5:3.5-r}

  /* ---- live events: they start, then run on their own for ~10 s while the game goes on ---- */
  async function startLive(k){
    if(VW!=null)exitView();const ev=EVENTS[k];busy=true;
    {const r0=$('#board').getBoundingClientRect();if(r0.top<0||r0.bottom>innerHeight){$('#board').scrollIntoView({block:'center'});await sleep(250)}}
    S.storm.seen[k]=(S.storm.seen[k]||0)+1;save();
    log.push({e:`${ev.i} ${esc(ev.n)}`,h:H.length});H.push({ev:k,i:ev.i,note:ev.n,fen:g.fen()});
    render({h:`${ev.i} <b>${ev.n}</b><br>${esc(ev.d)}`,k:'warn'});
    const A=liveApi(k);st.live=A;
    ev.run(A).catch(e=>console.warn('live',e)).finally(()=>{A.cleanup();if(st.live===A)st.live=null;if(me.alive&&!over){board.render();if(!busy)render()}});
    await sleep(1500);   /* let the intro play before the turn continues */
  }
  function liveApi(k){
    const ev=EVENTS[k];const B=$('#board');
    const lay=document.createElement('div');lay.className='wxMini';lay.style.zIndex='31';B.appendChild(lay);
    const page=document.createElement('div');page.style.cssText='position:fixed;inset:0;z-index:940;pointer-events:none;overflow:hidden';document.body.appendChild(page);
    const sqEl=sq=>{for(let i=0;i<64;i++)if(board.idxToSq(i)===sq)return board.sqs[i];return null};
    const A={k,lay,page,human,mode:opt.mode,moveFns:[],_clean:[],ended:false,
      alive:()=>me.alive&&!over&&!RV&&!A.ended,
      g:()=>g,map:()=>mapOf(g),busy:()=>busy,
      rect:()=>B.getBoundingClientRect(),sz:()=>B.getBoundingClientRect().width/8,
      center(sq){const br=B.getBoundingClientRect(),r=sqEl(sq).getBoundingClientRect();return{x:r.left-br.left+r.width/2,y:r.top-br.top+r.height/2}},
      pageCenter(sq){const r=sqEl(sq).getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}},
      onMove(f){A.moveFns.push(f)},onClean(f){A._clean.push(f)},
      threat(list){st.threat=list&&list.length?list:null},
      stopProp(el){['pointerdown','mousedown','touchstart','click'].forEach(t=>el.addEventListener(t,e=>e.stopPropagation()))},
      say(h){if(me.alive&&!over&&!RV)render({h:`${ev.i} <b>${ev.n}</b><br>${h}`,k:'warn'})},
      log(note){if(!note)return;if(VW!=null)exitView();log.push({e:`${ev.i} ${esc(note)}`,h:H.length});H.push({ev:k,i:ev.i,note,fen:g.fen()})},
      banner(title,sub){if(!A.alive())return Promise.resolve();const K=fxLayer();fxBanner(K,{icon:ev.i,title,sub,col:'#ff4d6d',dur:1300});return K.finish()},
      flash(sq,col){const e=sqEl(sq);if(!e)return;const d=document.createElement('div');d.style.cssText=`position:absolute;inset:0;background:${col};pointer-events:none;z-index:5`;e.appendChild(d);d.animate([{opacity:.85},{opacity:0}],{duration:700,fill:'forwards'});setTimeout(()=>d.remove(),720)},
      shake(px){B.animate([{transform:'translate(0,0)'},{transform:`translate(${px}px,${-px/2}px)`},{transform:`translate(${-px}px,${px/2}px)`},{transform:'translate(0,0)'}],{duration:180})},
      set(m,ch,note){
        if(!A.alive())return false;const fen=valid(m,g.turn(),g.fen());if(!fen)return false;if(VW!=null)exitView();
        g=new Chess(fen);
        for(const c of ch){if(c.t==='kill'){delete st.frozen[c.sq];delete st.crowns[c.sq]}
          if(c.t==='move'){if(st.frozen[c.from]){st.frozen[c.to]=st.frozen[c.from];delete st.frozen[c.from]}if(st.crowns[c.from]){st.crowns[c.to]=1;delete st.crowns[c.from]}}}
        board.last=null;board.arrows=[];board.badge=null;board.skipAnim=true;board.set(g);
        A.log(note);
        if(checkOver()){A.ended=true;return true}
        unstick();if(g.in_check())snd&&snd('check');
        if(opt.mode==='bot'&&g.turn()!==human&&!busy)botMove();
        return true},
      kill(sq,note){const m=mapOf(g);const p=m[sq];if(!p||p.type==='k')return false;delete m[sq];return A.set(m,[{t:'kill',sq}],note)},
      move(from,to,note){const m=mapOf(g);const p=m[from];if(!p||m[to]||p.type==='k')return false;if(p.type==='p'&&(to[1]==='1'||to[1]==='8'))return false;delete m[from];m[to]=p;return A.set(m,[{t:'move',from,to}],note)},
      add(sq,p,note){const m=mapOf(g);if(m[sq])return false;m[sq]=p;return A.set(m,[{t:'add',sq}],note)},
      randomMove(){if(over||!me.alive||busy)return;const ms=g.moves({verbose:true}).filter(m=>!st.frozen[m.from]);if(!ms.length)return;const mv=g.move(rnd(ms));if(mv)afterMove(mv)},
      cleanup(){if(A.done)return;A.done=true;A.ended=true;st.threat=null;lay.remove();page.remove();A._clean.forEach(f=>{try{f()}catch(e){}})}};
    return A;
  }
  async function botMove(){
    if(over||!me.alive)return;busy=true;render();
    const t0=Date.now();let uci=null;
    const ms=g.moves({verbose:true}).filter(m=>!st.frozen[m.from]);
    if(!ms.length){busy=false;return}
    const sm=Object.keys(st.frozen).length?ms.map(mUci).join(' '):null;
    const fenThink=g.fen();
    const dodge=st.threat&&st.threat.length?ms.filter(m=>st.threat.includes(m.from)):[];
    if(dodge.length&&Math.random()<.65)uci=mUci(rnd(dodge));
    else if(Math.random()<L.rnd){const caps=ms.filter(m=>m.captured);uci=mUci(Math.random()<.5&&caps.length?rnd(caps):rnd(ms))}
    else{try{const a=await (opt.level>=5?botStrongE:botE).analyse(g.fen(),{depth:L.depth,time:L.time,skill:L.skill,searchmoves:sm});uci=a.best}catch(e){}}
    if(!uci||!ms.some(m=>mUci(m)===uci||mUci(m)===uci.slice(0,4)))uci=mUci(rnd(ms));
    const wt=550+Math.random()*450-(Date.now()-t0);if(wt>0)await sleep(wt);
    if(!me.alive||over)return;
    /* a live event may have changed the board while the bot was thinking */
    if(g.fen()!==fenThink||g.turn()===human){busy=false;if(g.turn()!==human&&!over)setTimeout(botMove,60);return}
    const mv=g.move(uciObj(uci));if(!mv){busy=false;if(g.turn()!==human&&!over)setTimeout(botMove,60);return}
    afterMove(mv);
  }
  me._ev=(k,p)=>{if(busy||over||(NETM&&!HOST))return'busy';runEvent(k,{ufoP:p||{type:'n',color:'w'}}).then(()=>{busy=false;render();sendReady();if(opt.mode==='bot'&&g.turn()!==human&&!over)botMove()});return'ok'};
  function stop(keepNet){me.alive=false;document.removeEventListener('keydown',histKey);if(st.live){try{st.live.cleanup()}catch(e){}st.live=null}$('#evalbar').style.visibility='';if(RV&&RV.back){const b=RV.back;RV=null;try{b()}catch(e){}}delete board.targets;delete board.render;$('#board').style.visibility='';board.arrows=[];
    if(W3.on){W3.speed=20}
    if(NETM&&!keepNet){netSend({t:'bye'});netClose()}}

  me.busy=()=>busy||(W3.on===true);
  if(opt.gallery){render({h:'🎬 <b>Галерея анімацій.</b> Обери будь-яку анімацію: погоду або взяття ферзя. Між анімаціями можна ходити фігурами.'});if(!opt.noPick)setTimeout(galleryPick,300);return me}
  render({h:NETM?`🌐 Ви з’єднані! Ти граєш <b>${human==='w'?'білими':'чорними'}</b>. Погода однакова для обох, і ви бачите її одночасно.`:opt.mode==='friend'?'Грайте по черзі на одному пристрої. Слідкуйте за прогнозом: погода б’є по обох однаково, але виграє той, хто краще нею скористається.':'Звичайні шахи… поки не зміниться погода. Стеж за прикметами: за хід до події з’являється попередження.'});
  if(opt.mode==='bot'&&g.turn()!==human)botMove();
  return me;
}

/* ================= SETUP VIEW ================= */
window.viewStorm=function(){
  css();loadThree().catch(()=>{});
  board.clear();board.flip=false;board.set(new Chess());board.canMove=()=>false;
  S.storm=S.storm||{games:0,seen:{}};
  if(!S.storm.found){S.storm.found=true;save();window.updSecret&&updSecret();toast('🌪 Ти знайшов секретний режим: Шахи-Буря!',3200)}
  let mode=S.stormMode||'bot',lvl=S.playLevel??1,col='w',freq=S.stormFreq||'normal',autoFlip=!!S.stormFlip,showQ=S.stormQ!==false;
  players(plHtml(mode==='bot'?'Бот':'Друг','','b'),plHtml('Ти','','w'));
  function ui(){
    const seen=S.storm.seen||{};
    panel('🌪 Шахи-Буря',`<div id="coachBox"></div>
      <div class="card"><h4>З ким граєш</h4><div class="chips">${[['bot','🤖 З ботом'],['friend','👥 З другом (на одному пристрої)'],['net','🌐 З другом по мережі']].map(([k,n])=>`<button class="chip ${mode===k?'on':''}" data-m="${k}">${n}</button>`).join('')}</div>
        ${mode==='friend'?`<label class="small" style="display:flex;gap:6px;margin-top:8px;cursor:pointer"><input type="checkbox" id="wxAF" ${autoFlip?'checked':''}> Перевертати дошку після кожного ходу</label>`:''}</div>
      ${mode==='bot'?`<div class="card"><h4>Суперник</h4><div class="list">${LEVELS.map((l,i)=>`<div class="it" data-lv="${i}" style="${i===lvl?'outline:2px solid var(--green)':''}"><img src="${PIC('b',['p','p','n','b','r','q','q','k','k'][i])}" width="28"><span class="nm">${l.n}</span><span class="dim small">~${l.elo}</span></div>`).join('')}</div>
        <h4 style="margin-top:12px">Колір</h4><div class="chips">${[['w','Білі'],['b','Чорні'],['r','Випадково']].map(([k,n])=>`<button class="chip ${col===k?'on':''}" data-c="${k}">${n}</button>`).join('')}</div></div>`:''}
      ${mode==='net'?`<div class="card"><h4>Твій колір</h4><div class="chips">${[['w','Білі'],['b','Чорні'],['r','Випадково']].map(([k,n])=>`<button class="chip ${col===k?'on':''}" data-c="${k}">${n}</button>`).join('')}</div>
        <div class="small mut" style="margin-top:8px">Натисни «Створити запрошення», надішли посилання другу (Telegram, Discord…). Коли він його відкриє, партія почнеться сама. Не закривай цю сторінку, поки чекаєш.</div></div>`:''}
      <div class="card"><h4>Як часто змінюється погода</h4><div class="chips">${Object.entries(FREQ).map(([k,[n,r]])=>`<button class="chip ${freq===k?'on':''}" data-f="${k}">${n}</button>`).join('')}</div>
        <div class="small mut" style="margin-top:6px">${FREQ[freq][1][0]===FREQ[freq][1][1]?`Рівно кожні ${FREQ[freq][1][0]/2} ходів.`:`Приблизно кожні ${Math.round(FREQ[freq][1][0]/2)}–${Math.round(FREQ[freq][1][1]/2)} ходів.`}</div></div>
      <div class="card"><label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer"><input type="checkbox" id="wxQ" ${showQ?'checked':''} style="margin-top:3px"><span><b>📊 Показувати оцінку ходів під час гри</b><div class="small mut">Значки (!!, ★, ?, ??) на кожному ході й смужка переваги збоку.${mode==='net'?' Обираєш ти як господар: у друга буде так само.':''} Розбір партії після гри доступний завжди.</div></span></label></div>
      <div class="card"><h4>🏆 Легендарні мати <span class="small dim">${Object.keys(S.storm.legends||{}).length}/5</span></h4><div class="small mut" style="margin-bottom:6px">Дуже рідкісні красиві мати відкривають двохвилинне 3D-кіно. Кожен вид мату має свій фільм.</div>${(window.LEGENDS||[]).map(l=>{const n=(S.storm.legends||{})[l.id];return`<div class="wxEv" style="${n?'':'opacity:.8'}"><span class="i">${n?l.i:'🔒'}</span><div style="flex:1"><b>${n?l.n:'???'}</b>${n?` <span class="small dim">×${n}</span>`:''}<div class="small mut">${l.hint}</div></div>${n?`<button class="btn sm g" data-lg="${l.id}">▶</button>`:''}</div>`}).join('')}</div>
      <div class="card"><h4>📖 Можлива погода</h4>${POOL.map(k=>`<div class="wxEv" style="${seen[k]?'':'opacity:.75'}"><span class="i">${EVENTS[k].i}</span><div style="flex:1"><b>${EVENTS[k].n}</b> <span class="tag" style="background:${RAR[EVENTS[k].rar].col};color:#111">${RAR[EVENTS[k].rar].n}</span>${seen[k]?` <span class="small dim">бачив ×${seen[k]}</span>`:''}<div class="small mut">${EVENTS[k].d}</div></div></div>`).join('')}</div>`,
      mode==='net'?`<button class="btn" id="wxInvite">🔗 Створити запрошення</button>`:`<button class="btn" id="wxStart">🌪 Грати</button>`);
    coachSay('Звичайні шахи на звичайній дошці. Але раз на кілька ходів камера відривається від дошки, фігури встають, і за вікном щось починається. Перед кожною партією по радіо дають прогноз: 4 види погоди, які можуть трапитися.');
    document.querySelectorAll('[data-m]').forEach(e=>e.onclick=()=>{mode=e.dataset.m;S.stormMode=mode;save();players(plHtml(mode==='bot'?'Бот':'Друг','','b'),plHtml('Ти','','w'));ui()});
    document.querySelectorAll('[data-lv]').forEach(e=>e.onclick=()=>{lvl=+e.dataset.lv;ui()});
    document.querySelectorAll('[data-c]').forEach(e=>e.onclick=()=>{col=e.dataset.c;ui()});
    document.querySelectorAll('[data-lg]').forEach(e=>e.onclick=()=>playLegendDemo(e.dataset.lg));
    document.querySelectorAll('[data-f]').forEach(e=>e.onclick=()=>{freq=e.dataset.f;S.stormFreq=freq;save();ui()});
    $('#wxQ').onchange=e=>{showQ=e.target.checked;S.stormQ=showQ;save()};
    if($('#wxAF'))$('#wxAF').onchange=e=>{autoFlip=e.target.checked;S.stormFlip=autoFlip;save()};
    if($('#wxStart'))$('#wxStart').onclick=()=>{panel('🌪 Шахи-Буря','','');CUR=StormRun({mode,level:lvl,color:col,freq,autoFlip,showQ})};
    if($('#wxInvite'))$('#wxInvite').onclick=()=>hostWait(col,freq,showQ);
  }
  ui();
};

/* host: create an invite link and wait for the friend */
function hostWait(col,freq,showQ){
  const myC=col==='r'?(Math.random()<.5?'w':'b'):col;
  const show=(html,foot)=>panel('🌐 Запрошення',`<div id="coachBox"></div>${html}`,foot||`<button class="btn g" id="wxCancel">Скасувати</button>`);
  const bindCancel=()=>{if($('#wxCancel'))$('#wxCancel').onclick=()=>{netClose();showView('storm')}};
  show(`<div class="card"><div class="small mut">Створюю запрошення…</div></div>`);bindCancel();
  coachSay('Секунду, готую посилання для друга.');
  CUR={stop(keep){if(!keep)netClose()}};
  netHost(code=>{
    const link=location.origin+location.pathname+'?storm='+code;
    show(`<div class="card"><h4>🔗 Посилання для друга</h4>
      <input id="wxLink" readonly value="${esc(link)}" style="width:100%;padding:9px;border-radius:6px;border:1px solid #3c3a37;background:#1f1e1b;color:#fff;font-size:14px" onclick="this.select()">
      <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn sm" id="wxCopy">📋 Копіювати</button>${navigator.share?'<button class="btn g sm" id="wxShare">📤 Поділитися</button>':''}</div>
      <div class="small mut" style="margin-top:10px">Код запрошення: <b style="font-size:18px;letter-spacing:.15em;color:#fff">${code}</b></div></div>
      <div class="card small"><div id="wxHostSt" style="font-weight:700;margin-bottom:4px">🟢 Запрошення активне</div>⏳ Чекаємо друга… Ти граєш <b>${myC==='w'?'білими':'чорними'}</b>, погода: <b>${FREQ[freq][0].toLowerCase()}</b>.
        <div style="margin-top:6px;color:var(--gold)">⚠ Після того як надішлеш посилання, одразу повернись на цю сторінку і не блокуй телефон. Поки ти в іншому застосунку, браузер може вимкнути запрошення, і друг тебе не знайде.</div></div>`);
    bindCancel();
    NET.hostSt=on=>{const e=$('#wxHostSt');if(e)e.innerHTML=on?'🟢 Запрошення активне':'🔴 Звʼязок втрачено, відновлюю…'};
    coachSay('Надішли це посилання другу. Щойно він його відкриє, партія почнеться в обох.');
    $('#wxCopy').onclick=()=>{const t=$('#wxLink');t.select();(navigator.clipboard?navigator.clipboard.writeText(link):Promise.reject()).then(()=>toast('Посилання скопійовано')).catch(()=>{document.execCommand('copy');toast('Посилання скопійовано')})};
    if($('#wxShare'))$('#wxShare').onclick=()=>navigator.share({title:'Шахи-Буря',text:'Зіграймо в Шахи-Бурю! 🌪',url:link}).catch(()=>{});
  },()=>{
    const fc=makeForecast(true),na=Math.max(6,FREQ[freq][1][0]+Math.floor(Math.random()*(FREQ[freq][1][1]-FREQ[freq][1][0]+1)));
    netSend({t:'start',color:other(myC),freq,forecast:fc,nextAt:na,showQ});
    snd&&snd('good');
    if(CUR&&CUR.stop)CUR.stop(true);CUR=null;panel('🌪 Шахи-Буря','','');
    CUR=StormRun({mode:'net',host:true,color:myC,freq,forecast:fc,nextAt:na,showQ});
  },e=>{show(`<div class="card" style="border:2px solid var(--red)">${esc(netErr(e))}</div>`,`<button class="btn" id="wxRetry">Спробувати ще раз</button><button class="btn g" id="wxCancel">Назад</button>`);bindCancel();$('#wxRetry').onclick=()=>hostWait(col,freq,showQ)}).catch(()=>{show(`<div class="card" style="border:2px solid var(--red)">Не вдалося завантажити модуль гри по мережі. Перевір інтернет.</div>`);bindCancel()});
}

/* ================= SECRET ANIMATION GALLERY =================
   Type 20118 anywhere (not in a text field) → password window → 8888 → watch any event. */
const GAL_FEN='r1bqk2r/pp1n1ppp/2pbpn2/3p4/2PP4/2N1PN2/PPQ1BPPP/R1B1K2R w KQkq - 0 8';
/* demo positions: white captures the black queen with the given piece */
const CHKDEMO=[
  {n:'Мат (3D-кіно за складністю)',fen:'6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',m:['a1','a8'],img:'k'},
  {n:'Рокіровка',fen:'4k3/8/8/8/8/8/8/4K2R w K - 0 1',m:['e1','g1'],img:'r'},
  {n:'Перетворення пішака',fen:'4k3/1P6/8/8/8/8/8/4K3 w - - 0 1',m:['b7','b8'],img:'q'},
];
const CAPDEMO={
  p:{fen:'4k3/pp4pp/8/3q4/4P3/8/PP4PP/4K3 w - - 0 1',m:['e4','d5']},
  n:{fen:'4k3/pp4pp/8/4q3/8/5N2/PP4PP/4K3 w - - 0 1',m:['f3','e5']},
  b:{fen:'4k3/pp3qpp/8/8/2B5/8/PP4PP/4K3 w - - 0 1',m:['c4','f7']},
  r:{fen:'4k3/pp4pp/3q4/8/8/8/PP4PP/3RK3 w - - 0 1',m:['d1','d6']},
  q:{fen:'4k3/pp1q2pp/8/8/8/8/PP4PP/3QK3 w - - 0 1',m:['d1','d7']},
  k:{fen:'4k3/pp4pp/8/8/8/8/PP2q1PP/4K3 w - - 0 1',m:['e1','e2']},
};
function galleryPick(){
  const list=[...POOL,'ufoBack'];
  const caps=['p','n','b','r','q','k'];
  modal(`<h2>🎬 Галерея анімацій</h2><div style="text-align:left;max-height:62vh;overflow:auto">
    <h4 style="margin:12px 0 6px">⚔️ Мат, рокіровка, перетворення</h4><div class="list">${CHKDEMO.map((d,i)=>`<div class="it" data-gx="${i}"><img src="${PIC('w',d.img)}" width="28"><span class="nm">${d.n}</span></div>`).join('')}</div>
    <h4 style="margin:12px 0 6px">🎬 3D-кіно мату</h4><div class="list">${(window.CINEMA_SCENES||[]).map((n,i)=>`<div class="it" data-gm="${i}"><span style="font-size:20px;width:28px;text-align:center">🎬</span><span class="nm">${i+1}. ${n}</span><span class="tag">${i<3?'~12 с':i<7?'~18 с':'~30 с'}</span></div>`).join('')}</div>
    <h4 style="margin:12px 0 6px">🏆 Легендарні мати (~2 хв)</h4><div class="list">${(window.LEGENDS||[]).map(l=>`<div class="it" data-gl="${l.id}"><span style="font-size:20px;width:28px;text-align:center">${l.i}</span><span class="nm">${l.n}</span><span class="tag">2 хв</span></div>`).join('')}</div>
    <h4 style="margin:12px 0 6px">👑 Корона</h4><div class="list"><div class="it" data-gc="1"><img src="${CROWN_SVG}" width="28"><span class="nm">Хтось збиває пішака з короною і забирає її</span></div></div>
    <h4 style="margin:12px 0 6px">🌪 Погода</h4><div class="list">${list.map(k=>`<div class="it" data-gk="${k}"><span style="font-size:22px;width:30px;text-align:center">${EVENTS[k].i}</span><span class="nm">${EVENTS[k].n}${k==='ufoBack'?' (повернення)':''}</span><span class="tag" style="background:${RAR[EVENTS[k].rar].col};color:#111">${RAR[EVENTS[k].rar].n}</span></div>`).join('')}</div></div>
    <label class="small" style="display:flex;gap:6px;margin-top:10px;cursor:pointer;text-align:left"><input type="checkbox" id="galFull" ${GAL_FULL?'checked':''}> 🐢 Погода: повна повільна версія (у грі вона коротка, ~1 сек)</label>
    <button class="btn g" style="width:100%;margin-top:10px" onclick="closeModal()">Закрити</button>`);
  $('#galFull').onchange=e=>{GAL_FULL=e.target.checked};
  document.querySelectorAll('[data-gk]').forEach(e=>e.onclick=()=>{closeModal();galleryRun(GAL_FEN,r=>r._ev(e.dataset.gk,{type:'b',color:'b'}))});
  document.querySelectorAll('[data-gq]').forEach(e=>e.onclick=()=>{closeModal();const d=CAPDEMO[e.dataset.gq];galleryRun(d.fen,r=>r._mv(d.m[0],d.m[1]))});
  document.querySelectorAll('[data-gm]').forEach(e=>e.onclick=async()=>{closeModal();let back=null;try{back=await boardTo3D(board.kingSq('b')||'e8');await window.playCinema({color:'w',piece:'q',kingColor:'b',scene:+e.dataset.gm})}catch(err){console.warn(err)}back&&back()});
  document.querySelectorAll('[data-gl]').forEach(e=>e.onclick=()=>{closeModal();playLegendDemo(e.dataset.gl)});
  document.querySelectorAll('[data-gx]').forEach(e=>e.onclick=ev=>{ev.stopPropagation();closeModal();const d=CHKDEMO[+e.dataset.gx];window.CHK_VARIANT=e.dataset.gv!=null?+e.dataset.gv:null;galleryRun(d.fen,r=>r._mv(d.m[0],d.m[1]))});
  document.querySelectorAll('[data-gc]').forEach(e=>e.onclick=()=>{closeModal();galleryRun('4k3/pp4pp/4p3/3P4/8/8/PP4PP/4K3 b - - 0 1',r=>r._mv('e6','d5'),{d5:1})});
}
/* plays a legendary film on the board that is on screen (gallery, or a replay of an unlocked one) */
const LEGEND_DEMO={jurassic:'n',rocket:'q',volcano:'r',ghosts:'q',studio:'r'};
async function playLegendDemo(id){
  if(!window.playLegend)return;const fen='2r3k1/pp3ppp/2n5/8/3N4/2P5/P4PPP/R1B3K1 w - - 0 1';
  try{await window.playLegend({id,color:'w',piece:LEGEND_DEMO[id]||'q',kingColor:'b',fen,kingSq:board.kingSq('b')||'e8',checkers:id==='volcano'?['r','b']:[LEGEND_DEMO[id]||'q']})}catch(e){console.warn(e);toast('Не вдалося запустити анімацію')}
}
function galleryRun(fen,act,crowns){
  if(CUR&&CUR.busy&&CUR.busy()){toast('Зачекай, поки закінчиться поточна анімація');return}
  if(CUR&&CUR.stop)CUR.stop();
  CUR=StormRun({mode:'friend',freq:'rare',gallery:true,noPick:true,fen,crowns});
  const run=CUR;setTimeout(()=>{if(CUR===run)act(run)},700);
}
function openGallery(){closeModal();showView('storm');panel('🌪 Шахи-Буря','','');CUR=StormRun({mode:'friend',freq:'rare',gallery:true,fen:GAL_FEN})}
function askGalleryPassword(){
  modal(`<h2>🔒 Секретний вхід</h2><p class="small mut">Введи пароль</p>
    <input id="galPw" type="password" inputmode="numeric" autocomplete="off" style="width:100%;padding:10px;border-radius:6px;border:1px solid #3c3a37;background:#1f1e1b;color:#fff;font-size:20px;text-align:center;letter-spacing:.3em">
    <div id="galErr" class="small" style="color:var(--red);min-height:18px;margin-top:6px"></div>
    <div class="row" style="gap:8px;margin-top:6px"><button class="btn" id="galOk" style="flex:1">Увійти</button><button class="btn g" style="flex:1" onclick="closeModal()">Скасувати</button></div>`);
  const inp=$('#galPw');setTimeout(()=>inp.focus(),50);
  const ok=()=>{if(inp.value.trim()==='8888'){snd&&snd('good');openGallery()}else{$('#galErr').textContent='Неправильний пароль';inp.value='';inp.focus();snd&&snd('bad')}};
  $('#galOk').onclick=ok;inp.onkeydown=e=>{if(e.key==='Enter')ok()};
}
{
  let buf='';
  document.addEventListener('keydown',e=>{
    const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;
    if(e.key&&e.key.length===1&&e.key>='0'&&e.key<='9'){buf=(buf+e.key).slice(-5);if(buf==='20118'){buf='';askGalleryPassword()}}
  });
}

/* guest: opened an invite link. If the friend's page is not reachable yet (closed, phone asleep, still loading),
   keep trying for two minutes instead of giving up after one attempt. */
function joinInvite(code,tries=0){
  window.STORM_INVITE=true;window.updSecret&&updSecret();
  if(!tries)showView('storm');
  const show=(html,foot)=>panel('🌐 Гра по мережі',`<div id="coachBox"></div>${html}`,foot||`<button class="btn g" id="wxCancel">Скасувати</button>`);
  let cancelled=false;
  const bindCancel=()=>{if($('#wxCancel'))$('#wxCancel').onclick=()=>{cancelled=true;clearTimeout(window.__joinT);netClose();showView('storm')}};
  show(`<div class="card">⏳ Підключаюся до друга (код <b>${esc(code)}</b>)…${tries?`<div class="small mut" style="margin-top:6px">Спроба ${tries+1}. Друг має тримати відкритою сторінку з запрошенням (не закривати й не блокувати телефон).</div>`:''}</div>`);bindCancel();
  if(!tries)coachSay('Тебе запросили в Шахи-Бурю! Звичайні шахи, але погода за вікном змінює партію.');
  CUR={stop(keep){cancelled=true;clearTimeout(window.__joinT);if(!keep)netClose()}};
  netJoin(code,()=>{show(`<div class="card">✅ З’єднано! Чекаю на початок партії…</div>`);bindCancel()},
    e=>{if(cancelled)return;const lost=e&&(e.type==='peer-unavailable'||e.type==='network'||e.type==='server-error'||e.type==='socket-error'||e.type==='socket-closed'||e.type==='disconnected');
      if(lost&&tries<75){show(`<div class="card">⏳ Друга поки не видно (код <b>${esc(code)}</b>).<div class="small mut" style="margin-top:6px">Пробую знову… Попроси друга не закривати сторінку з запрошенням. Якщо він її закрив, хай створить нове запрошення й надішле нове посилання.</div><div class="small dim" style="margin-top:4px">спроба ${tries+1} · ${esc((e&&e.type)||'?')}</div></div>`);bindCancel();
        clearTimeout(window.__joinT);window.__joinT=setTimeout(()=>{if(!cancelled)joinInvite(code,tries+1)},4000);return}
      show(`<div class="card" style="border:2px solid var(--red)">${esc(netErr(e))}<div class="small mut" style="margin-top:6px">Попроси друга створити нове запрошення.</div></div>`,`<button class="btn" id="wxRetry">Спробувати ще раз</button><button class="btn g" id="wxCancel">Назад</button>`);bindCancel();$('#wxRetry').onclick=()=>joinInvite(code)}).catch(()=>{show(`<div class="card" style="border:2px solid var(--red)">Не вдалося завантажити модуль гри по мережі. Перевір інтернет.</div>`);bindCancel()});
}
{
  const inv=new URLSearchParams(location.search).get('storm');
  if(inv&&/^[a-z0-9]{4,12}$/.test(inv)){
    history.replaceState(null,'',location.pathname);
    const go=()=>setTimeout(()=>{closeModal();joinInvite(inv)},700);
    if(document.readyState==='complete')go();else window.addEventListener('load',go);
  }
}
window.STORM_EVENTS=EVENTS; /* for debugging */
window.stormDebug={run:(k,p)=>CUR&&CUR._ev&&CUR._ev(k,p),W3};
})();
