/* Legendary mate 1 — "Юрський мат" (smothered mate). ~2 minutes.
   A prehistoric jungle: both armies fight on an old stone board, the fallen watch from a rock as ghosts,
   a T-rex crashes the battle, a pterodactyl steals the camera, and the knight jumps over the king's own wall. */
(function(){
const SC=window.LEGEND_SCENES=window.LEGEND_SCENES||{};
SC.jurassic=(C,L)=>{
const T=C.T,V=C.V,S=L.SFX,R=L.rng(1717),D=120;
const lerpA=(a,b,k)=>{let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*k};
/* a ground path for big animals: [[t,x,z,yaw?],...] -> {x,z,yaw,mv} */
const path=keys=>{const segs=[];let py=keys[0][3]??0;for(let i=1;i<keys.length;i++){const a=keys[i-1],b=keys[i];const d=Math.hypot(b[1]-a[1],b[2]-a[2]);const y=b[3]??(d>.05?Math.atan2(-(b[2]-a[2]),b[1]-a[1]):py);segs.push({a,b,d,y0:py,y});py=y}
  return t=>{if(t<=keys[0][0])return{x:keys[0][1],z:keys[0][2],yaw:keys[0][3]??(segs[0]?segs[0].y:0),mv:0};const s=segs.find(s=>t<s.b[0])||segs[segs.length-1];const k=C.clamp((t-s.a[0])/Math.max(.001,s.b[0]-s.a[0]));
    return{x:C.lerp(s.a[1],s.b[1],k),z:C.lerp(s.a[2],s.b[2],k),yaw:lerpA(s.y0,s.y,C.clamp((t-s.a[0])/.5)),mv:t<s.b[0]&&s.d>.05?s.d/(s.b[0]-s.a[0]):0}}};

/* ---------- world ---------- */
C.sky('#5e9fd8','#f7c99a','#ffe2b0','#d7e3c4',.011);
L.lights(0xd6ecff,0x4a5a2a,1.05,0xfff0d0,1.25,V(30,45,20));
L.terrain(260,L.LOW?50:90,(x,z)=>{const r=Math.hypot(x,z);return r<19?0:Math.min(18,(r-19)*.09*(1+.6*L.nz(x*.5,z*.5)))+L.nz(x,z)*1.4*C.clamp((r-19)/8)},
  (c,x,y,z)=>{const r=Math.hypot(x,z);if(r<19)c.setRGB(.55,.46,.3);else{const n=L.nz(x*2,z*2);c.setRGB(.2+.06*n,.42+.08*n+y*.004,.14)}});
L.board(16,'#d8c9a0','#7d6b48',.04);
for(let i=0;i<16;i++){const a=i/16*Math.PI*2;L.rock(Math.cos(a)*9.6,.2,Math.sin(a)*9.6,.7,0x8a7d68)}
/* jungle */
const trunkG=new T.CylinderGeometry(.22,.42,1,6),leafG=new T.PlaneGeometry(.9,4.2),tm=L.std(0x6b4a2b),lm=[L.std(0x2e7d32,{side:T.DoubleSide}),L.std(0x558b2f,{side:T.DoubleSide}),L.std(0x1b5e20,{side:T.DoubleSide})];
const tree=(x,z,h)=>{const g=L.group(x,0,z);const tr=L.mesh(trunkG,tm,0,h/2,0,g);tr.scale.y=h;tr.rotation.z=(Math.random()-.5)*.25;
  for(let i=0;i<7;i++){const p=L.group(0,h,0,g);p.rotation.y=i/7*Math.PI*2;const l=L.mesh(leafG,lm[i%3],0,0,1.8,p);l.rotation.x=Math.PI/2-.55;}return g};
const trees=[];for(let i=0;i<L.Q(80);i++){const a=Math.random()*Math.PI*2,r=24+Math.random()*70;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<9&&z<-15&&z>-60)continue;trees.push(tree(x,z,7+Math.random()*7))}
const fernG=new T.ConeGeometry(1,1.6,5);for(let i=0;i<L.Q(70);i++){const a=Math.random()*Math.PI*2,r=19+Math.random()*30;const f=L.mesh(fernG,lm[i%3],Math.cos(a)*r,.6,Math.sin(a)*r);f.scale.setScalar(.6+Math.random())}
for(let i=0;i<L.Q(22);i++){const a=Math.random()*Math.PI*2,r=20+Math.random()*40;L.rock(Math.cos(a)*r,.5,Math.sin(a)*r,1+Math.random()*2)}
/* a volcano far away and a cliff behind the king */
const vol=L.mesh(new T.ConeGeometry(34,40,10,1,true),L.std(0x4a3b33),-80,14,-130);const volSm=L.puffs(30);
for(let i=0;i<10;i++){const x=(i<5?-15+i*2.4:5+(i-5)*2.6);L.rock(x,1.5+Math.random()*2,-23-Math.random()*2,2.4+Math.random()*1.5,0x7b6b5a)}
/* puddle */
const pud=L.mesh(new T.CircleGeometry(2.2,24),new T.MeshStandardMaterial({color:0x6fa3c8,roughness:.1,metalness:.3}),5,.07,5);pud.rotation.x=-Math.PI/2;
/* the rock where the fallen sit */
const seats=[];for(let r=0;r<3;r++){const b=L.mesh(new T.BoxGeometry(2.4,1.6*(r+1),17),L.std(0x8d7b66),-16.5-r*2.4,.8*(r+1),3);for(let i=0;i<7;i++)seats.push(V(-16.5-r*2.4,1.6*(r+1),-4.5+i*2.4+(r%2)*1.1))}
/* nest on a rock pillar */
const pil=L.mesh(new T.CylinderGeometry(3.2,4.5,13,8),L.std(0x7b6b5a),28,6.5,-28);
const nest=L.mesh(new T.TorusGeometry(1.9,.55,6,14),L.std(0x8d6e3f),28,13.2,-28);nest.rotation.x=Math.PI/2;
const eggM=L.std(0xf1e6c8);const eggs=[[27.3,-27.6],[28.6,-28.3],[28.1,-27.1]].map(([x,z])=>{const e=L.mesh(new T.SphereGeometry(.5,10,8),eggM,x,13.5,z);e.scale.y=1.3;return e});
const eh=[0,1].map(i=>L.mesh(new T.SphereGeometry(.5,10,6,0,Math.PI*2,i?Math.PI/2:0,Math.PI/2),eggM,28.1,13.5,-27.1));eh.forEach(m=>m.visible=false);

/* ---------- dinosaurs (built from simple shapes) ---------- */
const tri=(pts,mat,parent)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.computeVertexNormals();const m=new T.Mesh(g,mat);parent.add(m);return m};
function rex(s){const g=L.group(),root=L.group(0,0,0,g);const M=L.std(0x55693a),Mb=L.std(0x9aa56a),Md=L.std(0x111111),Mw=L.std(0xf5efe0);
  const body=L.mesh(new T.SphereGeometry(1,10,8),M,0,2.75,0,root);body.scale.set(1.75,1.05,.95);body.rotation.z=.22;
  const tail=L.group(-1.3,2.55,0,root);L.mesh(new T.ConeGeometry(.8,4.2,8),M,-2.1,0,0,tail).rotation.z=Math.PI/2;
  const neck=L.group(1.4,3.35,0,root);L.mesh(new T.BoxGeometry(1.7,.85,.88),M,.8,.36,0,neck);
  const jawP=L.group(.15,.02,0,neck);L.mesh(new T.BoxGeometry(1.45,.28,.78),Mb,.68,-.12,0,jawP);
  for(let i=0;i<5;i++)for(const z of[-.3,.3]){const c=L.mesh(new T.ConeGeometry(.06,.22,4),Mw,.35+i*.27,-.1,z,neck);c.rotation.x=Math.PI}
  for(const z of[-.45,.45]){L.mesh(new T.SphereGeometry(.12,6,6),Mw,1.1,.62,z,neck);L.mesh(new T.SphereGeometry(.07,6,6),Md,1.16,.62,z*1.08,neck)}
  for(const z of[-.62,.62]){const a=L.mesh(new T.BoxGeometry(.55,.16,.16),M,1.05,2.45,z,root);a.rotation.z=-.8}
  const legs=[-.58,.58].map(z=>{const hip=L.group(.05,2.45,z,root);L.mesh(new T.BoxGeometry(.75,1.55,.62),M,0,-.6,0,hip);const knee=L.group(0,-1.28,0,hip);L.mesh(new T.BoxGeometry(.46,1.25,.46),M,0,-.55,0,knee);L.mesh(new T.BoxGeometry(1.05,.22,.56),M,.3,-1.15,0,knee);return{hip,knee}});
  g.scale.setScalar(s);
  return{g,root,neck,
    head:()=>neck.localToWorld(V(1.2,.3,0)),
    up(t,mv,jaw=0,pitch=0,lean=0){const ph=t*(2+mv*.7);legs.forEach((l,i)=>{const p=ph+i*Math.PI;l.hip.rotation.z=mv?Math.sin(p)*.55:0;l.knee.rotation.z=mv?-Math.max(0,Math.sin(p+1.2))*.75:0});
      root.position.y=mv?Math.abs(Math.sin(ph))*.12:0;tail.rotation.y=Math.sin(t*1.3)*.25;jawP.rotation.z=-jaw*.75;neck.rotation.z=pitch;root.rotation.z=lean}}}
function brachio(s){const g=L.group(),M=L.std(0x7d8f6a);const body=L.mesh(new T.SphereGeometry(1,10,8),M,0,4.3,0,g);body.scale.set(2.3,1.4,1.2);
  const nk=L.group(1.8,5,0,g);nk.rotation.z=-.38;L.mesh(new T.CylinderGeometry(.32,.62,6.5,7),M,0,3.2,0,nk);L.mesh(new T.BoxGeometry(1.1,.5,.55),M,.35,6.5,0,nk);
  const tl=L.group(-2,4.2,0,g);const tc=L.mesh(new T.ConeGeometry(.65,5.5,7),M,-2.7,-.6,0,tl);tc.rotation.z=Math.PI/2+.2;
  const legs=[[1.3,.75],[1.3,-.75],[-1.3,.75],[-1.3,-.75]].map(([x,z],i)=>{const h=L.group(x,3.4,z,g);L.mesh(new T.CylinderGeometry(.38,.38,3.5,7),M,0,-1.7,0,h);return h});
  g.scale.setScalar(s);return{g,up(t){legs.forEach((h,i)=>h.rotation.z=Math.sin(t*1.6+(i===0||i===3?0:Math.PI))*.3);nk.rotation.x=Math.sin(t*.5)*.1;tl.rotation.y=Math.sin(t*.8)*.2}}}
function trice(s){const g=L.group(),root=L.group(0,0,0,g),M=L.std(0x8a6a3a),F=L.std(0xb5562a),W=L.std(0xf0e6d0);
  const b=L.mesh(new T.SphereGeometry(1,10,8),M,0,1.95,0,root);b.scale.set(1.65,1,1.05);
  const hd=L.group(1.6,2.05,0,root);L.mesh(new T.BoxGeometry(1.15,.8,.8),M,.42,0,0,hd);const fr=L.mesh(new T.CylinderGeometry(1.25,1.25,.15,12),F,-.05,.45,0,hd);fr.rotation.z=Math.PI/2+.4;
  for(const z of[-.3,.3]){const h=L.mesh(new T.ConeGeometry(.12,1.5,6),W,.55,.65,z,hd);h.rotation.z=-1.15}const nh=L.mesh(new T.ConeGeometry(.1,.5,6),W,.98,.2,0,hd);nh.rotation.z=-1.3;
  const tl=L.mesh(new T.ConeGeometry(.5,2.2,7),M,-2.3,1.7,0,root);tl.rotation.z=Math.PI/2+.2;
  const legs=[[1,.62],[1,-.62],[-1,.62],[-1,-.62]].map(([x,z])=>{const h=L.group(x,1.45,z,root);L.mesh(new T.BoxGeometry(.45,1.45,.45),M,0,-.72,0,h);return h});
  g.scale.setScalar(s);return{g,up(t,mv){legs.forEach((h,i)=>h.rotation.z=mv?Math.sin(t*(4+mv)+(i===0||i===3?0:Math.PI))*.5:0);root.position.y=mv?Math.abs(Math.sin(t*(4+mv)))*.1:0;hd.rotation.z=mv>4?-.25:Math.sin(t)*.05}}}
function ptero(s,parent){const g=L.group(0,0,0,parent),M=L.std(0x8a5a4a),Wm=L.std(0x7a4a3a,{side:T.DoubleSide});
  const b=L.mesh(new T.SphereGeometry(1,8,6),M,0,0,0,g);b.scale.set(.9,.32,.32);
  const bk=L.mesh(new T.ConeGeometry(.12,1.1,5),M,1.4,.15,0,g);bk.rotation.z=-Math.PI/2;const cr=L.mesh(new T.ConeGeometry(.09,.8,4),M,.6,.45,0,g);cr.rotation.z=Math.PI/2+.7;
  const ws=[1,-1].map(sd=>{const p=L.group(0,.05,.2*sd,g);tri([-.55,0,0, .6,0,0, 0,0,3.3*sd],Wm,p);return{p,sd}});
  g.scale.setScalar(s);return{g,up(t,f=1){ws.forEach(w=>w.p.rotation.x=w.sd*Math.sin(t*6*f)*.7)}}}

/* ---------- animals in motion ---------- */
const bra=[0,1,2].map(i=>{const b=brachio(1.5-i*.15);return{b,z:-70-i*9,x0:-110+i*16,sp:1.6}});
const flock=[0,1,2,3,4].map(i=>({p:ptero(1.1),a:i*1.25,r:35+i*5,h:30+i*3}));
const RX=rex(1.9);const rexP=path([[0,0,-70],[36,0,-46],[42,0,-22],[49,0,-2.5],[52,0,-2.5,0],[55,0,-2.5,0],[56.5,-6,-8,0],[57.5,-6,-8,Math.atan2(-(11+8),4+6)],[60.5,1.4,4],[66,1.4,4],[80,-13,-2],[116,-13,-2,Math.PI/2-.9],[120,-3,6]]);
const TR=trice(1.25);const triP=path([[0,70,10],[49,42,10],[52,14,4],[55,3.4,-1.5],[56,4.5,-.5],[80,13,3],[88,7,-4],[96,7,-4,-Math.PI/2]]);
const RIDE=ptero(1.6);RIDE.g.visible=false;
C.add(C.cam);const claws=L.group(0,0,0,C.cam);claws.visible=false;
for(const x of[-.45,.45]){const c=L.mesh(new T.ConeGeometry(.12,.9,5),L.std(0x3e2723),x,-1.05,-1.4,claws);c.rotation.x=Math.PI*.85}
const wingL=ptero(2.2,claws);wingL.g.position.set(0,2.3,.6);wingL.g.rotation.y=Math.PI/2;
const foot=L.group(0,9,-3,C.cam);{const M=L.std(0x55693a);L.mesh(new T.BoxGeometry(5,1.4,3.6),M,0,0,0,foot);for(const x of[-1.6,0,1.6]){const c=L.mesh(new T.ConeGeometry(.35,1.3,5),L.std(0xf5efe0),x,-.5,-2,foot);c.rotation.x=-Math.PI/2}}foot.visible=false;
const smoke=L.puffs(80),dust=L.puffs(60);
let jaw=0;
C.every((t,dt)=>{
  bra.forEach((o,i)=>{const x=o.x0+t*o.sp;o.b.g.position.set(x,0,o.z);o.b.g.rotation.y=0;o.b.up(t+i)});
  flock.forEach(f=>{const a=f.a+t*.25;f.p.g.position.set(Math.cos(a)*f.r,f.h+Math.sin(t+f.a)*2,Math.sin(a)*f.r);f.p.g.rotation.y=-a-Math.PI/2+Math.PI;f.p.g.rotation.z=.25;f.p.up(t+f.a,.7)});
  const r=rexP(t);RX.g.position.set(r.x,0,r.z);RX.g.rotation.y=r.yaw;RX.g.visible=t>35;
  jaw=t>42&&t<44.6?C.clamp((t-42)*3)*C.clamp((44.6-t)*3):t>48.6&&t<49.3?Math.sin((t-48.6)/.7*Math.PI):t>60.4&&t<62.6?C.clamp((t-60.4)*3)*C.clamp((62.6-t)*3):t>117&&t<118.8?C.clamp((t-117)*3)*C.clamp((118.8-t)*3):0;
  const lean=t>55&&t<57?-Math.sin((t-55)/2*Math.PI)*.35:0;
  RX.up(t,r.mv,jaw,t>57.5&&t<66?-.32+jaw*.12:jaw*.35,lean);
  const q=triP(t);TR.g.position.set(q.x,0,q.z);TR.g.rotation.y=q.yaw;TR.g.visible=t>48;TR.up(t,q.mv);
  if(t>20&&Math.random()<dt*3)volSm.emit(V(-80+Math.random()*3,36,-130),V(1.5,3,0),6,5,0x777777,.5,2.2);
  /* puddle ripples on every footstep */
  if(r.mv&&t>35&&t<50){const st=Math.floor(t*(2+r.mv*.7)/Math.PI);if(st!==C._st){C._st=st;C.ring(V(5,.1,5),0xd0ecff,t,2,.7,.02);S.thud(C.M,C.raw,.5+C.clamp((t-35)/10)*.4);C.shake=Math.max(C.shake,.05+C.clamp((t-35)/12)*.25)}}
  /* the knight's pterodactyl */
  const rp=rideP(t);RIDE.g.visible=t>95.5&&t<107.5;if(RIDE.g.visible){RIDE.g.position.copy(rp.p);RIDE.g.rotation.y=rp.yaw;RIDE.up(t)}
  claws.visible=t>66&&t<76.2;if(claws.visible)wingL.up(t,1.2);
  foot.visible=t>118;if(foot.visible){const k=C.clamp((t-118)/1.5);foot.position.set(0,C.lerp(9,.2,k*k),C.lerp(-3,-1.2,k))}
});
const rideP=t=>{const ks=[[95.5,V(26,9,12)],[97.5,V(6,4.5,-3)],[101,V(2,18,6)],[104,V(-12,20,-9)],[106,V(0,15,-17)],[107.5,V(0,30,-30)]];if(t<=ks[0][0])return{p:ks[0][1],yaw:0};
  for(let i=1;i<ks.length;i++)if(t<ks[i][0]){const a=ks[i-1],b=ks[i],k=C.ease((t-a[0])/(b[0]-a[0]));const p=L.vec(a[1],b[1],k);const d=b[1].clone().sub(a[1]);return{p,yaw:Math.atan2(-d.z,d.x)}}return{p:ks[ks.length-1][1],yaw:0}};

/* ---------- the armies ---------- */
const AR=L.armies(),I=C.I;const atkDir=1,defDir=-1;
const st=L.stands(seats);AR.dead.forEach(d=>{const a=L.actor(d.c,d.t,{size:2});st.seatNow(a)});
AR.atk.forEach(a=>a.key(0,V((Math.random()-.5)*14,0,40)));AR.def.forEach(a=>a.key(0,V((Math.random()-.5)*14,0,-40)));
AR.atk.forEach(a=>a.key(9,a.pos(0)));AR.def.forEach(a=>a.key(9,a.pos(0)));
L.formation(AR.atk,9.5,atkDir,18.5);L.formation(AR.def,-9.5,defDir,18.5);
[...AR.atk,...AR.def].forEach(a=>{const k=a.keys[a.keys.length-1];k.hop=.45});
const K=AR.king,MK=AR.myKing,H=AR.hero;
K.key(0,V(0,0,-40)).key(10,V(0,0,-40)).key(19,V(0,0,-15),{hop:.4});MK.key(0,V(2,0,40)).key(10,V(2,0,40)).key(19,V(-2,0,15),{hop:.4});H.key(0,V(4,0,40)).key(10,V(4,0,40)).key(19,V(3,0,14.5),{hop:.4,glow:.4});
const bat=L.battle({a:AR.atk,b:AR.def,t0:21,t1:34.5,mid:V(0,0,0),R,favor:'a',spread:6.5,onFall:(A,t)=>st.take(A,t)});
/* T-rex: everyone runs */
const surv=[...bat.a,...bat.b];
const victim=surv.find(a=>a.type==='p')||surv[0];
surv.forEach(a=>{const p=a.pos(42.6);const d=p.clone().sub(V(0,0,-20)).setY(0);if(d.lengthSq()<.1)d.set(1,0,1);d.normalize();let q=p.clone().addScaledVector(d,10+R()*6);q.x=C.clamp(q.x,-14,16);q.z=C.clamp(q.z,-14,18);
  if(a===victim)q=V(2.2,0,-1.5);a.key(42.6,p).key(46.5,q,{hop:.6})});
K.key(42.6,V(0,0,-15)).key(46.5,V(-9,0,-12),{hop:.6});
if(victim){victim.key(48.9,V(2.2,0,-1.5),{hop:.3}).key(49.25,V(2.6,7.5,-2.5),{sc:.6}).key(49.3,V(2.6,7.5,-2.5),{vis:false}).key(49.9,V(2.6,7.5,-2.5),{vis:true,sc:1});victim.alive=false;st.take(victim,50)}
C.at(48.9,()=>{S.clang(C.M,C.raw,.4);S.thud(C.M,C.raw+.3,.4)});
/* hero mounts the triceratops */
H.key(51.4,V(3,0,14.5)).key(52.5,V(14,2.5,4),{arc:3});for(let t=52.75;t<=88;t+=.25){const q=triP(t);H.key(t,V(q.x,2.5,q.z),{glow:.7})}
C.at(55,()=>{C.burst(V(1.5,3,-2),[C.GOLD,C.WHITE],80,8);C.ring(V(1.5,.2,-2),0xffd54f,55,9,1);S.explode(C.M,C.raw,.6);S.roar(C.M,C.raw+.2,1.2,.6);C.shake=.9});
/* ghost that rights the fallen camera */
const helper=L.actor(AR.dead[0]?AR.dead[0].c:'w',AR.dead[0]?AR.dead[0].t:'p',{size:1.6,ghost:true});helper.key(0,V(-40,0,0),{vis:false}).key(63.4,V(1,3,13),{vis:false}).key(63.5,V(1,3,13),{vis:true}).key(64.4,V(3.3,1,12.6)).key(66,V(3.5,2.8,12.6)).key(67,V(-16,3,6),{arc:3}).key(67.1,V(-16,3,6),{vis:false});
/* the king's guard walls him in (smothered) */
const KP=V(0,0,-17.5);const guards=bat.b.filter(a=>a!==victim).slice(0,8);while(guards.length<8){const g=L.actor(I.kingColor,'p');g.key(0,V(0,0,-60),{vis:false}).key(80,V((guards.length-4)*3,0,-45),{vis:true});guards.push(g)}
guards.forEach((g,i)=>{const a=i/8*Math.PI*2;const p=KP.clone().add(V(Math.cos(a)*2.3,0,Math.sin(a)*2.3));const from=g.pos(80);g.key(80.5+i*.3,from).key(84+i*.4,p,{hop:.5,glow:0}).key(90,p,{glow:.5});
  const fly=p.clone().add(V(Math.cos(a)*14,0,Math.sin(a)*14));g.key(108,p).key(109.2,V(fly.x,-.95,fly.z),{arc:5,rot:Math.PI*4.5,glow:0});g.alive=false;st.take(g,111)});
K.key(80,K.pos(80)).key(83,KP,{hop:.5});
bat.a.forEach((a,i)=>{const p=V(-5+i*1.6,0,2+(i%2)*1.6);a.key(80,a.pos(80)).key(84,p,{hop:.5}).key(108,p).key(109.5,p,{hop:1.2}).key(116,p,{hop:.6})});
MK.key(80,MK.pos(80)).key(84,V(4,0,4),{hop:.5});
/* the leap: triceratops -> pterodactyl -> L-shaped dive */
H.key(97.5,V(7,2.5,-4)).key(98,V(6,5.2,-3),{arc:1.5});for(let t=98.25;t<=106;t+=.25){const p=rideP(t).p;H.key(t,V(p.x,p.y+.6,p.z),{glow:1})}
H.key(106.4,V(0,15.5,-17),{glow:1}).key(107.7,V(KP.x+.4,.2,KP.z+1.2),{ease:2,glow:1}).key(116,V(KP.x+.4,0,KP.z+1.2));
C.at(96,()=>S.screech(C.M,C.raw));C.at(106.2,()=>{S.whoosh(C.M,C.raw,.5);C.M&&C.M.riser(C.raw,1.5,.4)});
CINE.kingEnd(C,K.ch,107.8,[C.GOLD,new T.Color(0x7cb342),new T.Color(0xff7043)]);
/* the meteor */
const met=C.sprite(0xfff3c4,3,0);const metH=C.sprite(0xff7043,8,0);
C.every((t,dt)=>{const k=C.clamp((t-97)/12);const p=V(C.lerp(-40,-95,k),C.lerp(90,0,k*k),C.lerp(-160,-150,k));met.position.copy(p);metH.position.copy(p);const on=t>97&&t<109;met.material.opacity=on?1:0;metH.material.opacity=on?.8:0;met.scale.setScalar(3+k*8);metH.scale.setScalar(8+k*18);if(on&&Math.random()<.7)smoke.emit(p,V(0,2,0),3+k*5,2.5,0x9a8a7a,.45,1.5)});
C.at(97,()=>S.rumble(C.M,C.raw,12,.35));
C.at(109,()=>{C.flash(.9,1600);S.explode(C.M,C.raw+.6,1);C.ring(V(-95,1,-150),0xffcc80,109,120,4,1.2);C.shake=1.2});
C.every((t,dt)=>{if(t>109.5&&t<114&&Math.random()<dt*25)dust.emit(V((Math.random()-.5)*80,2+Math.random()*4,-70+(t-109.5)*14),V(0,0,10),8,3,0xb8a58a,.55,1)});
/* nest: an egg hatches a tiny pawn */
const baby=L.actor(I.color,'p',{size:1.1});baby.key(0,V(28.1,12.6,-27.1),{vis:false,sc:.2}).key(78.6,V(28.1,12.6,-27.1),{vis:true,sc:.2}).key(79.2,V(28.1,13.6,-27.1),{sc:1,hop:.4});
C.at(78.5,()=>{eggs[2].visible=false;eh.forEach(m=>m.visible=true);S.crack(C.M,C.raw);S.chirp(C.M,C.raw+.6)});C.every(t=>{if(t>78.5){const k=C.clamp((t-78.5)*2);eh[0].position.y=13.5+k*.5;eh[0].rotation.z=k*.8;eh[1].rotation.z=-k*.5}});
/* the spectators */
st.popcorn(14,40);st.flags([0x4fc3f7,0xff7043,0xffd54f]);
st.mood('cheer',21,25);st.mood('cheer',29,33);st.mood('panic',41.5,48);st.mood('laugh',49.6,52);st.mood('cheer',55,57.5);st.mood('lean',63,65.5);st.mood('wave',87,95);st.mood('cheer',108,116);
/* ---------- fourth wall: fog, roar, crack, the camera falls, a ghost picks it up ---------- */
const deadSrc=AR.dead[0]?PIC(AR.dead[0].c,AR.dead[0].t):PIC('w','p');
let crk=null;
C.at(58.3,()=>{L.fogWipe(2.1,deadSrc);S.rumble(C.M,C.raw,1.6,.25)});
C.at(60.5,()=>S.roar(C.M,C.raw,2.3,1.2));
C.at(61.2,()=>{crk=L.crack(52,40);S.crack(C.M,C.raw);S.glass(C.M,C.raw+.05);C.shake=.6});
C.at(61.7,()=>S.thud(C.M,C.raw+.4,.7));
C.at(70,()=>{L.fade(crk,1500)});
C.at(66,()=>{S.screech(C.M,C.raw);S.whoosh(C.M,C.raw+.3,.5)});C.at(76,()=>S.whoosh(C.M,C.raw,.5));C.at(77.4,()=>S.thud(C.M,C.raw,.4));
C.at(118.9,()=>{S.thud(C.M,C.raw,1);C.shake=1.2});
L.roll=t=>t>61.7&&t<66?C.clamp((t-61.7)*2.5)*1.45*(1-C.clamp((t-65)*1)):t>66&&t<76?Math.sin(t*.8)*.25:t>76&&t<77.4?(t-76)*4:0;
/* ---------- music ---------- */
L.music({root:55,end:D,parts:[
  {at:0,bpm:84,prog:['i','VI','III','VII'],lvl:0,bell:1},{at:9,bpm:96,prog:['i','VI','III','VII'],lvl:1,toms:1},{at:20,bpm:110,prog:['i','i','VI','VII'],lvl:2,toms:1,arp:1},
  {at:34.5,bpm:60,prog:['i'],lvl:-1},{at:42.5,bpm:126,prog:['i','VI','iv','V'],lvl:3,toms:1},{at:56,bpm:60,prog:['i'],lvl:-1},
  {at:66,bpm:90,prog:['VI','III','VII','i'],lvl:0,arp:1,bell:1},{at:80,bpm:100,prog:['i','VI','III','VII'],lvl:1,toms:1},{at:88,bpm:112,prog:['i','iv','VI','V'],lvl:2,toms:1},
  {at:96,bpm:132,prog:['i','VI','VII','V'],lvl:3,toms:1,arp:1},{at:108,bpm:84,prog:['I','IV','I','V'],lvl:0,bell:1,g:1.2},{at:116,bpm:60,prog:['i'],lvl:-1}]});
C.at(107.8,()=>C.M&&C.M.choir([110,138.6,164.8],C.raw+.2,6,.03));
/* ---------- camera ---------- */
const kp=()=>K.cur;
const cam=L.shots([
  [9,(k)=>{const e=C.ease(k);return[V(C.lerp(45,9,e),C.lerp(42,6,e),C.lerp(65,24,e)),V(0,1,0)]}],
  [11,(k,t)=>[V(C.lerp(-19,-7,k),2.2,C.lerp(19,16,k)),V(0,1.4,C.lerp(10,0,k))]],
  [4,(k,t)=>[L.hand(V(-8,4.5,5),t),V(-19,2.8,3)]],
  [10,(k,t)=>L.orb(V(0,1.3,0),13,3.5+Math.sin(t*.7),t*.28)],
  [3,(k,t)=>[V(7.2,1.1,7.4),V(5,0,5)]],
  [5,(k,t)=>{const h=RX.head();return[L.hand(V(2,1.4,9),t,.12),V(h.x*.5,C.lerp(3,h.y,k),h.z)]}],
  [7,(k,t)=>{const r=rexP(t);return[L.hand(V(15,6.5,15),t,.15),V(r.x,3,r.z)]}],
  [7,(k,t)=>{const q=triP(t);return[V(q.x+2,3.2,q.z+9),V(C.lerp(q.x,0,k),2.5,C.lerp(q.z,-2,k))]}],
  [10,(k,t)=>{const fall=C.clamp((t-61.7)*2.5)*(1-C.clamp(t-65));const h=RX.head();return[V(4,C.lerp(4,.45,fall),11+fall*.5),V(C.lerp(h.x,0,fall*.5),C.lerp(h.y,1,fall),h.z)]}],
  [10,(k,t)=>{const a=-.6+k*2.4;return[V(Math.sin(a)*32,C.lerp(10,34,C.clamp(k*3)),Math.cos(a)*32),V(Math.sin(a+.6)*10,0,Math.cos(a+.6)*10-8)]}],
  [4,(k,t)=>t<77.4?[V(C.lerp(28,28,k),C.lerp(30,14.6,C.clamp((t-76)/1.4)),-24),V(28,13,-28)]:[V(29.6,14.4,-25.2),V(28.1,13.6,-27.1)]],
  [6,(k,t)=>[V(7,3.2,-9),V(KP.x,1.4,KP.z)]],
  [10,(k,t)=>L.orb(V(KP.x,1.6,KP.z+4),10,3+k*2,-.4+k*1.6)],
  [6,(k,t)=>{const p=rideP(t).p;return[p.clone().add(V(-5,2.5,7)),p]}],
  [4,(k,t)=>[V(14,6,8),L.vec(rideP(t).p,V(-40,30,-80),.35)]],
  [2,(k,t)=>[V(KP.x+3.5,1,KP.z+5.5),V(KP.x,C.lerp(12,2,k),KP.z)]],
  [3,(k,t)=>[V(10,5,14),V(-30,8,-90)]],
  [5,(k,t)=>[V(-3,4,10),V(-14,3,-1)]],
  [4,(k,t)=>{const h=RX.head();return[V(0,2,12),V(h.x,h.y,h.z)]}],
]);
return{dur:D,cam};
};
})();
