import { Vector3 } from 'three';
import { LEVELS, LIFT, STAIR, WIDTH } from './house-data';
import { atticCeiling, inFootprint, inRect, type Collider } from './house-model';

export const EYE_HEIGHT=1.65;
export const RADIUS=.18;
export function stairHeight(x:number,z:number,floor:number) {
  if(!inRect(x,z,[STAIR.x0,STAIR.z0,STAIR.x1,STAIR.z1]))return null;
  const t=(STAIR.z1-z)/(STAIR.z1-STAIR.z0);
  return LEVELS[floor].elevation+t*(LEVELS[floor+1].elevation-LEVELS[floor].elevation);
}
export function supportHeight(x:number,z:number,previous:number):number|null {
  const heights:number[]=[];
  if(x< -13||x>WIDTH+12||z< -14||z>22)return null;
  if(!inFootprint(x,z))heights.push(0);
  if(inRect(x,z,[-3.4,.2,0,7.9]))heights.push(.19);
  if(inRect(x,z,[8.8,9,10.2,11]))heights.push(.19*(11-z)/2);
  LEVELS.forEach((l,i)=>{
    if(inFootprint(x,z)&&!inRect(x,z,LIFT)&&!inRect(x,z,[STAIR.x0,STAIR.z0,STAIR.x1,STAIR.z1]))heights.push(l.elevation);
    if(i<2){const s=stairHeight(x,z,i);if(s!==null)heights.push(s);}
  });
  if(inRect(x,z,[0,-1.25,6.215,0])||inRect(x,z,[10.715,-1.25,WIDTH,0]))heights.push(3.38);
  // Step only onto nearby surfaces to prevent falling into voids or snapping between floors.
  const candidates=heights.filter(y=>Math.abs(y-previous)<.26);
  if(!candidates.length)return null;
  return candidates.sort((a,b)=>Math.abs(a-previous)-Math.abs(b-previous))[0];
}
export function canOccupy(x:number,y:number,z:number,colliders:Collider[]) {
  if(!Number.isFinite(x+y+z))return false;
  for(const box of colliders){
    if(y+EYE_HEIGHT+.08<=box.min.y||y+.08>=box.max.y)continue;
    const nearX=Math.max(box.min.x,Math.min(x,box.max.x));
    const nearZ=Math.max(box.min.z,Math.min(z,box.max.z));
    if((x-nearX)**2+(z-nearZ)**2<RADIUS**2)return false;
  }
  if(y>6.1&&inFootprint(x,z)&&y+EYE_HEIGHT+.07>atticCeiling(x,z))return false;
  const onStair=inRect(x,z,[STAIR.x0,STAIR.z0,STAIR.x1,STAIR.z1]);
  if(!onStair&&inFootprint(x,z))for(const l of LEVELS.slice(0,2)){const c=l.elevation+l.height;if(y<c-.1&&y+EYE_HEIGHT+.07>c)return false;}
  return true;
}
export function movePlayer(position:Vector3,dx:number,dz:number,colliders:Collider[]) {
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.06));
  for(let s=0;s<steps;s++)for(const axis of ['x','z'] as const){
    const x=position.x+(axis==='x'?dx/steps:0),z=position.z+(axis==='z'?dz/steps:0);
    const y=supportHeight(x,z,position.y);
    if(y!==null&&canOccupy(x,y,z,colliders))position.set(x,y,z);
  }
  return position;
}
