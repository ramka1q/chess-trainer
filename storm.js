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
const POOL=Object.keys(EVENTS).filter(k=>!EVENTS[k].hidden);
function wpick(keys){const tot=keys.reduce((a,k)=>a+RAR[EVENTS[k].rar].w,0);let x=Math.random()*tot;for(const k of keys){x-=RAR[EVENTS[k].rar].w;if(x<=0)return k}return keys[keys.length-1]}
function makeForecast(){const out=[];let left=POOL.slice();while(out.length<4&&left.length){const k=wpick(left);out.push(k);left=left.filter(x=>x!==k)}return out}

/* ---------- tiny synth for weather sounds ---------- */
let AC=null;
function ac(){if(typeof S!=='undefined'&&S.sound===false)return null;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();return AC}catch(e){return null}}
function noise(dur,o={}){const a=ac();if(!a)return;const{f=800,f2=null,q=.7,g=.4,type='lowpass',att=.02,delay=0}=o;const t0=a.currentTime+delay;
  const n=Math.floor(a.sampleRate*dur),b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
  const s=a.createBufferSource();s.buffer=b;const fl=a.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f,t0);fl.Q.value=q;if(f2)fl.frequency.linearRampToValueAtTime(f2,t0+dur);
  const gn=a.createGain();gn.gain.setValueAtTime(.0001,t0);gn.gain.linearRampToValueAtTime(g,t0+att);gn.gain.exponentialRampToValueAtTime(.0001,t0+dur);s.connect(fl).connect(gn).connect(a.destination);s.start(t0);s.stop(t0+dur+.05)}
function tone(f,dur,o={}){const a=ac();if(!a)return;const{type='sine',g=.15,f2=null,delay=0,att=.01}=o;const t0=a.currentTime+delay;const os=a.createOscillator();os.type=type;os.frequency.setValueAtTime(f,t0);if(f2)os.frequency.exponentialRampToValueAtTime(f2,t0+dur);
  const gn=a.createGain();gn.gain.setValueAtTime(.0001,t0);gn.gain.linearRampToValueAtTime(g,t0+att);gn.gain.exponentialRampToValueAtTime(.0001,t0+dur);os.connect(gn).connect(a.destination);os.start(t0);os.stop(t0+dur+.05)}
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
let THREE_P=null;
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
  const R=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
  R.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));R.setClearColor(0x000000,0);
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
  for(let i=0;i<14;i++){const x=-70+i*10+Math.random()*4,z=-60-Math.random()*30,h=6+Math.random()*16,w=5+Math.random()*4;
    box(w,h,5,0x171a24,x,-5+h/2,z,houses);
    for(let k=0;k<4;k++)if(Math.random()<.55){const lw=basic(new T.PlaneGeometry(.9,1.2),{color:0xffd27a},houses);lw.position.set(x-w/2+1+Math.random()*(w-2),-3+Math.random()*(h-3),z+2.55)}}
  for(let i=0;i<16;i++){const tm=new T.MeshLambertMaterial({color:0x14301c,transparent:true,opacity:0});tm.userData.base=1;W3.fade.push(tm);const t=new T.Mesh(new T.ConeGeometry(1.6+Math.random(),5+Math.random()*4,7),tm);t.position.set(-40+Math.random()*80,-2,-25-Math.random()*25);W3.out.add(t)}
  W3.clouds=[];const ctex=blobTex('120,125,140');
  for(let i=0;i<10;i++){const c=basic(new T.PlaneGeometry(60,22),{map:ctex,opacity:.75,depthWrite:false},W3.out);c.position.set(-120+i*26,30+Math.random()*15,-130+Math.random()*10);W3.clouds.push(c)}
  /* rain as line segments */
  {const N=900,pos=new Float32Array(N*6);for(let i=0;i<N;i++){const x=-35+Math.random()*70,y=-5+Math.random()*30,z=-11-Math.random()*40;pos.set([x,y,z,x-.15,y-1.1,z],i*6)}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));const m=new T.LineBasicMaterial({color:0x9fb3d6,transparent:true,opacity:0});m.userData.base=.55;W3.fade.push(m);W3.rain=new T.LineSegments(g,m);W3.out.add(W3.rain);W3.rainSpeed=38;W3.rainLen=1.1}
  /* board top + piece textures */
  W3.bcv=document.createElement('canvas');W3.bcv.width=W3.bcv.height=1024;W3.btex=makeTex(W3.bcv);
  W3.top=new T.Mesh(new T.PlaneGeometry(8,8),new T.MeshBasicMaterial({map:W3.btex}));W3.top.rotation.x=-Math.PI/2;W3.top.position.y=.001;scene.add(W3.top);
  W3.ptex={};await Promise.all(['w','b'].flatMap(c=>['p','n','b','r','q','k'].map(t=>new Promise(res=>{const im=new Image();im.onload=()=>{const c2=document.createElement('canvas');c2.width=c2.height=256;c2.getContext('2d').drawImage(im,0,0,256,256);W3.ptex[c+t]=makeTex(c2);res()};im.onerror=res;im.src=PIC(c,t)}))));
  W3.pgeo=new T.PlaneGeometry(1,1);
  /* main loop */
  let last=performance.now();
  let lastStep=0;
  const step=(now,maxDt)=>{lastStep=performance.now();if(!W3.on){last=now;return}const dt=Math.min(maxDt,(now-last)/1000)*W3.speed;last=now;for(const u of [...W3.upd])u(now,dt);frame(dt);R.render(scene,cam)};
  const loop=now=>{requestAnimationFrame(loop);step(now,.05)};
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
const isLight=sq=>((sq.charCodeAt(0)-97)+(+sq[1]))%2===1;
function drawBoard(info){
  const c=W3.bcv,x=c.getContext('2d'),S=c.width,q=S/8;const cs=getComputedStyle(document.documentElement);const V=n=>cs.getPropertyValue(n).trim();
  const L=V('--light')||'#EBECD0',D=V('--dark')||'#739552',HL=V('--hl-l')||'#F5F682',HD=V('--hl-d')||'#B9CA43';
  for(let r=0;r<8;r++)for(let f=0;f<8;f++){const sq=W3.flip?sqN(7-f,r):sqN(f,7-r);const light=isLight(sq);const hl=info.last&&info.last.includes(sq);x.fillStyle=light?(hl?HL:L):(hl?HD:D);x.fillRect(f*q,r*q,q,q)}
  x.font=`700 ${S/46}px "Segoe UI",system-ui,Arial,sans-serif`;
  for(let i=0;i<8;i++){
    const rk=W3.flip?i+1:8-i;const sqL=W3.flip?sqN(7,i):sqN(0,7-i);const lt=isLight(sqL);x.fillStyle=lt?D:L;x.textAlign='left';x.textBaseline='top';x.fillText(String(rk),q*.04,i*q+q*.03);
    const fl=W3.flip?FILES[7-i]:FILES[i];const sqB=W3.flip?sqN(7-i,7):sqN(i,0);const lb=isLight(sqB);x.fillStyle=lb?D:L;x.textAlign='right';x.textBaseline='bottom';x.fillText(fl,i*q+q*.95,S-q*.02);
  }
  W3.btex.needsUpdate=true;
}

/* a piece is just its 2D picture: lies flat (identical to the 2D board from above) and stands up when s→1 */
function makePiece(sq,p){
  const T=W3.T;const grp=new T.Group();grp.rotation.order='YXZ';
  const mat=new T.MeshBasicMaterial({map:W3.ptex[p.color+p.type],transparent:true,alphaTest:.02,side:T.DoubleSide});
  const pl=new T.Mesh(W3.pgeo,mat);grp.add(pl);
  W3.scene.add(grp);
  const o={sq,p,grp,pl,mat,x:0,z:0,lift:0,spin:0,fall:0,alpha:1,tint:1,own:false,scale:1};const w=sqW(sq);o.x=w.x;o.z=w.z;return o;
}
function disposePiece(o){W3.scene.remove(o.grp);o.mat.dispose()}

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
function makeCrown(){const T=W3.T;const g=new T.Group();const m=new T.MeshBasicMaterial({color:0xffd54a});
  const band=new T.Mesh(new T.CylinderGeometry(.3,.3,.14,20,1,true),new T.MeshBasicMaterial({color:0xffc928,side:T.DoubleSide}));g.add(band);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const c=new T.Mesh(new T.ConeGeometry(.07,.22,6),m);c.position.set(Math.cos(a)*.3,.17,Math.sin(a)*.3);g.add(c);
    const gem=new T.Mesh(new T.SphereGeometry(.045,8,6),new T.MeshBasicMaterial({color:[0xff3b5c,0x3bb2ff,0x3bff8a][i%3]}));gem.position.set(Math.cos(a)*.31,0,Math.sin(a)*.31);g.add(gem)}
  W3.scene.add(g);W3.cleanup.push(()=>W3.scene.remove(g));return g}
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
    const crown=makeCrown();crown.scale.setScalar(.01);
    const follow=every(n=>{aura.position.set(o.x,o.lift+.5,o.z);crown.position.set(o.x,o.lift+1.18+Math.sin(n/300)*.04,o.z);crown.rotation.y=n/700});W3.cleanup.push(follow);
    heartbeat(4,.7);
    burst(wf,160,0xffd54a,2.2,.18,.2);
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
    burst(wt,700,0xffd54a,9,.22);burst(wt,300,0xff5a5a,7,.2);
    W3.skyTint.setRGB(2.2,1.8,1);W3.flash=1.6;setTimeout(fanfare,500);
  }
  await tween(700+t*150,e=>{W3.shake=(.06*t+.04)*(1-e)});
  /* 5. hero pose */
  W3.pcs[c.to]=o;delete W3.pcs[c.from];o.sq=c.to;disposePiece(q);
  if(t===4){await camTo(shotAt(wt,back+.25,4,1.9,.9),1100);await wait(900);await tween(900,e=>{W3.lvl=lerp(.32,1,e);W3.lamp.userData.on=lerp(.15,1,e);o.tint=lerp(1.9,1,e);W3.skyTint.setRGB(lerp(2.2,1,e),lerp(1.8,1,e),1)})}
  else{await camTo(shotAt(wt,back+.4,3+t*.3,1.3,.5),900);await wait(400+t*150)}
  o.own=false;
}

const FX={
  async tornado(X){
    const T=W3.T;SFX.wind(5);W3.rainSpeed=60;
    const P=particles(1600,0xa9a49a,2.6,.6);const N=1600;const seed=[];for(let i=0;i<N;i++)seed.push({h:Math.random(),a:Math.random()*6.28,s:.8+Math.random()*1.5,j:Math.random()});
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
    const ex=particles(500,0xffa040,.6,1);const v=[];for(let i=0;i<500;i++)v.push(new T.Vector3((Math.random()-.5)*14,Math.random()*12,(Math.random()-.5)*14));const ea=ex.geometry.attributes.position.array;for(let i=0;i<500;i++){ea[i*3]=cx;ea[i*3+1]=.3;ea[i*3+2]=cz}
    const stE=every((n,dt)=>{for(let i=0;i<500;i++){v[i].y-=14*dt;ea[i*3]+=v[i].x*dt;ea[i*3+1]=Math.max(.05,ea[i*3+1]+v[i].y*dt);ea[i*3+2]+=v[i].z*dt}ex.geometry.attributes.position.needsUpdate=true;ex.material.opacity=Math.max(0,ex.material.opacity-dt*.5)});W3.cleanup.push(()=>{stE();W3.scene.remove(ex)});
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
  W3.flip=X.flip;W3.speed=1;W3.cleanup=[];W3.onReturn=[];W3.extra=[];W3.ice=[];W3.flash=0;W3.shake=0;W3.lvl=1;W3.wind=0;W3.lamp.userData.on=1;W3.skyTint=new T.Color(1,1,1);
  W3.rainSpeed=38;W3.rainLen=1.1;W3.rain.material.color.setHex(0x9fb3d6);W3.rain.visible=true;W3.glass.visible=true;W3.frost.material.userData.base=0;W3.frost.material.opacity=0;
  W3.cup.rotation.set(0,0,0);W3.cup.position.set(6,-.3,2.2);W3.curt.forEach(c=>{c.rotation.set(0,0,0);c.position.z=-8.4});
  for(const k in W3.pcs)disposePiece(W3.pcs[k]);W3.pcs={};
  for(const[sq,p]of Object.entries(X.map0))W3.pcs[sq]=makePiece(sq,p);
  drawBoard({last:X.last});W3.C=cloneShot(shot('top'));W3.stand=0;setRoomAlpha(0);
  const u=ui3();u.classList.remove('capOn');u.querySelector('.bo').style.opacity=0;
  W3.on=true;W3.cv.style.display='block';u.style.display='block';
  /* one frame identical to the 2D board, then hide the DOM board under it */
  await wait(30);X.hide2D(true);
  u.classList.add('on');
  /* lift off */
  W3.speed=1;
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
  W3.speed=Math.min(W3.speed,2);
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
  await sleep(2200);b.classList.remove('wxShake');u.classList.remove('capOn','on');u.style.display='none';
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
.wxLog .e{background:rgba(116,155,191,.16);border-left:3px solid #749BBF;padding:3px 7px;margin:4px 0;border-radius:3px}
.wxOmen{background:rgba(247,198,49,.12);border:1px dashed var(--gold);border-radius:6px;padding:8px 10px;font-size:14px;margin-bottom:8px}
`;
let cssDone=false;function css(){if(cssDone)return;cssDone=true;const s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s)}

const FREQ={rare:['Рідко',[16,22]],normal:['Нормально',[10,16]],often:['Часто',[6,10]],chaos:['Хаос',[3,5]]};

/* ================= ONLINE (PeerJS, browser-to-browser) =================
   The host decides all randomness (weather) and sends it to the guest, so both see the same thing. */
const PFX='chstorm-';
const NET={peer:null,conn:null,handler:null,onClose:null,isHost:false};
let PEER_P=null;
function loadPeer(){return PEER_P||(PEER_P=new Promise((res,rej)=>{if(window.Peer)return res();const s=document.createElement('script');s.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';s.crossOrigin='anonymous';s.onload=()=>res();s.onerror=()=>{PEER_P=null;rej(new Error('peerjs'))};document.head.appendChild(s)}))}
function netClose(){const c=NET.conn,p=NET.peer;NET.conn=NET.peer=null;NET.handler=null;NET.onClose=null;try{c&&c.close()}catch(e){}try{p&&p.destroy()}catch(e){}}
function netSend(d){try{if(NET.conn&&NET.conn.open)NET.conn.send(d)}catch(e){}}
function bindConn(c){NET.conn=c;c.on('data',d=>{if(!d||typeof d!=='object')return;if(d.t==='start'&&!NET.isHost){guestStart(d);return}NET.handler&&NET.handler(d)});c.on('close',()=>{if(NET.conn===c){NET.onClose&&NET.onClose()}});c.on('error',()=>{})}
const netErr=e=>{const t=e&&e.type;return t==='peer-unavailable'?'Запрошення не знайдено. Можливо, друг закрив сторінку або посилання старе.':t==='network'||t==='server-error'||t==='socket-error'||t==='socket-closed'?'Немає зв’язку з сервером з’єднання. Перевір інтернет і спробуй ще раз.':t==='browser-incompatible'?'Цей браузер не підтримує гру по мережі.':'Не вдалося з’єднатися ('+(t||e&&e.message||'помилка')+').'};
async function netHost(onReady,onConn,onErr){
  await loadPeer();netClose();NET.isHost=true;
  const code=Array.from({length:6},()=>'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random()*31)]).join('');
  const peer=new window.Peer(PFX+code);NET.peer=peer;
  peer.on('open',()=>onReady(code));
  peer.on('connection',c=>{if(NET.conn&&NET.conn.open){c.on('open',()=>c.close());return}c.on('open',()=>{bindConn(c);onConn()})});
  peer.on('error',e=>{if(NET.peer!==peer)return;if(e.type==='unavailable-id'){netHost(onReady,onConn,onErr);return}if(e.type==='peer-unavailable')return;onErr(e)});
}
async function netJoin(code,onOk,onErr){
  await loadPeer();netClose();NET.isHost=false;
  const peer=new window.Peer();NET.peer=peer;
  peer.on('open',()=>{const c=peer.connect(PFX+code,{reliable:true});c.on('open',()=>{bindConn(c);onOk()})});
  peer.on('error',e=>{if(NET.peer!==peer)return;onErr(e)});
}
function guestStart(d){
  if(CUR&&CUR.stop)CUR.stop(true);CUR=null;closeModal();showMain();setNav('storm');
  CUR=StormRun({mode:'net',host:false,color:d.color,freq:d.freq,forecast:d.forecast,nextAt:d.nextAt});
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
  const st={fog:0,fogR:null,frozen:{},ufo:null,secret:null};
  const log=[];const forecast=opt.forecast||makeForecast();
  board.clear();board.flip=human==='b';board.set(g);board.showDots=true;
  /* board hooks: frozen pieces cannot move, fog / ice / ufo marks drawn after every render */
  board.targets=function(from){if(st.frozen[from])return[];return Board.prototype.targets.call(this,from)};
  board.render=function(a){Board.prototype.render.call(this,a);decorate()};
  function decorate(){
    for(let i=0;i<64;i++){const sq=board.idxToSq(i),d=board.sqs[i];
      if(st.fog>0&&st.fogR&&+sq[1]>=st.fogR[0]&&+sq[1]<=st.fogR[1]){d.classList.add('fogd');d.insertAdjacentHTML('beforeend','<span class="wxFog"></span>')}
      if(st.frozen[sq])d.insertAdjacentHTML('beforeend','<span class="wxIce"></span>')}
  }
  const names=()=>{
    if(opt.mode==='friend'){const top=board.flip?'w':'b',bot=board.flip?'b':'w';players(plHtml(top==='w'?'Білі':'Чорні','друг',top),plHtml(bot==='w'?'Білі':'Чорні','друг',bot))}
    else if(NETM)players(plHtml('Друг','🌐 по мережі',other(human)),plHtml('Ти','',human));
    else players(plHtml('Бот: '+L.n,'~'+L.elo,other(human)),plHtml('Ти','',human));
  };
  names();
  board.canMove=()=>!busy&&!over&&me.alive&&!waitHost&&(opt.mode==='friend'||g.turn()===human);
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

  function render(msg){
    const turnTxt=over?'':opt.mode==='friend'?`Хід ${g.turn()==='w'?'білих':'чорних'}`:g.turn()===human?(waitHost?'Синхронізація…':'Твій хід'):NETM?'Хід друга…':'Бот думає…';
    const eff=[];if(st.fog>0)eff.push(`🌫 туман: ще ${st.fog} півх.`);const fz=Object.keys(st.frozen);if(fz.length)eff.push(`❄ замерзли: ${fz.join(', ')}`);if(st.ufo)eff.push(`🛸 НЛО повернеться через ${Math.max(1,Math.ceil((st.ufo.at-ply)/2))} хід`);
    const left=Math.max(0,nextAt-ply);
    $('#pb').innerHTML=`${msg?`<div id="coachBox"></div>`:''}
      ${upcoming&&!over?`<div class="wxOmen">${EVENTS[upcoming].omen}<div class="small mut" style="margin-top:3px">Щось насувається…</div></div>`:''}
      <div class="card wxRadio"><h4>📻 Прогноз погоди на цю партію</h4>${forecast.map(k=>`<div class="wxEv"><span class="i">${EVENTS[k].i}</span><div style="flex:1"><b>${EVENTS[k].n}</b> <span class="tag" style="background:${RAR[EVENTS[k].rar].col};color:#111">${RAR[EVENTS[k].rar].n}</span><div class="small mut">${EVENTS[k].d}</div></div></div>`).join('')}
        <div class="small" style="margin-top:6px;opacity:.8">${over?'':left<=1?'⚠ Погода зміниться після наступного ходу!':`Наступна зміна погоди приблизно через ${Math.ceil(left/2)} ${plural(Math.ceil(left/2),'хід','ходи','ходів')}.`}</div></div>
      ${eff.length?`<div class="card small">${eff.join('<br>')}</div>`:''}
      ${st.secret&&st.secret.show?`<div class="card small">👁 <b>Що змінилося:</b> ${PNAME[st.secret.p.type]} ${st.secret.from} → ${st.secret.to}</div>`:''}
      <div class="card"><h4>${turnTxt||'Партія'}</h4><div class="wxLog" id="wxLog">${log.map(x=>x.e?`<div class="e">${x.e}</div>`:`<span>${x.s} </span>`).join('')||'<span class="dim">Ходів ще немає</span>'}</div></div>`;
    if(msg)coachSay(msg.h,msg.k||'');
    const lg=$('#wxLog');if(lg)lg.scrollTop=lg.scrollHeight;
    foot();
  }
  function foot(){
    if(over&&NETM){
      const alive=!!(NET.conn&&NET.conn.open);
      $('#pf').innerHTML=(HOST&&alive?`<button class="btn" id="wxAgain">↻ Реванш (кольори міняються)</button>`:alive?`<div class="small mut" style="flex:1;align-self:center">Чекаємо, поки друг почне реванш…</div>`:'')+`<button class="btn g" id="wxMenu">Вийти</button>`;$('#pf').style.display='flex';
      if($('#wxAgain'))$('#wxAgain').onclick=()=>{const fc=makeForecast(),na=Math.max(6,gap());netSend({t:'start',color:human,freq:opt.freq,forecast:fc,nextAt:na});stop(true);CUR=StormRun({...opt,color:other(human),forecast:fc,nextAt:na})};
      $('#wxMenu').onclick=()=>showView('storm');return}
    if(over){$('#pf').innerHTML=`<button class="btn" id="wxAgain">↻ Ще раз</button><button class="btn g" id="wxMenu">Налаштування</button>`;$('#pf').style.display='flex';$('#wxAgain').onclick=()=>{stopCur();CUR=StormRun(opt)};$('#wxMenu').onclick=()=>showView('storm');return}
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
    let h=`<b>${txt}</b><div class="small mut" style="margin-top:4px">Подій погоди за партію: ${ev}.</div>`;
    if(opt.mode==='bot'||NETM){if(winner===human){h='🏆 '+h;confetti&&confetti();addXP&&addXP(30,'Перемога в бурі')}else if(winner)h='😵 '+h}
    snd&&snd(winner?'win':'move');
    render({h,k:winner===human||!winner?'good':'bad'});
  }
  async function afterMove(mv,noAnim){
    busy=true;
    {const n=+g.fen().split(' ')[5];log.push({s:(mv.color==='w'?n+'.':(n-1)+'…')+' '+mv.san})}
    if(st.frozen[mv.to])delete st.frozen[mv.to];
    ply++;
    for(const k of Object.keys(st.frozen)){st.frozen[k]--;if(st.frozen[k]<=0)delete st.frozen[k]}
    if(st.fog>0)st.fog--;
    if(st.secret&&ply>=st.secret.until)st.secret=null;
    if(mv.captured==='q'){await queenCapture(mv);board.skipAnim=true}
    board.last=[mv.from,mv.to];board.arrows=[];board.render(noAnim?undefined:[mv.from,mv.to]);moveSound(mv,g);
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
    if(ply>=nextAt){const k=upcoming||wpick(forecast);upcoming=null;nextAt=ply+gap();await runEvent(k,{})}
  }
  async function runEvent(k,extra){
    if(!me.alive)return;busy=true;const ev=EVENTS[k];
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
    if(!me.alive)return;busy=true;const ev=EVENTS[k];
    const fen=g.fen();const map0=mapOf(g);const turn=g.turn();
    const fogZ=fogR?[W3flipZ(fogR[0]),W3flipZ(fogR[1])]:null;
    const X={turn,fen,human};
    if(k==='ufoBack')st.ufo=null;
    {const r0=$('#board').getBoundingClientRect();if(r0.top<0||r0.bottom>innerHeight){$('#board').scrollIntoView({block:'center'});await sleep(250)}}
    const rect=$('#board').getBoundingClientRect();
    const ctx={...X,res,map0,flip:board.flip,last:board.last,rect,fogZ,hide2D:h=>{$('#board').style.visibility=h?'hidden':''}};
    board.sel=null;board.render();
    try{await play3D(k,ctx)}catch(e){console.warn('storm 3D failed',e);$('#board').style.visibility='';try{W3.on=false;W3.cv&&(W3.cv.style.display='none');W3.ui&&(W3.ui.style.display='none')}catch(_){}await play2D(k,ctx)}
    if(!me.alive){$('#board').style.visibility='';return}
    /* apply */
    if(res.fen!==g.fen()){g=new Chess(res.fen);board.set(g)}
    board.last=null;board.arrows=[];
    if(res.fog){st.fog=res.fog;st.fogR=fogR}
    if(res.freeze)res.freeze.forEach(s=>st.frozen[s]=4);
    if(res.ufo)st.ufo={p:res.ufo.p,at:ply+4};
    if(res.secret){st.secret={...res.secret,show:false,until:ply+6};}
    for(const c of res.ch)if(c.t==='move'&&st.frozen[c.from]){st.frozen[c.to]=st.frozen[c.from];delete st.frozen[c.from]}
    for(const c of res.ch)if(c.t==='kill')delete st.frozen[c.sq];
    board.render();
    if(k!=='ufoBack'){S.storm.seen[k]=(S.storm.seen[k]||0)+1;save()}
    log.push({e:`${ev.i} ${esc(res.note)}`});
    render({h:`${ev.i} <b>${ev.n}</b><br>${esc(res.note)}`,k:res.miss?'':'warn'});
    if(checkOver())return;
    if(g.in_check())snd&&snd('check');
  }
  /* replays the capture as a 3D cutscene: the 2D board still shows the position before the move */
  async function queenCapture(mv){
    if(!me.alive)return;busy=true;
    const u=g.undo();if(!u)return;const map0=mapOf(g);const last0=board.last;g.move({from:u.from,to:u.to,promotion:u.promotion});
    board.sel=null;
    {const r0=$('#board').getBoundingClientRect();if(r0.top<0||r0.bottom>innerHeight){$('#board').scrollIntoView({block:'center'});await sleep(250)}}
    const ctx={turn:g.turn(),fen:g.fen(),res:{fen:g.fen(),ch:[]},map0,flip:board.flip,last:last0,rect:$('#board').getBoundingClientRect(),
      qc:{from:mv.from,to:mv.to,p:mv.piece},cap:qcapCaption(mv.piece),before2D:()=>{board.last=[mv.from,mv.to];board.arrows=[];board.skipAnim=true;board.render()},hide2D:h=>{$('#board').style.visibility=h?'hidden':''}};
    try{await play3D('qcap',ctx)}catch(e){console.warn('capture 3D failed',e);$('#board').style.visibility='';try{W3.on=false;W3.cv&&(W3.cv.style.display='none');W3.ui&&(W3.ui.style.display='none')}catch(_){}await play2D('qcap',ctx)}
    $('#board').style.visibility='';
    if(me.alive){S.storm.qcap=S.storm.qcap||{};S.storm.qcap[mv.piece]=(S.storm.qcap[mv.piece]||0)+1;save();log.push({e:`${QCAP[mv.piece].i} ${QCAP[mv.piece].n}`})}
  }
  me._mv=(from,to)=>{if(busy||over)return'busy';const mv=g.move({from,to,promotion:'q'});if(!mv)return'illegal';afterMove(mv);return'ok'};
  function W3flipZ(rank){/* rank 1..8 → world z of that rank's centre (for fog planes) */const r=rank-1;return board.flip?r-3.5:3.5-r}

  async function botMove(){
    if(over||!me.alive)return;busy=true;render();
    const t0=Date.now();let uci=null;
    const ms=g.moves({verbose:true}).filter(m=>!st.frozen[m.from]);
    if(!ms.length){busy=false;return}
    const sm=Object.keys(st.frozen).length?ms.map(mUci).join(' '):null;
    if(Math.random()<L.rnd){const caps=ms.filter(m=>m.captured);uci=mUci(Math.random()<.5&&caps.length?rnd(caps):rnd(ms))}
    else{try{const a=await (opt.level>=5?botStrongE:botE).analyse(g.fen(),{depth:L.depth,time:L.time,skill:L.skill,searchmoves:sm});uci=a.best}catch(e){}}
    if(!uci||!ms.some(m=>mUci(m)===uci||mUci(m)===uci.slice(0,4)))uci=mUci(rnd(ms));
    const wt=550+Math.random()*450-(Date.now()-t0);if(wt>0)await sleep(wt);
    if(!me.alive||over)return;
    const mv=g.move(uciObj(uci));if(!mv){busy=false;return}
    afterMove(mv);
  }
  me._ev=(k,p)=>{if(busy||over||(NETM&&!HOST))return'busy';runEvent(k,{ufoP:p||{type:'n',color:'w'}}).then(()=>{busy=false;render();sendReady();if(opt.mode==='bot'&&g.turn()!==human&&!over)botMove()});return'ok'};
  function stop(keepNet){me.alive=false;delete board.targets;delete board.render;$('#board').style.visibility='';board.arrows=[];
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
  let mode=S.stormMode||'bot',lvl=S.playLevel??1,col='w',freq=S.stormFreq||'normal',autoFlip=!!S.stormFlip;
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
        <div class="small mut" style="margin-top:6px">Приблизно кожні ${Math.round(FREQ[freq][1][0]/2)}–${Math.round(FREQ[freq][1][1]/2)} ходів.</div></div>
      <div class="card"><h4>📖 Можлива погода</h4>${POOL.map(k=>`<div class="wxEv" style="${seen[k]?'':'opacity:.75'}"><span class="i">${EVENTS[k].i}</span><div style="flex:1"><b>${EVENTS[k].n}</b> <span class="tag" style="background:${RAR[EVENTS[k].rar].col};color:#111">${RAR[EVENTS[k].rar].n}</span>${seen[k]?` <span class="small dim">бачив ×${seen[k]}</span>`:''}<div class="small mut">${EVENTS[k].d}</div></div></div>`).join('')}</div>`,
      mode==='net'?`<button class="btn" id="wxInvite">🔗 Створити запрошення</button>`:`<button class="btn" id="wxStart">🌪 Грати</button>`);
    coachSay('Звичайні шахи на звичайній дошці. Але раз на кілька ходів камера відривається від дошки, фігури встають, і за вікном щось починається. Перед кожною партією по радіо дають прогноз: 4 види погоди, які можуть трапитися.');
    document.querySelectorAll('[data-m]').forEach(e=>e.onclick=()=>{mode=e.dataset.m;S.stormMode=mode;save();players(plHtml(mode==='bot'?'Бот':'Друг','','b'),plHtml('Ти','','w'));ui()});
    document.querySelectorAll('[data-lv]').forEach(e=>e.onclick=()=>{lvl=+e.dataset.lv;ui()});
    document.querySelectorAll('[data-c]').forEach(e=>e.onclick=()=>{col=e.dataset.c;ui()});
    document.querySelectorAll('[data-f]').forEach(e=>e.onclick=()=>{freq=e.dataset.f;S.stormFreq=freq;save();ui()});
    if($('#wxAF'))$('#wxAF').onchange=e=>{autoFlip=e.target.checked;S.stormFlip=autoFlip;save()};
    if($('#wxStart'))$('#wxStart').onclick=()=>{panel('🌪 Шахи-Буря','','');CUR=StormRun({mode,level:lvl,color:col,freq,autoFlip})};
    if($('#wxInvite'))$('#wxInvite').onclick=()=>hostWait(col,freq);
  }
  ui();
};

/* host: create an invite link and wait for the friend */
function hostWait(col,freq){
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
      <div class="card small">⏳ Чекаємо друга… Ти граєш <b>${myC==='w'?'білими':'чорними'}</b>, погода: <b>${FREQ[freq][0].toLowerCase()}</b>.</div>`);
    bindCancel();
    coachSay('Надішли це посилання другу. Щойно він його відкриє, партія почнеться в обох.');
    $('#wxCopy').onclick=()=>{const t=$('#wxLink');t.select();(navigator.clipboard?navigator.clipboard.writeText(link):Promise.reject()).then(()=>toast('Посилання скопійовано')).catch(()=>{document.execCommand('copy');toast('Посилання скопійовано')})};
    if($('#wxShare'))$('#wxShare').onclick=()=>navigator.share({title:'Шахи-Буря',text:'Зіграймо в Шахи-Бурю! 🌪',url:link}).catch(()=>{});
  },()=>{
    const fc=makeForecast(),na=Math.max(6,FREQ[freq][1][0]+Math.floor(Math.random()*(FREQ[freq][1][1]-FREQ[freq][1][0]+1)));
    netSend({t:'start',color:other(myC),freq,forecast:fc,nextAt:na});
    snd&&snd('good');
    if(CUR&&CUR.stop)CUR.stop(true);CUR=null;panel('🌪 Шахи-Буря','','');
    CUR=StormRun({mode:'net',host:true,color:myC,freq,forecast:fc,nextAt:na});
  },e=>{show(`<div class="card" style="border:2px solid var(--red)">${esc(netErr(e))}</div>`,`<button class="btn" id="wxRetry">Спробувати ще раз</button><button class="btn g" id="wxCancel">Назад</button>`);bindCancel();$('#wxRetry').onclick=()=>hostWait(col,freq)}).catch(()=>{show(`<div class="card" style="border:2px solid var(--red)">Не вдалося завантажити модуль гри по мережі. Перевір інтернет.</div>`);bindCancel()});
}

/* ================= SECRET ANIMATION GALLERY =================
   Type 20118 anywhere (not in a text field) → password window → 8888 → watch any event. */
const GAL_FEN='r1bqk2r/pp1n1ppp/2pbpn2/3p4/2PP4/2N1PN2/PPQ1BPPP/R1B1K2R w KQkq - 0 8';
/* demo positions: white captures the black queen with the given piece */
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
    <h4 style="margin:4px 0 6px">💥 Взяття ферзя</h4><div class="list">${caps.map(p=>`<div class="it" data-gq="${p}"><img src="${PIC('w',p)}" width="28"><span class="nm">${QCAP[p].n}</span><span class="tag" style="background:var(--gold);color:#111">${'★'.repeat(QTIER[p])}${'☆'.repeat(4-QTIER[p])}</span></div>`).join('')}</div>
    <h4 style="margin:12px 0 6px">🌪 Погода</h4><div class="list">${list.map(k=>`<div class="it" data-gk="${k}"><span style="font-size:22px;width:30px;text-align:center">${EVENTS[k].i}</span><span class="nm">${EVENTS[k].n}${k==='ufoBack'?' (повернення)':''}</span><span class="tag" style="background:${RAR[EVENTS[k].rar].col};color:#111">${RAR[EVENTS[k].rar].n}</span></div>`).join('')}</div></div>
    <button class="btn g" style="width:100%;margin-top:10px" onclick="closeModal()">Закрити</button>`);
  document.querySelectorAll('[data-gk]').forEach(e=>e.onclick=()=>{closeModal();galleryRun(GAL_FEN,r=>r._ev(e.dataset.gk,{type:'b',color:'b'}))});
  document.querySelectorAll('[data-gq]').forEach(e=>e.onclick=()=>{closeModal();const d=CAPDEMO[e.dataset.gq];galleryRun(d.fen,r=>r._mv(d.m[0],d.m[1]))});
}
function galleryRun(fen,act){
  if(CUR&&CUR.busy&&CUR.busy()){toast('Зачекай, поки закінчиться поточна анімація');return}
  if(CUR&&CUR.stop)CUR.stop();
  CUR=StormRun({mode:'friend',freq:'rare',gallery:true,noPick:true,fen});
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

/* guest: opened an invite link */
function joinInvite(code){
  showView('storm');
  const show=(html,foot)=>panel('🌐 Гра по мережі',`<div id="coachBox"></div>${html}`,foot||`<button class="btn g" id="wxCancel">Скасувати</button>`);
  const bindCancel=()=>{if($('#wxCancel'))$('#wxCancel').onclick=()=>{netClose();showView('storm')}};
  show(`<div class="card">⏳ Підключаюся до друга (код <b>${esc(code)}</b>)…</div>`);bindCancel();
  coachSay('Тебе запросили в Шахи-Бурю! Звичайні шахи, але погода за вікном змінює партію.');
  CUR={stop(keep){if(!keep)netClose()}};
  netJoin(code,()=>{show(`<div class="card">✅ З’єднано! Чекаю на початок партії…</div>`);bindCancel()},
    e=>{show(`<div class="card" style="border:2px solid var(--red)">${esc(netErr(e))}</div>`,`<button class="btn" id="wxRetry">Спробувати ще раз</button><button class="btn g" id="wxCancel">Назад</button>`);bindCancel();$('#wxRetry').onclick=()=>joinInvite(code)}).catch(()=>{show(`<div class="card" style="border:2px solid var(--red)">Не вдалося завантажити модуль гри по мережі. Перевір інтернет.</div>`);bindCancel()});
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
