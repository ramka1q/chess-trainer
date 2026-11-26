/* Legendary mate 4 — "Армія полеглих" (mate after sacrifices). ~2 minutes.
   Night, a ruined colosseum. Every piece captured in the game rises from its grave and takes a seat;
   the living fight below, the fallen join the crowd, ghosts throw things, look straight at us, try to press
   the skip button, and in the end the sacrificed pieces fly down and become the strength of the final blow. */
(function(){
const SC=window.LEGEND_SCENES=window.LEGEND_SCENES||{};
SC.ghosts=(C,L)=>{
const T=C.T,V=C.V,S=L.SFX,R=L.rng(6161),D=120,I=C.I;
const MON=V(0,92,-205);
/* ---------- world ---------- */
const sky=C.sky('#02030a','#0b1030','#1c2650','#0a0e20',.006);const fog=C.scene.fog;
const lt=L.lights(0x8090ff,0x101020,.55,0xbfd4ff,.7,V(-95,70,-110));
const moon=C.sprite(0xe8f0ff,70,.9);moon.position.set(-95,70,-110);const moonD=L.mesh(new T.CircleGeometry(9,32),new T.MeshBasicMaterial({color:0xf4f8ff,fog:false}),-94,70,-109);moonD.lookAt(0,0,0);
/* the ground is one square of a giant board on a giant desk (seen in the big pull-back) */
const gb=L.mesh(new T.PlaneGeometry(720,720),new T.MeshStandardMaterial({map:L.chk('#EBECD0','#739552'),roughness:.9}),0,-.6,-60);gb.rotation.x=-Math.PI/2;
const mon=L.mesh(new T.PlaneGeometry(260,162),new T.MeshBasicMaterial({map:L.appTex(),fog:false}),MON.x,MON.y,MON.z);L.mesh(new T.BoxGeometry(272,174,6),L.std(0x111111),MON.x,MON.y,MON.z-4);
L.mesh(new T.BoxGeometry(30,MON.y-80,10),L.std(0x222222),MON.x,(MON.y-80)/2-.6,MON.z-6);
L.terrain(190,L.LOW?40:70,(x,z)=>{const r=Math.hypot(x,z);return r<34?0:L.nz(x*.6,z*.6)*.8+.2},(c,x,y,z)=>{const n=L.nz(x*2,z*2);const r=Math.hypot(x,z);if(r<22)c.setRGB(.42,.37,.3);else c.setRGB(.12+.03*n,.18+.04*n,.12)},0);
L.board(16,'#9e9a8a','#4a4740',.04);
/* the colosseum */
const prof=[];for(let i=0;i<=5;i++){prof.push(new T.Vector2(23+i*2,i*1.4),new T.Vector2(23+i*2,(i+1)*1.4))}prof.push(new T.Vector2(35,7),new T.Vector2(35,0));
const stoneM=L.std(0x6e6a63,{side:T.DoubleSide});const d2r=Math.PI/180;
L.mesh(new T.LatheGeometry(prof,30,15*d2r,150*d2r),stoneM);L.mesh(new T.LatheGeometry(prof,30,195*d2r,150*d2r),stoneM);
for(let a=0;a<360;a+=12){if(a<14||a>346||(a>166&&a<194))continue;const h=a%36===0?4+R()*3:9+R()*2;const x=Math.sin(a*d2r)*35.5,z=Math.cos(a*d2r)*35.5;L.mesh(new T.BoxGeometry(1.6,h,1.6),L.std(0x7a756c),x,7+h/2,z)}
for(let a=0;a<360;a+=24){if(a>=120&&a<=264)continue;const g=L.mesh(new T.TorusGeometry(2.4,.45,6,10,Math.PI),L.std(0x7a756c),Math.sin(a*d2r)*35.5,16.5,Math.cos(a*d2r)*35.5);g.rotation.y=a*d2r+Math.PI/2}
/* gates with torches */
const torches=[];[[0,23],[0,-23]].forEach(([x,z])=>{for(const dx of[-3.5,3.5]){L.mesh(new T.BoxGeometry(1.2,6,1.2),L.std(0x5a554e),x+dx,3,z);const f=C.sprite(0xff8a3d,3,1);f.position.set(x+dx,6.6,z);torches.push(f)}});
[[0,7,23],[0,7,-23],[-22,9,0]].forEach(p=>{const l=new T.PointLight(0xff8a3d,1.4,45,1.8);l.position.set(...p);C.add(l)});
/* graves shaped like chess pieces */
const graveProf=[[0,0],[1,0],[1,.3],[.7,.5],[.45,1.6],[.75,1.8],[.6,2.2],[0,2.3]].map(p=>new T.Vector2(p[0],p[1]));const gM=L.std(0x8a877f);
const graves=[];for(let i=0;i<30;i++){const a=(i/30)*Math.PI*2+R()*.1,r=42+R()*16;const g=L.mesh(new T.LatheGeometry(graveProf,8),gM,Math.sin(a)*r,0,Math.cos(a)*r);g.scale.setScalar(.8+R()*.5);g.rotation.z=(R()-.5)*.2;graves.push(g.position)}
/* seats */
const seats=[];[1,3].forEach(row=>{const r=23+row*2+1,h=(row+1)*1.4;for(let a=30;a<=150;a+=10)seats.push(V(Math.sin(a*d2r)*r,h,Math.cos(a*d2r)*r));for(let a=210;a<=330;a+=10)seats.push(V(Math.sin(a*d2r)*r,h,Math.cos(a*d2r)*r))});
seats.sort((p,q)=>Math.abs(Math.atan2(p.x,p.z)+1.57)-Math.abs(Math.atan2(q.x,q.z)+1.57));
const mist=L.puffs(60);C.every((t,dt)=>{torches.forEach((f,i)=>f.scale.setScalar(3+Math.sin(t*17+i*3)*.5+Math.sin(t*7+i)*.3));if(Math.random()<dt*6)mist.emit(V((Math.random()-.5)*120,.8,(Math.random()-.5)*120),V(1.5,0,.5),14,8,0x9fb0d0,.22,.6)});
/* ---------- the fallen rise from their graves ---------- */
const AR=L.armies(),K=AR.king,MK=AR.myKing,H=AR.hero;const st=L.stands(seats);
const risen=AR.dead.map((d,i)=>{const a=L.actor(d.c,d.t,{size:2});a.dead=d;const g=graves[i%graves.length];a.key(0,V(g.x,-2.6,g.z),{op:0}).key(1.5+i*.35,V(g.x,-2.6,g.z),{op:0}).key(3.5+i*.35,V(g.x,1.2,g.z),{op:1});st.take(a,4+i*.35,5.5);return a});
risen.forEach((a,i)=>C.at(1.5+i*.35,()=>{C.burst(V(graves[i%graves.length].x,.5,graves[i%graves.length].z),[new T.Color(.6,.9,1)],20,2.5);C.M&&C.M.tone(330+i*40,C.raw,1.2,{type:'sine',f2:660+i*40,g:.025})}));
/* ---------- the living ---------- */
AR.atk.forEach((a,i)=>a.key(0,V(0,0,48),{vis:false}).key(14+i*.3,V(0,0,40),{vis:true}).key(18+i*.3,V(0,0,24),{hop:.4}));
AR.def.forEach((a,i)=>a.key(0,V(0,0,-48),{vis:false}).key(14+i*.3,V(0,0,-40),{vis:true}).key(18+i*.3,V(0,0,-24),{hop:.4}));
L.formation(AR.atk,9,1,24);L.formation(AR.def,-9,-1,24);[...AR.atk,...AR.def].forEach(a=>a.keys[a.keys.length-1].hop=.45);
K.key(0,V(0,0,-48),{vis:false}).key(18,V(0,0,-40),{vis:true}).key(26,V(0,0,-15),{hop:.4});MK.key(0,V(2,0,48),{vis:false}).key(18,V(2,0,40),{vis:true}).key(26,V(2,0,15),{hop:.4});
H.key(0,V(-2,0,48),{vis:false}).key(18,V(-2,0,40),{vis:true}).key(26,V(-2,0,14),{hop:.4,glow:.3});
const bat=L.battle({a:AR.atk,b:AR.def,t0:28,t1:48,mid:V(0,0,0),R,favor:'b',spread:6.5,onFall:(A,t)=>{st.take(A,t);C.at(t+2.9,()=>{C.burst(A.seat?A.seat.p.clone().add(V(0,2,0)):V(0,5,0),[C.WHITE,new T.Color(.6,.9,1)],26,3);S.chirp(C.M,C.raw)})}});
/* ghost hijinks: a duel in the stands, a tomato for the king */
C.every(t=>{if(t<49||t>53||st.sit.length<2)return;if(Math.random()<.25){const p=st.sit[0].cur.clone().lerp(st.sit[1].cur,.5).add(V(0,1.5,0));C.burst(p,[C.WHITE,new T.Color(.6,.9,1)],5,3)}});
if(st.sit.length>=2){const[a0,a1]=st.sit;const o0=a0.off,o1=a1.off;a0.off=t=>{const o=o0(t)||{};if(t>49&&t<53)o.x=(o.x||0)+Math.sin(t*9)*.6;return o};a1.off=t=>{const o=o1(t)||{};if(t>49&&t<53)o.x=(o.x||0)-Math.sin(t*9)*.6;return o}}
C.at(49,()=>{for(let i=0;i<6;i++)S.clang(C.M,C.raw+i*.6,.4)});
const tom=L.mesh(new T.SphereGeometry(.4,10,8),L.std(0xe53935),0,-20,0);
const kp=()=>K.pos(54);C.every(t=>{const on=t>53&&t<55;tom.visible=on;if(!on)return;const k=(t-53)/2;const from=(st.sit[2]||st.sit[0]||{cur:V(-25,6,0)}).cur.clone().add(V(0,2,0)),to=kp().clone().add(V(1.6,.3,.5));const p=L.vec(from,to,k);p.y+=Math.sin(k*Math.PI)*9;tom.position.copy(p)});
C.at(55,()=>{const p=kp().clone().add(V(1.6,.3,.5));C.burst(p,[new T.Color(0xe53935)],60,4);S.thud(C.M,C.raw,.3);C.M&&C.M.noise(C.raw,.3,{type:'bandpass',f:600,g:.4,att:.002,rel:.25})});
K.key(54,K.pos(54)).key(54.8,K.pos(54).add(V(-2,0,0)),{hop:1.2}).key(57,K.pos(54).add(V(-2,0,0)));
/* ---------- fourth wall: they all look at us, then the camera pulls back out of the game ---------- */
st.mood('lean',58,62.5);C.at(58,()=>{if(C.M){C.M.tone(1760,C.raw,1.2,{type:'sine',g:.03});SFX_hush()}});
function SFX_hush(){C.M&&C.M.noise(C.raw,2,{type:'bandpass',f:3000,q:2,g:.05,att:.2,rel:1})}
C.every(t=>{const k=t>62&&t<70?Math.sin(C.clamp((t-62)/8)*Math.PI):0;C.scene.fog.density=.006*(1-k*.85);sky.visible=!(t>63&&t<69.3)});
C.at(62.5,()=>{C.M&&C.M.riser(C.raw,3,.2)});C.at(68.5,()=>S.whoosh(C.M,C.raw,.6));
/* a ghost flies right through the camera */
const thru=L.actor(AR.dead[0]?AR.dead[0].c:'w',AR.dead[0]?AR.dead[0].t:'p',{size:2.4,ghost:true});thru.key(0,V(0,-20,0),{vis:false}).key(70,V(-18,6,-10),{vis:true}).key(72.2,V(0,3,15.5)).key(73.5,V(10,4,40),{vis:false});
C.at(72.1,()=>{L.blackout(700,'rgba(170,220,255,.85)');S.whoosh(C.M,C.raw,.7);const f=L.ov('inset:0;box-shadow:inset 0 0 14vmin 3vmin rgba(200,235,255,.9);opacity:0');L.anim(f,[{opacity:0},{opacity:1,offset:.1},{opacity:0}],{duration:3000,fill:'forwards'});C.M&&C.M.tone(2600,C.raw,1.5,{type:'sine',f2:1800,g:.02})});
/* ghosts try to press the skip button */
C.at(75,()=>{const b=C.skipBtn;if(!b)return;const r=b.getBoundingClientRect();const src=AR.dead[1]?PIC(AR.dead[1].c,AR.dead[1].t):PIC('b','p');const src2=AR.dead[2]?PIC(AR.dead[2].c,AR.dead[2].t):PIC('w','p');
  const gs='filter:brightness(1.8) sepia(1) hue-rotate(160deg) saturate(3) drop-shadow(0 0 12px #8ff);opacity:.9;z-index:993';
  const g1=L.domImg(src,`left:${r.left-16}vh;top:-20vh;width:14vh;height:14vh;${gs}`);g1.style.left=(r.left-r.width*2)+'px';
  L.anim(g1,[{transform:'translate(-30vw,0) rotate(-10deg)'},{transform:`translate(0,${r.top}px) rotate(8deg)`,offset:.45},{transform:`translate(${r.width*.8}px,${r.top-r.height*.2}px) rotate(-12deg)`,offset:.6},{transform:`translate(${r.width*.6}px,${r.top}px) rotate(10deg)`,offset:.75},{transform:`translate(-20vw,${r.top*.3}px) rotate(-30deg)`}],{duration:4200,fill:'forwards',easing:'ease-in-out'});
  const g2=L.domImg(src2,`left:0;top:0;width:12vh;height:12vh;${gs}`);
  L.anim(g2,[{transform:'translate(-20vw,40vh)',opacity:0},{transform:`translate(${r.left-r.width*3}px,${r.top-r.height}px)`,opacity:.9,offset:.6},{transform:`translate(${r.left-r.width*2.4}px,${r.top-r.height*.6}px)`,offset:.75},{transform:'translate(-25vw,30vh)',opacity:.9}],{duration:4200,fill:'forwards',easing:'ease-in-out'});
  setTimeout(()=>{L.anim(b,[{transform:'scale(1) rotate(0)'},{transform:'scale(.8) rotate(-12deg)'},{transform:'scale(1.1) rotate(10deg)'},{transform:'scale(.85) rotate(-6deg)'},{transform:'scale(1) rotate(0)'}],{duration:900});S.boing(C.M,C.raw+.1);S.boing(C.M,C.raw+.5)},2300);
  setTimeout(()=>S.laugh(C.M,C.raw+3.1),100)});
/* ---------- the shadow army ---------- */
const shT=['q','r','r','b','n','n','b','p','p','p'].slice(0,L.LOW?6:10);
const shadows=shT.map((tp,i)=>{const a=L.actor(I.kingColor,tp,{col:C.RED});const ang=-Math.PI/2+(i-(shT.length-1)/2)*.32;const p=V(Math.cos(ang)*9,0,-15+Math.sin(ang)*-3+4);a.key(0,p,{vis:false,sc:.01}).key(81+i*.4,p,{vis:true,sc:.01,glow:1}).key(83+i*.4,p,{sc:1.1,glow:.9});
  a.key(90,p,{glow:.9}).key(96,V(p.x*.6,0,p.z+8),{hop:.3,glow:.9}).key(103.8,V(p.x*.6,0,p.z+8)).key(105,V(p.x*.6,1,p.z+8),{op:0,sc:.2});return a});
C.every(t=>{shadows.forEach(a=>{a.ch.m.material.color.setRGB(t>80?.12:1,t>80?.05:1,t>80?.08:1)})});
C.at(80.5,()=>{S.rumble(C.M,C.raw,4,.4);C.M&&C.M.choir([51.9*2,51.9*2.38,51.9*3],C.raw,8,.03)});
shadows.forEach((a,i)=>C.at(81+i*.4,()=>{C.burst(a.pos(83).setY(.4),[new T.Color(.5,0,.1),new T.Color(0,0,0)],30,3);S.thud(C.M,C.raw,.3)}));
C.at(104,()=>{shadows.forEach(a=>C.burst(a.cur.clone().setY(1.3),[C.WHITE,C.GOLD],30,5));C.flash(.6,800)});
/* survivors back off to the walls */
[...bat.a,...bat.b].forEach((a,i)=>{const p=a.pos(79);const ang=Math.atan2(p.x,p.z)||i;a.key(79,p).key(82,V(Math.sin(ang)*17,0,Math.cos(ang)*17),{hop:.5})});
K.key(79,K.pos(79)).key(81,V(0,0,-16),{hop:.4});H.key(79,H.pos(79)).key(82,V(0,0,6),{hop:.4,glow:.4});
/* ---------- the sacrificed come down and become the final blow ---------- */
const mine=risen.filter(a=>a.dead.c===I.color).concat(st.sit.filter(a=>a.color===I.color&&!risen.includes(a))).slice(0,12);
const HP=V(0,0,6);
mine.forEach((a,i)=>{const t0=95.5+i*.18;a.off=null;const ang=i/mine.length*Math.PI*2;a.key(t0,a.seat?a.seat.p.clone():a.pos(t0),{});
  for(let s=1;s<=8;s++){const tt=t0+s*.75;const r=C.lerp(6,1,s/8),an=ang+s*.9;a.key(tt,HP.clone().add(V(Math.cos(an)*r,1.5+s*.4,Math.sin(an)*r)),{op:s<8?.9:.3})}
  a.key(t0+6.6,HP.clone().add(V(0,1.5,0)),{op:0,sc:.3})});
C.every(t=>{if(t<96||t>104)return;if(Math.random()<.8){const a=Math.random()*Math.PI*2,r=1+Math.random()*5;C.spark(HP.clone().add(V(Math.cos(a)*r,Math.random()*5,Math.sin(a)*r)),V(-Math.sin(a)*4,2,Math.cos(a)*4),.8,Math.random()<.5?C.WHITE:new T.Color(.6,.9,1))}});
C.at(95.5,()=>{C.M&&C.M.choir([207.6,261.6,311],C.raw,9,.03);C.M&&C.M.riser(C.raw+4,4,.3)});
H.key(96,HP,{glow:.5}).key(103,HP,{glow:1,sc:1.1}).key(104.2,HP,{sc:2.1,glow:1}).key(106.4,HP,{sc:2.1});
C.at(104.2,()=>{C.ring(HP.clone().setY(.2),0xbfefff,104.2,14,1.3,.1);C.burst(HP.clone().setY(2),[C.WHITE,new T.Color(.6,.9,1)],200,10);S.explode(C.M,C.raw,.6);C.shake=.7});
H.key(107.3,V(0,0,-14.2),{ease:2,sc:2.1,glow:1}).key(116,V(0,0,-14.2),{sc:1.6});
CINE.kingEnd(C,K.ch,107.35,[C.WHITE,new T.Color(.6,.9,1),C.VIO]);
/* ---------- dawn: the ghosts say goodbye ---------- */
C.every(t=>{const k=C.clamp((t-108)/7);sky.material.color.setRGB(1+k*1.5,1+k*1.1,1+k*.6);lt.h.intensity=.55+k*.5;moon.material.opacity=.9*(1-k*.7)});
const leave=st.sit.filter(a=>!mine.includes(a));leave.forEach((a,i)=>{const t0=110+i*(6/Math.max(1,leave.length));const p=a.seat?a.seat.p:a.pos(t0);a.key(t0,p).key(t0+2.5,p.clone().add(V(0,16,0)),{op:0})});
for(let i=0;i<12;i++)C.at(108.5+i*.5,()=>{const p=V((Math.random()-.5)*40,16+Math.random()*10,(Math.random()-.5)*40);C.burst(p,[new T.Color(.6,.9,1),C.WHITE,C.VIO],70,8);C.M&&C.M.bell(523*Math.pow(1.122,i%7),C.raw,.03)});
/* the last ghost blows the camera out like a candle */
const last=L.actor(I.color,'p',{size:1.6,ghost:true});last.key(0,V(0,-20,0),{vis:false}).key(116,V(-3,6,20),{vis:true}).key(118.6,V(0,3.9,27.6));
C.at(119,()=>{C.M&&C.M.noise(C.raw,.5,{type:'bandpass',f:900,q:.5,g:.35,att:.02,rel:.4});L.blackout(2000,'#05060f')});
/* spectators */
st.lights(20,46,0xfff1a8);st.mood('cheer',18,22);st.mood('wave',24,28);st.mood('cheer',33,36);st.mood('wave',40,46);st.mood('laugh',55,57.5);st.mood('panic',83,95);st.mood('cheer',104.5,110);
/* ---------- music (organ) ---------- */
L.music({root:51.9,end:D,parts:[
  {at:0,bpm:70,prog:['i','VI','iv','V'],lvl:0,pad:'organ',bell:1},{at:14,bpm:96,prog:['i','III','VII','iv'],lvl:1,pad:'organ'},{at:28,bpm:120,prog:['i','VI','iv','V'],lvl:2,pad:'organ',arp:1},
  {at:48,bpm:104,prog:['VI','VII','i','i'],lvl:1,arp:1},{at:58,bpm:60,prog:['i'],lvl:-1},{at:62.5,bpm:70,prog:['VI','III','VII','i'],lvl:0,bell:1},{at:70,bpm:108,prog:['i','VII','VI','V'],lvl:1},
  {at:80,bpm:84,prog:['i','i','VI','V'],lvl:1,pad:'organ',toms:1},{at:95.5,bpm:120,prog:['i','VI','III','VII'],lvl:2,pad:'organ',arp:1},{at:102,bpm:132,prog:['i','VI','VII','V'],lvl:3,arp:1},
  {at:107.4,bpm:80,prog:['I','IV','vi','V'],lvl:0,bell:1,g:1.2},{at:116,bpm:60,prog:['I'],lvl:0,pad:'organ'}]});
/* ---------- camera ---------- */
const cam=L.shots([
  [8,k=>{const e=C.ease(k);return[V(C.lerp(70,30,e),C.lerp(6,4,e),C.lerp(30,48,e)),V(0,C.lerp(2,4,e),40)]}],
  [6,(k,t)=>[V(C.lerp(30,8,k),C.lerp(8,26,k),C.lerp(60,46,k)),V(0,8,0)]],
  [7,(k,t)=>[V(0,3,C.lerp(46,30,k)),V(0,2,0)]],
  [7,(k,t)=>[V(-10,5,8),V(-27,4,-2)]],
  [20,(k,t)=>{const r=L.orb(V(0,1.3,0),13,3.5+Math.sin(t*.6)*1.2,t*.22);return[L.hand(r[0],t,.1),r[1]]}],
  [5,(k,t)=>[V(-12,7,10),st.sit[0]?st.sit[0].cur.clone().add(V(0,1,0)):V(-26,4,0)]],
  [5,(k,t)=>{const p=K.pos(t);return[p.clone().add(V(6,3,9)),p.clone().add(V(-.5,1,0))]}],
  [4,(k,t)=>[V(0,4,15),V(0,6,-2)]],
  [8,(k,t)=>{const q=k<.6?C.ease(k/.6):1-C.ease((k-.6)/.4);return[L.vec(V(0,4,15),V(0,140,185),q),L.vec(V(0,6,-2),V(0,62,-150),q)]}],
  [5,(k,t)=>[V(0,3,16),V(-6,4,0)]],
  [5,(k,t)=>[V(12,6,14),V(0,3,0)]],
  [15.5,(k,t)=>{const a=k<.5?.5+k*.8:.9+k*.6;return[L.hand(V(Math.sin(a)*14,3+k*2,6+Math.cos(a)*10),t,.12),V(0,1.6,-8)]}],
  [8.5,(k,t)=>[L.hand(V(5+Math.sin(t)*1,2.5+k*3,13),t,.1),HP.clone().add(V(0,2+k*1.5,0))]],
  [4,(k,t)=>[V(-6,2.4,-6),V(0,2,-14)]],
  [8,(k,t)=>L.orb(V(0,6,0),22,8+k*6,.3+k*.5)],
  [4,(k,t)=>[V(0,4,28),V(0,3.6,26)]],
]);
return{dur:D,cam};
};
})();
