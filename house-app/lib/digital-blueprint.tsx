import { LEVELS, LIFT, STAIR, WIDTH, type Level, type Opening, type Wall } from './house-data';

const scale=1;
function openingPoint(w:Wall,o:Opening){
  const alongX=Math.abs(w.b[0]-w.a[0])>Math.abs(w.b[1]-w.a[1]);
  const t=(o.offset+o.width/2)*scale;
  return alongX?[w.a[0]+t,w.a[1]]:[w.a[0],w.a[1]+t];
}
function WallLine({wall}:{wall:Wall}){
  return <g>
    <line className={wall.exterior?'bp-wall bp-exterior':'bp-wall'} x1={wall.a[0]} y1={wall.a[1]} x2={wall.b[0]} y2={wall.b[1]}/>
    {wall.openings.map((opening,i)=>{
      const [x,y]=openingPoint(wall,opening);const alongX=Math.abs(wall.b[0]-wall.a[0])>Math.abs(wall.b[1]-wall.a[1]);
      return <g key={i}>
        <line className="bp-opening" x1={alongX?x-opening.width/2:x} y1={alongX?y:y-opening.width/2} x2={alongX?x+opening.width/2:x} y2={alongX?y:y+opening.width/2}/>
        {opening.kind==='door'&&<circle className="bp-door" cx={x} cy={y} r={opening.width/2}/>} 
      </g>;
    })}
  </g>;
}
function roomCenter(bounds:[number,number,number,number]){return [(bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2] as const;}
export function DigitalBlueprint({floor}:{floor:number}){
  const level:Level=LEVELS[floor];
  const title=`Digital ${level.name} blueprint`;
  return <section className="blueprint" aria-label={title}>
    <div className="blueprint-head"><div><span className="eyebrow">MEASURED MODEL / DIGITAL BLUEPRINT</span><h2>{level.name}</h2></div><span>{level.short} · 1:100 reference</span></div>
    <svg viewBox="-4 -2 25 14" role="img" aria-label={`${title}, generated from the same room and wall data as the 3D model`}>
      <rect className="bp-paper" x="-4" y="-2" width="25" height="14"/>
      {level.rooms.map(room=>{const [x,y]=roomCenter(room.bounds);return <g key={room.id}><rect className={`bp-room ${room.finish}`} x={room.bounds[0]} y={room.bounds[1]} width={room.bounds[2]-room.bounds[0]} height={room.bounds[3]-room.bounds[1]}/><text className="bp-room-name" x={x} y={y-.12}>{room.name}</text><text className="bp-room-ref" x={x} y={y+.18}>{room.original}</text></g>;})}
      {floor===0&&<g><rect className="bp-garage" x="-3.6" y="0" width="3.6" height="8"/><text className="bp-room-name" x="-1.8" y="3.8">Garage</text><text className="bp-room-ref" x="-1.8" y="4.1">G 01 · 26.36 m²</text></g>}
      {level.walls.map(wall=><WallLine key={wall.id} wall={wall}/>) }
      <rect className="bp-lift" x={LIFT[0]} y={LIFT[1]} width={LIFT[2]-LIFT[0]} height={LIFT[3]-LIFT[1]}/>
      <text className="bp-core-label" x={(LIFT[0]+LIFT[2])/2} y={(LIFT[1]+LIFT[3])/2}>Lift<tspan x={(LIFT[0]+LIFT[2])/2} dy=".28">1.67 × 2.41 m</tspan></text>
      <path className="bp-stair" d={`M ${STAIR.x0} ${STAIR.z1} L ${STAIR.x1} ${STAIR.z1} L ${STAIR.x1} ${STAIR.turnStart+.36} Q ${STAIR.x1} ${STAIR.turnStart} ${STAIR.x0+.15} ${STAIR.turnStart} L ${STAIR.x0} ${STAIR.turnStart}`}/>
      <text className="bp-core-label" x={(STAIR.x0+STAIR.x1)/2} y="7.4">Turning stair</text>
      <g className="bp-dimension"><line x1="0" y1="-1.15" x2={WIDTH} y2="-1.15"/><line x1="0" y1="-1.35" x2="0" y2="-.95"/><line x1={WIDTH} y1="-1.35" x2={WIDTH} y2="-.95"/><text x={WIDTH/2} y="-1.3">16.93 m overall width</text></g>
      {floor===0&&<text className="bp-note" x="-3.25" y="8.65">Garage connection · 1.00 m T30 door</text>}
    </svg>
    <p>Room boundaries, openings, lift clearance, and stair envelope come from the same building data used by the 3D model.</p>
  </section>;
}
