/** Frame-deterministic blocking: explicit action intervals, stable holds and gait distance. */
export type Vec2={x:number;y:number};
export type MotionState="stand"|"walk"|"sit"|"seated"|"reach"|"hold";
export type MotionKey={frame:number;position:Vec2;state:MotionState;facing?:-1|1;target?:Vec2};
export type ActorFrame={position:Vec2;state:MotionState;facing:-1|1;walkPhase:number;seated:number;reach:number;target?:Vec2;travel:number;walkOrigin?:Vec2;walkDistance?:number};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(t:number)=>{const x=clamp(t);return x*x*(3-2*x)};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export function validateScene(keys:readonly MotionKey[],totalFrames:number):void{
 if(!Number.isInteger(totalFrames)||totalFrames<=0)throw Error("Invalid scene duration");
 if(!keys.length||keys[0].frame!==0)throw Error("Motion must start at frame zero");
 for(let i=0;i<keys.length;i++){
  const k=keys[i];
  if(!Number.isInteger(k.frame)||k.frame<0||k.frame>totalFrames||!Number.isFinite(k.position.x)||!Number.isFinite(k.position.y))throw Error("Invalid motion key");
  if(i&&k.frame<=keys[i-1].frame)throw Error("Motion keys must be strictly ordered");
 }
}
export function evaluateMotion(keys:readonly MotionKey[],frame:number):ActorFrame{
 validateScene(keys,Math.max(1,keys[keys.length-1]?.frame??0,Math.ceil(frame)));
 let idx=0;
 while(idx<keys.length-1&&frame>=keys[idx+1].frame)idx++;
 const a=keys[idx],b=keys[Math.min(idx+1,keys.length-1)];
 const dt=b.frame-a.frame;
 const t=dt>0?smooth((frame-a.frame)/dt):0;
 const delta=Math.hypot(b.position.x-a.position.x,b.position.y-a.position.y);
 const moving=idx<keys.length-1&&delta>2&&frame>=a.frame&&frame<b.frame;
 // Travel is measured from the start of the action, not the absolute global frame.
 const travel=moving?delta*t:0;
 const position={x:mix(a.position.x,b.position.x,t),y:mix(a.position.y,b.position.y,t)};
 const state:MotionState=moving?"walk":a.state;
 const facing=a.facing??(moving?(b.position.x>=a.position.x?1:-1):1);
 // A stand action rises from the seated posture; sit action lowers toward it.
 const seated=a.state==="seated"?1:a.state==="sit"?t:a.state==="stand"?1-t:0;
 const reach=a.state==="reach"?1:0;
 return {position,state,facing,walkPhase:travel/38*Math.PI,seated,reach,target:a.target,travel,walkOrigin:moving?a.position:undefined,walkDistance:moving?delta:undefined};
}

/** Clamp a desired hand/foot target to a two-segment limb's reachable radius. */
export function solveTwoBone(hip:Vec2,target:Vec2,upper:number,lower:number,bend:1|-1=1){
 if(upper<=0||lower<=0)throw Error("Bone lengths must be positive");
 const dx=target.x-hip.x,dy=target.y-hip.y,raw=Math.hypot(dx,dy);
 const min=Math.abs(upper-lower)+0.001,max=upper+lower-0.001;
 const d=Math.max(min,Math.min(raw,max));
 const ux=raw>0?dx/raw:0,uy=raw>0?dy/raw:1;
 const along=(upper*upper-lower*lower+d*d)/(2*d);
 const height=Math.sqrt(Math.max(0,upper*upper-along*along));
 return {knee:{x:hip.x+ux*along-bend*uy*height,y:hip.y+uy*along+bend*ux*height},
  foot:{x:hip.x+ux*d,y:hip.y+uy*d},reachable:raw<=max&&raw>=min};
}

/** World-space planted foot: each step holds a fixed anchor through stance,
 * then swings to the next anchor with a smooth vertical arc. No frame history. */
export function gaitFoot(motion:ActorFrame,side:-1|1,stepLength=76,stepHeight=22):Vec2{
 const base=side*28;
 if(motion.state!=="walk"||!motion.walkOrigin)return {x:motion.position.x+base,y:motion.position.y};
 const direction=motion.facing;
 const start=motion.walkOrigin.x;
 // Opposite feet alternate; one step consists of a stationary stance and a swing.
 const distance=Math.max(0,motion.travel);
 const phaseDistance=distance+(side===1?stepLength/2:0);
 const cycle=Math.floor(phaseDistance/stepLength);
 const progress=(phaseDistance-cycle*stepLength)/stepLength;
 const anchor=start+direction*(cycle*stepLength-(side===1?stepLength/2:0));
 const swing=progress<.5?0:smooth((progress-.5)*2);
 const x=anchor+direction*(swing*stepLength)+base;
 const y=motion.position.y-(progress<.5?0:Math.sin((progress-.5)*2*Math.PI)*stepHeight);
 return {x,y};
}
