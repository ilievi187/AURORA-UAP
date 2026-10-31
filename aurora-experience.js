/* AURORA / THE SIGNAL — original native WebGL SDF sculpture.
 * No third-party assets, autoplay audio, tracking or copied reference shaders.
 * DOM content and an atmospheric CSS fallback survive absent WebGL. */
"use strict";
(()=>{
 const root=document.getElementById("odyssey");
 const canvas=document.getElementById("auroraSceneCanvas");
 if(!root||!canvas)return;
 const intro=root.querySelector(".odyssey-intro");
 const chapter=root.querySelector(".odyssey-chapter");
 const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
 const vertexSource="\nattribute vec2 aPosition;\nvoid main(){gl_Position=vec4(aPosition,0.0,1.0);}\n";
const fragmentSource="\n#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\nuniform vec2 uResolution;\nuniform float uTime;\nuniform float uProgress;\nuniform vec2 uPointer;\nmat2 turn(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}\nfloat h21(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}\nfloat facets(vec3 p){return sin(p.x*10.6)*sin(p.y*11.1)*sin(p.z*10.3);}\nvec2 distanceField(vec3 p){\n  float ridge=sin(p.x*1.65)*cos(p.z*1.45)*.115+sin(p.x*3.7+p.z*1.2)*.028+sin(p.z*5.2)*.015;\n  float ground=p.y+1.52-ridge;\n  vec3 core=p;\n  core.xz=turn(uTime*.025+uProgress*.22)*core.xz;\n  core.yz=turn(uProgress*.31)*core.yz;\n  float sphere=length(core)-(.86+.05*facets(core));\n  vec3 orbit=p;\n  orbit.xz=turn(uTime*.06+uProgress*.72)*orbit.xz;\n  orbit.yz=turn(.44+.13*sin(uTime*.11))*orbit.yz;\n  float torus=length(vec2(length(orbit.xz)-1.26,orbit.y))-.088;\n  float lower=length(vec2(length(orbit.xz)-1.40,orbit.y))-.017;\n  vec2 hit=vec2(ground,3.0);\n  if(sphere<hit.x)hit=vec2(sphere,1.0);\n  if(torus<hit.x)hit=vec2(torus,2.0);\n  if(lower<hit.x)hit=vec2(lower,4.0);\n  return hit;\n}\nvec3 surfaceNormal(vec3 p){\n  vec2 e=vec2(.002,0.0);\n  return normalize(vec3(\n    distanceField(p+e.xyy).x-distanceField(p-e.xyy).x,\n    distanceField(p+e.yxy).x-distanceField(p-e.yxy).x,\n    distanceField(p+e.yyx).x-distanceField(p-e.yyx).x\n  ));\n}\nvoid main(){\n  vec2 uv=(gl_FragCoord.xy-.5*uResolution)/max(1.0,uResolution.y);\n  float scroll=clamp(uProgress,0.0,1.0);\n  vec3 ro=vec3(-.13+.12*uPointer.x,.26+.1*uPointer.y,4.95-.87*scroll);\n  vec3 target=vec3(-.73+1.63*scroll,.02+.10*uPointer.y,0.0);\n  vec3 forward=normalize(target-ro);\n  vec3 right=normalize(cross(forward,vec3(0.0,1.0,0.0)));\n  vec3 up=cross(right,forward);\n  vec3 rd=normalize(uv.x*right+uv.y*up+1.44*forward);\n  vec3 color=mix(vec3(.045,.066,.098),vec3(.20,.24,.30),smoothstep(-.64,.88,uv.y));\n  float haze=smoothstep(-.78,.48,uv.y);\n  color+=vec3(.095,.117,.14)*pow(1.0-haze,2.0);\n  vec2 starCell=floor((uv+vec2(uPointer.x*.01,uTime*.0006))*vec2(144.0,113.0));\n  float sparkle=step(.993,h21(starCell))*pow(h21(starCell+17.0),4.0)*.58;\n  color+=vec3(.72,.83,.91)*sparkle*smoothstep(-.6,.45,uv.y);\n  float t=0.0,mat=0.0;\n  vec3 p=ro;\n  for(int i=0;i<74;i++){\n    p=ro+rd*t;\n    vec2 surface=distanceField(p);\n    if(surface.x<.0025){mat=surface.y;break;}\n    t+=max(.013,surface.x*.79);\n    if(t>19.0)break;\n  }\n  if(mat>.5){\n    vec3 n=surfaceNormal(p);\n    vec3 light=normalize(vec3(-.54,.83,.65));\n    float diffuse=max(dot(n,light),0.0);\n    float rim=pow(1.0-max(dot(n,-rd),0.0),2.7);\n    float occlusion=.60+.40*max(0.0,n.y);\n    vec3 base=vec3(.17,.22,.30);\n    if(mat<1.5){\n      float facet=.5+.5*facets(p*1.35);\n      base=mix(vec3(.13,.17,.23),vec3(.36,.43,.51),facet);\n      float fissure=pow(max(0.0,sin(p.x*10.6+p.y*7.3)*sin(p.z*8.7)),20.0);\n      base+=vec3(.26,.47,.58)*fissure;\n      base+=vec3(.35,.61,.74)*rim*.65;\n    }else if(mat<2.5){\n      base=vec3(.49,.65,.76)+vec3(.17,.22,.25)*sin(p.x*9.0+p.z*4.0);\n      base+=vec3(.40,.57,.66)*rim;\n    }else if(mat<3.5){\n      float rock=.5+.5*sin(p.x*5.4)*sin(p.z*6.3);\n      base=mix(vec3(.15,.18,.23),vec3(.37,.41,.47),rock);\n      base*=.72+.28*max(n.y,0.0);\n    }else{base=vec3(.72,.80,.87)+vec3(.28,.34,.38)*rim;}\n    float highlights=pow(max(dot(reflect(-light,n),-rd),0.0),34.0);\n    vec3 shaded=base*(.35+1.04*diffuse)*occlusion+\n      highlights*vec3(.48,.71,.82)*(mat<3.0?1.0:.16);\n    shaded+=rim*vec3(.13,.22,.29)*(mat<3.0?1.0:.13);\n    float fog=1.0-exp(-.018*t*t);\n    color=mix(shaded,vec3(.25,.31,.38),fog*.72);\n  }\n  color*=1.0-.35*smoothstep(.35,1.46,length(uv*vec2(1.15,1.0)));\n  color+=(h21(gl_FragCoord.xy+uTime*17.0)-.5)*.017;\n  color=pow(max(color,vec3(0.0)),vec3(.86));\n  gl_FragColor=vec4(color,1.0);\n}";

 let gl=null,program=null,buffer=null,uniforms=null,raf=0;
 let inView=true,active=true,progress=0,shownChapter=0;
 let renderWidth=0,renderHeight=0,lastFrame=-1000;
 const pointer={x:0,y:0};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function setChapter(next){
   if(next===shownChapter)return;
   shownChapter=next;root.dataset.chapter=String(next);
   intro.setAttribute("aria-hidden",String(next===1));
   intro.inert=next===1;
   chapter.setAttribute("aria-hidden",String(next===0));
   chapter.inert=next===0;
 }
 function measureScroll(){
   if(reduce.matches){progress=0;root.style.setProperty("--odyssey-progress","0");setChapter(0);return;}
   const rect=root.getBoundingClientRect();
   const travel=Math.max(1,rect.height-window.innerHeight);
   progress=clamp(-rect.top/travel,0,1);
   root.style.setProperty("--odyssey-progress",progress.toFixed(3));
   setChapter(progress>.49?1:0);
 }
 function onPointer(e){
   if(reduce.matches)return;
   const rect=root.getBoundingClientRect();
   if(e.clientY<rect.top||e.clientY>rect.bottom)return;
   pointer.x=clamp((e.clientX/window.innerWidth-.5)*2,-1,1);
   pointer.y=clamp((.5-e.clientY/window.innerHeight)*2,-1,1);
 }
 function compile(type,source){
   const shader=gl.createShader(type);
   if(!shader)return null;
   gl.shaderSource(shader,source);gl.compileShader(shader);
   if(gl.getShaderParameter(shader,gl.COMPILE_STATUS))return shader;
   gl.deleteShader(shader);return null;
 }
 function prepare(){
   try{gl=canvas.getContext("webgl",{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:"low-power"});}
   catch(_){gl=null;}
   if(!gl)return false;
   const vertex=compile(gl.VERTEX_SHADER,vertexSource);
   const fragment=compile(gl.FRAGMENT_SHADER,fragmentSource);
   if(!vertex||!fragment)return false;
   program=gl.createProgram();
   gl.attachShader(program,vertex);gl.attachShader(program,fragment);
   gl.linkProgram(program);
   gl.deleteShader(vertex);gl.deleteShader(fragment);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))return false;
   buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
   gl.useProgram(program);
   const position=gl.getAttribLocation(program,"aPosition");
   gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
   uniforms={
     resolution:gl.getUniformLocation(program,"uResolution"),
     time:gl.getUniformLocation(program,"uTime"),
     progress:gl.getUniformLocation(program,"uProgress"),
     pointer:gl.getUniformLocation(program,"uPointer")
   };
   return true;
 }
 function size(){
   const box=canvas.getBoundingClientRect();
   const scale=(window.innerWidth<680?.65:.82)*Math.min(window.devicePixelRatio||1,1.25);
   const w=Math.max(1,Math.round(box.width*scale));
   const h=Math.max(1,Math.round(box.height*scale));
   if(w!==renderWidth||h!==renderHeight){
     renderWidth=canvas.width=w;renderHeight=canvas.height=h;
     gl.viewport(0,0,w,h);
   }
 }
 function draw(ms){
   if(!gl||!program||document.hidden||!inView)return;
   if(ms-lastFrame<33&&!reduce.matches)return;
   lastFrame=ms;size();gl.useProgram(program);
   gl.uniform2f(uniforms.resolution,renderWidth,renderHeight);
   gl.uniform1f(uniforms.time,reduce.matches?0:ms*.001);
   gl.uniform1f(uniforms.progress,progress);
   gl.uniform2f(uniforms.pointer,pointer.x,pointer.y);
   gl.drawArrays(gl.TRIANGLES,0,6);
 }
 function tick(ms){
   raf=0;if(!active||!inView||document.hidden)return;
   draw(ms);if(!reduce.matches)raf=requestAnimationFrame(tick);
 }
 function schedule(){
   if(!active||!inView||document.hidden||raf)return;
   raf=requestAnimationFrame(tick);
 }
 function onMotion(){
   measureScroll();
   if(reduce.matches){
     if(raf)cancelAnimationFrame(raf);raf=0;draw(0);
   }else schedule();
 }
 function onScroll(){measureScroll();if(reduce.matches)draw(0);}
 canvas.addEventListener("webglcontextlost",e=>{
   e.preventDefault();active=false;
   if(raf)cancelAnimationFrame(raf);raf=0;
   root.dataset.renderer="fallback";
 });
 canvas.addEventListener("webglcontextrestored",()=>{
   active=prepare();if(active){root.dataset.renderer="webgl";schedule();}
 });
 window.addEventListener("scroll",onScroll,{passive:true});
 window.addEventListener("resize",()=>{measureScroll();if(reduce.matches)draw(0);else schedule();},{passive:true});
 root.addEventListener("pointermove",onPointer,{passive:true});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)schedule();});
 if(typeof reduce.addEventListener==="function")reduce.addEventListener("change",onMotion);
 if("IntersectionObserver" in window){
   const observer=new IntersectionObserver(entries=>{
     inView=entries.some(entry=>entry.isIntersecting);
     if(inView)schedule();
     else if(raf){cancelAnimationFrame(raf);raf=0;}
   },{rootMargin:"140px"});
   observer.observe(root);
 }
 measureScroll();active=prepare();
 if(active){root.dataset.renderer="webgl";schedule();}
 else root.dataset.renderer="fallback";
})();
