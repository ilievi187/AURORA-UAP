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
const fragmentSource="\n#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\nuniform vec2 uResolution;\nuniform float uTime;\nuniform float uProgress;\nuniform vec2 uPointer;\nuniform sampler2D uEarth;\nuniform float uHasEarth;\nconst float PI=3.14159265;\nfloat hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat noise(vec2 p){\n vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);\n return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),\n            mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);\n}\nfloat fbm(vec2 p){float a=.5,v=0.;for(int j=0;j<4;j++){v+=a*noise(p);p=p*2.02+12.3;a*=.5;}return v;}\nfloat hitSphere(vec3 ro,vec3 rd,vec3 c,float r){\n vec3 q=ro-c;float b=dot(q,rd),h=b*b-dot(q,q)+r*r;\n if(h<0.)return -1.;float t=-b-sqrt(h);return t>.001?t:-1.;\n}\nmat2 rotate(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}\nvec2 globeUV(vec3 n){return vec2(fract(.5+atan(n.z,n.x)/(2.*PI)),clamp(.5+asin(n.y)/PI,.001,.999));}\nvec3 earthColor(vec3 n,vec3 rd,float t){\n vec3 sun=normalize(vec3(-.75,.44,1.26));\n vec3 spinning=n;spinning.xz=rotate(.13+uTime*.018+uProgress*1.1)*spinning.xz;\n vec2 uv=globeUV(spinning);\n vec3 tex=texture2D(uEarth,uv).rgb;\n float land=smoothstep(.26,.39,tex.g-tex.b*.35);\n float surfaceDetail=fbm(uv*vec2(520.,260.));\n vec3 ocean=mix(vec3(.015,.09,.20),vec3(.09,.24,.36),surfaceDetail);\n vec3 ground=mix(vec3(.17,.27,.20),vec3(.46,.42,.30),surfaceDetail);\n ground=mix(ground,vec3(.78,.80,.76),smoothstep(.68,.91,abs(n.y))*.79);\n vec3 surface=mix(ocean,ground,land*uHasEarth);\n float sunLit=max(dot(n,sun),0.);\n vec3 night=vec3(.006,.017,.040);\n float city=land*pow(hash(floor(uv*vec2(1580.,790.))),19.)*.16;\n night+=vec3(1.,.60,.22)*city;\n float daylight=smoothstep(-.12,.32,dot(n,sun));\n vec3 color=mix(night,surface*(.26+.91*sunLit),daylight);\n float cloudN=fbm(uv*vec2(280.,145.)+vec2(uTime*.004,-uTime*.001));\n float clouds=smoothstep(.56,.77,cloudN)*.74;\n float cloudSun=.20+.80*sunLit;\n color=mix(color,vec3(.86,.91,.96)*cloudSun,clouds*daylight);\n float spec=pow(max(dot(reflect(-sun,n),-rd),0.),80.)*(1.-land);\n color+=vec3(.34,.52,.72)*spec*daylight;\n float rim=pow(1.-max(dot(n,-rd),0.),5.);\n color+=vec3(.22,.52,.85)*rim*(.40+.52*daylight);\n return color;\n}\nvec3 rocky(vec3 n,vec3 base,float spin){\n float craters=fbm(n.xy*vec2(26.,34.)+n.z*11.+spin);\n float crack=pow(noise(n.xy*110.+spin*3.),6.);\n return base*(.58+.46*craters)+vec3(.06,.055,.045)*crack;\n}\nvec3 starfield(vec2 screen,vec3 rd){\n vec3 bg=mix(vec3(.0014,.003,.012),vec3(.013,.024,.060),pow(max(rd.y+.42,0.),2.));\n bg+=vec3(.028,.035,.059)*pow(noise(rd.xy*11.+rd.z*4.),3.)*.6;\n vec2 cell=floor(screen*vec2(940.,525.));\n float star=hash(cell);\n float pulse=.8+.2*sin(uTime*1.2+hash(cell+19.)*30.);\n float sparks=step(.9952,star)*pow(hash(cell+5.),3.)*pulse;\n bg+=vec3(.80,.88,1.)*sparks*.95;\n // Secondary near-field dust is deliberately subtle.\n vec2 speck=floor(screen*vec2(320.,180.)+vec2(uTime*.013,0.));\n bg+=vec3(.23,.33,.5)*step(.996,hash(speck))*.22;\n return bg;\n}\nvoid main(){\n vec2 xy=(gl_FragCoord.xy-.5*uResolution)/max(1.,uResolution.y);\n vec2 screen=gl_FragCoord.xy/max(uResolution,vec2(1.));\n float story=clamp(uProgress,0.,1.);\n float portrait=step(uResolution.x/uResolution.y,.72);\n vec3 ro=vec3(sin(story*1.25)*1.75+.18*uPointer.x,.15+story*.56+.12*uPointer.y,5.0+story*3.0+portrait*2.2);\n vec3 target=vec3(0.,0.,0.);\n vec3 forward=normalize(target-ro), right=normalize(cross(forward,vec3(0.,1.,0.)));\n vec3 up=cross(right,forward);\n vec3 rd=normalize(xy.x*right+xy.y*up+1.56*forward);\n vec3 sky=starfield(screen,rd);\n vec3 earth=vec3(0.,0.,0.);\n float radius=1.24;\n // Earth's atmosphere: additive blue-white optical fringe in empty space.\n float along=dot(earth-ro,rd);\n float lateral=length(earth-(ro+rd*max(along,0.)));\n float atmosphere=exp(-max(lateral-radius,0.)*8.0)*step(0.,along);\n atmosphere*=smoothstep(radius-.18,radius+.02,lateral);\n sky+=vec3(.075,.24,.54)*atmosphere*.7;\n float tEarth=hitSphere(ro,rd,earth,radius);\n float tMoon=hitSphere(ro,rd,vec3(-2.45,.72,-1.30),.39);\n float tMars=hitSphere(ro,rd,vec3(2.70,.95,-2.5),.44);\n float tSat=hitSphere(ro,rd,vec3(3.25,-.74,-3.3),.50);\n float minT=1e4,kind=0.;\n if(tMoon>0.&&tMoon<minT){minT=tMoon;kind=2.;}\n if(tMars>0.&&tMars<minT){minT=tMars;kind=3.;}\n if(tSat>0.&&tSat<minT){minT=tSat;kind=4.;}\n if(tEarth>0.&&tEarth<minT){minT=tEarth;kind=1.;}\n // Saturn's inclined ring: intersects a disk plane in true 3D.\n vec3 sat=vec3(3.25,-.74,-3.3);\n vec3 ringN=normalize(vec3(.30,1.,-.25));\n float denom=dot(rd,ringN);\n float ringT=-1.;\n if(abs(denom)>.001)ringT=dot(sat-ro,ringN)/denom;\n if(ringT>0.&&ringT<minT){\n  vec3 q=ro+rd*ringT-sat;\n  float ringRadius=length(q);\n  if(ringRadius>.65&&ringRadius<1.08){minT=ringT;kind=5.;}\n }\n vec3 color=sky;\n if(kind>0.){\n   vec3 p=ro+rd*minT,normal=vec3(0.,1.,0.);\n   vec3 sun=normalize(vec3(-.75,.44,1.26));\n   if(kind==1.){\n     normal=normalize(p-earth);\n     color=earthColor(normal,rd,minT);\n   }else if(kind==5.){\n     float r=length(p-sat);\n     float bands=.55+.4*sin(r*72.)*sin(r*18.);\n     color=mix(vec3(.31,.28,.25),vec3(.77,.72,.59),bands)*(.4+.6*max(dot(ringN,sun),0.));\n   }else{\n     vec3 c=kind==2.?vec3(-2.45,.72,-1.30):kind==3.?vec3(2.70,.95,-2.5):sat;\n     normal=normalize(p-c);\n     vec3 base=kind==2.?vec3(.64,.67,.70):kind==3.?vec3(.52,.24,.15):vec3(.68,.57,.39);\n     color=rocky(normal,base,kind*12.);\n     color*=.18+1.12*max(dot(normal,sun),0.);\n     float rim=pow(1.-max(dot(normal,-rd),0.),3.);\n     color+=rim*vec3(.16,.19,.23)*.28;\n   }\n }\n float vignette=1.-.19*smoothstep(.15,1.40,length(xy));\n color*=vignette;\n color=pow(max(color,vec3(0.)),vec3(.93));\n gl_FragColor=vec4(color,1.);\n}\n";


 let gl=null,program=null,buffer=null,uniforms=null,raf=0,earthTexture=null;
 let inView=true,active=true,progress=0,shownChapter=0,renderWidth=0,renderHeight=0,lastFrame=-1000,quality=1;
 let frameCount=0,slowFrames=0,fastFrames=0;
 const pointer={x:0,y:0};
 const scenes=[root.querySelector(".odyssey-intro"),root.querySelector(".odyssey-chapter"),root.querySelector(".odyssey-archive-chapter")];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function setChapter(next){
   if(next===shownChapter)return;
   shownChapter=next;root.dataset.chapter=String(next);
   scenes.forEach((s,i)=>{const hidden=i!==next;s.setAttribute("aria-hidden",String(hidden));s.inert=hidden;});
 }
 function measureScroll(){
   if(reduce.matches){progress=.40;root.style.setProperty("--odyssey-progress",".40");setChapter(1);return;}
   const rect=root.getBoundingClientRect(),travel=Math.max(1,rect.height-window.innerHeight);
   progress=clamp(-rect.top/travel,0,1);
   root.style.setProperty("--odyssey-progress",progress.toFixed(3));
   setChapter(progress<.24?0:progress<.66?1:2);
 }
 function onPointer(e){
   if(reduce.matches)return;
   const rect=root.getBoundingClientRect();
   if(e.clientY<rect.top||e.clientY>rect.bottom)return;
   pointer.x=clamp((e.clientX/window.innerWidth-.5)*2,-1,1);
   pointer.y=clamp((.5-e.clientY/window.innerHeight)*2,-1,1);
 }
 function compile(type,source){
   const shader=gl.createShader(type);if(!shader)return null;
   gl.shaderSource(shader,source);gl.compileShader(shader);
   if(gl.getShaderParameter(shader,gl.COMPILE_STATUS))return shader;
   const error=gl.getShaderInfoLog(shader);
   console.warn("AURORA 3D shader unavailable:",error?.slice(0,280));
   gl.deleteShader(shader);return null;
 }
 function makePlaceholderTexture(){
   earthTexture=gl.createTexture();
   gl.bindTexture(gl.TEXTURE_2D,earthTexture);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([16,54,86,255]));
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 }
 async function loadEarth(){
   try{
     const res=await fetch("/data/earth-land.json",{cache:"force-cache"});
     if(!res.ok)throw Error("land texture unavailable");
     const geo=await res.json();
     if(!Array.isArray(geo.polygons)||!gl||!active)return;
     const tex=document.createElement("canvas");tex.width=4096;tex.height=2048;
     const ctx=tex.getContext("2d",{alpha:false});
     if(!ctx)return;
     ctx.fillStyle="#16405f";ctx.fillRect(0,0,4096,2048);
     ctx.fillStyle="#78986d";
     for(const poly of geo.polygons){
       if(!Array.isArray(poly)||poly.length<3)continue;
       // Duplicate across antimeridian to avoid drawing huge wrong-way polygons.
       for(const offset of [-4096,0,4096]){
         ctx.beginPath();let lastX=null;
         for(let i=0;i<poly.length;i++){
           const pair=poly[i];if(!Array.isArray(pair)||pair.length<2)continue;
           let x=(pair[0]+180)/360*4096+offset;
           let y=(90-pair[1])/180*2048;
           if(lastX!==null&&Math.abs(x-lastX)>2048){ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(x,y);}
           else if(lastX===null)ctx.moveTo(x,y);else ctx.lineTo(x,y);
           lastX=x;
         }
         ctx.closePath();ctx.fill();
       }
     }
     if(!active||!gl)return;
     gl.bindTexture(gl.TEXTURE_2D,earthTexture);
     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
     gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,tex);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
     gl.generateMipmap(gl.TEXTURE_2D);
     root.dataset.earthTexture="4096";
     if(reduce.matches)draw(0);else schedule();
   }catch(err){root.dataset.earthTexture="fallback";}
 }
 function prepare(){
   try{gl=canvas.getContext("webgl",{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:"high-performance"});}
   catch(_){gl=null;}
   if(!gl)return false;
   const vs=compile(gl.VERTEX_SHADER,vertexSource),fs=compile(gl.FRAGMENT_SHADER,fragmentSource);
   if(!vs||!fs)return false;
   program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
   gl.deleteShader(vs);gl.deleteShader(fs);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS)){console.warn("AURORA 3D link failed",gl.getProgramInfoLog(program));return false;}
   buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
   gl.useProgram(program);
   const pos=gl.getAttribLocation(program,"aPosition");
   gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
   uniforms={
     resolution:gl.getUniformLocation(program,"uResolution"),time:gl.getUniformLocation(program,"uTime"),
     progress:gl.getUniformLocation(program,"uProgress"),pointer:gl.getUniformLocation(program,"uPointer"),
     earth:gl.getUniformLocation(program,"uEarth"),hasEarth:gl.getUniformLocation(program,"uHasEarth")
   };
   makePlaceholderTexture();
   return true;
 }
 function size(){
   const box=canvas.getBoundingClientRect();
   const scale=quality*Math.min(window.devicePixelRatio||1,2.5);
   const limit=window.innerWidth<680?1400:4096;
   const w=Math.max(1,Math.round(Math.min(box.width*scale,limit)));
   const h=Math.max(1,Math.round(Math.min(box.height*scale,2160)));
   if(w!==renderWidth||h!==renderHeight){
     renderWidth=canvas.width=w;renderHeight=canvas.height=h;
     gl.viewport(0,0,w,h);
   }
 }
 function draw(ms){
   if(!gl||!program||document.hidden||!inView)return;
   if(ms-lastFrame<30&&!reduce.matches)return;
   const delta=ms-lastFrame;
   lastFrame=ms;
   if(!reduce.matches&&frameCount++>5&&delta>0){
     if(delta>48){slowFrames++;fastFrames=0;}
     else if(delta<25){fastFrames++;slowFrames=Math.max(0,slowFrames-1);}
     if(slowFrames>12&&quality>.55){quality=Math.max(.55,quality-.13);slowFrames=0;}
     if(fastFrames>80&&quality<1){quality=Math.min(1,quality+.07);fastFrames=0;}
   }
   size();gl.useProgram(program);
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,earthTexture);
   gl.uniform1i(uniforms.earth,0);
   gl.uniform1f(uniforms.hasEarth,root.dataset.earthTexture==="4096"?1:0);
   gl.uniform2f(uniforms.resolution,renderWidth,renderHeight);
   gl.uniform1f(uniforms.time,reduce.matches?0:ms*.001);
   gl.uniform1f(uniforms.progress,progress);
   gl.uniform2f(uniforms.pointer,pointer.x,pointer.y);
   gl.drawArrays(gl.TRIANGLES,0,6);
   if(!root.dataset.scenePixels){
     const earthPixel=new Uint8Array(4),starPixel=new Uint8Array(4);
     gl.readPixels(Math.floor(renderWidth*.5),Math.floor(renderHeight*.5),1,1,gl.RGBA,gl.UNSIGNED_BYTE,earthPixel);
     gl.readPixels(2,2,1,1,gl.RGBA,gl.UNSIGNED_BYTE,starPixel);
     if(gl.getError()===gl.NO_ERROR){
       root.dataset.scenePixels=Array.from(earthPixel.slice(0,3)).join(",")+"|"+Array.from(starPixel.slice(0,3)).join(",");
     }
   }
 }
 function tick(ms){
   raf=0;if(!active||!inView||document.hidden)return;
   draw(ms);if(!reduce.matches)raf=requestAnimationFrame(tick);
 }
 function schedule(){if(!active||!inView||document.hidden||raf)return;raf=requestAnimationFrame(tick);}
 function onMotion(){
   measureScroll();
   if(reduce.matches){if(raf)cancelAnimationFrame(raf);raf=0;draw(0);}
   else schedule();
 }
 function onScroll(){measureScroll();if(reduce.matches)draw(0);}
 canvas.addEventListener("webglcontextlost",e=>{
   e.preventDefault();active=false;
   if(raf)cancelAnimationFrame(raf);raf=0;root.dataset.renderer="fallback";
 });
 canvas.addEventListener("webglcontextrestored",()=>{
   active=prepare();if(active){root.dataset.renderer="webgl";loadEarth();schedule();}
 });
 window.addEventListener("scroll",onScroll,{passive:true});
 window.addEventListener("resize",()=>{measureScroll();if(reduce.matches)draw(0);else schedule();},{passive:true});
 root.addEventListener("pointermove",onPointer,{passive:true});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)schedule();});
 if(typeof reduce.addEventListener==="function")reduce.addEventListener("change",onMotion);
 if("IntersectionObserver" in window){
   const observer=new IntersectionObserver(entries=>{
     inView=entries.some(entry=>entry.isIntersecting);
     if(inView)schedule();else if(raf){cancelAnimationFrame(raf);raf=0;}
   },{rootMargin:"140px"});
   observer.observe(root);
 }
 scenes.forEach((s,i)=>{s.inert=i!==0;s.setAttribute("aria-hidden",String(i!==0));});
 measureScroll();
 active=prepare();
 if(active){root.dataset.renderer="webgl";loadEarth();schedule();}
 else root.dataset.renderer="fallback";
})();
