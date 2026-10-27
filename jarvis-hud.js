/* AURORA interactive radar/HUD compositor — original procedural graphics.
   Uses 2D Canvas only, 30 FPS max, respects reduced motion and tab visibility. */
"use strict";
(()=>{
  const gate=document.getElementById("languageGate");
  const hero=document.querySelector(".hero");
  const prefersReduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  const configs=[
    {canvas:document.getElementById("gateCanvas"),kind:"gate",active:()=>!gate.hidden},
    {canvas:document.getElementById("heroHudCanvas"),kind:"hero",active:()=>heroVisible}
  ];
  let heroVisible=true;
  const shapes=[];
  for(const cfg of configs){
    if(!cfg.canvas)continue;
    let ctx;
    try{ctx=cfg.canvas.getContext("2d",{alpha:true})}catch(_){}
    if(!ctx)continue;
    const dots=Array.from({length:cfg.kind==="gate"?46:65},(_,i)=>({
      x:(i*0.61803398875+.124)%1,
      y:(i*0.41421356237+.336)%1,
      r:(i%7===0?1.5:.7),
      phase:i*.63
    }));
    shapes.push({...cfg,ctx,dots,w:0,h:0,dpr:1});
  }
  if(!shapes.length)return;
  function resize(){
    for(const s of shapes){
      const r=s.canvas.getBoundingClientRect();
      const w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));
      if(!w||!h)continue;
      const dpr=Math.min(1.75,window.devicePixelRatio||1);
      if(w===s.w&&h===s.h&&dpr===s.dpr)continue;
      s.w=w;s.h=h;s.dpr=dpr;
      s.canvas.width=Math.round(w*dpr);s.canvas.height=Math.round(h*dpr);
      s.ctx.setTransform(dpr,0,0,dpr,0,0);
    }
  }
  function strokeArc(c,r,start,end,color,width=1){
    c.beginPath();c.arc(0,0,r,start,end);c.lineWidth=width;c.strokeStyle=color;c.stroke();
  }
  function paint(s,time){
    const c=s.ctx,w=s.w,h=s.h;
    if(!w||!h)return;
    c.clearRect(0,0,w,h);
    const active=s.active(),t=prefersReduced.matches?0:time*.001;
    if(!active&&!prefersReduced.matches)return;
    const cx=w*(s.kind==="gate"?.5:.737),cy=h*(s.kind==="gate"?.475:.43);
    const radius=Math.max(70,Math.min(s.kind==="gate"?345:335,w*(s.kind==="gate"?.34:.26),h*.40));
    // A fine calibrated HUD grid, not an illustration or simulated real detection.
    c.save();c.lineWidth=.6;c.strokeStyle="rgba(109,222,227,.095)";
    const grid= Math.max(48,Math.min(88,w/19));
    for(let x=(w%grid)/2;x<w;x+=grid){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke()}
    for(let y=(h%grid)/2;y<h;y+=grid){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}
    c.restore();

    // Background star-like signal nodes and drifting pulse envelopes.
    for(const [i,p] of s.dots.entries()){
      const drift=prefersReduced.matches?0:Math.sin(t*.12+p.phase)*4;
      const x=p.x*w+drift,y=p.y*h;
      const proximity=Math.hypot(x-cx,y-cy);
      const alpha=(proximity<radius*1.25?.48:.25)+(prefersReduced.matches?0:(Math.sin(t*1.3+p.phase)+1)*.15);
      c.beginPath();c.arc(x,y,p.r,0,Math.PI*2);c.fillStyle="rgba(133,241,246,"+alpha.toFixed(3)+")";c.fill();
      if(i%11===0){
        c.strokeStyle="rgba(120,220,230,.26)";c.lineWidth=.7;c.beginPath();
        c.moveTo(x-7,y);c.lineTo(x+7,y);c.moveTo(x,y-7);c.lineTo(x,y+7);c.stroke();
      }
    }
    c.save();c.translate(cx,cy);
    // Quiet area / concentric target rings
    c.beginPath();c.arc(0,0,radius,0,Math.PI*2);
    const radial=c.createRadialGradient(0,0,radius*.17,0,0,radius);
    radial.addColorStop(0,"rgba(35,195,207,0)");
    radial.addColorStop(.72,"rgba(35,195,207,.025)");
    radial.addColorStop(1,"rgba(66,225,225,.055)");
    c.fillStyle=radial;c.fill();
    const rings=[.28,.52,.75,1,1.12];
    rings.forEach((scale,i)=>{
      c.setLineDash(i%2?[2,8]:[]);
      strokeArc(c,radius*scale,0,Math.PI*2,
        i===3?"rgba(150,250,250,.30)":"rgba(105,227,231,"+(i===0?".23":".13")+")",i===3?1.4:.75);
    });
    c.setLineDash([]);
    // Ticks and compass bearings: HUD motion is clear at first glance.
    for(let i=0;i<120;i++){
      const a=i*Math.PI/60-(Math.PI/2);
      const major=i%10===0;
      const r1=radius*(major?1.016:1.045),r2=radius*(major?1.091:1.064);
      c.strokeStyle=major?"rgba(171,255,255,.70)":"rgba(132,225,225,.28)";
      c.lineWidth=major?1.5:.6;
      c.beginPath();c.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);
      c.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);c.stroke();
    }
    c.setLineDash([5,16]);strokeArc(c,radius*.86,.1+t*.19,Math.PI*1.75+t*.19,"rgba(124,255,246,.37)",1.1);c.setLineDash([]);
    strokeArc(c,radius*.62, -1.9+t*.26, .48+t*.26,"rgba(128,249,249,.68)",2);
    strokeArc(c,radius*.95, 1.1-t*.11, 3.1-t*.11,"rgba(135,234,247,.43)",1.4);
    strokeArc(c,radius*.35, -t*.19, 1.7-t*.19,"rgba(170,255,244,.63)",1.4);
    // Rotating sweep in the style of an instrument display.
    c.save();c.rotate(t*.26);
    const beam=c.createRadialGradient(0,0,0,0,0,radius);
    beam.addColorStop(0,"rgba(65,244,230,.07)");
    beam.addColorStop(.65,"rgba(35,232,232,.10)");
    beam.addColorStop(1,"rgba(65,244,230,0)");
    c.beginPath();c.moveTo(0,0);c.arc(0,0,radius,-.46,.04);c.closePath();
    c.fillStyle=beam;c.fill();
    c.strokeStyle="rgba(119,253,255,.56)";c.lineWidth=1;
    c.beginPath();c.moveTo(0,0);c.lineTo(radius,0);c.stroke();
    c.restore();
    // Center crosshair, tracking geometry.
    c.strokeStyle="rgba(145,252,251,.54)";c.lineWidth=.8;
    c.beginPath();c.moveTo(-radius*.18,0);c.lineTo(radius*.18,0);
    c.moveTo(0,-radius*.18);c.lineTo(0,radius*.18);c.stroke();
    c.fillStyle="rgba(170,254,250,.65)";c.beginPath();c.arc(0,0,2.5,0,Math.PI*2);c.fill();
    const a=t*.33+1.3;
    const pointX=radius*.72*Math.cos(a),pointY=radius*.72*Math.sin(a);
    c.beginPath();c.arc(pointX,pointY,3.5,0,Math.PI*2);
    c.fillStyle="rgba(169,255,255,.94)";c.shadowBlur=18;c.shadowColor="#83faff";c.fill();c.shadowBlur=0;
    c.strokeStyle="rgba(148,255,255,.44)";c.beginPath();c.arc(pointX,pointY,8+4*Math.sin(t*2),0,Math.PI*2);c.stroke();
    // Non-deceptive diagnostic glyphs.
    c.font="10px Consolas,monospace";
    c.textAlign="left";c.fillStyle="rgba(154,243,238,.65)";
    c.fillText("AURORA // HUD", -radius*.89,-radius*.76);
    c.fillText("VISUALIZATION / NOT A LIVE RADAR", -radius*.89,radius*.89);
    c.restore();

    // Corner registration marks anchored to the canvas frame.
    const margin= s.kind==="gate"?28:42;
    c.lineWidth=1;c.strokeStyle="rgba(135,249,253,.40)";
    for(const [x,y,sx,sy] of [[margin,margin,1,1],[w-margin,margin,-1,1],[margin,h-margin,1,-1],[w-margin,h-margin,-1,-1]]){
      c.beginPath();c.moveTo(x+sx*22,y);c.lineTo(x,y);c.lineTo(x,y+sy*22);c.stroke();
    }
  }
  let raf=0,lastFrame=0,heroVisible=true;
  const shouldRun=()=>!prefersReduced.matches&&!document.hidden&&(shapes.some(s=>s.active()));
  function frame(time){
    raf=0;
    if(!shouldRun())return;
    if(time-lastFrame>=32){
      lastFrame=time;
      for(const s of shapes){if(s.active())paint(s,time)}
    }
    raf=requestAnimationFrame(frame);
  }
  function schedule(){
    if(raf){cancelAnimationFrame(raf);raf=0}
    resize();
    for(const s of shapes)if(s.active())paint(s,performance.now());
    if(shouldRun())raf=requestAnimationFrame(frame);
  }
  if("IntersectionObserver" in window&&hero){
    const obs=new IntersectionObserver(entries=>{
      heroVisible=entries[0]?.isIntersecting??true;schedule();
    },{threshold:0});obs.observe(hero);
  }
  const gateChange=()=>schedule();
  window.addEventListener("aurora:gate-open",gateChange);
  window.addEventListener("aurora:gate-closed",gateChange);
  document.addEventListener("visibilitychange",schedule);
  window.addEventListener("resize",schedule,{passive:true});
  prefersReduced.addEventListener?.("change",schedule);
  if("ResizeObserver" in window){
    const resizeObserver=new ResizeObserver(()=>schedule());
    shapes.forEach(s=>resizeObserver.observe(s.canvas));
  }
  // Pointer-driven instrument parallax and interactive card tilt.
  if(!prefersReduced.matches && window.matchMedia("(pointer:fine)").matches){
    let pointerFrame=0,px=0,py=0;
    hero?.addEventListener("pointermove",event=>{
      const r=hero.getBoundingClientRect();
      px=(event.clientX-r.left)/r.width-.5;
      py=(event.clientY-r.top)/r.height-.5;
      if(pointerFrame)return;
      pointerFrame=requestAnimationFrame(()=>{
        pointerFrame=0;
        hero.style.setProperty("--hud-px",(px*18).toFixed(2)+"px");
        hero.style.setProperty("--hud-py",(py*18).toFixed(2)+"px");
      });
    },{passive:true});
    hero?.addEventListener("pointerleave",()=>{
      hero.style.setProperty("--hud-px","0px");
      hero.style.setProperty("--hud-py","0px");
    },{passive:true});
    document.querySelectorAll(".feature-card").forEach(card=>{
      card.addEventListener("pointermove",event=>{
        const r=card.getBoundingClientRect();
        const x=(event.clientX-r.left)/r.width-.5;
        const y=(event.clientY-r.top)/r.height-.5;
        card.style.setProperty("--tilt-x",(-y*5).toFixed(2)+"deg");
        card.style.setProperty("--tilt-y",(x*5).toFixed(2)+"deg");
      },{passive:true});
      card.addEventListener("pointerleave",()=>{
        card.style.setProperty("--tilt-x","0deg");
        card.style.setProperty("--tilt-y","0deg");
      });
    });
  }
  document.documentElement.classList.add("hud-ready");
  schedule();
})();
