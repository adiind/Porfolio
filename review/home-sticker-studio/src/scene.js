import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const clamp=THREE.MathUtils.clamp;
const ease=(a,b,s)=>a+(b-a)*s;
export async function initScenes({projects,heroPositions,reduced}){
 const container=document.querySelector('#webgl-layer');
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);
 renderer.setClearColor(0x000000,0);renderer.autoClear=false;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.8;
 container.appendChild(renderer.domElement);
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.025).texture;room.dispose();pmrem.dispose();
 const textures=new Map();const loader=new THREE.TextureLoader();
 let active=true,frame=0,dirty=true,last=0;const scenes=[];
 function kick(){dirty=true;if(!frame&&active&&!document.hidden)frame=requestAnimationFrame(draw)}
 function baseScene(el){const scene=new THREE.Scene();scene.environment=environment;scene.add(new THREE.AmbientLight(0xffffff,.55));const sun=new THREE.DirectionalLight(0xfffaf3,1.15);sun.position.set(-350,500,900);scene.add(sun);const fill=new THREE.DirectionalLight(0xc3e6ff,.25);fill.position.set(500,-100,300);scene.add(fill);const camera=new THREE.OrthographicCamera(-500,500,300,-300,.1,4000);camera.position.z=2000;return{el,scene,camera,sun,objects:[],visible:true};}
 async function texture(url){if(!textures.has(url))textures.set(url,loader.loadAsync(url).then(t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return t}));return textures.get(url)}
 function shadowTexture(img){const cvs=document.createElement('canvas');cvs.width=512;cvs.height=384;const ctx=cvs.getContext('2d');const s=Math.min(440/img.width,310/img.height);ctx.filter='blur(10px)';ctx.drawImage(img,(512-img.width*s)/2,(384-img.height*s)/2,img.width*s,img.height*s);ctx.globalCompositeOperation='source-in';ctx.fillStyle='#112837';ctx.fillRect(0,0,512,384);const tex=new THREE.CanvasTexture(cvs);tex.colorSpace=THREE.SRGBColorSpace;return tex}
 async function makeSticker(p,width,height,rot=0){const tex=await texture(p.sticker);const ratio=tex.image.width/tex.image.height;let w=width,h=w/ratio;if(h>height){h=height;w=h*ratio}
  const geo=new THREE.PlaneGeometry(w,h,36,24);const rest=geo.attributes.position.array.slice();
  const mat=new THREE.MeshPhysicalMaterial({map:tex,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:.16,transparent:true,alphaTest:.12,side:THREE.DoubleSide,roughness:.75,metalness:0,clearcoat:.06,clearcoatRoughness:.6,iridescence:.02,iridescenceIOR:1.4,iridescenceThicknessRange:[160,380],envMapIntensity:.04});
  mat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nif (!gl_FrontFacing) { diffuseColor.rgb = vec3(0.88,0.85,0.76); }');};
  const mesh=new THREE.Mesh(geo,mat);mesh.rotation.z=THREE.MathUtils.degToRad(rot);mesh.position.z=30;
  const shTex=shadowTexture(tex.image);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(w*1.2,h*1.25),new THREE.MeshBasicMaterial({map:shTex,transparent:true,opacity:.23,depthWrite:false}));shadow.rotation.z=mesh.rotation.z;shadow.position.set(9,-13,1);
  const group=new THREE.Group();group.add(shadow,mesh);return{group,mesh,shadow,rest,w,h,rot:mesh.rotation.z,lift:0,target:0,px:0,py:0,dragX:0,dragY:0,dragging:false,settleX:0,settleY:0};
 }
 function deform(o,lift){const pos=o.mesh.geometry.attributes.position;const rest=o.rest;for(let i=0;i<pos.count;i++){const x=rest[i*3],y=rest[i*3+1];const corner=Math.max(0,(x/o.w+.5)*.65+(.5-y/o.h)*.35-.48);const angle=corner*lift*1.6;pos.array[i*3]=x-Math.pow(corner,2)*lift*o.w*.12;pos.array[i*3+1]=y+Math.pow(corner,2)*lift*o.h*.08;pos.array[i*3+2]=Math.sin(angle)*o.w*.21 + Math.sin((x/o.w+.5)*Math.PI)*o.w*.012;}pos.needsUpdate=true;o.mesh.geometry.computeVertexNormals();}
 function applyInteraction(o,dt){const rate=1-Math.exp(-dt*11);o.lift=ease(o.lift,reduced()?0:o.target,rate);o.mesh.rotation.x=ease(o.mesh.rotation.x,reduced()?0:o.py*.13,rate);o.mesh.rotation.y=ease(o.mesh.rotation.y,reduced()?0:o.px*.16,rate);o.mesh.rotation.z=ease(o.mesh.rotation.z,o.rot+(reduced()?0:o.px*.035),rate);o.mesh.position.z=30+o.lift*32;
  o.settleX=ease(o.settleX,o.dragging?o.dragX:0,rate);o.settleY=ease(o.settleY,o.dragging?o.dragY:0,rate);o.mesh.position.x=o.settleX;o.mesh.position.y=o.settleY;
  o.shadow.position.x=9+o.settleX+o.lift*12;o.shadow.position.y=-13+o.settleY-o.lift*12;o.shadow.scale.setScalar(1+o.lift*.03);o.shadow.material.opacity=.23-o.lift*.07;deform(o,o.lift);
  return Math.abs((reduced()?0:o.target)-o.lift)>.001||Math.abs(o.settleX-(o.dragging?o.dragX:0))>.1||Math.abs(o.settleY-(o.dragging?o.dragY:0))>.1;
 }
 function events(el,o,drag=false){el.addEventListener('pointerenter',()=>{o.target=1;kick()});el.addEventListener('pointerleave',()=>{if(!o.dragging){o.target=0;o.px=0;o.py=0;kick()}});el.addEventListener('focus',()=>{o.target=1;kick()});el.addEventListener('blur',()=>{o.target=0;kick()});el.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&!o.dragging)return;const r=el.getBoundingClientRect();o.px=clamp((e.clientX-r.left)/r.width*2-1,-1,1);o.py=clamp((e.clientY-r.top)/r.height*2-1,-1,1);kick()});
  if(drag){el.addEventListener('dragstart',e=>e.preventDefault());let start=null;el.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||reduced())return;e.preventDefault();start={x:e.clientX,y:e.clientY};el.setPointerCapture(e.pointerId)});el.addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)>7){o.dragging=true;el.dataset.dragging='true';o.dragX=clamp(dx,-150,150);o.dragY=clamp(-dy,-100,100);o.target=1.4;kick()}});const end=()=>{start=null;if(o.dragging){o.dragging=false;o.target=0;setTimeout(()=>delete el.dataset.dragging,50);kick()}};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);}
 }

 const heroEl=document.querySelector('#hero-stage');const hero=baseScene(heroEl);hero.type='hero';scenes.push(hero);
 const fontJson=await new TTFLoader().loadAsync('/fonts/Bricolage-700.ttf');const font=new FontLoader().parse(fontJson);
 const lettering=new TextGeometry('adi.',{font,size:300,depth:42,curveSegments:20,bevelEnabled:true,bevelThickness:9,bevelSize:7,bevelSegments:8});lettering.computeBoundingBox();lettering.center();const nameMesh=new THREE.Mesh(lettering,new THREE.MeshPhysicalMaterial({color:0x4089bd,metalness:.26,roughness:.24,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:.8}));hero.scene.add(nameMesh);hero.nameMesh=nameMesh;hero.nameWidth=lettering.boundingBox.max.x-lettering.boundingBox.min.x;
 await Promise.all(heroPositions.map(async o=>{const p=projects.find(p=>p.id===o.id);const s=await makeSticker(p,o.w,o.h,o.rot);hero.scene.add(s.group);hero.objects.push({...s,layout:o,button:document.querySelector(`[data-hero="${o.id}"]`)});const item=hero.objects.at(-1);events(item.button,item,true)}));
 heroEl.classList.add('rendered');
 for(const el of document.querySelectorAll('.sticker-stage')){const p=projects.find(p=>p.id===el.dataset.sticker);const s=baseScene(el);s.type='card';s.project=p;s.ready=false;scenes.push(s);}
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{const s=scenes.find(s=>s.el===entry.target);if(!s)return;s.visible=entry.isIntersecting;if(s.visible&&s.type==='card'&&!s.ready&&!s.loading){s.loading=true;const idx=projects.indexOf(s.project);makeSticker(s.project,400,290,[-7,5,-5,5,-7,4][idx%6]).then(o=>{s.objects.push(o);s.scene.add(o.group);s.ready=true;s.el.classList.add('rendered');events(s.el.closest('button'),o);kick()}).catch(()=>{s.loading=false;});}kick()})},{rootMargin:'250px'});scenes.forEach(s=>observer.observe(s.el));
 function sizeScene(s,r){s.camera.left=-r.width/2;s.camera.right=r.width/2;s.camera.top=r.height/2;s.camera.bottom=-r.height/2;s.camera.updateProjectionMatrix();if(s.type==='hero'){
  const mobile=innerWidth<=600;const factor=Math.min(1.15,(innerWidth-100)/1340);const mf=Math.min(1,(innerWidth-20)/390);
  const nameScale=r.width*(mobile?.67:.54)/hero.nameWidth;nameMesh.scale.setScalar(nameScale);nameMesh.position.set(mobile?8:0,mobile?-6:-8,42);nameMesh.rotation.set(-.12,-.1,-.04);
  for(const o of s.objects){const l=o.layout;const scale=mobile?mf:factor;const w=(mobile?l.mw:l.w)*scale,h=(mobile?l.mh:l.h)*scale;const sc=Math.min(w/o.w,h/o.h);o.group.scale.setScalar(sc);o.group.position.set(((mobile?l.mx:l.x)/100-.5)*r.width,(.5-(mobile?l.my:l.y)/100)*r.height,50);}
 }else if(s.ready){const o=s.objects[0];const scale=Math.min(r.width*.73/o.w,r.height*.67/o.h);o.group.scale.setScalar(scale);o.group.position.y=0;}}
 function draw(time){frame=0;if(!active||document.hidden)return;const dt=Math.min((time-last)/1000||.016,.04);last=time;renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);let unsettled=false;const modal=document.querySelector('#project-dialog').open;
  if(!modal){for(const s of scenes){const r=s.el.getBoundingClientRect();if(!s.visible||r.bottom<0||r.top>innerHeight||r.width<1||r.height<1||s.el.closest('[hidden]'))continue;sizeScene(s,r);for(const o of s.objects)unsettled=applyInteraction(o,dt)||unsettled;
   if(s.type==='hero'&&!reduced()){const px=pointer.x*.035,py=pointer.y*.025;nameMesh.rotation.y=ease(nameMesh.rotation.y,-.1+px,.05);nameMesh.rotation.x=ease(nameMesh.rotation.x,-.12+py,.05);}
   renderer.setViewport(r.left,innerHeight-r.bottom,r.width,r.height);renderer.setScissor(Math.max(0,r.left),Math.max(0,innerHeight-r.bottom),Math.min(innerWidth,r.right)-Math.max(0,r.left),Math.min(innerHeight,r.bottom)-Math.max(0,r.top));renderer.clearDepth();renderer.render(s.scene,s.camera);
  }}dirty=false;if(unsettled)kick();
 }
 const pointer={x:0,y:0};heroEl.addEventListener('pointermove',e=>{const r=heroEl.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=(e.clientY-r.top)/r.height*2-1;kick()});
 addEventListener('scroll',kick,{passive:true});addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);kick()});addEventListener('sticker-layout',kick);addEventListener('sticker-motion',()=>{scenes.forEach(s=>s.objects.forEach(o=>{if(reduced()){o.target=0;o.px=0;o.py=0}}));kick()});document.addEventListener('visibilitychange',()=>{if(!document.hidden)kick()});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;container.style.display='none';document.querySelectorAll('.rendered').forEach(el=>el.classList.remove('rendered'));document.body.dataset.renderMode='static'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);
 document.body.dataset.renderMode='webgl';window.__stickerGraphics={renderer,scenes,kick};kick();
 addEventListener('pagehide',e=>{if(e.persisted)return;active=false;cancelAnimationFrame(frame);observer.disconnect();renderer.dispose();environment.dispose();for(const s of scenes){s.scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose()}}})}});
}
