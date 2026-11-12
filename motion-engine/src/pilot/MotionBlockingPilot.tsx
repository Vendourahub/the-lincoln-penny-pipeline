import React from "react";
import {AbsoluteFill,useCurrentFrame} from "remotion";
import {evaluateMotion,MotionKey,ActorFrame,validateScene} from "./motion";
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
function Actor({motion,kind}:{motion:ActorFrame;kind:"host"|"guest"}){
 const isHost=kind==="host";
 const legSwing=motion.state==="walk"?Math.sin(motion.walkPhase)*18:0;
 const armSwing=motion.state==="walk"?Math.sin(motion.walkPhase)*13:0;
 const sitting=motion.seated;
 return <g transform={`translate(${motion.position.x} ${motion.position.y}) scale(${motion.facing} 1)`}>
  <ellipse cx="0" cy="12" rx="62" ry="10" fill="#101d2b" opacity=".25"/>
  <g transform={`translate(0 ${sitting*42})`}>
   <path d={`M -22 -112 Q -30 -66 ${-22+legSwing} 0`} fill="none" stroke="#243447" strokeWidth="17" strokeLinecap="round"/>
   <path d={`M 22 -112 Q 30 -66 ${22-legSwing} 0`} fill="none" stroke="#243447" strokeWidth="17" strokeLinecap="round"/>
   <path d="M -52 -210 Q -66 -166 -45 -108 Q 0 -90 45 -108 Q 65 -166 52 -210 Z" fill={isHost?"#e0ad57":"#7d98b3"} stroke="#1c2834" strokeWidth="7"/>
   <path d={`M -46 -195 Q -68 -155 ${-55-armSwing} -112`} fill="none" stroke="#283949" strokeWidth="18" strokeLinecap="round"/>
   <path d={motion.reach?"M 45 -194 Q 98 -196 142 -290":`M 46 -195 Q 70 -160 ${54+armSwing} -116`} fill="none" stroke="#283949" strokeWidth="18" strokeLinecap="round"/>
   <ellipse cx="0" cy="-270" rx={isHost?58:54} ry={isHost?64:58} fill="#f3e5c7" stroke="#1c2834" strokeWidth="7"/>
   {isHost?<path d="M -48 -306 Q -28 -351 8 -334 Q 43 -338 50 -298 Q 14 -320 -17 -311 Z" fill="#283949"/>:<path d="M -50 -304 Q 0 -358 52 -304" fill="none" stroke="#263b54" strokeWidth="16" strokeLinecap="round"/>}
   <ellipse cx="-19" cy="-274" rx="13" ry="17" fill="#fff"/><ellipse cx="18" cy="-274" rx="13" ry="17" fill="#fff"/>
   <circle cx="-14" cy="-272" r="5" fill="#202a35"/><circle cx="22" cy="-272" r="5" fill="#202a35"/>
   <path d={isHost?"M -26 -297 Q -15 -302 -5 -296 M 8 -299 Q 22 -307 33 -297":"M -30 -291 L -8 -292 M 10 -292 L 31 -292"} stroke="#243447" strokeWidth="5" fill="none" strokeLinecap="round"/>
   <path d="M -10 -242 Q 0 -239 10 -242" stroke="#243447" strokeWidth="4" fill="none" strokeLinecap="round"/>
  </g>
 </g>;
}
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
    <Actor motion={a} kind="host"/><Actor motion={b} kind="guest"/>
    <rect x="0" y="0" width="1920" height="110" fill="#152331"/>
    <text x="85" y="73" fontSize="42" fill="#f2dca7" fontWeight="700">THE LINCOLN PENNY — MOTION BLOCKING TEST</text>
   </g>
  </svg>
  <div style={{position:"absolute",bottom:35,left:45,color:"#253747",fontSize:25,fontFamily:"sans-serif"}}>Silent motion prototype • not approved character artwork • no audio</div>
 </AbsoluteFill>;
};
