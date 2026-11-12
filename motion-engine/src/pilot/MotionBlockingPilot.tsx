import React from "react";
import {AbsoluteFill,useCurrentFrame} from "remotion";
import {evaluateMotion,MotionKey,validateScene} from "./motion";
import {IllustratedMotionActor} from "./IllustratedMotionActor";
const host:MotionKey[]=[
 {frame:0,position:{x:500,y:740},state:"seated",facing:1},
 {frame:180,position:{x:500,y:740},state:"seated",facing:1},
 {frame:210,position:{x:500,y:740},state:"stand",facing:1},
 {frame:250,position:{x:500,y:740},state:"hold",facing:1},
 {frame:370,position:{x:1140,y:740},state:"walk",facing:1},
 {frame:440,position:{x:1140,y:740},state:"reach",facing:1,target:{x:1370,y:420}},
 {frame:530,position:{x:1140,y:740},state:"hold",facing:-1},
 {frame:600,position:{x:1140,y:740},state:"hold",facing:-1}
];
const guest:MotionKey[]=[
 {frame:0,position:{x:820,y:740},state:"seated",facing:-1},
 {frame:330,position:{x:820,y:740},state:"seated",facing:-1},
 {frame:600,position:{x:820,y:740},state:"seated",facing:-1}
];
validateScene(host,600);validateScene(guest,600);
export const MotionBlockingPilot:React.FC=()=>{
 const frame=useCurrentFrame();
 const a=evaluateMotion(host,frame),b=evaluateMotion(guest,frame);
 const cameraX=frame<260?0:frame<430?(frame-260)/170*100:100;
 return <AbsoluteFill style={{background:"#d9e1e6",overflow:"hidden"}}>
  <svg viewBox="0 0 1920 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
   <g transform={`translate(${-cameraX} 0)`}>
    <rect width="1920" height="1080" fill="#d9e1e6"/>
    <path d="M 0 740 H 1920 V 1080 H 0 Z" fill="#b5bfc4"/>
    <rect x="1220" y="220" width="460" height="380" rx="12" fill="#f6f4e9" stroke="#334456" strokeWidth="18"/>
    <text x="1270" y="320" fontSize="48" fontWeight="700" fill="#253747">THE NUMBERS</text>
    <text x="1270" y="420" fontSize="76" fontWeight="800" fill="#c26a32">80%?</text>
    <rect x="390" y="710" width="520" height="28" rx="10" fill="#7b563c"/>
    <path d="M 435 730 V 910 M 870 730 V 910" stroke="#6a4834" strokeWidth="20"/>
    <path d="M 455 740 V 865 H 530 M 770 740 V 865 H 840" fill="none" stroke="#46596a" strokeWidth="25" strokeLinecap="round"/>
    <IllustratedMotionActor motion={a} kind="host"/><IllustratedMotionActor motion={b} kind="guest"/>
    <rect x="0" y="0" width="1920" height="110" fill="#152331"/>
    <text x="85" y="73" fontSize="42" fill="#f2dca7" fontWeight="700">THE LINCOLN PENNY — MOTION BLOCKING TEST</text>
   </g>
  </svg>
  <div style={{position:"absolute",bottom:35,left:45,color:"#253747",fontSize:25,fontFamily:"sans-serif"}}>Silent motion prototype • not approved character artwork • no audio</div>
 </AbsoluteFill>;
};
