/* ================= LEGENDARY CHECKMATES =================
   Five ~2-minute 3D films. Each one is unlocked only by a rare, beautiful kind of mate
   (smothered, promotion, double check, sacrifice, castling / en passant / king / underpromotion).
   Both armies of the real game fight, the pieces captured earlier sit in the stands as ghosts,
   every film breaks the fourth wall, and every film has its own 2D→3D and 3D→2D transition.
   No words on screen (only light, motion and sound). Scenes live in legend/<id>.js and load on demand.
   window.legendFor({g,mv,king,checkers}) -> id|null
   window.playLegend({id,color,piece,kingColor,fen,kingSq,checkers,seek?,speed?}) -> Promise */
(function(){
'use strict';
const VER='2.5.0';
const LOWL=(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||innerWidth<760||(navigator.hardwareConcurrency||8)<=4;
const Q=n=>Math.max(1,Math.round(n*(LOWL?.45:1)));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const LIST=[
  {id:'jurassic',n:'Юрський мат',i:'🦖',hint:'Мат конем, коли короля з половини боків затисли його власні фігури (спертий мат теж рахується).'},
  {id:'rocket',n:'Політ на планету',i:'🚀',hint:'Мат пішаком або мат тільки-но перетвореним пішаком.'},
  {id:'volcano',n:'Виверження',i:'🌋',hint:'Мат подвійним шахом або відкритим шахом (ходить одна фігура, а шах дає інша).'},
  {id:'ghosts',n:'Армія полеглих',i:'👻',hint:'Мат, коли в тебе на 4+ очки менше матеріалу, ніж у суперника (після жертв).'},
  {id:'studio',n:'Четверта стіна',i:'🎬',hint:'Мат рокіровкою, взяттям на проході, ходом короля, перетворенням не у ферзя, або коли в тебе лишились тільки король і одна фігура.'},
];
window.LEGENDS=LIST;

/* ---------------- which (if any) legendary film this mate earns ---------------- */
const VAL={p:1,n:3,b:3,r:5,q:9,k:0};
function material(g,c){return g.board().flat().filter(x=>x&&x.color===c).reduce((a,x)=>a+VAL[x.type],0)}
/* how boxed-in the king is by its own pieces: share of its neighbour squares (on the board) taken by them */
function boxed(g,king){const side=g.turn(),f=king.charCodeAt(0)-97,r=+king[1];let own=0,all=0;
  for(let df=-1;df<=1;df++)for(let dr=-1;dr<=1;dr++){if(!df&&!dr)continue;const ff=f+df,rr=r+dr;if(ff<0||ff>7||rr<1||rr>8)continue;all++;const p=g.get(String.fromCharCode(97+ff)+rr);if(p&&p.color===side)own++}
  return all?own/all:0}
window.legendFor=function({g,mv,king,checkers}){
  try{
    const fl=mv.flags||'';
    if(fl.includes('k')||fl.includes('q')||fl.includes('e')||mv.piece==='k'||(mv.promotion&&mv.promotion!=='q'))return 'studio';
    const disc=checkers.length===1&&checkers[0].sq&&checkers[0].sq!==mv.to;
    if(checkers.length>1||disc)return 'volcano';
    if(checkers.length===1&&checkers[0].type==='n'&&boxed(g,king)>=.5)return 'jurassic';
    if(fl.includes('p')||checkers.some(c=>c.type==='p'))return 'rocket';
    if(material(g,mv.color)<=material(g,g.turn())-4)return 'ghosts';
    /* the one-man show: only the king and a single piece left (pawns don't count as a piece here) */
    {const mine=g.board().flat().filter(x=>x&&x.color===mv.color&&x.type!=='k');if(mine.length===1&&mine[0].type!=='p')return 'studio'}
  }catch(e){console.warn(e)}
  return null;
};
/* the living and the fallen of both armies, read from the final position */
function census(fen){
  const alive={w:[],b:[]};for(const ch of (fen||'').split(' ')[0]||''){if(/[pnbrqk]/i.test(ch)){const c=ch===ch.toUpperCase()?'w':'b';const t=ch.toLowerCase();if(t!=='k')alive[c].push(t)}}
  const full={q:1,r:2,b:2,n:2},dead={w:[],b:[]};
  for(const c of ['w','b']){const cnt={};alive[c].forEach(t=>cnt[t]=(cnt[t]||0)+1);let promo=0;
    for(const t of ['q','r','b','n']){promo+=Math.max(0,(cnt[t]||0)-full[t]);for(let i=0;i<Math.max(0,full[t]-(cnt[t]||0));i++)dead[c].push(t)}
    for(let i=0;i<Math.max(0,8-(cnt.p||0)-promo);i++)dead[c].push('p')}
  const ord={q:0,r:1,b:2,n:3,p:4};['w','b'].forEach(c=>alive[c].sort((a,b)=>ord[a]-ord[b]));
  return{alive,dead};
}

/* ---------------- sound effects (built on the cinema synth) ---------------- */
const SFX={
  roar(M,at,len=2.4,g=1){if(!M)return;M.noise(at,len,{f:520,f2:140,g:.55*g,att:.12,rel:.8});M.tone(95,at,len,{type:'sawtooth',f2:52,g:.13*g,att:.1,rel:.7});M.tone(142,at,len*.9,{type:'sawtooth',f2:70,g:.07*g,att:.15,rel:.6,det:12});M.noise(at,len*.8,{type:'bandpass',f:1100,f2:480,q:3,g:.25*g,att:.1,rel:.5})},
  thud(M,at,g=.8){if(!M)return;M.drum(at,g,58);M.noise(at,.6,{f:140,g:g*.5,att:.003,rel:.5})},
  clang(M,at,g=1){if(!M)return;[1250,1870,2630,3510].forEach((f,i)=>M.tone(f*(.95+Math.random()*.1),at,.35-i*.05,{type:'triangle',g:.03*g,att:.002,rel:.3}));M.noise(at,.1,{type:'highpass',f:4000,g:.1*g,att:.002,rel:.08})},
  squeak(M,at){M&&M.tone(1300+Math.random()*500,at,.14,{type:'square',f2:2300,g:.016,att:.005,rel:.08})},
  crack(M,at){if(!M)return;for(let i=0;i<4;i++)M.noise(at+i*.035,.06,{type:'highpass',f:2500+i*600,g:.5,att:.001,rel:.05});M.tone(3200,at,.25,{type:'triangle',f2:700,g:.05})},
  knock(M,at){if(!M)return;[0,.22,.44].forEach(d=>{M.drum(at+d,.4,170);M.noise(at+d,.05,{type:'bandpass',f:900,g:.35,att:.001,rel:.04})})},
  clap(M,at){if(!M)return;M.noise(at,.07,{type:'bandpass',f:2400,q:.6,g:1,att:.001,rel:.06});M.tone(320,at,.06,{g:.2,att:.001,rel:.05})},
  rewind(M,at,dur){if(!M)return;M.tone(300,at,dur,{type:'square',f2:2600,g:.025,att:.05,rel:.1});M.noise(at,dur,{type:'bandpass',f:600,f2:5000,q:2,g:.12,att:.05,rel:.1})},
  alarm(M,at,dur){if(!M)return;for(let x=0;x<dur;x+=.5){M.tone(880,at+x,.24,{type:'square',g:.025,att:.005,rel:.03});M.tone(660,at+x+.25,.24,{type:'square',g:.025,att:.005,rel:.03})}},
  rumble(M,at,dur,g=.4){M&&M.noise(at,dur,{f:110,g,att:dur*.3,rel:dur*.3})},
  crowd(M,at,dur,g=.22){if(!M)return;M.noise(at,dur,{type:'bandpass',f:1000,q:.7,g,att:.25,rel:Math.min(1,dur*.5)});for(let i=0;i<8;i++)M.tone(320+Math.random()*420,at+Math.random()*dur*.7,.25+Math.random()*.3,{type:'triangle',g:.012,f2:400+Math.random()*500})},
  laugh(M,at){if(!M)return;for(let i=0;i<6;i++)M.tone(i%2?470:580,at+i*.11,.09,{type:'triangle',g:.03,att:.005,rel:.05})},
  boing(M,at){M&&M.tone(180,at,.5,{f2:620,g:.06,att:.005,rel:.4})},
  beep(M,at,f=1000,d=.12){M&&M.tone(f,at,d,{type:'sine',g:.06,att:.005,rel:.05})},
  explode(M,at,g=1){if(!M)return;M.impact(at,g);M.noise(at,3.5,{f:900,f2:60,g:g*.6,att:.01,rel:3});M.tone(60,at,2.5,{type:'sawtooth',f2:25,g:.12*g})},
  sizzle(M,at,dur=1.2,g=.15){M&&M.noise(at,dur,{type:'highpass',f:3500,g,att:.03,rel:dur*.6})},
  whoosh(M,at,g=.35){M&&M.whoosh(at,g)},
  glass(M,at){if(!M)return;[2093,2637,3136].forEach((f,i)=>M.tone(f,at+i*.03,.6,{type:'sine',g:.03}))},
  projector(M,at,dur){if(!M)return;for(let x=0;x<dur;x+=.083)M.noise(at+x,.03,{type:'bandpass',f:1800,q:3,g:.08,att:.002,rel:.02})},
  scratch(M,at){M&&M.noise(at,.35,{type:'bandpass',f:800,f2:3000,q:3,g:.5,att:.005,rel:.1})},
  chirp(M,at){if(!M)return;for(let i=0;i<3;i++)M.tone(2400+Math.random()*900,at+i*.09,.07,{type:'sine',f2:3200,g:.02})},
  screech(M,at){M&&M.noise(at,.9,{type:'bandpass',f:2600,f2:1400,q:6,g:.3,att:.05,rel:.5})},
};

/* ---------------- a long score: sections, chord progressions, intensity ---------------- */
const PROG={i:[0,3,7],iv:[5,8,12],v:[7,10,14],V:[7,11,14],VI:[8,12,15],III:[3,7,10],VII:[10,14,17],I:[0,4,7],IV:[5,9,12],vi:[9,12,16],ii:[2,5,9],iii:[4,7,11]};
function music(C,{root,parts,end}){
  const M=C.M;if(!M)return;const f=s=>root*Math.pow(2,s/12);let next=Math.max(0,(C.I.seek||0)),bar=0;
  C.every(()=>{const now=C.raw||0;
    while(next<now+2.5&&next<end-.05){
      const p=parts.filter(x=>x.at<=next+.01).pop()||parts[0];const np=parts.find(x=>x.at>next+.01);
      const beat=60/p.bpm;let bl=beat*4;if(np)bl=Math.min(bl,np.at-next);bl=Math.min(bl,end-next);
      const b=next,gv=p.g||1,ch=(PROG[p.prog[bar%p.prog.length]]||PROG.i).map(f);
      if(p.lvl>=0&&bl>.2){
        if(p.pad==='organ')ch.forEach(n=>{M.tone(n*2,b,bl+.25,{type:'square',g:.007*gv,att:.15,rel:.3});M.tone(n*4,b,bl+.25,{type:'sine',g:.012*gv,att:.15,rel:.3})});
        else if(p.pad!=='none')ch.forEach(n=>[-7,7].forEach(d=>M.tone(n*2,b,bl+.3,{type:'sawtooth',g:.0105*gv,det:d,att:Math.min(.6,bl*.3),rel:Math.min(.8,bl*.4)})));
        if(p.lvl>=1){M.tone(ch[0],b,Math.min(bl,beat*2),{type:'triangle',g:.13*gv,att:.01,rel:.25});if(bl>beat*2.2)M.tone(ch[0],b+beat*2,beat*2,{type:'triangle',g:.12*gv,att:.01,rel:.25})}
        for(let q=0;q<4;q++){const at=b+q*beat;if(at>=b+bl-.02)break;
          if(p.lvl>=1&&(q%2===0||p.lvl>=2))M.drum(at,(.32+.12*p.lvl)*gv,100);
          if(p.lvl>=2&&q%2===1)M.noise(at,.18,{type:'bandpass',f:1700,q:.8,g:.2*gv,att:.002,rel:.15});
          if(p.lvl>=2){M.noise(at,.04,{type:'highpass',f:7000,g:.035*gv,att:.001,rel:.03});M.noise(at+beat/2,.04,{type:'highpass',f:7000,g:.025*gv,att:.001,rel:.03})}
          if(p.toms&&(q===1||q===3)){M.drum(at+beat*.5,.3*gv,130);M.drum(at+beat*.75,.28*gv,110)}}
        if(p.lvl>=3){ch.forEach(n=>M.tone(n*2,b,.42,{type:'sawtooth',g:.03*gv,att:.01,rel:.3}));if(bl>=beat*4-.01)[0,1,2].forEach(j=>M.drum(b+beat*3+j*beat/3,.35*gv,140-j*25))}
        if(p.arp)for(let j=0;j<8;j++){const at=b+j*beat/2;if(at>=b+bl-.05)break;M.tone(ch[j%3]*4*(j>=4?2:1),at,beat*.45,{type:'triangle',g:.022*gv,att:.005,rel:.2})}
        if(p.bell&&bar%2===0)M.bell(ch[2]*8,b,.035*gv);
      }
      next+=bl;bar++;
    }});
}

/* ---------------- small helpers ---------------- */
const rng=seed=>{let s=seed%2147483647;if(s<=0)s+=2147483646;return()=>(s=s*16807%2147483647,(s-1)/2147483646)};
function loadImgs(){const o={};return Promise.all(['w','b'].flatMap(c=>['p','n','b','r','q','k'].map(p=>new Promise(r=>{const im=new Image();im.onload=()=>{o[c+p]=im;r()};im.onerror=r;im.src=PIC(c,p)})))).then(()=>o)}
/* the trainer itself (board with the real final position + side panels), drawn for in-world monitors */
function appCanvas(fen,imgs){
  const c=document.createElement('canvas');c.width=1280;c.height=800;const x=c.getContext('2d');
  x.fillStyle='#302e2b';x.fillRect(0,0,1280,800);x.fillStyle='#262421';x.fillRect(0,0,130,800);
  for(let i=0;i<7;i++){x.fillStyle=i===2?'#3d6b2f':'#3a3835';x.beginPath();x.roundRect?x.roundRect(18,30+i*70,94,48,8):x.rect(18,30+i*70,94,48);x.fill()}
  const S=680,X0=190,Y0=60,q=S/8;const rows=((fen||'').split(' ')[0]||'8/8/8/8/8/8/8/8').split('/');
  for(let r=0;r<8;r++)for(let f=0;f<8;f++){x.fillStyle=(f+(8-r))%2===0?'#EBECD0':'#739552';x.fillRect(X0+f*q,Y0+r*q,q,q)}
  rows.forEach((row,r)=>{let f=0;for(const ch of row){if(/\d/.test(ch)){f+=+ch;continue}const k=(ch===ch.toUpperCase()?'w':'b')+ch.toLowerCase();if(imgs[k])x.drawImage(imgs[k],X0+f*q,Y0+r*q,q,q);f++}});
  x.fillStyle='#262421';x.fillRect(910,60,330,680);
  for(let i=0;i<9;i++){x.fillStyle='#3a3835';x.fillRect(935,90+i*40,(i%3?220:280),16)}
  x.fillStyle='#81b64c';x.beginPath();x.roundRect?x.roundRect(935,640,280,64,10):x.rect(935,640,280,64);x.fill();
  return c;
}

/* ================= the toolkit every film uses ================= */
function kit(C){
  const T=C.T,L={T,C,SFX,LOW:LOWL,Q,rng,V:C.V};
  L.std=(col,o={})=>new T.MeshStandardMaterial(Object.assign({color:col,flatShading:true,roughness:.92,metalness:0},o));
  L.basic=(col,o={})=>new T.MeshBasicMaterial(Object.assign({color:col},o));
  L.glowM=(col,op=1)=>new T.MeshBasicMaterial({color:col,transparent:true,opacity:op,blending:C.ADD,depthWrite:false});
  L.mesh=(geo,mat,x=0,y=0,z=0,parent)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);(parent||C.scene).add(m);return m};
  L.group=(x=0,y=0,z=0,parent)=>{const g=new T.Group();g.position.set(x,y,z);(parent||C.scene).add(g);return g};
  L.lights=(sky,ground,hi,sunCol,si,dir)=>{const h=new T.HemisphereLight(sky,ground,hi);C.add(h);const d=new T.DirectionalLight(sunCol,si);d.position.copy(dir);C.add(d);return{h,d}};
  L.nz=(x,z)=>Math.sin(x*.13+z*.07)*Math.cos(z*.11-x*.05)+.5*Math.sin(x*.31-z*.27+1.3)*Math.cos(x*.17+z*.23)+.25*Math.sin(x*.71+z*.63);
  L.terrain=(size,seg,hf,colf,y0=0)=>{const g=new T.PlaneGeometry(size,size,seg,seg);g.rotateX(-Math.PI/2);const p=g.attributes.position;const cols=new Float32Array(p.count*3);const c=new T.Color();
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);const y=hf(x,z);p.setY(i,y);colf(c,x,y,z);cols[i*3]=c.r;cols[i*3+1]=c.g;cols[i*3+2]=c.b}
    g.setAttribute('color',new T.BufferAttribute(cols,3));g.computeVertexNormals();const m=C.add(new T.Mesh(g,L.std(0xffffff,{vertexColors:true})));m.position.y=y0;return m};
  L.rock=(x,y,z,s,col=0x6d6458,parent)=>{const m=L.mesh(new T.IcosahedronGeometry(1,0),L.std(col),x,y,z,parent);m.scale.set(s*(.8+Math.random()*.5),s*(.6+Math.random()*.5),s*(.8+Math.random()*.5));m.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);return m};
  L.chk=(a='#EBECD0',b='#739552',n=8)=>{const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');const s=512/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){x.fillStyle=(i+j)%2?b:a;x.fillRect(i*s,j*s,s,s)}const t=new T.CanvasTexture(c);t.anisotropy=4;return t};
  L.board=(size,a,b,y=.02,x=0,z=0)=>{const m=L.mesh(new T.PlaneGeometry(size,size),new T.MeshStandardMaterial({map:L.chk(a,b),roughness:.8}),x,y,z);m.rotation.x=-Math.PI/2;return m};
  L.tex=canvas=>{const t=new T.CanvasTexture(canvas);t.anisotropy=4;return t};
  L.canvas=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return L.tex(c)};
  L.appTex=()=>L.tex(C.I.app);
  /* soft puffs (smoke, dust, steam, clouds of fire) */
  L.puffs=(n,additive=false)=>{n=Q(n);const pool=[];for(let i=0;i<n;i++){const s=new T.Sprite(new T.SpriteMaterial({map:C.G,transparent:true,depthWrite:false,blending:additive?C.ADD:T.NormalBlending,opacity:0}));s.visible=false;C.add(s);pool.push({s,life:0,max:1,v:new T.Vector3(),g:1,op:1,sz:1})}
    let k=0;const P={emit(p,v,size,life,col,op=.6,grow=1.5){const o=pool[k++%n];o.s.position.copy(p);o.v.copy(v);o.sz=size;o.g=grow;o.life=0;o.max=life;o.op=op;o.s.material.color.set(col);o.s.visible=true;o.s.scale.setScalar(size)}};
    C.every((t,dt)=>pool.forEach(o=>{if(!o.s.visible)return;o.life+=dt;const k=o.life/o.max;if(k>=1){o.s.visible=false;return}o.s.position.addScaledVector(o.v,dt);o.v.multiplyScalar(Math.pow(.6,dt));const s=o.sz*(1+k*o.g);o.s.scale.set(s,s,1);o.s.material.opacity=o.op*(k<.15?k/.15:1-(k-.15)/.85)}));return P};
  L.vec=(a,b,k)=>new T.Vector3().lerpVectors(a,b,k);
  L.orb=(c,r,h,a)=>[C.V(c.x+Math.sin(a)*r,h,c.z+Math.cos(a)*r),c];
  L.hand=(p,t,a=.06)=>p.clone().add(C.V(Math.sin(t*1.7)*a+Math.sin(t*4.3)*a*.4,Math.sin(t*2.3)*a*.7,Math.cos(t*1.3)*a));
  /* camera as a list of shots: [[duration,(k,t)=>[pos,look]],...] (hard cuts between shots) */
  L.shots=list=>{let acc=0;const S=list.map(s=>{const o={t0:acc,t1:acc+s[0],f:s[1]};acc+=s[0];return o});L.total=acc;
    return t=>{const s=S.find(s=>t<s.t1)||S[S.length-1];return s.f(C.clamp((t-s.t0)/(s.t1-s.t0)),t)}};
  L.roll=null;  /* (t)=>radians, applied after lookAt */
  /* ---------- pieces as actors moving on key frames (stateless: position is a function of time) ---------- */
  const actors=[];L.actors=actors;
  const GH=new T.Color(.55,.85,1),WH=new T.Color(1,1,1);
  L.actor=(color,type,o={})=>{const size=o.size||2.4;const tex=C.pt[color+type]||C.atkTex;const ch=C.char(tex,o.col||(color==='w'?C.BLUE:C.RED),0,0,size);ch.glow.material.opacity=0;
    const A={ch,color,type,size,keys:[],ghostAt:o.ghost?-1:Infinity,seed:Math.random()*10,dirty:true,cur:new T.Vector3(),off:null,i:actors.length};
    A.key=(t,p,o={})=>{const k={t,x:p.x,y:p.y||0,z:p.z,hop:o.hop||0,arc:o.arc||0,rot:o.rot??null,op:o.op??null,glow:o.glow??null,sc:o.sc??null,vis:o.vis??null,ease:o.ease||0};
      let i=A.keys.length;while(i>0&&A.keys[i-1].t>t)i--;A.keys.splice(i,0,k);A.dirty=true;return A};
    A.ghost=t=>{A.ghostAt=Math.min(A.ghostAt,t);return A};
    A.bake=()=>{let r=0,op=1,gl=0,sc=1,vis=true;A.keys.forEach(k=>{if(k.rot!=null)r=k.rot;if(k.op!=null)op=k.op;if(k.glow!=null)gl=k.glow;if(k.sc!=null)sc=k.sc;if(k.vis!=null)vis=k.vis;k.R=r;k.O=op;k.G=gl;k.S=sc;k.Vi=vis});A.dirty=false};
    A.state=t=>{if(A.dirty)A.bake();const ks=A.keys;if(!ks.length)return{x:0,y:0,z:0,r:0,op:1,gl:0,sc:1,vis:true};
      if(t<=ks[0].t){const a=ks[0];return{x:a.x,y:a.y,z:a.z,r:a.R,op:a.O,gl:a.G,sc:a.S,vis:a.Vi}}
      const last=ks[ks.length-1];if(t>=last.t)return{x:last.x,y:last.y,z:last.z,r:last.R,op:last.O,gl:last.G,sc:last.S,vis:last.Vi};
      let i=0;while(i<ks.length-2&&ks[i+1].t<=t)i++;const a=ks[i],b=ks[i+1];const k=(t-a.t)/Math.max(1e-6,b.t-a.t);
      const e=b.ease===1?C.ease(k):b.ease===2?k*k:b.ease===3?1-(1-k)*(1-k):k;
      let y=a.y+(b.y-a.y)*e+b.arc*4*k*(1-k);if(b.hop){const d=Math.hypot(b.x-a.x,b.z-a.z);const n=Math.max(1,Math.round(d/1.1));y+=b.hop*Math.abs(Math.sin(k*n*Math.PI))}
      return{x:a.x+(b.x-a.x)*e,y,z:a.z+(b.z-a.z)*e,r:a.R+(b.R-a.R)*e,op:a.O+(b.O-a.O)*k,gl:a.G+(b.G-a.G)*k,sc:a.S+(b.S-a.S)*e,vis:a.Vi}};
    A.pos=t=>{const s=A.state(t);return C.V(s.x,s.y,s.z)};
    actors.push(A);return A};
  C.every(t0=>{actors.forEach(A=>{const t=A.raw&&C.raw!=null?C.raw:t0;const s=A.state(t);let x=s.x,y=s.y,z=s.z;const gh=t>=A.ghostAt;
      if(A.off){const o=A.off(t);if(o){x+=o.x||0;y+=o.y||0;z+=o.z||0}}
      if(gh)y+=Math.sin(t*2+A.seed)*.12+.15;
      const ch=A.ch;ch.g.visible=s.vis;ch.g.position.set(x,y,z);A.cur.set(x,y,z);ch.g.scale.setScalar(s.sc);
      ch.m.material.color.copy(gh?GH:WH);ch.m.material.opacity=s.op*(gh?.62:1);ch.rim.material.opacity=.9*s.op*(gh?.45:1);if(gh)ch.rim.material.color.setRGB(.4,.9,1);
      ch.glow.material.opacity=gh?Math.max(s.gl,.28):Math.max(s.gl,A.color==='b'?.32:0);if(gh)ch.glow.material.color.setRGB(.35,.8,1);
      if(s.r){ch.m.rotateZ(s.r);ch.rim.rotateZ(s.r)}});
    if(L.roll){const r=L.roll(t0);if(r)C.cam.rotateZ(r)}});
  /* both armies of the real game: hero = the piece that gave mate, victim = the mated king */
  L.armies=(o={})=>{const I=C.I,size=o.size||2.4;const mk=(c,t)=>L.actor(c,t,{size});
    const res={w:[],b:[]};['w','b'].forEach(c=>{let list=(I.alive&&I.alive[c]||[]).slice();if(c===I.color){const j=list.indexOf(I.piece);if(j>=0)list.splice(j,1)}
      list=list.slice(0,o.max||(LOWL?9:15));res[c]=list.map(t=>mk(c,t))});
    res.hero=mk(I.color,I.piece==='k'?'q':I.piece);res.hero.hero=true;
    res.king=mk(I.kingColor,'k');res.myKing=mk(I.color,'k');
    res.atk=res[I.color];res.def=res[I.kingColor];
    res.dead=['w','b'].flatMap(c=>(I.dead&&I.dead[c]||[]).map(t=>({c,t}))).slice(0,LOWL?10:24);
    return res};
  /* formation lines: front row pawns, back row officers */
  L.formation=(list,z0,dir,t,x0=0,gap=2.1)=>{const pw=list.filter(a=>a.type==='p'),of=list.filter(a=>a.type!=='p');
    [[pw,0],[of,1]].forEach(([row,r])=>row.forEach((a,i)=>a.key(t,C.V(x0+(i-(row.length-1)/2)*gap,0,z0+dir*r*2.4))))};
  /* a whole battle choreographed in advance (seeded), returns who is still standing */
  L.battle=({a,b,t0,t1,mid,R,favor='a',spread=7,onFall,speed=5})=>{
    let A=a.slice(),B=b.slice();const ready=new Map();[...A,...B].forEach(x=>ready.set(x,t0+R()*1.6));const res={fallen:[]};let guard=0;
    const sh=arr=>{for(let i=arr.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr};
    while(A.length&&B.length&&guard++<40){sh(A);sh(B);const n=Math.min(A.length,B.length);const nA=A.slice(n),nB=B.slice(n);let any=false;
      for(let i=0;i<n;i++){const x=A[i],y=B[i];const s=Math.max(ready.get(x),ready.get(y));if(s>t1-3.2){nA.push(x);nB.push(y);continue}any=true;
        const m=mid.clone().add(C.V((R()-.5)*spread*2,0,(R()-.5)*spread*.5));const px=x.pos(s),py=y.pos(s);
        const dx=px.clone().sub(m).setY(0),dy=py.clone().sub(m).setY(0);if(dx.lengthSq()<.01)dx.set(0,0,1);if(dy.lengthSq()<.01)dy.set(0,0,-1);dx.normalize();dy.normalize();
        const qx=m.clone().addScaledVector(dx,.95),qy=m.clone().addScaledVector(dy,.95);const rx=px.distanceTo(qx)/speed+.2,ry=py.distanceTo(qy)/speed+.2;
        x.key(s,px).key(s+rx,qx,{hop:.35});y.key(s,py).key(s+ry,qy,{hop:.35});
        const d0=s+Math.max(rx,ry),nc=2+Math.floor(R()*3);
        for(let j=0;j<nc;j++){const tc=d0+.2+j*.45;x.key(tc-.14,qx).key(tc,L.vec(qx,m,.5)).key(tc+.2,qx);y.key(tc-.14,qy).key(tc,L.vec(qy,m,.5)).key(tc+.2,qy);
          const at=m.clone().setY(1.3);C.at(tc,()=>{C.burst(at,[C.WHITE,j%2?C.GOLD:C.BLUE],22,4);if(j===nc-1)C.slash(at,0xffffff);SFX.clang(C.M,C.raw,.8);C.shake=Math.max(C.shake,.08)})}
        const de=d0+.2+nc*.45,xw=R()<(favor==='a'?.64:favor==='b'?.36:.5);const W=xw?x:y,Lo=xw?y:x,lq=xw?qy:qx,ld=xw?dy:dx,wq=xw?qx:qy;
        const fp=lq.clone().addScaledVector(ld,3+R()*3);
        Lo.key(de,lq).key(de+.9,C.V(fp.x,-.95,fp.z),{arc:3,rot:(R()<.5?-1:1)*(Math.PI*4+Math.PI/2)});
        C.at(de,()=>{C.burst(lq.clone().setY(1.3),[C.WHITE,C.GOLD],40,6);SFX.thud(C.M,C.raw,.45);SFX.squeak(C.M,C.raw+.05);C.shake=Math.max(C.shake,.2)});
        C.at(de+.9,()=>{C.burst(fp.clone().setY(.2),[new T.Color(.8,.7,.55)],14,2.5)});
        res.fallen.push({A:Lo,t:de+1.7,p:fp});onFall&&onFall(Lo,de+1.7,fp);
        W.key(de+.1,wq).key(de+.7,wq,{hop:.7});ready.set(W,de+.9+R()*.6);(xw?nA:nB).push(W)}
      A=nA;B=nB;if(!any)break}
    res.a=A;res.b=B;return res};
  /* spectators: the fallen sit in the stands as ghosts and react */
  L.stands=seats=>{const S={seats,used:0,moods:[],sit:[]};
    S.off=(A,t)=>{if(!A.seat||t<A.seat.t)return null;const i=A.seat.i;let x=0,y=Math.sin(t*1.7+i)*.06,z=0;
      for(const m of S.moods){if(t<m.t0||t>m.t1)continue;const e=Math.min(1,(t-m.t0)*2,(m.t1-t)*2)*m.amp;
        if(m.kind==='cheer')y+=Math.abs(Math.sin(t*9+i*1.7))*.7*e;
        else if(m.kind==='wave'){const ph=t*2.6-i*.42;y+=Math.pow(Math.max(0,Math.sin(ph)),4)*1.4*e}
        else if(m.kind==='panic'){x+=Math.sin(t*23+i)*.18*e;y+=Math.abs(Math.sin(t*17+i))*.35*e}
        else if(m.kind==='lean'){const d=C.cam.position.clone().sub(A.seat.p).setY(0).normalize();x+=d.x*2.2*e;z+=d.z*2.2*e;y+=.3*e}
        else if(m.kind==='laugh')y+=Math.abs(Math.sin(t*14+i))*.3*e}
      return{x,y,z}};
    S.take=(A,t,dur=2.8)=>{if(S.used>=seats.length){A.key(t,A.pos(t)).key(t+1.2,A.pos(t),{op:0});return}const i=S.used++,p=seats[i];A.ghost(t);A.key(t,A.pos(t)).key(t+dur,p,{arc:4,rot:0,ease:1});A.seat={i,t:t+dur,p};S.sit.push(A);A.off=tt=>S.off(A,tt)};
    S.seatNow=A=>{const i=S.used++;const p=seats[i%seats.length];A.ghost(-1);A.key(0,p);A.seat={i,t:-1,p};S.sit.push(A);A.off=tt=>S.off(A,tt)};
    S.mood=(kind,t0,t1,amp=1)=>{S.moods.push({kind,t0,t1,amp});if(kind==='cheer'||kind==='wave')C.at(t0,()=>SFX.crowd(C.M,C.raw,Math.min(4,t1-t0),.18));if(kind==='laugh')C.at(t0,()=>SFX.laugh(C.M,C.raw))};
    S.popcorn=(t0,t1,col=0xfff3c4)=>{const c=new T.Color(col);C.every((t,dt)=>{if(t<t0||t>t1||!S.sit.length)return;if(Math.random()<dt*S.sit.length*.8){const A=S.sit[Math.floor(Math.random()*S.sit.length)];if(t<A.seat.t)return;C.spark(A.cur.clone().add(C.V(0,2.2,0)),C.V((Math.random()-.5)*1.5,2.5+Math.random()*2,(Math.random()-.5)*1.5),1.2,c)}})};
    S.lights=(t0,t1,col=0xfff1a8)=>{const sp=[];C.every(t=>{while(sp.length<S.sit.length)sp.push(C.sprite(col,.7,0));S.sit.forEach((A,i)=>{const s=sp[i];const on=t>=t0&&t<=t1&&t>=A.seat.t;const e=on?Math.min(1,(t-t0),(t1-t)):0;s.material.opacity=e*.95;s.position.copy(A.cur).add(C.V(Math.sin(t*1.5+i)*.5,2.9,0))})})};
    S.flags=(cols)=>{const fl=[];C.every(t=>{S.sit.forEach((A,i)=>{if(i%3)return;let f=fl[i];if(!f){f=fl[i]=L.mesh(new T.PlaneGeometry(1,.65),new T.MeshBasicMaterial({color:cols[(i/3)%cols.length|0],side:T.DoubleSide,transparent:true}))}f.visible=t>=A.seat.t;f.position.copy(A.cur).add(C.V(.6,2.8,0));f.rotation.y=Math.sin(t*4+i)*.6;f.rotation.z=Math.sin(t*3+i)*.2})})};
    return S};
  /* ---------- the screen itself (fourth wall): overlays drawn on top of the 3D picture ---------- */
  L.ov=(css,html='')=>{const d=document.createElement('div');d.style.cssText='position:fixed;pointer-events:none;z-index:985;'+css;d.innerHTML=html;document.body.appendChild(d);C.onEnd(()=>d.remove());return d};
  L.anim=(el,kf,o)=>{try{return el.animate(kf,o)}catch(e){return null}};
  /* the glass of the screen cracks */
  L.crack=(px=50,py=45)=>{const W=innerWidth,H=innerHeight,cx=W*px/100,cy=H*py/100;let paths='';
    for(let i=0;i<16;i++){let a=i/16*Math.PI*2+Math.random()*.3,x=cx,y=cy,d=`M${cx} ${cy}`;const len=60+Math.random()*Math.max(W,H)*.45;for(let s=0;s<6;s++){const st=len/6;a+=(Math.random()-.5)*.6;x+=Math.cos(a)*st;y+=Math.sin(a)*st;d+=` L${x.toFixed(1)} ${y.toFixed(1)}`}paths+=`<path d="${d}"/>`}
    for(let r=1;r<4;r++){let d='';for(let i=0;i<=16;i++){const a=i/16*Math.PI*2,rr=r*28+Math.random()*16;d+=(i?' L':'M')+(cx+Math.cos(a)*rr).toFixed(1)+' '+(cy+Math.sin(a)*rr).toFixed(1)}paths+=`<path d="${d}" opacity=".7"/>`}
    const o=L.ov('inset:0',`<svg width="100%" height="100%" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0"><g fill="none" stroke="rgba(255,255,255,.85)" stroke-width="1.6" style="filter:drop-shadow(0 0 2px #000)">${paths}</g><circle cx="${cx}" cy="${cy}" r="18" fill="rgba(255,255,255,.25)"/></svg>`);
    L.anim(o,[{opacity:0},{opacity:1}],{duration:90,fill:'forwards'});return o};
  L.fade=(el,ms=600)=>{if(!el)return;L.anim(el,[{opacity:getComputedStyle(el).opacity},{opacity:0}],{duration:ms,fill:'forwards'});setTimeout(()=>el.remove(),ms+50)};
  /* breath fog on the glass, then something wipes it clean */
  L.fogWipe=(dur=3,src)=>{const f=L.ov(`inset:0;background:radial-gradient(ellipse at 50% 55%,rgba(235,245,255,.75),rgba(235,245,255,.35) 60%,rgba(235,245,255,.12));${LOWL?'':'backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);'}opacity:0`);
    L.anim(f,[{opacity:0},{opacity:1}],{duration:500,fill:'forwards'});
    setTimeout(()=>{const w=src?L.ov(`left:-20vw;top:30vh;width:24vh;height:24vh;filter:drop-shadow(0 0 12px #9ff)`,`<img src="${src}" style="width:100%;height:100%">`):null;
      const ms=1400;L.anim(f,[{clipPath:'inset(0 0 0 0)'},{clipPath:'inset(0 0 0 100%)'}],{duration:ms,fill:'forwards',easing:'ease-in-out'});
      if(w)L.anim(w,[{transform:'translateX(0) rotate(-10deg)'},{transform:'translateX(60vw) translateY(-8vh) rotate(10deg)'},{transform:'translateX(130vw) rotate(-10deg)'}],{duration:ms,fill:'forwards',easing:'ease-in-out'});
      setTimeout(()=>{f.remove();w&&w.remove()},ms+100)},dur*1000)};
  /* something splashes on the lens and runs down */
  L.splat=(col='#ff6d00',n=5,life=7)=>{const els=[];for(let i=0;i<n;i++){const x=10+Math.random()*80,y=5+Math.random()*55,s=8+Math.random()*14;
      const b=L.ov(`left:${x}vw;top:${y}vh;width:${s}vmin;height:${s}vmin;border-radius:46% 54% 50% 50%;background:radial-gradient(circle at 40% 35%,#fff7,${col} 40%,${col}cc 70%,transparent 72%);filter:drop-shadow(0 0 14px ${col});transform:scale(0)`);
      L.anim(b,[{transform:'scale(0)'},{transform:'scale(1.15)',offset:.6},{transform:'scale(1)'}],{duration:240,fill:'forwards'});els.push(b);
      for(let j=0;j<2;j++){const d=L.ov(`left:calc(${x}vw + ${s*(.25+j*.4)}vmin);top:calc(${y}vh + ${s*.6}vmin);width:${1.4+Math.random()*1.4}vmin;height:0;border-radius:0 0 999px 999px;background:linear-gradient(${col},${col}dd);filter:drop-shadow(0 0 8px ${col})`);
        L.anim(d,[{height:'0vh'},{height:(15+Math.random()*35)+'vh'}],{duration:(life*1000)*(.6+Math.random()*.4),fill:'forwards',easing:'cubic-bezier(.3,.1,.6,1)'});els.push(d)}}
    setTimeout(()=>els.forEach(e=>L.fade(e,900)),life*1000);return els};
  /* knocking on the glass from inside */
  L.knock=(px=50,py=50)=>{for(let i=0;i<3;i++)setTimeout(()=>{const r=L.ov(`left:${px}vw;top:${py}vh;width:2vmin;height:2vmin;margin:-1vmin;border:2px solid rgba(255,255,255,.8);border-radius:50%`);L.anim(r,[{transform:'scale(1)',opacity:1},{transform:'scale(9)',opacity:0}],{duration:500,fill:'forwards'});setTimeout(()=>r.remove(),520);L.anim(C.canvas,[{transform:'translate(0,0)'},{transform:'translate(3px,-2px)'},{transform:'translate(0,0)'}],{duration:90})},i*220)};
  L.redAlert=(ms)=>{const o=L.ov('inset:0;background:radial-gradient(ellipse at center,transparent 45%,rgba(255,0,0,.55));opacity:0');L.anim(o,[{opacity:0},{opacity:1},{opacity:0}],{duration:500,iterations:Math.ceil(ms/500)});setTimeout(()=>o.remove(),ms+50);return o};
  L.burnEdges=(ms)=>{const o=L.ov('inset:0;box-shadow:inset 0 0 18vmin 4vmin rgba(255,110,0,.85);opacity:0');L.anim(o,[{opacity:.2},{opacity:1},{opacity:.6},{opacity:1},{opacity:.3}],{duration:ms,fill:'forwards'});setTimeout(()=>o.remove(),ms+50);return o};
  L.vhs=(ms)=>{const o=L.ov('inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.25) 0 2px,transparent 2px 4px);mix-blend-mode:multiply');
    const bar=L.ov('left:0;right:0;height:9vh;background:linear-gradient(transparent,rgba(255,255,255,.35),transparent);top:-10vh');L.anim(bar,[{top:'110vh'},{top:'-10vh'}],{duration:700,iterations:Math.ceil(ms/700)});
    const cv=C.canvas;cv.style.filter='contrast(1.35) saturate(1.7) hue-rotate(-12deg)';const j=L.anim(cv,[{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],{duration:180,iterations:Math.ceil(ms/180)});
    setTimeout(()=>{o.remove();bar.remove();cv.style.filter='';j&&j.cancel()},ms)};
  L.blackout=(ms,col='#000')=>{const o=L.ov(`inset:0;background:${col};opacity:0`);L.anim(o,[{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.75},{opacity:0}],{duration:ms,fill:'forwards'});setTimeout(()=>o.remove(),ms+50)};
  L.domImg=(src,css)=>L.ov(css,`<img src="${src}" style="width:100%;height:100%;display:block">`);
  L.cursorSvg='<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M3 2l15 11-6.5.8 3.8 7.4-3 1.5-3.7-7.5L3 20z" fill="#fff" stroke="#000" stroke-width="1.4"/></svg>';
  /* the music is per film; the films call L.music(...) */
  L.music=def=>music(C,def);
  return L;
}

/* ================= the five 2D→3D / 3D→2D transitions ================= */
function synth(){return window.CINE?CINE.makeSynth(1):null}
function stage(I,{hidden=false}={}){
  const B=document.getElementById('board');if(!B)return null;const br=B.getBoundingClientRect();if(br.width<20)return null;const sz=br.width/8;
  const st=document.createElement('div');st.style.cssText=`position:fixed;left:${br.left}px;top:${br.top}px;width:${br.width}px;height:${br.height}px;z-index:955;perspective:${br.width*1.4}px;pointer-events:none`;document.body.appendChild(st);
  const sqs=[...B.querySelectorAll('.sq')];let kc={x:br.width/2,y:br.height/2};const tiles=[];
  sqs.forEach((sq,i)=>{const r=sq.getBoundingClientRect(),cs=getComputedStyle(sq);const t=document.createElement('div');
    t.style.cssText=`position:absolute;left:${r.left-br.left}px;top:${r.top-br.top}px;width:${r.width}px;height:${r.height}px;background:${cs.backgroundColor} ${cs.backgroundImage};background-size:${cs.backgroundSize};background-position:${cs.backgroundPosition};${hidden?'opacity:0;':''}`;
    const im=sq.querySelector('img.pc');if(im){const c=im.cloneNode();c.style.cssText='width:100%;height:100%;position:relative';t.appendChild(c);if(I&&I.kingSq&&im.src===PIC(I.kingColor,'k'))kc={x:r.left-br.left+r.width/2,y:r.top-br.top+r.height/2}}
    st.appendChild(t);tiles.push({t,x:r.left-br.left+r.width/2,y:r.top-br.top+r.height/2,i,row:Math.floor(i/8)})});
  B.style.visibility='hidden';
  tiles.forEach(o=>o.d=Math.hypot(o.x-kc.x,o.y-kc.y)/sz);
  return{st,tiles,sz,br,kc,B,remove(){st.remove();B.style.visibility=''}};
}
function full(css,html=''){const d=document.createElement('div');d.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:960;'+css;d.innerHTML=html;document.body.appendChild(d);return d}
const A_=(el,kf,o)=>{try{return el.animate(kf,o)}catch(e){return null}};
const FOOT='<svg viewBox="-60 -70 120 140" width="100%" height="100%"><g fill="#000"><ellipse cx="0" cy="26" rx="27" ry="33"/><ellipse cx="-27" cy="-20" rx="10" ry="25" transform="rotate(-28 -27 -20)"/><ellipse cx="0" cy="-34" rx="10" ry="27"/><ellipse cx="27" cy="-20" rx="10" ry="25" transform="rotate(28 27 -20)"/><path d="M-41 -44l-4 -14 10 9zM0 -60l-4 -10 8 0zM41 -44l4 -14 -10 9z"/></g></svg>';
const CHUTE=`<svg viewBox="0 0 200 150" preserveAspectRatio="none" width="100%" height="100%"><g stroke="#ddd" stroke-width=".8">${[20,50,80,120,150,180].map(x=>`<line x1="${x}" y1="48" x2="${x<100?6:194}" y2="150"/>`).join('')}</g>${[0,1,2,3,4,5].map(i=>{const a0=Math.PI+i*Math.PI/6,a1=a0+Math.PI/6;const p=a=>`${(100+Math.cos(a)*96).toFixed(1)} ${(50+Math.sin(a)*48).toFixed(1)}`;return`<path d="M100 50 L${p(a0)} A96 48 0 0 1 ${p(a1)} Z" fill="${i%2?'#fff':'#e53935'}"/>`}).join('')}</svg>`;
function puff(x,y,col,size,dur,dx=0,dy=-30){const p=full(`left:${x-size/2}px;top:${y-size/2}px;width:${size}px;height:${size}px;inset:auto;border-radius:50%;background:radial-gradient(circle,${col},transparent 70%)`);p.style.inset='';p.style.left=(x-size/2)+'px';p.style.top=(y-size/2)+'px';A_(p,[{transform:'translate(0,0) scale(.3)',opacity:.9},{transform:`translate(${dx}px,${dy}px) scale(2.2)`,opacity:0}],{duration:dur,fill:'forwards',easing:'ease-out'});setTimeout(()=>p.remove(),dur+50)}

const TRANS={
/* ---- Jurassic: the board cracks, grass grows, it sinks into the earth, a giant foot comes down ---- */
jurassic:{veil:'#000',
  async in(I){const K=stage(I),M=synth();if(M){SFX.rumble(M,0,3,.5);SFX.thud(M,.3,.6);SFX.thud(M,1.1,.8);SFX.thud(M,1.9,.9);SFX.roar(M,2.2,1.8,.6)}
    if(K){const{st,tiles,sz,kc,br}=K;let p='';for(let i=0;i<14;i++){let a=i/14*Math.PI*2,x=kc.x,y=kc.y,d=`M${x} ${y}`;for(let s=0;s<7;s++){a+=(Math.random()-.5)*.8;x+=Math.cos(a)*sz*.7;y+=Math.sin(a)*sz*.7;d+=` L${x.toFixed(1)} ${y.toFixed(1)}`}p+=`<path d="${d}" pathLength="1"/>`}
      const sv=document.createElement('div');sv.style.cssText='position:absolute;inset:0;z-index:2';sv.innerHTML=`<svg width="100%" height="100%" viewBox="0 0 ${br.width} ${br.height}"><g fill="none" stroke="#2b1a0e" stroke-width="3.5" stroke-dasharray="1" stroke-dashoffset="1">${p}</g></svg>`;st.appendChild(sv);
      sv.querySelectorAll('path').forEach((e,i)=>A_(e,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:700,delay:i*25,fill:'forwards'}));
      A_(st,[{transform:'translate(0,0)'},{transform:'translate(-4px,2px)'},{transform:'translate(3px,-3px)'},{transform:'translate(-2px,3px)'},{transform:'translate(0,0)'}],{duration:260,iterations:9});
      await sleep(550);
      tiles.forEach(o=>{for(let k=0;k<3;k++){const b=document.createElement('div');const h=sz*(.3+Math.random()*.4);b.style.cssText=`position:absolute;bottom:0;left:${10+Math.random()*80}%;width:${Math.max(2,sz*.06)}px;height:0;border-radius:3px 3px 0 0;background:linear-gradient(#9ccc65,#33691e);transform-origin:bottom;transform:rotate(${(Math.random()-.5)*40}deg)`;o.t.appendChild(b);A_(b,[{height:'0px'},{height:h+'px'}],{duration:500,delay:Math.random()*500,fill:'forwards'})}});
      await sleep(700);
      tiles.forEach(o=>A_(o.t,[{transform:'translateY(0) scale(1)',filter:'brightness(1)',opacity:1},{transform:`translateY(${sz*.7}px) scale(.8)`,filter:'brightness(.3)',opacity:0}],{duration:650,delay:o.d*55,fill:'forwards',easing:'ease-in'}));
      for(let i=0;i<10;i++){const o=tiles[Math.floor(Math.random()*64)];setTimeout(()=>puff(br.left+o.x,br.top+o.y,'rgba(150,115,70,.8)',sz*1.4,900,(Math.random()-.5)*60,-20),o.d*55+200)}
      await sleep(600)}
    else await sleep(600);
    const fp=full('display:flex;align-items:center;justify-content:center;z-index:965',`<div style="width:60vmin;height:70vmin">${FOOT}</div>`);
    A_(fp,[{transform:'scale(.35)',opacity:.15,filter:'blur(30px)'},{transform:'scale(1.6)',opacity:.6,filter:'blur(12px)',offset:.6},{transform:'scale(5)',opacity:1,filter:'blur(0)'}],{duration:1300,easing:'ease-in',fill:'forwards'});
    const bk=full('background:#000;opacity:0;z-index:966');A_(bk,[{opacity:0},{opacity:0,offset:.8},{opacity:1}],{duration:1300,fill:'forwards'});
    await sleep(1300);if(M){SFX.explode(M,2.6,.9)}A_(document.body,[{transform:'translate(0,0)'},{transform:'translate(0,9px)'},{transform:'translate(0,-5px)'},{transform:'translate(0,0)'}],{duration:300});
    await sleep(350);
    return()=>{K&&K.st.remove();fp.remove();bk.remove();M&&setTimeout(()=>M.stop(),1500)}},
  async out(I,veil){const M=synth();const K=stage(I,{hidden:true});
    const bk=full('background:#000;z-index:994');const fp=full('display:flex;align-items:center;justify-content:center;z-index:995',`<div style="width:60vmin;height:70vmin">${FOOT}</div>`);fp.style.transform='scale(5)';veil&&veil.remove();
    if(M){SFX.thud(M,0,.5);SFX.rumble(M,.2,2,.3)}
    A_(bk,[{opacity:1},{opacity:0}],{duration:500,fill:'forwards'});A_(fp,[{transform:'scale(5)',opacity:1,filter:'blur(0)'},{transform:'scale(9)',opacity:0,filter:'blur(30px)'}],{duration:900,fill:'forwards',easing:'ease-out'});
    if(K){K.tiles.forEach(o=>{o.t.style.opacity='';A_(o.t,[{transform:`translateY(${K.sz*.7}px) scale(.8)`,filter:'brightness(.3)',opacity:0},{transform:'translateY(-6px) scale(1.02)',filter:'brightness(1.1)',opacity:1,offset:.8},{transform:'translateY(0) scale(1)',filter:'brightness(1)',opacity:1}],{duration:700,delay:300+(8-o.d)*60,fill:'forwards',easing:'ease-out'});
        for(let k=0;k<2;k++){const b=document.createElement('div');b.style.cssText=`position:absolute;bottom:0;left:${10+Math.random()*80}%;width:${Math.max(2,K.sz*.06)}px;height:${K.sz*.4}px;border-radius:3px 3px 0 0;background:linear-gradient(#9ccc65,#33691e);transform-origin:bottom`;o.t.appendChild(b);A_(b,[{height:K.sz*.4+'px'},{height:'0px'}],{duration:600,delay:1100+Math.random()*500,fill:'forwards'})}});
      setTimeout(()=>{for(let i=0;i<8;i++){const o=K.tiles[Math.floor(Math.random()*64)];puff(K.br.left+o.x,K.br.top+o.y,'rgba(150,115,70,.7)',K.sz*1.2,800)}},600)}
    await sleep(1900);fp.remove();bk.remove();K&&K.remove();M&&M.stop()}},
/* ---- Rocket: the board lifts off on flames through the clouds; it comes back on a parachute ---- */
rocket:{veil:'#fff',
  async in(I){const K=stage(I),M=synth();if(M){M.riser(0,2.4,.35);M.noise(.2,2.6,{f:180,f2:400,g:.5,att:1,rel:.4});M.tone(55,.2,2.6,{type:'sawtooth',g:.06,att:1.2,rel:.3})}
    const els=[];
    if(K){const{st,br,sz}=K;const fl=document.createElement('div');fl.style.cssText=`position:absolute;left:18%;width:64%;top:98%;height:${br.height*.7}px;transform-origin:top;opacity:0;background:radial-gradient(ellipse at 50% 0,#fff 0,#ffeb3b 18%,#ff9800 40%,rgba(255,60,0,.6) 60%,transparent 72%);filter:blur(2px)`;st.appendChild(fl);
      A_(fl,[{opacity:0},{opacity:1}],{duration:400,delay:200,fill:'forwards'});A_(fl,[{transform:'scaleY(.8) scaleX(1)'},{transform:'scaleY(1.15) scaleX(.92)'}],{duration:90,iterations:60,direction:'alternate'});
      for(let i=0;i<18;i++)setTimeout(()=>puff(br.left+br.width/2+(Math.random()-.5)*br.width*.6,br.bottom+sz*.6,'rgba(220,220,220,.9)',sz*2.2,1300,(Math.random()<.5?-1:1)*(80+Math.random()*200),-10),100+i*60);
      A_(st,[{transform:'translate(0,0)'},{transform:'translate(-2px,1px)'},{transform:'translate(2px,-1px)'},{transform:'translate(0,0)'}],{duration:80,iterations:15});
      await sleep(1200);A_(st,[{transform:'translateY(0)'},{transform:'translateY(-170vh)'}],{duration:1300,easing:'cubic-bezier(.55,0,.9,.4)',fill:'forwards'})}
    else await sleep(1200);
    const sl=full('overflow:hidden;z-index:962');for(let i=0;i<26;i++){const l=document.createElement('div');l.style.cssText=`position:absolute;left:${Math.random()*100}%;top:-30%;width:2px;height:${20+Math.random()*30}%;background:linear-gradient(transparent,rgba(255,255,255,.8),transparent)`;sl.appendChild(l);A_(l,[{transform:'translateY(0)'},{transform:'translateY(160vh)'}],{duration:350+Math.random()*250,delay:400+Math.random()*500,iterations:4})}els.push(sl);
    await sleep(500);
    const sky=full('background:linear-gradient(#4fa3ff,#bfe3ff);opacity:0;z-index:957');A_(sky,[{opacity:0},{opacity:1}],{duration:500,fill:'forwards'});els.push(sky);
    for(let i=0;i<12;i++){const c=full(`left:${Math.random()*90-10}vw;top:-60vh;width:${40+Math.random()*50}vw;height:${30+Math.random()*30}vh;inset:auto;border-radius:50%;background:radial-gradient(ellipse,#fff 30%,rgba(255,255,255,0) 70%);z-index:963`);c.style.left=(Math.random()*90-10)+'vw';c.style.top='-60vh';A_(c,[{transform:'translateY(0)'},{transform:'translateY(200vh)'}],{duration:700+Math.random()*300,delay:i*90,fill:'forwards',easing:'ease-in'});els.push(c)}
    const wh=full('background:#fff;opacity:0;z-index:966');A_(wh,[{opacity:0},{opacity:1}],{duration:500,delay:900,fill:'forwards'});els.push(wh);
    await sleep(1450);
    return()=>{K&&K.st.remove();els.forEach(e=>e.remove());M&&setTimeout(()=>M.stop(),800)}},
  async out(I,veil){const M=synth();const K=stage(I);
    if(veil){veil.style.transition='opacity .7s';requestAnimationFrame(()=>veil.style.opacity=0);setTimeout(()=>veil.remove(),750)}
    if(M){M.noise(0,2.6,{type:'bandpass',f:500,f2:300,q:.6,g:.18,att:.4,rel:.6});SFX.thud(M,2.6,.5);M.tone(523,2.8,.3,{type:'triangle',g:.04});M.tone(659,2.95,.4,{type:'triangle',g:.04})}
    if(K){const{st,br,sz}=K;st.style.perspective='none';const ch=document.createElement('div');ch.style.cssText=`position:absolute;left:-12%;width:124%;bottom:100%;height:${br.height*.85}px;transform-origin:50% 100%`;ch.innerHTML=CHUTE;st.appendChild(ch);
      await A_(st,[{transform:'translateY(-130vh) rotate(-7deg)'},{transform:'translateY(-60vh) rotate(6deg)',offset:.35},{transform:'translateY(-18vh) rotate(-4deg)',offset:.7},{transform:'translateY(-2vh) rotate(1deg)',offset:.92},{transform:'translateY(0) rotate(0)'}],{duration:2700,easing:'cubic-bezier(.2,.6,.4,1)',fill:'forwards'}).finished.catch(()=>{});
      A_(st,[{transform:'translateY(0) scaleY(1)'},{transform:'translateY(5px) scaleY(.97)'},{transform:'translateY(0) scaleY(1)'}],{duration:260});
      for(let i=0;i<8;i++)puff(br.left+Math.random()*br.width,br.bottom,'rgba(200,190,170,.7)',sz*1.3,900,(Math.random()-.5)*120,-15);
      await A_(ch,[{transform:'scaleY(1) translateX(0)',opacity:1},{transform:'scaleY(.15) translateX(30%) rotate(30deg)',opacity:0}],{duration:900,fill:'forwards',easing:'ease-in'}).finished.catch(()=>{});
      K.remove()}else await sleep(1200);
    M&&M.stop()}},
/* ---- Volcano: the board heats up and melts into lava; the lava cools to obsidian that cracks away ---- */
volcano:{veil:'#ff5a00',
  async in(I){const K=stage(I),M=synth();if(M){SFX.rumble(M,0,3.2,.45);SFX.sizzle(M,.6,2.4,.12);for(let i=0;i<14;i++)M.tone(70+Math.random()*140,.4+i*.17,.12,{f2:200+Math.random()*200,g:.08});M.riser(1.6,1.5,.3)}
    const els=[];
    if(K){const{tiles,sz}=K;tiles.forEach(o=>A_(o.t,[{filter:'none',boxShadow:'none'},{filter:'sepia(1) saturate(5) hue-rotate(-25deg) brightness(1.35)',boxShadow:`inset 0 0 ${sz*.4}px #ff3d00`}],{duration:500,delay:o.d*75,fill:'forwards'}));
      await sleep(1200);
      tiles.forEach(o=>{o.t.style.transformOrigin='top';A_(o.t,[{transform:'translateY(0) scaleY(1)',borderRadius:'0',opacity:1},{transform:`translateY(${sz*.5}px) scaleY(2.4)`,borderRadius:'0 0 50% 50%',opacity:0}],{duration:900,delay:o.row*70+Math.random()*250,fill:'forwards',easing:'ease-in'})})}
    else await sleep(1000);
    const lava=full(`top:auto;height:0;bottom:0;background:linear-gradient(to top,#ff3d00,#ff6d00 55%,#ffab00);box-shadow:0 -3vh 8vh #ff6d00;z-index:963`);lava.style.top='auto';
    const wave=document.createElement('div');wave.style.cssText='position:absolute;left:-10%;width:120%;top:-3.9vh;height:4vh';wave.innerHTML='<svg viewBox="0 0 400 40" preserveAspectRatio="none" width="100%" height="100%"><path d="M0 40 Q25 0 50 20 T100 20 T150 20 T200 20 T250 20 T300 20 T350 20 T400 20 V40Z" fill="#ffab00"/></svg>';lava.appendChild(wave);
    A_(wave,[{transform:'translateX(0)'},{transform:'translateX(-8%)'}],{duration:500,iterations:8,direction:'alternate'});
    await A_(lava,[{height:'0vh'},{height:'112vh'}],{duration:1500,delay:300,fill:'forwards',easing:'cubic-bezier(.4,0,.6,1)'}).finished.catch(()=>{});els.push(lava);
    return()=>{K&&K.st.remove();els.forEach(e=>e.remove());M&&setTimeout(()=>M.stop(),800)}},
  async out(I,veil){const M=synth();const K=stage(I);
    const cool=full('background:#ff5a00;z-index:994');veil&&veil.remove();
    if(M){SFX.sizzle(M,0,2,.18);M.noise(1.6,1.5,{type:'bandpass',f:400,q:.6,g:.3,att:.01,rel:1});for(let i=0;i<10;i++)M.drum(1.7+i*.07,.2,90+Math.random()*80)}
    A_(cool,[{background:'#ff5a00'},{background:'#5a1a08',offset:.5},{background:'#1d1716'}],{duration:1100,fill:'forwards'});
    let obs=null;
    if(K){const{br,sz}=K;obs=full(`left:${br.left}px;top:${br.top}px;width:${br.width}px;height:${br.height}px;inset:auto;z-index:995`);obs.style.left=br.left+'px';obs.style.top=br.top+'px';
      const bits=[];for(let i=0;i<64;i++){const b=document.createElement('div');b.style.cssText=`position:absolute;left:${(i%8)*sz}px;top:${Math.floor(i/8)*sz}px;width:${sz+1}px;height:${sz+1}px;background:linear-gradient(135deg,#2b2322,#120e0e);box-shadow:inset 0 0 ${sz*.18}px rgba(255,90,0,.85)`;obs.appendChild(b);bits.push(b)}
      let p='';for(let i=0;i<10;i++){let x=Math.random()*br.width,y=Math.random()*br.height,d=`M${x} ${y}`;for(let s=0;s<5;s++){x+=(Math.random()-.5)*sz*2;y+=(Math.random()-.5)*sz*2;d+=` L${x.toFixed(0)} ${y.toFixed(0)}`}p+=`<path d="${d}" pathLength="1"/>`}
      const sv=document.createElement('div');sv.style.cssText='position:absolute;inset:0';sv.innerHTML=`<svg width="100%" height="100%" viewBox="0 0 ${br.width} ${br.height}"><g fill="none" stroke="#ff9100" stroke-width="3" stroke-dasharray="1" stroke-dashoffset="1" style="filter:drop-shadow(0 0 4px #ff3d00)">${p}</g></svg>`;obs.appendChild(sv);
      await sleep(1000);A_(cool,[{opacity:1},{opacity:0}],{duration:500,fill:'forwards'});
      sv.querySelectorAll('path').forEach((e,i)=>A_(e,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:500,delay:i*40,fill:'forwards'}));
      await sleep(800);sv.remove();
      bits.forEach((b,i)=>A_(b,[{transform:'translateY(0) rotate(0)',opacity:1},{transform:`translateY(${br.height*(.6+Math.random()*.6)}px) rotate(${(Math.random()-.5)*120}deg)`,opacity:0}],{duration:800,delay:Math.random()*450,fill:'forwards',easing:'ease-in'}));
      await sleep(1300);obs.remove();K.remove()}
    else{await sleep(1000);await A_(cool,[{opacity:1},{opacity:0}],{duration:600,fill:'forwards'}).finished.catch(()=>{})}
    cool.remove();M&&M.stop()}},
/* ---- Ghosts: colour drains, the fallen rise out of the board and float into the night ---- */
ghosts:{veil:'#05060f',
  async in(I,deadImgs){const K=stage(I),M=synth();if(M){M.noise(0,3.6,{type:'bandpass',f:400,f2:1200,q:1.5,g:.14,att:1,rel:1});M.tone(220,0,3.5,{g:.04,att:1,rel:1});M.tone(222.5,0,3.5,{g:.04,att:1,rel:1});M.bell(110,.3,.08);M.bell(110,1.9,.08);M.choir([207.6,246.9,311],1,2.6,.015)}
    const els=[];
    if(K){const{tiles,br,sz}=K;tiles.forEach(o=>A_(o.t,[{filter:'grayscale(0) brightness(1)'},{filter:'grayscale(1) brightness(.5)'}],{duration:1300,fill:'forwards'}));
      for(let i=0;i<6;i++){const f=full(`left:${br.left-br.width*.2+Math.random()*br.width}px;top:${br.top+Math.random()*br.height}px;width:${br.width*.8}px;height:${br.width*.35}px;inset:auto;border-radius:50%;background:radial-gradient(ellipse,rgba(200,220,255,.38),transparent 70%);opacity:0`);f.style.left=(br.left-br.width*.2+Math.random()*br.width)+'px';f.style.top=(br.top+Math.random()*br.height-br.width*.17)+'px';
        A_(f,[{opacity:0,transform:'translateX(0)'},{opacity:1,transform:`translateX(${(Math.random()-.5)*br.width*.6}px)`}],{duration:2600,fill:'forwards'});els.push(f)}
      const list=(I.dead.w.map(t=>'w'+t).concat(I.dead.b.map(t=>'b'+t))).slice(0,16);if(!list.length)list.push('wp','bp','wn');
      list.forEach((k,i)=>{const left=i%2===0;const g=full(`width:${sz*.9}px;height:${sz*.9}px;inset:auto;filter:brightness(1.8) sepia(1) hue-rotate(160deg) saturate(3) drop-shadow(0 0 10px #8ff);opacity:0`,`<img src="${PIC(k[0],k[1])}" style="width:100%;height:100%">`);
        g.style.left=(left?br.left-sz*.6:br.right-sz*.3)+(Math.random()-.5)*sz+'px';g.style.top=br.bottom-sz*.5+'px';
        A_(g,[{transform:'translate(0,0)',opacity:0},{transform:`translate(${left?sz*.6:-sz*.6}px,${-br.height*(.3+Math.random()*.5)}px)`,opacity:.8,offset:.45},{transform:`translate(${(Math.random()-.5)*sz*2}px,${-br.height*1.6}px)`,opacity:0}],{duration:2600,delay:200+i*110,fill:'forwards',easing:'ease-in-out'});els.push(g)})}
    const moon=full('left:auto;right:8vw;top:8vh;width:16vmin;height:16vmin;inset:auto;border-radius:50%;background:radial-gradient(circle at 40% 40%,#fff,#cfd8dc 60%,#90a4ae);box-shadow:0 0 6vmin 2vmin rgba(220,235,255,.6);opacity:0');moon.style.right='8vw';moon.style.top='8vh';moon.style.left='auto';A_(moon,[{opacity:0},{opacity:1}],{duration:1600,delay:600,fill:'forwards'});els.push(moon);
    await sleep(2300);const dk=full('background:#05060f;opacity:0;z-index:966');els.push(dk);await A_(dk,[{opacity:0},{opacity:1}],{duration:900,fill:'forwards'}).finished.catch(()=>{});
    return()=>{K&&K.st.remove();els.forEach(e=>e.remove());M&&setTimeout(()=>M.stop(),800)}},
  async out(I,veil){const M=synth();const K=stage(I);const els=[];
    if(M){M.choir([261.6,329.6,392],0,3,.014);M.bell(523,.4,.05);M.bell(659,1.2,.05);M.bell(784,2,.05)}
    if(K){K.tiles.forEach(o=>{o.t.style.filter='grayscale(1) brightness(.5)';A_(o.t,[{filter:'grayscale(1) brightness(.5)'},{filter:'grayscale(0) brightness(1)'}],{duration:1400,delay:900,fill:'forwards'})});
      const{br,sz}=K;const list=(I.dead.w.map(t=>'w'+t).concat(I.dead.b.map(t=>'b'+t))).slice(0,12);
      list.forEach((k,i)=>{const g=full(`width:${sz*.8}px;height:${sz*.8}px;inset:auto;filter:brightness(1.8) sepia(1) hue-rotate(160deg) saturate(3) drop-shadow(0 0 10px #8ff);z-index:996;opacity:0`,`<img src="${PIC(k[0],k[1])}" style="width:100%;height:100%">`);
        const left=i%2===0;g.style.left=(left?br.left-sz*.9:br.right+sz*.1)+'px';g.style.top=(br.top-sz*2)+'px';
        A_(g,[{transform:'translateY(0)',opacity:0},{transform:`translateY(${sz*1.5}px)`,opacity:.8,offset:.4},{transform:`translateY(${sz*2+(i>>1)*sz*.6}px) scale(.4)`,opacity:0}],{duration:2200,delay:i*120,fill:'forwards',easing:'ease-in-out'});els.push(g)})}
    if(veil){veil.style.transition='opacity 1.3s';requestAnimationFrame(()=>veil.style.opacity=0)}
    const dawn=full('background:radial-gradient(ellipse at 50% 100%,rgba(255,200,120,.55),transparent 70%);opacity:0;z-index:997');A_(dawn,[{opacity:0},{opacity:1,offset:.5},{opacity:0}],{duration:2400,fill:'forwards'});els.push(dawn);
    await sleep(2600);veil&&veil.remove();els.forEach(e=>e.remove());K&&K.remove();M&&M.stop()}},
/* ---- Fourth wall: the whole app shrinks into a monitor in a dark room; at the end the film burns away ---- */
studio:{veil:'#000',
  async in(I){const M=synth();const app=document.getElementById('app');const els=[];
    if(M){M.noise(0,.05,{type:'bandpass',f:3000,g:.4,att:.001,rel:.04});M.tone(60,0,2.2,{type:'sine',g:.05,att:.3,rel:.3});M.whoosh(.6,.3);M.riser(.4,1.4,.25)}
    const room=full('background:radial-gradient(ellipse at center,rgba(0,0,0,0) 30%,rgba(0,0,0,.92) 75%);opacity:0;z-index:958');els.push(room);
    if(app){app.style.transformOrigin='50% 50%';A_(app,[{transform:'perspective(1400px) rotateY(0) scale(1)',boxShadow:'0 0 0 0 #111',borderRadius:'0'},{transform:'perspective(1400px) rotateY(-16deg) rotateX(4deg) scale(.42)',boxShadow:'0 0 0 2.2vmin #111, 0 0 0 2.6vmin #444, 0 4vmin 10vmin #000',borderRadius:'1vmin',offset:.7},{transform:'perspective(1400px) rotateY(-16deg) rotateX(4deg) scale(.38)',boxShadow:'0 0 0 2.2vmin #111, 0 0 0 2.6vmin #444, 0 4vmin 10vmin #000',borderRadius:'1vmin'}],{duration:1700,fill:'forwards',easing:'cubic-bezier(.6,0,.3,1)'})}
    A_(room,[{opacity:0},{opacity:1}],{duration:1200,fill:'forwards'});
    await sleep(1600);const bk=full('background:#000;opacity:0;z-index:966');els.push(bk);await A_(bk,[{opacity:0},{opacity:1}],{duration:400,fill:'forwards'}).finished.catch(()=>{});
    return()=>{if(app){app.getAnimations().forEach(a=>a.cancel());app.style.transformOrigin=''}els.forEach(e=>e.remove());M&&setTimeout(()=>M.stop(),600)}},
  async out(I,veil){const M=synth();const B=document.getElementById('board');const br=B?B.getBoundingClientRect():{left:innerWidth/2,top:innerHeight/2,width:0,height:0};
    const cx=br.left+br.width/2,cy=br.top+br.height/2;if(M)SFX.projector(M,0,2.6);
    const burn=full('background:#000;z-index:994');const ring=full('z-index:995');veil&&veil.remove();
    const strips=[0,1].map(i=>{const s=full(`inset:auto;top:0;bottom:0;width:6vmin;${i?'right':'left'}:0;background:repeating-linear-gradient(#000 0 3vmin,#d9d9d9 3vmin 5vmin,#000 5vmin 8vmin);opacity:.8;z-index:996`);s.style[i?'right':'left']='0';s.style.top='0';s.style.bottom='0';A_(s,[{backgroundPosition:'0 0'},{backgroundPosition:'0 16vmin'}],{duration:180,iterations:12});return s});
    const t0=performance.now(),D=2300,maxR=Math.hypot(innerWidth,innerHeight);
    await new Promise(res=>{const f=()=>{const k=Math.min(1,(performance.now()-t0)/D);const r=Math.pow(k,1.6)*maxR,j=r+(14+Math.random()*10);
      const m=`radial-gradient(circle at ${cx}px ${cy}px, transparent ${r}px, #000 ${j}px)`;burn.style.webkitMaskImage=m;burn.style.maskImage=m;
      ring.style.background=`radial-gradient(circle at ${cx}px ${cy}px, transparent ${Math.max(0,r-8)}px, rgba(255,245,200,.95) ${r}px, rgba(255,120,0,.9) ${r+8}px, rgba(120,30,0,.6) ${j}px, transparent ${j+14}px)`;
      if(k<1)requestAnimationFrame(f);else res()};f()});
    burn.remove();ring.remove();strips.forEach(s=>s.remove());M&&M.stop()}},
};

/* ================= dialogue: Ukrainian voice-over + subtitles ================= */
let DIALOG=null;
function loadDialog(){if(DIALOG)return Promise.resolve(DIALOG);return fetch(`legend/dialog.json?v=${VER}`).then(r=>r.json()).then(d=>DIALOG=d).catch(()=>null)}
function talk(C,id){
  const d=DIALOG&&DIALOG.films[id];if(!d)return;const V=DIALOG.voices;const lines=d.lines.map((l,i)=>({t:l[0],who:l[1],text:l[2],i}));
  const sub=document.createElement('div');sub.style.cssText='position:fixed;left:50%;bottom:6vh;transform:translateX(-50%);z-index:989;max-width:min(860px,88vw);text-align:center;pointer-events:none;font:600 clamp(15px,2.3vw,24px)/1.35 system-ui,sans-serif;color:#fff;text-shadow:0 2px 4px #000,0 0 12px #000;opacity:0;transition:opacity .2s';document.body.appendChild(sub);
  let cur=null,busyUntil=0,idx=0;const seek=C.I.seek||0;while(idx<lines.length&&lines[idx].t<seek-.2)idx++;
  const ukVoice=(()=>{try{return speechSynthesis.getVoices().find(v=>/^uk/i.test(v.lang))||null}catch(e){return null}})();
  const show=(l,ms)=>{const v=V[l.who]||{};sub.innerHTML=`<span style="color:${v.col||'#ffd54f'}">${d.names[l.who]||''}:</span> ${l.text}`;sub.style.opacity=1;clearTimeout(sub._t);sub._t=setTimeout(()=>{sub.style.opacity=0},ms)};
  const fallback=l=>{const ms=Math.max(1600,l.text.length*65);show(l,ms);busyUntil=performance.now()+ms;
    if(ukVoice&&!(typeof S!=='undefined'&&S.sound===false)){try{const u=new SpeechSynthesisUtterance(l.text);u.voice=ukVoice;u.lang=ukVoice.lang;const v=V[l.who]||{};u.pitch=/-1\dHz/.test(v.pitch)?.7:/\+[2-4]\dHz/.test(v.pitch)?1.4:1;u.rate=1.05;speechSynthesis.speak(u)}catch(e){}}};
  const say=l=>{if(typeof S!=='undefined'&&S.sound===false){fallback(l);return}
    const a=new Audio(`legend/voice/${id}/${l.i}.mp3?v=${VER}`);a.volume=1;cur=a;busyUntil=performance.now()+8000;
    try{voiceFx(a,(d.fx&&d.fx[l.who])||(V[l.who]||{}).fx||'none')}catch(e){}
    a.onloadedmetadata=()=>{const ms=a.duration*1000+250;show(l,ms);busyUntil=performance.now()+ms;C.M&&C.M.duck&&C.M.duck(true)};
    a.onended=()=>{busyUntil=0;C.M&&C.M.duck&&C.M.duck(false)};
    a.onerror=()=>{if(cur===a){cur=null;fallback(l)}};
    a.play().catch(()=>{if(cur===a){cur=null;fallback(l)}})};
  C.every(()=>{const r=C.raw||0;if(idx>=lines.length)return;const l=lines[idx];if(r<l.t)return;
    if(performance.now()<busyUntil&&r-l.t<2.5)return;idx++;say(l)});
  /* voice effects: ghosts echo, astronauts talk over the radio, the director uses a megaphone */
  let AX=null;
  function voiceFx(a,kind){
    AX=AX||new (window.AudioContext||window.webkitAudioContext)();if(AX.state==='suspended')AX.resume();
    const src=AX.createMediaElementSource(a);const out=AX.createGain();out.gain.value=1.15;out.connect(AX.destination);
    const shaper=amt=>{const w=AX.createWaveShaper();const c=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;c[i]=Math.tanh(x*amt)/Math.tanh(amt)}w.curve=c;return w};
    if(kind==='ghost'){src.connect(out);const dl=AX.createDelay(1);dl.delayTime.value=.19;const fb=AX.createGain();fb.gain.value=.38;const lp=AX.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2200;const wet=AX.createGain();wet.gain.value=.55;
      src.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(wet);wet.connect(out)}
    else if(kind==='radio'){const hp=AX.createBiquadFilter();hp.type='highpass';hp.frequency.value=450;const lp=AX.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3000;src.connect(hp);hp.connect(shaper(2.2)).connect(lp).connect(out)}
    else if(kind==='mega'){const bp=AX.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1400;bp.Q.value=.7;src.connect(bp);bp.connect(shaper(3)).connect(out)}
    else src.connect(out)}
  C.onEnd(()=>{try{cur&&cur.pause()}catch(e){}try{speechSynthesis.cancel()}catch(e){}sub.remove();try{AX&&AX.close()}catch(e){}});
}

/* ================= playing a film ================= */
const SCN=window.LEGEND_SCENES=window.LEGEND_SCENES||{};
function loadScene(id){if(SCN[id])return Promise.resolve();return new Promise((res,rej)=>{const s=document.createElement('script');s.src=`legend/${id}.js?v=${VER}`;s.onload=()=>SCN[id]?res():rej(new Error('scene '+id));s.onerror=()=>rej(new Error('scene '+id));document.head.appendChild(s)})}
window.playLegend=async function(I){
  if(!window.CINE)throw new Error('cinema not loaded');
  await (window.THREE?Promise.resolve():window.loadThree());
  await loadScene(I.id);await loadDialog();
  const cen=census(I.fen);I.alive=cen.alive;I.dead=cen.dead;
  I.imgs=await loadImgs();I.app=appCanvas(I.fen,I.imgs);
  const tr=TRANS[I.id];let undo=null;
  if(!I.seek)try{undo=await tr.in(I)}catch(e){console.warn('legend in',e)}
  let veil=null;
  try{veil=await CINE.engine(Object.assign({},I,{veil:tr.veil,veilOut:tr.veil,veilIn:.7,keepVeil:true,onStart:C=>{undo&&undo();undo=null;const B=document.getElementById('board');if(B)B.style.visibility=''}}),C=>{const r=SCN[I.id](C,kit(C));talk(C,I.id);return r})}
  catch(e){undo&&undo();throw e}
  try{await tr.out(I,veil)}catch(e){console.warn('legend out',e)}
  finally{veil&&veil.remove();const B=document.getElementById('board');if(B)B.style.visibility=''}
};
window.legendDebug=(id,seek=0,extra={})=>window.playLegend(Object.assign({id,color:'w',piece:{jurassic:'n',rocket:'q',volcano:'r',ghosts:'q',studio:'r'}[id]||'q',kingColor:'b',fen:'2r3k1/pp3ppp/2n5/8/3N4/2P5/P4PPP/R1B3K1 w - - 0 1',kingSq:'g8',checkers:['r','b'],seek},extra));
})();
