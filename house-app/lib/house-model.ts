import * as THREE from 'three';
import { DEPTH, FOOTPRINT, LEVELS, LIFT, STAIR, WIDTH, type Level, type Point, type Rect, type Wall } from './house-data';

export type Collider = { min: THREE.Vector3; max: THREE.Vector3; id: string };
export type HouseModel = {
  root: THREE.Group; floors: THREE.Group[]; ceilings: THREE.Group[]; roof: THREE.Group;
  colliders: Collider[]; surfaces: THREE.Mesh[]; dispose: () => void;
};
export const PITCH = Math.tan(42 * Math.PI / 180);
export const inRect = (x: number, z: number, r: Rect, margin=0) => x>=r[0]+margin && x<=r[2]-margin && z>=r[1]+margin && z<=r[3]-margin;
export function inFootprint(x: number,z: number) {
  return inRect(x,z,[0,0,WIDTH,8]) || inRect(x,z,[6.215,-1.25,10.715,0]) || inRect(x,z,[6.075,8,10.855,9]);
}
export function roofHeight(x: number,z: number) {
  const hip=7.35+Math.max(0,Math.min(x,WIDTH-x,z,8-z))*PITCH;
  const gable=x>=6.075 && x<=10.855 ? 8.93+Math.min(x-6.075,10.855-x)*PITCH:0;
  return Math.max(hip,gable);
}
export const atticCeiling = (x: number,z: number) => Math.min(8.93,roofHeight(x,z)-.18);

function texture(kind: 'plaster'|'oak'|'tile'|'roof') {
  const c=document.createElement('canvas');c.width=c.height=256;
  const ctx=c.getContext('2d')!;
  let seed=3721;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const colors={plaster:'#e9e5dd',oak:'#bda083',tile:'#c6c2b8',roof:'#72635a'};
  ctx.fillStyle=colors[kind];ctx.fillRect(0,0,256,256);
  if(kind==='oak') {
    for(let row=0;row<8;row++){
      ctx.fillStyle=`rgba(78,48,22,${.035+rand()*.07})`;ctx.fillRect(0,row*32,256,31);
      ctx.fillStyle='rgba(59,37,19,.19)';ctx.fillRect(0,row*32,256,1);
      const offset=row%2?96:192;ctx.fillRect(offset,row*32,1,32);
      for(let i=0;i<38;i++){ctx.fillStyle=`rgba(60,30,10,${rand()*.10})`;ctx.fillRect(rand()*256,row*32+rand()*31,20+rand()*110,.4);}
    }
  }else if(kind==='tile'||kind==='roof') {
    const unit=kind==='tile'?128:32;
    ctx.strokeStyle=kind==='tile'?'#aaa79f':'#4e443f';ctx.lineWidth=kind==='tile'?1.3:2;
    for(let y=0;y<256;y+=unit)for(let x=0;x<256;x+=unit){ctx.strokeRect(x,y,unit,unit);if(kind==='roof'){ctx.fillStyle='rgba(255,255,255,.10)';ctx.fillRect(x+2,y+3,3,unit-6);}}
  }
  for(let i=0;i<4500;i++){ctx.fillStyle=`rgba(${rand()>.5?'255,255,255':'0,0,0'},${rand()*.045})`;ctx.fillRect(rand()*256,rand()*256,1,1);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;
  t.repeat.set(kind==='oak'?.5:kind==='roof'?.55:1,kind==='oak'?.5:kind==='roof'?.55:1);
  return t;
}

export function buildHouse(): HouseModel {
  const root=new THREE.Group();root.name='house';
  const floors=LEVELS.map(l=>{const g=new THREE.Group();g.name=l.id;root.add(g);return g;});
  const ceilings=LEVELS.map(l=>{const g=new THREE.Group();g.name=l.id+'-ceilings';root.add(g);return g;});
  const roof=new THREE.Group();roof.name='roof';root.add(roof);
  const colliders: Collider[]=[];const surfaces: THREE.Mesh[]=[];
  const maps={plaster:texture('plaster'),oak:texture('oak'),tile:texture('tile'),roof:texture('roof')};
  const mats={
    plaster:new THREE.MeshStandardMaterial({map:maps.plaster,roughness:.88}),
    inside:new THREE.MeshStandardMaterial({color:'#eee9df',roughness:.9}),
    oak:new THREE.MeshStandardMaterial({map:maps.oak,roughness:.68}),
    tile:new THREE.MeshStandardMaterial({map:maps.tile,roughness:.7}),
    roof:new THREE.MeshStandardMaterial({map:maps.roof,roughness:.88,side:THREE.DoubleSide}),
    frame:new THREE.MeshStandardMaterial({color:'#d5d3c9',roughness:.48,metalness:.12}),
    dark:new THREE.MeshStandardMaterial({color:'#494d4a',roughness:.62,metalness:.15}),
    glass:new THREE.MeshPhysicalMaterial({color:'#d5e6e4',roughness:.08,metalness:.05,transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide}),
    concrete:new THREE.MeshStandardMaterial({color:'#b3b0a5',roughness:.93}),
    door:new THREE.MeshStandardMaterial({color:'#c5af91',roughness:.67}),
    solar:new THREE.MeshStandardMaterial({color:'#263b46',metalness:.45,roughness:.28}),
  };
  function addBox(group: THREE.Group, id:string,x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material,solid=false) {
    const geo=new THREE.BoxGeometry(w,h,d);
    // Metric UVs: texture repetition does not stretch when a wall is longer.
    const uv=geo.getAttribute('uv');for(let i=0;i<uv.count;i++){const f=Math.floor(i/4);const sx=f<2?d:f<4?w:w;const sy=f<2?h:f<4?d:h;uv.setXY(i,uv.getX(i)*sx,uv.getY(i)*sy);}
    const mesh:THREE.Mesh<THREE.BoxGeometry,THREE.Material|THREE.Material[]>=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=id;mesh.userData={surfaceId:id};group.add(mesh);surfaces.push(mesh);
    if(solid) colliders.push({id,min:new THREE.Vector3(x-w/2,y-h/2,z-d/2),max:new THREE.Vector3(x+w/2,y+h/2,z+d/2)});
    return mesh;
  }
  function flat(group:THREE.Group,id:string,poly:Point[],y:number,material:THREE.Material,holes:Point[][]=[]){
    const shape=new THREE.Shape(poly.map(p=>new THREE.Vector2(p[0],-p[1])));
    holes.forEach(h=>shape.holes.push(new THREE.Path(h.map(p=>new THREE.Vector2(p[0],-p[1])))));
    const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);
    const mesh=new THREE.Mesh(geo,material);mesh.position.y=y;mesh.name=id;mesh.receiveShadow=true;mesh.userData={surfaceId:id};group.add(mesh);surfaces.push(mesh);return mesh;
  }
  const rectPoly=(r:Rect):Point[]=>[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]]];
  const stairHole=rectPoly([STAIR.x0-.01,STAIR.z0,STAIR.x1+.01,STAIR.z1]);
  function buildWall(level:Level,index:number,w:Wall){
    const g=floors[index];const alongX=Math.abs(w.b[0]-w.a[0])>Math.abs(w.b[1]-w.a[1]);
    const length=alongX?w.b[0]-w.a[0]:w.b[1]-w.a[1];
    function segment(from:number,to:number,bottom:number,top:number,suffix:string){
      if(to-from<.005||top-bottom<.005)return;
      const x=w.a[0]+(alongX?(from+to)/2:0),z=w.a[1]+(alongX?0:(from+to)/2);
      const actualTop=index===2?Math.min(top,atticCeiling(x,z)-level.elevation):top;
      if(actualTop<=bottom)return;
      const id=`${level.id}/${w.id}/${suffix}`;
      const mesh=addBox(g,id,x,level.elevation+(bottom+actualTop)/2,z,alongX?to-from:w.thickness,actualTop-bottom,alongX?w.thickness:to-from,mats.plaster,true);
      // Each broad face owns a material instance and a stable ID for future finish editing.
      const faces=Array.from({length:6},()=>mats.plaster.clone());mesh.material=faces;
      mesh.userData.faceIds=faces.map((_,i)=>`${id}/face-${i}`);
      if(index===2){
        const p=mesh.geometry.getAttribute('position');
        for(let i=0;i<p.count;i++)if(p.getY(i)>0){const yy=Math.min(level.elevation+top,atticCeiling(p.getX(i)+x,p.getZ(i)+z));p.setY(i,yy-mesh.position.y);}
        p.needsUpdate=true;mesh.geometry.computeVertexNormals();
      }
      if(bottom===0){
        const m=.018;for(const side of [-1,1]) addBox(g,id+`/skirting-${side}`,x+(alongX?0:side*(w.thickness/2+m/2)),level.elevation+.055,z+(alongX?side*(w.thickness/2+m/2):0),alongX?to-from:m,.11,alongX?m:to-from,mats.frame);
      }
    }
    let cursor=0;
    for(const [i,o] of [...w.openings].sort((a,b)=>a.offset-b.offset).entries()){
      const end=Math.min(length,o.offset+o.width);if(o.offset>=length)continue;
      segment(cursor,o.offset,0,level.height,`solid-${i}`);
      segment(o.offset,end,0,o.bottom,`sill-${i}`);
      segment(o.offset,end,o.bottom+o.height,level.height,`lintel-${i}`);
      const center=(o.offset+end)/2,x=w.a[0]+(alongX?center:0),z=w.a[1]+(alongX?0:center),y=level.elevation+o.bottom;
      const width=end-o.offset;
      if(o.kind==='window'){
        addBox(g,`${level.id}/${w.id}/glass-${i}`,x,y+o.height/2,z,alongX?width-.08:.028,o.height-.06,alongX?.028:width-.08,mats.glass,true);
        for(const edge of [-1,1]){
          addBox(g,`${level.id}/${w.id}/jamb-${i}-${edge}`,x+(alongX?edge*(width-.055)/2:0),y+o.height/2,z+(alongX?0:edge*(width-.055)/2),alongX?.055:.12,o.height,alongX?.12:.055,mats.frame);
          addBox(g,`${level.id}/${w.id}/rail-${i}-${edge}`,x,y+o.height/2+edge*(o.height-.055)/2,z,alongX?width:.12,.055,alongX?.12:width,mats.frame);
        }
        if(width>1.25)addBox(g,`${level.id}/${w.id}/mullion-${i}`,x,y+o.height/2,z,alongX?.045:.09,o.height,alongX?.09:.045,mats.frame);
        addBox(g,`${level.id}/${w.id}/ledge-${i}`,x,y-.025,z,alongX?width+.08:w.thickness+.08,.05,alongX?w.thickness+.08:width+.08,mats.concrete);
      }else if(o.kind==='door'){
        // Open leaves are decorative; the doorway remains traversable.
        for(const edge of [-1,1])addBox(g,`${level.id}/${w.id}/door-frame-${i}-${edge}`,x+(alongX?edge*width/2:0),y+o.height/2,z+(alongX?0:edge*width/2),alongX?.045:w.thickness+.02,o.height,alongX?w.thickness+.02:.045,mats.frame);
        addBox(g,`${level.id}/${w.id}/door-head-${i}`,x,y+o.height,z,alongX?width+.08:w.thickness+.02,.055,alongX?w.thickness+.02:width+.08,mats.frame);
        const leaf=addBox(g,`${level.id}/${w.id}/open-door-${i}`,x-(alongX?width/2:width/2),y+(o.height-.06)/2,z+(alongX?width/2:-width/2),alongX?.04:width-.06,o.height-.06,alongX?width-.06:.04,mats.door);
        leaf.userData.objectId=`${level.id}/${w.id}/door-${i}`;
      }
      cursor=end;
    }
    segment(cursor,length,0,level.height,'solid-end');
  }

  LEVELS.forEach((level,i)=>{
    const holes=i>0?[stairHole,rectPoly(LIFT)]:[rectPoly(LIFT)];
    flat(floors[i],`${level.id}/floor`,FOOTPRINT,level.elevation,mats.tile,holes);
    // Separate finish patches per room. Floor geometry remains fixed.
    for(const room of level.rooms){
      let bounds=room.bounds;
      // Studio bathroom has its own patch, applied after the studio.
      if(room.id==='studio')bounds=[.365,.365,6.2,7.635];
      const cuts:Rect[]=[LIFT,...(i>0?[[STAIR.x0,STAIR.z0,STAIR.x1,STAIR.z1] as Rect]:[])];
      let pieces:Rect[]=[bounds];
      for(const cut of cuts)pieces=pieces.flatMap(r=>{
        const x0=Math.max(r[0],cut[0]),z0=Math.max(r[1],cut[1]),x1=Math.min(r[2],cut[2]),z1=Math.min(r[3],cut[3]);
        if(x1<=x0||z1<=z0)return [r];
        return [[r[0],r[1],x0,r[3]],[x1,r[1],r[2],r[3]],[x0,r[1],x1,z0],[x0,z1,x1,r[3]]].filter(p=>p[2]-p[0]>.001&&p[3]-p[1]>.001) as Rect[];
      });
      for(const [j,piece] of pieces.entries()){
        const m=mats[room.finish].clone();
        const mesh=flat(floors[i],`${level.id}/${room.id}/floor-${j}`,rectPoly(piece),level.elevation+.004+(room.finish==='tile'?.003:0),m);
        mesh.userData.roomId=room.id;
      }
    }
    level.walls.forEach(w=>buildWall(level,i,w));
    // Slab edges and ceiling underside, with a real opening above each stair flight.
    FOOTPRINT.forEach((p,j)=>{
      const q=FOOTPRINT[(j+1)%FOOTPRINT.length];
      addBox(floors[i],`${level.id}/slab-edge-${j}`,(p[0]+q[0])/2,level.elevation-.10,(p[1]+q[1])/2,Math.max(.08,Math.abs(q[0]-p[0])),.20,Math.max(.08,Math.abs(q[1]-p[1])),mats.concrete);
    });
    if(i<2){
      const underside=mats.inside.clone();underside.side=THREE.DoubleSide;
      flat(ceilings[i],`${level.id}/ceiling`,FOOTPRINT,level.elevation+level.height,underside,[stairHole,rectPoly(LIFT)]);
      const straightSteps=12;
      for(let step=0;step<STAIR.steps;step++){
        const rise=(LEVELS[i+1].elevation-level.elevation)/STAIR.steps;
        const run=(STAIR.z1-STAIR.turnStart)/straightSteps;
        const top=level.elevation+(step+1)*rise;
        if(step<straightSteps){
          addBox(floors[i],`${level.id}/stairs/tread-${step}`,(STAIR.x0+STAIR.x1)/2,top-.09,STAIR.z1-(step+.5)*run,STAIR.x1-STAIR.x0,.18,run+.012,mats.oak);
          addBox(floors[i],`${level.id}/stairs/riser-${step}`,(STAIR.x0+STAIR.x1)/2,top-rise/2,STAIR.z1-step*run-.012,STAIR.x1-STAIR.x0,rise,.024,mats.inside);
        }else{
          // The top five treads fan through the quarter-turn before the landing.
          const turn=(step-straightSteps)/4;
          const angle=Math.PI/2+turn*Math.PI/2;
          const radius=.36+turn*.38;
          const tread=addBox(floors[i],`${level.id}/stairs/turning-tread-${step}`,7.07+Math.cos(angle)*radius,top-.09,STAIR.turnStart+Math.sin(angle)*radius,.76,.18,.22,mats.oak);
          tread.rotation.y=angle-Math.PI/2;
        }
      }
      // A rail follows the rise; open landing rail prevents a fall into the upper-floor stairwell.
      const start=new THREE.Vector3(STAIR.x1-.04,level.elevation+.95,STAIR.z1),end=new THREE.Vector3(STAIR.x0+.18,LEVELS[i+1].elevation+.95,STAIR.turnStart);
      beam(floors[i],`${level.id}/stairs/handrail`,start,end,.034,mats.dark);
      for(let k=0;k<=8;k++){const t=k/8;const z=THREE.MathUtils.lerp(STAIR.z1,STAIR.z0,t);const y=THREE.MathUtils.lerp(level.elevation,LEVELS[i+1].elevation,t);beam(floors[i],`${level.id}/stairs/post-${k}`,new THREE.Vector3(STAIR.x1-.04,y,z),new THREE.Vector3(STAIR.x1-.04,y+.95,z),.02,mats.dark);}
    }
    // Soft fill lights keep empty interiors readable without pretending to simulate a lighting study.
    for(const x of [3.2,8.4,14.1]){
      const light=new THREE.PointLight('#fff0dc',9,10,2);light.position.set(x,level.elevation+Math.min(level.height-.25,2.4),3.9);floors[i].add(light);
    }
  });
  function beam(g:THREE.Group,id:string,a:THREE.Vector3,b:THREE.Vector3,r:number,mat:THREE.Material){
    const d=b.clone().sub(a);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),8),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.name=id;m.castShadow=true;g.add(m);
  }
  // Closed lift door panels on each landing, separate from the static shaft surfaces.
  LEVELS.forEach((l,i)=>{
    for(const dx of [-.22,.22])addBox(floors[i],`${l.id}/lift-door-${dx}`,8.575+dx,l.elevation+1.05,7.557,.425,2.1,.018,mats.dark);
  });
  // Garage: north/left side, 3.60 m wide by 8 m deep.
  const garage=floors[0];
  flat(garage,'garage/floor',rectPoly([-3.60,0,0,8]),.19,mats.concrete);
  addBox(garage,'garage/wall-left',-3.5,1.48,4,.2,2.58,8,mats.plaster,true);
  addBox(garage,'garage/wall-back',-1.8,1.48,.1,3.6,2.58,.2,mats.plaster,true);
  addBox(garage,'garage/door',-1.8,1.3,7.94,3.15,2.22,.08,mats.frame,true);
  for(let j=0;j<8;j++)addBox(garage,`garage/door-seam-${j}`,-1.8,.30+j*.275,7.995,3.15,.015,.015,mats.dark);
  addBox(garage,'garage/roof',-1.8,2.70,4,3.6,.18,8,mats.concrete);
  for(const z of [.05,7.95])addBox(garage,`garage/parapet-${z}`,-1.8,2.84,z,3.6,.22,.1,mats.plaster);
  addBox(garage,'garage/parapet-left',-3.55,2.84,4,.1,.22,8,mats.plaster);
  // Front approach: low threshold ramp for continuous exterior-to-interior movement.
  flat(garage,'entry/approach',rectPoly([6.075,9,10.855,11]),.005,mats.concrete);
  const rampGeo=new THREE.BufferGeometry();rampGeo.setAttribute('position',new THREE.Float32BufferAttribute([8.8,.19,9,10.2,.19,9,10.2,0,11,8.8,.19,9,10.2,0,11,8.8,0,11],3));rampGeo.computeVertexNormals();
  const ramp=new THREE.Mesh(rampGeo,mats.concrete);ramp.material.side=THREE.DoubleSide;garage.add(ramp);
  addBox(floors[1],'entry/canopy',8.465,3.14,9.35,4.78,.14,1.25,mats.concrete);
  // West/rear balconies. Rails are collidable at walking height.
  for(const [side,r] of [['left',[0,-1.25,6.215,0]],['right',[10.715,-1.25,WIDTH,0]]] as [string,Rect][]){
    const g=floors[1];flat(g,`upper/balcony-${side}/floor`,rectPoly(r),3.38,mats.oak);
    addBox(g,`upper/balcony-${side}/slab`,(r[0]+r[2])/2,3.28,-.625,r[2]-r[0],.2,1.25,mats.concrete);
    for(let x=r[0]+.08;x<r[2];x+=.7)beam(g,`upper/balcony-${side}/post`,new THREE.Vector3(x,3.38,-1.19),new THREE.Vector3(x,4.4,-1.19),.022,mats.dark);
    beam(g,`upper/balcony-${side}/rail`,new THREE.Vector3(r[0],4.4,-1.19),new THREE.Vector3(r[2],4.4,-1.19),.03,mats.dark);
    addBox(g,`upper/balcony-${side}/glass`,(r[0]+r[2])/2,3.93,-1.19,r[2]-r[0],.85,.02,mats.glass,true);
    for(const x of [r[0]+.05,r[2]-.05])addBox(g,`upper/balcony-${side}/end-${x}`,x,3.93,-.625,.02,1.05,1.25,mats.glass,true);
  }
  // Roof tiles and attic ceiling use the same envelope, including the central cross gable.
  const skyRects:Rect[]=[[2.75,6.05,3.53,7.23],[4.55,6.05,5.33,7.23],[11.65,6.05,12.43,7.23],[14,6.05,14.78,7.23],[2.75,.77,3.53,1.95],[4.55,.77,5.33,1.95],[11.65,.77,12.43,1.95],[14,.77,14.78,1.95]];
  const xs=[-.3,0,WIDTH,WIDTH+.3,6.075,6.215,8.465,10.715,10.855,...skyRects.flatMap(r=>[r[0],r[2]])];
  const zs=[-1.55,-1.25,-.3,0,4,8,8.3,9,9.3,...skyRects.flatMap(r=>[r[1],r[3]])];
  for(let x=0;x<WIDTH;x+=.28)xs.push(x);for(let z=0;z<8;z+=.28)zs.push(z);
  const xx=[...new Set(xs)].sort((a,b)=>a-b),zz=[...new Set(zs)].sort((a,b)=>a-b);
  const roofPos:number[]=[],ceilingPos:number[]=[],roofUv:number[]=[];
  const triangles=(a:Point,b:Point,c:Point,d:Point,target:number[],fn:(x:number,z:number)=>number,uv?:number[])=>{
    for(const p of [a,c,b,a,d,c]){target.push(p[0],fn(...p),p[1]);uv?.push(p[0],p[1]);}
  };
  for(let i=0;i<xx.length-1;i++)for(let j=0;j<zz.length-1;j++){
    const x=(xx[i]+xx[i+1])/2,z=(zz[j]+zz[j+1])/2;
    const outer=inRect(x,z,[-.3,-.3,WIDTH+.3,8.3])||inRect(x,z,[6.075,-1.55,10.855,9.3]);
    if(!outer||skyRects.some(r=>inRect(x,z,r)))continue;
    const a:Point=[xx[i],zz[j]],b:Point=[xx[i+1],zz[j]],c:Point=[xx[i+1],zz[j+1]],d:Point=[xx[i],zz[j+1]];
    triangles(a,b,c,d,roofPos,roofHeight,roofUv);
    if(inFootprint(x,z))triangles(a,b,c,d,ceilingPos,atticCeiling);
  }
  function skin(group:THREE.Group,id:string,p:number[],mat:THREE.Material,uv?:number[]){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));if(uv)geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,mat);mesh.name=id;mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.surfaceId=id;surfaces.push(mesh);group.add(mesh);return mesh;}
  skin(roof,'roof/tile-surface',roofPos,mats.roof,roofUv);
  const atticMat=mats.inside.clone();atticMat.side=THREE.DoubleSide;skin(ceilings[2],'attic/ceiling',ceilingPos,atticMat);
  // Gable faces above attic ceiling, front and rear.
  for(const z of [-1.0675,8.8175]){
    skin(roof,`roof/gable-${z}`,[6.075,8.93,z,10.855,8.93,z,8.465,roofHeight(8.465,z),z],new THREE.MeshStandardMaterial({color:'#ded9cd',roughness:.9,side:THREE.DoubleSide}));
  }
  for(const [i,r] of skyRects.entries()){
    const corners:Point[]=[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]]];const pos:number[]=[];
    triangles(corners[0],corners[1],corners[2],corners[3],pos,(x,z)=>roofHeight(x,z)+.035);
    skin(roof,`roof/skylight-${i}`,pos,mats.glass);
    corners.forEach((p,j)=>{const q=corners[(j+1)%4];beam(roof,`roof/skylight-${i}/frame-${j}`,new THREE.Vector3(p[0],roofHeight(...p)+.05,p[1]),new THREE.Vector3(q[0],roofHeight(...q)+.05,q[1]),.045,mats.dark);});
  }
  // Thin metal gutters along the two principal eaves.
  for(const z of [-.28,8.28])for(const [a,b] of [[-.28,6.075],[10.855,WIDTH+.28]])beam(roof,`roof/gutter-${z}-${a}`,new THREE.Vector3(a,7.34,z),new THREE.Vector3(b,7.34,z),.055,mats.dark);
  for(const x of [.08,WIDTH-.08])for(const z of [.08,7.92])beam(root,`downpipe-${x}-${z}`,new THREE.Vector3(x,.25,z),new THREE.Vector3(x,7.35,z),.036,mats.dark);
  root.userData={objectId:'house',dimensions:{width:WIDTH,depth:DEPTH},units:'metres'};
  return {root,floors,ceilings,roof,colliders,surfaces,dispose(){
    const geometries=new Set<THREE.BufferGeometry>();const materials=new Set<THREE.Material>();
    root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());Object.values(maps).forEach(t=>t.dispose());
  }};
}
