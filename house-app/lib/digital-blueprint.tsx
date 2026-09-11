'use client';
import { useState } from 'react';
import { FOOTPRINT, LEVELS, LIFT, STAIR, WIDTH, type Wall } from './house-data';
const number=(n:number)=>Number(n.toFixed(3)).toString();
function Dimension({a,b,y}:{a:number;b:number;y:number}){
  return <g className="bp-dimension"><path d={`M ${a} ${y-.12} v .24 M ${a} ${y} H ${b} M ${b} ${y-.12} v .24`}/><text x={(a+b)/2} y={y-.1}>{number(b-a)}</text></g>;
}
function WallLine({wall:w}:{wall:Wall}){
  const horizontal=Math.abs(w.b[0]-w.a[0])>Math.abs(w.b[1]-w.a[1]);
  const length=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]);
  const point=(t:number)=>[w.a[0]+(horizontal?t:0),w.a[1]+(horizontal?0:t)];
  let cursor=0;const solids: [number,number][]=[];
  for(const o of [...w.openings].sort((a,b)=>a.offset-b.offset)){solids.push([cursor,o.offset]);cursor=o.offset+o.width;}
  solids.push([cursor,length]);
  return <g><title>{w.id} · thickness {number(w.thickness)} m</title>
    {solids.filter(([a,b])=>b>a).map(([a,b])=>{const p=point(a),q=point(b);return <line key={a} className="bp-wall" style={{strokeWidth:w.thickness}} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]}/>;})}
    {w.openings.map((o,i)=>{const p=point(o.offset),q=point(o.offset+o.width),x=(p[0]+q[0])/2,y=(p[1]+q[1])/2;return <g key={i}>
      {o.kind==='window'?<line className="bp-window" x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]}/>:o.kind==='door'?<path className="bp-door" d={horizontal?`M ${p[0]} ${p[1]} v ${o.width} A ${o.width} ${o.width} 0 0 0 ${q[0]} ${q[1]}`:`M ${p[0]} ${p[1]} h ${o.width} A ${o.width} ${o.width} 0 0 1 ${q[0]} ${q[1]}`}/>:null}
      <text className="bp-opening-label" transform={`translate(${x+(horizontal?0:.24)} ${y+(horizontal?-.25:0)}) rotate(${horizontal?0:-90})`}>{number(o.width)}</text>
    </g>;})}
  </g>;
}
export function DigitalBlueprint({floor}:{floor:number}){
  const level=LEVELS[floor], [zoom,setZoom]=useState(1),[details,setDetails]=useState(false);
  const chains=floor===1?[0,.365,6.455,6.58,10.35,10.475,12.09,12.24,16.565,WIDTH]:[0,6.215,6.58,10.35,10.715,WIDTH];
  return <section className="blueprint" aria-label={`Digital ${level.name} blueprint`}>
    <header className="comparison-pane-head"><strong>Digital plan · {level.short}</strong><div><button onClick={()=>setZoom(Math.max(1,zoom-.5))} aria-label="Zoom out digital plan">−</button><button onClick={()=>setZoom(Math.min(4,zoom+.5))} aria-label="Zoom in digital plan">+</button><button onClick={()=>setDetails(!details)} aria-expanded={details}>Dimensions</button></div></header>
    <div className="plan-scroll"><svg style={{width:`${zoom*100}%`,height:zoom===1?'100%':'auto'}} viewBox="-4.3 -3 23.7 14.7" role="img" aria-label={`${level.short} walls, door swings, windows and dimensions in metres`}>
      <polygon points={FOOTPRINT.map(p=>p.join(',')).join(' ')} fill="#f6f4ed"/>
      {level.rooms.map(r=><g key={r.id}>{(r.regions??[r.bounds]).map((b,i)=><rect key={i} x={b[0]} y={b[1]} width={b[2]-b[0]} height={b[3]-b[1]} fill={r.finish==='tile'?'#e9eee7':'#f2ede3'}/>)}</g>)}
      {floor===0&&<><rect x="-3.6" y="0" width="3.6" height="8" fill="#e7e5de" stroke="#405044" strokeWidth=".12"/><text className="bp-room-name" x="-1.8" y="3">Garage</text><text className="bp-room-ref" x="-1.8" y="3.4">26.36 m² (sheet)</text><Dimension a={-3.6} b={0} y={9.8}/></>}
      {level.walls.map(w=><WallLine key={w.id} wall={w}/>)}
      {level.rooms.map(r=>{const b=r.bounds,x=(b[0]+b[2])/2,y=(b[1]+b[3])/2;return <g key={r.id}><text className="bp-room-name" x={x} y={y-.18}>{r.original}</text><text className="bp-room-ref" x={x} y={y+.13}>{r.area?`${number(r.area)} m² (sheet)`:`${number(b[2]-b[0])} × ${number(b[3]-b[1])} m*`}</text></g>;})}
      <rect x={LIFT[0]} y={LIFT[1]} width={LIFT[2]-LIFT[0]} height={LIFT[3]-LIFT[1]} fill="#dce4df"/>
      <text className="bp-core-label" x={(LIFT[0]+LIFT[2])/2} y={(LIFT[1]+LIFT[3])/2}>Lift<tspan x={(LIFT[0]+LIFT[2])/2} dy=".3">{number(LIFT[2]-LIFT[0])} × {number(LIFT[3]-LIFT[1])}</tspan></text>
      <rect x={STAIR.x0} y={STAIR.z0} width={STAIR.x1-STAIR.x0} height={STAIR.z1-STAIR.z0} fill="none" stroke="#8a7560" strokeWidth=".025" strokeDasharray=".1 .06"/>
      <text className="bp-core-label" transform={`translate(${STAIR.x0+.35} 6.8) rotate(-90)`}>Stair · approximate</text>
      <Dimension a={0} b={WIDTH} y={-2.45}/>
      {chains.slice(0,-1).map((a,i)=><Dimension key={a} a={a} b={chains[i+1]} y={i%2===0?-1.8:-2.1}/>)}
      <Dimension a={0} b={6.075} y={9.8}/><Dimension a={6.075} b={10.855} y={9.8}/><Dimension a={10.855} b={WIDTH} y={9.8}/>
      <g transform="translate(18.1 0) rotate(90)"><Dimension a={-1.25} b={9} y={-.65}/><Dimension a={0} b={8} y={0}/><Dimension a={-1.25} b={0} y={.6}/><Dimension a={8} b={9} y={.6}/></g>
      <text className="bp-note" x="7" y="10.65">Dimensions: model metres · areas marked “sheet”: source annotations</text>
    </svg></div>
    {details&&<div className="dimension-table"><p>Coordinates and openings below are model values. Traced positions remain approximate; compare with the original above. Room extents are bounding dimensions, not surveyed clear dimensions.</p><table aria-label="Room dimensions"><thead><tr><th>Room</th><th>Model extents (m)</th><th>Source area (m²)</th></tr></thead><tbody>{level.rooms.map(r=><tr key={r.id}><td>{r.original}</td><td>{number(r.bounds[2]-r.bounds[0])} × {number(r.bounds[3]-r.bounds[1])}</td><td>{r.area??'—'}</td></tr>)}</tbody></table><table aria-label="Wall dimensions"><thead><tr><th>Wall</th><th>Start (x, z)</th><th>End (x, z)</th><th>Thickness</th><th>Openings</th></tr></thead><tbody>{level.walls.map(w=><tr key={w.id}><td>{w.id}</td><td>{w.a.map(number).join(', ')}</td><td>{w.b.map(number).join(', ')}</td><td>{number(w.thickness)}</td><td>{w.openings.map(o=>`${o.kind} ${number(o.width)}`).join('; ')||'—'}</td></tr>)}</tbody></table></div>}
  </section>;
}
