/* ================= ШАХИ-БУРЯ: WEATHER FX (canvas) =================
   Every weather event is drawn on a full-screen canvas on top of the page: a real particle tornado,
   a hand-drawn crow with flapping wings, fractal lightning, rolling fog, a flying saucer, a meteor…
   The new position is committed to the real board (commit()) at the exact moment the pieces land,
   so nothing ever jumps afterwards.  window.STORM_FX.play(k, X, commit) -> Promise */
(function(){
'use strict';
const LOWF=(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||innerWidth<760||(navigator.hardwareConcurrency||8)<=4;
const Q=n=>Math.max(1,Math.round(n*(LOWF?.45:1)));
const TAU=Math.PI*2,rand=(a,b)=>a+Math.random()*(b-a),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,k)=>a+(b-a)*k;
const ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,easeO=k=>1-Math.pow(1-k,3),easeI=k=>k*k*k;
const seg=(t,a,b)=>clamp((t-a)/(b-a));
function loadImg(src){return new Promise(r=>{if(!src)return r(null);const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src=src})}

/* ---------- drawing helpers ---------- */
function drawPiece(x,img,cx,cy,s,{rot=0,a=1,dark=0,glow=null,sx=1}={}){if(!img)return;x.save();x.globalAlpha=a;x.translate(cx,cy);x.rotate(rot);x.scale(sx,1);if(glow){x.shadowColor=glow;x.shadowBlur=s*.35}
  if(dark&&'filter' in x)x.filter=`brightness(${1-dark})`;x.drawImage(img,-s/2,-s/2,s,s);x.restore()}
function softBlob(x,cx,cy,r,col,a){const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,col.replace('A',a));g.addColorStop(1,col.replace('A',0));x.fillStyle=g;x.fillRect(cx-r,cy-r,r*2,r*2)}
function boltPath(x0,y0,x1,y1,disp,depth,out){if(depth===0){out.push([x1,y1]);return}const mx=(x0+x1)/2+rand(-disp,disp),my=(y0+y1)/2+rand(-disp*.3,disp*.3);boltPath(x0,y0,mx,my,disp/2,depth-1,out);boltPath(mx,my,x1,y1,disp/2,depth-1,out)}
function makeBolt(x0,y0,x1,y1){const main=[[x0,y0]];boltPath(x0,y0,x1,y1,Math.abs(y1-y0)*.25,7,main);const br=[];for(let i=0;i<3;i++){const j=4+Math.floor(Math.random()*(main.length*.6));const p=main[j];if(!p)continue;const b=[[p[0],p[1]]];boltPath(p[0],p[1],p[0]+rand(-120,120),p[1]+rand(60,180),40,5,b);br.push(b)}return{main,br}}
function strokePath(x,pts,w,col,blur,bc){x.save();x.lineJoin='round';x.lineCap='round';x.strokeStyle=col;x.lineWidth=w;if(blur){x.shadowBlur=blur;x.shadowColor=bc||col}x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();x.restore()}
/* a crow drawn from curves: body, head, beak, tail fan, two feathered wings that flap */
function drawCrow(x,cx,cy,s,ph,dir=1,tilt=0,carrying=false){
  x.save();x.translate(cx,cy);x.scale(dir,1);x.rotate(tilt);
  const flap=Math.sin(ph);const blk='#0d0f14',blue='#1f2a44';
  const wing=(far)=>{x.save();x.translate(s*.05,-s*.14);const sc=far?.85:1;x.scale(sc,sc);
    /* wing points backwards (-x) from the shoulder; positive rotation lifts it */
    x.rotate((far?.15:0)+.25+flap*1.05);
    const g=x.createLinearGradient(0,0,-s*1.1,0);g.addColorStop(0,far?'#0b0d12':'#1c2740');g.addColorStop(1,far?'#050608':blk);x.fillStyle=g;
    for(let i=0;i<6;i++){x.save();x.translate(-s*(.62+i*.035),s*(-.05+i*.035));x.rotate((i-2.5)*.13+.08);x.beginPath();x.ellipse(-s*.16,0,s*.3,s*.055,0,0,TAU);x.fill();x.restore()}
    for(let i=0;i<5;i++){x.save();x.translate(-s*(.22+i*.08),s*.08);x.rotate(.35);x.beginPath();x.ellipse(0,0,s*.17,s*.055,0,0,TAU);x.fill();x.restore()}
    x.beginPath();x.ellipse(-s*.32,0,s*.36,s*.12,0,0,TAU);x.fill();
    x.strokeStyle=far?'rgba(80,100,150,.15)':'rgba(120,150,220,.3)';x.lineWidth=s*.012;x.beginPath();x.moveTo(-s*.05,-s*.03);x.quadraticCurveTo(-s*.35,-s*.09,-s*.62,-s*.03);x.stroke();
    x.restore()};
  wing(true);
  /* tail */
  x.fillStyle=blk;x.beginPath();x.moveTo(-s*.45,s*.02);x.lineTo(-s*.95,-s*.05);x.lineTo(-s*.98,s*.12);x.lineTo(-s*.9,s*.2);x.lineTo(-s*.45,s*.14);x.fill();
  /* body */
  const bg=x.createLinearGradient(0,-s*.3,0,s*.3);bg.addColorStop(0,'#2b3a5c');bg.addColorStop(.35,blk);bg.addColorStop(1,'#05060a');x.fillStyle=bg;
  x.beginPath();x.ellipse(0,0,s*.55,s*.26,-.08,0,TAU);x.fill();
  /* head + beak + eye */
  x.beginPath();x.arc(s*.52,-s*.16,s*.2,0,TAU);x.fill();
  x.fillStyle='#2a2a2a';x.beginPath();x.moveTo(s*.66,-s*.22);x.quadraticCurveTo(s*.98,-s*.2,s*1.02,-s*.1);x.lineTo(s*.67,-s*.08);x.fill();
  x.strokeStyle='#555';x.lineWidth=s*.015;x.beginPath();x.moveTo(s*.68,-s*.14);x.lineTo(s*.95,-s*.13);x.stroke();
  x.fillStyle='#e8e0c8';x.beginPath();x.arc(s*.56,-s*.21,s*.045,0,TAU);x.fill();x.fillStyle='#000';x.beginPath();x.arc(s*.57,-s*.21,s*.025,0,TAU);x.fill();
  x.fillStyle='rgba(120,150,220,.35)';x.beginPath();x.ellipse(s*.05,-s*.14,s*.3,s*.05,-.1,0,TAU);x.fill();
  /* legs */
  x.strokeStyle='#1a1a1a';x.lineWidth=s*.04;const ly=carrying?s*.42:s*.3;x.beginPath();x.moveTo(-s*.05,s*.18);x.lineTo(-s*.08,ly);x.moveTo(s*.1,s*.18);x.lineTo(s*.12,ly);x.stroke();
  wing(false);x.restore()}
function drawSaucer(x,cx,cy,s,t){x.save();x.translate(cx,cy);
  const g=x.createRadialGradient(0,s*.05,s*.1,0,0,s);g.addColorStop(0,'#9fffe0');g.addColorStop(1,'rgba(0,255,170,0)');x.fillStyle=g;x.fillRect(-s,-s,s*2,s*2);
  const dome=x.createLinearGradient(0,-s*.5,0,0);dome.addColorStop(0,'rgba(200,255,255,.95)');dome.addColorStop(1,'rgba(60,180,220,.6)');x.fillStyle=dome;x.beginPath();x.ellipse(0,-s*.12,s*.32,s*.3,0,Math.PI,0);x.fill();
  const body=x.createLinearGradient(0,-s*.15,0,s*.18);body.addColorStop(0,'#eef3f7');body.addColorStop(.45,'#9aa6b2');body.addColorStop(1,'#46505c');x.fillStyle=body;x.beginPath();x.ellipse(0,0,s*.75,s*.18,0,0,TAU);x.fill();
  x.fillStyle='#2f3842';x.beginPath();x.ellipse(0,s*.12,s*.35,s*.08,0,0,TAU);x.fill();
  for(let i=0;i<7;i++){const a=i/7*TAU+t*3;const lx=Math.cos(a)*s*.62,ly=Math.sin(a)*s*.08;if(Math.sin(a)<-.2)continue;x.fillStyle=['#ff5252','#ffd740','#69f0ae','#40c4ff'][i%4];x.shadowColor=x.fillStyle;x.shadowBlur=10;x.beginPath();x.arc(lx,ly+s*.02,s*.045,0,TAU);x.fill()}
  x.restore()}

/* ---------- the player ---------- */
async function play(k,X,commit){
  const B=document.getElementById('board');if(!B){commit();return}
  const res=X.res||{ch:[]},H=X.H;
  const cv=document.createElement('canvas');cv.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:950;pointer-events:none';document.body.appendChild(cv);
  const dpr=Math.min(devicePixelRatio||1,LOWF?1:2);const x=cv.getContext('2d');
  const fit=()=>{cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;x.setTransform(dpr,0,0,dpr,0,0)};fit();addEventListener('resize',fit);
  const br=()=>B.getBoundingClientRect();
  const sqEl=sq=>{for(let i=0;i<64;i++)if(X.board.idxToSq(i)===sq)return X.board.sqs[i];return null};
  const C=sq=>{const r=sqEl(sq).getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};
  const S=()=>br().width/8;
  /* hide the real pieces that this event touches; clones are drawn instead until commit() */
  const hidden=[];const hide=sq=>{const e=sqEl(sq);if(!e)return;const im=e.querySelector('img.pc');if(im){im.style.visibility='hidden';hidden.push(im)}e.querySelectorAll('.wxCrown').forEach(c=>{c.style.visibility='hidden';hidden.push(c)})};
  let committed=false;const doCommit=()=>{if(committed)return;committed=true;try{commit()}catch(e){console.warn(e)}};
  const imgs={};for(const c of res.ch){const p=c.p;if(p){const key=p.color+p.type;if(!imgs[key])imgs[key]=await loadImg(PIC(p.color,p.type))}}
  const im=p=>p?imgs[p.color+p.type]:null;
  /* particles */
  const P=[];const add=o=>{if(P.length<(LOWF?900:2200))P.push(Object.assign({x:0,y:0,vx:0,vy:0,g:0,drag:0,life:0,max:1,size:3,col:'#fff',rot:0,vr:0,kind:'dot',add:false},o))};
  const stepP=dt=>{for(let i=P.length-1;i>=0;i--){const p=P[i];p.life+=dt;if(p.life>=p.max){P.splice(i,1);continue}p.vy+=p.g*dt;const d=Math.pow(1-p.drag,dt*60);p.vx*=d;p.vy*=d;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt}};
  const drawP=(filter)=>{for(const p of P){if(filter&&!filter(p))continue;const k=p.life/p.max,a=(p.a??1)*(k<.1?k/.1:1-Math.max(0,k-.6)/.4);x.save();x.globalAlpha=a;if(p.add)x.globalCompositeOperation='lighter';x.translate(p.x,p.y);x.rotate(p.rot);x.fillStyle=p.col;
      if(p.kind==='dot'){x.beginPath();x.arc(0,0,p.size,0,TAU);x.fill()}
      else if(p.kind==='soft'){const r=p.size*(1+k*(p.grow||1));const gr=x.createRadialGradient(0,0,0,0,0,r);gr.addColorStop(0,p.col);gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(-r,-r,r*2,r*2)}
      else if(p.kind==='leaf'){x.beginPath();x.ellipse(0,0,p.size,p.size*.45,0,0,TAU);x.fill();x.strokeStyle='rgba(0,0,0,.3)';x.lineWidth=1;x.beginPath();x.moveTo(-p.size,0);x.lineTo(p.size,0);x.stroke()}
      else if(p.kind==='rock'){x.beginPath();x.moveTo(-p.size,-p.size*.4);x.lineTo(-p.size*.2,-p.size);x.lineTo(p.size,-p.size*.3);x.lineTo(p.size*.6,p.size*.8);x.lineTo(-p.size*.7,p.size*.6);x.closePath();x.fill()}
      else if(p.kind==='flake'){x.strokeStyle=p.col;x.lineWidth=Math.max(1,p.size*.18);for(let j=0;j<3;j++){x.rotate(Math.PI/3);x.beginPath();x.moveTo(-p.size,0);x.lineTo(p.size,0);x.stroke()}}
      else if(p.kind==='streak'){x.strokeStyle=p.col;x.lineWidth=p.size;x.beginPath();x.moveTo(0,0);x.lineTo(-p.vx*.03,-p.vy*.03);x.stroke()}
      x.restore()}};
  const shakeB=(amp,ms)=>{try{B.animate([0,1,2,3,4,5,6,7].map(i=>({transform:i===7?'none':`translate(${rand(-amp,amp)}px,${rand(-amp,amp)}px) rotate(${rand(-amp,amp)*.08}deg)`})),{duration:ms,easing:'linear'})}catch(e){}};
  const once=(()=>{const s=new Set();return(id,f)=>{if(!s.has(id)){s.add(id);f()}}})();
  /* ---------- per-event scripts: {dur, frame(t,dt)} ---------- */
  let E=null;const sz0=S(),b0=br();
  const moves=res.ch.filter(c=>c.t==='move'),kills=res.ch.filter(c=>c.t==='kill'),adds=res.ch.filter(c=>c.t==='add');
  /* a piece flying along an arc from a to b between t0 and t1, with a spin */
  const arcPiece=(img,a,b,t,t0,t1,h,spin=0,s=S())=>{const k=clamp((t-t0)/(t1-t0));const e=ease(k);drawPiece(x,img,lerp(a.x,b.x,e),lerp(a.y,b.y,e)-Math.sin(k*Math.PI)*h,s,{rot:spin*k})};

  if(k==='tornado'){
    H.SFX.wind&&H.SFX.wind(5);H.noise(5,{type:'bandpass',f:300,f2:900,q:.6,g:.25,att:1.2});
    const D=5.2,X0=b0.left-sz0*3,X1=b0.right+sz0*3,H0=Math.min(innerHeight*1.05,sz0*8.5);
    const cxAt=t=>lerp(X0,X1,ease(seg(t,.4,4.6)));const baseY=()=>br().top+br().height*.86;
    const N=Q(900);const pts=[];for(let i=0;i<N;i++)pts.push({h:Math.pow(Math.random(),.8),a:Math.random()*TAU,w:rand(2.5,5),s:rand(1.6,4.2),c:Math.random()<.15?'#5d4a3a':'#8d8478'});
    const deb=[];for(let i=0;i<Q(40);i++)deb.push({h:Math.random(),a:Math.random()*TAU,w:rand(2,3.5),s:rand(3,7),kind:Math.random()<.6?'leaf':'rock',col:['#6b8e23','#8d6e63','#a1887f','#558b2f'][i%4]});
    const R=h=>sz0*(.32+2.3*Math.pow(h,1.35));
    /* when does the funnel pass each piece? */
    const passT=px=>{for(let t=.4;t<4.6;t+=.02)if(cxAt(t)>=px-sz0*.3)return t;return 4.4};
    const fly=[...moves.map(c=>({c,from:C(c.from),to:C(c.to),img:im(c.p),kill:false})),...kills.map(c=>({c,from:C(c.sq),to:null,img:im(c.p),kill:true}))];
    fly.forEach(f=>{hide(f.kill?f.c.sq:f.c.from);f.t0=passT(f.from.x);f.t1=f.t0+1.2});
    const commitT=Math.min(D-.3,Math.max(...fly.map(f=>f.t1),1)+.05);
    E={dur:D,frame(t,dt){
      const cx=cxAt(t),by=baseY(),sway=h=>Math.sin(t*1.7+h*3)*sz0*.6*h;const env=clamp(t/.6)*clamp((D-t)/.6);
      /* darker sky */
      x.fillStyle=`rgba(20,24,30,${.42*env})`;x.fillRect(0,0,innerWidth,innerHeight);
      /* body of the funnel */
      {const n=28,L=[],Rr=[];for(let i=0;i<=n;i++){const h=i/n,r=R(h),yy=by-h*H0;L.push([cx+sway(h)-r,yy]);Rr.push([cx+sway(h)+r,yy])}
        const gb=x.createLinearGradient(cx-R(1),0,cx+R(1),0);gb.addColorStop(0,'rgba(70,64,58,0)');gb.addColorStop(.18,'rgba(95,88,80,.55)');gb.addColorStop(.5,'rgba(60,55,50,.8)');gb.addColorStop(.82,'rgba(110,102,92,.55)');gb.addColorStop(1,'rgba(70,64,58,0)');
        x.save();x.globalAlpha=env;x.fillStyle=gb;x.beginPath();L.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));for(let i=Rr.length-1;i>=0;i--)x.lineTo(Rr[i][0],Rr[i][1]);x.closePath();x.fill();
        /* rotating wind bands on the front of the funnel */
        x.lineWidth=Math.max(1.5,sz0*.05);for(let i=0;i<22;i++){const h=((i/22)+t*.18)%1;const r=R(h),yy=by-h*H0;x.strokeStyle=`rgba(${i%2?'170,160,148':'45,40,36'},${.45*(1-h*.5)})`;const a0=(t*6+i*1.7)%TAU;x.beginPath();x.ellipse(cx+sway(h),yy,r*.98,r*.24,0,a0*.15,a0*.15+Math.PI*.9);x.stroke()}
        /* dark cloud wall at the top */
        for(let i=0;i<8;i++)softBlob(x,cx+sway(1)+(i-3.5)*R(1)*.45,by-H0+Math.sin(t+i)*8,R(1)*.7,'rgba(45,45,50,A)',.55);x.restore()}
      /* back half of the dust, then pieces, then the front half */
      const drawPts=front=>{for(const p of pts){p.a+=dt*p.w*(1.4-p.h*.6);const s=Math.sin(p.a);if((s>0)!==front)continue;const r=R(p.h)*(.85+.15*Math.sin(p.a*3));
          x.globalAlpha=env*(front?.85:.4)*(.4+.6*(1-p.h));x.fillStyle=p.c;x.beginPath();x.arc(cx+sway(p.h)+Math.cos(p.a)*r,by-p.h*H0+s*r*.24,p.s*(front?1.2:.8),0,TAU);x.fill()}
        for(const d of deb){d.a+=dt*d.w*.5;const s=Math.sin(d.a);if((s>0)!==front)continue;const r=R(d.h)*1.15;x.globalAlpha=env;x.save();x.translate(cx+sway(d.h)+Math.cos(d.a)*r,by-d.h*H0+s*r*.24);x.rotate(d.a*3);x.fillStyle=d.col;
          if(d.kind==='leaf'){x.beginPath();x.ellipse(0,0,d.s,d.s*.45,0,0,TAU);x.fill()}else x.fillRect(-d.s/2,-d.s/2,d.s,d.s*.6);x.restore()}x.globalAlpha=1};
      drawPts(false);
      for(const f of fly){if(t<f.t0){drawPiece(x,f.img,f.from.x,f.from.y,S(),{rot:Math.sin(t*20)*clamp(1-(f.t0-t)/.6)*.15});continue}
        const k=clamp((t-f.t0)/(f.t1-f.t0));const up=Math.sin(k*Math.PI);const a=t*9;
        if(f.kill){drawPiece(x,f.img,f.from.x+Math.cos(a)*S()*k*2+k*S()*4,f.from.y-k*k*S()*9,S()*(1-k*.4),{rot:a,a:1-k*.6});continue}
        if(k>=1){if(!committed)drawPiece(x,f.img,f.to.x,f.to.y,S());continue}
        drawPiece(x,f.img,lerp(f.from.x,f.to.x,ease(k))+Math.cos(a)*S()*.6*up,lerp(f.from.y,f.to.y,ease(k))-up*S()*1.6,S()*(1+up*.25),{rot:a*.7*up})}
      drawPts(true);
      if(Math.random()<dt*50*env)add({kind:'soft',x:cx+rand(-sz0,sz0),y:by+rand(-5,10),vx:rand(-60,60),vy:rand(-40,-10),size:sz0*.5,grow:2,max:1.3,col:'rgba(150,135,115,.45)',drag:.03});
      if(Math.random()<dt*20*env)add({kind:'leaf',x:cx,y:by-rand(0,H0*.6),vx:rand(-300,300),vy:rand(-200,50),g:200,size:rand(3,6),max:2,rot:rand(0,6),vr:rand(-8,8),col:'#7cb342'});
      stepP(dt);drawP();
      if(t>=commitT)doCommit();
      if(Math.abs(cx-(br().left+br().width/2))<sz0*.5)once('sh',()=>shakeB(sz0*.12,1200))}}}

  else if(k==='lightning'){
    H.SFX.rain&&H.SFX.rain(4.5);H.noise(4.6,{type:'highpass',f:2500,g:.08,att:.5});
    const D=4.8;const hits=kills.map((c,i)=>({c,p:C(c.sq),img:im(c.p),t:1.1+i*1.15,bolt:null}));hits.forEach(h=>hide(h.c.sq));
    const drops=[];for(let i=0;i<Q(220);i++)drops.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,v:rand(900,1400)});
    let flash=0;
    E={dur:D,frame(t,dt){const env=clamp(t/.5)*clamp((D-t)/.6);
      x.fillStyle=`rgba(8,10,25,${.55*env})`;x.fillRect(0,0,innerWidth,innerHeight);
      x.strokeStyle=`rgba(170,190,230,${.35*env})`;x.lineWidth=1.2;x.beginPath();for(const d of drops){d.y+=d.v*dt;d.x-=d.v*dt*.15;if(d.y>innerHeight){d.y=-20;d.x=Math.random()*innerWidth*1.2}x.moveTo(d.x,d.y);x.lineTo(d.x+3,d.y-18)}x.stroke();
      for(const h of hits){const dt2=t-h.t;
        if(dt2<0){drawPiece(x,h.img,h.p.x,h.p.y,S());continue}
        if(!h.bolt){h.bolt=makeBolt(h.p.x+rand(-200,200),-20,h.p.x,h.p.y);flash=1;H.SFX.thunder&&H.SFX.thunder();shakeB(S()*.08,400);
          for(let i=0;i<Q(60);i++){const a=rand(0,TAU),v=rand(100,500);add({x:h.p.x,y:h.p.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-200,g:900,size:rand(1.2,3),max:rand(.4,.9),col:i%2?'#fff59d':'#ffffff',add:true})}}
        if(dt2<.45&&(dt2<.12||(dt2>.2&&dt2<.32))){const w=S()*.06;h.bolt.br.forEach(b=>strokePath(x,b,w*.5,'rgba(220,235,255,.8)',18,'#9ecbff'));strokePath(x,h.bolt.main,w*2.4,'rgba(160,200,255,.35)',40,'#9ecbff');strokePath(x,h.bolt.main,w,'#ffffff',22,'#cfe6ff')}
        /* scorch + the piece turns to ash */
        x.save();x.globalAlpha=clamp(dt2*3)*env*.8;softBlob(x,h.p.x,h.p.y+S()*.2,S()*.6,'rgba(20,12,5,A)',1);x.restore();
        const burn=clamp(dt2/.6);if(burn<1)drawPiece(x,h.img,h.p.x,h.p.y,S(),{dark:.85*burn,a:1});
        else once('ash'+h.c.sq,()=>{for(let i=0;i<Q(70);i++)add({kind:i%4?'dot':'soft',x:h.p.x+rand(-S()*.3,S()*.3),y:h.p.y+rand(-S()*.4,S()*.3),vx:rand(-40,40),vy:rand(-120,-20),drag:.02,size:i%4?rand(1,2.5):S()*.25,grow:2,max:rand(.8,1.8),col:i%4?(i%3?'#3a3a3a':'#ff7043'):'rgba(90,90,90,.5)',add:i%4&&i%3===0})});
        if(dt2>.6&&dt2<2.2&&Math.random()<dt*20)add({kind:'soft',x:h.p.x+rand(-8,8),y:h.p.y,vx:rand(-10,10),vy:-50,size:S()*.25,grow:3,max:1.6,col:'rgba(80,80,80,.35)'})}
      stepP(dt);drawP();
      if(flash>0){x.fillStyle=`rgba(235,242,255,${flash*.75})`;x.fillRect(0,0,innerWidth,innerHeight);flash=Math.max(0,flash-dt*4)}
      if(hits.length&&t>hits[hits.length-1].t+.75)doCommit();if(!hits.length&&t>1)doCommit()}}}

  else if(k==='crow'){
    const c=moves[0];const D=5;H.SFX.caw&&H.SFX.caw();
    const from=c?C(c.from):{x:b0.left+b0.width/2,y:b0.top+b0.height/2},to=c?C(c.to):from;const img=c?im(c.p):null;if(c)hide(c.from);
    const s=sz0*1.55;const P0={x:-s*2,y:b0.top+b0.height*.35},P3={x:innerWidth+s*2,y:Math.max(s,b0.top+b0.height*.15)};
    const bez=(a,b,c2,d,k)=>{const u=1-k;return{x:u*u*u*a.x+3*u*u*k*b.x+3*u*k*k*c2.x+k*k*k*d.x,y:u*u*u*a.y+3*u*u*k*b.y+3*u*k*k*c2.y+k*k*k*d.y}};
    const grab=1.7,lift=2.25,drop=3.45,land=3.7;let fx=null;
    E={dur:D,frame(t,dt){let pos,dir=1,tilt=0,carry=false,ph=t*14;
      if(t<grab){const k=easeO(t/grab);pos=bez(P0,{x:from.x-s*3,y:P0.y},{x:from.x-s*2,y:from.y-s*1.2},{x:from.x,y:from.y-s*.75},k);tilt=.25*(1-k)}
      else if(t<lift){pos={x:from.x,y:from.y-s*.75+Math.sin((t-grab)*9)*s*.04};ph=t*22;if(t>grab+.05)once('caw',()=>H.SFX.caw&&H.SFX.caw())}
      else if(t<drop){const k=ease((t-lift)/(drop-lift));pos={x:lerp(from.x,to.x,k),y:lerp(from.y,to.y,k)-s*.75-Math.sin(k*Math.PI)*s*1.8};carry=true;dir=to.x>=from.x?1:-1;tilt=-.15*Math.sin(k*Math.PI)}
      else{const k=easeI(clamp((t-drop)/(D-drop-.1)));pos=bez({x:to.x,y:to.y-s*.75},{x:to.x+s*2,y:to.y-s*2},{x:P3.x-s*4,y:P3.y+s},P3,k);tilt=-.3*k;ph=t*16}
      pos.y=Math.max(pos.y,s*.75);
      /* shadow on the board */
      x.save();x.globalAlpha=.25;x.fillStyle='#000';x.beginPath();x.ellipse(pos.x+s*.3,Math.max(pos.y+s*1.3,b0.top),s*.5,s*.15,0,0,TAU);x.fill();x.restore();
      /* the pawn */
      if(img){if(t<lift)drawPiece(x,img,from.x,from.y,S(),{rot:t>grab?Math.sin(t*30)*.08:0});
        else if(t<drop)drawPiece(x,img,pos.x,pos.y+s*.78,S()*.92,{rot:Math.sin(t*6)*.25});
        else if(t<land){const k=(t-drop)/(land-drop);drawPiece(x,img,to.x,lerp(to.y-s*.1,to.y,k*k),S())}
        else{if(!committed){doCommit();for(let i=0;i<Q(14);i++)add({kind:'soft',x:to.x+rand(-10,10),y:to.y+S()*.35,vx:rand(-60,60),vy:rand(-30,0),size:S()*.15,grow:2,max:.7,col:'rgba(160,140,110,.5)'})}}}
      else if(t>land)doCommit();
      drawCrow(x,pos.x,pos.y,s,ph,dir,tilt,carry);
      if(t>drop&&!fx)fx={x:pos.x,y:pos.y,t};if(fx){const k=t-fx.t;x.save();x.translate(fx.x+Math.sin(k*3)*20,fx.y+k*45);x.rotate(Math.sin(k*3)*.6);x.fillStyle='#111';x.beginPath();x.ellipse(0,0,s*.2,s*.05,0,0,TAU);x.fill();x.restore()}
      stepP(dt);drawP()}}}

  else if(k==='fog'){
    const D=4.6;H.noise(4.5,{type:'bandpass',f:300,f2:600,q:.5,g:.15,att:1.5});
    const blobs=[];for(let i=0;i<Q(70);i++)blobs.push({x:b0.left+rand(-.3,1.3)*b0.width,y:b0.top+rand(-.1,1.1)*b0.height,r:sz0*rand(1.2,2.8),v:rand(-30,30),ph:rand(0,TAU)});
    E={dur:D,frame(t,dt){doCommit();const env=clamp(t/1.4)*clamp((D-t)/1.4);for(const b of blobs){b.x+=b.v*dt;const yy=b.y+Math.sin(t*.8+b.ph)*sz0*.2;x.globalAlpha=1;softBlob(x,b.x,yy,b.r,'rgba(222,228,235,A)',.55*env)}}}}

  else if(k==='quake'){
    const D=4.4;H.SFX.rumble&&H.SFX.rumble(4);H.noise(4,{f:90,g:.5,att:.4});
    const y0=res.rank!=null?C(String.fromCharCode(97)+(res.rank+1)).y:b0.top+b0.height/2;
    const crack=[];for(let i=0;i<=24;i++)crack.push([b0.left-10+i*(b0.width+20)/24,y0+rand(-sz0*.12,sz0*.12)]);
    const hop=moves.map(c=>({c,a:C(c.from),b:C(c.to),img:im(c.p)}));hop.forEach(h=>hide(h.c.from));
    E={dur:D,frame(t,dt){const env=clamp((D-t)/.6);
      if(t<2.8&&Math.random()<dt*6)shakeB(sz0*.1*(1-t/3),160);
      const open=easeO(seg(t,.5,1.4));
      if(open>0){const n=Math.round(open*crack.length);const pts=crack.slice(0,Math.max(2,n));
        x.globalAlpha=env;strokePath(x,pts,sz0*.18*open,'rgba(255,120,20,.55)',20,'#ff6d00');strokePath(x,pts,sz0*.09*open,'#1b120c',0);x.globalAlpha=1;
        if(Math.random()<dt*30*env){const p=pts[Math.floor(Math.random()*pts.length)];add({kind:'rock',x:p[0],y:p[1],vx:rand(-120,120),vy:rand(-320,-120),g:900,size:rand(2,5),max:1,rot:rand(0,6),vr:rand(-10,10),col:['#5d4037','#795548','#3e2723'][Math.floor(Math.random()*3)]})}}
      for(const h of hop){const t0=1.6,t1=2.4;if(t<t0)drawPiece(x,h.img,h.a.x+Math.sin(t*40)*2,h.a.y,S());else if(t<t1)arcPiece(h.img,h.a,h.b,t,t0,t1,S()*.6,0);else if(!committed)drawPiece(x,h.img,h.b.x,h.b.y,S())}
      if(t>2.45)doCommit();
      if(t>1.6&&t<2.5&&Math.random()<dt*25)add({kind:'soft',x:rand(b0.left,b0.right),y:y0,vx:rand(-30,30),vy:rand(-50,-10),size:sz0*.4,grow:2,max:1.4,col:'rgba(140,115,85,.45)'});
      stepP(dt);drawP()}}}

  else if(k==='frost'){
    const D=4.4;H.SFX.freeze&&H.SFX.freeze();H.noise(4,{type:'highpass',f:5000,g:.06,att:1});
    const fr=(res.freeze||[]).map(sq=>({sq,p:C(sq)}));
    const branches=[];const grow=(x0,y0,a,len,d)=>{if(d<=0||len<6)return;const x1=x0+Math.cos(a)*len,y1=y0+Math.sin(a)*len;branches.push({x0,y0,x1,y1,d,o:Math.random()*.4});for(let i=0;i<2;i++)grow(lerp(x0,x1,rand(.4,.9)),lerp(y0,y1,rand(.4,.9)),a+rand(-.9,.9),len*rand(.45,.7),d-1)};
    [[b0.left,b0.top,.8],[b0.right,b0.top,2.35],[b0.left,b0.bottom,-.8],[b0.right,b0.bottom,-2.35]].forEach(([a,b,ang])=>{for(let i=0;i<3;i++)grow(a,b,ang+rand(-.4,.4),sz0*rand(1.4,2.2),LOWF?4:5)});
    E={dur:D,frame(t,dt){const env=clamp((D-t)/.7);
      const vg=x.createRadialGradient(innerWidth/2,innerHeight/2,Math.min(innerWidth,innerHeight)*.3,innerWidth/2,innerHeight/2,Math.max(innerWidth,innerHeight)*.75);vg.addColorStop(0,'rgba(200,235,255,0)');vg.addColorStop(1,`rgba(210,240,255,${.55*env*clamp(t/.8)})`);x.fillStyle=vg;x.fillRect(0,0,innerWidth,innerHeight);
      const gk=easeO(seg(t,.2,2));x.save();x.globalAlpha=env;x.strokeStyle='rgba(235,250,255,.9)';x.shadowColor='#bfefff';x.shadowBlur=6;
      for(const b of branches){const k=clamp((gk-b.o)/.6);if(k<=0)continue;x.lineWidth=b.d*.55;x.beginPath();x.moveTo(b.x0,b.y0);x.lineTo(lerp(b.x0,b.x1,k),lerp(b.y0,b.y1,k));x.stroke()}x.restore();
      if(Math.random()<dt*40*env)add({kind:'flake',x:rand(0,innerWidth),y:-10,vx:rand(-20,20),vy:rand(40,90),size:rand(2,5),max:5,rot:rand(0,6),vr:rand(-1,1),col:'rgba(255,255,255,.9)'});
      for(const f of fr){const k=easeO(seg(t,1.3,2.1));if(k<=0)continue;const s=S()*.92*k;x.save();x.globalAlpha=env;x.translate(f.p.x,f.p.y);
        const g=x.createLinearGradient(-s/2,-s/2,s/2,s/2);g.addColorStop(0,'rgba(230,250,255,.75)');g.addColorStop(1,'rgba(110,185,235,.45)');x.fillStyle=g;x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=2;
        x.beginPath();x.moveTo(-s*.5,-s*.3);x.lineTo(-s*.25,-s*.5);x.lineTo(s*.35,-s*.48);x.lineTo(s*.5,-s*.1);x.lineTo(s*.4,s*.48);x.lineTo(-s*.3,s*.5);x.lineTo(-s*.5,s*.15);x.closePath();x.fill();x.stroke();
        x.strokeStyle='rgba(255,255,255,.7)';x.beginPath();x.moveTo(-s*.3,-s*.35);x.lineTo(s*.1,s*.2);x.moveTo(s*.2,-s*.4);x.lineTo(s*.35,-s*.1);x.stroke();x.restore();
        if(Math.random()<dt*6)add({kind:'dot',x:f.p.x+rand(-S()*.4,S()*.4),y:f.p.y+rand(-S()*.4,S()*.4),size:2,max:.5,col:'#fff',add:true})}
      if(t>2.1)doCommit();stepP(dt);drawP()}}}

  else if(k==='ufo'||k==='ufoBack'){
    const D=5;H.SFX.ufo&&H.SFX.ufo();H.tone(300,4.5,{type:'sine',f2:420,g:.04});
    const back=k==='ufoBack';const c=back?adds[0]:kills[0];const sq=c?c.sq:'e5';const p0=C(sq);const img=c?im(c.p):null;if(c&&!back)hide(sq);
    const s=sz0*1.7;const hov={x:p0.x,y:Math.max(p0.y-sz0*2.6,s*.45)};
    E={dur:D,frame(t,dt){let pos;
      if(t<1.3){const k=easeO(t/1.3);pos={x:lerp(innerWidth+s,hov.x,k),y:lerp(-s,hov.y,k)+Math.sin(k*Math.PI)*sz0}}
      else if(t<3.4)pos={x:hov.x+Math.sin(t*2)*4,y:hov.y+Math.sin(t*3)*4};
      else{const k=easeI(seg(t,3.4,4.1));pos={x:lerp(hov.x,-s*2,k),y:lerp(hov.y,-s*2,k)};if(k>0&&k<1)for(let i=0;i<3;i++)add({kind:'dot',x:pos.x,y:pos.y,vx:0,vy:0,size:rand(2,4),max:.4,col:'#b9f6ca',add:true})}
      const beam=clamp(seg(t,1.4,1.7))*clamp((3.3-t)/.3);
      if(beam>0){x.save();x.globalAlpha=beam*.7;const g=x.createLinearGradient(0,pos.y,0,p0.y+sz0*.5);g.addColorStop(0,'rgba(140,255,200,.75)');g.addColorStop(1,'rgba(140,255,200,.15)');x.fillStyle=g;x.globalCompositeOperation='lighter';
        x.beginPath();x.moveTo(pos.x-s*.2,pos.y+s*.1);x.lineTo(pos.x+s*.2,pos.y+s*.1);x.lineTo(p0.x+sz0*.7,p0.y+sz0*.5);x.lineTo(p0.x-sz0*.7,p0.y+sz0*.5);x.closePath();x.fill();
        for(let i=0;i<4;i++){const k=((t*1.2+i/4)%1);const yy=lerp(p0.y+sz0*.4,pos.y+s*.1,k);const w=lerp(sz0*.7,s*.2,k);x.strokeStyle='rgba(200,255,230,.8)';x.lineWidth=2;x.beginPath();x.ellipse(lerp(p0.x,pos.x,k),yy,w,w*.2,0,0,TAU);x.stroke()}x.restore()}
      if(img){const k=back?easeO(seg(t,1.8,3.0)):easeI(seg(t,1.8,3.0));
        if(!back){if(k<1)drawPiece(x,img,lerp(p0.x,pos.x,k),lerp(p0.y,pos.y+s*.1,k),S()*(1-k*.7),{rot:k*12,a:1-k*.3,glow:'#69f0ae'});else doCommit()}
        else{if(t>1.8&&k<1)drawPiece(x,img,lerp(pos.x,p0.x,k),lerp(pos.y+s*.1,p0.y,k),S()*(.3+k*.7),{rot:(1-k)*10,glow:'#69f0ae'});if(k>=1)doCommit()}}
      else if(t>3)doCommit();
      drawSaucer(x,pos.x,pos.y,s,t);stepP(dt);drawP()}}}

  else if(k==='rainbow'){
    const D=4.6;H.SFX.chime&&H.SFX.chime();[523,659,784,1047,1319].forEach((f,i)=>H.tone(f,.6,{type:'triangle',g:.05,delay:.5+i*.18}));
    const hop=moves.map(c=>({c,a:C(c.from),b:C(c.to),img:im(c.p)}));hop.forEach(h=>hide(h.c.from));
    const cx=b0.left+b0.width/2,cy=b0.bottom+sz0*.5,R=b0.width*.78;const cols=['#ff3b30','#ff9500','#ffcc00','#34c759','#30b0ff','#5856d6','#af52de'];
    E={dur:D,frame(t,dt){const env=clamp((D-t)/.8);
      /* sun rays */
      x.save();x.globalAlpha=.25*env*clamp(t/.8);x.translate(b0.left,b0.top-sz0);for(let i=0;i<10;i++){x.rotate(TAU/10+Math.sin(t*.3)*.002);const g=x.createLinearGradient(0,0,innerWidth,0);g.addColorStop(0,'rgba(255,245,200,.9)');g.addColorStop(1,'rgba(255,245,200,0)');x.fillStyle=g;x.beginPath();x.moveTo(0,0);x.lineTo(innerWidth,-40);x.lineTo(innerWidth,40);x.fill()}x.restore();
      const sweep=easeO(seg(t,.3,1.8));x.save();x.globalAlpha=.6*env;x.lineCap='round';
      cols.forEach((c,i)=>{x.strokeStyle=c;x.lineWidth=sz0*.17;x.beginPath();x.arc(cx,cy,R-i*sz0*.17,Math.PI,Math.PI+Math.PI*sweep);x.stroke()});x.restore();
      if(Math.random()<dt*30*env){const a=Math.PI+Math.random()*Math.PI*sweep;add({kind:'dot',x:cx+Math.cos(a)*R,y:cy+Math.sin(a)*R,vy:30,size:rand(1.5,3),max:1,col:'#fffde7',add:true})}
      for(const h of hop){const t0=2,t1=2.7;if(t<t0)drawPiece(x,h.img,h.a.x,h.a.y,S(),{glow:t>1.5?'#ffd54f':null});else if(t<t1)arcPiece(h.img,h.a,h.b,t,t0,t1,S()*.55,0);else if(!committed)drawPiece(x,h.img,h.b.x,h.b.y,S())}
      if(t>2.75)doCommit();stepP(dt);drawP()}}}

  else if(k==='watcher'){
    const D=4.6;const mv=moves[0];const a=mv?C(mv.from):null,b=mv?C(mv.to):null;if(mv)hide(mv.from);
    E={dur:D,frame(t,dt){let dark=0;
      if(t<1){dark=[.0,.8,.1,.9,.2,.95][Math.floor(t*6)]||0;once('f1',()=>H.SFX.flick&&H.SFX.flick())}
      else if(t<3.3)dark=.97;else if(t<3.8){dark=[.97,.3,.9,.1,0][Math.floor((t-3.3)*10)]||0;once('f2',()=>H.SFX.flick&&H.SFX.flick())}
      if(mv&&t<1.9)drawPiece(x,im(mv.p),a.x,a.y,S());
      if(t>1.9)doCommit();
      x.fillStyle=`rgba(0,0,0,${dark})`;x.fillRect(0,0,innerWidth,innerHeight);
      if(t>1.2&&t<3.3){const k=seg(t,1.2,3.1);const ex=lerp(innerWidth*.2,b0.left+b0.width/2,k),ey=lerp(innerHeight*.3,b0.top+b0.height*.45,k),s=lerp(14,sz0*.45,k);const blink=Math.sin(t*3)>.95?.1:1;
        for(const dx of[-1,1]){x.save();x.shadowColor='#ff1744';x.shadowBlur=20;x.fillStyle='#fff6e0';x.beginPath();x.ellipse(ex+dx*s*1.3,ey,s,s*.6*blink,0,0,TAU);x.fill();x.fillStyle='#b71c1c';x.beginPath();x.arc(ex+dx*s*1.3+s*.15,ey,s*.35*blink,0,TAU);x.fill();x.restore()}
        once('br',()=>H.noise(1.8,{type:'bandpass',f:300,q:1,g:.2,att:.8}))}}}}

  else if(k==='meteor'){
    const D=5;H.noise(1.9,{type:'bandpass',f:300,f2:2000,g:.4,att:1.5});
    const blk=(res.block||['d4','e4','d5','e5']).map(C);const tgt={x:blk.reduce((a,b)=>a+b.x,0)/blk.length,y:blk.reduce((a,b)=>a+b.y,0)/blk.length};
    const dead=kills.map(c=>({c,p:C(c.sq),img:im(c.p),a:rand(0,TAU),v:rand(3,6),spin:rand(-12,12)}));dead.forEach(d=>hide(d.c.sq));
    const start={x:innerWidth+sz0*3,y:-sz0*4};const T=1.9;
    E={dur:D,frame(t,dt){const env=clamp((D-t)/.8);
      x.fillStyle=`rgba(120,20,0,${.35*clamp(t/1.2)*env})`;x.fillRect(0,0,innerWidth,innerHeight);
      if(t<T){const k=easeI(t/T);const p={x:lerp(start.x,tgt.x,k),y:lerp(start.y,tgt.y,k)};const r=sz0*(.25+k*.55);
        for(let i=0;i<4;i++)add({kind:'soft',x:p.x+rand(-r*.3,r*.3),y:p.y+rand(-r*.3,r*.3),vx:rand(-30,30)+(start.x-tgt.x)*.15,vy:(start.y-tgt.y)*.15,size:r*.9,grow:1.2,max:.55,col:i%2?'rgba(255,140,0,.8)':'rgba(255,230,120,.8)',add:true});
        x.save();x.shadowColor='#ffab40';x.shadowBlur=40;const g=x.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,'#fff');g.addColorStop(.4,'#ffd54f');g.addColorStop(1,'rgba(255,87,34,0)');x.fillStyle=g;x.beginPath();x.arc(p.x,p.y,r,0,TAU);x.fill();x.restore();
        for(const d of dead)drawPiece(x,d.img,d.p.x,d.p.y,S())}
      else{once('boom',()=>{H.SFX.boom&&H.SFX.boom();shakeB(sz0*.25,700);for(let i=0;i<Q(90);i++){const a=rand(0,TAU),v=rand(150,700);add({kind:i%3?'rock':'dot',x:tgt.x,y:tgt.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-250,g:900,size:i%3?rand(3,8):rand(2,4),max:rand(.8,1.6),rot:rand(0,6),vr:rand(-10,10),col:i%3?['#4e342e','#6d4c41','#3e2723'][i%3]:'#ffab40',add:!(i%3)})}
          for(let i=0;i<Q(30);i++)add({kind:'soft',x:tgt.x+rand(-sz0,sz0),y:tgt.y+rand(-sz0,sz0),vx:rand(-80,80),vy:rand(-120,-20),size:sz0*.6,grow:2.5,max:2.2,col:'rgba(90,70,60,.5)'})});
        const k=t-T;x.save();x.globalAlpha=clamp(1-k/.5);x.fillStyle='#fff8e1';x.fillRect(0,0,innerWidth,innerHeight);x.restore();
        for(let i=0;i<2;i++){const kk=clamp((k-i*.15)/.9);if(kk>0&&kk<1){x.strokeStyle=`rgba(255,220,150,${1-kk})`;x.lineWidth=sz0*.15*(1-kk);x.beginPath();x.ellipse(tgt.x,tgt.y,sz0*4*kk,sz0*3*kk,0,0,TAU);x.stroke()}}
        x.save();x.globalAlpha=env*.85;softBlob(x,tgt.x,tgt.y,sz0*1.3,'rgba(30,15,5,A)',1);softBlob(x,tgt.x,tgt.y,sz0*.6,'rgba(255,90,0,A)',.6*clamp(1-k/2));x.restore();
        for(const d of dead){const kk=clamp(k/1);drawPiece(x,d.img,d.p.x+Math.cos(d.a)*kk*S()*d.v,d.p.y+Math.sin(d.a)*kk*S()*d.v-Math.sin(kk*Math.PI)*S()*2,S()*(1-kk*.5),{rot:d.spin*kk,a:1-kk})}
        if(k>.4)doCommit()}
      stepP(dt);drawP()}}}
  /* anything else: pieces slide to their new places */
  if(!E){const D=1.4;const mv2=moves.map(c=>({c,a:C(c.from),b:C(c.to),img:im(c.p)}));mv2.forEach(h=>hide(h.c.from));
    E={dur:D,frame(t,dt){for(const h of mv2)arcPiece(h.img,h.a,h.b,t,.2,.9,S()*.4,0);if(t>.95)doCommit()}}}
  /* run (a hidden tab gets no animation frames, so fall back to a timer there) */
  const next=cb=>document.hidden?setTimeout(()=>cb(performance.now()),40):requestAnimationFrame(cb);
  await new Promise(res2=>{let t0=null,last=0;const f=now=>{if(t0===null){t0=now;last=now}const sp=(X.speed||1)*(window.FX_SPEED||1);const t=(now-t0)/1000*sp+(window.FX_SEEK||0),dt=Math.min(.05,(now-last)/1000)*sp;last=now;
      x.clearRect(0,0,innerWidth,innerHeight);try{E.frame(t,dt)}catch(e){console.warn('fx',e);doCommit();return res2()}
      if(t>=E.dur){doCommit();return res2()}next(f)};next(f)});
  removeEventListener('resize',fit);cv.remove();hidden.forEach(e=>e.style.visibility='');doCommit();
}
window.STORM_FX={play};
})();
