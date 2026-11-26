/* Legendary mate 5 — "Четверта стіна" (castling / en passant / king move / underpromotion mate). ~2 minutes.
   It starts as an epic film… then the clapperboard snaps: it is a film set, the fallen are the crew, the
   director is our king. The film is rewound, the doomed king refuses his role, runs off the set into our room,
   tears the screen open and escapes onto the real page of the trainer — until a cursor catches him. Take three. */
(function(){
const SC=window.LEGEND_SCENES=window.LEGEND_SCENES||{};
SC.studio=(C,L)=>{
const T=C.T,V=C.V,S=L.SFX,R=L.rng(3131),D=120,I=C.I;
const RM=V(160,0,0),SCR=RM.clone().add(V(0,4.3,-5.55));
C.scene.background=new T.Color(0x0b0b10);C.scene.fog=new T.FogExp2(0x0b0b10,.006);
L.lights(0xfff4e0,0x202028,.7,0xffe0b0,.9,V(10,30,20));
/* ---------- the film set ---------- */
L.mesh(new T.BoxGeometry(92,34,76),L.std(0x16161c,{side:T.BackSide}),0,17,4);
const fl=L.mesh(new T.PlaneGeometry(92,76),L.std(0x2b2b30),0,0,4);fl.rotation.x=-Math.PI/2;
const paint=(draw)=>L.canvas(1024,440,(x,w,h)=>draw(x,w,h));
const bdMed=paint((x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#3b5d9c');g.addColorStop(.6,'#f2a65a');g.addColorStop(1,'#f7d08a');x.fillStyle=g;x.fillRect(0,0,w,h);
  x.fillStyle='#fff3c4';x.beginPath();x.arc(w*.7,h*.55,40,0,7);x.fill();x.fillStyle='#5d7a3a';x.beginPath();x.moveTo(0,h);for(let i=0;i<=20;i++)x.lineTo(i*w/20,h*.68-Math.sin(i*.9)*30-Math.random()*15);x.lineTo(w,h);x.fill();
  x.fillStyle='#3b3046';[[.15,.5],[.82,.46]].forEach(([cx,cy])=>{const X=cx*w,Y=cy*h;x.fillRect(X-50,Y,100,h*.3);for(let i=0;i<5;i++)x.fillRect(X-50+i*22,Y-18,12,18);x.fillRect(X-18,Y-60,36,60);x.beginPath();x.moveTo(X-22,Y-60);x.lineTo(X,Y-100);x.lineTo(X+22,Y-60);x.fill()})});
const bdDes=paint((x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#5aa0e0');g.addColorStop(.6,'#ffe0a0');g.addColorStop(1,'#f0c070');x.fillStyle=g;x.fillRect(0,0,w,h);x.fillStyle='#fff7d0';x.beginPath();x.arc(w*.25,h*.3,36,0,7);x.fill();
  x.fillStyle='#c8913f';[[.3,150],[.5,210],[.72,130]].forEach(([cx,s])=>{x.beginPath();x.moveTo(cx*w-s,h*.78);x.lineTo(cx*w,h*.78-s*.9);x.lineTo(cx*w+s,h*.78);x.fill()});x.fillStyle='#e0b060';x.fillRect(0,h*.78,w,h)});
const bdSpace=paint((x,w,h)=>{x.fillStyle='#04040e';x.fillRect(0,0,w,h);for(let i=0;i<400;i++){x.fillStyle=`rgba(255,255,255,${Math.random()})`;x.fillRect(Math.random()*w,Math.random()*h,1.5,1.5)}
  const g=x.createRadialGradient(w*.68,h*.4,10,w*.68,h*.4,110);g.addColorStop(0,'#c39bff');g.addColorStop(1,'#4a2a8a');x.fillStyle=g;x.beginPath();x.arc(w*.68,h*.4,110,0,7);x.fill();x.strokeStyle='rgba(220,200,255,.7)';x.lineWidth=6;x.beginPath();x.ellipse(w*.68,h*.4,190,40,-.3,0,7);x.stroke()});
const bd=L.mesh(new T.PlaneGeometry(74,32),new T.MeshBasicMaterial({map:bdMed}),0,15,-22);
L.mesh(new T.BoxGeometry(.4,32,.4),L.std(0x555555),-37,15,-21.7);L.mesh(new T.BoxGeometry(.4,32,.4),L.std(0x555555),37,15,-21.7);
const stage=L.mesh(new T.CircleGeometry(19,40),L.std(0x6b8f3a),0,.03,-4);stage.rotation.x=-Math.PI/2;
L.board(14,'#EBECD0','#739552',.06,0,-2);
/* castles (props: flat fronts on wooden supports) */
[-13,13].forEach(x=>{const g=L.group(x,0,-12);const M=L.std(0x8d8478);L.mesh(new T.CylinderGeometry(2.4,2.8,9,10),M,0,4.5,0,g);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;L.mesh(new T.BoxGeometry(.9,1.1,.9),M,Math.cos(a)*2.3,9.5,Math.sin(a)*2.3,g)}
  L.mesh(new T.PlaneGeometry(1.6,2.6),new T.MeshBasicMaterial({color:x<0?0x1e88e5:0xd32f2f,side:T.DoubleSide}),0,12,0,g).position.y=11.6;L.mesh(new T.CylinderGeometry(.06,.06,4),L.std(0x333333),0,11,-.1,g)});
/* studio lights */
const beams=[];[[-17,8],[17,8],[-10,17],[10,17]].forEach(([x,z])=>{const g=L.group(x,0,z);L.mesh(new T.CylinderGeometry(.08,.08,9),L.std(0x222222),0,4.5,0,g);for(let i=0;i<3;i++){const l=L.mesh(new T.CylinderGeometry(.05,.05,2.4),L.std(0x222222),Math.cos(i*2.1)*.8,.6,Math.sin(i*2.1)*.8,g);l.rotation.set(Math.sin(i*2.1)*.6,0,-Math.cos(i*2.1)*.6)}
  const h=L.mesh(new T.BoxGeometry(1.4,1.1,1.4),L.std(0x111111),0,9.2,0,g);h.lookAt(0,1,-4);
  const bm=L.mesh(new T.ConeGeometry(4,14,24,1,true),new T.MeshBasicMaterial({color:0xfff2c8,transparent:true,opacity:.07,blending:C.ADD,depthWrite:false,side:T.DoubleSide}),0,0,0);const a=V(x,9.2,z),b=V(0,0,-4);bm.position.lerpVectors(a,b,.5);bm.quaternion.setFromUnitVectors(V(0,1,0),a.clone().sub(b).normalize());bm.scale.y=a.distanceTo(b)/14;beams.push(bm)});
/* the film camera on its dolly */
const rig=L.group(0,0,19);L.mesh(new T.BoxGeometry(.3,.1,20),L.std(0x777777),-1,.05,0,rig);L.mesh(new T.BoxGeometry(.3,.1,20),L.std(0x777777),1,.05,0,rig);
L.mesh(new T.BoxGeometry(2.6,.6,2),L.std(0x333333),0,.5,0,rig);L.mesh(new T.CylinderGeometry(.15,.15,3),L.std(0x222222),0,2,0,rig);L.mesh(new T.BoxGeometry(1.4,1.2,2),L.std(0x1a1a1a),0,4,0,rig);const ln=L.mesh(new T.CylinderGeometry(.4,.5,1.2,14),L.std(0x111111),0,4,-1.5,rig);ln.rotation.x=Math.PI/2;
L.mesh(new T.TorusGeometry(.6,.12,6,16),L.std(0x111111),-.5,5.1,.2,rig).rotation.y=Math.PI/2;L.mesh(new T.TorusGeometry(.6,.12,6,16),L.std(0x111111),.5,5.1,.2,rig).rotation.y=Math.PI/2;
/* boom microphone */
L.mesh(new T.CylinderGeometry(.06,.06,7),L.std(0x333333),7,3.5,11);const bp=L.mesh(new T.CylinderGeometry(.05,.05,9),L.std(0x333333),3,7,6);bp.rotation.set(.75,0,1.1);L.mesh(new T.CapsuleGeometry?new T.CapsuleGeometry(.35,1,4,8):new T.CylinderGeometry(.35,.35,1.6),L.std(0x3e3e3e),-.4,7.3,2.4).rotation.z=Math.PI/2;
/* director's chair + megaphone */
const ch=L.group(12,0,11);L.mesh(new T.BoxGeometry(1.8,.15,1.6),L.std(0x6d4c41),0,1.6,0,ch);L.mesh(new T.BoxGeometry(1.8,1.2,.1),L.std(0x212121),0,2.5,.8,ch);for(const x of[-.8,.8])for(const z of[-.7,.7]){const l=L.mesh(new T.BoxGeometry(.1,1.7,.1),L.std(0x6d4c41),x,.8,z,ch);l.rotation.x=z>0?.25:-.25}
const mega=L.mesh(new T.ConeGeometry(.5,1.3,14,1,true),L.std(0xf5f5f5,{side:T.DoubleSide}),13.2,3.2,10.2);mega.rotation.z=Math.PI/2+.3;
/* crates for the crew (the fallen) */
const seats=[];for(let i=0;i<6;i++){const x=-21+(i%3)*2.6,z=10+Math.floor(i/3)*2.8;L.mesh(new T.BoxGeometry(2.2,1.6,2.2),L.std(0x8d6e3f),x,.8,z);seats.push(V(x,1.6,z))}
for(let i=0;i<8;i++)seats.push(V(18+(i%4)*2,0,-2+Math.floor(i/4)*2.6));for(let i=0;i<10;i++)seats.push(V(-26+i*2.2,0,24));
/* cables and props from the other legendary films */
for(let i=0;i<6;i++){const c=L.mesh(new T.BoxGeometry(.12,.06,10+R()*10),L.std(0x0a0a0a),-14+i*5,.04,12);c.rotation.y=(R()-.5)*1.2}
{const g=L.group(-27,0,-6);const M=L.std(0x55693a);L.mesh(new T.SphereGeometry(1,8,6),M,0,2.2,0,g).scale.set(1.6,1,.9);L.mesh(new T.BoxGeometry(1.5,.8,.8),M,1.9,3,0,g);L.mesh(new T.ConeGeometry(.6,3,6),M,-2.2,2,0,g).rotation.z=Math.PI/2;for(const z of[-.5,.5])L.mesh(new T.BoxGeometry(.5,2.2,.5),M,0,1,z,g)}
{const g=L.group(-30,0,2);const W=L.std(0xf4f4f4);L.mesh(new T.CylinderGeometry(.7,.7,6,14),W,0,3,0,g);L.mesh(new T.ConeGeometry(.7,1.6,14),L.std(0xd32f2f),0,6.8,0,g);for(let i=0;i<4;i++){const f=L.mesh(new T.BoxGeometry(.1,1.4,.9),L.std(0xd32f2f),0,.7,0,g);const a=i*Math.PI/2;f.position.set(Math.cos(a)*.8,.7,Math.sin(a)*.8);f.rotation.y=-a}}
/* the studio door */
L.mesh(new T.BoxGeometry(.4,7,.4),L.std(0x444444),-45.6,3.5,3.8);L.mesh(new T.BoxGeometry(.4,7,.4),L.std(0x444444),-45.6,3.5,8.2);L.mesh(new T.BoxGeometry(.4,.4,4.8),L.std(0x444444),-45.6,7,6);
const doorP=L.group(-45.6,0,3.9);const door=L.mesh(new T.BoxGeometry(.15,6.8,4.2),L.std(0x8d6e63),0,3.4,2.1,doorP);const doorGlow=C.sprite(0xffd08a,8,0);doorGlow.position.set(-46,3.5,6);
C.every(t=>{const r=C.raw;doorP.rotation.y=r>59.5&&r<62.5?-Math.min(1.4,(r-59.5)*3)*(r<62?1:1-(r-62)*2):0;doorGlow.material.opacity=r>59.5&&r<62.5?.8:0});
/* ---------- our room (where the screen is) ---------- */
{const W=L.std(0x3c3a44),F=L.std(0x5a3d26);L.mesh(new T.BoxGeometry(30,.3,30),F,RM.x,-.15,RM.z);L.mesh(new T.BoxGeometry(30,14,.4),W,RM.x,7,RM.z-10);L.mesh(new T.BoxGeometry(.4,14,30),W,RM.x-15,7,RM.z);L.mesh(new T.BoxGeometry(.4,14,30),W,RM.x+15,7,RM.z);L.mesh(new T.BoxGeometry(30,14,.4),W,RM.x,7,RM.z+15);L.mesh(new T.BoxGeometry(30,.4,30),L.std(0x2a2830),RM.x,14,RM.z);
  L.mesh(new T.BoxGeometry(10,.3,4),L.std(0x6b4a30),RM.x,2.5,RM.z-5);for(const x of[-4.5,4.5])L.mesh(new T.BoxGeometry(.3,2.5,.3),L.std(0x6b4a30),RM.x+x,1.25,RM.z-4);
  L.mesh(new T.BoxGeometry(5.4,3.5,.25),L.std(0x111111),SCR.x,SCR.y,SCR.z-.15);L.mesh(new T.BoxGeometry(.4,1.2,.4),L.std(0x111111),SCR.x,3.2,SCR.z-.2);
  const scr=L.mesh(new T.PlaneGeometry(5,3.12),new T.MeshBasicMaterial({map:L.appTex()}),SCR.x,SCR.y,SCR.z);
  L.mesh(new T.BoxGeometry(.3,7,4.4),L.std(0x8d6e63),RM.x-14.8,3.5,RM.z+8);
  const win=L.mesh(new T.PlaneGeometry(6,4.5),new T.MeshBasicMaterial({color:0x1a2a5a}),RM.x+6,8,RM.z-9.75);for(let i=0;i<20;i++){const s=C.sprite(0xffffff,.15,.9);s.position.set(RM.x+3.3+Math.random()*5.4,6+Math.random()*4,RM.z-9.7)}
  const lamp=C.sprite(0xffc98a,6,.4);lamp.position.set(RM.x-4,5,RM.z-5);const glow=C.sprite(0x9fd3ff,9,.35);glow.position.copy(SCR).add(V(0,0,.6));
  const pl=new T.PointLight(0xbfd8ff,1.4,22,1.6);pl.position.copy(SCR).add(V(0,0,2));C.add(pl);const rl=new T.PointLight(0xffc98a,.8,22,1.6);rl.position.set(RM.x-4,6,RM.z);C.add(rl)}
/* ---------- the cast ---------- */
const AR=L.armies(),K=AR.king,MK=AR.myKing,H=AR.hero;[K,MK,H].forEach(a=>a.raw=true);
const st=L.stands(seats);AR.dead.forEach(d=>{const a=L.actor(d.c,d.t,{size:2});a.raw=true;st.seatNow(a)});
AR.atk.forEach(a=>a.key(0,V((R()-.5)*14,0,26)));AR.def.forEach(a=>a.key(0,V((R()-.5)*14,0,-24)));
L.formation(AR.atk,6,1,12);L.formation(AR.def,-9,-1,12);[...AR.atk,...AR.def].forEach(a=>a.keys[a.keys.length-1].hop=.45);
const bat=L.battle({a:AR.atk,b:AR.def,t0:14,t1:30,mid:V(0,0,-2),R,favor:'a',spread:6,onFall:(A,t)=>{A.key(t,A.pos(t)).key(t+1.2,A.pos(t),{op:0})}});
/* director */
MK.key(0,V(12,1.7,11));MK.off=t=>({y:(t>40&&t<45?Math.abs(Math.sin(t*10))*.4:0)+(t>84&&t<86?Math.abs(Math.sin(t*12))*.3:0),x:t>84&&t<86?Math.sin(t*20)*.1:0});
/* the doomed king */
const KP=V(0,0,-12);
K.key(0,V(0,0,-30),{vis:false}).key(6,V(0,0,-30),{vis:true}).key(13,KP,{hop:.4}).key(40,KP).key(41.5,V(9.5,0,8),{hop:.6}).key(45,V(9.5,0,8),{hop:.9}).key(46.5,KP,{hop:.4})
  .key(55.6,KP).key(56.1,V(-5,0,-10),{arc:1.6}).key(59.6,V(-44,0,6),{hop:.5}).key(60.4,V(-46.5,0,6),{vis:false})
  .key(62.4,RM.clone().add(V(-13.5,0,8)),{vis:false}).key(62.5,RM.clone().add(V(-13.5,0,8)),{vis:true}).key(64.4,RM.clone().add(V(-2,0,1)),{hop:.5}).key(65.2,RM.clone().add(V(-1,2.65,-3.6)),{arc:1.5}).key(66.6,RM.clone().add(V(0,2.65,-4.6)),{hop:.25})
  .key(68.4,RM.clone().add(V(0,2.65,-4.6)),{hop:.3}).key(68.5,RM.clone().add(V(0,2.65,-4.6)),{vis:false})
  .key(85,KP,{vis:false}).key(85.1,KP,{vis:true}).key(99,KP);
H.key(0,V(-3,0,26),{vis:false}).key(6,V(-3,0,26),{vis:true,glow:.4}).key(13,V(-3,0,9),{hop:.4}).key(55,V(-3,0,9)).key(55.6,V(0,0,-11),{ease:2,glow:1}).key(56.3,V(-3,0,-9),{hop:.4}).key(60.2,V(-44,0,6.5),{hop:.5}).key(61,V(-46.5,0,6.5),{vis:false})
  .key(63.4,RM.clone().add(V(-13.5,0,8)),{vis:false}).key(63.5,RM.clone().add(V(-13.5,0,8)),{vis:true}).key(66,RM.clone().add(V(-3,0,1)),{hop:.5}).key(73,RM.clone().add(V(-3,0,1)),{hop:.4}).key(73.5,RM.clone().add(V(0,2.65,-4.6)),{arc:1.2}).key(73.6,RM.clone().add(V(0,2.65,-4.6)),{vis:false})
  .key(85,V(0,0,8),{vis:false}).key(85.1,V(0,0,8),{vis:true,glow:.5}).key(96.5,V(0,0,8),{glow:1,sc:1.2}).key(99.3,V(0,0,-10.8),{ease:2,glow:1,sc:1.2}).key(120,V(0,0,-10.8),{sc:1.2});
C.at(55.6,()=>{C.burst(V(0,1.3,-11.5),[C.WHITE,C.GOLD],40,5);S.boing(C.M,C.raw);S.whoosh(C.M,C.raw)});
CINE.kingEnd(C,K.ch,99.4,[C.GOLD,C.WHITE,C.VIO]);
/* "he's fine, it's a film": the actor comes back for a bow */
const K3=L.actor(I.kingColor,'k');K3.raw=true;K3.key(0,V(-8,0,12),{vis:false}).key(104,V(-8,0,12),{vis:true,sc:.2}).key(104.8,V(-8,0,12),{sc:1,hop:.6}).key(106.5,V(-3,0,10),{hop:.4}).key(116,V(-3,0,10));
K3.off=t=>t>108&&t<116?{y:Math.max(0,Math.sin((t-108)*2.2))*.5}:null;
/* time: the film is rewound at 46–50 (everything except the crew, the director and the runaway king) */
const warp=r=>r<46?r:r<50?46-(r-46)*8.5:r<62?12+(r-50):r;
C.every(t=>{const r=C.raw||0;bd.material.map=r<46?bdMed:r<86?(r<50?bdMed:bdDes):bdSpace;stage.material.color.set(r<50?0x6b8f3a:r<86?0xd9b26a:0x2a2a40)});
/* ---------- DOM: letterbox bars, the clapper, the tear ---------- */
const bars=(t0,t1)=>C.at(t0,()=>{const b=[0,1].map(i=>L.ov(`left:0;right:0;height:11vh;${i?'bottom':'top'}:0;background:#000;transform:scaleY(0);transform-origin:${i?'bottom':'top'}`));b.forEach(x=>L.anim(x,[{transform:'scaleY(0)'},{transform:'scaleY(1)'}],{duration:600,fill:'forwards'}));setTimeout(()=>b.forEach(x=>{L.anim(x,[{transform:'scaleY(1)'},{transform:'scaleY(0)'}],{duration:400,fill:'forwards'});setTimeout(()=>x.remove(),450)}),(t1-t0)*1000)});
bars(6,29.9);bars(86.2,100);
C.add(C.cam);const clTex=L.canvas(256,64,(x,w,h)=>{x.fillStyle='#111';x.fillRect(0,0,w,h);x.fillStyle='#fff';for(let i=-2;i<10;i++){x.beginPath();x.moveTo(i*32,0);x.lineTo(i*32+16,0);x.lineTo(i*32+32,h);x.lineTo(i*32+16,h);x.fill()}});
const clap=L.group(0,0,-2.4,C.cam);L.mesh(new T.BoxGeometry(1.8,1.2,.06),L.std(0x151515),0,-.1,0,clap);for(let i=0;i<3;i++)L.mesh(new T.BoxGeometry(1.5,.03,.07),L.basic(0xdddddd),0,-.1+(i-1)*.3,0,clap);
L.mesh(new T.BoxGeometry(1.8,.22,.07),new T.MeshBasicMaterial({map:clTex}),0,.6,0,clap);const arm=L.group(-.9,.72,0,clap);L.mesh(new T.BoxGeometry(1.8,.22,.07),new T.MeshBasicMaterial({map:clTex}),.9,.11,0,arm);
const clapAt=[29.6,85.5],clapEnd=116.5;
C.every(t=>{const r=C.raw||0;let vis=false,open=0,y=-.2,z=-2.4,s=1;
  for(const c of clapAt){if(r>c&&r<c+1.6){vis=true;const q=r-c;y=q<.3?C.lerp(-2.5,-.2,q/.3):q>1.2?C.lerp(-.2,-2.5,(q-1.2)/.4):-.2;open=q<.4?.7:q<.5?C.lerp(.7,0,(q-.4)/.1):0}}
  if(r>clapEnd){vis=true;const q=C.clamp((r-clapEnd)/2.8);y=C.lerp(-2.5,0,C.ease(C.clamp(q*2)));z=C.lerp(-2.4,-1.05,q);s=1+q*.6;open=r<119.2?.7:Math.max(0,.7-(r-119.2)*7)}
  clap.visible=vis;clap.position.set(0,y,z);clap.scale.setScalar(s);arm.rotation.z=open});
clapAt.forEach(c=>C.at(c+.45,()=>{S.clap(C.M,C.raw);C.shake=.15}));C.at(119.3,()=>S.clap(C.M,C.raw));
/* megaphone shouting, the rewind */
C.at(40.5,()=>{if(C.M)for(let i=0;i<8;i++)C.M.tone(180+Math.random()*120,C.raw+i*.5,.35,{type:'sawtooth',f2:120+Math.random()*80,g:.035})});
C.at(46,()=>{L.vhs(4200);S.rewind(C.M,C.raw,4)});
C.at(50,()=>{S.clap(C.M,C.raw);L.blackout(300)});
/* in the room: the king hits the glass, presses against it, tears the screen open */
C.at(66.8,()=>{L.knock(50,55);S.knock(C.M,C.raw)});
const kingSrc=PIC(I.kingColor,'k'),heroSrc=PIC(I.color,I.piece==='k'?'q':I.piece);
let face=null;C.at(68.5,()=>{face=L.domImg(kingSrc,'left:50vw;top:55vh;width:44vh;height:44vh;margin:-22vh 0 0 -22vh;filter:drop-shadow(0 0 8px rgba(255,255,255,.6))');L.anim(face,[{transform:'scale(.6)',opacity:.6},{transform:'scale(1.15,.92)',opacity:1,offset:.3},{transform:'scale(1.1,.95) translateX(-2vh)',offset:.6},{transform:'scale(1.15,.92) translateX(2vh)'}],{duration:1600,fill:'forwards'});S.thud(C.M,C.raw,.3)});
C.at(70.1,()=>{if(face)L.anim(face,[{transform:'scale(1.15,.92)'},{transform:'scale(.5) translate(0,-4vh)',opacity:0}],{duration:350,fill:'forwards'})});
/* the tear in the canvas */
const JIT=Array.from({length:60},()=>Math.random()-.5);
const tearPts=(w)=>{const W=innerWidth,H=innerHeight,cx=W*.5;const top=H*.1,bot=H*.9,n=26;const left=[],right=[];
  for(let i=0;i<=n;i++){const y=top+(bot-top)*i/n;const bulge=Math.pow(Math.sin(i/n*Math.PI),.6);const sway=Math.sin(i*.5)*W*.03*bulge;left.push([cx+sway-w*bulge*(.75+JIT[i]*.5)+JIT[i+27]*W*.03*bulge,y]);right.push([cx+sway+w*bulge*(.75+JIT[i+30]*.5)+JIT[i+5]*W*.03*bulge,y])}return left.concat(right.reverse())};
let tearW=0;const edge=L.ov('inset:0;z-index:986','');
const setTear=w=>{tearW=w;const cv=C.canvas;if(w<=1){cv.style.clipPath='';edge.innerHTML='';return}const P=tearPts(w);const poly=P.map(p=>`${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(',');
  cv.style.clipPath=`polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${poly}, ${P[0][0].toFixed(1)}px ${P[0][1].toFixed(1)}px)`;
  edge.innerHTML=`<svg width="100%" height="100%" style="position:absolute;inset:0"><polygon points="${P.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#f5f0e6" stroke-width="7" stroke-linejoin="bevel" style="filter:drop-shadow(0 0 6px rgba(0,0,0,.8))"/></svg>`};
C.onEnd(()=>{C.canvas.style.clipPath=''});
C.every(()=>{const r=C.raw||0;const W=innerWidth;let w=0;if(r>70&&r<84){w=r<72?C.ease((r-70)/2)*W*.22:r<82?W*.22:W*.22*(1-C.ease((r-82)/1.6))}if(Math.abs(w-tearW)>.5||(w===0&&tearW!==0))setTear(w)});
C.at(70,()=>{if(C.M){C.M.noise(C.raw,1.6,{type:'bandpass',f:1200,f2:3500,q:1.2,g:.5,att:.02,rel:.3});for(let i=0;i<10;i++)C.M.noise(C.raw+i*.15,.06,{type:'highpass',f:2500,g:.3,att:.002,rel:.05})}});
C.at(82,()=>{C.M&&C.M.noise(C.raw,1.6,{type:'bandpass',f:3000,f2:900,q:1.2,g:.4,att:.02,rel:.3})});
/* the escape across the real page, the cursor catches him */
C.at(72,()=>{const W=innerWidth,H=innerHeight;let tg=[W*.3,H*.5];try{if(typeof board!=='undefined'&&I.kingSq){for(let i=0;i<64;i++)if(board.idxToSq(i)===I.kingSq){const r=board.sqs[i].getBoundingClientRect();if(r.width>0)tg=[r.left+r.width/2,r.top+r.height/2]}}}catch(e){}
  const sz=Math.min(W,H)*.13,c0=[W*.5,H*.5],p2=[W*.14,H*.2],p3=[W*.78,H*.22],p4=[W*.62,H*.78];
  const tr=(p,s=1,r=0)=>`translate(${p[0]-sz/2}px,${p[1]-sz/2}px) scale(${s}) rotate(${r}deg)`;
  const kg=L.domImg(kingSrc,`left:0;top:0;width:${sz}px;height:${sz}px;z-index:987;filter:drop-shadow(0 4px 6px rgba(0,0,0,.6))`);
  const kf=[{transform:tr(c0,1.6),offset:0},{transform:tr(tg,1),offset:.22},{transform:tr(tg,1.1,-8),offset:.3},{transform:tr(p2,1,10),offset:.45},{transform:tr(p3,1,-10),offset:.62},{transform:tr(p4,1,8),offset:.68},{transform:tr(p4,1,-15),offset:.7},{transform:tr([p4[0]+20,p4[1]-30],1,25),offset:.78},{transform:tr(c0,.9,360),offset:.95},{transform:tr(c0,.3,400),opacity:0,offset:1}];
  L.anim(kg,kf,{duration:10000,fill:'forwards',easing:'linear'});
  const hg=L.domImg(heroSrc,`left:0;top:0;width:${sz}px;height:${sz}px;z-index:987;filter:drop-shadow(0 0 10px #ffd54f)`);
  L.anim(hg,[{transform:tr(c0,.2),opacity:0,offset:0},{transform:tr(c0,1.4),opacity:1,offset:.15},{transform:tr([tg[0]+sz,tg[1]],1),offset:.32},{transform:tr([p2[0]+sz,p2[1]+sz*.5],1),offset:.5},{transform:tr([p3[0]-sz*1.2,p3[1]+sz*.3],1),offset:.66},{transform:tr([p4[0]-sz,p4[1]],1),offset:.76},{transform:tr(c0,.9),offset:.95},{transform:tr(c0,.3),opacity:0,offset:1}],{duration:10000,fill:'forwards'});
  const cu=L.ov(`left:0;top:0;width:${sz*.45}px;height:${sz*.45}px;z-index:988`,L.cursorSvg);const ct=p=>`translate(${p[0]}px,${p[1]}px)`;
  L.anim(cu,[{transform:ct([W*.95,H*.95]),opacity:0,offset:0},{transform:ct([W*.9,H*.9]),opacity:1,offset:.38},{transform:ct([p2[0]+10,p2[1]+10]),offset:.47},{transform:ct([p3[0]+40,p3[1]+50]),offset:.6},{transform:ct(p4),offset:.68},{transform:ct([p4[0]+20,p4[1]-30]),offset:.78},{transform:ct([c0[0]+sz*.2,c0[1]+sz*.2]),offset:.95},{transform:ct([W*.95,H*.95]),opacity:0,offset:1}],{duration:10000,fill:'forwards'});
  const ripple=(p,d)=>setTimeout(()=>{const q=L.ov(`left:${p[0]}px;top:${p[1]}px;width:30px;height:30px;margin:-15px;border:3px solid #fff;border-radius:50%;z-index:988`);L.anim(q,[{transform:'scale(.3)',opacity:1},{transform:'scale(2)',opacity:0}],{duration:400,fill:'forwards'});setTimeout(()=>q.remove(),420);S.beep(C.M,C.raw,2200,.04)},d);
  ripple(p2,4700);ripple(p3,6000);ripple(p4,6900);
  for(let i=0;i<14;i++)setTimeout(()=>S.squeak(C.M,C.raw),i*600+Math.random()*300);
  setTimeout(()=>S.laugh(C.M,C.raw),7000)});
/* ---------- take three: applause ---------- */
for(let i=0;i<16;i++)C.at(100+i*.4,()=>{const p=V((Math.random()-.5)*30,10+Math.random()*8,-4+(Math.random()-.5)*16);C.burst(p,[C.GOLD,C.BLUE,C.RED,C.WHITE][i%4]?[[C.GOLD,C.BLUE,C.RED,C.VIO][i%4],C.WHITE]:[C.WHITE],80,7);C.M&&C.M.noise(C.raw,.4,{type:'highpass',f:2500,g:.2,att:.002,rel:.35})});
C.at(100,()=>{for(let i=0;i<6;i++)SFX_clapping(C.raw+i*.9)});
function SFX_clapping(at){if(!C.M)return;for(let i=0;i<14;i++)C.M.noise(at+Math.random()*.9,.04,{type:'bandpass',f:1500+Math.random()*1500,q:1,g:.15,att:.001,rel:.03})}
st.mood('cheer',30,33);st.mood('laugh',41,45);st.mood('laugh',60,62);st.mood('cheer',100,108);st.mood('wave',108,116);st.mood('lean',112,116);
/* the crew also does its job: one holds the boom, one rides the camera dolly */
/* ---------- music ---------- */
L.music({root:58.3,end:D,parts:[
  {at:0,bpm:70,prog:['I','IV'],lvl:0},{at:6,bpm:112,prog:['i','VI','III','VII'],lvl:2,arp:1,toms:1},{at:20,bpm:128,prog:['i','VI','VII','V'],lvl:3,toms:1},{at:30,bpm:60,prog:['i'],lvl:-1},
  {at:36,bpm:100,prog:['I','vi','ii','V'],lvl:1,arp:1},{at:46,bpm:60,prog:['i'],lvl:-1},{at:50,bpm:112,prog:['i','VI','III','VII'],lvl:2,arp:1},{at:56,bpm:140,prog:['vi','IV','I','V'],lvl:2,arp:1},
  {at:62,bpm:120,prog:['i','VII','VI','V'],lvl:1},{at:70,bpm:150,prog:['I','V','vi','IV'],lvl:2,arp:1},{at:84,bpm:60,prog:['V'],lvl:-1},
  {at:86.2,bpm:72,prog:['i','VI','iv','V'],lvl:0,bell:1},{at:93,bpm:120,prog:['i','VI','VII','V'],lvl:3,toms:1},{at:99.5,bpm:96,prog:['I','IV','vi','V'],lvl:1,arp:1,bell:1,g:1.2},{at:112,bpm:96,prog:['I','IV','I','V'],lvl:2,arp:1}]});
/* ---------- camera (on real time; during the rewind it runs backwards through the earlier shots) ---------- */
const shots=L.shots([
  [6,(k)=>{const e=C.ease(k);return[L.vec(SCR.clone().add(V(-2,1.2,9)),SCR.clone().add(V(0,0,.9)),e),SCR.clone().add(V(0,-.05,0))]}],
  [6,(k,t)=>[V(C.lerp(-22,-6,k),C.lerp(9,4,k),C.lerp(30,22,k)),V(0,2,-4)]],
  [8,(k,t)=>[V(C.lerp(3,-3,k),2,-4),KP.clone().add(V(0,1.6,0))]],
  [9.6,(k,t)=>{const r=L.orb(V(0,1.3,-2),12,3+Math.sin(t*.6),t*.3);return[L.hand(r[0],t,.1),r[1]]}],
  [3.4,(k,t)=>[V(0,3,10),V(0,2.6,-6)]],
  [7,(k)=>{const e=C.ease(k);return[V(C.lerp(0,9,e),C.lerp(3,11,e),C.lerp(10,40,e)),V(0,C.lerp(2.6,4,e),-4)]}],
  [6,(k,t)=>[V(4,3.2,19),V(10,2,8)]],
  [4,(k,t)=>[V(0,3,10),V(0,2.6,-6)]],
  [6,(k,t)=>[V(-14,6,22),V(0,2,-4)]],
  [4,(k,t)=>{const p=K.cur;return[L.hand(p.clone().add(V(4,3,8)),t,.25),p.clone().add(V(-2,1,0))]}],
  [2,(k,t)=>[V(-30,3,13),V(-46,2.5,6)]],
  [22,(k,t)=>[L.hand(SCR.clone().add(V(0,-.2,.4)),t,.03),RM.clone().add(V(-4,1.6,10))]],
  [2,(k,t)=>[V(15,3.2,18),V(12,2.6,11)]],
  [10.5,(k,t)=>{const a=-.5+k*.7;return[V(Math.sin(a)*12,2.5+k,-2+Math.cos(a)*12),V(0,1.6,-2)]}],
  [3.5,(k,t)=>[V(4,1.8,-6),V(0,1.6,-11)]],
  [8,(k,t)=>[V(0,8,30),V(0,3,-2)]],
  [8,(k,t)=>[V(0,3.2,18),V(0,2.5,6)]],
  [4,(k,t)=>[V(0,3.2,18),V(0,2.5,6)]],
]);
const cam=t=>{const r=C.raw==null?t:C.raw;return shots(r>=46&&r<50?t:r)};
return{dur:D,cam,warp};
};
})();
