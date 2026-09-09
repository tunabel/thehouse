'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Box, Check, ChevronDown, ChevronRight, Compass, Footprints, House, Info, Layers3, Maximize, Minus, Mouse, Plus, RotateCcw, X } from 'lucide-react';
import { ASSUMPTIONS, LEVELS } from '@/lib/house-data';
import { DigitalBlueprint } from '@/lib/digital-blueprint';
import type { Viewer, ViewerState, ViewMode } from '@/lib/viewer';

const INITIAL:ViewerState={mode:'orbit',floor:0,roof:true,isolated:false,locked:false,room:'Entire house',fps:60,position:[0,0,0]};
export default function Home(){
  const mount=useRef<HTMLDivElement>(null),viewer=useRef<Viewer|null>(null);
  const [state,setState]=useState(INITIAL),[ready,setReady]=useState(false),[error,setError]=useState(''),[help,setHelp]=useState(false),[notes,setNotes]=useState(false),[blueprint,setBlueprint]=useState(false);
  useEffect(()=>{
    let active=true;let instance:Viewer|null=null;
    import('@/lib/viewer').then(({createViewer})=>{if(!active||!mount.current)return;try{instance=createViewer(mount.current,s=>{if(active)setState(s);});viewer.current=instance;setReady(true);}catch(e){setError(e instanceof Error?e.message:'Unable to start the 3D view.');}}).catch(()=>setError('The 3D viewer could not load. Please reload the page.'));
    return ()=>{active=false;instance?.dispose();viewer.current=null;};
  },[]);
  const switchMode=(mode:ViewMode)=>{setBlueprint(false);viewer.current?.setMode(mode);};
  const selectFloor=(floor:number)=>viewer.current?.setFloor(floor);
  const showBlueprint=()=>{viewer.current?.setMode('plan');setBlueprint(true);};
  return <main className={`app ${state.locked?'is-walking':''}`}>
    <header className="header">
      <Link className="brand" href="/" aria-label="The House home"><span className="brand-mark"><House size={19} strokeWidth={1.6}/></span><span>the house<span className="brand-dot">.</span></span></Link>
      <div className="project-name"><span className="project-divider"/>Böhlen residence <ChevronDown size={13}/><span className="local-badge"><i/> Local project</span></div>
      <div className="header-right"><span className="milestone">01 <span>/</span> House explorer</span><button className="icon-button" aria-label="Model information" onClick={()=>setNotes(true)}><Info size={18}/></button></div>
    </header>
    <section className="workspace" aria-label="House explorer">
      <div className="scene" ref={mount}/>
      <div className="scene-heading"><span className="eyebrow">YOUR SPACE, BEFORE YOU STEP INSIDE</span><h1>A place to imagine.</h1><p>Explore your house, one room at a time.</p></div>
      <div className="view-tag"><span className="live-dot"/>{blueprint?`Digital blueprint · ${LEVELS[state.floor].short}`:state.mode==='walk'?state.room:state.mode==='plan'?LEVELS[state.floor].name:state.isolated?LEVELS[state.floor].name:'Entire house'}<span className="view-tag-detail">{blueprint?'Shared building data':state.mode==='walk'?'Eye level':state.mode==='plan'?'Top view':'3D view'}</span></div>
      <aside className="floor-panel">
        <div className="panel-heading"><Layers3 size={16}/><span>Explore the floors</span><span className="count">03</span></div>
        <button disabled={!ready} className={`whole-house ${!state.isolated&&state.mode!=='walk'?'selected':''}`} onClick={()=>viewer.current?.reset()}><Box size={18}/><span>Entire house<small>The complete picture</small></span>{!state.isolated&&state.mode!=='walk'?<Check size={15}/>:<ChevronRight size={15}/>}</button>
        <div className="floor-list">{[2,1,0].map(i=><button key={i} disabled={!ready} className={`floor-button ${(state.isolated||state.mode==='walk'||blueprint)&&state.floor===i?'selected':''}`} onClick={()=>selectFloor(i)}><span className="floor-number">0{i}</span><span>{LEVELS[i].name}<small>{i===2?'Living spaces & bedrooms':i===1?'Studio & meeting rooms':'Rear room & entrance'}</small></span><span className="level-code">{LEVELS[i].short}</span></button>)}</div>
        <div className="panel-separator"/>
        <label className={`roof-option ${state.mode==='walk'||state.isolated?'muted':''}`}><span>Show roof</span><input type="checkbox" checked={state.roof&&!state.isolated} disabled={!ready||state.mode==='walk'||state.isolated} onChange={e=>viewer.current?.setRoof(e.target.checked)}/><span className="toggle"/></label>
        <button className="enter-button" disabled={!ready} onClick={()=>viewer.current?.enter()}><Footprints size={17}/>{state.mode==='walk'?'Continue walking':'Step inside'}<ArrowUpRight size={17}/></button>
      </aside>
      <div className="right-tools"><button className="icon-button" aria-label="Zoom in" disabled={!ready||state.mode==='walk'} onClick={()=>viewer.current?.zoom(1.18)}><Plus size={19}/></button><button className="icon-button" aria-label="Zoom out" disabled={!ready||state.mode==='walk'} onClick={()=>viewer.current?.zoom(1/1.18)}><Minus size={19}/></button><span/><button className="icon-button" aria-label="Reset view" disabled={!ready} onClick={()=>viewer.current?.reset()}><RotateCcw size={17}/></button><button className="icon-button" aria-label="Fullscreen" onClick={()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>setHelp(true));}}><Maximize size={17}/></button></div>
      <div className="orientation"><Compass size={35} strokeWidth={1}/><span>E <span>· Entrance</span></span></div>
      {state.mode==='walk'&&<div className="crosshair" aria-hidden="true"/>}
      {blueprint&&<DigitalBlueprint floor={state.floor}/>} 
      {state.mode==='walk'&&!state.locked&&ready&&<div className="walk-prompt"><Footprints size={22}/><h2>Make yourself at home.</h2><p>Click below to look around with your mouse.<br/>Use W A S D to walk. Press Esc to pause.</p><button className="enter-button" onClick={()=>viewer.current?.enter()}>Start walking <ArrowUpRight size={17}/></button></div>}
      {!ready&&!error&&<div className="loading"><span className="spinner"/><strong>Preparing your house</strong><span>Building the spaces from your blueprint…</span></div>}
      {error&&<div className="walk-prompt error" role="alert"><h2>The 3D view couldn’t start.</h2><p>Use a desktop browser with WebGL and hardware acceleration enabled.</p><details><summary>Details</summary>{error}</details><button className="enter-button" onClick={()=>window.location.reload()}>Try again</button></div>}
      <div className="bottom-center"><nav className="mode-switch" aria-label="View mode">{([{id:'orbit',label:'Orbit',Icon:Box},{id:'walk',label:'Walk',Icon:Footprints},{id:'plan',label:'Floor plan',Icon:Layers3}] as const).map(({id,label,Icon})=><button disabled={!ready} key={id} aria-pressed={!blueprint&&state.mode===id} className={!blueprint&&state.mode===id?'active':''} onClick={()=>switchMode(id)}><Icon size={16}/>{label}</button>)}<button disabled={!ready} aria-pressed={blueprint} className={blueprint?'active':''} onClick={showBlueprint}><Compass size={16}/>Blueprint</button></nav><div className="navigation-hint">{blueprint?<><Layers3 size={13}/> Compare the measured digital plan with the source sheet</>:state.mode==='walk'?<><span className="key-group">W A S D</span> Move <span className="hint-dot">·</span> Mouse to look <span className="hint-dot">·</span> Esc to pause</>:state.mode==='plan'?<><Layers3 size={13}/> Select a floor to explore its layout <span className="hint-dot">·</span> + / − to zoom</>:<><Mouse size={14}/> Drag to orbit <span className="hint-dot">·</span> Scroll to zoom <span className="hint-dot">·</span> Right-drag to pan</>}</div></div>
      <button className="help-button" onClick={()=>setHelp(true)} aria-label="Navigation help">?</button>
    </section>
    <footer className="footer"><span><span className="status-dot"/>{ready?'Model ready':'Loading model'}<span className="footer-divider"/>Based on your architectural drawings</span><button onClick={()=>setNotes(true)}>Model notes <ArrowUpRight size={12}/></button><span className="footer-meta">3 levels <span>·</span> Metric <span>·</span> Structure fixed</span></footer>
    {(help||notes)&&<div className="modal-backdrop" onClick={()=>{setHelp(false);setNotes(false);}}><section className="modal" role="dialog" aria-modal="true" aria-label={help?'Navigation guide':'About this model'} onClick={e=>e.stopPropagation()}><button autoFocus className="icon-button modal-close" aria-label="Close dialog" onClick={()=>{setHelp(false);setNotes(false);}}><X size={19}/></button><span className="eyebrow">THE HOUSE / {help?'GETTING AROUND':'MODEL NOTES'}</span><h2>{help?'A little room to explore.':'Built from your blueprint.'}</h2>{help?<><p>Switch between an exterior overview, an eye-level walkthrough, and a top-down floor plan.</p><div className="help-row"><Box size={21}/><div><strong>Orbit</strong><p>Drag to rotate, scroll to zoom, and right-drag to pan. Select a floor to reveal its interior.</p></div></div><div className="help-row"><Footprints size={21}/><div><strong>Walk</strong><p>Click “Start walking”, then use WASD or arrow keys. Move the mouse to look; hold Shift to move faster. Esc pauses walking.</p></div></div><div className="help-row"><ArrowDown size={21}/><div><strong>Move between floors</strong><p>Walk up the central stairs or use the floor buttons. Reset view returns you to the exterior.</p></div></div><p className="note">Desktop controls are required for this first version.</p></>:<><p>A reconstruction of the completed building, using the five provided drawing sheets. The current construction photo is retained as a reference for a future garden and neighborhood scene.</p><ul className="notes-list">{ASSUMPTIONS.map(n=><li key={n}>{n}</li>)}</ul><p className="note">Next: room finishes, a furniture catalog, then the surrounding site. This version explores the fixed structure.</p></>}</section></div>}
  </main>;
}
