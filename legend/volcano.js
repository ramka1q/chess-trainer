/* Legendary mate 3 — "Виверження" (double-check mate). ~2 minutes.
   An obsidian board at the foot of a volcano: the armies fight and run at the same time while lava bombs fall,
   the ground splits, lava splashes on the lens, we meet the pawn who is holding the camera, and two attackers
   strike the king from both sides at once as the volcano explodes. */
(function(){
const SC=window.LEGEND_SCENES=window.LEGEND_SCENES||{};
SC.volcano=(C,L)=>{
const T=C.T,V=C.V,S=L.SFX,R=L.rng(9090),D=120,I=C.I;
const VTOP=V(0,52,-115),ISL=V(0,2,-34),LEDGE=V(-25,6,4);
/* ---------- world ---------- */
const sky=C.sky('#0b0303','#3a0d06','#8a2a08','#2a0905',.0065);
L.lights(0xff9a60,0x1a0000,.55,0xffa060,.7,V(0,40,-80));
const fill=new T.PointLight(0xff5a1a,2.2,90,1.6);fill.position.set(0,6,-26);C.add(fill);
L.terrain(300,L.LOW?50:90,(x,z)=>{const r=Math.hypot(x,z+4);if(r<17)return 0;if(r<44)return -3.2;return Math.min(24,(r-44)*.35)*(1+.4*L.nz(x*.4,z*.4))-3.2},
  (c,x,y,z)=>{const n=L.nz(x*2,z*2);c.setRGB(.13+.04*n,.1+.03*n,.09)});
L.board(16,'#4a3c38','#1a1312',.04);
/* lava with a moving texture */
const lavaTex=L.canvas(256,256,(x,w,h)=>{x.fillStyle='#ff4500';x.fillRect(0,0,w,h);for(let i=0;i<70;i++){const g=x.createRadialGradient(0,0,0,0,0,30);x.save();x.translate(Math.random()*w,Math.random()*h);g.addColorStop(0,i%3?'#ffd54f':'#fff59d');g.addColorStop(1,'rgba(255,90,0,0)');x.fillStyle=g;x.fillRect(-30,-30,60,60);x.restore()}x.fillStyle='rgba(90,10,0,.55)';for(let i=0;i<40;i++){x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,8+Math.random()*24,4+Math.random()*10,Math.random()*3,0,Math.PI*2);x.fill()}});
lavaTex.wrapS=lavaTex.wrapT=T.RepeatWrapping;lavaTex.repeat.set(10,10);
const lavaM=new T.MeshBasicMaterial({map:lavaTex,color:0xffffff});const lake=L.mesh(new T.PlaneGeometry(130,130),lavaM,0,-1,-10);lake.rotation.x=-Math.PI/2;
/* the volcano */
const volG=new T.CylinderGeometry(9,70,58,40,10,true);{const p=volG.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=L.nz(x*.3+y*.2,z*.3);p.setX(i,x*(1+n*.06));p.setZ(i,z*(1+n*.06))}volG.computeVertexNormals()}
L.mesh(volG,L.std(0x2a2020),VTOP.x,VTOP.y-29,VTOP.z);
const crG=C.sprite(0xff6d00,40,.8);crG.position.copy(VTOP).add(V(0,3,0));
const lavaStreaks=[];for(let i=0;i<7;i++){const a=-Math.PI/2+(i-3)*.32;const m=L.mesh(new T.PlaneGeometry(2.2,64),new T.MeshBasicMaterial({map:lavaTex,side:T.DoubleSide}),0,0,0);
  const top=VTOP.clone().add(V(Math.cos(a)*9,0,Math.sin(a)*9)),bot=VTOP.clone().add(V(Math.cos(a)*68,-56,Math.sin(a)*68));m.position.lerpVectors(top,bot,.5);m.lookAt(top);m.rotateX(Math.PI/2);m.lookAt(bot.clone().add(V(0,40,0)));m.position.lerpVectors(top,bot,.5);m.quaternion.setFromUnitVectors(V(0,1,0),top.clone().sub(bot).normalize());m.rotateY(Math.PI/2);lavaStreaks.push(m)}
/* the ghosts' ledge */
L.mesh(new T.CylinderGeometry(4,5,10,8),L.std(0x3a2e2a),LEDGE.x,1,LEDGE.z);L.mesh(new T.BoxGeometry(7,1,15),L.std(0x3a2e2a),LEDGE.x,LEDGE.y-.5,LEDGE.z);
const seats=[];for(let r=0;r<2;r++){if(r)L.mesh(new T.BoxGeometry(2.4,1.2,15),L.std(0x463833),LEDGE.x-1.8,LEDGE.y+.6,LEDGE.z);for(let i=0;i<7;i++)seats.push(V(LEDGE.x+1.4-r*2.6,LEDGE.y+r*1.2,LEDGE.z-6+i*2))}
/* the island and its bridge */
L.mesh(new T.CylinderGeometry(3.3,4.5,8,9),L.std(0x2c2220),ISL.x,ISL.y-4,ISL.z);
const brid=[];for(let i=0;i<7;i++){const z=-17.6-i*1.8,y=C.lerp(-.2,1.8,i/6);const b=L.mesh(new T.BoxGeometry(2.2,.35,1.7),L.std(0x5a4a40),0,y,z);b.userData={y,z,t:85.6+(i<2?99:(6-i)*.28)};brid.push(b)}
C.every((t,dt)=>{brid.forEach(b=>{const q=t-b.userData.t;if(q>0){b.position.y=b.userData.y-q*q*4;b.rotation.x=q*.8;b.visible=q<2}else{b.position.y=b.userData.y;b.rotation.x=0;b.visible=true}})});
for(let i=0;i<L.Q(26);i++){const a=Math.random()*Math.PI*2,r=48+Math.random()*50;L.rock(Math.cos(a)*r,0,Math.sin(a)*r-4,2+Math.random()*4,0x2e2522)}
/* lava crack across the board */
const crack=L.mesh(new T.PlaneGeometry(36,1),new T.MeshBasicMaterial({map:lavaTex,transparent:true}),0,.06,1);crack.rotation.x=-Math.PI/2;crack.visible=false;
/* ---------- particles ---------- */
const fire=L.puffs(120,true),ash=L.puffs(90),steam=L.puffs(50);
const bombs=[];const nb=L.LOW?18:32;for(let i=0;i<nb;i++){const t0=29+i*(76/nb)*(i<nb*.4?1.1:.85)+R()*.6;const to=V((R()-.5)*34,0,(R()-.5)*30);bombs.push({t0,dur:2.6,to,m:L.mesh(new T.IcosahedronGeometry(.7,0),new T.MeshBasicMaterial({color:0xffab40}),0,-50,0),done:false})}
C.every((t,dt)=>{
  lavaTex.offset.x=t*.02;lavaTex.offset.y=t*.012;
  const cool=C.clamp((t-107)/7);lavaM.color.setRGB(1-cool*.8,1-cool*.85,1-cool*.85);crG.material.opacity=.8*(1-cool*.6);
  const erupt=t>40&&t<56?1:t>=56&&t<104?.45:t>=104&&t<112?1.3:.25;
  if(Math.random()<dt*28*erupt)fire.emit(VTOP.clone().add(V((Math.random()-.5)*8,2,(Math.random()-.5)*8)),V((Math.random()-.5)*6,14+Math.random()*16*erupt,(Math.random()-.5)*6),6,2.2,Math.random()<.5?0xff6d00:0xffab40,.9,1.6);
  if(Math.random()<dt*10*erupt)ash.emit(VTOP.clone().add(V((Math.random()-.5)*10,24+Math.random()*14,(Math.random()-.5)*10)),V((Math.random()-.5)*4,3,(Math.random()-.5)*4+3),20,9,0x2a2424,.75,1.4);
  bombs.forEach((b,i)=>{const q=(t-b.t0)/b.dur;if(q<0||q>1){b.m.position.y=-50;return}const p=L.vec(VTOP,b.to,q);p.y+=Math.sin(q*Math.PI)*28-q*0;b.m.position.copy(p);b.m.rotation.set(t*4,t*3,0);if(Math.random()<.8)fire.emit(p,V(0,1,0),2.2,.7,0xff7043,.8,1);
    if(q>.97)C.once('bomb'+i,()=>{C.ring(b.to.clone().setY(.2),0xff6d00,t,4,.8,.08);C.burst(b.to.clone().setY(.4),[C.GOLD,new T.Color(0xff5722)],50,7);S.thud(C.M,C.raw,.55);S.sizzle(C.M,C.raw,.8,.1);C.shake=Math.max(C.shake,.25)})});
  crack.visible=t>44;crack.scale.y=C.clamp((t-44)/2)*3.2*(1-cool*.2);
  if(t>107&&Math.random()<dt*14)steam.emit(V((Math.random()-.5)*60,-.5,-10+(Math.random()-.5)*40),V(0,3,0),5,4,0xcfcfcf,.4,2);
});
/* lightning inside the ash cloud */
const bolt=new T.LineSegments(new T.BufferGeometry(),new T.LineBasicMaterial({color:0xe0e8ff,transparent:true,opacity:0,fog:false}));C.add(bolt);
const zap=t=>{const pts=[];let p=VTOP.clone().add(V((Math.random()-.5)*20,30+Math.random()*12,(Math.random()-.5)*10));for(let i=0;i<9;i++){const q=p.clone().add(V((Math.random()-.5)*6,-3-Math.random()*3,(Math.random()-.5)*4));pts.push(p.x,p.y,p.z,q.x,q.y,q.z);p=q}bolt.geometry.setAttribute('position',new T.Float32BufferAttribute(pts,3));bolt.material.opacity=1;C.M&&(C.M.noise(C.raw+.25,1.6,{f:300,f2:60,g:.5,att:.01,rel:1.4}),C.M.noise(C.raw+.2,.15,{type:'highpass',f:2000,g:.3,att:.001,rel:.1}))};
C.every((t,dt)=>{bolt.material.opacity=Math.max(0,bolt.material.opacity-dt*5)});
[41.5,44.2,47,50.5,53,88,95,99,104.5].forEach(x=>C.at(x,zap));
C.at(40,()=>{S.explode(C.M,C.raw,1.2);C.flash(.5,900);C.shake=1;S.rumble(C.M,C.raw,16,.4)});
C.at(26,()=>S.rumble(C.M,C.raw,12,.25));C.at(44,()=>{S.sizzle(C.M,C.raw,3,.25);S.rumble(C.M,C.raw,3,.6);C.shake=.6});
/* ---------- armies ---------- */
const AR=L.armies(),K=AR.king,MK=AR.myKing,H=AR.hero;
const t2=(I.checkers||[]).find(x=>x!==I.piece)||(I.piece==='b'?'r':'b');const H2=L.actor(I.color,t2==='k'?'q':t2);
const st=L.stands(seats);AR.dead.forEach(d=>st.seatNow(L.actor(d.c,d.t,{size:1.8})));
AR.atk.forEach(a=>a.key(0,V((R()-.5)*14,0,30),{vis:false}).key(11,V((R()-.5)*14,0,30),{vis:true}));AR.def.forEach(a=>a.key(0,V((R()-.5)*14,0,-15)));
L.formation(AR.atk,9.5,1,20);L.formation(AR.def,-8.5,-1,20);AR.atk.forEach(a=>a.keys[a.keys.length-1].hop=.45);
K.key(0,V(0,0,-14.5));MK.key(0,V(0,0,32),{vis:false}).key(11,V(0,0,32),{vis:true}).key(20,V(0,0,14.5),{hop:.4});
H.key(0,V(-6,0,30),{vis:false}).key(11,V(-6,0,30),{vis:true}).key(20,V(-6,0,13),{hop:.4,glow:.4});H2.key(0,V(6,0,30),{vis:false}).key(11,V(6,0,30),{vis:true}).key(20,V(6,0,13),{hop:.4,glow:.4});
const b1=L.battle({a:AR.atk,b:AR.def,t0:26,t1:40,mid:V(0,0,0),R,favor:'a',spread:6,onFall:(A,t)=>st.take(A,t)});
/* the ground splits: everybody jumps away from the crack, then they fight on */
[...b1.a,...b1.b].forEach(a=>{const p=a.pos(43.6);const side=p.z>1?1:-1;const q=V(p.x,0,side*(3+R()*5)+1);a.key(43.6,p).key(45,q,{arc:1.8})});
const b2=L.battle({a:b1.a,b:b1.b,t0:46,t1:56,mid:V(0,0,1),R,favor:'a',spread:7,onFall:(A,t)=>st.take(A,t)});
/* ---------- the cameraman ---------- */
const cm=L.actor(I.color,'p',{size:2});const camBox=L.group(0,0,0,cm.ch.g);L.mesh(new T.BoxGeometry(.8,.62,1),L.std(0x222222),.7,1.45,.2,camBox);const lens=L.mesh(new T.CylinderGeometry(.24,.3,.5,12),L.std(0x111111),.7,1.45,.85,camBox);lens.rotation.x=Math.PI/2;
L.mesh(new T.CircleGeometry(.2,12),new T.MeshBasicMaterial({color:0x4fc3f7}),.7,1.45,1.11,camBox);const rec=C.sprite(0xff1744,.35,0);
const CM0=V(10,0,9);cm.key(0,CM0,{vis:false}).key(65.9,CM0,{vis:false}).key(66,CM0,{vis:true}).key(70,CM0).key(72,V(15,0,16),{hop:.4}).key(72.8,V(16,-.95,18),{rot:-Math.PI/2,arc:1}).key(75,V(16,-.95,18)).key(76,V(16,0,18),{rot:0}).key(78,V(16,0,18),{vis:false});
C.every(t=>{camBox.rotation.y=t>70&&t<72?Math.PI*.75:0;rec.material.opacity=t>66&&t<70&&Math.sin(t*6)>0?1:0;rec.position.copy(cm.cur).add(V(.95,1.95,.2))});
const helper=L.actor(I.color,'b');helper.key(0,V(30,0,20),{vis:false}).key(72.9,V(30,0,22),{vis:true}).key(75,V(17.8,0,18),{hop:.4}).key(76,V(17.8,0,18),{hop:.5}).key(78,V(17.8,0,18),{vis:false});
/* ---------- the chase to the island ---------- */
K.key(76,K.pos(76)).key(79.5,V(0,0,-16.5),{hop:.5}).key(85,V(0,1.8,-28.4),{hop:.4}).key(86,ISL.clone().add(V(0,0,1)),{hop:.3});
H.key(76,H.pos(76)).key(84,V(-7,0,-14.8),{hop:.55});H2.key(76,H2.pos(76)).key(84.5,V(7,0,-14.8),{hop:.55});
/* (survivors gather on the shore to watch) */
[...b2.a,...b2.b].forEach((a,i)=>{const side=i%2?1:-1;a.key(78,a.pos(78)).key(83,V(side*(10+(i>>1)*1.8),0,-12+(i%3)),{hop:.5})});
MK.key(78,MK.pos(78)).key(84,V(0,0,-9),{hop:.5});
/* charging up: sparks spiral into both attackers */
C.every(t=>{if(t<92||t>105.6)return;const k=C.clamp((t-92)/13);[H,H2].forEach((A,j)=>{const p=A.cur.clone().add(V(0,1.3,0));if(Math.random()<.4+k*.6){const d=V((Math.random()-.5)*8,(Math.random()-.5)*6,(Math.random()-.5)*8);C.spark(p.clone().add(d),d.clone().multiplyScalar(-1.1).add(V(0,2.5,0)),.9,j?C.GOLD:C.BLUE)}});C.shake=Math.max(C.shake,k*.12)});
H.key(92,V(-7,0,-14.8),{glow:.4}).key(105,V(-7,0,-14.8),{glow:1,sc:1.25});H2.key(92,V(7,0,-14.8),{glow:.4}).key(105,V(7,0,-14.8),{glow:1,sc:1.25});
CINE.strike(C,()=>H.cur.clone().add(V(0,1.6,0)),()=>ISL.clone().add(V(-6,1.3,1)),C.BLUE,105.4,.8);
CINE.strike(C,()=>H2.cur.clone().add(V(0,1.6,0)),()=>ISL.clone().add(V(-6,1.3,1)),C.GOLD,105.4,.8);
CINE.kingEnd(C,K.ch,105.9,[C.BLUE,C.GOLD,new T.Color(0xff5722)]);
C.at(105.9,()=>{S.explode(C.M,C.raw+.1,1.3);C.ring(VTOP.clone(),0xffab40,106,60,3,.4);C.shake=1.5});
C.at(92,()=>C.M&&C.M.riser(C.raw,13,.25));
/* ---------- spectators ---------- */
const fans=[];C.every(t=>{st.sit.forEach((A,i)=>{if(i%2)return;let f=fans[i];if(!f){f=fans[i]=L.mesh(new T.CircleGeometry(.35,10,0,Math.PI),new T.MeshBasicMaterial({color:[0xffeb3b,0x4fc3f7,0xf48fb1][i%3],side:T.DoubleSide}),0,0,0)}f.visible=t>=A.seat.t;f.position.copy(A.cur).add(V(.6,1.7,.3));f.quaternion.copy(C.cam.quaternion);f.rotateZ(Math.sin(t*14+i)*.6)})});
st.mood('cheer',27,30);st.mood('panic',40,45);st.mood('cheer',47,50);st.mood('laugh',72.6,75);st.mood('wave',88,94);st.mood('panic',99,104);st.mood('cheer',106,116);st.lights(108,118,0xff9e40);
/* ---------- fourth wall: lava on the lens, a ghost wipes it ---------- */
let blobs=null;C.at(57.2,()=>{blobs=L.splat('#ff6d00',6,9);S.sizzle(C.M,C.raw,3,.2);S.thud(C.M,C.raw,.4)});
C.at(61.5,()=>{const src=AR.dead[0]?PIC(AR.dead[0].c,AR.dead[0].t):PIC('w','p');const w=L.domImg(src,'left:-26vh;top:28vh;width:26vh;height:26vh;filter:brightness(1.8) sepia(1) hue-rotate(160deg) saturate(3) drop-shadow(0 0 14px #8ff);opacity:.85');
  L.anim(w,[{transform:'translateX(0) rotate(-15deg)'},{transform:'translateX(70vw) translateY(-10vh) rotate(15deg)',offset:.5},{transform:'translateX(140vw) rotate(-15deg)'}],{duration:2400,fill:'forwards',easing:'ease-in-out'});
  setTimeout(()=>{(blobs||[]).forEach(b=>L.fade(b,400))},1000);C.M&&C.M.noise(C.raw+.3,1.6,{type:'bandpass',f:1500,f2:3000,q:1,g:.12,att:.1,rel:.3})});
C.at(64.6,()=>S.laugh(C.M,C.raw));
L.roll=t=>t>72&&t<73.4?(t-72)*2.6:t>=73.4&&t<75?3.64-C.clamp(t-74)*3.64:0;
/* the last blob comes straight at us */
const last=L.mesh(new T.SphereGeometry(1,14,10),new T.MeshBasicMaterial({color:0xffab40}),0,-50,0);const lastG=C.sprite(0xff6d00,6,0);
C.at(118.9,()=>{S.thud(C.M,C.raw,.8);S.sizzle(C.M,C.raw,1,.3);L.blackout(1400,'#ff5a00')});
/* rain at the end */
const rn=L.Q(900),rg=new T.BufferGeometry(),rd=new Float32Array(rn*3);for(let i=0;i<rn;i++){rd[i*3]=(Math.random()-.5)*60;rd[i*3+1]=Math.random()*30;rd[i*3+2]=(Math.random()-.5)*60}rg.setAttribute('position',new T.BufferAttribute(rd,3));
const rain=C.add(new T.Points(rg,new T.PointsMaterial({color:0xaad4ff,size:.12,transparent:true,opacity:0})));C.every((t,dt)=>{rain.material.opacity=C.clamp((t-108)/2)*.8;if(t<108)return;for(let i=0;i<rn;i++){rd[i*3+1]-=dt*22;if(rd[i*3+1]<0)rd[i*3+1]=30}rg.attributes.position.needsUpdate=true});
/* ---------- music ---------- */
L.music({root:46.25,end:D,parts:[
  {at:0,bpm:76,prog:['i','VI','iv','V'],lvl:0},{at:12,bpm:96,prog:['i','VI','III','VII'],lvl:1,toms:1},{at:26,bpm:116,prog:['i','iv','VI','V'],lvl:2,toms:1,arp:1},
  {at:40,bpm:134,prog:['i','VI','VII','V'],lvl:3,toms:1},{at:56,bpm:60,prog:['i'],lvl:-1},{at:66,bpm:104,prog:['VI','VII','i','i'],lvl:1},
  {at:78,bpm:126,prog:['i','VI','iv','V'],lvl:2,toms:1},{at:92,bpm:92,prog:['i','i','VI','V'],lvl:1,toms:1},{at:100,bpm:132,prog:['i','VI','VII','V'],lvl:3,toms:1,arp:1},
  {at:106,bpm:78,prog:['I','IV','I','V'],lvl:0,bell:1,g:1.2},{at:116,bpm:60,prog:['I'],lvl:-1}]});
/* ---------- camera ---------- */
const cam=L.shots([
  [12,k=>{const e=C.ease(k);return[V(C.lerp(-40,8,e),C.lerp(30,8,e),C.lerp(-60,26,e)),L.vec(VTOP,V(0,1,0),e)]}],
  [7,(k,t)=>[V(C.lerp(14,4,k),3,22),V(0,1.5,8)]],
  [7,(k,t)=>[V(LEDGE.x+9,LEDGE.y+2.5,LEDGE.z+6),V(LEDGE.x,LEDGE.y+1.2,LEDGE.z)]],
  [14,(k,t)=>{const r=L.orb(V(0,1.3,0),13,4+Math.sin(t*.5),t*.25);return[L.hand(r[0],t,.1),r[1]]}],
  [6,(k,t)=>[L.hand(V(-6,7,22),t,.25),V(0,18,-60)]],
  [10,(k,t)=>{const r=L.orb(V(0,1.3,1),12,3+k*3,1+t*.2);return[L.hand(r[0],t,.18),r[1]]}],
  [10,(k,t)=>[L.hand(V(10.6,2.8,5.2),t,.08),V(0,2,-6)]],
  [4,(k,t)=>[V(10,2.6,16),V(10,2.2,9)]],
  [3,(k,t)=>{const p=cm.cur;return[L.hand(p.clone().add(V(.7,2.2,.6)),t,.25),p.clone().add(V(-4,1.5,-6))]}],
  [5,(k,t)=>[V(21,3,22),V(16.5,1,18)]],
  [8,(k,t)=>[L.hand(V(C.lerp(-4,4,k),3.5,-6),t,.12),K.cur.clone().add(V(0,1,0))]],
  [6,(k,t)=>[V(12,4,-22),V(0,1.5,-28)]],
  [13.4,(k,t)=>{const a=-1.1+k*2.2;return[V(Math.sin(a)*16,3+k*2,-14+Math.cos(a)*6),V(0,2.5,-30)]}],
  [2.6,(k,t)=>[V(0,4,-6),ISL.clone().add(V(0,1.5,0))]],
  [4,(k,t)=>[V(18,10,12),V(0,12,-60)]],
  [4,(k,t)=>[V(LEDGE.x+8,LEDGE.y+3,LEDGE.z+8),V(LEDGE.x,LEDGE.y+1,LEDGE.z)]],
  [4,(k,t)=>[V(0,5,22),L.vec(VTOP,V(0,5,22),C.clamp((t-117)/2))]],
]);
C.every(t=>{const on=t>117&&t<119.1;last.visible=on;lastG.material.opacity=on?1:0;if(!on){last.position.y=-50;return}const k=C.clamp((t-117)/2);const p=L.vec(VTOP,V(0,5,21),k*k);p.y+=Math.sin(k*Math.PI)*12;last.position.copy(p);lastG.position.copy(p);last.scale.setScalar(1+k*1.5)});
return{dur:D,cam};
};
})();
