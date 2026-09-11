import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LEVELS } from './house-data';
import { buildHouse } from './house-model';
import { EYE_HEIGHT, movePlayer, canOccupy, supportHeight } from './navigation';

export type ViewMode='orbit'|'walk'|'plan';
export type ViewerState={mode:ViewMode;floor:number;roof:boolean;isolated:boolean;locked:boolean;room:string;fps:number;position:[number,number,number]};
export type Viewer={setMode:(m:ViewMode)=>void;setFloor:(f:number)=>void;setRoof:(v:boolean)=>void;reset:()=>void;enter:()=>void;zoom:(v:number)=>void;dispose:()=>void};

export function createViewer(container:HTMLDivElement,onState:(s:ViewerState)=>void):Viewer {
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.outputColorSpace=THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Interactive three dimensional house');renderer.domElement.tabIndex=0;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#e9e8e2');scene.fog=new THREE.Fog('#e9e8e2',65,130);
  const pmrem=new THREE.PMREMGenerator(renderer);const envScene=new RoomEnvironment();const env=pmrem.fromScene(envScene,.04);scene.environment=env.texture;scene.environmentIntensity=.45;envScene.dispose();pmrem.dispose();
  const camera=new THREE.PerspectiveCamera(42,1,.06,180);
  const ortho=new THREE.OrthographicCamera(-15,15,12,-12,.1,100);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=4;controls.maxDistance=65;controls.maxPolarAngle=Math.PI/2-.025;controls.target.set(7,4,4);
  const house=buildHouse();scene.add(house.root);
  const groundMat=new THREE.MeshStandardMaterial({color:'#d6d7c9',roughness:1});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,240),groundMat);ground.rotation.x=-Math.PI/2;ground.position.set(8,-.02,4);ground.receiveShadow=true;scene.add(ground);
  const grid=new THREE.GridHelper(80,80,'#c4c5ba','#ced0c4');grid.position.set(8,-.014,4);const gridMat=grid.material as THREE.Material;gridMat.transparent=true;gridMat.opacity=.18;scene.add(grid);
  const hemi=new THREE.HemisphereLight('#f4f6ff','#c9bda4',2.3);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff4df',3.5);sun.position.set(-7,24,15);sun.target.position.set(7,3,3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-22,right:22,top:20,bottom:-18,near:.5,far:65});sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight('#d9e5f0',.65);fill.position.set(20,12,-8);scene.add(fill);
  const player=new THREE.Vector3(9.92,.19,8.2);let yaw=0,pitch=0;
  const state:ViewerState={mode:'orbit',floor:0,roof:true,isolated:false,locked:false,room:'Entire house',fps:60,position:[9.92,.19,8.2]};
  const keys=new Set<string>();let disposed=false,raf=0,last=performance.now(),lastReport=0,frames=0,needsRender=true;
  // The structure and lights are fixed. Idle comparison panes do not need 60 redraws/sec.
  function emit(){needsRender=true;onState({...state,position:[player.x,player.y,player.z]});}
  function visibility(){
    house.floors.forEach((g,i)=>g.visible=!state.isolated||i===state.floor);
    house.ceilings.forEach(g=>g.visible=state.mode==='walk'||(!state.isolated&&state.roof));
    house.roof.visible=state.roof&&!state.isolated&&state.mode!=='plan';
    house.root.children.filter(o=>o.name.startsWith('downpipe')).forEach(o=>o.visible=!state.isolated);
    ground.visible=state.mode!=='plan';grid.visible=state.mode!=='walk'&&state.mode!=='plan';
  }
  function home(){camera.position.set(30,21,33);controls.target.set(6.8,4.5,3.8);controls.update();}
  function unLock(){if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();keys.clear();}
  function syncWalkCamera(){camera.position.set(player.x,player.y+EYE_HEIGHT,player.z);camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);}
  function spawn(f:number){const l=LEVELS[f];player.set(l.spawn[0],l.elevation,l.spawn[1]);yaw=0;pitch=0;syncWalkCamera();}
  const resize=()=>{const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();const extent=12;ortho.left=-extent*w/h;ortho.right=extent*w/h;ortho.top=extent;ortho.bottom=-extent;ortho.updateProjectionMatrix();if(state.isolated&&state.mode==='orbit')setFloor(state.floor);};
  const ro=new ResizeObserver(resize);ro.observe(container);resize();home();
  function setMode(mode:ViewMode){
    unLock();state.mode=mode;controls.enabled=mode==='orbit';
    if(mode==='walk'){state.isolated=false;state.roof=true;spawn(state.floor);}
    else if(mode==='plan'){state.isolated=true;ortho.position.set(8.465,40,4);ortho.up.set(0,0,-1);ortho.lookAt(8.465,0,4);}
    else {state.isolated=false;home();}
    visibility();emit();
  }
  function setFloor(f:number){unLock();state.floor=f;if(state.mode==='walk')spawn(f);else{state.isolated=true;if(state.mode==='orbit'){const y=LEVELS[f].elevation;controls.target.set(8.465,y+.4,4);camera.position.set(23,y+16,22).sub(controls.target).multiplyScalar(Math.max(1,1.3/camera.aspect)).add(controls.target);controls.update();}}visibility();emit();}
  function reset(){state.floor=0;state.roof=true;state.isolated=false;setMode('orbit');}
  function enter(){if(state.mode!=='walk')setMode('walk');renderer.domElement.focus();const p=renderer.domElement.requestPointerLock();p?.catch(()=>emit());}
  const lockChange=()=>{state.locked=document.pointerLockElement===renderer.domElement;if(!state.locked)keys.clear();emit();};
  const lockError=()=>{state.locked=false;emit();};
  const keyDown=(e:KeyboardEvent)=>{if(state.mode!=='walk'||!state.locked)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){keys.add(e.code);e.preventDefault();}};
  const keyUp=(e:KeyboardEvent)=>keys.delete(e.code);const blur=()=>keys.clear();
  const mouse=(e:MouseEvent)=>{if(state.mode==='walk'&&state.locked){yaw-=e.movementX*.002;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.002,-1.35,1.35);}};
  const click=()=>{if(state.mode==='walk'&&!state.locked)enter();};
  document.addEventListener('pointerlockchange',lockChange);document.addEventListener('pointerlockerror',lockError);document.addEventListener('keydown',keyDown);document.addEventListener('keyup',keyUp);document.addEventListener('mousemove',mouse);window.addEventListener('blur',blur);renderer.domElement.addEventListener('click',click);
  function tick(now:number){
    if(disposed)return;const dt=Math.min((now-last)/1000,.06);last=now;
    if(state.mode==='walk'){
      if(state.locked){let forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));let side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));const len=Math.hypot(forward,side);if(len){forward/=len;side/=len;const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?3.2:1.85;movePlayer(player,(side*Math.cos(yaw)-forward*Math.sin(yaw))*speed*dt,(-forward*Math.cos(yaw)-side*Math.sin(yaw))*speed*dt,house.colliders);}}
      if(!Number.isFinite(player.x+player.y+player.z)||supportHeight(player.x,player.z,player.y)===null||!canOccupy(player.x,player.y,player.z,house.colliders))spawn(state.floor);
      syncWalkCamera();state.floor=LEVELS.reduce((best,l,i)=>Math.abs(player.y-l.elevation)<Math.abs(player.y-LEVELS[best].elevation)?i:best,0);
      const l=LEVELS[state.floor];const room=[...l.rooms].reverse().find(r=>(r.regions??[r.bounds]).some(b=>player.x>=b[0]&&player.x<=b[2]&&player.z>=b[1]&&player.z<=b[3]));state.room=room?.name??(player.x<0?'Garage':player.z>9?'Outside':'Staircase');
    }
    const changed=state.mode==='walk'||controls.update();
    if(changed||needsRender){renderer.render(scene,state.mode==='plan'?ortho:camera);needsRender=false;}
    frames++;
    if(now-lastReport>1000){state.fps=Math.round(frames*1000/(now-lastReport));frames=0;lastReport=now;emit();}
    raf=requestAnimationFrame(tick);
  }
  visibility();emit();lastReport=performance.now();raf=requestAnimationFrame(tick);
  return {setMode,setFloor,reset,enter,setRoof(v){state.roof=v;visibility();emit();},zoom(v){if(state.mode==='plan'){ortho.zoom=THREE.MathUtils.clamp(ortho.zoom*v,.5,4);ortho.updateProjectionMatrix();}else if(state.mode==='orbit'){camera.position.sub(controls.target).multiplyScalar(1/v).add(controls.target);controls.update();}},dispose(){disposed=true;cancelAnimationFrame(raf);unLock();ro.disconnect();controls.dispose();document.removeEventListener('pointerlockchange',lockChange);document.removeEventListener('pointerlockerror',lockError);document.removeEventListener('keydown',keyDown);document.removeEventListener('keyup',keyUp);document.removeEventListener('mousemove',mouse);window.removeEventListener('blur',blur);renderer.domElement.removeEventListener('click',click);house.dispose();env.dispose();ground.geometry.dispose();groundMat.dispose();grid.geometry.dispose();gridMat.dispose();sun.shadow.map?.dispose();renderer.dispose();renderer.domElement.remove();}};
}
