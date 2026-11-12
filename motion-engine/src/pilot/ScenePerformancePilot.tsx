import React from "react";
import {AbsoluteFill,useCurrentFrame} from "remotion";
import {evaluateMotion,MotionKey,validateScene} from "./motion";
import {PerformanceCue,evaluatePerformance,propPosition,validatePerformance} from "./performance";
import {IllustratedMotionActor} from "./IllustratedMotionActor";

const duration=600;
const host:MotionKey[]=[
 {frame:0,position:{x:470,y:750},state:"seated",facing:1},
 {frame:120,position:{x:470,y:750},state:"stand",facing:1},
 {frame:155,position:{x:470,y:750},state:"hold",facing:1},
 {frame:245,position:{x:870,y:750},state:"walk",facing:1},
 {frame:330,position:{x:870,y:750},state:"hold",facing:1},
 {frame:380,position:{x:870,y:750},state:"hold",facing:-1},
 {frame:470,position:{x:870,y:750},state:"hold",facing:-1},
 {frame:600,position:{x:870,y:750},state:"hold",facing:-1}
];
const guest:MotionKey[]=[
 {frame:0,position:{x:1150,y:750},state:"seated",facing:-1},
 {frame:600,position:{x:1150,y:750},state:"seated",facing:-1}
];
const prop={x:890,y:625};
const cues:PerformanceCue[]=[
 {start:5,end:100,actor:"guest",kind:"speak"},
 {start:5,end:100,actor:"host",kind:"listen",target:{x:1150,y:510}},
 {start:105,end:150,actor:"host",kind:"react"},
 {start:165,end:240,actor:"host",kind:"speak"},
 {start:255,end:298,actor:"host",kind:"pickup",propId:"card",target:prop},
 {start:300,end:350,actor:"host",kind:"speak"},
 {start:355,end:405,actor:"host",kind:"point",target:{x:1450,y:430}},
 {start:420,end:490,actor:"guest",kind:"speak"},
 {start:510,end:540,actor:"host",kind:"release",propId:"card"},
 {start:545,end:590,actor:"host",kind:"speak"}
];
validateScene(host,duration);validateScene(guest,duration);validatePerformance(cues,duration);
export const ScenePerformancePilot:React.FC=()=>{
 const frame=useCurrentFrame();
 const actors={host:evaluateMotion(host,frame),guest:evaluateMotion(guest,frame)};
 const h=evaluatePerformance(cues,frame,"host",actors.host);
 const g=evaluatePerformance(cues,frame,"guest",actors.guest);
 const card=propPosition(cues,frame,"card",prop,actors);
 const cameraX=frame<155?0:frame<260?(frame-155)/105*75:75;
 const speaker=frame<100?"GUEST":frame<420?"HOST":frame<490?"GUEST":"HOST";
 return <AbsoluteFill style={{backgroundColor:"#d7e1e6"}}>
  <svg viewBox="0 0 1920 1080" width="100%" height="100%">
   <g transform={`translate(${-cameraX} 0)`}>
    <rect width="2000" height="1080" fill="#d7e1e6"/>
    <rect y="750" width="2000" height="330" fill="#aebcc5"/>
    <rect x="1350" y="240" width="440" height="330" rx="12" fill="#f7f1e5" stroke="#29394b" strokeWidth="15"/>
    <text x="1390" y="340" fontSize="48" fill="#29394b" fontWeight="bold">THE REVEAL</text>
    <text x="1390" y="445" fontSize="64" fill="#ba663e" fontWeight="bold">WHO PAYS?</text>
    <rect x="770" y="645" width="265" height="24" rx="7" fill="#75573e"/>
    <path d="M 795 665 V 830 M 1010 665 V 830" stroke="#75573e" strokeWidth="18"/>
    <path d="M 1090 745 V 875 H 1190 M 420 745 V 875 H 520" fill="none" stroke="#45596a" strokeWidth="22"/>
    <IllustratedMotionActor motion={actors.host} kind="host" performance={h}/>
    <IllustratedMotionActor motion={actors.guest} kind="guest" performance={g}/>
    <g transform={`translate(${card.position.x} ${card.position.y})`}>
     <rect x="-32" y="-21" width="64" height="42" rx="5" fill="#f6d77a" stroke="#344252" strokeWidth="4"/>
     <path d="M -23 -8 H 22 M -23 2 H 9" stroke="#7c6634" strokeWidth="4"/>
    </g>
    <rect width="2000" height="112" fill="#172638"/>
    <text x="55" y="73" fill="#f1d99c" fontSize="42" fontWeight="bold">THE LINCOLN PENNY — PERFORMANCE TEST</text>
   </g>
  </svg>
  <div style={{position:"absolute",bottom:45,left:50,fontFamily:"sans-serif",fontSize:28,color:"#203448"}}>
   {speaker} • silent acting cue demo (synthetic mouth motion, no voice track)
  </div>
 </AbsoluteFill>;
};
