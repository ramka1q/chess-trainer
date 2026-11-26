/* ================= 3D CINEMATICS for checkmate =================
   Ten original scenes built in code with three.js. The soundtrack of every scene is synthesised
   live with Web Audio (own music, nothing recorded or downloaded). No words on screen.
   window.playCinema({color, piece, kingColor, level?1|2|3, scene?0..9, speed?}) -> Promise */
(function(){
'use strict';
const LOWC=(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||innerWidth<760||(navigator.hardwareConcurrency||8)<=4;

/* ---------------- own synthesiser ---------------- */
function makeSynth(speed){
  let a=null;try{if(typeof S!=='undefined'&&S.sound===false)return null;a=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}
  const master=a.createGain();master.gain.value=.85;const comp=a.createDynamicsCompressor();master.connect(comp).connect(a.destination);
  const t0=a.currentTime+.05,sp=speed||1,T=x=>t0+x/sp;
  const env=(g,at,dur,peak,att,rel)=>{g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(peak,at+att);g.gain.setValueAtTime(peak,at+Math.max(att,dur-rel));g.gain.exponentialRampToValueAtTime(.0001,at+dur)};
  const tone=(f,at,dur,{type='sine',g=.1,f2=null,att=.01,rel=.2,det=0}={})=>{dur/=sp;const st=T(at);const o=a.createOscillator();o.type=type;o.detune.value=det;o.frequency.setValueAtTime(f,st);if(f2)o.frequency.exponentialRampToValueAtTime(f2,st+dur);const gn=a.createGain();env(gn,st,dur,g,Math.min(att/sp,dur*.9),Math.min(rel/sp,dur*.8));o.connect(gn).connect(master);o.start(st);o.stop(st+dur+.05)};
  let nb=null;const buf=()=>{if(nb)return nb;const n=a.sampleRate*2;nb=a.createBuffer(1,n,a.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return nb};
  const noise=(at,dur,{type='lowpass',f=800,f2=null,q=.7,g=.3,att=.01,rel=.3}={})=>{dur/=sp;const st=T(at);const s=a.createBufferSource();s.buffer=buf();s.loop=true;const fl=a.createBiquadFilter();fl.type=type;fl.Q.value=q;fl.frequency.setValueAtTime(f,st);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,st+dur);const gn=a.createGain();env(gn,st,dur,g,Math.min(att/sp,dur*.9),Math.min(rel/sp,dur*.8));s.connect(fl).connect(gn).connect(master);s.start(st);s.stop(st+dur+.05)};
  const drum=(at,g=.8,f=120)=>{tone(f,at,.5,{f2:f*.32,g,att:.002,rel:.4});noise(at,.18,{f:220,g:g*.5,att:.002,rel:.15})};
  const choir=(notes,at,dur,g=.03)=>notes.forEach(f=>[-6,0,6].forEach(d=>tone(f,at,dur,{type:'sawtooth',g,det:d,att:dur*.3,rel:dur*.4})));
  const bell=(f,at,g=.06)=>{tone(f,at,2.2,{g,att:.005,rel:2});tone(f*2.76,at,1.4,{g:g*.4,att:.005,rel:1.2});tone(f*5.4,at,.8,{g:g*.2,att:.005,rel:.7})};
  const whoosh=(at,g=.3)=>noise(at,.32,{type:'bandpass',f:700,f2:4200,q:2,g,att:.03,rel:.25});
  const riser=(at,dur,g=.3)=>{noise(at,dur,{type:'bandpass',f:250,f2:6000,q:2.5,g,att:dur*.9,rel:.2});tone(110,at,dur,{type:'sawtooth',g:.05,f2:440,att:dur*.85,rel:.2})};
  const impact=(at,g=1)=>{drum(at,g);noise(at,2.2,{f:180,f2:30,g,att:.005,rel:1.9});tone(220,at,1.8,{f2:28,g:g*.45});noise(at,1.4,{type:'highpass',f:3000,g:g*.22,att:.005,rel:1.2})};
  return{tone,noise,drum,choir,bell,whoosh,riser,impact,duck(on){try{master.gain.setTargetAtTime(on?.32:.85,a.currentTime,.15)}catch(e){}},stop(){try{master.gain.cancelScheduledValues(a.currentTime);master.gain.setValueAtTime(master.gain.value,a.currentTime);master.gain.linearRampToValueAtTime(0,a.currentTime+.4);setTimeout(()=>a.close(),700)}catch(e){}}};
}
/* a scored track from a few parameters: drone, choir, drums speeding up, riser into the climax */
function score(M,{dur,root=55,minor=true,bpm=100,climax,bells=0,extra}){
  if(!M)return;const third=root*(minor?1.189:1.26),fifth=root*1.498;
  M.tone(root,0,dur,{g:.11,att:1.5,rel:1.5});M.tone(root*1.004,0,dur,{type:'triangle',g:.05,att:2,rel:2});
  M.noise(0,Math.min(10,dur),{f:300,f2:900,g:.05,att:2.5,rel:2});
  M.choir([root*2,third*2,fifth*2],.4,climax-.4,.022);
  const beat=60/bpm;for(let t=climax*.25;t<climax-.2;t+=beat){const k=t/climax;M.drum(t,.25+k*.6,110+k*30)}
  for(let i=0;i<bells;i++)M.bell([root*8,third*8,fifth*8,root*16][i%4],1+i*(climax-2)/Math.max(1,bells));
  M.riser(Math.max(0,climax-3.2),3.1);
  M.impact(climax);M.choir([root*2.38,third*2.38,fifth*2.38],climax+.3,Math.max(1.5,dur-climax),.028);
  M.tone(root*16,climax+1.2,1.6,{g:.04});M.tone(root*24,climax+1.5,1.4,{g:.03});
  extra&&extra(M);
}

/* ---------------- textures drawn in code ---------------- */
const tex={};
function glowTex(T){if(tex.g)return tex.g;const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return tex.g=new T.CanvasTexture(c)}
function runeTex(T,col){ /* a chess-themed magic circle: rings, a diamond 8×8 board, chess symbols, compass ticks (no stars) */
  const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.translate(256,256);x.strokeStyle=col;x.fillStyle=col;x.shadowColor=col;x.shadowBlur=14;
  [244,206,150].forEach((r,i)=>{x.lineWidth=i===1?2:4;x.setLineDash(i===1?[10,12]:[]);x.beginPath();x.arc(0,0,r,0,Math.PI*2);x.stroke()});x.setLineDash([]);
  x.lineWidth=2;for(let i=0;i<48;i++){const a=i/48*Math.PI*2,r0=i%4?232:222;x.beginPath();x.moveTo(Math.cos(a)*r0,Math.sin(a)*r0);x.lineTo(Math.cos(a)*244,Math.sin(a)*244);x.stroke()}
  x.save();x.rotate(Math.PI/4);const q=13;for(let i=0;i<8;i++)for(let j=0;j<8;j++){if((i+j)%2)continue;x.globalAlpha=.55;x.fillRect(-52+i*q,-52+j*q,q,q)}x.globalAlpha=1;x.lineWidth=3;x.strokeRect(-52,-52,104,104);x.restore();
  x.font='bold 30px serif';x.textAlign='center';x.textBaseline='middle';const g='♔♕♖♗♘♙♚♛♜♝♞♟';for(let i=0;i<24;i++){const a=i/24*Math.PI*2;x.save();x.rotate(a);x.fillText(g[i%12],0,-178);x.restore()}
  return new T.CanvasTexture(c)}
function checkerTex(T,a,b,line){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');for(let i=0;i<8;i++)for(let j=0;j<8;j++){x.fillStyle=(i+j)%2?a:b;x.fillRect(i*64,j*64,64,64)}x.strokeStyle=line;x.lineWidth=2;x.shadowColor=line;x.shadowBlur=8;for(let i=0;i<=8;i++){x.beginPath();x.moveTo(i*64,0);x.lineTo(i*64,512);x.stroke();x.beginPath();x.moveTo(0,i*64);x.lineTo(512,i*64);x.stroke()}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;return t}
function pieceTex(T,src){return new Promise(res=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').drawImage(im,0,0,256,256);res(new T.CanvasTexture(c))};im.onerror=()=>res(null);im.src=src})}

/* ---------------- the engine ---------------- */
async function engine(I,sceneFn){
  const T=window.THREE||await window.loadThree();
  const speed=I.speed||1;
  const cv=document.createElement('canvas');cv.id='cineCv';cv.style.cssText='position:fixed;inset:0;z-index:980;width:100vw;height:100vh;background:#000';document.body.appendChild(cv);
  const ui=document.createElement('button');ui.textContent='⏭';ui.title='Пропустити';ui.style.cssText='position:fixed;right:16px;bottom:16px;z-index:992;background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:50%;width:48px;height:48px;font-size:20px;cursor:pointer';document.body.appendChild(ui);
  const white=document.createElement('div');white.style.cssText=`position:fixed;inset:0;z-index:991;background:${I.veil||'#fff'};opacity:1;pointer-events:none;transition:opacity ${I.veilIn||.9}s`;document.body.appendChild(white);
  const R=new T.WebGLRenderer({canvas:cv,antialias:!LOWC,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio||1,LOWC?1:1.5));
  const scene=new T.Scene();scene.background=new T.Color(0x020006);scene.fog=new T.FogExp2(0x05010d,.045);
  const cam=new T.PerspectiveCamera(50,1,.05,500);
  const resize=()=>{R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};resize();addEventListener('resize',resize);
  const ADD=T.AdditiveBlending,G=glowTex(T);
  const [atkTex,kingTex]=await Promise.all([pieceTex(T,PIC(I.color,I.piece)),pieceTex(T,PIC(I.kingColor,'k'))]);
  /* every piece picture (the long films use whole armies) */
  const pt={};await Promise.all(['w','b'].flatMap(c=>['p','n','b','r','q','k'].map(async p=>{pt[c+p]=await pieceTex(T,PIC(c,p))})));
  const C={T,scene,cam,R,G,ADD,atkTex,kingTex,pt,I,canvas:cv,skipBtn:ui,veil:white,LOW:LOWC,BLUE:new T.Color(0x4fc3f7),RED:new T.Color(0xff1744),VIO:new T.Color(0xb388ff),GOLD:new T.Color(0xffd54f),WHITE:new T.Color(0xffffff)};
  const add=o=>{scene.add(o);return o};C.add=add;
  const ups=[],bills=[];C.every=f=>ups.push(f);C.bills=bills;
  const endFns=[];C.onEnd=f=>endFns.push(f);
  /* timed events: C.at(time, fn) fires once when the (scene) clock passes time */
  const evq=[];C.at=(t,f)=>{evq.push({t,f});evq.sort((a,b)=>a.t-b.t)};
  const fired=new Set();C.once=(id,f)=>{if(!fired.has(id)){fired.add(id);f()}};
  C.lerp=(a,b,k)=>a+(b-a)*k;C.clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));C.ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;C.V=(x,y,z)=>new T.Vector3(x,y,z);
  C.shake=0;
  C.sprite=(col,size,op=0)=>{const s=new T.Sprite(new T.SpriteMaterial({map:G,color:col,blending:ADD,transparent:true,depthWrite:false,opacity:op}));s.scale.set(size,size,1);return add(s)};
  /* a piece as a glowing standee that always faces the camera */
  C.char=(t,col,x,z=0,size=2.4)=>{const g=add(new T.Group());const m=new T.Mesh(new T.PlaneGeometry(size,size),new T.MeshBasicMaterial({map:t,transparent:true,alphaTest:.05,side:T.DoubleSide,fog:false}));m.position.y=size*.52;g.add(m);bills.push(m);
    const glow=new T.Sprite(new T.SpriteMaterial({map:G,color:col,blending:ADD,transparent:true,depthWrite:false,opacity:0}));glow.scale.set(size*2.1,size*2.1,1);glow.position.y=size*.54;g.add(glow);
    /* a light rim behind the piece so even a black piece reads on a dark background */
    const rim=new T.Mesh(new T.PlaneGeometry(size*1.08,size*1.08),new T.MeshBasicMaterial({map:t,color:col,transparent:true,opacity:.9,blending:ADD,depthWrite:false,side:T.DoubleSide,fog:false}));rim.position.set(0,size*.52,-.02);g.add(rim);bills.push(rim);
    g.position.set(x,0,z);return{g,m,glow,size,rim}};
  C.ghost=(t,col)=>{const m=add(new T.Mesh(new T.PlaneGeometry(2.4,2.4),new T.MeshBasicMaterial({map:t,transparent:true,opacity:0,color:col,blending:ADD,depthWrite:false,side:T.DoubleSide,fog:false})));bills.push(m);return m};
  /* sparks */
  const NS=LOWC?300:800;const sg=new T.BufferGeometry();const sp=new Float32Array(NS*3).fill(-999),sv=new Float32Array(NS*3),sl=new Float32Array(NS),sc=new Float32Array(NS*3);
  sg.setAttribute('position',new T.BufferAttribute(sp,3));sg.setAttribute('color',new T.BufferAttribute(sc,3));
  add(new T.Points(sg,new T.PointsMaterial({size:.15,vertexColors:true,transparent:true,blending:ADD,depthWrite:false,map:G})));let sNext=0;
  C.spark=(p,v,life,col)=>{const i=sNext++%NS;sp[i*3]=p.x;sp[i*3+1]=p.y;sp[i*3+2]=p.z;sv[i*3]=v.x;sv[i*3+1]=v.y;sv[i*3+2]=v.z;sl[i]=life;sc[i*3]=col.r;sc[i*3+1]=col.g;sc[i*3+2]=col.b};
  C.burst=(p,cols,n,speed)=>{n=Math.round(n*(LOWC?.45:1));for(let k=0;k<n;k++){const v=new T.Vector3(Math.random()-.5,Math.random()-.3,Math.random()-.5).normalize().multiplyScalar(speed*(.4+Math.random()));C.spark(p,v,.6+Math.random()*.8,cols[k%cols.length])}};
  /* floating dust / star field */
  C.dust=(n,col,spread=40,h=12,size=.08)=>{n=Math.round(n*(LOWC?.4:1));const g=new T.BufferGeometry(),d=new Float32Array(n*3);for(let i=0;i<n;i++){d[i*3]=(Math.random()-.5)*spread;d[i*3+1]=Math.random()*h;d[i*3+2]=(Math.random()-.5)*spread}g.setAttribute('position',new T.BufferAttribute(d,3));const pts=add(new T.Points(g,new T.PointsMaterial({color:col,size,transparent:true,opacity:.75,blending:ADD,depthWrite:false})));C.every((t,dt)=>{for(let i=0;i<n;i++){d[i*3+1]+=dt*.15;if(d[i*3+1]>h)d[i*3+1]=0}g.attributes.position.needsUpdate=true});return pts};
  C.stars=(n=1500,r=120)=>{n=Math.round(n*(LOWC?.4:1));const g=new T.BufferGeometry(),d=new Float32Array(n*3);for(let i=0;i<n;i++){const u=Math.random()*2-1,a=Math.random()*Math.PI*2,s=Math.sqrt(1-u*u);d[i*3]=Math.cos(a)*s*r;d[i*3+1]=Math.abs(u)*r*.9+2;d[i*3+2]=Math.sin(a)*s*r}g.setAttribute('position',new T.BufferAttribute(d,3));return add(new T.Points(g,new T.PointsMaterial({color:0xffffff,size:.5,transparent:true,opacity:.9,fog:false,depthWrite:false})))};
  /* rings, beams, slash marks */
  const rings=[];C.ring=(p,col,t,maxR,dur,thick=.05)=>{const m=add(new T.Mesh(new T.TorusGeometry(1,thick,8,64),new T.MeshBasicMaterial({color:col,transparent:true,blending:ADD,depthWrite:false})));m.position.copy(p);m.rotation.x=Math.PI/2;m.visible=false;rings.push({m,t,maxR,dur})};
  C.beam=(col,r)=>{const m=add(new T.Mesh(new T.CylinderGeometry(r,r,1,18,1,true),new T.MeshBasicMaterial({color:col,transparent:true,opacity:0,blending:ADD,depthWrite:false})));const core=add(new T.Mesh(new T.CylinderGeometry(r*.4,r*.4,1,12,1,true),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:ADD,depthWrite:false})));return{m,core}};
  C.setBeam=(b,a,c,op)=>{const d=new T.Vector3().subVectors(c,a);const len=Math.max(.001,d.length());[b.m,b.core].forEach(x=>{x.position.copy(a).addScaledVector(d,.5);x.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());x.scale.set(1,len,1)});b.m.material.opacity=op;b.core.material.opacity=op};
  const slashes=[];C.slash=(p,col=0xffffff)=>{let s=slashes.find(x=>x.material.opacity<=0);if(!s){s=add(new T.Mesh(new T.PlaneGeometry(3.4,.07),new T.MeshBasicMaterial({color:col,transparent:true,opacity:0,blending:ADD,depthWrite:false,side:T.DoubleSide})));slashes.push(s)}s.material.color.set(col);s.position.copy(p);s.quaternion.copy(cam.quaternion);s.rotateZ(Math.random()*Math.PI);s.material.opacity=1};
  C.rune=(col,size,x,z)=>{const m=add(new T.Mesh(new T.PlaneGeometry(size,size),new T.MeshBasicMaterial({map:runeTex(T,col),transparent:true,blending:ADD,depthWrite:false,opacity:0})));m.rotation.x=-Math.PI/2;m.position.set(x,.03,z);return m};
  C.floor=(col=0x07030d,map=null,size=120)=>{const m=add(new T.Mesh(new T.CircleGeometry(size,64),new T.MeshBasicMaterial({color:map?0xffffff:col,map})));m.rotation.x=-Math.PI/2;return m};
  /* the king breaks into pieces of its own picture */
  C.shatter=(ch,dir=1)=>{const n=LOWC?12:25;ch.m.visible=false;if(ch.rim)ch.rim.visible=false;ch.glow.material.opacity=0;const base=ch.g.position.clone();for(let i=0;i<n;i++){const m=add(new T.Mesh(new T.PlaneGeometry(.48,.48),new T.MeshBasicMaterial({map:C.kingTex,transparent:true,side:T.DoubleSide,fog:false})));const u=(i%5)/5,v=Math.floor(i/5)/5;const uv=m.geometry.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,u+uv.getX(k)*.2,v+uv.getY(k)*.2);
      m.position.copy(base).add(new T.Vector3((u-.4)*2.2,v*2.2+.2,0));const vel=new T.Vector3(dir*(2+Math.random()*6),(Math.random()-.1)*6,(Math.random()-.5)*6);C.every((t,dt)=>{if(m.material.opacity<=0)return;m.position.addScaledVector(vel,dt);vel.y-=4*dt;m.rotation.x+=dt*5;m.rotation.z+=dt*4;m.material.opacity=Math.max(0,m.material.opacity-dt*.45)})}};
  C.flash=(op=.85,ms=1100)=>{white.style.background='#fff';white.style.transition='opacity .1s';white.style.opacity=op;setTimeout(()=>{white.style.transition=`opacity ${ms}ms`;white.style.opacity=0},120)};
  /* a sky dome with a vertical gradient (and matching fog) */
  C.sky=(top,mid,bottom,fogCol,fogD=.02)=>{const c=document.createElement('canvas');c.width=8;c.height=256;const x=c.getContext('2d');const gr=x.createLinearGradient(0,0,0,256);gr.addColorStop(0,top);gr.addColorStop(.55,mid);gr.addColorStop(1,bottom);x.fillStyle=gr;x.fillRect(0,0,8,256);
    const m=add(new T.Mesh(new T.SphereGeometry(200,32,16),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),side:T.BackSide,fog:false,depthWrite:false})));scene.background=new T.Color(bottom);scene.fog=new T.FogExp2(fogCol,fogD);return m};
  C.ground=(col,size=200,y=0)=>{const m=add(new T.Mesh(new T.CircleGeometry(size,64),new T.MeshBasicMaterial({color:col})));m.rotation.x=-Math.PI/2;m.position.y=y;return m};
  /* our cosy room (walls, window with daylight, table, lamp) — it can dissolve into glowing dust */
  C.room=()=>{const parts=[];const box=(w,h,d,col,x,y,z)=>{const m=add(new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({color:col,transparent:true,opacity:1})));m.position.set(x,y,z);parts.push(m);return m};
    box(26,.3,26,0x5a3d26,0,-.16,0);                 /* wooden floor */
    box(26,14,.4,0x463631,0,7,-12);                   /* back wall */
    box(.4,14,26,0x3f302b,-13,7,0);box(.4,14,26,0x3f302b,13,7,0);
    box(26,.4,26,0x2e2420,0,14,0);                    /* ceiling */
    const win=box(8,5.5,.2,0x9fd3ff,0,7.5,-11.7);       /* window with daylight */
    box(8.6,.4,.5,0xd9cfbf,0,10.4,-11.6);box(8.6,.4,.5,0xd9cfbf,0,4.6,-11.6);box(.4,5.9,.5,0xd9cfbf,-4.2,7.5,-11.6);box(.4,5.9,.5,0xd9cfbf,4.2,7.5,-11.6);
    box(9,.35,6,0x6b4a30,0,-.02,0);                   /* the table the board stands on */
    box(.5,3,.5,0x6b4a30,-4,-1.6,2.5);box(.5,3,.5,0x6b4a30,4,-1.6,2.5);
    box(2.2,8,.3,0x7b2f2f,-6.4,7.3,-11.4);box(2.2,8,.3,0x7b2f2f,6.4,7.3,-11.4); /* curtains */
    const cup=add(new T.Mesh(new T.CylinderGeometry(.45,.35,.8,20),new T.MeshBasicMaterial({color:0xf2efe8,transparent:true})));cup.position.set(3.2,.5,1.4);parts.push(cup);
    const lamp=C.sprite(0xffc98a,9,.55);lamp.position.set(-8,9,-6);
    const sun=C.sprite(0xfff3c4,7,.6);sun.position.set(0,7.5,-11.4);
    /* glowing dust sampled on every surface */
    const N=LOWC?1500:4200;const g=new T.BufferGeometry(),pos=new Float32Array(N*3),col=new Float32Array(N*3),vel=new Float32Array(N*3);
    const areas=parts.map(m=>{const p=m.geometry.parameters;return Math.max(.2,(p.width||1)*(p.height||1)+(p.height||1)*(p.depth||1)+(p.width||1)*(p.depth||1))});const tot=areas.reduce((a,b)=>a+b,0);
    let k=0;parts.forEach((m,i)=>{const n=Math.round(N*areas[i]/tot);const p=m.geometry.parameters;const cc=m.material.color;for(let j=0;j<n&&k<N;j++,k++){const w=p.width||p.radiusTop*2||1,h=p.height||1,d=p.depth||p.radiusTop*2||1;
      pos[k*3]=m.position.x+(Math.random()-.5)*w;pos[k*3+1]=m.position.y+(Math.random()-.5)*h;pos[k*3+2]=m.position.z+(Math.random()-.5)*d;col[k*3]=cc.r*1.6;col[k*3+1]=cc.g*1.6;col[k*3+2]=cc.b*1.6;
      const dir=new T.Vector3(pos[k*3],pos[k*3+1]-3,pos[k*3+2]).normalize();vel[k*3]=dir.x*(2+Math.random()*6);vel[k*3+1]=1+Math.random()*4;vel[k*3+2]=dir.z*(2+Math.random()*6)}});
    g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('color',new T.BufferAttribute(col,3));g.setDrawRange(0,k);
    const dust=add(new T.Points(g,new T.PointsMaterial({size:.16,vertexColors:true,transparent:true,opacity:0,blending:ADD,depthWrite:false,map:G})));
    return{parts,dissolve(t0,dur){C.every((t,dt)=>{const q=C.clamp((t-t0)/dur);if(q<=0)return;
      parts.forEach((m,i)=>{const local=C.clamp(q*1.6-(i/parts.length)*.6);m.material.opacity=1-local;m.visible=local<1});lamp.material.opacity=.55*(1-q);sun.material.opacity=.6*(1-q);
      dust.material.opacity=q<.5?q*2:Math.max(0,2-q*2);for(let i=0;i<k;i++){pos[i*3]+=vel[i*3]*dt*q;pos[i*3+1]+=vel[i*3+1]*dt*q;pos[i*3+2]+=vel[i*3+2]*dt*q}g.attributes.position.needsUpdate=true;
      if(q>0)C.once('dissolve'+t0,()=>{if(C.M){C.M.riser(t0,dur*.8,.25);C.M.noise(t0,dur,{type:'highpass',f:2500,f2:8000,g:.12,att:dur*.5,rel:.4});for(let i=0;i<10;i++)C.M.tone(1500+Math.random()*2500,t0+i*dur/10,.5,{type:'triangle',g:.03})}})})}};
  };
  C.M=makeSynth(speed);
  /* the scene script */
  const S=sceneFn(C);const DUR=S.dur;
  let start=null,last=0,ended=false,finish;const done=new Promise(r=>finish=r);
  const cleanup=()=>{removeEventListener('resize',resize);endFns.forEach(f=>{try{f()}catch(e){}});try{R.dispose()}catch(e){}cv.remove();ui.remove();if(!I.keepVeil)white.remove()};
  const end=()=>{if(ended)return;ended=true;C.M&&C.M.stop();if(I.veilOut)white.style.background=I.veilOut;white.style.transition='opacity .35s';white.style.opacity=1;setTimeout(()=>{cleanup();finish(white)},400)};
  C.end=end;
  I.onStart&&I.onStart(C);
  ui.onclick=end;
  const frame=now=>{
    if(ended)return;requestAnimationFrame(frame);
    if(start===null){start=now-(I.seek||0)*1000/speed;last=now;requestAnimationFrame(()=>{if(!ended)white.style.opacity=0});if(I.seek)evq.forEach(e=>{if(e.t<I.seek-.05)e.done=1})}
    const raw=(now-start)/1000*speed,dt=Math.min(.05,(now-last)/1000)*speed;last=now;
    if(raw>=DUR){end();return}
    /* a scene may bend time (slow motion, rewind) */
    const t=S.warp?S.warp(raw):raw;C.raw=raw;C.t=t;
    for(const e of evq){if(e.t>t)break;if(!e.done){e.done=1;try{e.f(t)}catch(err){console.warn(err)}}}
    const[cp,cl]=S.cam(t);cam.position.copy(cp);cam.position.x+=(Math.random()-.5)*C.shake;cam.position.y+=(Math.random()-.5)*C.shake;cam.lookAt(cl);C.shake*=Math.pow(.02,dt);
    bills.forEach(m=>m.quaternion.copy(cam.quaternion));
    for(let i=0;i<NS;i++){if(sl[i]<=0)continue;sl[i]-=dt;sp[i*3]+=sv[i*3]*dt;sp[i*3+1]+=sv[i*3+1]*dt;sp[i*3+2]+=sv[i*3+2]*dt;sv[i*3+1]-=3*dt;if(sl[i]<=0)sp[i*3+1]=-999}sg.attributes.position.needsUpdate=true;
    rings.forEach(r=>{const k=(t-r.t)/r.dur;if(k<0){r.m.visible=false;return}r.m.visible=k<1;const s=.2+k*r.maxR;r.m.scale.set(s,s,s);r.m.material.opacity=1-k});
    slashes.forEach(s=>s.material.opacity=Math.max(0,s.material.opacity-dt*.7));
    ups.forEach(f=>f(t,dt));
    R.render(scene,cam);
  };
  requestAnimationFrame(frame);
  return await done;
}

/* ---------------- shared pieces of choreography ---------------- */
const orbit=(C,c,r,h,a)=>[C.V(c.x+Math.sin(a)*r,h,c.z+Math.cos(a)*r),c];
function dashSeq(C,ch,ghostCol,center,t0,n,gap,dur=.34,col){
  const gh=[];for(let i=0;i<6;i++)gh.push(C.ghost(C.atkTex,ghostCol));
  const ds=[];for(let i=0;i<n;i++){const a=i*2.39+.3,h=.6+Math.random()*1.6;ds.push({t:t0+i*gap,a:C.V(center.x+Math.cos(a)*9,h,center.z+Math.sin(a)*9),b:C.V(center.x-Math.cos(a)*9,2.2-h*.4,center.z-Math.sin(a)*9)})}
  C.every(t=>{let active=false;ds.forEach((d,i)=>{const k=(t-d.t)/dur;if(k<0||k>1)return;active=true;const p=new C.T.Vector3().lerpVectors(d.a,d.b,C.ease(k));ch.g.visible=true;ch.g.position.set(p.x,p.y-1.25,p.z);ch.glow.material.opacity=.9;
      gh.forEach((g,j)=>{g.position.lerpVectors(d.a,d.b,C.clamp(C.ease(k)-j*.06));g.material.opacity=.45*(1-j/gh.length)});
      if(k>.45)C.once('dash'+t0+i,()=>{C.slash(center.clone().setY(1.3),col);C.burst(center.clone().setY(1.3),[C.WHITE,col||C.BLUE],36,5);C.shake=.25})});
    if(!active){gh.forEach(g=>g.material.opacity*=.85);if(t>t0&&t<t0+n*gap+.5)ch.g.visible=false}});
  if(C.M)for(let i=0;i<n;i++){C.M.whoosh(t0+i*gap);C.M.tone(1700+Math.random()*900,t0+i*gap+.16,.35,{type:'triangle',g:.05,f2:900})}
}
function strike(C,from,to,col,t,beamR=.9){const b=C.beam(col,beamR);C.every(tt=>{if(tt<t)return;const k=C.clamp((tt-t)/.45);C.setBeam(b,from(),new C.T.Vector3().lerpVectors(from(),to().clone().add(C.V(6,0,0)),k),tt<t+1.3?.95:Math.max(0,.95-(tt-t-1.3)*1.5))});}
function kingEnd(C,king,t,cols){C.every(tt=>{if(tt>=t)C.once('kend'+t,()=>{const p=king.g.position.clone().setY(1.3);C.shatter(king);C.ring(p,cols[0],t,12,1.4);C.ring(p,0xffffff,t+.15,8,1.1);C.burst(p,cols.concat([C.WHITE]),300,10);C.shake=1.1;C.flash()})})}

/* ---------------- the ten scenes ---------------- */
const SCENES=[
/* 1. Тисяча ривків — the attacker cuts through the king again and again */
C=>{const k=C.char(C.kingTex,C.RED,0),a=C.char(C.atkTex,C.BLUE,-6);a.g.visible=false;C.floor();const rn=C.rune('#ff4d6d',7,0,0);C.dust(600,0x8a7bb8);C.room().dissolve(.3,1.8);
  const cone=C.add(new C.T.Mesh(new C.T.ConeGeometry(2.6,12,40,1,true),new C.T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:C.ADD,depthWrite:false,side:C.T.DoubleSide})));cone.position.set(0,6,0);
  C.every(t=>{cone.material.opacity=C.clamp(t/1.2)*.09;rn.material.opacity=C.clamp(t/1.5)*.8;rn.rotation.z=t*.3;k.glow.material.opacity=.3+Math.sin(t*3)*.08});
  dashSeq(C,a,0x9fdcff,C.V(0,0,0),2,12,.45,.3,C.BLUE);
  C.every(t=>{if(t>7.6&&t<9.2){k.g.position.x=(Math.random()-.5)*.06}});
  kingEnd(C,k,9.4,[C.BLUE,C.VIO]);
  score(C.M,{dur:12,root:61.7,bpm:130,climax:9.4});
  return{dur:12,cam:t=>t<2?(()=>{const q=C.ease(t/2);return[C.V(C.lerp(-3,4,q),C.lerp(7,2.4,q),C.lerp(16,6,q)),C.V(0,1.3,0)]})():t<9?orbit(C,C.V(0,1.3,0),6.4,1.9+Math.sin(t*2)*.2,(t-2)*.55-.4):orbit(C,C.V(0,1.3,0),C.lerp(6.4,9,C.clamp(t-9)),2.6,3.45)}},
/* 2. Метеоритний дощ — burning rocks rain down, the last one carries the attacker */
C=>{C.sky('#1a0202','#5a1208','#ff6d00','#3a0a04',.02);const k=C.char(C.kingTex,C.RED,0);C.ground(0x1c0f0b);
  for(let i=0;i<12;i++){const v=C.add(new C.T.Mesh(new C.T.ConeGeometry(4+Math.random()*6,6+Math.random()*10,7),new C.T.MeshBasicMaterial({color:0x140806})));const a=Math.random()*Math.PI*2;v.position.set(Math.cos(a)*(40+Math.random()*30),3,Math.sin(a)*(40+Math.random()*30))}
  for(let i=0;i<14;i++){const l=C.add(new C.T.Mesh(new C.T.PlaneGeometry(.4+Math.random(),12+Math.random()*10),new C.T.MeshBasicMaterial({color:0xff6d00,transparent:true,opacity:.7,blending:C.ADD,depthWrite:false})));l.rotation.x=-Math.PI/2;l.rotation.z=Math.random()*Math.PI;l.position.set((Math.random()-.5)*40,.03,(Math.random()-.5)*40)}C.stars(800);C.dust(300,0xff7043);
  const mets=[];for(let i=0;i<(C.LOW?10:18);i++){const s=C.sprite(0xff7043,1.2,0);mets.push({s,t:1.2+i*.38,from:C.V((Math.random()-.5)*30,30,(Math.random()-.5)*30-10),to:C.V((Math.random()-.5)*14,0,(Math.random()-.5)*14)})}
  C.every(t=>{mets.forEach((m,i)=>{const q=(t-m.t)/.8;if(q<0||q>1){m.s.material.opacity=0;return}m.s.material.opacity=1;m.s.position.lerpVectors(m.from,m.to,q*q);C.spark(m.s.position,C.V(0,1,0),.4,C.GOLD);if(q>.95)C.once('mh'+i,()=>{C.ring(m.to,0xff7043,t,3,.6);C.burst(m.to,[C.GOLD,new C.T.Color(0xff7043)],30,5);C.shake=.3})})});
  const big=C.char(C.atkTex,C.GOLD,0);big.g.visible=false;const bigGlow=C.sprite(0xff7043,6,0);
  C.every(t=>{if(t<8||t>9.6)return;const q=C.clamp((t-8)/1.4);big.g.visible=true;big.g.position.set(C.lerp(-12,0,q),C.lerp(26,.2,q*q),C.lerp(-14,0,q));bigGlow.position.copy(big.g.position).add(C.V(0,1.2,0));bigGlow.material.opacity=.9;big.glow.material.opacity=1;if(Math.random()<.9)C.spark(bigGlow.position,C.V(Math.random()-.5,2,Math.random()-.5),.6,C.GOLD)});
  C.every(t=>{if(t>9.6){bigGlow.material.opacity*=.9}});
  kingEnd(C,k,9.4,[new C.T.Color(0xff7043),C.GOLD]);
  if(C.M){for(let i=0;i<mets.length;i++)C.M.noise(mets[i].t,.8,{type:'bandpass',f:200,f2:1500,g:.15,att:.6,rel:.1})}
  score(C.M,{dur:12,root:49,bpm:110,climax:9.4});
  return{dur:12,cam:t=>t<8?orbit(C,C.V(0,1.4,0),C.lerp(14,9,t/8),C.lerp(6,3,t/8),t*.18):[C.V(5,2,8),C.V(0,1.5,0)]}},
/* 3. Падіння веж — towers fall from the sky and wall the king in */
C=>{C.sky('#1a1440','#c2577a','#ffb07a','#5a3a5a',.012);const k=C.char(C.kingTex,C.RED,0);C.ground(0x2a2238);C.floor(0x0a0614,checkerTex(C.T,'#2a1f48','#3a2c5c','#ffd1a8'),14);C.dust(300,0xffd1a8);
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const m=C.add(new C.T.Mesh(new C.T.ConeGeometry(14+Math.random()*10,20+Math.random()*25,5),new C.T.MeshBasicMaterial({color:i%2?0x3b2d55:0x4a3868})));m.position.set(Math.cos(a)*90,8,Math.sin(a)*90)}
  const towers=[];const n=C.LOW?6:8;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;const m=C.add(new C.T.Mesh(new C.T.BoxGeometry(1.1,7,1.1),new C.T.MeshBasicMaterial({color:0x2a1f48})));const e=C.add(new C.T.Mesh(new C.T.BoxGeometry(1.16,7.06,1.16),new C.T.MeshBasicMaterial({color:0xb388ff,wireframe:true,transparent:true,opacity:.6,blending:C.ADD})));towers.push({m,e,x:Math.cos(a)*4,z:Math.sin(a)*4,t:1.5+i*.6})}
  C.every(t=>{towers.forEach((w,i)=>{const q=C.clamp((t-w.t)/.6);const y=C.lerp(40,3.5,q*q);[w.m,w.e].forEach(o=>o.position.set(w.x,y,w.z));if(q>=1)C.once('tw'+i,()=>{C.ring(C.V(w.x,.1,w.z),0xb388ff,t,4,.7);C.burst(C.V(w.x,.2,w.z),[C.VIO,C.WHITE],40,5);C.shake=.4;C.M&&C.M.drum(0,.0001)})});
    k.glow.material.opacity=.3+C.clamp((t-6)/2)*.5});
  if(C.M)towers.forEach(w=>{C.M.impact(w.t+.6,.45)});
  const a=C.char(C.atkTex,C.VIO,0);a.g.visible=false;const col=C.beam(C.VIO,1.4);
  C.every(t=>{if(t<7.4)return;a.g.visible=t<10;a.g.position.set(0,C.lerp(14,3.2,C.ease(C.clamp((t-7.4)/1.6))),0);a.glow.material.opacity=.9;C.setBeam(col,C.V(0,40,0),C.V(0,0,0),t<9.2?C.clamp((t-7.4)*2)*.55:Math.max(0,.55-(t-9.2)))});
  kingEnd(C,k,9.2,[C.VIO,C.BLUE]);
  score(C.M,{dur:12,root:55,bpm:96,climax:9.2});
  return{dur:12,cam:t=>t<7?orbit(C,C.V(0,2,0),C.lerp(15,10,t/7),C.lerp(9,5,t/7),t*.25):[C.V(Math.sin(t*.3)*6,1.2,6),C.V(0,3,0)]}},
/* 4. Арена — a giant board; an army rises and fires at once */
C=>{C.sky('#2a6fdb','#7fb8ff','#e8f3ff','#cfe3ff',.008);const k=C.char(C.kingTex,C.RED,0);C.ground(0xd8c9a3);C.floor(0x0a0614,checkerTex(C.T,'#e8d9b0','#8a6a45','#ffffff'),22);
  const stand=C.add(new C.T.Mesh(new C.T.CylinderGeometry(34,30,9,48,1,true),new C.T.MeshBasicMaterial({color:0xb59b74,side:C.T.DoubleSide})));stand.position.y=4.5;
  for(let i=0;i<8;i++){const c=C.add(new C.T.Mesh(new C.T.PlaneGeometry(12,3),new C.T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,depthWrite:false})));c.position.set(Math.cos(i)*80,40+Math.random()*10,Math.sin(i)*80);c.lookAt(0,40,0)}
  const army=[];const n=C.LOW?8:14;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;const ch=C.char(C.atkTex,C.GOLD,Math.cos(a)*8,Math.sin(a)*8,1.8);ch.g.position.y=-3;army.push({ch,a,t:2+i*.35})}
  const beams=army.map(()=>C.beam(C.GOLD,.12));
  C.every(t=>{army.forEach((s,i)=>{const q=C.clamp((t-s.t)/1);s.ch.g.position.y=C.lerp(-3,0,C.ease(q));s.ch.glow.material.opacity=q*.8;if(q>.98)C.once('rise'+i,()=>{C.burst(s.ch.g.position.clone().setY(.5),[C.GOLD],18,3);C.M&&C.M.drum(t,.0001)})});
    army.forEach((s,i)=>{if(t>12.5&&t<15)C.setBeam(beams[i],s.ch.g.position.clone().setY(1),C.V(0,1.3,0),C.clamp((t-12.5)*2)*.8*(t<14.6?1:Math.max(0,1-(t-14.6)*3)))});
    k.glow.material.opacity=.3+C.clamp((t-9)/3)*.6;if(t>9&&t<12.5){k.g.position.y=Math.sin(t*4)*.1}});
  if(C.M)army.forEach(s=>C.M.drum(s.t+.9,.4,90));
  dashSeq(C,C.char(C.atkTex,C.BLUE,-20),0x9fdcff,C.V(0,0,0),9.5,5,.5,.3,C.GOLD);
  kingEnd(C,k,14.8,[C.GOLD,C.WHITE]);
  score(C.M,{dur:19,root:58.3,bpm:120,climax:14.8,bells:6});
  return{dur:19,cam:t=>t<9?[C.V(Math.sin(t*.2)*18,C.lerp(14,6,t/9),Math.cos(t*.2)*18),C.V(0,0,0)]:t<12.5?orbit(C,C.V(0,1.3,0),7,2,t*.6):[C.V(0,C.lerp(4,16,C.clamp((t-12.5)/3)),C.lerp(10,4,C.clamp((t-12.5)/3))),C.V(0,0,0)]}},
/* 5. Вихор фігур — a tornado of pieces swallows the king */
C=>{C.sky('#1b2433','#3d4b5e','#56687c','#3a4656',.02);const k=C.char(C.kingTex,C.RED,0);
  const sea=C.add(new C.T.Mesh(new C.T.PlaneGeometry(300,300,60,60),new C.T.MeshBasicMaterial({color:0x1d3a52,wireframe:false})));sea.rotation.x=-Math.PI/2;sea.position.y=-.6;const sp=sea.geometry.attributes.position;
  const rock=C.add(new C.T.Mesh(new C.T.CylinderGeometry(3,4,1.2,12),new C.T.MeshBasicMaterial({color:0x2b2f36})));rock.position.y=-.4;
  C.every(t=>{for(let i=0;i<sp.count;i++){const x=sp.getX(i),y=sp.getY(i);sp.setZ(i,Math.sin(x*.15+t*2)*.6+Math.cos(y*.12+t*1.6)*.5)}sp.needsUpdate=true});C.dust(500,0xcfd8dc);
  const n=C.LOW?24:48;const bits=[];for(let i=0;i<n;i++){const m=C.ghost(i%2?C.atkTex:C.kingTex,i%2?0x9fdcff:0xff8a80);m.scale.setScalar(.45);bits.push({m,a:Math.random()*Math.PI*2,h:Math.random()*10,r:2+Math.random()*3,s:1+Math.random()})}
  C.every((t,dt)=>{const sp=C.clamp(t/10)*2+.3;bits.forEach(b=>{b.a+=dt*b.s*sp*(1+(10-b.h)*.1);const r=b.r*(t<13?1:C.lerp(1,.1,C.clamp((t-13)/1.5)));b.m.position.set(Math.cos(b.a)*r*(.5+b.h*.12),b.h+Math.sin(t+b.a)*.2,Math.sin(b.a)*r*(.5+b.h*.12));b.m.material.opacity=C.clamp(t/2)*.8});
    k.g.position.y=t<13?C.clamp((t-4)/6)*3:C.lerp(3,0,C.clamp((t-13)*2));k.g.rotation.y=t*2;k.glow.material.opacity=.3+C.clamp((t-4)/6)*.5;
    if(t>6&&Math.random()<.15)C.slash(C.V((Math.random()-.5)*4,3+Math.random()*4,(Math.random()-.5)*4),0x90caf9)});
  const a=C.char(C.atkTex,C.BLUE,0);a.g.visible=false;C.every(t=>{if(t<11)return;a.g.visible=t<15;a.g.position.set(0,C.lerp(16,5,C.ease(C.clamp((t-11)/2))),0);a.glow.material.opacity=1});
  strike(C,()=>C.V(0,6,0),()=>C.V(0,1,0),C.BLUE,13.5,1.1);
  kingEnd(C,k,14,[C.BLUE,C.RED]);
  if(C.M)C.M.noise(0,14,{type:'bandpass',f:200,f2:1800,q:.8,g:.2,att:10,rel:.5});
  score(C.M,{dur:18,root:51.9,bpm:140,climax:14});
  return{dur:18,cam:t=>orbit(C,C.V(0,C.lerp(1.5,4,C.clamp(t/12)),0),C.lerp(13,8,C.clamp(t/12)),C.lerp(2,7,C.clamp(t/12)),t*.35)}},
/* 6. Затемнення — the sun goes black and its corona strikes */
C=>{const skyM=C.sky('#3a2a6a','#d9905a','#f5c27a','#d9a06a',.01);const k=C.char(C.kingTex,C.RED,0);C.ground(0xd4a35e);C.stars(600);
  for(let i=0;i<20;i++){const d=C.add(new C.T.Mesh(new C.T.SphereGeometry(10+Math.random()*12,24,12,0,Math.PI*2,0,Math.PI/2),new C.T.MeshBasicMaterial({color:i%2?0xc9944f:0xb98443})));const a=Math.random()*Math.PI*2,r=30+Math.random()*60;d.position.set(Math.cos(a)*r,-4,Math.sin(a)*r);d.scale.y=.35}
  C.every(t=>{const q=C.clamp((t-1)/8);skyM.material.color.setScalar(1-q*.85);C.scene.fog.color.setRGB(.85*(1-q*.8),.63*(1-q*.8),.42*(1-q*.8))});
  const sun=C.sprite(0xffd54f,22,1);sun.position.set(0,18,-40);const moon=C.add(new C.T.Mesh(new C.T.CircleGeometry(3.6,64),new C.T.MeshBasicMaterial({color:0x000000,fog:false})));moon.position.set(-12,18,-39);
  const corona=C.add(new C.T.Mesh(new C.T.RingGeometry(3.7,5.5,64),new C.T.MeshBasicMaterial({color:0xfff3c4,transparent:true,opacity:0,blending:C.ADD,depthWrite:false,fog:false})));corona.position.set(0,18,-39.5);
  const rays=[];for(let i=0;i<5;i++)rays.push(C.beam(C.GOLD,.18));
  C.every(t=>{const q=C.clamp((t-1)/8);moon.position.x=C.lerp(-12,0,C.ease(q));sun.material.opacity=1-q*.75;corona.material.opacity=q>.95?.9+Math.sin(t*8)*.1:0;
    if(t>9)C.once('diamond',()=>{C.flash(.6,800);C.M&&C.M.bell(880,9);});
    rays.forEach((r,i)=>{if(t>11&&t<14){const ang=i/5*Math.PI*2+t;C.setBeam(r,C.V(Math.cos(ang)*4.6,18+Math.sin(ang)*4.6,-39.5),C.V(0,1.3,0),C.clamp((t-11)*1.5)*.7)}else if(t>=14)r.m.material.opacity=r.core.material.opacity=Math.max(0,r.m.material.opacity-.03)});
    k.glow.material.opacity=.2+C.clamp((t-9)/3)*.7});
  kingEnd(C,k,13.6,[C.GOLD,C.WHITE]);
  score(C.M,{dur:18,root:46.2,minor:false,bpm:80,climax:13.6,bells:5});
  return{dur:18,cam:t=>t<9?[C.V(C.lerp(-6,6,t/9),2,12),C.V(0,C.lerp(4,12,C.clamp(t/4)),-20)]:t<11?[C.V(0,1.6,7),C.V(0,10,-30)]:[C.V(5,2.5,6),C.V(0,2,0)]}},
/* 7. Кришталева в'язниця — crystals grow around the king, then everything shatters */
C=>{C.sky('#020a1a','#0b2a4a','#3a6a8a','#1a3a5a',.015);const k=C.char(C.kingTex,C.RED,0);C.ground(0xdfeef7);C.stars(900);const rn=C.rune('#80deea',8,0,0);
  const aur=[];for(let i=0;i<4;i++){const c=document.createElement('canvas');c.width=4;c.height=128;const x=c.getContext('2d');const gr=x.createLinearGradient(0,0,0,128);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.6,i%2?'rgba(105,240,174,.8)':'rgba(179,136,255,.7)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,4,128);
    const m=C.add(new C.T.Mesh(new C.T.PlaneGeometry(160,30,40,1),new C.T.MeshBasicMaterial({map:new C.T.CanvasTexture(c),transparent:true,blending:C.ADD,depthWrite:false,side:C.T.DoubleSide,fog:false})));m.position.set(0,40+i*6,-70-i*10);aur.push(m)}
  C.every(t=>aur.forEach((m,i)=>{const p=m.geometry.attributes.position;for(let j=0;j<p.count;j++){const x=p.getX(j);p.setZ(j,Math.sin(x*.05+t*.6+i)*8)}p.needsUpdate=true}));
  /* falling snow */
  const sn=C.dust(900,0xffffff,60,30,.12);C.every((t,dt)=>{sn.position.y=-((t*1.5)%30)});
  const crys=[];const n=C.LOW?16:30;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=1.3+Math.random()*1.6;const h=1.5+Math.random()*3;const m=C.add(new C.T.Mesh(new C.T.ConeGeometry(.35+Math.random()*.3,h,5),new C.T.MeshBasicMaterial({color:0x80deea,transparent:true,opacity:.55,blending:C.ADD,depthWrite:false})));m.position.set(Math.cos(a)*r,0,Math.sin(a)*r);m.rotation.set((Math.random()-.5)*.6,Math.random()*3,(Math.random()-.5)*.6);m.scale.set(1,.01,1);crys.push({m,t:2+i*(8/n),h,vel:C.V(Math.cos(a)*6,4+Math.random()*4,Math.sin(a)*6)})}
  C.every((t,dt)=>{rn.material.opacity=C.clamp(t/2)*.7;rn.rotation.z=-t*.2;crys.forEach((c,i)=>{if(t<12.5){const q=C.clamp((t-c.t)/.5);c.m.scale.y=Math.max(.01,q);c.m.position.y=c.h*q*.5;if(q>0)C.once('cg'+i,()=>{C.M&&C.M.tone(1200+Math.random()*1600,c.t,.6,{type:'triangle',g:.04})})}else{c.m.position.addScaledVector(c.vel,dt);c.vel.y-=6*dt;c.m.rotation.x+=dt*4;c.m.material.opacity=Math.max(0,c.m.material.opacity-dt*.4)}});
    k.glow.material.opacity=.2+Math.sin(t*2)*.05+(t>9?C.clamp((t-9)/3)*.5:0)});
  const a=C.char(C.atkTex,C.BLUE,-6);C.every(t=>{a.glow.material.opacity=C.clamp((t-7)/2)*.9;a.g.position.y=t>9?Math.sin(t*2)*.1+C.clamp((t-9)/2):0});
  kingEnd(C,k,12.5,[new C.T.Color(0x80deea),C.WHITE]);
  score(C.M,{dur:17,root:65.4,bpm:90,climax:12.5,bells:8});
  return{dur:17,cam:t=>t<9?orbit(C,C.V(0,1.4,0),C.lerp(10,6,t/9),C.lerp(5,2,t/9),t*.3):t<12.5?[C.V(-8,2.4,5),C.V(-1,1.4,0)]:orbit(C,C.V(0,1.4,0),9,3,3.6+(t-12.5)*.2)}},
/* 8. Дуель сил — blue against red: orbs, clashing beams, a gathered violet strike */
C=>{const BLUE=C.BLUE,RED=C.RED,VIO=C.VIO;C.floor();const rnK=C.rune('#ff4d6d',7,3,0),rnA=C.rune('#4fc3f7',7,-4,0);C.dust(700,0x8a7bb8);C.room().dissolve(.6,2.6);
  const k=C.char(C.kingTex,RED,3),a=C.char(C.atkTex,BLUE,-4);a.g.visible=false;
  dashSeq(C,a,0x9fdcff,C.V(3,0,0),3,10,.5,.34,BLUE);
  C.every(t=>{rnK.material.opacity=C.clamp((t-.5)/1.5)*(t<27?.8:Math.max(0,.8-(t-27)));rnK.rotation.z=t*.25;
    k.glow.material.opacity=t<8?.25+Math.sin(t*3)*.05:t<12?.4+C.clamp((t-8)/1.5)*.6:.75+Math.sin(t*5)*.1;
    if(t>=8)C.once('kb',()=>{C.ring(C.V(3,.1,0),RED,8,9,1.2);C.burst(C.V(3,1.3,0),[RED],140,7);C.shake=.6;k.g.position.x=3});
    if(t>9&&t<27.2)k.g.position.y=Math.min(1,(t-9)*.6)+Math.sin(t*2)*.08;
    if(t>=11.5){a.g.visible=true;rnA.material.opacity=Math.min(.8,(t-11.5)*.8)*(t<27.5?1:Math.max(0,1-(t-27.5)));rnA.rotation.z=-t*.3;a.g.position.set(-4,t<12.5?C.lerp(-2,0,C.ease(C.clamp(t-11.5))):Math.min(1,(t-12.5)*.6)+Math.sin(t*2.2+1)*.08,0);a.glow.material.opacity=.85}});
  const orbs=[];for(let i=0;i<12;i++){const t0=12.6+i*.55,fromA=i%2===0;const s=C.sprite(fromA?BLUE:RED,1.3,0);orbs.push({s,t0,fromA,to:C.V(-.5,1.9+(Math.random()-.5)*.8,(Math.random()-.5)*1.2)})}
  C.every(t=>orbs.forEach((o,i)=>{const q=(t-o.t0)/.55;if(q<0||q>1){o.s.material.opacity=0;return}const from=o.fromA?C.V(-3.4,a.g.position.y+1.7,0):C.V(2.4,k.g.position.y+1.7,0);o.s.material.opacity=1;o.s.position.lerpVectors(from,o.to,C.ease(q));if(q>.95)C.once('ob'+i,()=>{C.burst(o.to,[o.fromA?BLUE:RED,C.WHITE],30,4);C.ring(o.to,o.fromA?BLUE:RED,t,2.2,.5);C.shake=.15})}));
  const bB=C.beam(BLUE,.28),bR=C.beam(RED,.28);const fl=C.sprite(0xb388ff,3,0);
  C.every(t=>{if(t>=16&&t<20.4){const push=Math.sin((t-16)*2.2)*1.1-(t>19?(t-19)*.9:0);const mid=C.V(-.5+push,2.1,0);C.setBeam(bB,a.g.position.clone().add(C.V(.7,1.3,0)),mid,Math.min(1,(t-16)*3)*.85);C.setBeam(bR,k.g.position.clone().add(C.V(-.7,1.3,0)),mid,Math.min(1,(t-16)*3)*.85);fl.position.copy(mid);fl.material.opacity=.9;fl.scale.setScalar(2.6+Math.sin(t*30)*.5);if(Math.random()<.6)C.burst(mid,[BLUE,RED,C.WHITE],6,6);C.shake=Math.max(C.shake,.12)}
    else if(t>=20.4&&t<21){[bB,bR].forEach(b=>{b.m.material.opacity*=.85;b.core.material.opacity*=.85});fl.material.opacity*=.85;C.once('ce',()=>{C.ring(fl.position.clone(),VIO,20.4,5,.9);C.burst(fl.position,[VIO,C.WHITE],100,8);C.shake=.5})}});
  const cg=C.sprite(VIO,1,0),cb=C.sprite(BLUE,1,0),cr=C.sprite(RED,1,0);
  C.every(t=>{if(t<22||t>27.4)return;const q=C.clamp((t-22)/5),hand=a.g.position.clone().add(C.V(1.2,1.5,0)),r=C.lerp(1.6,.05,C.ease(q)),an=t*6;cb.position.set(hand.x+Math.cos(an)*r,hand.y+Math.sin(an)*r*.6,Math.sin(an)*r);cr.position.set(hand.x-Math.cos(an)*r,hand.y-Math.sin(an)*r*.6,-Math.sin(an)*r);cb.material.opacity=cr.material.opacity=.95*(1-Math.max(0,q-.85)*6);cg.position.copy(hand);cg.material.opacity=q*.95;cg.scale.setScalar(.3+q*3.2);
    if(Math.random()<.7){const d=C.V((Math.random()-.5)*8,(Math.random()-.5)*5,(Math.random()-.5)*8);C.spark(hand.clone().add(d),d.clone().multiplyScalar(-.9).add(C.V(0,1.5,0)),1,Math.random()<.5?BLUE:RED)}C.shake=Math.max(C.shake,q*.12)});
  C.every(t=>{if(t>27.6)cg.material.opacity*=.9});
  strike(C,()=>a.g.position.clone().add(C.V(1.2,1.5,0)),()=>k.g.position.clone().add(C.V(.5,1.3,0)),VIO,27.2);
  kingEnd(C,k,27.55,[VIO,RED]);
  if(C.M){C.M.noise(16,4.2,{type:'bandpass',f:500,f2:1500,q:.9,g:.3,att:.3,rel:.6});C.M.tone(196,16,4,{type:'sawtooth',g:.04});C.M.tone(207.7,16,4,{type:'sawtooth',g:.04})}
  score(C.M,{dur:30,root:55,bpm:120,climax:27.3});
  return{dur:30,cam:t=>{const kp=C.V(3,1.3,0);
    if(t<3){const q=C.ease(t/3);return[C.V(C.lerp(-2,5,q),C.lerp(7,2.6,q),C.lerp(18,7,q)),kp]}
    if(t<8){const an=-.6+(t-3)/5*2.2;return[C.V(3+Math.sin(an)*6.5,1.9,Math.cos(an)*6.5),kp]}
    if(t<12){const q=C.ease((t-8)/4);return[C.V(C.lerp(9.5,-.5,q),C.lerp(1.9,4.2,q),C.lerp(-.2,13,q)),C.V(C.lerp(3,-.5,q),1.4,0)]}
    if(t<16){return[C.V(-.5+Math.sin(t*.3)*1.5,3.2,12.5),C.V(-.5,1.6,0)]}
    if(t<20){const an=(t-16)/4*Math.PI*.9-.45;return[C.V(-.5+Math.sin(an)*7,2+Math.sin(t)*.3,Math.cos(an)*7),C.V(-.5,2,0)]}
    if(t<22){return[C.V(1.5,2.2,6),C.V(3,1.8,0)]}
    if(t<27){const an=(t-22)/5*Math.PI*1.1+.4;return[C.V(-4+Math.sin(an)*4.5,2.4+Math.sin(t*1.3)*.4,Math.cos(an)*4.5),C.V(-3,2.4,0)]}
    const q=C.ease(C.clamp((t-27)/1.5));return[C.V(C.lerp(-1,1.5,q),C.lerp(2.6,2,q),C.lerp(9,5.5,q)),C.V(C.lerp(-1,3,q),1.8,0)]}}},
/* 9. Космос — planets align, a star swells into a supernova */
C=>{C.scene.background=new C.T.Color(0x000002);C.scene.fog=null;C.stars(2200,140);const k=C.char(C.kingTex,C.RED,0);
  const plat=C.add(new C.T.Mesh(new C.T.CylinderGeometry(3,3.4,.4,48),new C.T.MeshBasicMaterial({color:0x14102a})));plat.position.y=-.2;const rn=C.rune('#b388ff',6.5,0,0);rn.position.y=.02;
  const pcols=[0xff7043,0x4fc3f7,0x81c784,0xffd54f,0xce93d8];const planets=pcols.map((c,i)=>{const m=C.add(new C.T.Mesh(new C.T.SphereGeometry(.6+i*.18,24,16),new C.T.MeshBasicMaterial({color:c})));const g=C.sprite(c,3+i,.5);return{m,g,r:7+i*3,s:.5-i*.07,a:i*1.3}});
  const galaxy=C.dust(1400,0x9fa8da,60,4,.12);galaxy.position.y=-6;
  const star=C.sprite(0xffffff,2,0);star.position.set(0,9,-22);const a=C.char(C.atkTex,C.WHITE,0,-22,3);a.g.position.y=7.2;
  C.every((t,dt)=>{rn.material.opacity=.7;rn.rotation.z=t*.2;galaxy.rotation.y=t*.05;
    planets.forEach((p,i)=>{const align=C.clamp((t-14)/6);p.a+=dt*p.s*(1-align*.9);const ta=C.lerp(p.a,-Math.PI/2,align*align);p.m.position.set(Math.cos(ta)*p.r*(1-align*.6),Math.sin(ta*.7)*.5+align*(6+i*.4),Math.sin(ta)*p.r*(1-align*.6)-align*10);p.g.position.copy(p.m.position)});
    const q=C.clamp((t-18)/8);star.material.opacity=.4+q*.6;star.scale.setScalar(2+q*14+Math.sin(t*12)*q*1.5);a.glow.material.opacity=.3+q*.7;
    if(t>18&&Math.random()<.6){const d=C.V((Math.random()-.5)*30,(Math.random()-.5)*20,(Math.random()-.5)*30);C.spark(star.position.clone().add(d),d.clone().multiplyScalar(-.8),1.2,C.WHITE)}
    k.glow.material.opacity=.3+Math.sin(t*2)*.1});
  C.every(t=>{if(t>26.4)star.material.opacity*=.9});
  strike(C,()=>star.position.clone(),()=>C.V(0,1.3,0),C.WHITE,26.4,1.6);
  kingEnd(C,k,26.9,[C.WHITE,C.VIO,C.GOLD]);
  score(C.M,{dur:30,root:41.2,minor:false,bpm:72,climax:26.9,bells:10});
  return{dur:30,cam:t=>t<12?[C.V(Math.sin(t*.12)*26,C.lerp(14,6,t/12),Math.cos(t*.12)*26),C.V(0,1,0)]:t<20?[C.V(C.lerp(9,4,(t-12)/8),2,C.lerp(9,10,(t-12)/8)),C.V(0,4,-12)]:t<26?[C.V(0,2.2,8),C.V(0,6,-22)]:[C.V(4,2,6),C.V(0,1.5,0)]}},
/* 10. Дзеркальна зала — mirror clones surround the king and strike together */
C=>{C.scene.background=new C.T.Color(0x05040a);const k=C.char(C.kingTex,C.RED,0);C.floor(0x07060e,checkerTex(C.T,'#0e0c18','#07060e','#e0e0ff'),40);C.room().dissolve(.5,2.4);
  const n=C.LOW?6:8;const mirrors=[],clones=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;const fr=C.add(new C.T.Mesh(new C.T.PlaneGeometry(3,5.2),new C.T.MeshBasicMaterial({color:0x9fa8da,transparent:true,opacity:0,side:C.T.DoubleSide,blending:C.ADD,depthWrite:false})));fr.position.set(Math.cos(a)*9,2.6,Math.sin(a)*9);fr.lookAt(0,2.6,0);
    const ed=C.add(new C.T.LineSegments(new C.T.EdgesGeometry(new C.T.PlaneGeometry(3,5.2)),new C.T.LineBasicMaterial({color:0xe0e0ff,transparent:true,opacity:0})));ed.position.copy(fr.position);ed.quaternion.copy(fr.quaternion);mirrors.push({fr,ed,a});
    const cl=C.char(C.atkTex,C.BLUE,Math.cos(a)*9,Math.sin(a)*9,2);cl.g.visible=false;clones.push({cl,a})}
  C.every(t=>{mirrors.forEach((m,i)=>{const q=C.clamp((t-1-i*.4)/1);m.fr.material.opacity=q*.12;m.ed.material.opacity=q*.9;if(q>0)C.once('mr'+i,()=>{C.M&&C.M.bell(440*Math.pow(1.122,i),1+i*.4,.04)})});
    clones.forEach((c,i)=>{const appear=6+i*.35;if(t<appear)return;c.cl.g.visible=t<26.3;c.cl.glow.material.opacity=.8;
      let r=9;if(t>11&&t<19)r=C.lerp(9,4.5,C.clamp((t-11)/2));if(t>=19&&t<26.3){const ph=((t-19)%1.8)/1.8;r=ph<.4?C.lerp(4.5,.3,C.ease(ph/.4)):C.lerp(.3,4.5,C.ease((ph-.4)/.6));if(ph>.38&&ph<.42)C.once('ms'+i+Math.floor((t-19)/1.8),()=>{if(i===0){C.slash(C.V(0,1.3,0),0x9fa8da);C.burst(C.V(0,1.3,0),[C.BLUE,C.WHITE],50,6);C.shake=.4;C.M&&C.M.drum(0,.0001)}})}
      const an=c.a+(t>11?(t-11)*.5:0);c.cl.g.position.set(Math.cos(an)*r,t>23?C.lerp(0,6,C.clamp((t-23)/2)):0,Math.sin(an)*r)});
    k.glow.material.opacity=.3+(t>19?.5:0)});
  const big=C.char(C.atkTex,C.BLUE,0,0,5);big.g.visible=false;C.every(t=>{if(t<25.4)return;big.g.visible=t<29;big.g.position.set(0,C.lerp(10,3,C.ease(C.clamp((t-25.4)/1.2))),-2);big.glow.material.opacity=1;if(t>25.4)C.once('merge',()=>{C.ring(C.V(0,6,-2),C.BLUE,25.4,8,1);C.flash(.5,700)})});
  if(C.M)for(let j=0;j<4;j++)C.M.impact(19+.72+j*1.8,.5);
  strike(C,()=>big.g.position.clone().add(C.V(0,2.4,0)),()=>C.V(0,1.3,0),C.BLUE,27,1.2);
  kingEnd(C,k,27.4,[C.BLUE,C.WHITE]);
  score(C.M,{dur:30,root:52,bpm:126,climax:27.4,bells:8});
  return{dur:30,cam:t=>t<6?orbit(C,C.V(0,2,0),C.lerp(4,7,t/6),2.2,t*.4):t<19?orbit(C,C.V(0,2,0),16,C.lerp(4,9,C.clamp((t-6)/10)),t*.25):t<25?orbit(C,C.V(0,1.4,0),6,2,t*.5):[C.V(0,4,12),C.V(0,3,0)]}},
];
const BY_LEVEL={1:[0,1,2],2:[3,4,5,6],3:[7,8,9]};
window.CINE={engine,score,makeSynth,orbit,strike,kingEnd,dashSeq,checkerTex,glowTex,pieceTex};
window.CINEMA_SCENES=['Тисяча ривків','Метеоритний дощ','Падіння веж','Арена','Вихор фігур','Затемнення','Кришталева вʼязниця','Дуель сил','Космос','Дзеркальна зала'];
window.playCinema=function(I){
  let idx=I.scene;
  if(idx==null){const list=BY_LEVEL[I.level||1]||BY_LEVEL[1];idx=list[Math.floor(Math.random()*list.length)]}
  return engine(I,SCENES[idx]);
};
})();
