import assert from 'node:assert/strict';
import { LEVELS, LIFT, type Rect } from '../lib/house-data';
import { buildHouse, inRect } from '../lib/house-model';
import { canOccupy, supportHeight, stairHeight } from '../lib/navigation';

// Only texture painting is stubbed. Meshes, collision boxes and navigation use production code.
Object.defineProperty(globalThis,'document',{value:{createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){}})})}});
const house=buildHouse();
for(const level of LEVELS)for(const wall of level.walls){
  let end=0;const length=Math.hypot(wall.b[0]-wall.a[0],wall.b[1]-wall.a[1]);
  for(const o of [...wall.openings].sort((a,b)=>a.offset-b.offset)){
    assert(o.offset>=end&&o.offset+o.width<=length+1e-6,`${level.id}/${wall.id}: opening outside wall or overlapping`);
    end=o.offset+o.width;
  }
}
assert(Math.abs(LIFT[2]-LIFT[0]-1.56)<1e-6);
assert(Math.abs(LIFT[3]-LIFT[1]-1.67)<1e-6);
const reports=[];
for(const level of LEVELS){
  const step=.1, start=level.spawn;
  const queue:[[number,number]]=[start],seen=new Set<string>();
  const usable=(x:number,z:number)=>canOccupy(x,level.elevation,z,house.colliders)&&Math.abs((supportHeight(x,z,level.elevation)??-100)-level.elevation)<.025;
  assert(usable(...start),`${level.id} spawn is blocked`);
  for(let i=0;i<queue.length;i++){
    const [x,z]=queue[i];
    for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]){
      const nx=x+dx,nz=z+dz,key=`${nx.toFixed(2)},${nz.toFixed(2)}`;
      if(nx< -3.4||nx>17||nz< -1.3||nz>9||seen.has(key))continue;
      seen.add(key);if(usable(nx,nz))queue.push([nx,nz]);
    }
  }
  const reaches=(regions:Rect[])=>queue.some(p=>regions.some(r=>inRect(...p,r,.2)));
  const rooms=level.rooms.map(r=>({room:r.id,reachable:reaches(r.regions??[r.bounds])}));
  assert(rooms.every(r=>r.reachable),`${level.id}: inaccessible rooms ${rooms.filter(r=>!r.reachable).map(r=>r.room).join(', ')}`);
  if(level.id==='ground')assert(reaches([[-3.4,.2,-.2,7.8]]),'Garage is not reachable through the house door');
  reports.push({floor:level.short,rooms,reachableCells:queue.length});
}
// Report the pre-existing turn discontinuity rather than hiding it with endpoint-only assertions.
const before=stairHeight(6.6,5.621,0),after=stairHeight(6.6,5.619,0);
console.log(JSON.stringify({floorAccess:reports,stairTurnHeightJump:before!==null&&after!==null?Math.abs(after-before):null},null,2));
house.dispose();
