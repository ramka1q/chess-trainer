/* Legendary mate 2 — "Політ на планету" (mate by a pawn / by promotion). ~2 minutes.
   Battle on a plain while three pawn astronauts fly to a far planet. Mission control shows our own trainer
   on its big screen, an astronaut knocks on the screen glass, a meteor hits the rocket, it falls back and
   wipes out the battlefield, and from the wreck the pawn walks out promoted. */
(function(){
const SC=window.LEGEND_SCENES=window.LEGEND_SCENES||{};
SC.rocket=(C,L)=>{
const T=C.T,V=C.V,S=L.SFX,R=L.rng(4242),D=120,I=C.I;
const PAD=V(42,0,-34),SP=V(0,800,0),MC=V(0,0,420),KP=V(0,0,-12),IMP=V(2.5,0,-9.5);
/* ---------- world ---------- */
const sky=C.sky('#3d7fd6','#9cc9f5','#ffe0b8','#e8dcc8',.008);const fog=C.scene.fog,bg0=C.scene.background.clone();
L.lights(0xe0f0ff,0x4a4a2a,.75,0xfff1d6,.95,V(-30,40,30));
const crater=L.mesh(new T.CircleGeometry(6,20),L.std(0x2b2018),IMP.x,.07,IMP.z);crater.rotation.x=-Math.PI/2;crater.visible=false;C.every(t=>{crater.visible=t>95.3;crater.scale.setScalar(C.clamp((t-95.3)*4))});
L.terrain(320,L.LOW?40:70,(x,z)=>{const r=Math.hypot(x,z);return r<24?0:Math.min(14,(r-24)*.05)*(1+.5*L.nz(x*.4,z*.4))},(c,x,y,z)=>{const n=L.nz(x*1.5,z*1.5);c.setRGB(.34+.05*n,.48+.06*n,.2)});
L.board(16,'#EBECD0','#739552',.04);
/* grandstand for the fallen */
const seats=[];for(let r=0;r<3;r++){L.mesh(new T.BoxGeometry(2,1.2*(r+1),19),L.std(0x9e9e9e),-19-r*2,.6*(r+1),0);for(let i=0;i<8;i++)seats.push(V(-19-r*2,1.2*(r+1),-8+i*2.3+(r%2)*1.1))}
L.mesh(new T.BoxGeometry(.3,9,19),L.std(0xd32f2f),-25.5,4.5,0);
/* mission control building (seen from outside) */
const mcb=L.mesh(new T.BoxGeometry(14,6,10),L.std(0xcfd8dc),-40,3,-38);L.mesh(new T.CylinderGeometry(.15,.15,6),L.std(0x777777),-36,9,-38);const dish=L.mesh(new T.SphereGeometry(2,12,6,0,Math.PI*2,0,Math.PI/2),L.std(0xeeeeee,{side:T.DoubleSide}),-36,12,-38);dish.rotation.x=Math.PI*.7;
/* ---------- rocket ---------- */
function rocket(){const g=L.group(),lower=L.group(0,0,0,g),upper=L.group(0,0,0,g);const W=L.std(0xf4f4f4,{flatShading:false,roughness:.5}),Rd=L.std(0xd32f2f,{flatShading:false}),Dk=L.std(0x263238);
  L.mesh(new T.CylinderGeometry(1.2,1.25,6,20),W,0,3,0,lower);L.mesh(new T.CylinderGeometry(1.27,1.27,.6,20),Rd,0,3.4,0,lower);
  L.mesh(new T.CylinderGeometry(.7,1.05,1.1,16,1,true),Dk,0,-.5,0,lower);
  for(let i=0;i<4;i++){const f=L.mesh(new T.BoxGeometry(.14,2.2,1.4),Rd,0,1,0,lower);const a=i*Math.PI/2;f.position.set(Math.cos(a)*1.45,1,Math.sin(a)*1.45);f.rotation.y=-a}
  const prof=[[0,6],[1.15,6],[1.15,10],[.9,11],[.5,11.7],[.62,11.85],[.62,12],[.35,12.1],[0,12.1]].map(p=>new T.Vector2(p[0],p[1]));L.mesh(new T.LatheGeometry(prof,24),W,0,0,0,upper);
  L.mesh(new T.CylinderGeometry(1.17,1.17,.5,20),Rd,0,8.4,0,upper);L.mesh(new T.SphereGeometry(.62,16,12),Rd,0,12.65,0,upper);
  const win=L.mesh(new T.CircleGeometry(.42,20),new T.MeshStandardMaterial({color:0x7fd3ff,emissive:0x1b4a6a,roughness:.1}),0,9.7,1.16,upper);
  const fl=L.group(0,-1,0,g);const fc=L.mesh(new T.ConeGeometry(.95,5,14,1,true),L.glowM(0xff9100,.85),0,-2.5,0,fl);fc.rotation.x=Math.PI;const fc2=L.mesh(new T.ConeGeometry(.5,3,12,1,true),L.glowM(0xfff59d,.95),0,-1.5,0,fl);fc2.rotation.x=Math.PI;const fg=C.sprite(0xffb74d,6,0);
  return{g,lower,upper,fl,win,flame(k,t){fl.visible=k>0;fl.scale.set(1+Math.sin(t*40)*.08,k*(1+Math.sin(t*33)*.15),1+Math.sin(t*37)*.08);fg.material.opacity=k*.9;fl.getWorldPosition(fg.position)}}}
const RK=rocket();
/* launch tower with ten countdown lamps */
const lamps=[];{const tw=L.group(PAD.x+3.4,0,PAD.z);const M=L.std(0xff8f00);for(const[x,z] of[[-.6,-.6],[.6,-.6],[-.6,.6],[.6,.6]])L.mesh(new T.BoxGeometry(.18,15,.18),M,x,7.5,z,tw);for(let y=1;y<15;y+=1.5)L.mesh(new T.BoxGeometry(1.4,.12,1.4),M,0,y,0,tw);L.mesh(new T.BoxGeometry(2.4,.3,.5),M,-1.6,11,0,tw);
  for(let i=0;i<10;i++){const s=C.sprite(0xff1744,1.1,0);s.position.set(PAD.x+2.6,1.5+i*1.35,PAD.z+.8);lamps.push(s)}}
L.mesh(new T.CylinderGeometry(5,5.5,.6,20),L.std(0x888888),PAD.x,.3,PAD.z);
/* ---------- space ---------- */
const space=L.group(SP.x,SP.y,SP.z);space.visible=false;
{const n=L.Q(2500),g=new T.BufferGeometry(),d=new Float32Array(n*3);for(let i=0;i<n;i++){const u=Math.random()*2-1,a=Math.random()*Math.PI*2,s=Math.sqrt(1-u*u),r=300;d[i*3]=Math.cos(a)*s*r;d[i*3+1]=u*r;d[i*3+2]=Math.sin(a)*s*r}g.setAttribute('position',new T.BufferAttribute(d,3));space.add(new T.Points(g,new T.PointsMaterial({color:0xffffff,size:.9,fog:false})))}
const earthTex=L.canvas(1024,512,(x,w,h)=>{x.fillStyle='#1e5aa8';x.fillRect(0,0,w,h);for(let i=0;i<40;i++){x.fillStyle=['#3f8f3a','#6a8d3a','#b59b5a'][i%3];x.beginPath();x.ellipse(Math.random()*w,h*.15+Math.random()*h*.7,20+Math.random()*90,15+Math.random()*50,Math.random()*3,0,Math.PI*2);x.fill()}x.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<70;i++){x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,10+Math.random()*60,4+Math.random()*12,0,0,Math.PI*2);x.fill()}});
const earth=L.mesh(new T.SphereGeometry(140,48,32),new T.MeshStandardMaterial({map:earthTex,roughness:.8}),0,-160,0,space);
const atm=new T.Sprite(new T.SpriteMaterial({map:C.G,color:0x64b5f6,transparent:true,opacity:.55,blending:C.ADD,depthWrite:false,fog:false}));atm.scale.set(330,330,1);atm.position.set(0,-160,0);space.add(atm);
const plan=L.mesh(new T.SphereGeometry(22,32,20),L.std(0x8e5bd8,{flatShading:false}),70,25,-230,space);const ringM=L.mesh(new T.RingGeometry(28,40,48),new T.MeshBasicMaterial({color:0xd1c4e9,side:T.DoubleSide,transparent:true,opacity:.6}),70,25,-230,space);ringM.rotation.x=1.2;
const sunS=new T.Sprite(new T.SpriteMaterial({map:C.G,color:0xfff3c4,blending:C.ADD,transparent:true,fog:false}));sunS.scale.set(60,60,1);sunS.position.set(-150,80,-200);space.add(sunS);
const spLight=new T.DirectionalLight(0xffffff,1.2);spLight.position.set(-150,80,-200);space.add(spLight);
const rock=L.mesh(new T.IcosahedronGeometry(1.2,0),L.std(0x6d5d4b),0,0,0);rock.visible=false;
/* ---------- mission control (interior) ---------- */
const mcRoom=L.mesh(new T.BoxGeometry(26,9,18),L.std(0x37474f,{side:T.BackSide}),MC.x,4.5,MC.z);
const scr=L.mesh(new T.PlaneGeometry(11,6.9),new T.MeshBasicMaterial({map:L.appTex()}),MC.x,4.6,MC.z-8.9);
L.mesh(new T.BoxGeometry(11.6,7.5,.2),L.std(0x111111),MC.x,4.6,MC.z-9.02);
const radar=L.canvas(256,160,(x,w,h)=>{x.fillStyle='#021a0a';x.fillRect(0,0,w,h);x.strokeStyle='#39ff7a';x.lineWidth=2;x.beginPath();for(let i=0;i<w;i+=4)x.lineTo(i,h/2+Math.sin(i*.08)*h*.3*Math.sin(i*.013));x.stroke();x.strokeStyle='#1d7a3a';for(let i=0;i<w;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke()}});
for(let r=0;r<2;r++)for(let i=0;i<4;i++){const x=MC.x-7.5+i*5,z=MC.z-2+r*4.5;L.mesh(new T.BoxGeometry(4,1,1.6),L.std(0x546e7a),x,.5,z);const m=L.mesh(new T.PlaneGeometry(1.5,.95),new T.MeshBasicMaterial({map:radar}),x,1.6,z-.4);m.rotation.x=-.25}
const ops=[];[['r',0,0],['b',1,0],['n',2,0],['q',3,0],['b',0,1],['r',1,1],['n',2,1],['p',3,1]].forEach(([tp,i,r])=>{const a=L.actor(I.color,tp,{size:1.6});a.key(0,V(MC.x-7.5+i*5,.2,MC.z-1+r*4.5));a.off=t=>({y:t>40&&t<52?Math.abs(Math.sin(t*8+i))*.25:t>78&&t<92?Math.abs(Math.sin(t*15+i))*.3:0});ops.push(a)});
/* ---------- armies ---------- */
const AR=L.armies(),K=AR.king,MK=AR.myKing,H=AR.hero;
const st=L.stands(seats);AR.dead.forEach(d=>st.seatNow(L.actor(d.c,d.t,{size:2})));
AR.atk.forEach(a=>a.key(0,V((R()-.5)*16,0,34)));AR.def.forEach(a=>a.key(0,V((R()-.5)*16,0,-34)));
L.formation(AR.atk,9.5,1,8.5);L.formation(AR.def,-9.5,-1,8.5);[...AR.atk,...AR.def].forEach(a=>a.keys[a.keys.length-1].hop=.45);
K.key(0,V(0,0,-36)).key(8.5,KP,{hop:.45});MK.key(0,V(MC.x+2,.2,MC.z-6));MK.off=t=>({x:t>12&&t<16?Math.sin(t*3)*.6:0,y:t>49&&t<53?Math.abs(Math.sin(t*9))*.5:0});
H.key(0,V(0,0,0),{vis:false});
const bat=L.battle({a:AR.atk,b:AR.def,t0:23,t1:39.5,mid:V(0,0,0),R,favor:'a',spread:6,onFall:(A,t)=>st.take(A,t)});
/* astronauts: three pawns with glass helmets */
const helmetM=new T.MeshStandardMaterial({color:0xbfe9ff,transparent:true,opacity:.22,roughness:.05,metalness:.2});
const astro=[0,1,2].map(i=>{const a=L.actor(I.color,'p',{size:1.5});L.mesh(new T.SphereGeometry(.42,16,12),helmetM,0,1.12,0,a.ch.g);return a});
astro.forEach((a,i)=>{a.key(0,V(MC.x+9,.2,MC.z+6),{vis:false}).key(17.5+i*.5,V(MC.x+9,.2,MC.z+6),{vis:true}).key(21.5+i*.5,V(MC.x+2-i*1.5,.2,MC.z-4),{hop:.25}).key(22+i*.5,V(MC.x+2-i*1.5,.2,MC.z-4),{vis:false})
  .key(33.5,V(PAD.x-8-i*1.6,0,PAD.z+6),{vis:true}).key(37,V(PAD.x+2.6,0,PAD.z+.8),{hop:.3}).key(39.5,V(PAD.x+2.6,10.5,PAD.z+.8)).key(39.6,V(PAD.x+2.6,10.5,PAD.z+.8),{vis:false})});
/* the astronaut who knocks on the screen */
const ast0=astro[0];ast0.key(63.9,V(0,0,0),{vis:false});
/* ---------- rocket path ---------- */
const sep={t:60};
const rkState=t=>{
  if(t<49.8)return{p:PAD.clone(),rx:0,rz:0,fl:t>48.5?C.clamp((t-48.5)/1.3)*.6:0,space:false};
  if(t<58){const q=t-49.8;return{p:PAD.clone().add(V(-q*q*.06,q*q*2,0)),rx:0,rz:q*.012,fl:1,space:false}}
  if(t<82){const q=t-58;let p=SP.clone().add(V(0,10,-q*4));let rx=-Math.PI/2+.25,rz=0;if(t>78){const s=t-78;rz=s*s*.9;rx+=Math.sin(s*3)*.4;p.add(V(Math.sin(s*5)*s*.5,0,0))}return{p,rx,rz,fl:t<78?.7:Math.random()<.5?.2:0,space:true}}
  if(t<95.3){const k=C.clamp((t-82)/13.3);const a=V(-70,170,-140),b=IMP.clone().add(V(0,1,0));const p=L.vec(a,b,k*k);const d=b.clone().sub(a).normalize();return{p,dir:d,fl:0,plasma:1,space:false}}
  return{p:IMP.clone().add(V(0,.6,0)),wreck:true,space:false}};
const plasma=C.sprite(0xff6d00,10,0),plasma2=C.sprite(0xffe082,5,0);
const puffs=L.puffs(110),fire=L.puffs(50,true);
const up0=V(0,1,0);
C.every((t,dt)=>{
  const s=rkState(t);RK.g.position.copy(s.p);
  if(s.dir){RK.g.quaternion.setFromUnitVectors(up0,s.dir.clone().negate());}
  else if(s.wreck){RK.g.rotation.set(0,0,0);RK.g.rotation.set(1.15,.4,.3)}
  else RK.g.rotation.set(s.rx,0,s.rz);
  RK.fl.position.y=t>sep.t+.6&&t<82?5.4:-1;RK.flame(t>sep.t&&t<sep.t+.6?0:(s.fl||0),t);
  /* stage separation */
  if(t>sep.t&&t<82){const q=t-sep.t;RK.lower.position.set(0,-q*q*1.5-q*2,0);RK.lower.rotation.x=q*.6;RK.lower.visible=q<3}else RK.lower.position.set(0,0,0),RK.lower.visible=t<sep.t||t>=82?(t<sep.t):true;
  if(t>=82)RK.lower.visible=false;
  plasma.material.opacity=s.plasma?.85:0;plasma2.material.opacity=s.plasma?.9:0;if(s.plasma){plasma.position.copy(s.p).addScaledVector(s.dir,4);plasma2.position.copy(plasma.position);plasma.scale.setScalar(10+Math.sin(t*30)*1.5);if(Math.random()<.8)fire.emit(s.p,s.dir.clone().multiplyScalar(-6).add(V((Math.random()-.5)*3,(Math.random()-.5)*3,(Math.random()-.5)*3)),3,1,0xff7043,.8,1.5)}
  if(t>49&&t<57&&Math.random()<dt*40)puffs.emit(PAD.clone().add(V((Math.random()-.5)*4,1,(Math.random()-.5)*4)),V((Math.random()-.5)*14,1+Math.random()*2,(Math.random()-.5)*14),4,4,0xeeeeee,.7,2.5);
  if(t>50&&t<58&&Math.random()<dt*20)puffs.emit(RK.g.position.clone().add(V(0,-2,0)),V((Math.random()-.5)*2,-3,(Math.random()-.5)*2),2.5,3,0xdddddd,.6,2);
  if(t>95.3&&t<112&&Math.random()<dt*14)puffs.emit(IMP.clone().add(V((Math.random()-.5)*3,1,(Math.random()-.5)*3)),V(0,2+Math.random()*2,0),3,4,0x444444,.55,2.5);
  if(t>95.3&&t<104&&Math.random()<dt*10)fire.emit(IMP.clone().add(V((Math.random()-.5)*3,1,(Math.random()-.5)*3)),V(0,3,0),2,.8,0xff7043,.8,1);
  /* countdown lamps */
  lamps.forEach((l,i)=>{const off=40+(9-i)*.95;l.material.opacity=t<38?0:t<off?.95:0;if(t>49.2&&t<52)l.material.opacity=Math.sin(t*20)>0?.9:0});
  /* space or sky */
  const inSpace=s.space||(t>=58&&t<82);space.visible=inSpace;sky.visible=!inSpace;C.scene.fog=inSpace?null:fog;C.scene.background=inSpace?new T.Color(0):bg0;
  if(!inSpace){const dk=t>52&&t<58?C.clamp((t-52)/6)*.75:t>=82&&t<88?.6*(1-C.clamp((t-82)/6)):0;sky.material.color.setScalar(1-dk)}
  rock.visible=t>76&&t<78.2;if(rock.visible){const k=(t-76)/2.2;rock.position.copy(SP).add(V(C.lerp(40,0,k),10+C.lerp(10,0,k),C.lerp(-110,-80,k)));rock.rotation.set(t*3,t*2,0)}
});
C.at(48.4,()=>{if(C.M){C.M.noise(C.raw,14,{f:160,f2:500,g:.55,att:1.4,rel:3});C.M.tone(48,C.raw,13,{type:'sawtooth',g:.07,att:1.5,rel:3})}});
for(let i=0;i<10;i++)C.at(40+i*.95,()=>S.beep(C.M,C.raw,i===9?1320:880,.14));
C.at(50,()=>{C.shake=.7;C.ring(PAD.clone().setY(.4),0xffffff,50,16,1.6,.1)});
C.at(60,()=>{C.burst(RK.g.position.clone(),[C.WHITE,C.GOLD],60,6);S.thud(C.M,C.raw,.5)});
C.at(78.2,()=>{S.explode(C.M,C.raw,.6);C.burst(RK.g.position.clone(),[C.GOLD,new T.Color(0xff5722)],120,9);C.shake=.8;L.redAlert(8000);S.alarm(C.M,C.raw+.3,7.5)});
C.at(82.5,()=>{L.burnEdges(10500);C.M&&C.M.noise(C.raw,13,{type:'bandpass',f:300,f2:1200,q:.7,g:.45,att:2,rel:.3})});
/* ---------- impact: everyone is thrown ---------- */
C.at(95.3,()=>{S.explode(C.M,C.raw,1.3);C.flash(.9,1400);C.ring(IMP.clone().setY(.3),0xffab40,95.3,40,2.4,.25);C.ring(IMP.clone().setY(.5),0xffffff,95.5,26,1.6,.12);C.burst(IMP.clone().setY(2),[C.GOLD,new T.Color(0xff5722),C.WHITE],400,16);C.shake=1.6;
  for(let i=0;i<40;i++)puffs.emit(IMP.clone().add(V(0,1,0)),V((Math.random()-.5)*30,4+Math.random()*16,(Math.random()-.5)*30),6,5,i%2?0x5d4037:0x9e9e9e,.7,2)});
const surv=[...bat.a,...bat.b];
surv.forEach((a,i)=>{const p=a.pos(87);const q=p.clone().add(V((R()-.5)*3,0,(R()-.5)*3));a.key(88.5,p).key(91,q,{hop:.5}).key(95.2,q,{hop:.35});const d=q.clone().sub(IMP).setY(0);if(d.lengthSq()<.1)d.set(1,0,0);d.normalize();
  const f=q.clone().addScaledVector(d,12+R()*10);a.key(96.6,V(f.x,-.95,f.z),{arc:9,rot:Math.PI*6.5});st.take(a,99+i*.15)});
K.key(88.5,KP).key(91,KP.clone().add(V(1,0,-1)),{hop:.5}).key(95.2,KP.clone().add(V(1,0,-1)),{hop:.3}).key(96.8,V(-4,-.95,-24),{arc:8,rot:Math.PI*4.5}).key(100,V(-4,-.95,-24)).key(101,V(-4,0,-24),{rot:0}).key(104.5,V(-1.5,0,-15),{hop:.25});
/* the pawn walks out of the wreck and becomes the mating piece */
ast0.key(101.8,IMP.clone().add(V(0,1.2,1)),{vis:false}).key(102,IMP.clone().add(V(0,1.2,1)),{vis:true}).key(103.2,IMP.clone().add(V(.3,0,-2)),{hop:.4}).key(105.3,IMP.clone().add(V(.3,0,-2)),{glow:1}).key(105.4,IMP.clone().add(V(.3,0,-2)),{vis:false});
const pill=C.beam(C.GOLD,1.3);C.every(t=>{const on=t>104&&t<107;C.setBeam(pill,IMP.clone().add(V(.3,0,-2)),IMP.clone().add(V(.3,40,-2)),on?Math.min(1,(t-104)*2,(107-t)*2)*.8:0)});
C.at(104,()=>{C.M&&C.M.choir([196,246.9,293.7],C.raw,3,.03);C.M&&C.M.riser(C.raw,1.5,.3)});C.at(105.4,()=>{C.flash(.7,700);C.burst(IMP.clone().add(V(.3,1.5,-2)),[C.GOLD,C.WHITE],120,8);S.boing(C.M,C.raw)});
H.key(105.39,IMP.clone().add(V(.3,0,-2)),{vis:false,sc:.3}).key(105.4,IMP.clone().add(V(.3,0,-2)),{vis:true,sc:.3,glow:1}).key(106.2,IMP.clone().add(V(.3,0,-2)),{sc:1.25,glow:1}).key(107.6,IMP.clone().add(V(.3,0,-2)),{sc:1.25}).key(108.4,V(-1.5,0,-13.3),{ease:2,sc:1.25,glow:1});
CINE.kingEnd(C,K.ch,108.45,[C.GOLD,C.WHITE,new T.Color(0xff7043)]);
/* fireworks */
const fwc=[C.GOLD,C.BLUE,C.RED,C.VIO,C.WHITE];for(let i=0;i<14;i++){const tt=109.5+i*.45;C.at(tt,()=>{const p=V((Math.random()-.5)*40,18+Math.random()*12,-20+(Math.random()-.5)*20);C.burst(p,[fwc[i%5],C.WHITE],90,9);C.ring(p,fwc[i%5],tt,6,1,.06);C.M&&(C.M.noise(C.raw,.6,{type:'highpass',f:2000,g:.25,att:.002,rel:.5}),C.M.drum(C.raw,.3,80))})}
/* spectators */
st.flags([0xd32f2f,0xffffff,0x1e88e5]);st.popcorn(20,40);
st.mood('cheer',24,27);st.mood('wave',30,37);st.mood('lean',42,50);st.mood('cheer',50,54);st.mood('panic',88,97);st.mood('cheer',108.5,116);st.mood('wave',112,117);st.lights(109,118);
/* ---------- fourth wall: the astronaut at the glass ---------- */
const spaceAst=L.actor(I.color,'p',{size:1.5});L.mesh(new T.SphereGeometry(.42,16,12),helmetM,0,1.12,0,spaceAst.ch.g);
const camSP=t=>RK.g.position.clone().add(V(0,0,0));
spaceAst.key(0,V(0,0,0),{vis:false});
const knockCam=SP.clone().add(V(6,12,-30));
spaceAst.key(63.95,SP.clone().add(V(1.5,10.5,-25)),{vis:false}).key(64,SP.clone().add(V(1.5,10.5,-25)),{vis:true}).key(68,knockCam.clone().add(V(0,-1.5,-2.4)),{ease:1}).key(72.5,knockCam.clone().add(V(0,-1.5,-2.4))).key(74,SP.clone().add(V(-2,9,-28)),{ease:1,op:.3});
spaceAst.off=t=>t>64&&t<74?{y:Math.sin(t*1.3)*.15,x:t>71.8&&t<72.6?Math.sin(t*12)*.3:0}:null;
C.at(68.4,()=>{L.knock(50,52);S.knock(C.M,C.raw)});
C.at(69.6,()=>L.fogWipe(1.7,PIC(I.color,'p')));
C.at(64,()=>{if(C.M)C.M.noise(C.raw,9,{type:'bandpass',f:500,q:2,g:.06,att:2,rel:2})});
/* ---------- the parachute over the lens ---------- */
C.add(C.cam);const chuteTex=L.canvas(256,64,(x,w,h)=>{for(let i=0;i<8;i++){x.fillStyle=i%2?'#fafafa':'#e53935';x.fillRect(i*w/8,0,w/8,h)}});
const chute=L.mesh(new T.SphereGeometry(3,20,10,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({map:chuteTex,side:T.DoubleSide,roughness:.9}),0,8,-4,C.cam);chute.visible=false;
C.every(t=>{chute.visible=t>116.3;if(chute.visible){const k=C.clamp((t-116.3)/3.4);chute.position.set(Math.sin(t*1.5)*.4*(1-k),C.lerp(9,.6,C.ease(k)),C.lerp(-6,-1.4,k));chute.rotation.z=Math.sin(t*1.2)*.15*(1-k)}});
C.at(116.3,()=>C.M&&C.M.noise(C.raw,3.5,{type:'bandpass',f:500,q:.7,g:.15,att:1,rel:.5}));
/* ---------- music ---------- */
L.music({root:49,end:D,parts:[
  {at:0,bpm:100,prog:['I','V','vi','IV'],lvl:1,arp:1},{at:10,bpm:92,prog:['I','IV','ii','V'],lvl:0,bell:1},{at:22,bpm:118,prog:['vi','IV','I','V'],lvl:2,arp:1},
  {at:40,bpm:60,prog:['V'],lvl:0},{at:50,bpm:124,prog:['I','V','vi','IV'],lvl:3,arp:1},{at:58,bpm:76,prog:['I','iii','IV','iv'],lvl:0,arp:1,bell:1},{at:64,bpm:60,prog:['I'],lvl:-1},
  {at:74,bpm:90,prog:['IV','I','V','vi'],lvl:1,arp:1},{at:78,bpm:140,prog:['vi','IV','V','iii'],lvl:3},{at:92,bpm:60,prog:['vi'],lvl:-1},
  {at:98,bpm:80,prog:['vi','IV'],lvl:0},{at:104,bpm:120,prog:['I','V','vi','IV'],lvl:2,arp:1},{at:108.4,bpm:124,prog:['I','IV','V','I'],lvl:3,arp:1,bell:1},{at:116,bpm:80,prog:['I','IV'],lvl:0,bell:1}]});
/* ---------- camera ---------- */
const cam=L.shots([
  [10,k=>{const e=C.ease(k);return[V(C.lerp(-50,14,e),C.lerp(30,7,e),C.lerp(60,26,e)),V(C.lerp(20,0,e),2,C.lerp(-20,0,e))]}],
  [4,(k,t)=>[V(MC.x+C.lerp(-6,6,k),3.5,MC.z+7),V(MC.x,4.4,MC.z-9)]],
  [4,(k,t)=>[V(MC.x+C.lerp(-1.5,0,k),4.6,MC.z+C.lerp(-2,-4.6,k)),V(MC.x,4.6,MC.z-9)]],
  [4,(k,t)=>[V(MC.x-6,3,MC.z+4),V(MC.x+4,1.4,MC.z)]],
  [11,(k,t)=>L.orb(V(0,1.3,0),14,4+Math.sin(t*.6),t*.3)],
  [6,(k,t)=>[V(PAD.x-14,4,PAD.z+16),V(PAD.x,5,PAD.z)]],
  [5,(k,t)=>[V(-8,3,12),V(PAD.x,8,PAD.z)]],
  [5,(k,t)=>[V(-16,6,10),L.vec(V(0,1,0),V(PAD.x,8,PAD.z),.7)]],
  [5,(k,t)=>[L.hand(V(PAD.x-10,1.5,PAD.z+12),t,.2),RK.g.position.clone().add(V(0,8,0))]],
  [4,(k,t)=>{const p=RK.g.position;return[L.hand(p.clone().add(V(9,-6,10)),t,.2),p.clone().add(V(0,6,0))]}],
  [6,(k,t)=>{const p=RK.g.position;return[p.clone().add(V(C.lerp(18,10,k),C.lerp(6,3,k),C.lerp(6,14,k))),p.clone().add(V(0,0,-4))]}],
  [10,(k,t)=>[knockCam.clone().add(V(0,0,C.lerp(.5,0,C.clamp(k*2)))),knockCam.clone().add(V(0,-1.2,-6))]],
  [4,(k,t)=>{const p=RK.g.position;return[p.clone().add(V(-6,4,10)),SP.clone().add(V(70,25,-230))]}],
  [4,(k,t)=>{const p=RK.g.position;return[L.hand(p.clone().add(V(8,3,8)),t,.4),p]}],
  [6,(k,t)=>{const p=RK.g.position;const d=rkState(t).dir||V(0,-1,0);return[L.hand(p.clone().addScaledVector(d,18).add(V(3,2,0)),t,.5),p]}],
  [7.3,(k,t)=>[L.hand(V(-3,2.2,13),t,.15),L.vec(V(0,2.5,-8),RK.g.position,C.lerp(.3,.12,k))]],
  [2.7,(k,t)=>[L.hand(V(16,8,18),t,.3),V(2,1,-9)]],
  [6,(k,t)=>[V(8,4,0),V(-2,1,-18)]],
  [4.4,(k,t)=>[V(7,2.2,1),IMP.clone().add(V(0,1.5,-2))]],
  [1.6,(k,t)=>[V(4,1.8,-6),V(-1.5,1.4,-14)]],
  [6,(k,t)=>L.orb(V(-5,8,-4),26,10,2+k*.6)],
  [4,(k,t)=>[V(-6,4,14),V(-19,3,0)]],
]);
return{dur:D,cam};
};
})();
