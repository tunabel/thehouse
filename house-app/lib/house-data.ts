/** Blueprint coordinates in metres: x runs across the long facade, z toward the entrance.
 * Measured source: blueprint.pdf, sheets 2/6–6/6. See MODEL_NOTES.md for approximations.
 */
export type Point = [number, number];
export type Rect = [number, number, number, number];
export type Opening = { offset: number; width: number; bottom: number; height: number; kind: 'door' | 'window' | 'passage' };
export type Wall = { id: string; a: Point; b: Point; thickness: number; exterior?: boolean; openings: Opening[] };
export type Room = { id: string; name: string; original: string; bounds: Rect; regions?: Rect[]; finish: 'oak' | 'tile'; area?: number };
export type Level = { id: string; name: string; short: string; elevation: number; height: number; rooms: Room[]; walls: Wall[]; spawn: Point };
export const WIDTH = 16.93;
export const DEPTH = 8;
export const EXTERIOR = .365;
export const FOOTPRINT: Point[] = [[0,0],[6.215,0],[6.215,-1.25],[10.715,-1.25],[10.715,0],[WIDTH,0],[WIDTH,8],[10.855,8],[10.855,9],[6.075,9],[6.075,8],[0,8]];
/** The stair has a straight lower run and a quarter-turn at its upper landing.
 * The envelope is retained for floor openings and navigation. */
export const STAIR = { x0: 6.44, x1: 7.70, z0: 4.45, z1: 8.50, steps: 17, turnStart: 5.62, landingDepth: .92 };
/** Shaft width from the bottom dimension chain, depth from the shaft annotation.
 * The 2.41 annotation belongs to the opening above the shaft, not shaft depth. */
export const LIFT: Rect = [7.615,5.965,9.175,7.635];
const win = (offset: number, width=1.01, bottom=1, height=1.29): Opening => ({offset,width,bottom,height,kind:'window'});
const door = (offset: number, width=.9, height=2.2): Opening => ({offset,width,bottom:0,height,kind:'door'});
const passage = (offset: number, width=1): Opening => ({offset,width,bottom:0,height:2.3,kind:'passage'});
function wall(id: string, a: Point, b: Point, openings: Opening[]=[], thickness=.175, exterior=false): Wall {
  return {id,a,b,openings,thickness,exterior};
}
function exterior(level: number): Wall[] {
  const h=level===0 ? 1.56:1.29;
  const f=level===0 ? 1.05:1;
  const low=level===2;
  return [
    wall('rear-left',[0,.1825],[6.215,.1825],low?[]:[win(1.8,1.01,level===0?1.05:0,level===0?h:2.56),win(3.8,1.01,0,2.56)],EXTERIOR,true),
    wall('rear-right',[10.715,.1825],[WIDTH,.1825],low?[]:[win(.38,1.01,0,2.56),win(2.55,1.01,level===0?1.05:0,level===0?h:2.56),win(4.25,1.01,f,h)],EXTERIOR,true),
    wall('rear-bay',[6.215,-1.0675],[10.715,-1.0675],low?[win(1.495,1.51,1,1.29)]:[win(.75,1.01,f,h),win(2.65,1.01,f,h)],EXTERIOR,true),
    wall('bay-left',[6.3975,-1.25],[6.3975,.365],[],EXTERIOR,true),
    wall('bay-right',[10.5325,-1.25],[10.5325,.365],[],EXTERIOR,true),
    wall('front-left',[0,7.8175],[6.075,7.8175],low?[]:[win(1.675,1.51,f,h),win(4.30,.76,f,h)],EXTERIOR,true),
    wall('front-right',[10.855,7.8175],[WIDTH,7.8175],low?[]:[win(.68,.76,f,h),win(2.15,1.0,f,h),win(4.35,1.0,f,h)],EXTERIOR,true),
    wall('entrance',[6.075,8.8175],[10.855,8.8175],level===0?[door(2.85,1.2,2.45)]:[win(.65,.76,1,1.29),win(3.15,.76,1,1.29)],EXTERIOR,true),
    wall('entry-left',[6.2575,8],[6.2575,9],[],EXTERIOR,true),
    wall('entry-right',[10.6725,8],[10.6725,9],[],EXTERIOR,true),
    wall('left',[.1825,0],[.1825,8],low?[]:level===0?[door(5.85,1.0)]:[win(2.88,2.01,1,1.29)],EXTERIOR,true),
    wall('right',[16.7475,0],[16.7475,8],low?[]:[win(1.6,1.01,f,h),win(5.55,1.01,f,h)],EXTERIOR,true),
  ];
}
function core(): Wall[] {
  return [
    wall('stair-left',[6.32,4.45],[6.32,8.635],[],.24),
    wall('stair-right',[7.5275,5.8775],[7.5275,7.81],[],.175),
    wall('lift-back',[7.44,5.8775],[9.35,5.8775],[],.175),
    wall('lift-right',[9.2625,5.8775],[9.2625,7.81],[],.175),
    wall('lift-front',[7.44,7.7225],[9.35,7.7225],[],.175),
    wall('lobby-right',[10.61,4.45],[10.61,8], [],.24),
  ];
}
export const LEVELS: Level[] = [
  {
    id:'ground',name:'Ground floor',short:'EG',elevation:.19,height:3.03,spawn:[9.92,8.22],
    rooms:[
      // The rear EG space is continuous across the building width; no decorative partition is maintained here.
      {id:'rear-room',name:'Rear room · full width',original:'Büro 09 / 07 / 03',bounds:[.365,.365,16.565,3.03],regions:[[.365,.365,16.565,3.03],[6.58,-.885,10.35,.365],[.365,3.03,5.675,4.55],[.365,4.55,3.775,7.635]],finish:'oak'},
      {id:'utility',name:'Utility room',original:'HAR 08',bounds:[3.95,4.65,6.20,7.635],finish:'tile',area:6.93},
      {id:'corridor-02',name:'Corridor',original:'Flur 02',bounds:[5.675,3.205,16.565,4.375],finish:'tile',area:5.84},
      {id:'kitchen-06',name:'Kitchen',original:'Küche 06',bounds:[12.74,4.45,16.565,7.635],finish:'oak',area:11.98},
      {id:'wc-05',name:'Bathroom',original:'WC 05',bounds:[10.855,4.65,12.54,7.635],finish:'tile',area:4.98},
      {id:'lobby',name:'Entrance hall',original:'Flur 01',bounds:[9.35,4.65,10.49,8.635],finish:'tile'},
      {id:'entry',name:'Entrance landing',original:'Eingang',bounds:[6.44,7.95,10.49,8.635],finish:'tile'},
    ],
    walls:[...exterior(0).filter(w=>w.id!=='left'),...core(),
      // Garage side dimension chain: opening begins at 4.895 m and spans 1.135 m.
      wall('garage-connection',[.1825,0],[.1825,8],[door(4.895,1.135)],EXTERIOR,true),
      wall('rear-corridor',[5.675,3.1175],[16.565,3.1175],[passage(2.38,1)],.175),
      wall('service-back',[3.775,4.4625],[6.32,4.4625],[door(1.2775,.9)]),
      wall('service-partition',[3.86,4.55],[3.86,7.635]),
      wall('lobby-back',[6.32,4.4625],[10.61,4.4625],[door(2,.9)]),
      wall('kitchen-back',[10.61,4.55],[16.565,4.55],[door(.5,.9),passage(3.6,1)]),
      wall('wc-kitchen',[12.64,4.55],[12.64,7.635],[],.2),
    ],
  },
  {
    id:'upper',name:'Upper floor',short:'OG',elevation:3.38,height:2.81,spawn:[9.92,8.2],
    rooms:[
      {id:'studio',name:'Studio',original:'ZBV 18',bounds:[.365,.365,4.65,7.635],regions:[[.365,.365,6.455,3.0525],[.365,3.0525,4.65,6.35],[.365,6.35,3.61,7.635]],finish:'oak',area:34.98},
      {id:'office-16',name:'Main office',original:'Chef 16',bounds:[6.58,-.885,10.35,3.05],finish:'oak',area:14.83},
      {id:'archive',name:'Archive',original:'Archiv 15',bounds:[10.475,.365,12.09,3.0525],finish:'oak',area:4.48},
      {id:'accounting',name:'Office',original:'Buchhaltung 14',bounds:[12.24,.365,16.565,3.0525],finish:'oak',area:11.78},
      {id:'hall',name:'Hallway',original:'Flur 11',bounds:[4.8,3.23,13.25,4.45],finish:'oak',area:11.31},
      {id:'meeting',name:'Meeting room',original:'Besprechung 13',bounds:[13.45,3.23,16.565,7.635],finish:'oak',area:13.30},
      {id:'wc-west',name:'Bathroom · west',original:'Herren-WC 17',bounds:[4.775,4.6375,6.2,7.635],regions:[[4.775,4.6375,6.2,6.475],[3.735,6.475,6.2,7.635]],finish:'tile',area:4.85},
      {id:'wc-east',name:'Bathroom · east',original:'Damen-WC 12',bounds:[10.855,4.65,13.25,7.635],finish:'tile',area:7.35},
      {id:'lobby',name:'Stair hall',original:'Flur 10',bounds:[9.35,4.65,10.49,8.635],finish:'tile'},
      {id:'entry',name:'Landing',original:'Treppenpodest',bounds:[6.44,7.95,10.49,8.635],finish:'tile'},
    ],
    walls:[...exterior(1),...core(),
      wall('office-left',[6.5175,.365],[6.5175,3.14],[],.125),
      wall('office-right',[10.4125,.365],[10.4125,3.14],[],.125),
      wall('archive-right',[12.165,.365],[12.165,3.14],[],.15),
      wall('office-front',[6.5175,3.14],[16.565,3.14],[door(.6625),door(4.4775,.9),door(5.9975,.9)],.175),
      wall('studio-hall-back',[4.65,3.14],[6.455,3.14]),
      wall('studio-hall-left',[4.7125,3.14],[4.7125,6.4125],[door(.2,.9)],.125),
      wall('wc-west-notch-back',[3.61,6.4125],[4.775,6.4125],[],.125),
      wall('wc-west-notch-left',[3.6725,6.4125],[3.6725,7.635],[],.125),
      wall('lobby-back',[6.32,4.55],[10.61,4.55],[door(1.82,1.135)]),
      wall('wc-west-back',[4.65,4.55],[6.32,4.55],[door(.35,.85)]),
      wall('wc-east-back',[10.61,4.55],[13.35,4.55],[door(.45,.9)]),
      wall('meeting-left',[13.35,3.14],[13.35,7.635],[door(.35,.9)],.2),
    ],
  },
  {
    id:'attic',name:'Attic floor',short:'DG',elevation:6.35,height:2.58,spawn:[6.94,4.04],
    rooms:[
      {id:'living',name:'Living & kitchen',original:'Wohnen / Essen / Küche 28',bounds:[.365,.365,6.20,7.635],finish:'oak',area:40.30},
      {id:'bedroom-01',name:'Bedroom 01',original:'Kind 01 · 27',bounds:[6.58,-.885,10.35,3.14],finish:'oak',area:14.57},
      {id:'bedroom-02',name:'Bedroom 02',original:'Kind 02 · 26',bounds:[10.72,.365,16.565,3.14],finish:'oak',area:15.28},
      {id:'bedroom-main',name:'Main bedroom',original:'Schlafen 25',bounds:[13.165,3.32,16.565,7.635],finish:'oak',area:15.30},
      {id:'bath',name:'Bathroom',original:'Bad 24',bounds:[10.855,4.65,13.015,7.635],finish:'tile',area:6.16},
      {id:'wc',name:'WC & laundry',original:'WC 23',bounds:[9.35,5.3,10.49,8.635],finish:'tile',area:4.66},
      {id:'hall',name:'Hallway',original:'Flur 21',bounds:[6.44,3.32,13.015,4.45],finish:'oak',area:9.04},
      {id:'entry',name:'Stair landing',original:'Diele 22',bounds:[6.44,7.95,10.49,8.635],finish:'tile',area:3.32},
    ],
    walls:[...exterior(2),...core(),
      wall('living-right',[6.285,.365],[6.285,4.45],[door(3.0,.9)],.175),
      wall('bedroom-center-right',[10.53,.365],[10.53,3.23],[],.365),
      wall('bedrooms-front',[6.32,3.23],[16.565,3.23],[door(2.93,.9),door(5.065,.9)],.175),
      wall('bedroom-main-left',[13.09,3.23],[13.09,7.635],[door(.3,.9)],.15),
      wall('bath-back',[10.61,4.55],[13.09,4.55],[door(.3,.9)]),
      wall('laundry-back',[9.35,4.55],[10.61,4.55],[door(.29,.9)],.125),
      wall('stair-hall-back',[6.32,4.55],[9.35,4.55],[door(.45,.9)],.175),
    ],
  },
];

export const ASSUMPTIONS = [
  'The PDF describes the planned building; later changes made on site are not included.',
  'Written dimensions set the scale. Undimensioned partition positions are traced approximately from photographed sheets.',
  'The ground-floor rear room is continuous across the house width. Its old office labels are retained only as source references.',
  'The stair uses a shared 1.26 m envelope with a quarter-turn and landing. Individual winder geometry and handrail detailing remain approximate.',
  'Stair navigation is not verified: the existing turn has a height discontinuity. Use the floor buttons to move between levels.',
  'The lift shaft is 1.56 m wide by 1.67 m deep. The earlier 2.41 m interpretation was an opening dimension above the shaft. The side passage is 1.14 m clear.',
  'EG utility/corridor walls, OG office/archive partitions and stepped west WC, and DG bedroom/hall doors were rechecked against sheets 2/6–4/6. Undimensioned offsets and door swing directions remain approximate.',
  'Room areas labeled “sheet” reproduce source annotations; they are not calculated or certified floor areas. Model dimension tables distinguish geometry values from source annotations.',
  'Ground, upper and attic finished floors are +0.19 m, +3.38 m and +6.35 m. The attic section also shows +6.35 m; one plan annotation reads +6.350 m.',
  'The main roof follows the indicated 42° pitch. Dormer joins, skylight positions and trim details are simplified.',
  'Paint, wood, roof finish and lighting are visualization defaults, not confirmed selections.',
  'The lift is represented as a closed shaft; the garage and balconies have simplified finishes. Exterior spiral escape stairs are deferred.',
  'Ground plane and entry approach are illustrative; no garden or neighboring buildings are modeled yet.',
];
