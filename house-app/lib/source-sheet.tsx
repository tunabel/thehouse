'use client';
import { useState } from 'react';
import { LEVELS } from './house-data';
export function SourceSheet({floor}:{floor:number}){
  const [zoom,setZoom]=useState(1),[missing,setMissing]=useState(false),[full,setFull]=useState(false);
  return <section className="source-sheet" aria-label="Original drawing"><header className="comparison-pane-head"><strong>Original drawing · sheet {floor+2}/6 · {LEVELS[floor].short}</strong><div><button onClick={()=>{setFull(!full);setMissing(false);setZoom(1);}}>{full?'Plan crop':'Full sheet'}</button><button onClick={()=>setZoom(Math.max(1,zoom-.5))} aria-label="Zoom out original">−</button><button onClick={()=>setZoom(Math.min(5,zoom+.5))} aria-label="Zoom in original">+</button></div></header><div className="source-scroll">{missing?<p>Local drawing unavailable. Place blueprint.pdf in the project root and run <code>npm run references</code> in house-app to prepare the private sheets.</p>:/* eslint-disable-next-line @next/next/no-img-element */
    <img src={`/local-references/${full?'sheet':'plan'}-${floor+1}.png`} alt={`Original ${LEVELS[floor].name} architectural drawing${full?'':' · plan crop'}`} onError={()=>setMissing(true)} style={{width:`${zoom*100}%`,height:zoom===1?'100%':'auto',objectFit:'contain',maxWidth:'none'}}/>}</div></section>;
}
