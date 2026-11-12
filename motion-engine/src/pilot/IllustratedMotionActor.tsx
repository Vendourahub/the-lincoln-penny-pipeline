import React from "react";
import {ActorFrame,Vec2} from "./motion";

/** Temporary illustrated actor for motion mechanics QA. Replace with approved art assets. */
type Kind="host"|"guest";
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const pt=(a:Vec2,b:Vec2)=>`M ${a.x} ${a.y} L ${b.x} ${b.y}`;
/** Two-bone inverse kinematics in screen coordinates; returns knee and reachable foot. */
export function solveTwoBone(hip:Vec2,foot:Vec2,upper:number,lower:number,bend:1|-1=1){
 const dx=foot.x-hip.x,dy=foot.y-hip.y;
 const raw=Math.hypot(dx,dy),d=Math.max(0.001,Math.min(raw,upper+lower-0.001));
 const ux=raw>0?dx/raw:0,uy=raw>0?dy/raw:1;
 const along=(upper*upper-lower*lower+d*d)/(2*d);
 const altitude=Math.sqrt(Math.max(0,upper*upper-along*along));
 const knee={x:hip.x+ux*along-bend*uy*altitude,y:hip.y+uy*along+bend*ux*altitude};
 return {knee,foot:{x:hip.x+ux*d,y:hip.y+uy*d}};
}
const armPath=(shoulder:Vec2,hand:Vec2,bend:number)=>{
 const mid={x:lerp(shoulder.x,hand.x,.55)+bend,y:lerp(shoulder.y,hand.y,.55)+12};
 return `M ${shoulder.x} ${shoulder.y} Q ${mid.x} ${mid.y} ${hand.x} ${hand.y}`;
};
export function IllustratedMotionActor({motion,kind}:{motion:ActorFrame;kind:Kind}){
 const host=kind==="host",sit=clamp(motion.seated),walking=motion.state==="walk";
 const cycle=motion.walkPhase;
 // World-space feet are deliberately anchored to the floor during planted stance.
 const foot=(side:-1|1):Vec2=>{
  if(sit>.01)return {x:side*49,y:0};
  if(!walking)return {x:side*28,y:0};
  const phase=cycle+(side===1?Math.PI:0);
  const swing=Math.sin(phase);
  return {x:side*28+Math.cos(phase)*29,y:-Math.max(0,swing)*23};
 };
 const hipY=lerp(-116,-72,sit);
 const leftHip={x:-22,y:hipY},rightHip={x:22,y:hipY};
 const left=solveTwoBone(leftHip,foot(-1),75,76,-1);
 const right=solveTwoBone(rightHip,foot(1),75,76,1);
 const shoulderY=lerp(-199,-156,sit);
 const rightHand=motion.reach&&motion.target
   ?{x:(motion.target.x-motion.position.x)*motion.facing,y:motion.target.y-motion.position.y}
   :{x:60+(walking?Math.sin(cycle)*12:0),y:shoulderY+91};
 const leftHand={x:-62-(walking?Math.sin(cycle)*12:0),y:shoulderY+92};
 const torsoColor=host?"#d7a151":"#7597ae";
 return <g transform={`translate(${motion.position.x} ${motion.position.y}) scale(${motion.facing} 1)`}>
  <ellipse cx="0" cy="8" rx="65" ry="10" fill="#172433" opacity=".19"/>
  <g fill="none" stroke="#293a4b" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round">
   <path d={pt(leftHip,left.knee)+` L ${left.foot.x} ${left.foot.y}`}/>
   <path d={pt(rightHip,right.knee)+` L ${right.foot.x} ${right.foot.y}`}/>
  </g>
  <g fill="#263748">
   <ellipse cx={left.foot.x-9} cy={left.foot.y+2} rx="23" ry="8"/>
   <ellipse cx={right.foot.x+9} cy={right.foot.y+2} rx="23" ry="8"/>
  </g>
  <path d={`M -48 ${shoulderY} Q -61 ${shoulderY+60} -43 ${hipY+5} Q 0 ${hipY+21} 43 ${hipY+5} Q 61 ${shoulderY+60} 48 ${shoulderY} Z`} fill={torsoColor} stroke="#253646" strokeWidth="7"/>
  <g stroke="#293a4b" strokeWidth="17" strokeLinecap="round" fill="none">
   <path d={armPath({x:-43,y:shoulderY+16},leftHand,-13)}/>
   <path d={armPath({x:43,y:shoulderY+16},rightHand,13)}/>
  </g>
  <circle cx={leftHand.x} cy={leftHand.y} r="11" fill="#f0dfc4" stroke="#293a4b" strokeWidth="4"/>
  <circle cx={rightHand.x} cy={rightHand.y} r="11" fill="#f0dfc4" stroke="#293a4b" strokeWidth="4"/>
  <g transform={`translate(0 ${shoulderY+199})`}>
   <ellipse cx="0" cy="-269" rx={host?58:53} ry={host?63:57} fill="#f0dfc4" stroke="#253646" strokeWidth="7"/>
   {host?<path d="M -47 -305 Q -25 -352 10 -333 Q 42 -338 49 -299 Q 8 -318 -15 -309 Z" fill="#283949"/>:<path d="M -49 -304 Q 0 -353 49 -304" stroke="#283949" strokeWidth="14" fill="none" strokeLinecap="round"/>}
   <ellipse cx="-19" cy="-275" rx="13" ry="16" fill="white"/><ellipse cx="19" cy="-275" rx="13" ry="16" fill="white"/>
   <circle cx="-14" cy="-273" r="5" fill="#253646"/><circle cx="24" cy="-273" r="5" fill="#253646"/>
   <path d={host?"M -30 -299 L -7 -296 M 8 -297 L 32 -299":"M -30 -292 L -8 -292 M 10 -292 L 31 -292"} stroke="#253646" strokeWidth="5" fill="none" strokeLinecap="round"/>
   <path d="M -12 -241 Q 0 -236 12 -241" stroke="#253646" strokeWidth="4" fill="none" strokeLinecap="round"/>
  </g>
 </g>;
}
